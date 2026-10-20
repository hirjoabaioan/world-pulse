'use strict';
// Normalizare într-o schemă comună de eveniment + utilitare de deduplicare.

const crypto = require('crypto');
const { classify, classifyConflictType, classifyNewsTopic } = require('./classify');
const { geolocate, countryInfo } = require('./geo');

const LAYERS = ['conflict', 'news', 'official', 'disaster'];

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|at_|cmpid$|ocid$|ref$|src$)/i;

function canonicalUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    for (const k of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(k)) u.searchParams.delete(k);
    u.protocol = 'https:';
    let s = u.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return String(url).trim();
  }
}

function titleKey(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);

/**
 * Construiește un eveniment normalizat.
 * @param {object} raw  { title, url, summary, publishedAt, lat, lon, country, place, precision, severity, category, lang, extra }
 * @param {object} source definiția sursei (id, name, layer, ...)
 */
function makeEvent(raw, source, now = new Date()) {
  const title = (raw.title || '').trim();
  const summary = (raw.summary || '').trim();
  const url = canonicalUrl(raw.url);

  const cls = classify(title, summary);
  const category = raw.category || (source.category && cls.category === 'general' ? source.category : cls.category);
  const severity = Number.isFinite(raw.severity) ? raw.severity : cls.severity;
  const conflictType = category === 'conflict' ? (raw.conflictType || classifyConflictType(title, summary)) : null;
  const newsTopic = ['general', 'politics', 'economy'].includes(category)
    ? (raw.newsTopic || classifyNewsTopic(title, summary, category))
    : null;

  let geo = null;
  if (Number.isFinite(raw.lat) && Number.isFinite(raw.lon)) {
    // Coordonate exacte de la sursă; țara (dacă lipsește) o deducem din text, doar pentru filtrare.
    const fromText = raw.country ? null : geolocate(title, summary);
    geo = {
      lat: raw.lat,
      lon: raw.lon,
      country: raw.country || (fromText && fromText.country) || null,
      place: raw.place || null,
      precision: raw.precision || 'exact',
    };
  } else if (source.geocode !== false) {
    geo = geolocate(title, summary);
    // Publicație națională fără loc explicit în titlu: presupunem țara publicației (aproximativ).
    if (!geo && source.country && source.layer === 'news' && source.scope !== 'world') {
      const c = countryInfo(source.country);
      if (c) geo = { lat: c.lat, lon: c.lon, country: c.iso, place: c.name, precision: 'country' };
    }
  }

  const layers = new Set([source.layer]);
  // Știrile/anunțurile despre conflicte apar și în stratul „Conflicte”.
  if (category === 'conflict' && source.layer !== 'disaster') layers.add('conflict');
  if (category === 'disaster' && source.layer === 'news') layers.add('disaster');

  const publishedAt = raw.publishedAt && !Number.isNaN(Date.parse(raw.publishedAt))
    ? new Date(raw.publishedAt).toISOString()
    : now.toISOString();

  return {
    id: hash(url || `${source.id}|${title}`),
    title,
    summary,
    url,
    layers: LAYERS.filter((l) => layers.has(l)),
    category,
    conflictType,
    newsTopic,
    severity,
    lat: geo ? geo.lat : null,
    lon: geo ? geo.lon : null,
    country: geo ? geo.country : raw.country || null,
    place: geo ? geo.place : null,
    geoPrecision: geo ? geo.precision : 'none',
    publishedAt,
    fetchedAt: now.toISOString(),
    lang: raw.lang || source.lang || null,
    sources: [{ id: source.id, name: source.name }],
    sourceCountry: source.country || null,
    extra: raw.extra || undefined,
  };
}

/**
 * Îmbină un eveniment nou într-o colecție existentă, deduplicând după URL canonic și titlu normalizat.
 * Returnează true dacă a fost adăugat ca eveniment nou.
 */
function mergeInto(store, indexes, ev) {
  const tkey = titleKey(ev.title);
  const existingId = store.has(ev.id) ? ev.id : tkey.length >= 25 ? indexes.byTitle.get(tkey) : undefined;
  const existing = existingId && store.get(existingId);
  if (existing) {
    for (const s of ev.sources) {
      if (!existing.sources.some((x) => x.id === s.id)) existing.sources.push(s);
    }
    for (const l of ev.layers) if (!existing.layers.includes(l)) existing.layers.push(l);
    existing.layers = LAYERS.filter((l) => existing.layers.includes(l));
    if (ev.publishedAt < existing.publishedAt) existing.publishedAt = ev.publishedAt;
    if (existing.geoPrecision === 'none' && ev.geoPrecision !== 'none') {
      Object.assign(existing, {
        lat: ev.lat, lon: ev.lon, country: ev.country, place: ev.place, geoPrecision: ev.geoPrecision,
      });
    }
    existing.severity = Math.max(existing.severity, ev.severity);
    if (!existing.conflictType && ev.conflictType) existing.conflictType = ev.conflictType;
    if (!existing.newsTopic && ev.newsTopic) existing.newsTopic = ev.newsTopic;
    return false;
  }
  store.set(ev.id, ev);
  if (tkey.length >= 25) indexes.byTitle.set(tkey, ev.id);
  return true;
}

module.exports = { makeEvent, mergeInto, canonicalUrl, titleKey, LAYERS };
