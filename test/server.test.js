'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const { createApp } = require('../server');
const { Store } = require('../src/store');
const { Aggregator } = require('../src/aggregator');
const { loadSources } = require('../src/sources');

const root = path.join(__dirname, '..');

test('API și fișiere statice', async (t) => {
  const store = new Store({ file: null });
  const aggregator = new Aggregator({ sources: loadSources(root), store, demo: true, fixturesDir: path.join(root, 'fixtures'), log: { info() {}, warn() {}, error() {} } });
  await aggregator.tick(true);
  const server = http.createServer(createApp({ store, aggregator, demo: true }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const ev = await (await fetch(`${base}/api/events?layers=conflict&hours=24`)).json();
  assert.ok(ev.count > 0);
  assert.ok(ev.events.every((e) => e.layers.includes('conflict')));
  assert.strictEqual(ev.demo, true);

  const src = await (await fetch(`${base}/api/sources`)).json();
  assert.ok(Array.isArray(src.sources));

  const index = await fetch(`${base}/`);
  assert.strictEqual(index.status, 200);
  assert.match(await index.text(), /World Pulse/);

  // Încercări de path traversal: nu trebuie să servească niciodată fișiere din afara public/
  for (const p of ['/%2e%2e/server.js', '/..%2fserver.js', '/vendor/..%2f..%2fserver.js']) {
    const r = await fetch(base + p);
    assert.ok([403, 404].includes(r.status), `${p} → ${r.status}`);
  }
  assert.strictEqual((await fetch(`${base}/api/nope`)).status, 404);
});
