'use strict';
// Depozit în memorie + persistență JSON pe disc (supraviețuiește restartului).

const fs = require('fs');
const path = require('path');
const { mergeInto, titleKey } = require('./lib/normalize');

class Store {
  constructor({ file, maxAgeHours = 72, maxEvents = 20000 } = {}) {
    this.file = file;
    this.maxAgeMs = maxAgeHours * 3600 * 1000;
    this.maxEvents = maxEvents;
    this.events = new Map();
    this.indexes = { byTitle: new Map() };
  }

  load() {
    if (!this.file || !fs.existsSync(this.file)) return 0;
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      for (const ev of data.events || []) this.add(ev);
      this.prune();
      return this.events.size;
    } catch (err) {
      console.warn(`[store] Nu am putut încărca ${this.file}: ${err.message}`);
      return 0;
    }
  }

  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ savedAt: new Date().toISOString(), events: [...this.events.values()] }));
    fs.renameSync(tmp, this.file);
  }

  add(ev) {
    return mergeInto(this.events, this.indexes, ev);
  }

  getById(id) {
    return this.events.get(id) || null;
  }

  prune(now = Date.now()) {
    const cutoff = now - this.maxAgeMs;
    for (const [id, ev] of this.events) {
      if (Date.parse(ev.publishedAt) < cutoff) this.delete(id);
    }
    if (this.events.size > this.maxEvents) {
      const sorted = [...this.events.values()].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
      for (const ev of sorted.slice(0, this.events.size - this.maxEvents)) this.delete(ev.id);
    }
  }

  delete(id) {
    const ev = this.events.get(id);
    if (!ev) return;
    this.events.delete(id);
    const k = titleKey(ev.title);
    if (this.indexes.byTitle.get(k) === id) this.indexes.byTitle.delete(k);
  }

  /**
   * @param {object} f { layers?: string[], hours?: number, q?: string, country?: string, geoOnly?: boolean, limit?: number, minSeverity?: number }
   */
  query(f = {}, now = Date.now()) {
    const since = f.hours ? now - f.hours * 3600 * 1000 : 0;
    const q = f.q ? f.q.toLowerCase() : '';
    const layers = f.layers && f.layers.length ? new Set(f.layers) : null;
    const out = [];
    for (const ev of this.events.values()) {
      if (since && Date.parse(ev.publishedAt) < since) continue;
      if (layers && !ev.layers.some((l) => layers.has(l))) continue;
      if (f.country && ev.country !== f.country) continue;
      if (f.geoOnly && ev.lat === null) continue;
      if (f.minSeverity && ev.severity < f.minSeverity) continue;
      if (q && !`${ev.title} ${ev.summary} ${ev.place || ''}`.toLowerCase().includes(q)) continue;
      out.push(ev);
    }
    out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return f.limit ? out.slice(0, f.limit) : out;
  }

  stats() {
    const byLayer = { conflict: 0, news: 0, official: 0, disaster: 0 };
    let geolocated = 0;
    for (const ev of this.events.values()) {
      for (const l of ev.layers) byLayer[l] = (byLayer[l] || 0) + 1;
      if (ev.lat !== null) geolocated++;
    }
    return { total: this.events.size, geolocated, byLayer };
  }
}

module.exports = { Store };
