'use strict';
// Surse RSS Africa (etapa 2b). verified = fetch confirmat la data cercetării (2026-09-27).
// NOTĂ: mediul de cercetare avea egress blocat către domeniile de știri (proxy connect_rejected pentru
// allafrica.com, feedspot, atlasflux etc.), deci NICIUN feed nu a putut fi descărcat => toate verified: false.
// URL-urile provin din: plenaryapp/awesome-rss-feeds (NG, ZA), benjam0402/mali-conflict-monitor
// (tools/public_sources.json – Sahel), Emeks30219/News-Aggregator (NG), pagini RSS ale publicațiilor și
// rezultate de căutare. Rulați o verificare automată (fetch + parse) înainte de activare.
// AllAfrica: tipar confirmat https://allafrica.com/tools/headlines/rdf/<slug>/headlines.rdf (EN) și
// https://fr.allafrica.com/tools/headlines/rdf/<slug>/headlines.rdf (FR); slug-uri confirmate: southafrica,
// sierraleone, nigeria, congo_kinshasa; restul urmează convenția de slug AllAfrica (nume fără spații).
// Marcaj „// ?” = URL cu încredere mai mică (tipar standard / slug nesigur / posibil mutat).
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
// AllAfrica pe țară (EN sau FR)
const AA = (country, slug, lang = 'en', extra = {}) =>
  S(country, lang, `allafrica${lang === 'fr' ? '-fr' : ''}`, `AllAfrica – ${slug}${lang === 'fr' ? ' (FR)' : ''}`,
    `https://${lang === 'fr' ? 'fr.' : ''}allafrica.com/tools/headlines/rdf/${slug}/headlines.rdf`,
    { intervalMin: 30, ...extra });
const W = { scope: 'world' };

module.exports = [
  // ---------------------------------------------------------------- Pan-african (news, scope world)
  S('CG', 'en', 'africanews', 'Africanews', 'https://www.africanews.com/feed/rss', W),
  S('FR', 'en', 'theafricareport', 'The Africa Report', 'https://www.theafricareport.com/feed/', W),
  S('FR', 'fr', 'rfi-afrique', 'RFI Afrique', 'https://www.rfi.fr/fr/afrique/rss', W),
  S('FR', 'en', 'rfi-africa', 'RFI Africa (EN)', 'https://www.rfi.fr/en/africa/rss', W),
  S('FR', 'fr', 'france24-afrique', 'France 24 Afrique', 'https://www.france24.com/fr/afrique/rss', W),
  S('FR', 'fr', 'lemonde-afrique', 'Le Monde Afrique', 'https://www.lemonde.fr/afrique/rss_full.xml', W),
  S('GB', 'fr', 'bbc-afrique', 'BBC Afrique', 'https://feeds.bbci.co.uk/afrique/rss.xml', W), // ? tipar BBC World Service, neconfirmat
  S('NG', 'en', 'humangle', 'HumAngle (conflict Sahel / Lacul Ciad)', 'https://humanglemedia.com/feed/', W), // ? WordPress /feed standard
  S('ZA', 'en', 'allafrica-latest', 'AllAfrica – Latest', 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', { ...W, intervalMin: 20 }),
  S('SN', 'fr', 'allafrica-westafrica-fr', 'AllAfrica – Afrique de l\'Ouest (FR)', 'https://fr.allafrica.com/tools/headlines/rdf/westafrica/headlines.rdf', { ...W, intervalMin: 30 }),
  S('KE', 'en', 'allafrica-eastafrica', 'AllAfrica – East Africa', 'https://allafrica.com/tools/headlines/rdf/eastafrica/headlines.rdf', { ...W, intervalMin: 30 }),
  S('CM', 'en', 'allafrica-centralafrica', 'AllAfrica – Central Africa', 'https://allafrica.com/tools/headlines/rdf/centralafrica/headlines.rdf', { ...W, intervalMin: 30 }),
  S('ZA', 'en', 'allafrica-southernafrica', 'AllAfrica – Southern Africa', 'https://allafrica.com/tools/headlines/rdf/southernafrica/headlines.rdf', { ...W, intervalMin: 30 }),

  // ---------------------------------------------------------------- Oficial (ONU / organizații)
  O('UN', 'en', 'unnews-africa', 'UN News – Africa', 'https://news.un.org/feed/subscribe/en/news/region/africa/feed/rss.xml', W),
  O('UN', 'fr', 'onuinfo-afrique', 'ONU Info – Afrique', 'https://news.un.org/feed/subscribe/fr/news/region/africa/feed/rss.xml', W),
  // (Uniunea Africană, MONUSCO, UNMISS, OMS-AFRO: nu s-a găsit URL RSS concret – omise)

  // ---------------------------------------------------------------- Nigeria
  AA('NG', 'nigeria'),
  S('NG', 'en', 'premiumtimes', 'Premium Times', 'https://www.premiumtimesng.com/feed'),
  S('NG', 'en', 'punch', 'Punch', 'https://punchng.com/feed/'),
  S('NG', 'en', 'vanguard', 'Vanguard', 'https://www.vanguardngr.com/feed/'),
  S('NG', 'en', 'guardian-ng', 'The Guardian Nigeria', 'https://guardian.ng/feed/'),
  S('NG', 'en', 'dailypost', 'Daily Post Nigeria', 'https://dailypost.ng/feed'),
  S('NG', 'en', 'saharareporters', 'Sahara Reporters', 'http://saharareporters.com/feeds/latest/feed'), // ? URL vechi (http)

  // ---------------------------------------------------------------- Africa de Sud
  AA('ZA', 'southafrica'),
  S('ZA', 'en', 'news24', 'News24 – Top Stories', 'http://feeds.news24.com/articles/news24/TopStories/rss'),
  S('ZA', 'en', 'dailymaverick', 'Daily Maverick', 'https://www.dailymaverick.co.za/dmrss/'),
  S('ZA', 'en', 'timeslive', 'TimesLIVE', 'https://www.timeslive.co.za/rss/'),
  S('ZA', 'en', 'citizen', 'The Citizen', 'https://citizen.co.za/feed/'),
  S('ZA', 'en', 'ewn', 'Eyewitness News – Latest', 'https://ewn.co.za/RSS%20Feeds/Latest%20News'), // ? posibil mutat

  // ---------------------------------------------------------------- Kenya
  AA('KE', 'kenya'),
  S('KE', 'en', 'nation', 'Nation Africa', 'https://nation.africa/kenya/rss.xml'),
  S('KE', 'en', 'standard', 'The Standard – Kenya', 'https://www.standardmedia.co.ke/rss/kenya.php'),

  // ---------------------------------------------------------------- Etiopia
  AA('ET', 'ethiopia'),
  S('ET', 'en', 'addisstandard', 'Addis Standard', 'https://addisstandard.com/feed/'), // ? WordPress /feed standard
  S('ET', 'en', 'borkena', 'Borkena', 'https://borkena.com/feed/'), // ? WordPress /feed standard

  // ---------------------------------------------------------------- Sudan
  AA('SD', 'sudan'),
  S('SD', 'en', 'dabanga', 'Radio Dabanga', 'https://www.dabangasudan.org/en/feed'), // ? din listări, neconfirmat direct
  S('SD', 'en', 'sudantribune', 'Sudan Tribune', 'https://sudantribune.com/feed/'), // ? WordPress /feed standard
  O('SD', 'en', 'reliefweb', 'ReliefWeb – Sudan Updates', 'https://reliefweb.int/updates/rss.xml?advanced-search=(PC220)', { intervalMin: 60 }), // ? tipar ReliefWeb RSS

  // ---------------------------------------------------------------- Sudanul de Sud
  AA('SS', 'southsudan'), // ? slug
  S('SS', 'en', 'tamazuj', 'Radio Tamazuj', 'https://radiotamazuj.org/en/rss/news.xml'),
  S('SS', 'en', 'tamazuj-mostread', 'Radio Tamazuj – Most read', 'https://www.radiotamazuj.org/en/category/most-read/feed'), // ?
  O('SS', 'en', 'reliefweb', 'ReliefWeb – South Sudan Updates', 'https://reliefweb.int/updates/rss.xml?advanced-search=(PC8657)', { intervalMin: 60 }), // ? tipar ReliefWeb RSS

  // ---------------------------------------------------------------- Somalia
  AA('SO', 'somalia'),
  S('SO', 'en', 'hiiraan', 'Hiiraan Online', 'http://rss.hiiraan.com/rss.xml'), // ? URL vechi (feedly)
  // (Garowe Online: nu s-a găsit URL RSS)

  // ---------------------------------------------------------------- RD Congo
  AA('CD', 'congo_kinshasa'),
  AA('CD', 'congo_kinshasa', 'fr'),
  S('CD', 'fr', 'radiookapi', 'Radio Okapi', 'https://www.radiookapi.net/rss.xml'), // ? tipar Drupal, neconfirmat

  // ---------------------------------------------------------------- Mali
  AA('ML', 'mali', 'fr'),
  S('ML', 'fr', 'studiotamani', 'Studio Tamani', 'https://www.studiotamani.org/feed'),
  S('ML', 'fr', 'journaldumali', 'Journal du Mali', 'https://www.journaldumali.com/feed/'),
  S('ML', 'fr', 'maliweb', 'Maliweb', 'https://www.maliweb.net/rss/latest-posts'),
  S('ML', 'fr', 'malijet', 'Malijet', 'https://malijet.com/rss'),
  S('ML', 'fr', 'bamada', 'Bamada', 'https://bamada.net/feed/'),

  // ---------------------------------------------------------------- Burkina Faso
  AA('BF', 'burkinafaso', 'fr'), // ? slug
  S('BF', 'fr', 'lefaso', 'LeFaso.net', 'https://lefaso.net/spip.php?page=backend'),
  S('BF', 'fr', 'burkina24', 'Burkina 24', 'https://burkina24.com/feed/'),

  // ---------------------------------------------------------------- Niger
  AA('NE', 'niger', 'fr'),
  S('NE', 'fr', 'studiokalangou', 'Studio Kalangou', 'https://www.studiokalangou.org/feed/'),

  // ---------------------------------------------------------------- Ciad
  AA('TD', 'chad', 'fr'),
  S('TD', 'fr', 'tchadinfos', 'Tchadinfos', 'https://tchadinfos.com/feed/'),

  // ---------------------------------------------------------------- Mauritania
  AA('MR', 'mauritania', 'fr'),
  S('MR', 'fr', 'saharamedias', 'Sahara Médias', 'https://fr.saharamedias.net/feed/'),

  // ---------------------------------------------------------------- Republica Centrafricană
  AA('CF', 'centralafricanrepublic', 'fr'), // ? slug

  // ---------------------------------------------------------------- Camerun
  AA('CM', 'cameroon', 'fr'),
  AA('CM', 'cameroon'),

  // ---------------------------------------------------------------- Mozambic
  AA('MZ', 'mozambique'),
  S('MZ', 'pt', 'opais', 'O País', 'https://opais.co.mz/feed/'), // ? WordPress /feed standard

  // ---------------------------------------------------------------- Libia
  AA('LY', 'libya'),
  S('LY', 'en', 'libyaherald', 'Libya Herald', 'https://libyaherald.com/feed/'),

  // ---------------------------------------------------------------- Tunisia
  AA('TN', 'tunisia', 'fr'),
  S('TN', 'fr', 'kapitalis', 'Kapitalis', 'https://kapitalis.com/feed/'), // ? WordPress /feed standard

  // ---------------------------------------------------------------- Algeria
  AA('DZ', 'algeria', 'fr'),
  AA('DZ', 'algeria'),

  // ---------------------------------------------------------------- Maroc
  AA('MA', 'morocco'),
  S('MA', 'en', 'moroccoworldnews', 'Morocco World News', 'https://www.moroccoworldnews.com/feed/'),
  S('MA', 'en', 'hespress-en', 'Hespress English', 'https://en.hespress.com/feed'), // ?

  // ---------------------------------------------------------------- Ghana
  AA('GH', 'ghana'),
  S('GH', 'en', 'myjoyonline', 'MyJoyOnline', 'https://www.myjoyonline.com/feed/'), // ? WordPress /feed standard
  S('GH', 'en', 'citinewsroom', 'Citi Newsroom', 'https://citinewsroom.com/feed/'), // ? există pagină „RSS Service”

  // ---------------------------------------------------------------- Senegal
  AA('SN', 'senegal', 'fr'),
  AA('SN', 'senegal'),

  // ---------------------------------------------------------------- Uganda
  AA('UG', 'uganda'),

  // ---------------------------------------------------------------- Rwanda
  AA('RW', 'rwanda'),
  S('RW', 'en', 'newtimes', 'The New Times', 'https://www.newtimes.co.rw/rss'),

  // ---------------------------------------------------------------- Tanzania
  AA('TZ', 'tanzania'),
  S('TZ', 'en', 'thecitizen', 'The Citizen Tanzania', 'https://www.thecitizen.co.tz/service/rss'), // ? din rezumat de căutare

  // ---------------------------------------------------------------- Zimbabwe
  AA('ZW', 'zimbabwe'),
  S('ZW', 'en', 'zimlive', 'ZimLive', 'https://www.zimlive.com/feed/'), // ? WordPress /feed standard
  S('ZW', 'en', 'herald', 'The Herald', 'https://www.herald.co.zw/feed/'), // ? WordPress /feed standard

  // ---------------------------------------------------------------- Madagascar
  AA('MG', 'madagascar', 'fr'),
  S('MG', 'fr', 'lexpress-mg', 'L\'Express de Madagascar', 'https://lexpress.mg/feeds/posts/default'), // ? din rezumat de căutare

  // ---------------------------------------------------------------- Burundi
  AA('BI', 'burundi', 'fr'),
  AA('BI', 'burundi'),

  // ---------------------------------------------------------------- Côte d'Ivoire
  AA('CI', 'cotedivoire', 'fr'), // ? slug

  // ---------------------------------------------------------------- Țări mai mici (AllAfrica pe țară)
  AA('AO', 'angola'),
  AA('BJ', 'benin', 'fr'),
  AA('BW', 'botswana'),
  AA('CV', 'capeverde'), // ? slug
  AA('KM', 'comoros', 'fr'),
  AA('CG', 'congo_brazzaville', 'fr'), // ? slug
  AA('DJ', 'djibouti', 'fr'),
  AA('GQ', 'equatorialguinea'), // ? slug
  AA('ER', 'eritrea'),
  AA('SZ', 'swaziland'), // ? slug (AllAfrica folosea „swaziland”; posibil „eswatini”)
  AA('GA', 'gabon', 'fr'),
  AA('GM', 'gambia'),
  AA('GN', 'guinea', 'fr'),
  AA('GW', 'guineabissau'), // ? slug
  AA('LS', 'lesotho'),
  AA('LR', 'liberia'),
  AA('MW', 'malawi'),
  AA('MU', 'mauritius'),
  AA('NA', 'namibia'),
  AA('ST', 'saotomeprincipe'), // ? slug
  AA('SC', 'seychelles'),
  AA('SL', 'sierraleone'),
  AA('TG', 'togo', 'fr'),
  AA('ZM', 'zambia'),
];
