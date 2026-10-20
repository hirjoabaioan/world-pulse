'use strict';
// Surse RSS Orientul Mijlociu (etapa 2a). verified = fetch confirmat la data cercetării (2026-09-27).
// NOTĂ: la data cercetării mediul de cercetare avea egress blocat către domeniile de știri
// (proxy), deci NICIUN feed nu a putut fi descărcat => toate verified: false.
// URL-urile provin din liste publice de pe GitHub (plenaryapp/awesome-rss-feeds – Iran,
// yavuz/news-feed-list-of-countries, danielrosehill/Israel-News-RSS-Feeds OPML), pagini RSS ale
// publicațiilor și rezultate de căutare. Rulați o verificare automată (fetch + parse) înainte de activare.
// Marcaj „// ?” = URL cu încredere mai mică (tipar standard CMS / pagină RSS găsită, dar feed-ul exact nesigur).
// „(media de stat)” / „(semi-oficial)” = controlat sau afiliat guvernului; tratați ca poziție oficială.
// Al Jazeera (EN) există deja în index.js. Surse pan-regionale cu sediu în afara regiunii
// (Middle East Eye, Al-Monitor, Asharq Al-Awsat – Londra/SUA) sunt omise intenționat.

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
// Spre deosebire de europe.js (unde O() e fixat pe 'EU'), aici stratul oficial e atașat țării gazdă.
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

module.exports = [
  // ---------------------------------------------------------------- Bahrain
  S('BH', 'en', 'bna', 'Bahrain News Agency – BNA (state media)', 'https://www.bna.bh/en/RSSFeeds.aspx?cms=iQRpheuphYtJ6pyXUGiNqqtA5DItoRVa'), // ? pagină index RSS, poate necesita feed pe categorie
  S('BH', 'en', 'gdn', 'Gulf Daily News', 'https://www.gdnonline.com/rss'), // ?

  // ---------------------------------------------------------------- Egipt
  S('EG', 'en', 'ahram-online', 'Ahram Online (state media)', 'https://english.ahram.org.eg/rss/'), // ? Al-Ahram e deținut de stat
  S('EG', 'en', 'dailynewsegypt', 'Daily News Egypt', 'https://www.dailynewsegypt.com/feed/'), // ?
  S('EG', 'en', 'egyptindependent', 'Egypt Independent', 'https://www.egyptindependent.com/feed/'), // ? pagina /rss_feed/ confirmată
  S('EG', 'ar', 'almasryalyoum', 'Al-Masry Al-Youm', 'https://www.almasryalyoum.com/rss/rssfeed'),
  S('EG', 'en', 'madamasr', 'Mada Masr', 'https://www.madamasr.com/en/feed/'), // ? site blocat în Egipt din 2017

  // ---------------------------------------------------------------- Iran
  S('IR', 'en', 'tehrantimes', 'Tehran Times (state media)', 'https://www.tehrantimes.com/rss'),
  S('IR', 'en', 'irna', 'IRNA English (state media)', 'https://en.irna.ir/rss'), // ?
  S('IR', 'fa', 'isna', 'ISNA (semi-oficial)', 'https://www.isna.ir/rss'),
  S('IR', 'fa', 'mehr', 'Mehr News (semi-oficial)', 'https://www.mehrnews.com/rss'),
  S('IR', 'fa', 'khabaronline', 'Khabar Online', 'https://www.khabaronline.ir/rss'),

  // ---------------------------------------------------------------- Irak
  S('IQ', 'en', 'shafaq', 'Shafaq News', 'https://shafaq.com/rss/en'), // ? pagina /en/rss confirmată
  S('IQ', 'en', 'rudaw', 'Rudaw English', 'https://www.rudaw.net/english/rss'), // ? pagina /english/rss-categories confirmată
  S('IQ', 'en', 'kurdistan24', 'Kurdistan24', 'https://www.kurdistan24.net/en/rss'), // ?

  // ---------------------------------------------------------------- Israel
  S('IL', 'en', 'timesofisrael', 'The Times of Israel', 'https://www.timesofisrael.com/feed/'),
  S('IL', 'en', 'haaretz', 'Haaretz – Latest headlines', 'https://www.haaretz.com/srv/haaretz-latest-headlines'), // paywall parțial
  S('IL', 'en', 'jpost', 'The Jerusalem Post', 'https://rss.jpost.com/rss/rssfeedsfrontpage.aspx'),
  S('IL', 'he', 'ynet', 'Ynet', 'https://www.ynet.co.il/Integration/StoryRss2.xml'),
  S('IL', 'he', 'israelhayom', 'Israel Hayom', 'https://www.israelhayom.co.il/rss.xml'),
  O('IL', 'en', 'idf', 'IDF – Comunicate', 'https://www.idf.il/en/rss/'), // ?
  O('IL', 'en', 'pmo', 'Biroul Prim-ministrului Israelului', 'https://www.gov.il/en/departments/prime_ministers_office/rss'), // ?

  // ---------------------------------------------------------------- Iordania
  S('JO', 'en', 'jordantimes', 'The Jordan Times', 'https://jordantimes.com/rss.xml'), // ?
  S('JO', 'en', 'royanews', 'Roya News English', 'https://en.royanews.tv/rss'), // ?
  S('JO', 'en', 'ammon', 'Ammon News', 'https://en.ammonnews.net/rss'), // ?

  // ---------------------------------------------------------------- Kuweit
  S('KW', 'en', 'arabtimes', 'Arab Times', 'https://www.arabtimesonline.com/rssFeed/0/'), // ? tipar din pagina /rss/
  S('KW', 'en', 'kuwaittimes', 'Kuwait Times', 'https://kuwaittimes.com/feed/'), // ?

  // ---------------------------------------------------------------- Liban
  S('LB', 'en', 'lorienttoday', "L'Orient Today", 'https://today.lorientlejour.com/rss'), // ?
  S('LB', 'fr', 'lorientlejour', "L'Orient-Le Jour", 'https://www.lorientlejour.com/rss'), // ?
  S('LB', 'en', 'naharnet', 'Naharnet', 'https://www.naharnet.com/stories/en/rss'), // ?
  S('LB', 'en', 'nna', 'National News Agency – NNA (state media)', 'https://www.nna-leb.gov.lb/en/rss'), // ?

  // ---------------------------------------------------------------- Oman
  S('OM', 'en', 'omanobserver', 'Oman Observer (state media)', 'https://www.omanobserver.om/rss'), // ? pagină index RSS
  S('OM', 'en', 'muscatdaily', 'Muscat Daily', 'https://www.muscatdaily.com/feed/'), // ?

  // ---------------------------------------------------------------- Palestina
  S('PS', 'en', 'wafa', 'WAFA (state media – Palestinian Authority)', 'https://english.wafa.ps/rss'), // ?
  S('PS', 'en', 'palestinechronicle', 'The Palestine Chronicle', 'https://www.palestinechronicle.com/feed/'), // redacție în SUA, acoperire PS
  O('PS', 'en', 'unrwa', 'UNRWA – Newsroom', 'https://www.unrwa.org/newsroom/rss.xml'),
  O('PS', 'en', 'ocha-opt', 'OCHA oPt – updates (via ReliefWeb)', 'https://reliefweb.int/updates/rss.xml?advanced-search=%28PC180%29'), // ? PC180 = oPt pe ReliefWeb

  // ---------------------------------------------------------------- Qatar
  S('QA', 'ar', 'aljazeera-ar', 'Al Jazeera Arabic', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9'), // ? finanțat de statul qatarez
  S('QA', 'en', 'gulftimes', 'Gulf Times', 'https://www.gulf-times.com/rssFeed/1'), // ? pagina /Rss/Index confirmată
  S('QA', 'en', 'peninsula', 'The Peninsula', 'https://thepeninsulaqatar.com/rss'), // ?

  // ---------------------------------------------------------------- Arabia Saudită
  S('SA', 'en', 'arabnews', 'Arab News', 'https://www.arabnews.com/rss.xml'), // ? pagina /rss confirmată
  S('SA', 'en', 'saudigazette', 'Saudi Gazette', 'https://saudigazette.com.sa/rssFeed/74'), // ?
  S('SA', 'ar', 'spa', 'SPA – Saudi Press Agency (state media)', 'https://www.spa.gov.sa/rss.xml'), // ? site refăcut 2023

  // ---------------------------------------------------------------- Siria
  S('SY', 'en', 'sana', 'SANA (state media)', 'https://sana.sy/en/?feed=rss2'),
  S('SY', 'en', 'enabbaladi', 'Enab Baladi English', 'https://english.enabbaladi.net/feed/'), // ?

  // ---------------------------------------------------------------- Emiratele Arabe Unite
  S('AE', 'en', 'thenational', 'The National (state media)', 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml'), // ? tipar Arc XP
  S('AE', 'en', 'gulfnews', 'Gulf News', 'https://gulfnews.com/stories.rss'), // ?
  S('AE', 'en', 'khaleejtimes', 'Khaleej Times', 'https://www.khaleejtimes.com/arc/outboundfeeds/rss/?outputType=xml'), // ? tipar Arc XP
  S('AE', 'en', 'alarabiya', 'Al Arabiya English', 'https://english.alarabiya.net/rss/en_default.xml'), // ? alternativă: /feed/flipboard/en.xml; deținut saudit

  // ---------------------------------------------------------------- Yemen
  S('YE', 'en', 'saba', 'Saba – Sanaa (state media, Houthi-controlled)', 'https://www.saba.ye/en/rss'), // ? pagina /en/showrss confirmată
  S('YE', 'ar', 'marebpress', 'Mareb Press', 'https://marebpress.net/news_rss.php'),
];
