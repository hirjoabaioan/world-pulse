'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseFeed } = require('../src/lib/rss');

test('RSS 2.0 cu CDATA, entități și GeoRSS', () => {
  const xml = `<rss version="2.0"><channel><item>
    <title><![CDATA[Floods &amp; landslides]]></title>
    <link>https://example.org/a?x=1&amp;y=2</link>
    <description>&lt;p&gt;Heavy &lt;b&gt;rain&lt;/b&gt;&lt;/p&gt;</description>
    <pubDate>Sat, 27 Sep 2026 10:00:00 GMT</pubDate>
    <georss:point>24.9 91.9</georss:point>
  </item></channel></rss>`;
  const [it] = parseFeed(xml);
  assert.strictEqual(it.title, 'Floods & landslides');
  assert.strictEqual(it.url, 'https://example.org/a?x=1&y=2');
  assert.strictEqual(it.summary, 'Heavy rain');
  assert.strictEqual(it.publishedAt, '2026-09-27T10:00:00.000Z');
  assert.deepStrictEqual(it.geo, { lat: 24.9, lon: 91.9 });
});

test('Atom: link rel=alternate, data published', () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry>
    <title>Statement</title>
    <link rel="self" href="https://example.org/self"/>
    <link rel="alternate" href="https://example.org/page"/>
    <published>2026-09-27T08:00:00Z</published>
    <summary>Text</summary>
  </entry></feed>`;
  const [it] = parseFeed(xml);
  assert.strictEqual(it.url, 'https://example.org/page');
  assert.strictEqual(it.publishedAt, '2026-09-27T08:00:00.000Z');
});

test('RDF (RSS 1.0) cu dc:date', () => {
  const xml = `<rdf:RDF><item rdf:about="x"><title>DW item</title><link>https://example.org/dw</link>
    <dc:date>2026-09-27T07:00:00Z</dc:date></item></rdf:RDF>`;
  const [it] = parseFeed(xml);
  assert.strictEqual(it.url, 'https://example.org/dw');
  assert.strictEqual(it.publishedAt, '2026-09-27T07:00:00.000Z');
});

test('input invalid → listă goală', () => {
  assert.deepStrictEqual(parseFeed(''), []);
  assert.deepStrictEqual(parseFeed(null), []);
});
