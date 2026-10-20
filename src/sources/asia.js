'use strict';
// Surse RSS Asia (etapa 3). Accent pe China (inclusiv Hong Kong, Macau, Taiwan) și pe Rusia asiatică
// (Siberia + Extremul Orient; partea europeană a Rusiei e în europe.js).
// verified = fetch confirmat (HTTP 200 + elemente parsabile) la data cercetării (2026-09-29), cu
// `npm run check-sources -- --region asia`: 88/88 surse OK, 0 goale, 0 eșuate (2478 evenimente).
// Marcaj „// ?” = URL cu încredere mai mică pe termen lung: endpoint RSS nedenumit/propriu (se poate
// schimba fără preaviz), agenție de stat, sau tipar standard WordPress presupus.
// Marcaj „// !” = feed care răspunde, dar cu rezerve de prospețime (ex. Xinhua EN a servit titluri
// vechi la verificare). Marcajele rămân utile la re-verificări periodice.
// Agențiile de presă de stat (Xinhua, CGTN, ECNS, Global Times, APP, Montsame etc.) sunt incluse
// explicit ca „presa oficială din țara respectivă”, nu ca sursă independentă.
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
  verified: true,
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
  verified: true,
  ...extra,
});
const W = { scope: 'world' };

module.exports = [
  // ---------------------------------------------------------------- Pan-asiatice (news, scope world)
  S('JP', 'en', 'nikkei-asia', 'Nikkei Asia', 'https://asia.nikkei.com/rss/feed/nar', W),
  S('SG', 'en', 'cna-asia', 'CNA (Channel NewsAsia)', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', W), // ? endpoint propriu
  S('US', 'en', 'thediplomat', 'The Diplomat (pan-Asia)', 'https://thediplomat.com/feed/', W),

  // ---------------------------------------------------------------- Oficial (instituții)
  // (UN News – Asia-Pacific: feed-ul de regiune răspunde 200, dar fără elemente la verificare – omis)

  // ---------------------------------------------------------------- China
  S('CN', 'en', 'thechinaproject', 'The China Project', 'https://thechinaproject.com/feed/'),
  S('CN', 'en', 'chinamediaproject', 'China Media Project', 'https://chinamediaproject.org/feed/'),
  S('CN', 'en', 'whatsonweibo', 'What\'s on Weibo', 'https://www.whatsonweibo.com/feed/'), // ? proiect mic, feed WordPress
  S('CN', 'zh', 'rfa-mandarin', 'RFA – serviciul mandarin', 'https://www.rfa.org/mandarin/rss2.xml'), // ? presă în exil (SUA)
  // Presă de stat / agenții oficiale (China)
  S('CN', 'en', 'ecns', 'ECNS (China News Service)', 'https://www.ecns.cn/rss/rss.xml'),
  S('CN', 'en', 'globaltimes', 'Global Times', 'https://www.globaltimes.cn/rss/outbrain.xml'), // ? endpoint „outbrain”, titluri parțial vechi
  S('CN', 'en', 'cgtn-china', 'CGTN – China', 'https://www.cgtn.com/subscribe/rss/section/china.xml'),
  S('CN', 'en', 'xinhua-world', 'Xinhua (EN) – World', 'https://english.news.cn/rss/worldrss.xml'), // ! la verificare servea titluri vechi (2018)

  // ---------------------------------------------------------------- Hong Kong
  S('HK', 'en', 'scmp-china', 'SCMP – China', 'https://www.scmp.com/rss/4/feed'),
  S('HK', 'en', 'scmp-news', 'SCMP – News', 'https://www.scmp.com/rss/91/feed'),
  S('HK', 'en', 'scmp-hongkong', 'SCMP – Hong Kong', 'https://www.scmp.com/rss/2/feed'),
  S('HK', 'en', 'scmp-asia', 'SCMP – Asia', 'https://www.scmp.com/rss/3/feed'),
  S('HK', 'en', 'scmp-world', 'SCMP – World', 'https://www.scmp.com/rss/5/feed'),
  S('HK', 'en', 'scmp-health-env', 'SCMP – Health & Environment', 'https://www.scmp.com/rss/318208/feed'), // ? secțiune secundară
  S('HK', 'en', 'scmp-southeast-asia', 'SCMP – Southeast Asia', 'https://www.scmp.com/rss/318215/feed'), // ? secțiune secundară
  S('HK', 'en', 'hkfp', 'Hong Kong Free Press', 'https://hongkongfp.com/feed/'),
  S('CN', 'en', 'sixthtone', 'Sixth Tone', 'https://www.sixthtone.com/rss'),

  // ---------------------------------------------------------------- Taiwan
  S('TW', 'en', 'taipeitimes', 'Taipei Times', 'https://www.taipeitimes.com/xml/index.rss'),
  S('TW', 'zh', 'rti', 'Radio Taiwan International', 'https://www.rti.org.tw/rss'),
  // (CNA Taiwan, Focus Taiwan, Taiwan News: RSS nu a răspuns / a fost mutat – omise)

  // ---------------------------------------------------------------- Japonia
  S('JP', 'en', 'japantimes', 'The Japan Times', 'https://www.japantimes.co.jp/feed/'),
  S('JP', 'en', 'japantoday', 'Japan Today', 'https://japantoday.com/feed'),
  S('JP', 'ja', 'nhk', 'NHK – top news', 'https://www3.nhk.or.jp/rss/news/cat0.xml'),

  // ---------------------------------------------------------------- Coreea de Sud
  S('KR', 'en', 'yonhap', 'Yonhap (EN)', 'https://en.yna.co.kr/RSS/news.xml'),
  S('KR', 'en', 'koreaherald', 'The Korea Herald', 'https://www.koreaherald.com/rss/newsAll'),
  S('KR', 'en', 'hani-en', 'The Hankyoreh (EN)', 'https://english.hani.co.kr/rss/'),
  S('KR', 'ko', 'chosun', 'Chosun Ilbo', 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml'), // ? endpoint propriu (Arc)
  S('KR', 'ko', 'rfa-korean', 'RFA – serviciul coreean', 'https://www.rfa.org/korean/rss2.xml'), // ? presă în exil (SUA)

  // ---------------------------------------------------------------- Coreea de Nord (presa dedicată)
  S('KP', 'en', 'nknews', 'NK News', 'https://www.nknews.org/feed/'), // ? publicație cu sediul în SUA
  S('KP', 'en', 'dailynk', 'Daily NK', 'https://www.dailynk.com/english/feed/'), // ? publicație cu sediul în Coreea de Sud

  // ---------------------------------------------------------------- Mongolia
  S('MN', 'mn', 'ikon', 'Ikon.mn', 'https://ikon.mn/rss'), // ? RSS în limba mongolă, format propriu

  // ---------------------------------------------------------------- India
  S('IN', 'en', 'timesofindia', 'The Times of India', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms'),
  S('IN', 'en', 'thehindu', 'The Hindu – National', 'https://www.thehindu.com/news/national/feeder/default.rss'),
  S('IN', 'en', 'thehindu-world', 'The Hindu – International', 'https://www.thehindu.com/news/international/feeder/default.rss'),
  S('IN', 'en', 'indianexpress', 'The Indian Express', 'https://indianexpress.com/section/india/feed/'),
  S('IN', 'en', 'hindustantimes', 'Hindustan Times', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml'),

  // ---------------------------------------------------------------- Pakistan
  S('PK', 'en', 'dawn', 'Dawn', 'https://www.dawn.com/feeds/home'),
  S('PK', 'en', 'thenews', 'The News International', 'https://www.thenews.com.pk/rss/1/1'),
  S('PK', 'en', 'tribune-pk', 'The Express Tribune', 'https://tribune.com.pk/feed/home'),
  S('PK', 'en', 'app', 'Associated Press of Pakistan (APP)', 'https://www.app.com.pk/feed/'), // ? agenție de stat

  // ---------------------------------------------------------------- Bangladesh
  S('BD', 'en', 'dailystar', 'The Daily Star', 'https://www.thedailystar.net/rss.xml'), // ? cale RSS „/rss.xml”, nestandard
  S('BD', 'en', 'prothomalo', 'Prothom Alo (EN)', 'https://en.prothomalo.com/feed'),

  // ---------------------------------------------------------------- Nepal
  S('NP', 'en', 'kathmandupost', 'The Kathmandu Post', 'https://kathmandupost.com/rss'),
  S('NP', 'en', 'nepalitimes', 'Nepali Times', 'https://www.nepalitimes.com/feed/'),
  S('NP', 'en', 'ratopati', 'Ratopati (EN)', 'https://english.ratopati.com/rss'), // ? versiune EN a unui portal nepalez
  S('NP', 'ne', 'onlinekhabar', 'Online Khabar', 'https://www.onlinekhabar.com/feed'),

  // ---------------------------------------------------------------- Sri Lanka
  S('LK', 'en', 'adaderana', 'Ada Derana', 'https://www.adaderana.lk/rss.php'),
  S('LK', 'en', 'srilankamirror', 'Sri Lanka Mirror', 'https://srilankamirror.com/feed'), // ? publicație mică
  S('LK', 'en', 'economynext', 'EconomyNext', 'https://economynext.com/feed/'),

  // ---------------------------------------------------------------- Afganistan
  S('AF', 'en', 'tolonews', 'TOLOnews', 'https://tolonews.com/rss.xml'), // ? cale RSS „/rss.xml”, nestandard
  S('AF', 'en', 'khaama', 'The Khaama Press', 'https://www.khaama.com/feed/'), // ? acoperire parțială

  // ---------------------------------------------------------------- Myanmar
  S('MM', 'en', 'irrawaddy', 'The Irrawaddy', 'https://www.irrawaddy.com/feed'),
  S('MM', 'en', 'myanmarnow', 'Myanmar Now', 'https://www.myanmar-now.org/en/rss'),
  S('MM', 'my', 'rfa-burmese', 'RFA – serviciul birman', 'https://www.rfa.org/burmese/rss2.xml'), // ? presă în exil (SUA)

  // ---------------------------------------------------------------- Thailanda
  S('TH', 'en', 'bangkokpost', 'Bangkok Post – Top Stories', 'https://www.bangkokpost.com/rss/data/topstories.xml'),
  S('TH', 'en', 'bangkokpost-world', 'Bangkok Post – World', 'https://www.bangkokpost.com/rss/data/world.xml'),
  S('TH', 'en', 'khaosodenglish', 'Khaosod English', 'https://www.khaosodenglish.com/feed/'),
  S('TH', 'en', 'thaiger', 'The Thaiger', 'https://thethaiger.com/feed'), // ? publicație comercială
  S('TH', 'th', 'prachatai', 'Prachatai', 'https://www.prachatai.com/rss'),

  // ---------------------------------------------------------------- Vietnam
  S('VN', 'en', 'vnexpress', 'VnExpress International', 'https://e.vnexpress.net/rss/news.rss'),
  S('VN', 'vi', 'thanhnien', 'Thanh Niên', 'https://thanhnien.vn/rss/home.rss'),

  // ---------------------------------------------------------------- Timor-Leste
  S('TL', 'en', 'tatoli', 'Tatoli (state agency)', 'https://www.tatoli.tl/feed/'), // ? agenție de stat

  // ---------------------------------------------------------------- Malaezia
  S('MY', 'en', 'freemalaysiatoday', 'Free Malaysia Today', 'https://www.freemalaysiatoday.com/feed/'),

  // ---------------------------------------------------------------- Singapore
  S('SG', 'en', 'straitstimes-asia', 'The Straits Times – Asia', 'https://www.straitstimes.com/news/asia/rss.xml'),
  S('SG', 'en', 'straitstimes-world', 'The Straits Times – World', 'https://www.straitstimes.com/news/world/rss.xml'),
  S('SG', 'en', 'straitstimes-singapore', 'The Straits Times – Singapore', 'https://www.straitstimes.com/news/singapore/rss.xml'),

  // ---------------------------------------------------------------- Indonezia
  S('ID', 'id', 'antaranews', 'Antara News', 'https://www.antaranews.com/rss/terkini.xml'), // ? agenție de stat
  S('ID', 'id', 'cnnindonesia', 'CNN Indonesia', 'https://www.cnnindonesia.com/rss'),

  // ---------------------------------------------------------------- Filipine
  S('PH', 'en', 'philstar', 'The Philippine Star – Headlines', 'https://www.philstar.com/rss/headlines'),
  S('PH', 'en', 'philstar-nation', 'The Philippine Star – Nation', 'https://www.philstar.com/rss/nation'),
  S('PH', 'en', 'rappler', 'Rappler', 'https://www.rappler.com/feed/'),
  S('PH', 'en', 'inquirer', 'Philippine Daily Inquirer', 'https://newsinfo.inquirer.net/feed'),
  S('PH', 'en', 'bworldonline', 'BusinessWorld', 'https://www.bworldonline.com/feed/'),

  // ---------------------------------------------------------------- Asia Centrală
  S('KG', 'en', 'akipress', 'AKIpress', 'https://www.akipress.com/rss/'),
  S('KG', 'ru', '24kg', '24.kg', 'https://24.kg/rss/'), // ? site în limba rusă
  S('KG', 'ru', 'kloop', 'Kloop', 'https://kloop.kg/rss'), // ? publicație independentă mică
  S('KG', 'ru', 'vesti-kg', 'Vesti.kg', 'https://vesti.kg/rss'), // ? agregator local
  S('KG', 'ru', 'tazabek', 'Tazabek', 'https://tazabek.kg/rss'), // ? economic, format propriu
  S('KG', 'en', 'kabar', 'Kabar (state agency)', 'https://en.kabar.kg/rss'), // ? agenție de stat
  S('KZ', 'en', 'astanatimes', 'The Astana Times', 'https://astanatimes.com/feed/'), // ? publicație finanțată de stat
  S('KZ', 'en', 'timesca', 'Times of Central Asia', 'https://timesca.com/feed/'), // ? publicație regională mică
  S('UZ', 'en', 'gazeta-uz', 'Gazeta.uz (EN)', 'https://www.gazeta.uz/en/rss/'),
  S('UZ', 'en', 'uzdaily', 'UzDaily', 'https://www.uzdaily.com/rss'), // ? portal de stat
  S('TM', 'en', 'amudarya', 'Amu Darya News', 'https://amudaryanews.com/feed'), // ? presă în exil / opoziție

  // ---------------------------------------------------------------- Rusia asiatică (Siberia + Extremul Orient)
  // (Moscova / presa federală: în europe.js, secțiunea Rusia)
  S('RU', 'ru', 'eastrussia', 'EastRussia (Extremul Orient)', 'https://www.eastrussia.ru/rss'), // ? portal regional
  S('RU', 'ru', 'newsvl', 'NewsVL (Vladivostok)', 'https://www.newsvl.ru/rss/'), // ? portal regional
  S('RU', 'ru', 'ysia', 'YASIA (Yakutia)', 'https://ysia.ru/feed/'), // ? agenție regională de stat
];
