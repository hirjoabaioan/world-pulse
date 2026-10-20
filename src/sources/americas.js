'use strict';
// Surse RSS Americi (etapa 2c: Nord, Central, Sud + Caraibe). verified = fetch confirmat (2026-09-29).
// METODĂ: fiecare URL a fost descărcat și parsat cu parserul aplicației (`src/lib/rss.js`) dintr-un mediu
// cu egress deschis; `verified: true` înseamnă HTTP 200 ȘI cel puțin un element parsat. Feed-urile care au
// răspuns 403/404/429, care au returnat feed gol sau care nu au putut fi contactate au fost ELIMINATE
// (nu marcate cu „// ?”, ca în africa.js/europe.js, unde verificarea nu era posibilă).
// LACUNE CUNOSCUTE:
//  - fără feed RSS funcțional găsit: Antigua-Barbuda (AG), Dominica (DM), Groenlanda (GL).
//  - blochează User-Agent-ul aplicației (`WorldPulse/0.1`, vezi src/lib/http.js) cu 403/timeout, dar
//    funcționează cu UA de browser: CBC (rss-topstories/world/politics), state.gov, elpais.com.uy.
//    Eliminate intenționat: agregatorul apelează `fetchText(source.url)` fără opțiuni, deci un UA
//    per-sursă nu poate fi transmis fără modificarea src/aggregator.js.
//  - 403 cu orice UA: Milenio, Proceso, El Financiero (MX); Efecto Cocuyo, La Patilla, Crónica Uno (VE).
//  - CBS News și Trabajadores răspund ocazional 403/406/429 la cereri repetate; dacă apar eșecuri în
//    producție, mărește intervalMin sau dezactivează-le prin sources.local.json.
// `scope: 'world'` = sursă pan-regională (nu se fixează pe țara-sediu pe hartă).

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
  // ------------------------------------------------- Pan-american (news, scope world)
  S('GB', 'es', 'bbc-mundo', 'BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml', { ...W, intervalMin: 20 }),
  S('GB', 'es', 'bbc-latinoamerica', 'BBC – Latin America', 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml', { ...W, intervalMin: 20 }),
  S('GB', 'en', 'bbc-us-canada', 'BBC – US & Canada', 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', { ...W, intervalMin: 20 }),
  S('GB', 'en', 'guardian-americas', 'The Guardian – Americas', 'https://www.theguardian.com/world/americas/rss', { ...W, intervalMin: 20 }),
  S('US', 'en', 'nyt-americas', 'New York Times – Americas', 'https://rss.nytimes.com/services/xml/rss/nyt/Americas.xml', { ...W, intervalMin: 20 }),
  S('US', 'es', 'nyt-es', 'New York Times en Español', 'https://www.nytimes.com/es/feed/', { ...W, intervalMin: 20 }),
  S('FR', 'fr', 'france24-ameriques', 'France 24 Amériques', 'https://www.france24.com/fr/ameriques/rss', { ...W, intervalMin: 30 }),
  S('FR', 'es', 'rfi-es', 'RFI en Español', 'https://www.rfi.fr/es/rss', { ...W, intervalMin: 30 }),
  S('VE', 'es', 'telesur', 'Telesur', 'https://www.telesurtv.net/feed/', { ...W, intervalMin: 30 }),
  S('CU', 'es', 'prensa-latina', 'Prensa Latina', 'https://www.prensa-latina.cu/feed/', { ...W, intervalMin: 30 }),

  // ------------------------------------------------- Oficial (ONU / organizații / guverne)
  O('UN', 'en', 'unnews-americas', 'UN News – Americas', 'https://news.un.org/feed/subscribe/en/news/region/americas/feed/rss.xml', W),
  O('UN', 'es', 'onuinfo-americas', 'ONU Info – Américas', 'https://news.un.org/feed/subscribe/es/news/region/americas/feed/rss.xml', W),
  O('US', 'en', 'paho', 'PAHO / OPS – press releases', 'https://www.paho.org/en/rss.xml', W),
  O('US', 'es', 'ops-paho', 'OPS / PAHO – press releases (ES)', 'https://www.paho.org/es/rss.xml', W),
  O('US', 'en', 'cdc-news', 'CDC – press releases', 'https://tools.cdc.gov/api/v2/resources/media/316422.rss'),
  O('US', 'en', 'fema-news', 'FEMA – press releases', 'https://www.fema.gov/feeds/news.rss'),
  O('US', 'en', 'noaa-news', 'NOAA – press releases', 'https://www.noaa.gov/rss.xml'),
  O('US', 'en', 'justice-news', 'US Department of Justice – news', 'https://www.justice.gov/news/rss', { intervalMin: 60 }),
  O('US', 'en', 'dod-news', 'US Department of Defense – news', 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=20'),
  O('US', 'en', 'uscourts-news', 'US Federal Courts – news', 'https://www.uscourts.gov/news/rss'),
  O('CA', 'en', 'pm-canada', 'Prime Minister of Canada – press releases', 'https://pm.gc.ca/en/rss.xml'),
  O('AR', 'es', 'argentina-gov', 'Government of Argentina – news', 'https://www.argentina.gob.ar/rss.xml'),

  // ------------------------------------------------- Statele Unite
  S('US', 'en', 'npr', 'NPR – national news', 'https://feeds.npr.org/1001/rss.xml'),
  S('US', 'en', 'pbs-newshour', 'PBS NewsHour', 'https://www.pbs.org/newshour/feeds/rss/headlines'),
  S('US', 'en', 'abc-news', 'ABC News', 'https://abcnews.go.com/abcnews/topstories'),
  S('US', 'en', 'nbc-news', 'NBC News', 'https://feeds.nbcnews.com/nbcnews/public/news'),
  S('US', 'en', 'cbs-news', 'CBS News', 'https://www.cbsnews.com/latest/rss/main'),
  S('US', 'en', 'cnn', 'CNN – top stories', 'http://rss.cnn.com/rss/cnn_topstories.rss'),
  S('US', 'en', 'cnn-world', 'CNN – World', 'http://rss.cnn.com/rss/cnn_world.rss'),
  S('US', 'en', 'fox-news', 'Fox News – latest', 'https://moxie.foxnews.com/google-publisher/latest.xml'),
  S('US', 'en', 'washingtonpost-world', 'Washington Post – World', 'https://feeds.washingtonpost.com/rss/world'),
  S('US', 'en', 'washingtonpost-politics', 'Washington Post – Politics', 'https://feeds.washingtonpost.com/rss/politics'),
  S('US', 'en', 'politico', 'Politico', 'https://rss.politico.com/politics-news.xml'),
  S('US', 'en', 'the-hill', 'The Hill', 'https://thehill.com/feed/'),
  S('US', 'en', 'axios', 'Axios', 'https://api.axios.com/feed/'),
  S('US', 'en', 'propublica', 'ProPublica', 'https://www.propublica.org/feeds/propublica/main'),
  S('US', 'en', 'courthouse-news', 'Courthouse News Service', 'https://www.courthousenews.com/feed/'),
  S('US', 'en', 'defense-news', 'Defense News', 'https://www.defensenews.com/arc/outboundfeeds/rss/'),
  S('US', 'en', 'nypost', 'New York Post', 'https://nypost.com/feed/'),
  S('US', 'en', 'the-verge', 'The Verge', 'https://www.theverge.com/rss/index.xml'),

  // ------------------------------------------------- Canada
  S('CA', 'en', 'globeandmail', 'The Globe and Mail – Canada', 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/'),
  S('CA', 'en', 'globeandmail-world', 'The Globe and Mail – World', 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/'),
  S('CA', 'en', 'global-news', 'Global News', 'https://globalnews.ca/feed/'),
  S('CA', 'en', 'national-post', 'National Post', 'https://nationalpost.com/feed/'),
  S('CA', 'fr', 'radio-canada', 'Radio-Canada – Manchettes', 'https://ici.radio-canada.ca/rss/4159'),
  S('CA', 'fr', 'la-presse', 'La Presse – Manchettes', 'https://www.lapresse.ca/manchettes/rss'),
  S('CA', 'en', 'nunatsiaq', 'Nunatsiaq News (Arctic)', 'https://nunatsiaq.com/feed/'),
  S('CA', 'en', 'aptn', 'APTN News (Indigenous affairs)', 'https://www.aptnnews.ca/feed/'),

  // ------------------------------------------------- Mexic
  S('MX', 'es', 'jornada', 'La Jornada', 'https://www.jornada.com.mx/rss/edicion.xml'),
  S('MX', 'es', 'jornada-politica', 'La Jornada – Política', 'https://www.jornada.com.mx/rss/politica.xml'),
  S('MX', 'es', 'el-universal', 'El Universal', 'https://www.eluniversal.com.mx/arc/outboundfeeds/rss/'),
  S('MX', 'es', 'reforma', 'Reforma', 'https://www.reforma.com/rss/portada.xml'),
  S('MX', 'es', 'expansion', 'Expansión', 'https://www.expansion.mx/rss'),
  S('MX', 'es', 'expansion-politica', 'Expansión Política', 'https://politica.expansion.mx/rss'),
  S('MX', 'es', 'sopitas', 'Sopitas', 'https://www.sopitas.com/feed/'),

  // ------------------------------------------------- Guatemala
  S('GT', 'es', 'prensa-libre', 'Prensa Libre', 'https://www.prensalibre.com/feed/'),

  // ------------------------------------------------- Honduras
  S('HN', 'es', 'proceso', 'Proceso Digital', 'https://www.proceso.hn/feed/'),
  S('HN', 'es', 'criterio', 'Criterio.hn', 'https://criterio.hn/feed/'),

  // ------------------------------------------------- El Salvador
  S('SV', 'es', 'elsalvador-com', 'El Salvador.com', 'https://www.elsalvador.com/rss.xml'),
  S('SV', 'es', 'contrapunto', 'Contrapunto', 'https://www.contrapunto.com.sv/feed/'),
  S('SV', 'es', 'revista-factum', 'Revista Factum', 'https://www.revistafactum.com/feed/'),
  S('SV', 'es', 'voces', 'Voces (Fundaungo)', 'https://voces.org.sv/feed/'),

  // ------------------------------------------------- Nicaragua
  S('NI', 'es', 'confidencial', 'Confidencial', 'https://confidencial.digital/feed/'),

  // ------------------------------------------------- Costa Rica
  S('CR', 'es', 'nacion', 'La Nación', 'https://www.nacion.com/rss/'),
  S('CR', 'es', 'delfino', 'Delfino.cr', 'https://www.delfino.cr/feed/'),
  S('CR', 'es', 'monumental', 'Monumental', 'https://monumental.co.cr/feed/'),

  // ------------------------------------------------- Panama
  S('PA', 'es', 'panama-america', 'Panamá América', 'https://www.panamaamerica.com.pa/rss.xml'),

  // ------------------------------------------------- Belize
  S('BZ', 'en', 'amandala', 'Amandala', 'https://amandala.com.bz/news/feed/'),
  S('BZ', 'en', 'breaking-belize', 'Breaking Belize News', 'https://breakingbelizenews.com/feed/'),

  // ------------------------------------------------- Cuba
  S('CU', 'es', 'oncubanos', 'OnCuba News', 'https://oncubanews.com/feed/'),
  S('CU', 'es', 'trabajadores', 'Trabajadores', 'https://www.trabajadores.cu/feed/'),

  // ------------------------------------------------- Republica Dominicană
  S('DO', 'es', 'diario-libre', 'Diario Libre', 'https://www.diariolibre.com/rss/portada.xml'),

  // ------------------------------------------------- Haiti
  S('HT', 'fr', 'le-nouvelliste', 'Le Nouvelliste', 'https://lenouvelliste.com/rss.xml'),
  S('HT', 'fr', 'juno7', 'Juno7', 'https://www.juno7.ht/feed/'),

  // ------------------------------------------------- Jamaica
  S('JM', 'en', 'jamaica-observer', 'Jamaica Observer', 'https://www.jamaicaobserver.com/feed/'),

  // ------------------------------------------------- Trinidad-Tobago
  S('TT', 'en', 'wicnews', 'WIC News', 'https://wicnews.com/feed/'),
  S('TT', 'en', 'cnc3', 'CNC3', 'https://www.cnc3.co.tt/feed/'),

  // ------------------------------------------------- Barbados
  S('BB', 'en', 'nation-news', 'Nation News', 'https://www.nationnews.com/feed/'),

  // ------------------------------------------------- Bahamas
  S('BS', 'en', 'bahamas-press', 'Bahamas Press', 'https://www.bahamaspress.com/feed/'),
  S('BS', 'en', 'ewnews', 'Eyewitness News Bahamas', 'https://ewnews.com/feed/'),

  // ------------------------------------------------- Guyana
  S('GY', 'en', 'guyana-times', 'Guyana Times', 'https://www.guyanatimesgy.com/feed/'),

  // ------------------------------------------------- Suriname
  S('SR', 'nl', 'dwt-online', 'De Ware Tijd', 'https://dwtonline.com/feed/'),
  S('SR', 'nl', 'de-west', 'Dagblad De West', 'https://dagbladdewest.com/feed/'),
  S('SR', 'nl', 'waterkant', 'Waterkant', 'https://waterkant.net/feed/'),

  // ------------------------------------------------- Caraibe de Est (OECS)
  S('KN', 'en', 'stkitts-nevis-observer', 'The St Kitts Nevis Observer', 'https://www.thestkittsnevisobserver.com/feed/'),
  S('LC', 'en', 'st-lucia-times', 'St. Lucia Times', 'https://stluciatimes.com/feed/'),
  S('LC', 'en', 'st-lucia-news-online', 'St. Lucia News Online', 'https://www.stlucianewsonline.com/feed/'),
  S('VC', 'en', 'searchlight', 'Searchlight', 'https://searchlight.vc/feed/'),
  S('VC', 'en', 'iwnsvg', 'iWitness News', 'https://www.iwnsvg.com/feed/'),
  S('GD', 'en', 'now-grenada', 'Now Grenada', 'https://www.nowgrenada.com/feed/'),

  // ------------------------------------------------- Venezuela
  S('VE', 'es', 'talcualdigital', 'TalCual', 'https://talcualdigital.com/feed/'),
  S('VE', 'es', 'runrunes', 'Runrunes', 'https://runrun.es/feed/'),
  S('VE', 'es', 'alnavio', 'Alnavío', 'https://alnavio.com/feed/'),
  S('VE', 'es', 'prodavinci', 'Prodavinci', 'https://prodavinci.com/feed/'),
  S('VE', 'es', 'monitoreamos', 'Monitoreamos', 'https://monitoreamos.com/feed/'),
  S('VE', 'es', 'el-diario', 'El Diario', 'https://www.eldiario.com/feed/'),

  // ------------------------------------------------- Columbia
  S('CO', 'es', 'eltiempo', 'El Tiempo – Colombia', 'https://www.eltiempo.com/rss/colombia.xml'),
  S('CO', 'es', 'eltiempo-mundo', 'El Tiempo – Mundo', 'https://www.eltiempo.com/rss/mundo.xml'),
  S('CO', 'es', 'eltiempo-politica', 'El Tiempo – Política', 'https://www.eltiempo.com/rss/politica.xml'),
  S('CO', 'es', 'semana', 'Semana', 'https://www.semana.com/arc/outboundfeeds/rss/'),
  S('CO', 'es', 'el-colombiano', 'El Colombiano', 'https://www.elcolombiano.com/rss/portada.xml'),
  S('CO', 'es', 'razon-publica', 'Razón Pública', 'https://razonpublica.com/feed/'),

  // ------------------------------------------------- Ecuador
  S('EC', 'es', 'el-comercio', 'El Comercio', 'https://www.elcomercio.com/feed/'),

  // ------------------------------------------------- Peru
  S('PE', 'es', 'rpp', 'RPP Noticias', 'https://rpp.pe/feed'),
  S('PE', 'es', 'el-buho', 'El Búho', 'https://www.elbuho.pe/feed/'),
  S('PE', 'es', 'idl-reporteros', 'IDL-Reporteros', 'https://www.idl-reporteros.pe/feed/'),
  S('PE', 'es', 'wayka', 'Wayka', 'https://wayka.pe/feed/'),

  // ------------------------------------------------- Bolivia
  S('BO', 'es', 'erbol', 'ERBOL', 'https://www.erbol.com.bo/rss.xml'),
  S('BO', 'es', 'el-deber', 'El Deber', 'https://www.eldeber.com.bo/feed/'),

  // ------------------------------------------------- Chile
  S('CL', 'es', 'la-tercera', 'La Tercera', 'https://www.latercera.com/rss/'),
  S('CL', 'es', 'ciper', 'CIPER Chile', 'https://www.ciperchile.cl/feed/'),
  S('CL', 'es', 'interferencia', 'Interferencia', 'https://interferencia.cl/rss.xml'),
  S('CL', 'es', 'the-clinic', 'The Clinic', 'https://www.theclinic.cl/feed/'),

  // ------------------------------------------------- Argentina
  S('AR', 'es', 'clarin', 'Clarín – Último momento', 'https://www.clarin.com/rss/lo-ultimo/'),
  S('AR', 'es', 'clarin-mundo', 'Clarín – Mundo', 'https://www.clarin.com/rss/mundo/'),
  S('AR', 'es', 'la-nacion', 'La Nación', 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/'),
  S('AR', 'es', 'infobae', 'Infobae', 'https://www.infobae.com/arc/outboundfeeds/rss/'),
  S('AR', 'es', 'perfil', 'Perfil', 'https://www.perfil.com/feed'),
  S('AR', 'en', 'buenos-aires-herald', 'Buenos Aires Herald', 'https://www.buenosairesherald.com/feed'),
  S('AR', 'es', 'chequeado', 'Chequeado', 'https://chequeado.com/feed/'),

  // ------------------------------------------------- Paraguay
  S('PY', 'es', 'el-nacional', 'El Nacional', 'https://www.elnacional.com.py/feed/'),
  S('PY', 'es', 'hoy', 'Diario HOY', 'https://www.hoy.com.py/feed/'),

  // ------------------------------------------------- Uruguay
  S('UY', 'es', 'la-diaria', 'la diaria', 'https://ladiaria.com.uy/feeds/articulos/'),

  // ------------------------------------------------- Brazilia
  S('BR', 'pt', 'agencia-brasil', 'Agência Brasil – Últimas', 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml'),
  S('BR', 'pt', 'agencia-brasil-politica', 'Agência Brasil – Política', 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml'),
  S('BR', 'pt', 'folha-mundo', 'Folha de S.Paulo – Mundo', 'https://feeds.folha.uol.com.br/mundo/rss091.xml'),
  S('BR', 'pt', 'folha-poder', 'Folha de S.Paulo – Poder', 'https://feeds.folha.uol.com.br/poder/rss091.xml'),
  S('BR', 'pt', 'g1', 'G1 – Globo', 'https://g1.globo.com/rss/g1/'),
  S('BR', 'pt', 'g1-mundo', 'G1 – Mundo', 'https://g1.globo.com/rss/g1/mundo/'),
  S('BR', 'pt', 'g1-politica', 'G1 – Política', 'https://g1.globo.com/rss/g1/politica/'),
  S('BR', 'pt', 'g1-economia', 'G1 – Economia', 'https://g1.globo.com/rss/g1/economia/'),
  S('BR', 'pt', 'uol-noticias', 'UOL Notícias', 'https://rss.uol.com.br/feed/noticias.xml'),
  S('BR', 'pt', 'bbc-brasil', 'BBC News Brasil', 'https://www.bbc.com/portuguese/index.xml'),
  S('BR', 'pt', 'cnn-brasil', 'CNN Brasil', 'https://www.cnnbrasil.com.br/feed/'),
  S('BR', 'pt', 'metropoles', 'Metrópoles', 'https://www.metropoles.com/feed'),
  S('BR', 'pt', 'poder360', 'Poder360', 'https://www.poder360.com.br/feed/'),
  S('BR', 'pt', 'ebc', 'EBC – notícias', 'https://www.ebc.com.br/rss.xml'),
  S('BR', 'pt', 'the-intercept-brasil', 'The Intercept Brasil', 'https://theintercept.com/feed/?lang=pt'),

  // ------------------------------------------------- Puerto Rico
  S('PR', 'es', 'noticel', 'NotiCel', 'https://noticel.com/feed/'),
];
