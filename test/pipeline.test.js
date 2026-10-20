'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { Store } = require('../src/store');
const { Aggregator } = require('../src/aggregator');
const { loadSources } = require('../src/sources');
const { canonicalUrl, makeEvent } = require('../src/lib/normalize');
const { gdeltDate } = require('../src/sources/adapters');

const root = path.join(__dirname, '..');
const quiet = { info() {}, warn() {}, error() {} };

test('canonicalUrl elimină tracking, www, fragment și slash final', () => {
  assert.strictEqual(canonicalUrl('http://www.Example.org/a/?utm_source=rss&id=3#top'), 'https://example.org/a/?id=3');
  assert.strictEqual(canonicalUrl('https://m.example.org/a?utm_medium=x'), 'https://example.org/a');
  assert.strictEqual(canonicalUrl('https://example.org/b/'), 'https://example.org/b');
});

test('gdeltDate', () => {
  assert.strictEqual(gdeltDate('20260927T121500Z'), '2026-09-27T12:15:00Z');
  assert.strictEqual(gdeltDate('bad'), null);
});

test('știrile despre conflicte intră și în stratul „conflict”', () => {
  const ev = makeEvent({ title: 'Shelling hits Kharkiv', url: 'https://x.org/1' }, { id: 's', name: 'S', layer: 'news' });
  assert.deepStrictEqual(ev.layers, ['conflict', 'news']);
  assert.strictEqual(ev.place, 'Kharkiv');
});

test('pipeline complet pe fixtures (mod demo)', async () => {
  const store = new Store({ file: null });
  const agg = new Aggregator({ sources: loadSources(root), store, demo: true, fixturesDir: path.join(root, 'fixtures'), log: quiet });
  await agg.tick(true);

  const status = agg.sourceStatus();
  assert.ok(status.length >= 9);
  for (const s of status) assert.strictEqual(s.lastError, null, `${s.id}: ${s.lastError}`);

  const st = store.stats();
  assert.ok(st.total > 50, `total ${st.total}`);
  assert.ok(st.geolocated / st.total > 0.9, 'majoritatea evenimentelor trebuie geolocalizate');
  for (const l of ['conflict', 'news', 'official', 'disaster']) assert.ok(st.byLayer[l] > 0, l);

  // Aceeași știre (BBC + Al Jazeera, URL cu utm_) → un singur eveniment cu două surse
  const kharkiv = store.query({ q: 'Kharkiv overnight' });
  assert.strictEqual(kharkiv.length, 1);
  assert.deepStrictEqual(kharkiv[0].sources.map((s) => s.id).sort(), ['aljazeera', 'bbc-world']);

  // Filtre
  const lastHour = store.query({ hours: 1 });
  assert.ok(lastHour.length > 0 && lastHour.length < st.total);
  assert.ok(store.query({ layers: ['disaster'] }).every((e) => e.layers.includes('disaster')));
  assert.ok(store.query({ minSeverity: 3 }).every((e) => e.severity === 3));
  const sorted = store.query({});
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i - 1].publishedAt >= sorted[i].publishedAt);
});

test('prune elimină evenimentele mai vechi decât maxAge', () => {
  const store = new Store({ file: null, maxAgeHours: 1 });
  const src = { id: 's', name: 'S', layer: 'news' };
  store.add(makeEvent({ title: 'Old story about Peru', url: 'https://x.org/old', publishedAt: new Date(Date.now() - 2 * 3600e3).toISOString() }, src));
  store.add(makeEvent({ title: 'New story about Chile', url: 'https://x.org/new' }, src));
  store.prune();
  assert.deepStrictEqual(store.query({}).map((e) => e.title), ['New story about Chile']);
});
