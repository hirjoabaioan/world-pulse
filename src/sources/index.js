'use strict';
// Catalogul surselor. Fiecare sursă: { id, name, layer, type, url, intervalMin, enabled, fixture?, lang? }
//   layer: 'conflict' | 'news' | 'official' | 'disaster'
//   type:  'rss' | 'gdacs' | 'gdelt-doc' | 'usgs' | 'eonet'
// Suprascrieri locale (fără a modifica acest fișier): sources.local.json în rădăcina proiectului,
// ex. [{ "id": "nyt-world", "enabled": false }, { "id": "digi24", "name": "Digi24", "layer": "news",
//        "type": "rss", "url": "https://…", "lang": "ro" }]

const fs = require('fs');
const path = require('path');

const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const gdeltUrl = (query, { max = 250, timespan = '24h' } = {}) =>
  `${GDELT}?${new URLSearchParams({
    query,
    mode: 'ArtList',
    format: 'json',
    maxrecords: String(max),
    timespan,
    sort: 'DateDesc',
  })}`;

const DEFAULT_SOURCES = [
  // ---------------------------------------------------------------- Conflicte
  {
    id: 'gdelt-conflict',
    name: 'GDELT – conflict events',
    layer: 'conflict',
    type: 'gdelt-doc',
    url: gdeltUrl(
      '(airstrike OR shelling OR "armed clashes" OR militants OR insurgents OR "drone attack" OR "missile strike" OR ceasefire OR "killed in attack")'
    ),
    intervalMin: 15,
    group: 'gdelt',
    fixture: 'gdelt-conflict.json',
  },
  {
    id: 'gdelt-conflict-multilang',
    name: 'GDELT – conflicts (FR/ES/AR/RU/UK)',
    layer: 'conflict',
    type: 'gdelt-doc',
    url: gdeltUrl(
      '(sourcelang:french OR sourcelang:spanish OR sourcelang:arabic OR sourcelang:russian OR sourcelang:ukrainian) (attack OR frappe OR ataque OR bombardement OR bombardeo)',
      { max: 150 }
    ),
    intervalMin: 30,
    group: 'gdelt',
    enabled: false, // experimental: de verificat sintaxa OR pe sourcelang în GDELT
  },

  {
    id: 'gdelt-events',
    name: 'GDELT Events – geolocated conflicts',
    layer: 'conflict',
    type: 'gdelt-events',
    url: 'http://data.gdeltproject.org/gdeltv2/lastupdate.txt',
    intervalMin: 15,
    geocode: false,
    minArticles: 2,
    fixture: 'gdelt-events.tsv',
  },

  // -------------------------------------------------------------------- Știri
  { id: 'bbc-world', name: 'BBC World', layer: 'news', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', intervalMin: 10, lang: 'en', fixture: 'bbc-world.xml' },
  { id: 'aljazeera', name: 'Al Jazeera', layer: 'news', type: 'rss', url: 'https://www.aljazeera.com/xml/rss/all.xml', intervalMin: 10, lang: 'en', fixture: 'aljazeera.xml' },
  { id: 'guardian-world', name: 'The Guardian – World', layer: 'news', type: 'rss', url: 'https://www.theguardian.com/world/rss', intervalMin: 10, lang: 'en' },
  { id: 'dw-world', name: 'Deutsche Welle', layer: 'news', type: 'rss', url: 'https://rss.dw.com/rdf/rss-en-world', intervalMin: 15, lang: 'en' },
  { id: 'france24', name: 'France 24', layer: 'news', type: 'rss', url: 'https://www.france24.com/en/rss', intervalMin: 15, lang: 'en' },
  { id: 'npr-world', name: 'NPR World', layer: 'news', type: 'rss', url: 'https://feeds.npr.org/1004/rss.xml', intervalMin: 15, lang: 'en' },
  { id: 'nyt-world', name: 'New York Times – World', layer: 'news', type: 'rss', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', intervalMin: 15, lang: 'en' },
  { id: 'g4media', name: 'G4Media', layer: 'news', type: 'rss', url: 'https://www.g4media.ro/feed', intervalMin: 15, lang: 'ro' },
  {
    id: 'gdelt-news',
    name: 'GDELT – global news',
    layer: 'news',
    type: 'gdelt-doc',
    url: gdeltUrl('(government OR president OR parliament OR election OR court OR protest OR economy)', { max: 250 }),
    intervalMin: 20,
    group: 'gdelt',
    fixture: 'gdelt-news.json',
  },

  // ----------------------------------------------------- Dedicated conflict monitors
  // Confirmed reachable (fetch tested 2026-09-29); real-time granularity varies (these are analysis/
  // monitoring outlets, not wire services, so intervalMin is longer than the news feeds above).
  { id: 'crisisgroup-global', name: 'International Crisis Group – global feed', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-africa', name: 'International Crisis Group – Africa', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/1', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-asia', name: 'International Crisis Group – Asia-Pacific', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/30', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-europe', name: 'International Crisis Group – Europe & Central Asia', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/56', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-latam', name: 'International Crisis Group – Latin America & Caribbean', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/73', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-mena', name: 'International Crisis Group – Middle East & North Africa', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/81', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'crisisgroup-us', name: 'International Crisis Group – United States', layer: 'conflict', type: 'rss', url: 'https://www.crisisgroup.org/rss/4697', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'sudan-war-monitor', name: 'Sudan War Monitor', layer: 'conflict', type: 'rss', url: 'https://sudanwarmonitor.com/feed', intervalMin: 30, lang: 'en', country: 'SD', verified: true },
  { id: 'bellingcat', name: 'Bellingcat (OSINT investigations)', layer: 'conflict', type: 'rss', url: 'https://www.bellingcat.com/feed/', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'twz', name: 'The War Zone', layer: 'conflict', type: 'rss', url: 'https://www.twz.com/feed', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'warontherocks', name: 'War on the Rocks', layer: 'conflict', type: 'rss', url: 'https://warontherocks.com/feed/', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  { id: 'thewarhorse', name: 'The War Horse', layer: 'conflict', type: 'rss', url: 'https://thewarhorse.org/feed/', intervalMin: 30, lang: 'en', scope: 'world', verified: true },
  // Cloudflare-blocked from this server as of 2026-09-29 (403/challenge) — left out rather than added
  // pre-broken: Institute for the Study of War (understandingwar.org), FDD's Long War Journal.

  // -------------------------------------------------------- Anunțuri oficiale
  { id: 'un-news', name: 'UN News', layer: 'official', type: 'rss', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', intervalMin: 20, lang: 'en', fixture: 'un-news.xml' },
  { id: 'who-news', name: 'WHO – press releases', layer: 'official', type: 'rss', url: 'https://www.who.int/rss-feeds/news-english.xml', intervalMin: 30, lang: 'en', fixture: 'who-news.xml' },
  { id: 'reliefweb', name: 'ReliefWeb (OCHA) – updates', layer: 'official', type: 'rss', url: 'https://reliefweb.int/updates/rss.xml', intervalMin: 20, lang: 'en' },

  // ----------------------------------------------------------------- Dezastre
  { id: 'usgs-quakes', name: 'USGS – earthquakes M4.5+', layer: 'disaster', type: 'usgs', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', intervalMin: 5, geocode: false, fixture: 'usgs.geojson' },
  { id: 'gdacs', name: 'GDACS – disaster alerts', layer: 'disaster', type: 'gdacs', url: 'https://www.gdacs.org/xml/rss.xml', intervalMin: 15, fixture: 'gdacs.xml' },
  { id: 'eonet', name: 'NASA EONET – natural events', layer: 'disaster', type: 'eonet', url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=5&limit=300', intervalMin: 30, geocode: false, fixture: 'eonet.json' },
];

// Surse regionale, adăugate etapizat (continent → țară). Fiecare fișier exportă o listă de surse
// cu câmpul `country` (ISO2) al publicației.
const REGION_FILES = ['europe', 'americas', 'africa', 'asia', 'oceania', 'middle-east'];

function regionalSources() {
  const out = [];
  for (const f of REGION_FILES) {
    const file = path.join(__dirname, `${f}.js`);
    if (!fs.existsSync(file)) continue;
    for (const s of require(file)) out.push({ region: f, ...s });
  }
  return out;
}

// GDELT DOC API pe țara publicației (`sourcecountry:`): acoperă presa din fiecare țară monitorizată
// de GDELT, fără să știm feed-urile individuale. O cerere la 6 s → ~200 de țări într-un ciclu de ~20 min.
// Regiuni active: variabila de mediu GDELT_REGIONS (ex. „europe,africa”), implicit toate.
function gdeltCountrySources() {
  const regions = require('../data/regions');
  const { countryInfo } = require('../lib/geo');
  const wanted = (process.env.GDELT_REGIONS || Object.keys(regions).join(','))
    .split(',').map((r) => r.trim()).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const region of wanted) {
    for (const iso of regions[region] || []) {
      const c = countryInfo(iso);
      if (!c || seen.has(iso)) continue;
      seen.add(iso);
      // GDELT folosește numele țării fără spații (ex. „unitedkingdom”); de verificat pentru nume rare.
      const gname = c.name.toLowerCase().replace(/[^a-z]/g, '');
      out.push({
        id: `gdelt-${iso.toLowerCase()}`,
        name: `GDELT – press coverage of ${c.name}`,
        layer: 'news',
        type: 'gdelt-doc',
        url: gdeltUrl(`sourcecountry:${gname}`, { max: 75, timespan: '6h' }),
        intervalMin: 60,
        group: 'gdelt',
        country: iso,
        region,
      });
    }
  }
  return out;
}

function loadSources(root = path.join(__dirname, '..', '..')) {
  const seen = new Set();
  const list = [...DEFAULT_SOURCES, ...regionalSources(), ...gdeltCountrySources()]
    .filter((s) => (seen.has(s.id) ? false : seen.add(s.id)))
    .map((s) => ({ enabled: true, geocode: true, intervalMin: 15, ...s }));
  const localPath = [process.env.DATA_DIR, root]
    .filter(Boolean)
    .map((d) => path.join(d, 'sources.local.json'))
    .find((f) => fs.existsSync(f));
  if (localPath) {
    const overrides = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    for (const o of overrides) {
      const i = list.findIndex((s) => s.id === o.id);
      if (i >= 0) list[i] = { ...list[i], ...o };
      else list.push({ enabled: true, intervalMin: 15, type: 'rss', ...o });
    }
  }
  return list;
}

module.exports = { loadSources, DEFAULT_SOURCES, gdeltUrl };
