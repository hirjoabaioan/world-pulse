'use strict';
// Social-post correlation for a selected event — called on demand (one event at a time, when a
// user opens its detail), never from the background aggregation loop. Both providers are optional:
// the feature degrades gracefully (empty results) if their env vars aren't set.
//
//   BLUESKY_IDENTIFIER / BLUESKY_APP_PASSWORD   free Bluesky account + an "app password"
//     (bsky.app → Settings → App Passwords). Needed because, despite being otherwise unauthenticated,
//     app.bsky.feed.searchPosts itself returns 403 without a session (verified directly — other
//     read endpoints like getProfile are open; search specifically is not).
//   YOUTUBE_API_KEY                             free Google Cloud API key, YouTube Data API v3
//     enabled. Free quota is 10,000 units/day; search.list costs 100 units, so ~100 searches/day —
//     see YT_DAILY_LIMIT below.

const { fetchText } = require('./http');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'after', 'before',
  'amid', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'by', 'from', 'its', 'their', 'his', 'her',
  'new', 'says', 'say', 'said', 'into', 'over', 'this', 'that', 'has', 'have', 'had', 'will', 'more',
  'de', 'la', 'un', 'o', 'și', 'pentru', 'cu', 'din', 'pe', 'după', 'între',
]);

/** Longest/most distinctive words in a headline — a cheap stand-in for real keyword extraction. */
function extractKeywords(title, max = 3) {
  const words = String(title || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase()));
  const seen = new Set();
  const out = [];
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

/** place/country + a few distinctive headline words — reuses geo/classify output, no new NLP. */
function buildQuery(ev) {
  const place = ev.place || '';
  return [place, ...extractKeywords(ev.title, 3)].filter(Boolean).join(' ').trim();
}

// --- Bluesky ------------------------------------------------------------------------------------
// Session is cached in memory (single-process server) and refreshed when near expiry. accessJwt
// is short-lived (~2h); we don't bother with refreshJwt rotation — just re-login, simpler and this
// runs at most a few times a day given on-demand usage.
let blueskySession = null; // { accessJwt, expiresAt }

async function getBlueskySession() {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) return null;
  if (blueskySession && blueskySession.expiresAt > Date.now()) return blueskySession.accessJwt;
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error(`Bluesky login HTTP ${res.status}`);
  const data = await res.json();
  blueskySession = { accessJwt: data.accessJwt, expiresAt: Date.now() + 100 * 60 * 1000 }; // ~100min
  return blueskySession.accessJwt;
}

async function searchBluesky(query, limit = 6) {
  if (!query) return [];
  const token = await getBlueskySession();
  if (!token) return []; // not configured — feature silently disabled, not an error
  const url = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${limit}`;
  let text;
  try {
    text = await fetchText(url, { timeoutMs: 8000, headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    if (err.status === 401 || err.status === 403) blueskySession = null; // force re-login next call
    throw err;
  }
  const data = JSON.parse(text);
  return (data.posts || []).map((p) => {
    const images = p.embed && Array.isArray(p.embed.images) ? p.embed.images : [];
    return {
      type: 'bluesky',
      author: (p.author && (p.author.displayName || p.author.handle)) || 'unknown',
      handle: p.author && p.author.handle,
      text: (p.record && p.record.text) || '',
      url: p.author && p.uri ? `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split('/').pop()}` : null,
      image: images[0] ? images[0].thumb : null,
      publishedAt: p.record && p.record.createdAt,
      likeCount: p.likeCount || 0,
    };
  });
}

// --- YouTube --------------------------------------------------------------------------------
const YT_DAILY_LIMIT = 90; // margin under the 100-search/day free quota (search.list = 100 units)
let ytDay = null;
let ytCount = 0;
function ytQuotaAvailable() {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== ytDay) {
    ytDay = day;
    ytCount = 0;
  }
  return ytCount < YT_DAILY_LIMIT;
}

async function searchYouTube(query, limit = 4) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !query) return [];
  if (!ytQuotaAvailable()) return [];
  ytCount++;
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance` +
    `&maxResults=${limit}&q=${encodeURIComponent(query)}&key=${key}`;
  const text = await fetchText(url, { timeoutMs: 8000 });
  const data = JSON.parse(text);
  return (data.items || [])
    .filter((it) => it.id && it.id.videoId)
    .map((it) => ({
      type: 'youtube',
      channel: it.snippet && it.snippet.channelTitle,
      title: it.snippet && it.snippet.title,
      url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      image: it.snippet && it.snippet.thumbnails && it.snippet.thumbnails.medium && it.snippet.thumbnails.medium.url,
      publishedAt: it.snippet && it.snippet.publishedAt,
    }));
}

/** Runs both providers for one event; never throws — a provider failing just yields no results for it. */
async function findSocialPosts(ev, { blueskyLimit = 6, youtubeLimit = 4 } = {}) {
  const query = buildQuery(ev);
  const [bluesky, youtube] = await Promise.allSettled([
    searchBluesky(query, blueskyLimit),
    searchYouTube(query, youtubeLimit),
  ]);
  return {
    query,
    bluesky: bluesky.status === 'fulfilled' ? bluesky.value : [],
    youtube: youtube.status === 'fulfilled' ? youtube.value : [],
    errors: {
      bluesky: bluesky.status === 'rejected' ? bluesky.reason.message : null,
      youtube: youtube.status === 'rejected' ? youtube.reason.message : null,
    },
  };
}

module.exports = { extractKeywords, buildQuery, searchBluesky, searchYouTube, findSocialPosts };
