'use strict';
// Geolocalizare din text: găsește cel mai probabil loc al evenimentului într-un titlu/rezumat.
// Prioritate: loc concret (oraș/regiune) > nume de țară > demonim („Russian”, „Israeli”).
// La prioritate egală câștigă prima apariție în text. Titlul are întâietate față de rezumat.

const { COUNTRIES, PLACES } = require('../data/places');
const GEONAMES_PLACES = require('../data/geonames');

const RANK = { place: 3, country: 2, demonym: 1 };

const titleCase = (s) => s.replace(/(^|\s)(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

const byIso = new Map();
const terms = []; // { term, kind, lat, lon, country, name }

function addTerms(list, base) {
  for (const raw of list) {
    const term = raw.trim();
    if (term) terms.push({ ...base, term });
  }
}

const countryTerms = new Set();
for (const [iso, name, lat, lon, aliases, demonyms] of COUNTRIES) {
  byIso.set(iso, { iso, name, lat, lon });
  const base = { lat, lon, country: iso, name };
  const countryNames = [name, ...aliases.split('|')].filter(Boolean);
  for (const n of countryNames) countryTerms.add(n.toLowerCase());
  addTerms(countryNames, { ...base, kind: 'country' });
  addTerms(demonyms.split('|'), { ...base, kind: 'demonym' });
}
// A bare country name always means the country, never a same-named place elsewhere (e.g. "Venezuela"
// is also a small town in Cuba, "Jordan" a district of Hong Kong, "Mexico" a town in the Philippines —
// all population >= 15000, all in GeoNames). Without this filter, 'place' outranking 'country' (see
// RANK below — normally correct: "Gaza" should win over "Israel") would make bare country mentions
// resolve to some obscure same-named city instead. Drop just the colliding alias, not the whole place
// (its other, non-colliding names/coordinates stay usable).
function dropCountryCollisions(names) {
  return names.filter((n) => !countryTerms.has(n.toLowerCase()));
}
// PLACES (hand-picked, e.g. small conflict-zone towns) loads first so it wins ties over
// GEONAMES_PLACES (bulk, population-based) when the exact same term string appears in both —
// see the tie-break in the lookup-building loop below (first entry for a key wins).
for (const [names, lat, lon, iso, population] of PLACES) {
  const list = dropCountryCollisions(names.split('|'));
  if (list.length) addTerms(list, { kind: 'place', lat, lon, country: iso || null, name: titleCase(list[0]), population: population || 0, curated: true });
}
for (const [names, lat, lon, iso, population] of GEONAMES_PLACES) {
  const list = dropCountryCollisions(names.split('|'));
  if (list.length) addTerms(list, { kind: 'place', lat, lon, country: iso || null, name: titleCase(list[0]), population: population || 0, curated: false });
}

// Acronimele scurte (UK, USA, SUA, DRC, IDF…) se potrivesc doar scrise cu majuscule,
// ca să nu prindă cuvinte comune din alte limbi (ex. „sua” în portugheză).
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAcronym = (t) => t.replace(/\./g, '').length <= 3;

function buildRegex(list, flags) {
  if (!list.length) return null;
  const alts = [...new Set(list.map((t) => t.term))]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(${alts})(?![\\p{L}\\p{N}])`, flags);
}

const lookupCI = new Map();
const lookupCS = new Map();
for (const t of terms) {
  const acr = isAcronym(t.term);
  const map = acr ? lookupCS : lookupCI;
  const key = acr ? t.term.toUpperCase() : t.term.toLowerCase();
  const prev = map.get(key);
  if (!prev || RANK[t.kind] > RANK[prev.kind]) map.set(key, t);
}
const reCI = buildRegex([...lookupCI.values()], 'giu');
const reCS = buildRegex(
  [...lookupCS.values()].map((t) => ({ term: t.term.toUpperCase() })),
  'gu'
);

function scan(text) {
  const hits = [];
  if (!text) return hits;
  for (const [re, map, norm] of [
    [reCI, lookupCI, (s) => s.toLowerCase()],
    [reCS, lookupCS, (s) => s],
  ]) {
    if (!re) continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const t = map.get(norm(m[1]));
      if (t) hits.push({ ...t, index: m.index, match: m[1] });
    }
  }
  return hits;
}

function best(hits) {
  let top = null;
  for (const h of hits) {
    if (!top) { top = h; continue; }
    if (RANK[h.kind] !== RANK[top.kind]) {
      if (RANK[h.kind] > RANK[top.kind]) top = h;
      continue;
    }
    // Equal rank: two DIFFERENT real places mentioned in the same text (e.g. "central Paris" could
    // spuriously match the small US town "Central" before the hand-picked "Paris" entry, or two
    // GeoNames-only places could collide by name). Priority: hand-picked places.js entries (someone
    // deliberately judged them relevant) beat bulk GeoNames entries outright; between two entries of
    // the same origin, higher population wins when both have real population data (GeoNames only —
    // places.js entries default to 0); otherwise fall back to earliest text position, same as before
    // this taxonomy existed.
    if (h.curated !== top.curated) { if (h.curated) top = h; continue; }
    if (h.population && top.population && h.population !== top.population) {
      if (h.population > top.population) top = h;
      continue;
    }
    if (h.index < top.index) top = h;
  }
  return top;
}

/**
 * Returnează { lat, lon, country, place, precision } sau null.
 * precision: 'city' (loc concret) | 'country' (țară/demonim).
 */
function geolocate(title, summary) {
  const hit = best(scan(title)) || best(scan(summary));
  if (!hit) return null;
  return {
    lat: hit.lat,
    lon: hit.lon,
    country: hit.country,
    place: hit.name,
    precision: hit.kind === 'place' ? 'city' : 'country',
  };
}

/** Toate țările menționate (ISO2), utile pentru filtrare. */
function mentionedCountries(text) {
  const set = new Set();
  for (const h of scan(text)) if (h.country) set.add(h.country);
  return [...set];
}

function countryInfo(iso) {
  return byIso.get(iso) || null;
}

/** Caută țara după nume (ex. GDELT „sourcecountry”: „United States”). */
function countryByName(name) {
  if (!name) return null;
  const t = lookupCI.get(String(name).toLowerCase());
  return t && t.kind !== 'place' ? byIso.get(t.country) : null;
}

module.exports = { geolocate, mentionedCountries, countryInfo, countryByName };
