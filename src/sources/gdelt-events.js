'use strict';
// GDELT 2.0 Events — exportul brut publicat la fiecare 15 minute (gratuit, fără cheie).
//   http://data.gdeltproject.org/gdeltv2/lastupdate.txt → prima linie: „<mărime> <md5> <url>.export.CSV.zip”
// Fiecare rând (61 de coloane, separate prin TAB) e un eveniment codificat CAMEO, cu locul acțiunii
// geocodat (ActionGeo_Lat/Long). Păstrăm doar conflictele (EventRootCode 18/19/20) și le grupăm
// pe loc + tip, ca să nu avem sute de puncte identice pentru aceeași știre.

const zlib = require('zlib');
const { countryByName, geolocate } = require('../lib/geo');

const COL = {
  id: 0, isRoot: 25, code: 26, baseCode: 27, rootCode: 28, quad: 29, goldstein: 30,
  mentions: 31, numSources: 32, articles: 33,
  geoType: 51, geoName: 52, geoCountry: 53, lat: 56, lon: 57, featureId: 58, dateAdded: 59, url: 60,
};

// CAMEO labels (root codes 18x, 19x, 20x), in English (user-facing — becomes part of the event title).
const CAMEO = {
  18: 'Attack / violence', 180: 'Unconventional violence', 181: 'Abduction / hostage-taking',
  182: 'Physical assault', 183: 'Bombing', 184: 'Use of human shields',
  185: 'Attempted assassination', 186: 'Assassination',
  19: 'Armed fighting', 190: 'Use of military force', 191: 'Blockade', 192: 'Occupation of territory',
  193: 'Small-arms fighting', 194: 'Artillery and tank fighting', 195: 'Aerial / drone strike',
  196: 'Ceasefire violation',
  20: 'Mass violence', 200: 'Unconventional mass violence', 201: 'Mass expulsion',
  202: 'Mass killings', 203: 'Ethnic cleansing', 204: 'Weapons of mass destruction',
};

// Best-effort mapping from a CAMEO base/root code to our conflictType taxonomy (src/lib/classify.js).
// Heuristic, not ground truth — same spirit as the keyword classifier.
const CAMEO_CONFLICT_TYPE = {
  180: 'terrorism', 181: 'terrorism', 182: 'coup_unrest', 183: 'terrorism', 184: 'terrorism',
  185: 'terrorism', 186: 'terrorism',
  190: 'interstate_war', 191: 'border_dispute', 192: 'occupation', 193: 'civil_war',
  194: 'interstate_war', 195: 'interstate_war', 196: 'ceasefire_diplomacy',
  200: 'ethnic_religious', 201: 'ethnic_religious', 202: 'ethnic_religious', 203: 'ethnic_religious',
  204: 'interstate_war',
};

const CONFLICT_ROOTS = new Set(['18', '19', '20']);

// --- dezarhivare ZIP cu un singur fișier (fără dependențe) ---------------
function unzipFirst(buf) {
  // Găsește End Of Central Directory (semnătura 0x06054b50), scanând de la final.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP invalid: lipsește EOCD');
  const cd = buf.readUInt32LE(eocd + 16);
  if (buf.readUInt32LE(cd) !== 0x02014b50) throw new Error('ZIP invalid: director central');
  const method = buf.readUInt16LE(cd + 10);
  const compSize = buf.readUInt32LE(cd + 20);
  const localOff = buf.readUInt32LE(cd + 42);
  if (buf.readUInt32LE(localOff) !== 0x04034b50) throw new Error('ZIP invalid: antet local');
  const start = localOff + 30 + buf.readUInt16LE(localOff + 26) + buf.readUInt16LE(localOff + 28);
  const data = buf.subarray(start, start + compSize);
  if (method === 0) return data;
  if (method === 8) return zlib.inflateRawSync(data);
  throw new Error(`ZIP: metodă de compresie nesuportată (${method})`);
}

/** Fetcher în doi pași: lastupdate.txt → arhiva de export. Sare peste dacă arhiva e aceeași ca data trecută. */
async function fetchLatestExport(source, { fetchText, fetchBuffer }, state) {
  const txt = await fetchText(source.url);
  const line = txt.split('\n').find((l) => /\.export\.CSV\.zip\s*$/i.test(l.trim()));
  if (!line) throw new Error('lastupdate.txt fără linie .export.CSV.zip');
  const zipUrl = line.trim().split(/\s+/).pop();
  if (state.lastZip === zipUrl) return '';
  state.lastZip = zipUrl;
  return fetchBuffer(zipUrl);
}

function gdeltStamp(s) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s || '');
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

/** Transformă slug-ul URL-ului într-un titlu aproximativ („russian-strike-kills-3” → „Russian strike kills 3”). */
function titleFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const slug = parts
      .map((p) => p.replace(/\.(s?html?|php|aspx?)$/i, ''))
      .filter((p) => /[a-z].*-.*[a-z]/i.test(p) && !/^\d+$/.test(p))
      .sort((a, b) => b.length - a.length)[0];
    if (!slug) return '';
    const words = slug.replace(/[-_]+/g, ' ').replace(/\b[0-9a-f]{8,}\b/gi, '').replace(/\s+/g, ' ').trim();
    return words ? words[0].toUpperCase() + words.slice(1) : '';
  } catch {
    return '';
  }
}

/**
 * @param {Buffer|string} input  arhiva ZIP (live) sau CSV text (fixtures)
 * @param {object} source        opțiuni: minArticles (implicit 2), maxEvents (implicit 1500)
 */
function gdeltEvents(input, source = {}) {
  if (!input || !input.length) return [];
  const csv = Buffer.isBuffer(input)
    ? (input[0] === 0x50 && input[1] === 0x4b ? unzipFirst(input) : input).toString('utf8')
    : String(input);
  const minArticles = source.minArticles || 2;
  const groups = new Map();

  for (const line of csv.split('\n')) {
    if (!line) continue;
    const c = line.split('\t');
    if (c.length < 61) continue;
    if (!CONFLICT_ROOTS.has(c[COL.rootCode])) continue;
    if (c[COL.isRoot] !== '1') continue;
    const lat = parseFloat(c[COL.lat]);
    const lon = parseFloat(c[COL.lon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (c[COL.geoType] === '1') continue; // doar la nivel de țară → prea imprecis pentru hartă
    const articles = parseInt(c[COL.articles], 10) || 0;

    const key = `${c[COL.featureId] || `${lat.toFixed(2)},${lon.toFixed(2)}`}|${c[COL.baseCode]}`;
    let g = groups.get(key);
    if (!g) {
      g = { lat, lon, place: c[COL.geoName], base: c[COL.baseCode], root: c[COL.rootCode], articles: 0, sources: 0, urls: [], latest: null };
      groups.set(key, g);
    }
    g.articles += articles;
    g.sources += parseInt(c[COL.numSources], 10) || 0;
    const url = c[COL.url].trim();
    if (url && !g.urls.includes(url) && g.urls.length < 5) g.urls.push(url);
    const when = gdeltStamp(c[COL.dateAdded]);
    if (when && (!g.latest || when > g.latest)) g.latest = when;
  }

  const out = [];
  for (const g of groups.values()) {
    if (g.articles < minArticles) continue;
    const label = CAMEO[g.base] || CAMEO[g.root] || 'Conflict';
    const conflictType = CAMEO_CONFLICT_TYPE[g.base] || CAMEO_CONFLICT_TYPE[g.root] || 'other';
    // Gazetteer-ul nostru întâi (GDELT pune Gaza/Cisjordania sub „Israel”), apoi ultimul segment din nume.
    const fromPlace = geolocate(g.place.split(',')[0]);
    const byName = countryByName((g.place.split(',').pop() || '').trim());
    const country = fromPlace && fromPlace.country ? { iso: fromPlace.country } : byName;
    const headline = g.urls.map(titleFromUrl).find(Boolean);
    const severity = g.root === '20' || g.articles >= 20 ? 3 : 2;
    out.push({
      title: `${label} – ${g.place}`,
      url: g.urls[0],
      summary: [
        `${g.articles} article${g.articles === 1 ? '' : 's'}${g.sources ? ` from ${g.sources} source${g.sources === 1 ? '' : 's'}` : ''}`,
        headline ? `e.g. "${headline}"` : null,
      ].filter(Boolean).join(' · '),
      publishedAt: g.latest,
      lat: g.lat,
      lon: g.lon,
      country: country ? country.iso : undefined,
      place: g.place,
      precision: 'exact',
      category: 'conflict',
      conflictType,
      severity,
      extra: { cameo: g.base, articles: g.articles, urls: g.urls },
    });
  }
  out.sort((a, b) => b.extra.articles - a.extra.articles);
  return out.slice(0, source.maxEvents || 1500);
}

module.exports = { gdeltEvents, fetchLatestExport, unzipFirst, titleFromUrl, CAMEO, CAMEO_CONFLICT_TYPE };
