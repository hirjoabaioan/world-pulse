'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { gdeltEvents, unzipFirst, titleFromUrl, fetchLatestExport } = require('../src/sources/gdelt-events');
const { loadFixture } = require('../src/fixtures');

const fx = path.join(__dirname, '..', 'fixtures');

test('filtrează conflictele, grupează pe loc + tip, elimină pragul și nivelul de țară', () => {
  const out = gdeltEvents(loadFixture(path.join(fx, 'gdelt-events.tsv')), { minArticles: 2 });
  const kharkiv = out.filter((e) => e.place.startsWith('Kharkiv'));
  assert.strictEqual(kharkiv.length, 1, 'două rânduri la același loc/tip → un eveniment');
  assert.strictEqual(kharkiv[0].extra.articles, 23);
  assert.strictEqual(kharkiv[0].title, "Aerial / drone strike – Kharkiv, Kharkivs'ka Oblast', Ukraine");
  assert.strictEqual(kharkiv[0].country, 'UA');
  assert.strictEqual(kharkiv[0].severity, 3);
  assert.ok(!out.some((e) => e.place === 'Ukraine'), 'evenimentele la nivel de țară se elimină');
  assert.ok(!out.some((e) => e.place.startsWith('Bogota')), 'sub pragul minArticles');
  assert.ok(!out.some((e) => e.place.startsWith('Bucharest')), 'non-conflict (CAMEO 04)');
  assert.ok(out.find((e) => e.place.startsWith('Rafah')).severity === 3, 'CAMEO 20 → critic');
  assert.ok(out.every((e) => /^\d{4}-\d{2}-\d{2}T/.test(e.publishedAt)));
});

test('dezarhivare ZIP (deflate) fără dependențe', () => {
  const buf = fs.readFileSync(path.join(fx, 'gdelt-events-sample.zip'));
  const csv = unzipFirst(buf).toString('utf8');
  assert.strictEqual(csv.trim().split('\n').length, 3);
  assert.ok(gdeltEvents(buf, { minArticles: 1 }).length >= 1);
});

test('titlu aproximativ din URL', () => {
  assert.strictEqual(titleFromUrl('https://x.org/world/2026/09/27/russian-strike-kills-3.html'), 'Russian strike kills 3');
  assert.strictEqual(titleFromUrl('https://x.org/123456'), '');
});

test('fetchLatestExport sare peste arhiva deja procesată', async () => {
  const state = {};
  const io = {
    fetchText: async () => '1 abc http://data.gdeltproject.org/gdeltv2/20260927120000.export.CSV.zip\n2 def http://data.gdeltproject.org/gdeltv2/20260927120000.mentions.CSV.zip',
    fetchBuffer: async (u) => Buffer.from(u),
  };
  const first = await fetchLatestExport({ url: 'x' }, io, state);
  assert.match(first.toString(), /export\.CSV\.zip$/);
  assert.strictEqual(await fetchLatestExport({ url: 'x' }, io, state), '');
});
