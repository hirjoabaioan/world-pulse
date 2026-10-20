'use strict';
// Adaptoare: transformă răspunsul brut al fiecărui tip de sursă în obiecte „raw”
// { title, url, summary, publishedAt, lat?, lon?, country?, place?, precision?, severity?, category?, lang?, extra? }
// care apoi trec prin makeEvent() (clasificare, geolocalizare, schema comună).

const { parseFeed } = require('../lib/rss');
const { countryByName } = require('../lib/geo');

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // GDELT întoarce uneori text simplu cu mesaj de eroare/limită de rată
    throw new Error(`Răspuns non-JSON: ${String(text).slice(0, 160)}`);
  }
}

// --- RSS / Atom generic ---------------------------------------------------
function rss(text, source) {
  return parseFeed(text, { extraTags: source.extraTags }).map((it) => ({
    title: it.title,
    url: it.url,
    summary: it.summary,
    publishedAt: it.publishedAt,
    lat: it.geo ? it.geo.lat : undefined,
    lon: it.geo ? it.geo.lon : undefined,
    precision: it.geo ? 'exact' : undefined,
    extra: Object.keys(it.extra || {}).length ? it.extra : undefined,
  }));
}

// --- GDACS (RSS cu GeoRSS + nivel de alertă) ------------------------------
const GDACS_LEVEL = { green: 1, orange: 2, red: 3 };
function gdacs(text, source) {
  return rss(text, { ...source, extraTags: ['gdacs:alertlevel', 'gdacs:country', 'gdacs:eventtype'] }).map((r) => {
    const level = String((r.extra && r.extra['gdacs:alertlevel']) || '').toLowerCase();
    const c = countryByName(r.extra && r.extra['gdacs:country']);
    return {
      ...r,
      country: c ? c.iso : undefined,
      category: 'disaster',
      severity: GDACS_LEVEL[level] !== undefined ? GDACS_LEVEL[level] : 1,
      place: (r.extra && r.extra['gdacs:country']) || undefined,
    };
  });
}

// --- GDELT DOC 2.0 API (mode=ArtList, format=json) ------------------------
// seendate: „20260927T121500Z”
function gdeltDate(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s || '');
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}
const GDELT_LANG = {
  English: 'en', Romanian: 'ro', French: 'fr', Spanish: 'es', German: 'de', Arabic: 'ar', Russian: 'ru',
  Ukrainian: 'uk', Chinese: 'zh', Portuguese: 'pt', Italian: 'it', Turkish: 'tr', Hebrew: 'he', Persian: 'fa',
};
function gdeltDoc(text) {
  if (!String(text).trim()) return [];
  const data = safeJson(text);
  return (data.articles || []).map((a) => {
    const pub = countryByName(a.sourcecountry);
    return {
      title: a.title,
      url: a.url,
      summary: '',
      publishedAt: gdeltDate(a.seendate),
      lang: GDELT_LANG[a.language] || (a.language ? String(a.language).toLowerCase().slice(0, 2) : null),
      extra: { domain: a.domain, sourceCountry: pub ? pub.iso : a.sourcecountry || null, image: a.socialimage || null },
    };
  });
}

// --- USGS cutremure (GeoJSON) ---------------------------------------------
function usgs(text) {
  const data = safeJson(text);
  return (data.features || []).map((f) => {
    const p = f.properties || {};
    const [lon, lat, depth] = (f.geometry && f.geometry.coordinates) || [];
    const mag = Number(p.mag);
    const severity = mag >= 7 ? 3 : mag >= 6 ? 2 : mag >= 5 ? 1 : 0;
    return {
      title: p.title || `M ${mag} – ${p.place || 'locație necunoscută'}`,
      url: p.url,
      summary: [
        p.place,
        Number.isFinite(depth) ? `adâncime ${Math.round(depth)} km` : null,
        p.tsunami ? 'avertizare tsunami emisă' : null,
      ].filter(Boolean).join(' · '),
      publishedAt: Number.isFinite(p.time) ? new Date(p.time).toISOString() : null,
      lat,
      lon,
      precision: 'exact',
      place: p.place || null,
      category: 'disaster',
      severity,
      extra: { magnitude: mag, depthKm: depth, tsunami: !!p.tsunami, alert: p.alert || null },
    };
  });
}

// --- NASA EONET v3 --------------------------------------------------------
function firstPoint(coords) {
  let c = coords;
  while (Array.isArray(c) && Array.isArray(c[0])) c = c[0];
  return Array.isArray(c) && c.length >= 2 ? c : null;
}
function eonet(text) {
  const data = safeJson(text);
  const out = [];
  for (const e of data.events || []) {
    const geoms = e.geometry || e.geometries || [];
    const last = geoms[geoms.length - 1];
    const pt = last ? firstPoint(last.coordinates) : null;
    const cats = (e.categories || []).map((c) => c.title).filter(Boolean);
    out.push({
      title: e.title,
      url: (e.sources && e.sources[0] && e.sources[0].url) || e.link,
      summary: cats.length ? `Categorie: ${cats.join(', ')}` : '',
      publishedAt: last && last.date,
      lat: pt ? pt[1] : undefined,
      lon: pt ? pt[0] : undefined,
      precision: pt ? 'exact' : undefined,
      category: 'disaster',
      severity: 1,
      extra: { eonetId: e.id, categories: cats },
    });
  }
  return out;
}

module.exports = { rss, gdacs, gdeltDoc, usgs, eonet, gdeltDate };
