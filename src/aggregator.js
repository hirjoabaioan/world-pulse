'use strict';
// Planificator: rulează fiecare sursă la intervalul ei, secvențial, cu pauză obligatorie între
// apelurile GDELT (limită publică ~1 cerere / 5 s). Păstrează starea fiecărei surse pentru /api/sources.

const path = require('path');
const adapters = require('./sources/adapters');
const { makeEvent } = require('./lib/normalize');
const { fetchText, fetchBuffer, sleep } = require('./lib/http');
const { gdeltEvents, fetchLatestExport } = require('./sources/gdelt-events');
const { loadFixture } = require('./fixtures');

const ADAPTER = {
  rss: adapters.rss,
  gdacs: adapters.gdacs,
  'gdelt-doc': adapters.gdeltDoc,
  usgs: adapters.usgs,
  eonet: adapters.eonet,
  'gdelt-events': gdeltEvents,
};

// Surse care au nevoie de o descărcare în mai mulți pași
const FETCHER = { 'gdelt-events': fetchLatestExport };

const GROUP_GAP_MS = { gdelt: 6000 };

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(workers);
}

class Aggregator {
  constructor({ sources, store, demo = false, fixturesDir, log = console, concurrency = 8 }) {
    this.concurrency = concurrency;
    this.sources = sources.filter((s) => s.enabled && (!demo || s.fixture));
    this.store = store;
    this.demo = demo;
    this.fixturesDir = fixturesDir;
    this.log = log;
    this.status = new Map(
      this.sources.map((s) => [s.id, { id: s.id, name: s.name, layer: s.layer, type: s.type, url: s.url, lastRun: null, lastOk: null, lastError: null, lastCount: 0, added: 0 }])
    );
    this.lastGroupCall = {};
    this.fetchState = {};
    this.running = false;
    this.timer = null;
    this.lastUpdate = null;
  }

  async fetchRaw(source) {
    if (this.demo) return loadFixture(path.join(this.fixturesDir, source.fixture));
    const gap = GROUP_GAP_MS[source.group];
    if (gap) {
      const wait = (this.lastGroupCall[source.group] || 0) + gap - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastGroupCall[source.group] = Date.now();
    }
    const custom = FETCHER[source.type];
    if (custom) {
      const st = (this.fetchState[source.id] = this.fetchState[source.id] || {});
      return custom(source, { fetchText, fetchBuffer }, st);
    }
    return fetchText(source.url);
  }

  async runSource(source) {
    const st = this.status.get(source.id);
    st.lastRun = new Date().toISOString();
    try {
      // Hard watchdog, independent of fetchRaw's own internal AbortController timeout (src/lib/http.js).
      // Observed in production: a single request can hang past its internal timeout without the abort
      // actually unblocking it (a known class of Node undici issue on reused/kept-alive sockets) — with
      // sources processed by a worker pool (and GDELT's ~200 sources serialized in one lane), ONE stuck
      // request blocks that whole lane's Promise.all forever, freezing the entire tick (and therefore
      // every future tick, since tick() bails out while `running` is still true) — all new data stops
      // merging silently. This race guarantees runSource always resolves and the pool moves on, even if
      // the underlying request itself is permanently leaked (harmless: no retry loop, no growth).
      let watchdogTimer;
      const watchdog = new Promise((_, reject) => {
        watchdogTimer = setTimeout(() => reject(new Error('watchdog: nu a răspuns în 90s')), 90000);
        watchdogTimer.unref(); // never keeps the process (or a test run) alive on its own
      });
      let text;
      try {
        text = await Promise.race([this.fetchRaw(source), watchdog]);
      } finally {
        clearTimeout(watchdogTimer); // otherwise it fires 90s later regardless of which side won
      }
      const adapter = ADAPTER[source.type];
      if (!adapter) throw new Error(`Tip de sursă necunoscut: ${source.type}`);
      const now = new Date();
      let added = 0;
      const raws = adapter(text, source);
      for (const raw of raws) {
        if (!raw.title) continue;
        if (this.store.add(makeEvent(raw, source, now))) added++;
      }
      st.lastOk = now.toISOString();
      st.lastError = null;
      st.lastCount = raws.length;
      st.added += added;
      this.log.info(`[${source.id}] ${raws.length} elemente, ${added} noi`);
    } catch (err) {
      st.lastError = err.message;
      this.log.warn(`[${source.id}] eroare: ${err.message}`);
    }
  }

  isDue(source, now = Date.now()) {
    const st = this.status.get(source.id);
    if (!st.lastRun) return true;
    return now - Date.parse(st.lastRun) >= source.intervalMin * 60 * 1000;
  }

  /** Rulează toate sursele scadente (sau toate, cu force=true). */
  async tick(force = false) {
    if (this.running) return;
    this.running = true;
    try {
      const due = this.sources.filter((s) => force || this.isDue(s));
      // Sursele din același grup (ex. GDELT) rulează secvențial, cu pauză între ele;
      // restul rulează în paralel, câte CONCURRENCY odată.
      const grouped = new Map();
      const free = [];
      for (const s of due) {
        if (s.group) (grouped.get(s.group) || grouped.set(s.group, []).get(s.group)).push(s);
        else free.push(s);
      }
      const lanes = [...grouped.values()].map(async (list) => {
        for (const s of list) await this.runSource(s);
      });
      lanes.push(pool(free, this.concurrency, (s) => this.runSource(s)));
      await Promise.all(lanes);
      if (due.length) {
        this.store.prune();
        this.store.save();
        this.lastUpdate = new Date().toISOString();
      }
    } finally {
      this.running = false;
    }
  }

  start(tickMs = 30000) {
    this.tick(true).catch((e) => this.log.error(e));
    if (this.demo) return; // în demo datele sunt statice
    this.timer = setInterval(() => this.tick().catch((e) => this.log.error(e)), tickMs);
    this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  sourceStatus() {
    return [...this.status.values()];
  }
}

module.exports = { Aggregator };

// Rulare directă: `node src/aggregator.js` → o singură trecere, afișează statistici.
if (require.main === module) {
  const { loadSources } = require('./sources');
  const { Store } = require('./store');
  const root = path.join(__dirname, '..');
  const demo = process.env.DEMO === '1';
  const store = new Store({ file: path.join(root, 'data', demo ? 'demo-cache.json' : 'cache.json') });
  store.load();
  const agg = new Aggregator({ sources: loadSources(root), store, demo, fixturesDir: path.join(root, 'fixtures') });
  agg.tick(true).then(() => {
    console.log(JSON.stringify({ stats: store.stats(), sources: agg.sourceStatus() }, null, 2));
  });
}
