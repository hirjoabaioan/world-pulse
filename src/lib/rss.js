'use strict';
// Parser minimal RSS 2.0 / RSS 1.0 (RDF) / Atom, fără dependențe.
// Extrage și coordonate GeoRSS (<georss:point>, <geo:lat>/<geo:long>) când există.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    const v = ENTITIES[e.toLowerCase()];
    return v !== undefined ? v : m;
  });
}

function stripCdata(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

/** Transformă HTML într-un text simplu scurt. */
function toText(s, max = 400) {
  if (!s) return '';
  let t = decodeEntities(stripCdata(s));
  t = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  t = decodeEntities(t).replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = block.match(re);
  return m ? stripCdata(m[1]).trim() : '';
}

function attr(block, name, attrName, filter) {
  const re = new RegExp(`<${name}\\b([^>]*)/?>`, 'gi');
  let m;
  while ((m = re.exec(block))) {
    const attrs = m[1];
    if (filter && !filter(attrs)) continue;
    const a = attrs.match(new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i'));
    if (a) return decodeEntities(a[1]);
  }
  return '';
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseGeo(block) {
  const point = tag(block, 'georss:point');
  if (point) {
    const [lat, lon] = point.split(/[\s,]+/).map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  const lat = parseFloat(tag(block, 'geo:lat'));
  const lon = parseFloat(tag(block, 'geo:long') || tag(block, 'geo:lon'));
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  return null;
}

/**
 * Returnează [{ title, url, summary, publishedAt, geo, extra }]
 * @param {string[]} [opts.extraTags] taguri suplimentare de extras (ex. 'gdacs:alertlevel')
 */
function parseFeed(xml, opts = {}) {
  const extraTags = opts.extraTags || [];
  if (!xml || typeof xml !== 'string') return [];
  const isAtom = /<feed\b[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(xml) && !/<rss\b/i.test(xml);
  const itemRe = isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi;
  const out = [];
  for (const block of xml.match(itemRe) || []) {
    const title = toText(tag(block, 'title'), 300);
    let url = isAtom
      ? attr(block, 'link', 'href', (a) => !/rel\s*=\s*["'](?!alternate)/i.test(a))
      : decodeEntities(tag(block, 'link'));
    if (!url) url = attr(block, 'link', 'href') || decodeEntities(tag(block, 'guid'));
    const rawSummary =
      tag(block, 'description') || tag(block, 'summary') || tag(block, 'content') || tag(block, 'content:encoded');
    const publishedAt = parseDate(
      tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date')
    );
    if (!title && !url) continue;
    const extra = {};
    for (const t of extraTags) extra[t] = toText(tag(block, t), 200);
    out.push({ title, url: url.trim(), summary: toText(rawSummary), publishedAt, geo: parseGeo(block), extra });
  }
  return out;
}

module.exports = { parseFeed, toText, decodeEntities };
