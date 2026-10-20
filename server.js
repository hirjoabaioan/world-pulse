'use strict';
// World Pulse — server HTTP fără dependențe: API JSON + fișiere statice (public/).
//
//   PORT=8080            portul (implicit 8080)
//   HOST=127.0.0.1       interfața (implicit 0.0.0.0)
//   DEMO=1               folosește fixtures/ în loc de rețea (date sintetice)
//   MAX_AGE_HOURS=72     cât timp se păstrează evenimentele
//   DATA_DIR=./data      unde se salvează cache.json și unde se caută sources.local.json

const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadSources } = require('./src/sources');
const { Store } = require('./src/store');
const { Aggregator } = require('./src/aggregator');
const { LAYERS } = require('./src/lib/normalize');
const { findSocialPosts } = require('./src/lib/social');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DEMO = process.env.DEMO === '1';
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function createApp({ store, aggregator, demo }) {
  const socialCache = new Map(); // eventId -> { at, data } — avoids re-hitting Bluesky/YouTube on repeat opens
  const SOCIAL_CACHE_MS = 5 * 60 * 1000;

  function sendJson(res, status, body) {
    const data = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': MIME['.json'],
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  }

  function serveStatic(req, res, pathname) {
    const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(PUBLIC, rel);
    if (!file.startsWith(PUBLIC + path.sep)) {
      res.writeHead(403).end('Interzis');
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': rel.startsWith('vendor/') ? 'public, max-age=604800' : 'no-cache',
      });
      fs.createReadStream(file).pipe(res);
    });
  }

  return function handler(req, res) {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const p = url.pathname;
    const q = url.searchParams;

    if (p === '/api/events') {
      const layers = (q.get('layers') || '').split(',').filter((l) => LAYERS.includes(l));
      const hours = Math.min(Math.max(Number(q.get('hours')) || 24, 1), 24 * 30);
      const limit = Math.min(Math.max(Number(q.get('limit')) || 3000, 1), 10000);
      const events = store.query({
        layers,
        hours,
        limit,
        q: (q.get('q') || '').slice(0, 100),
        country: (q.get('country') || '').toUpperCase().slice(0, 2) || undefined,
        geoOnly: q.get('geo') === '1',
        minSeverity: Number(q.get('minSeverity')) || 0,
      });
      return sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        lastUpdate: aggregator.lastUpdate,
        demo,
        count: events.length,
        events,
      });
    }
    if (p === '/api/social') {
      const id = (q.get('id') || '').slice(0, 64);
      const ev = id && store.getById(id);
      if (!ev) return sendJson(res, 404, { error: 'Unknown event id' });
      const cached = socialCache.get(id);
      if (cached && Date.now() - cached.at < SOCIAL_CACHE_MS) return sendJson(res, 200, cached.data);
      return findSocialPosts(ev)
        .then((data) => {
          socialCache.set(id, { at: Date.now(), data });
          sendJson(res, 200, data);
        })
        .catch((err) => sendJson(res, 502, { error: err.message, query: '', bluesky: [], youtube: [] }));
    }
    if (p === '/api/sources') {
      return sendJson(res, 200, { demo, sources: aggregator.sourceStatus() });
    }
    if (p === '/api/health') {
      return sendJson(res, 200, { ok: true, demo, lastUpdate: aggregator.lastUpdate, ...store.stats() });
    }
    if (p.startsWith('/api/')) return sendJson(res, 404, { error: 'Unknown endpoint' });
    return serveStatic(req, res, p);
  };
}

function main() {
  const store = new Store({
    file: path.join(DATA_DIR, DEMO ? 'demo-cache.json' : 'cache.json'),
    maxAgeHours: Number(process.env.MAX_AGE_HOURS) || 72,
  });
  if (!DEMO) console.log(`[store] ${store.load()} evenimente încărcate din cache`);
  const aggregator = new Aggregator({
    sources: loadSources(ROOT),
    store,
    demo: DEMO,
    fixturesDir: path.join(ROOT, 'fixtures'),
    log: { info: console.log, warn: console.warn, error: console.error },
  });
  aggregator.start();

  const server = http.createServer(createApp({ store, aggregator, demo: DEMO }));
  server.listen(PORT, HOST, () => {
    console.log(`World Pulse ${DEMO ? '(MOD DEMO) ' : ''}pornit pe http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
  const shutdown = () => {
    aggregator.stop();
    try {
      store.save();
    } catch {}
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) main();

module.exports = { createApp };
