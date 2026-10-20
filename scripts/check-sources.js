#!/usr/bin/env node
'use strict';
// Verifică toate sursele active: descarcă, parsează și raportează câte elemente aduce fiecare.
//   node scripts/check-sources.js                 # toate sursele (fără cele GDELT pe țări)
//   node scripts/check-sources.js --region europe # doar o regiune
//   node scripts/check-sources.js --gdelt         # include și GDELT pe țări (lent: 6 s / cerere)
//   node scripts/check-sources.js --disable-failing   # scrie sources.local.json cu sursele picate dezactivate
// Raportul complet se salvează în data/source-check.json.

const fs = require('fs');
const path = require('path');
const { loadSources } = require('../src/sources');
const { Aggregator } = require('../src/aggregator');
const { Store } = require('../src/store');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);

(async () => {
  let sources = loadSources(root).filter((s) => s.enabled);
  if (!flag('--gdelt')) sources = sources.filter((s) => !/^gdelt-[a-z]{2}$/.test(s.id));
  const region = opt('--region');
  if (region) sources = sources.filter((s) => s.region === region);

  const store = new Store({ file: null });
  const agg = new Aggregator({ sources, store, log: { info() {}, warn() {}, error() {} }, concurrency: 12 });
  console.log(`Verific ${agg.sources.length} surse…`);
  await agg.tick(true);

  const rows = agg.sourceStatus();
  const ok = rows.filter((r) => !r.lastError && r.lastCount > 0);
  const empty = rows.filter((r) => !r.lastError && r.lastCount === 0);
  const failed = rows.filter((r) => r.lastError);
  for (const r of rows) {
    const mark = r.lastError ? 'EROARE' : r.lastCount ? 'OK    ' : 'GOL   ';
    console.log(`${mark} ${r.id.padEnd(30)} ${String(r.lastCount).padStart(4)}  ${r.lastError || ''}`);
  }
  console.log(`\nOK: ${ok.length} · goale: ${empty.length} · eșuate: ${failed.length} · evenimente: ${store.stats().total}`);

  const dataDir = process.env.DATA_DIR || path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'source-check.json'), JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 2));

  if (flag('--disable-failing') && (failed.length || empty.length)) {
    const file = path.join(process.env.DATA_DIR || root, 'sources.local.json');
    const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    for (const r of [...failed, ...empty]) {
      const o = current.find((x) => x.id === r.id);
      if (o) o.enabled = false;
      else current.push({ id: r.id, enabled: false, reason: r.lastError || 'feed gol' });
    }
    fs.writeFileSync(file, JSON.stringify(current, null, 2));
    console.log(`Am dezactivat ${failed.length + empty.length} surse în sources.local.json`);
  }
})();
