'use strict';
// Surse RSS Oceania (etapa 3c). Cercetare + verificare pe 2026-09-29.
// De data asta mediul de lucru AVEA egress, deci fiecare sursă de mai jos a fost descărcată și parsată
// cu `src/lib/rss.js` (parseFeed): `verified: true` = feed confirmat (HTTP 200 + minim un element).
// `verified: false` + marcaj „// ?” = URL cu încredere mai mică: fie a răspuns 403/429 la verificare
// (blocare de bot/TVA), fie a răspuns 200 dar fără elemente parsabile (tipar standard / feed mutat).
// Recomandare: pe server rulați `npm run check-sources -- --region oceania --disable-failing` și
// priviți `// ?` ca pe candidați de re-verificat manual, nu ca pe surse moarte.
// Notă pe ids ABC: https://www.abc.net.au/news/feed/<id>/rss.xml – id-urile 45910 (Top Stories),
// 51120 (Just In) și 1948 (despre ABC) sunt confirmate prin titlul feed-ului; 1974/1626/1044 sunt
// deduse din conținut (world / sănătate / rural-regional) => marcate „// ?”.
// scope: 'world' = sursă pan-regională (nu se fixează pe țara-sediu pe hartă).

const S = (country, lang, slug, name, url, extra = {}) => ({
  id: `${country.toLowerCase()}-${slug}`,
  name,
  country,
  lang,
  layer: 'news',
  type: 'rss',
  url,
  intervalMin: 15,
  verified: false,
  ...extra,
});
const O = (country, lang, slug, name, url, extra = {}) => ({
  id: `${country.toLowerCase()}-${slug}`,
  name,
  country,
  lang,
  layer: 'official',
  type: 'rss',
  url,
  intervalMin: 30,
  verified: false,
  ...extra,
});
// Sursă verificată: același helper, dar cu verified: true (fetch + parse confirmat la 2026-09-29).
const SV = (country, lang, slug, name, url, extra = {}) =>
  S(country, lang, slug, name, url, { verified: true, ...extra });
const OV = (country, lang, slug, name, url, extra = {}) =>
  O(country, lang, slug, name, url, { verified: true, ...extra });
const W = { scope: 'world' };

module.exports = [
  // --------------------------------------------------- Pan-oceanian (news, scope world)
  SV('NZ', 'en', 'rnz-pacific', 'RNZ Pacific', 'https://www.rnz.co.nz/rss/pacific.xml', W),
  SV('NZ', 'en', 'pacific-scoop', 'Pacific Scoop', 'https://pacific.scoop.co.nz/feed/', W), // ? WordPress /feed standard
  SV('FJ', 'en', 'islandsbusiness', 'Islands Business', 'https://islandsbusiness.com/feed/', W),
  SV('AU', 'en', 'lowyinstitute-interpreter', 'The Interpreter (Lowy Institute)', 'https://www.lowyinstitute.org/the-interpreter/rss.xml', W),
  SV('AU', 'en', 'aspistrategist', 'The Strategist (ASPI)', 'https://www.aspistrategist.org.au/feed/', W), // ? WordPress /feed standard
  // (Pacific Islands Report – pacificislandsreport.com: domeniu care nu răspunde; BenarNews Pacific: fără RSS; Papuasia/PNG Facts: fără RSS)

  // --------------------------------------------------- Oficial (ONU / programe regionale)
  OV('UN', 'en', 'unnews-asia-pacific', 'UN News – Asia-Pacific', 'https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml', W),
  O('FJ', 'en', 'reliefweb-pacific', 'ReliefWeb – Pacific (OCHA)', 'https://reliefweb.int/updates/rss.xml?advanced-search=(PC1)', { ...W, intervalMin: 60 }), // ? a răspuns 200 la verificare, dar 406 la re-verificare (TVA/UA) – același tipar ca sursa ReliefWeb din index.js
  OV('FJ', 'en', 'spc', 'Pacific Community (SPC)', 'https://www.spc.int/rss.xml', W), // ? feed activ dar cu conținut vechi (actualizări COVID-19)
  // (Forum Fisheries Agency, SPREP, USP, Pacific Islands Forum: 403 / fără RSS; MFAT NZ, Beehive, DFAT,
  //  Defence AU, BOM: fără feed RSS public – omise sau păstrate cu „// ?” mai jos)

  // --------------------------------------------------- Australia – ABC (public broadcaster)
  SV('AU', 'en', 'abc-top-stories', 'ABC News – Top Stories', 'https://www.abc.net.au/news/feed/45910/rss.xml'),
  SV('AU', 'en', 'abc-just-in', 'ABC News – Just In', 'https://www.abc.net.au/news/feed/51120/rss.xml'),
  S('AU', 'en', 'abc-world', 'ABC News – World', 'https://www.abc.net.au/news/feed/1974/rss.xml'), // ? id dedus din conținut (nu din titlul feed-ului)
  S('AU', 'en', 'abc-health', 'ABC News – Health', 'https://www.abc.net.au/news/feed/1626/rss.xml'), // ? id dedus din conținut
  S('AU', 'en', 'abc-rural', 'ABC News – Rural & Regional', 'https://www.abc.net.au/news/feed/1044/rss.xml'), // ? id dedus din conținut

  // --------------------------------------------------- Australia – titluri naționale
  SV('AU', 'en', 'guardian-au', 'The Guardian Australia', 'https://www.theguardian.com/au/rss'),
  SV('AU', 'en', 'guardian-australia-news', 'The Guardian – Australia news', 'https://www.theguardian.com/australia-news/rss'),
  SV('AU', 'en', 'smh', 'The Sydney Morning Herald', 'https://www.smh.com.au/rss/feed.xml'),
  SV('AU', 'en', 'the-age', 'The Age', 'https://www.theage.com.au/rss/feed.xml'),
  SV('AU', 'en', 'brisbanetimes', 'Brisbane Times', 'https://www.brisbanetimes.com.au/rss/feed.xml'),
  SV('AU', 'en', 'watoday', 'WAtoday', 'https://www.watoday.com.au/rss/feed.xml'),
  SV('AU', 'en', 'sbs-news', 'SBS News', 'https://www.sbs.com.au/news/feed'),
  SV('AU', 'en', '7news', '7NEWS', 'https://www.7news.com.au/rss'),
  SV('AU', 'en', 'perthnow', 'PerthNow', 'https://www.perthnow.com.au/news/feed'),
  SV('AU', 'en', 'yahoo-au', 'Yahoo News Australia', 'https://au.news.yahoo.com/rss'),
  S('AU', 'en', 'nit', 'NIT – National Indigenous Times', 'https://nit.com.au/feed/'), // ? 403 la verificare (blocare de bot) – presă indigenă, merită reîncercat
  S('AU', 'en', 'news-com-au', 'news.com.au', 'https://www.news.com.au/content-feeds/latest-news-national/'), // ? răspunde 200 dar HTML, nu feed
  S('AU', 'en', 'skynews-au', 'Sky News Australia', 'https://www.skynews.com.au/rss'), // ? răspunde 200 dar fără elemente
  S('AU', 'en', '9news', '9News', 'https://www.9news.com.au/rss'), // ? 404 la verificare; posibil mutat
  S('AU', 'en', 'afr', 'Australian Financial Review', 'https://www.afr.com/rss/feed'), // ? 404 la verificare (paywall/TVA)
  S('AU', 'en', 'theaustralian', 'The Australian', 'https://www.theaustralian.com.au/feed'), // ? 403 la verificare (paywall/TVA)
  S('AU', 'en', 'canberratimes', 'The Canberra Times', 'https://www.canberratimes.com.au/rss/feed.xml'), // ? 404 la verificare

  // --------------------------------------------------- Australia – analiză / investigații
  SV('AU', 'en', 'crikey', 'Crikey', 'https://www.crikey.com.au/feed/'),
  SV('AU', 'en', 'macrobusiness', 'MacroBusiness', 'https://www.macrobusiness.com.au/feed/'),
  SV('AU', 'en', 'themandarin', 'The Mandarin', 'https://www.themandarin.com.au/feed/'),
  SV('AU', 'en', 'theconversation-au', 'The Conversation Australia', 'https://theconversation.com/au/articles.atom'),

  // --------------------------------------------------- Australia – oficial
  OV('AU', 'en', 'pmc', 'Department of the Prime Minister and Cabinet', 'https://www.pmc.gov.au/rss.xml'),
  OV('AU', 'en', 'niaa', 'National Indigenous Australians Agency', 'https://www.niaa.gov.au/rss.xml'),
  OV('AU', 'en', 'rba-media', 'RBA – press releases', 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml', { intervalMin: 60 }), // volum foarte mic (1 element la verificare)
  O('AU', 'en', 'dfat', 'DFAT – announcements', 'https://www.dfat.gov.au/rss'), // ? fără răspuns la verificare (timeout)
  O('AU', 'en', 'defence-news', 'Department of Defence – News', 'https://www.defence.gov.au/news-events/news/rss.xml'), // ? fără răspuns la verificare (timeout)
  O('AU', 'en', 'bom-warnings-nsw', 'BOM – avertismente NSW', 'https://www.bom.gov.au/fwo/IDZ00060.warnings_nsw.xml'), // ? 403 la verificare (BOM blochează UA ne-browser)

  // --------------------------------------------------- Noua Zeelandă – RNZ
  SV('NZ', 'en', 'rnz-news', 'RNZ – News', 'https://www.rnz.co.nz/rss/news.xml'),
  SV('NZ', 'en', 'rnz-national', 'RNZ – National', 'https://www.rnz.co.nz/rss/national.xml'),
  SV('NZ', 'en', 'rnz-political', 'RNZ – Politics', 'https://www.rnz.co.nz/rss/political.xml'),
  SV('NZ', 'en', 'rnz-world', 'RNZ – World', 'https://www.rnz.co.nz/rss/world.xml'),
  SV('NZ', 'en', 'rnz-business', 'RNZ – Business', 'https://www.rnz.co.nz/rss/business.xml'),
  SV('NZ', 'en', 'rnz-regional', 'RNZ – Regional', 'https://www.rnz.co.nz/rss/regional.xml'),
  SV('NZ', 'en', 'rnz-in-depth', 'RNZ – In Depth', 'https://www.rnz.co.nz/rss/in-depth.xml'),
  SV('NZ', 'en', 'rnz-te-manu-korihi', 'RNZ – Te Manu Korihi (Māori)', 'https://www.rnz.co.nz/rss/te-manu-korihi.xml'),
  SV('NZ', 'en', 'rnz-sport', 'RNZ – Sport', 'https://www.rnz.co.nz/rss/sport.xml'),
  SV('NZ', 'en', 'rnz-health', 'RNZ – Health', 'https://www.rnz.co.nz/rss/health.xml'),
  SV('NZ', 'en', 'rnz-education', 'RNZ – Education', 'https://www.rnz.co.nz/rss/education.xml'),
  SV('NZ', 'en', 'rnz-weather', 'RNZ – Weather', 'https://www.rnz.co.nz/rss/weather.xml'),

  // --------------------------------------------------- Noua Zeelandă – presă națională
  SV('NZ', 'en', 'stuff', 'Stuff', 'https://www.stuff.co.nz/rss'),
  SV('NZ', 'en', 'stuff-national', 'Stuff – National', 'https://www.stuff.co.nz/rss/national'),
  SV('NZ', 'en', 'newstalkzb', 'Newstalk ZB', 'https://www.newstalkzb.co.nz/rss'),
  SV('NZ', 'en', 'newsroom', 'Newsroom', 'https://www.newsroom.co.nz/feed'),
  SV('NZ', 'en', 'odt', 'Otago Daily Times', 'https://www.odt.co.nz/sitemaps/odt/rss'),
  SV('NZ', 'en', 'interest', 'Interest.co.nz', 'https://www.interest.co.nz/rss'),
  SV('NZ', 'en', 'guardian-nz', 'The Guardian – New Zealand', 'https://www.theguardian.com/world/newzealand/rss'),
  S('NZ', 'en', 'nzherald', 'The New Zealand Herald', 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/'), // ? 404 la verificare (feed Arc, cale schimbată)
  S('NZ', 'en', '1news', '1News (TVNZ)', 'https://www.1news.co.nz/feed/'), // ? 404 la verificare
  S('NZ', 'en', 'teaonews', 'Te Ao News (Whakaata Māori)', 'https://www.teaonews.co.nz/feed/'), // ? 404 la verificare

  // --------------------------------------------------- Insulele Pacificului – presă locală
  SV('FJ', 'en', 'fbcnews', 'FBC News', 'https://www.fbcnews.com.fj/feed/'),
  S('FJ', 'en', 'fijitimes', 'The Fiji Times', 'https://www.fijitimes.com.fj/feed/'), // ? 200 dar HTML, nu feed
  S('FJ', 'en', 'fijivillage', 'Fijivillage', 'https://fijivillage.com/feed/'), // ? 200 dar HTML, nu feed
  S('FJ', 'en', 'fijisun', 'Fiji Sun', 'https://fijisun.com.fj/feed/'), // ? 404 la verificare

  SV('PG', 'en', 'postcourier', 'Post-Courier (PNG)', 'https://postcourier.com.pg/feed/'),
  S('PG', 'en', 'thenational', 'The National (PNG)', 'https://www.thenational.com.pg/feed/'), // ? 403 la verificare
  S('PG', 'en', 'pngloop', 'Loop PNG', 'https://www.pngloop.com/feed/'), // ? fără răspuns la verificare (DNS/TLS)
  S('PG', 'en', 'pngbusinessnews', 'PNG Business News', 'https://www.pngbusinessnews.com/feed/'), // ? 404 la verificare

  SV('SB', 'en', 'sibconline', 'SIBC News (Solomon Islands)', 'https://sibconline.com/feed/'),
  S('SB', 'en', 'solomonstar', 'Solomon Star', 'https://www.solomonstarnews.com/feed/'), // ? 403 la verificare (Cloudflare)
  S('SB', 'en', 'islandsun', 'Island Sun', 'https://islandsun.com.sb/feed/'), // ? fără răspuns la verificare

  S('WS', 'en', 'samoanews', 'Samoa News', 'https://www.samoanews.com/rss'), // ? 429 constant la verificare (limitare de rată)
  S('WS', 'en', 'talamua', 'Talamua', 'https://www.talamua.com/feed/'), // ? 404 la verificare

  S('TO', 'en', 'matangitonga', "Matangi Tonga", 'https://matangitonga.to/rss'), // ? 404 la verificare
  S('TO', 'en', 'tonganz', 'Tonga NZ', 'https://www.tonganz.co.nz/feed/'), // ? fără răspuns la verificare

  S('VU', 'en', 'dailypost-vu', 'Vanuatu Daily Post', 'https://www.dailypost.vu/feed/'), // ? 429 constant la verificare
  S('VU', 'en', 'vanuatudaily', 'Vanuatu Daily', 'https://www.vanuatudaily.com/feed/'), // ? fără răspuns la verificare

  SV('CK', 'en', 'cookislandsnews', 'Cook Islands News', 'https://www.cookislandsnews.com/feed/'),
  SV('MH', 'en', 'marshallislandsjournal', 'Marshall Islands Journal', 'https://marshallislandsjournal.com/feed/'),
  SV('PF', 'fr', 'tahitinews', 'Tahiti News', 'https://www.tahitinews.co/feed/'),

  S('GU', 'en', 'kuam', 'KUAM News (Guam)', 'https://www.kuam.com/rss'), // ? 200 dar fără elemente parsabile
  S('GU', 'en', 'guampdn', 'Pacific Daily News (Guam)', 'http://www.guampdn.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&k%5B%5D=%23topstory'), // ? 429 la verificare
  S('GU', 'en', 'postguam', 'The Guam Daily Post', 'http://www.postguam.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&k%5B%5D=%23topstory'), // ? 429 la verificare
  S('FM', 'en', 'fsmnews', 'FSM News (Micronesia)', 'https://fsmnews.fm/feed/'), // ? fără răspuns la verificare
  S('PW', 'en', 'palauwave', 'Palau Wave', 'https://www.palauwave.com/feed/'), // ? fără răspuns la verificare
  S('KI', 'en', 'kiribatinews', 'Kiribati News', 'https://www.kiribatinews.com/feed/'), // ? fără răspuns la verificare
  // (Nauru, Tuvalu, Niue, Tokelau: nu s-a găsit niciun feed RSS public – omise)
];
