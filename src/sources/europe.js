'use strict';
// Surse RSS Europa (etapa 1). verified = fetch confirmat la data cercetării (2026-09-27).
// NOTĂ: la data cercetării mediul de cercetare avea egress blocat către toate domeniile de știri
// (proxy 403 / EGRESS_BLOCKED), deci NICIUN feed nu a putut fi descărcat => toate verified: false.
// URL-urile provin din listele publice (awesome-rss-feeds pe GitHub, pagini RSS ale publicațiilor,
// rezultate de căutare). Rulați o verificare automată (fetch + parse) înainte de activare.
// Marcaj „// ?” = URL cu încredere mai mică (tipar standard, dar nesigur / posibil mutat).

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
const O = (slug, name, url, extra = {}) => ({
  id: `eu-${slug}`,
  name,
  country: 'EU',
  lang: 'en',
  layer: 'official',
  type: 'rss',
  url,
  intervalMin: 30,
  verified: false,
  ...extra,
});

module.exports = [
  // ---------------------------------------------------------------- Pan-european (news)
  S('EU', 'en', 'euronews', 'Euronews', 'https://www.euronews.com/rss?format=mrss&level=theme&name=news'),
  S('EU', 'en', 'politico-europe', 'Politico Europe', 'https://www.politico.eu/feed/'),
  S('EU', 'en', 'euobserver', 'EUobserver', 'https://xml.euobserver.com/rss.xml'), // ? posibil paywall parțial
  S('EU', 'en', 'euractiv', 'Euractiv', 'https://www.euractiv.com/feed/'),
  S('EU', 'en', 'balkaninsight', 'Balkan Insight (BIRN)', 'https://balkaninsight.com/feed/'),

  // ---------------------------------------------------------------- Oficial (instituții europene)
  O('ec-presscorner', 'European Commission – Press corner', 'https://ec.europa.eu/commission/presscorner/api/rss'),
  O('ep-news', 'Parlamentul European – Top stories', 'https://www.europarl.europa.eu/rss/doc/top-stories/en.xml'), // ?
  O('ep-texts-adopted', 'Parlamentul European – Texte adoptate', 'https://www.europarl.europa.eu/rss/doc/texts-adopted/en.xml', { intervalMin: 60 }),
  O('consilium-press', 'EU Council – Press releases', 'https://www.consilium.europa.eu/en/rss/pressreleases.ashx'), // ?
  O('nato-news', 'NATO – News', 'https://www.nato.int/cps/rss/en/natohq/rssFeed.xsl/rssFeed.xml'), // ? site NATO restructurat 2025
  O('osce-news', 'OSCE – News', 'https://www.osce.org/rss/news'), // ? OSCE s-a mutat pe news.osce.org

  // ---------------------------------------------------------------- România
  S('RO', 'ro', 'digi24', 'Digi24', 'https://www.digi24.ro/rss'),
  S('RO', 'ro', 'hotnews', 'HotNews', 'https://www.hotnews.ro/feed'),
  S('RO', 'ro', 'agerpres', 'Agerpres', 'https://www.agerpres.ro/rss'), // ?
  // (G4Media există deja în index.js)

  // ---------------------------------------------------------------- Germania
  S('DE', 'de', 'tagesschau', 'tagesschau.de', 'https://www.tagesschau.de/xml/rss2/'),
  S('DE', 'de', 'spiegel', 'Der Spiegel', 'https://www.spiegel.de/schlagzeilen/index.rss'),
  S('DE', 'de', 'faz', 'FAZ.NET', 'https://www.faz.net/rss/aktuell/'),
  S('DE', 'de', 'zeit', 'ZEIT ONLINE', 'https://newsfeed.zeit.de/index'),

  // ---------------------------------------------------------------- Franța
  S('FR', 'fr', 'lemonde', 'Le Monde – À la une', 'https://www.lemonde.fr/rss/une.xml'),
  S('FR', 'fr', 'franceinfo', 'Franceinfo', 'https://www.francetvinfo.fr/titres.rss'),
  S('FR', 'fr', 'lefigaro', 'Le Figaro', 'https://www.lefigaro.fr/rss/figaro_actualites.xml'),
  S('FR', 'fr', 'ouestfrance', 'Ouest-France', 'https://www.ouest-france.fr/rss-en-continu.xml'),

  // ---------------------------------------------------------------- Italia
  S('IT', 'it', 'ansa', 'ANSA', 'https://www.ansa.it/sito/ansait_rss.xml'),
  S('IT', 'it', 'repubblica', 'la Repubblica', 'https://www.repubblica.it/rss/homepage/rss2.0.xml'),
  S('IT', 'it', 'corriere', 'Corriere della Sera', 'https://xml2.corriereobjects.it/rss/homepage.xml'),
  S('IT', 'it', 'ilpost', 'Il Post', 'https://www.ilpost.it/feed/'),

  // ---------------------------------------------------------------- Spania
  S('ES', 'es', 'elpais', 'El País – Portada', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada'),
  S('ES', 'es', 'rtve', 'RTVE Noticias', 'https://api2.rtve.es/rss/temas_noticias.xml'),
  S('ES', 'es', 'elmundo', 'El Mundo', 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml'),
  S('ES', 'es', 'eldiario', 'elDiario.es', 'https://www.eldiario.es/rss/'),

  // ---------------------------------------------------------------- Portugalia
  S('PT', 'pt', 'rtp', 'RTP Notícias', 'https://www.rtp.pt/noticias/rss'),
  S('PT', 'pt', 'observador', 'Observador', 'https://observador.pt/feed/'),
  S('PT', 'pt', 'publico', 'Público', 'https://feeds.feedburner.com/PublicoRSS'),

  // ---------------------------------------------------------------- Țările de Jos
  S('NL', 'nl', 'nos', 'NOS Nieuws', 'https://feeds.nos.nl/nosnieuwsalgemeen'),
  S('NL', 'nl', 'nunl', 'NU.nl', 'https://www.nu.nl/rss/Algemeen'),
  S('NL', 'nl', 'volkskrant', 'de Volkskrant', 'https://www.volkskrant.nl/voorpagina/rss.xml'),

  // ---------------------------------------------------------------- Belgia
  S('BE', 'nl', 'vrtnws', 'VRT NWS', 'https://www.vrt.be/vrtnws/nl.rss.articles.xml'),
  S('BE', 'fr', 'rtbf', 'RTBF Info', 'https://rss.rtbf.be/article/rss/highlight_rtbfinfo_info-accueil.xml'), // ?
  S('BE', 'en', 'brusselstimes', 'The Brussels Times', 'https://www.brusselstimes.com/feed'),

  // ---------------------------------------------------------------- Luxemburg
  S('LU', 'en', 'rtl-today', 'RTL Today', 'https://today.rtl.lu/rss/headlines'), // ?
  S('LU', 'en', 'luxtimes', 'Luxembourg Times', 'https://www.luxtimes.lu/rss'), // ?

  // ---------------------------------------------------------------- Austria
  S('AT', 'de', 'orf', 'ORF.at', 'https://rss.orf.at/news.xml'),
  S('AT', 'de', 'derstandard', 'Der Standard', 'https://www.derstandard.at/rss'),
  S('AT', 'de', 'diepresse', 'Die Presse', 'https://www.diepresse.com/rss/'), // ?

  // ---------------------------------------------------------------- Irlanda
  S('IE', 'en', 'rte', 'RTÉ News', 'https://www.rte.ie/news/rss/news-headlines.xml'),
  S('IE', 'en', 'thejournal', 'TheJournal.ie', 'https://www.thejournal.ie/feed/'),
  S('IE', 'en', 'irishtimes', 'The Irish Times', 'https://www.irishtimes.com/arc/outboundfeeds/feed-irish-news/'), // ?

  // ---------------------------------------------------------------- Danemarca
  S('DK', 'da', 'dr', 'DR Nyheder', 'https://www.dr.dk/nyheder/service/feeds/allenyheder'),
  S('DK', 'da', 'tv2', 'TV 2 Nyheder', 'https://feeds.tv2.dk/nyheder/rss'),

  // ---------------------------------------------------------------- Suedia
  S('SE', 'sv', 'svt', 'SVT Nyheter', 'https://www.svt.se/nyheter/rss.xml'),
  S('SE', 'sv', 'dn', 'Dagens Nyheter', 'https://www.dn.se/rss/'),
  S('SE', 'sv', 'aftonbladet', 'Aftonbladet – Senaste nytt', 'https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/'),

  // ---------------------------------------------------------------- Finlanda
  S('FI', 'fi', 'yle', 'Yle Uutiset', 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss'),
  S('FI', 'en', 'yle-news', 'Yle News (EN)', 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS'),
  S('FI', 'fi', 'hs', 'Helsingin Sanomat', 'https://www.hs.fi/rss/tuoreimmat.xml'),

  // ---------------------------------------------------------------- Estonia
  S('EE', 'en', 'err-news', 'ERR News', 'https://news.err.ee/rss'),
  S('EE', 'et', 'err', 'ERR Uudised', 'https://www.err.ee/rss'),

  // ---------------------------------------------------------------- Letonia
  S('LV', 'en', 'lsm-eng', 'LSM (EN)', 'https://eng.lsm.lv/rss/'),
  S('LV', 'lv', 'lsm', 'LSM.lv', 'https://www.lsm.lv/rss/'), // ?

  // ---------------------------------------------------------------- Lituania
  S('LT', 'lt', 'lrt', 'LRT', 'https://www.lrt.lt/?rss'),
  S('LT', 'lt', '15min', '15min.lt', 'https://www.15min.lt/rss'),
  S('LT', 'lt', 'delfi', 'Delfi.lt', 'https://www.delfi.lt/rss/feeds/daily.xml'), // ?

  // ---------------------------------------------------------------- Polonia
  S('PL', 'pl', 'pap', 'PAP', 'https://www.pap.pl/rss.xml'),
  S('PL', 'pl', 'tvn24', 'TVN24 – najnowsze', 'https://tvn24.pl/najnowsze.xml'),
  S('PL', 'pl', 'rp', 'Rzeczpospolita', 'https://www.rp.pl/rss/1019'),
  S('PL', 'pl', 'rmf24', 'RMF24', 'https://www.rmf24.pl/feed'),

  // ---------------------------------------------------------------- Cehia
  S('CZ', 'cs', 'ct24', 'ČT24', 'https://ct24.ceskatelevize.cz/rss/hlavni-zpravy'),
  S('CZ', 'cs', 'irozhlas', 'iROZHLAS', 'https://www.irozhlas.cz/rss/irozhlas'),
  S('CZ', 'cs', 'novinky', 'Novinky.cz', 'https://www.novinky.cz/rss'),

  // ---------------------------------------------------------------- Slovacia
  S('SK', 'sk', 'sme', 'SME', 'https://www.sme.sk/rss-title'),
  S('SK', 'sk', 'aktuality', 'Aktuality.sk', 'https://www.aktuality.sk/rss/'),
  S('SK', 'sk', 'dennikn', 'Denník N', 'https://dennikn.sk/feed/'),

  // ---------------------------------------------------------------- Ungaria
  S('HU', 'hu', 'telex', 'Telex', 'https://telex.hu/rss'),
  S('HU', 'hu', '444', '444', 'https://444.hu/feed'),
  S('HU', 'hu', 'hvg', 'HVG', 'https://hvg.hu/rss'),
  S('HU', 'hu', 'index', 'Index – 24 óra', 'https://index.hu/24ora/rss/'),

  // ---------------------------------------------------------------- Slovenia
  S('SI', 'sl', 'rtvslo', 'RTV SLO', 'https://www.rtvslo.si/feeds/00.xml'),
  S('SI', 'sl', '24ur', '24ur.com', 'https://www.24ur.com/rss'),

  // ---------------------------------------------------------------- Croația
  S('HR', 'hr', 'index', 'Index.hr', 'https://www.index.hr/rss'),
  S('HR', 'hr', 'vecernji', 'Večernji list', 'https://www.vecernji.hr/feeds/latest'),
  S('HR', 'hr', 'jutarnji', 'Jutarnji list', 'https://www.jutarnji.hr/feed'), // ?

  // ---------------------------------------------------------------- Bulgaria
  S('BG', 'en', 'novinite', 'Novinite', 'https://www.novinite.com/services/news_rdf.php'),
  S('BG', 'bg', 'dnevnik', 'Dnevnik', 'https://www.dnevnik.bg/rss/'),
  S('BG', 'bg', 'bnr', 'BNR (Radio Bulgaria)', 'https://bnr.bg/rss'), // ?

  // ---------------------------------------------------------------- Grecia
  S('GR', 'el', 'ertnews', 'ERT News', 'https://www.ertnews.gr/feed/'),
  S('GR', 'el', 'ingr', 'in.gr', 'https://www.in.gr/feed/'),
  S('GR', 'en', 'ekathimerini', 'eKathimerini', 'https://www.ekathimerini.com/rss'), // ?

  // ---------------------------------------------------------------- Cipru
  S('CY', 'en', 'cyprusmail', 'Cyprus Mail', 'https://cyprus-mail.com/feed/'),
  S('CY', 'en', 'incyprus', 'In-Cyprus (Philenews)', 'https://in-cyprus.philenews.com/feed/'),

  // ---------------------------------------------------------------- Malta
  S('MT', 'en', 'timesofmalta', 'Times of Malta', 'https://timesofmalta.com/rss/latest'), // ?
  S('MT', 'en', 'maltatoday', 'MaltaToday', 'https://www.maltatoday.com.mt/rss/news'), // ?
  S('MT', 'en', 'newsbook', 'Newsbook', 'https://newsbook.com.mt/en/feed/'), // ?

  // ---------------------------------------------------------------- Regatul Unit
  S('GB', 'en', 'bbc-uk', 'BBC News – UK', 'https://feeds.bbci.co.uk/news/uk/rss.xml'),
  S('GB', 'en', 'guardian-uk', 'The Guardian – UK', 'https://www.theguardian.com/uk-news/rss'),
  S('GB', 'en', 'skynews', 'Sky News', 'https://feeds.skynews.com/feeds/rss/home.xml'),
  S('GB', 'en', 'independent', 'The Independent – UK', 'https://www.independent.co.uk/news/uk/rss'),

  // ---------------------------------------------------------------- Norvegia
  S('NO', 'no', 'nrk', 'NRK – Toppsaker', 'https://www.nrk.no/toppsaker.rss'),
  S('NO', 'no', 'vg', 'VG', 'https://www.vg.no/rss/feed'),
  S('NO', 'no', 'aftenposten', 'Aftenposten', 'https://www.aftenposten.no/rss'), // ?

  // ---------------------------------------------------------------- Elveția
  S('CH', 'de', 'srf', 'SRF News', 'https://www.srf.ch/news/bnf/rss/1646'),
  S('CH', 'de', 'nzz', 'NZZ – Neueste', 'https://www.nzz.ch/recent.rss'),
  S('CH', 'en', 'swissinfo', 'Swissinfo', 'https://www.swissinfo.ch/eng/rss'), // ?

  // ---------------------------------------------------------------- Islanda
  S('IS', 'is', 'ruv', 'RÚV Fréttir', 'https://www.ruv.is/rss/frettir'),
  S('IS', 'is', 'mbl', 'mbl.is', 'https://www.mbl.is/feeds/fp/'),
  S('IS', 'en', 'icelandmonitor', 'Iceland Monitor (mbl)', 'https://icelandmonitor.mbl.is/rss/'), // ?

  // ---------------------------------------------------------------- Ucraina
  S('UA', 'uk', 'pravda', 'Ukrainska Pravda', 'https://www.pravda.com.ua/rss/'),
  S('UA', 'en', 'unian', 'UNIAN (EN)', 'https://rss.unian.net/site/news_eng.rss'),
  S('UA', 'en', 'kyivindependent', 'The Kyiv Independent', 'https://kyivindependent.com/news-archive/rss/'), // ?
  S('UA', 'uk', 'nv', 'NV', 'https://nv.ua/rss/all.xml'),

  // ---------------------------------------------------------------- Republica Moldova
  S('MD', 'ro', 'zdg', 'Ziarul de Gardă', 'https://www.zdg.md/feed/'), // ?
  S('MD', 'ro', 'newsmaker', 'NewsMaker', 'https://newsmaker.md/ro/feed/'), // ?
  S('MD', 'ro', 'agora', 'Agora.md', 'https://agora.md/rss/news'), // ?

  // ---------------------------------------------------------------- Serbia
  S('RS', 'sr', 'n1', 'N1 Srbija', 'https://n1info.rs/feed/'), // ?
  S('RS', 'sr', 'danas', 'Danas', 'https://www.danas.rs/feed/'), // ?
  S('RS', 'sr', 'rts', 'RTS', 'https://www.rts.rs/rss/ci.html'), // ?

  // ---------------------------------------------------------------- Bosnia și Herțegovina
  S('BA', 'bs', 'klix', 'Klix.ba', 'https://www.klix.ba/rss'), // ?
  S('BA', 'bs', 'n1', 'N1 BiH', 'https://n1info.ba/feed/'), // ?

  // ---------------------------------------------------------------- Muntenegru
  S('ME', 'sr', 'vijesti', 'Vijesti', 'https://www.vijesti.me/rss'), // ?
  S('ME', 'sr', 'cdm', 'CdM', 'https://www.cdm.me/feed/'), // ?

  // ---------------------------------------------------------------- Macedonia de Nord
  S('MK', 'mk', 'meta', 'Meta.mk', 'https://meta.mk/feed/'), // ?
  S('MK', 'en', 'mia', 'MIA (EN)', 'https://mia.mk/en/rss'), // ?

  // ---------------------------------------------------------------- Albania
  S('AL', 'sq', 'topchannel', 'Top Channel', 'https://top-channel.tv/feed/'), // ?
  S('AL', 'en', 'exit', 'Exit News', 'https://exit.al/en/feed/'), // ?

  // ---------------------------------------------------------------- Kosovo
  S('XK', 'en', 'prishtinainsight', 'Prishtina Insight', 'https://prishtinainsight.com/feed/'),
  S('XK', 'sq', 'kallxo', 'Kallxo', 'https://kallxo.com/feed/'), // ?

  // ---------------------------------------------------------------- Belarus (presă independentă din exil)
  S('BY', 'be', 'belsat', 'Belsat', 'https://belsat.eu/feed'), // ?
  S('BY', 'ru', 'charter97', 'Charter97', 'https://charter97.org/rss.php'), // ?

  // ---------------------------------------------------------------- Rusia
  S('RU', 'en', 'tass', 'TASS (EN)', 'https://tass.com/rss/v2.xml'),
  S('RU', 'ru', 'meduza', 'Meduza', 'https://meduza.io/rss/all'),
  S('RU', 'ru', 'kommersant', 'Kommersant', 'https://www.kommersant.ru/RSS/main.xml'),
  S('RU', 'en', 'moscowtimes', 'The Moscow Times', 'https://www.themoscowtimes.com/rss/news'),
  // Adăugate 2026-09-29 (fetch confirmat: HTTP 200 + elemente parsabile). Presa asiatică a Rusiei
  // (Siberia + Extremul Orient) este în asia.js, secțiunea „Rusia asiatică”.
  S('RU', 'en', 'interfax', 'Interfax (EN)', 'https://www.interfax.ru/rss'), // ? versiune EN parțială
  S('RU', 'ru', 'novayagazeta', 'Novaya Gazeta Europa', 'https://novayagazeta.eu/feed/rss'), // ? publicat în exil (Riga)
  S('RU', 'ru', 'theins', 'The Insider', 'https://theins.ru/feed'), // ? publicat în exil
  S('RU', 'ru', 'rbc', 'RBC', 'https://rssexport.rbc.ru/rbcnews/news/30/full.rss'), // ? endpoint propriu rssexport
  S('RU', 'ru', 'vedomosti', 'Vedomosti', 'https://www.vedomosti.ru/rss/news'),
  S('RU', 'ru', 'lenta', 'Lenta.ru', 'https://lenta.ru/rss/news'), // ? stat apropiat (former Rambler)
  S('RU', 'ru', 'tass-ru', 'TASS (RU)', 'https://tass.ru/rss/v2.xml'),
  S('RU', 'ru', 'mid-ru', 'Russian MFA – official press releases', 'https://mid.ru/rss', { layer: 'official', intervalMin: 30 }), // ? RSS oficial, format propriu (verificat 2026-09-29)

  // ---------------------------------------------------------------- Georgia
  S('GE', 'en', 'civilge', 'Civil.ge', 'https://civil.ge/feed'), // ?
  S('GE', 'en', 'ocmedia', 'OC Media', 'https://oc-media.org/feed/'), // ?

  // ---------------------------------------------------------------- Armenia
  S('AM', 'en', 'armenpress', 'Armenpress', 'https://armenpress.am/eng/rss/news'),
  S('AM', 'en', 'newsam', 'News.am', 'https://news.am/eng/rss/'), // ?

  // ---------------------------------------------------------------- Azerbaidjan
  S('AZ', 'en', 'trend', 'Trend News Agency', 'https://en.trend.az/feeds/index.rss'), // ?
  S('AZ', 'en', 'apa', 'APA', 'https://apa.az/en/rss'), // ?

  // ---------------------------------------------------------------- Turcia
  S('TR', 'en', 'aa', 'Anadolu Agency (EN)', 'https://www.aa.com.tr/en/rss/default?cat=guncel'),
  S('TR', 'tr', 'bbc-turkce', 'BBC Türkçe', 'https://feeds.bbci.co.uk/turkce/rss.xml'),
  S('TR', 'tr', 'hurriyet', 'Hürriyet', 'https://www.hurriyet.com.tr/rss/anasayfa'),
  S('TR', 'tr', 'ntv', 'NTV', 'https://www.ntv.com.tr/gundem.rss'),
];
