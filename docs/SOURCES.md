# Global news sources: what exists and what we use

Research dated 2026-09-27. From the working environment no site could be accessed directly, because the
proxy blocked almost everything. The data below comes from web search results (vendor pages and 2026
comparisons). Prices must be rechecked before any subscription.
Items marked **[unverified]** could not be confirmed.

## Summary

A free platform that tracks the press of almost the whole world already exists: the **GDELT Project**.
It monitors news in 65 languages, publishes geolocated events every 15 minutes and can be queried by the
publication's country. Its terms allow any use, including commercial, provided you credit GDELT and link
to them. We build on GDELT and add direct RSS feeds in stages, by continent and then by country.

Commercial news-aggregation APIs cost between $9 and $450 per month. Free plans have delays (12-24 h),
and most forbid commercial use. They are not needed for the current stage.

## 1. GDELT: the free foundation (implemented)

| What | How we use it | Limits |
|---|---|---|
| **Events 2.0**: 15-minute export | `src/sources/gdelt-events.js`: we keep only conflicts (CAMEO 18 attacks, 19 fighting, 20 mass violence), with the coordinates of the action location, grouped by place and type | Coding is automatic, so false positives happen. We filter by article count (`minArticles`). |
| **DOC 2.0 API** with `sourcecountry:` | one query per country (~200), once an hour, at most 75 articles | 1 request per 5 s (we use 6 s). Exceeding it triggers a 1-15 minute block. |
| **DOC 2.0 API** by theme | queries for conflicts and general news | at most 250 results per request |

Country names for `sourcecountry:` (the name without spaces, for example `unitedkingdom`) must be
checked on the server for countries with unusual names **[unverified]**.

## 2. Commercial APIs (optional, stage 3)

| API | Coverage | Free plan | Commercial use on the free plan | Cheapest paid plan |
|---|---|---|---|---|
| NewsData.io | 100k+ sources, 206 countries | 200 credits/day, 12 h delay | **yes** | ~$200/month |
| World News API | 210+ countries, search by coordinates | 50 points/day, requires backlink | with backlink | $39/month |
| TheNewsAPI | 40k+ sources | 100 requests/day | ? | $9/month |
| NewsAPI.ai (Event Registry) | 150k+ publications | 2,000 tokens, one time | ? | $90/month |
| GNews | n/a | 100 requests/day, 12 h delay | no | ~EUR 50/month |
| NewsAPI.org | n/a | 100 requests/day, 24 h delay | no | $449/month |
| Perigon / Webz.io Lite | 150k-300k sources | very limited | no | $250+/month |
| Google News RSS | per-country editions | free | **no** (terms say "personal, non-commercial") | n/a |
| Bing News Search | n/a | **closed since August 2025** | n/a | n/a |

## 3. Conflicts: specialized sources (stage 2)

- **ACLED**: the best structured conflict dataset (actors, casualties, exact coordinates). Since 2025
  access is via OAuth and must be requested explicitly. The free license is non-commercial only; a
  company needs a paid license.
- **UCDP Candidate Events**: CC BY 4.0 license. The token is requested by email (3-5 days) and data is
  published monthly, with a delay of about a month.
- **Liveuamap**: paid API only, from $150/month.
- **Crisis Group CrisisWatch**: monthly RSS, useful as context.

## 4. Per-country feed catalogs (for the continent stage)

- **Media Cloud Directory**: collections for over 100 countries, each source with its RSS feeds. It has a
  free API with a key and CSV export. The best starting point for per-country lists.
- GitHub lists: `plenaryapp/awesome-rss-feeds` (OPML files per country), `WORLD-NEWS` (800+ feeds,
  80+ countries).
- **ABYZ News Links**: directories of news sites per country, homepages only, no RSS. Feeds must be
  discovered automatically.
- **Wikidata**: newspapers with country and official website, also without feeds.

## 5. Official announcements

UN News (regional RSS), WHO (news and Disease Outbreak News), ReliefWeb (RSS; since November 2025 the
v2 API requires an approved `appname`), European Commission (press corner RSS), European Parliament,
NATO, OSCE, GDACS, USGS. There is no aggregator for national government press releases, so we add them
country by country.

## Staged plan and current state

Current inventory (`loadSources()`): 657 RSS feeds, each with its own URL.

| Stage | Contents | Status |
|---|---|---|
| 0 | GDELT Events (conflicts) + GDELT per country + disasters + UN/WHO | **implemented** |
| 1 | **Europe**: 149 RSS feeds covering 45 countries plus EU institutions/NATO/OSCE (`src/sources/europe.js`) | added, `verified: false`, to be checked on a server |
| 2 | **Middle East**: 51 feeds from 15 countries (`middle-east.js`). **Africa**: 118 feeds from 56 country codes (`africa.js`), including local sources for conflict zones (Radio Dabanga, Radio Okapi, Radio Tamazuj, Hiiraan, HumAngle, Studio Tamani) | added, `verified: false`, to be checked on a server |
| 3 | **Americas**: 139 feeds (`americas.js`), **Asia**: 89 (`asia.js`), **Oceania**: 88 (`oceania.js`; 37 still `verified: false`) | added; Americas and Asia checked with the app's parser |
| 4 | Complete per-country lists from Media Cloud, via automatic import | not started |
| 5 | Optional: ACLED/UCDP, a commercial API | to be decided |

355 of the 657 RSS feeds are marked `verified: false`.
At each stage, on the server: `npm run check-sources -- --region <region> --disable-failing`.
