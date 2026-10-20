'use strict';
// Descărcare text cu timeout, User-Agent explicit și o reîncercare la erori tranzitorii.

const UA = 'WorldPulse/0.1 (open-source news map aggregator)'; // doar ASCII: headerele HTTP nu acceptă diacritice

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, opts = {}) {
  return fetchRaw(url, opts, 'text');
}

async function fetchBuffer(url, opts = {}) {
  return fetchRaw(url, { timeoutMs: 60000, ...opts }, 'buffer');
}

async function fetchRaw(url, { timeoutMs = 20000, retries = 1, headers = {} } = {}, as = 'text') {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': UA, Accept: '*/*', ...headers },
        redirect: 'follow',
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} pentru ${url}`);
        err.status = res.status;
        // 4xx (în afară de 429) nu se reîncearcă
        if (res.status < 500 && res.status !== 429) throw Object.assign(err, { fatal: true });
        throw err;
      }
      return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (err) {
      lastErr = err.name === 'AbortError' ? new Error(`Timeout după ${timeoutMs} ms: ${url}`) : err;
      if (err.fatal || attempt === retries) break;
      await sleep(1500 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

module.exports = { fetchText, fetchBuffer, sleep };
