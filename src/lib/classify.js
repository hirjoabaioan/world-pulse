'use strict';
// Clasificare simplă pe cuvinte-cheie (EN/RO/FR/ES/DE) → categorie + severitate.
// Intenționat transparentă și ușor de ajustat; poate fi înlocuită ulterior cu un model ML/LLM.

const CATEGORIES = {
  conflict: [
    'attack', 'attacks', 'attacked', 'airstrike', 'airstrikes', 'air strike', 'air strikes', 'missile strike',
    'drone strike', 'drone attack', 'drone attacks', 'shelling', 'shelled', 'bombing', 'bombardment',
    'missile', 'missiles', 'rocket fire', 'clashes', 'clash', 'gunfire', 'gunmen', 'militants', 'militant',
    'insurgents', 'rebels', 'rebel', 'offensive', 'counteroffensive', 'troops', 'frontline', 'front line',
    'ceasefire', 'cease-fire', 'truce', 'war', 'invasion', 'hostage', 'hostages', 'terrorist', 'terror attack',
    'jihadist', 'armed group', 'armed forces', 'artillery', 'massacre', 'coup', 'insurgency', 'fighting',
    'soldiers', 'military', 'paramilitary', 'occupation', 'occupying', 'annexation', 'annexed', 'ambush',
    'suicide bomber', 'strike on', 'strikes on', 'strike hits', 'strikes hit', 'raid', 'raids', 'shot dead',
    'armed gangs', 'border dispute', 'border clash', 'border clashes', 'territorial dispute',
    'disputed territory', 'contested border',
    // RO
    'atac', 'atacuri', 'atacat', 'bombardament', 'bombardamente', 'rachetă', 'rachete', 'dronă', 'drone',
    'război', 'razboi', 'armistițiu', 'încetare a focului', 'lupte', 'ostilități', 'trupe', 'militari',
    'insurgenți', 'rebeli', 'lovitură de stat', 'ofensivă', 'linia frontului',
    // FR
    'attaque', 'frappe', 'frappes', 'guerre', 'bombardements', 'cessez-le-feu', 'combats', 'rebelles',
    // ES
    'ataque', 'guerra', 'bombardeo', 'alto el fuego', 'combates', 'rebeldes',
    // DE
    'angriff', 'krieg', 'waffenruhe', 'beschuss',
  ],
  disaster: [
    'earthquake', 'quake', 'tsunami', 'flood', 'floods', 'flooding', 'hurricane', 'typhoon', 'cyclone',
    'tropical storm', 'wildfire', 'wildfires', 'bushfire', 'volcano', 'eruption', 'landslide', 'drought',
    'heatwave', 'heat wave', 'avalanche', 'tornado', 'storm',
    'cutremur', 'inundații', 'inundatii', 'uragan', 'taifun', 'incendiu de vegetație', 'erupție', 'alunecare de teren',
    'secetă', 'caniculă', 'furtună', 'séisme', 'inondations', 'terremoto', 'inundaciones', 'erdbeben',
  ],
  health: [
    'outbreak', 'epidemic', 'pandemic', 'cholera', 'ebola', 'mpox', 'measles', 'dengue', 'malaria',
    'marburg', 'avian influenza', 'bird flu', 'h5n1', 'polio', 'virus', 'vaccination', 'vaccine',
    'epidemie', 'pandemie', 'focar', 'holeră', 'rujeolă', 'gripă aviară', 'épidémie', 'brote',
  ],
  politics: [
    'election', 'elections', 'parliament', 'president', 'prime minister', 'minister', 'government',
    'referendum', 'summit', 'sanctions', 'diplomat', 'diplomatic', 'treaty', 'talks', 'negotiations',
    'protest', 'protests', 'resigns', 'resignation', 'impeachment', 'vote',
    'alegeri', 'parlament', 'președinte', 'premier', 'guvern', 'sancțiuni', 'negocieri', 'proteste', 'demisie',
    'élection', 'élections', 'gouvernement', 'elecciones', 'gobierno', 'wahl', 'regierung',
  ],
  economy: [
    'inflation', 'interest rate', 'interest rates', 'central bank', 'stocks', 'stock market', 'shares',
    'gdp', 'recession', 'tariff', 'tariffs', 'trade deal', 'oil prices', 'exports', 'imports', 'currency',
    'inflație', 'dobândă', 'bursă', 'pib', 'recesiune', 'taxe vamale', 'économie', 'economía', 'wirtschaft',
  ],
};

// Sub-classification of `category === 'conflict'` events into a conflict type. Same keyword-matching
// approach as CATEGORIES above — transparent, easy to tune, not a claim of ground truth. Order in
// CONFLICT_ORDER matters at a tie (checked top to bottom).
const CONFLICT_TYPES = {
  interstate_war: [
    'invasion', 'invaded', 'invading forces', 'war between', 'cross-border war', 'state of war',
    'declared war', 'full-scale war', 'full-scale invasion', 'annexed territory',
    'invazie', 'război între', 'războaie', 'anexare',
    'invasion de', 'guerre entre', 'invasión', 'invasión de',
  ],
  civil_war: [
    'civil war', 'rebel-held', 'government forces', 'opposition forces', 'warring factions',
    'breakaway region', 'separatist forces', 'internal conflict',
    'război civil', 'forțe guvernamentale', 'forțe separatiste',
    'guerre civile', 'guerra civil',
  ],
  insurgency: [
    'insurgency', 'insurgents', 'rebels', 'rebel group', 'guerrilla', 'militia', 'militias',
    'armed group', 'non-state armed group', 'uprising', 'rebellion',
    'insurgenți', 'rebeli', 'gherilă', 'miliție', 'miliții', 'grup armat', 'rebeliune',
    'insurgés', 'rébellion', 'guérilla', 'insurgentes', 'guerrilla',
  ],
  terrorism: [
    'terrorist', 'terrorists', 'terrorist attack', 'terror attack', 'suicide bomber', 'suicide bombing',
    'car bomb', 'jihadist', 'extremist group', 'isis', 'islamic state', 'al-qaeda', 'al-shabaab',
    'boko haram', 'hamas', 'hezbollah', 'lone wolf attack',
    'terorist', 'teroriști', 'atac terorist', 'atentat', 'jihadist', 'grupare extremistă',
    'terroriste', 'attentat', 'terrorista', 'atentado',
  ],
  ethnic_religious: [
    'ethnic violence', 'ethnic clashes', 'sectarian violence', 'communal violence', 'tribal clashes',
    'religious violence', 'genocide', 'ethnic cleansing', 'pogrom',
    'violență etnică', 'violențe interetnice', 'violență religioasă', 'genocid', 'curățare etnică',
    'violence ethnique', 'violencia étnica',
  ],
  organized_crime: [
    'cartel', 'drug cartel', 'gang violence', 'gang war', 'organized crime', 'trafficking network',
    'drug trafficking', 'turf war', 'mafia',
    'cartel de droguri', 'violență între bande', 'crimă organizată', 'trafic de droguri',
    'guerre des gangs', 'crimen organizado', 'narcotráfico',
  ],
  coup_unrest: [
    'coup', 'coup attempt', 'military takeover', 'junta', 'martial law', 'state of emergency',
    'civil unrest', 'riots', 'riot police', 'crackdown on protesters', 'political violence',
    'lovitură de stat', 'juntă militară', 'stare de urgență', 'tulburări civile', 'revoltă',
    'coup d’État', 'état d’urgence', 'golpe de estado', 'estado de emergencia',
  ],
  border_dispute: [
    'border dispute', 'border clash', 'border clashes', 'territorial dispute', 'disputed territory',
    'contested border', 'border tension', 'border tensions',
    'dispută teritorială', 'conflict de frontieră', 'teritoriu disputat',
    'différend frontalier', 'disputa territorial',
  ],
  occupation: [
    'occupation', 'occupied territory', 'occupying forces', 'annexation', 'annexed',
    'ocupație', 'teritoriu ocupat', 'forțe de ocupație', 'anexare',
    'occupation militaire', 'territorio ocupado',
  ],
  ceasefire_diplomacy: [
    'ceasefire', 'cease-fire', 'truce', 'peace talks', 'peace deal', 'peace agreement',
    'de-escalation', 'prisoner exchange', 'peace process', 'armistice',
    'armistițiu', 'încetare a focului', 'negocieri de pace', 'acord de pace', 'schimb de prizonieri',
    'cessez-le-feu', 'pourparlers de paix', 'alto el fuego', 'acuerdo de paz',
  ],
};

const CONFLICT_ORDER = [
  'terrorism', 'interstate_war', 'civil_war', 'occupation', 'ethnic_religious', 'insurgency',
  'coup_unrest', 'organized_crime', 'border_dispute', 'ceasefire_diplomacy',
];

// Sub-classification of everyday news (category 'general'/'politics'/'economy') into a finer topic.
// Conflict/disaster/health already have strong, dedicated categories above — this only kicks in for
// what's left, so a 'news' layer item gets a usable topic instead of the catch-all 'general'.
const NEWS_TOPICS = {
  technology: [
    'technology', 'artificial intelligence', 'chatbot', 'software update', 'app update', 'startup',
    'smartphone', 'semiconductor', 'chipmaker', 'cybersecurity', 'data breach', 'hacked', 'hackers',
    'social media platform', 'self-driving', 'robotics', 'satellite launch',
    'tehnologie', 'inteligență artificială', 'aplicație', 'cibersecuritate', 'atac cibernetic',
    'technologie', 'intelligence artificielle', 'tecnología', 'inteligencia artificial',
  ],
  science: [
    'study finds', 'new study', 'researchers say', 'scientists say', 'scientists discover',
    'scientists discovered', 'nasa', 'space mission', 'space telescope', 'astronomers', 'fossil',
    'archaeologists', 'physics', 'genome', 'species discovered', 'new species',
    'cercetători', 'oameni de știință', 'descoperire arheologică', 'misiune spațială',
    'chercheurs', 'científicos', 'descubrimiento',
  ],
  sports: [
    'championship', 'tournament', 'world cup', 'olympic', 'olympics', 'grand slam', 'league title',
    'football match', 'soccer match', 'basketball game', 'tennis final', 'gold medal', 'world record',
    'campionat', 'turneu', 'olimpiadă', 'meci', 'medalie de aur',
    'championnat', 'tournoi', 'campeonato', 'torneo',
  ],
  entertainment_culture: [
    'film festival', 'box office', 'movie premiere', 'album release', 'concert tour', 'celebrity',
    'streaming series', 'tv series', 'award show', 'grammy', 'oscar', 'museum exhibit',
    'festival de film', 'premieră', 'album', 'turneu', 'celebritate',
    'festival du film', 'festival de cine',
  ],
  environment_climate: [
    'climate change', 'global warming', 'carbon emissions', 'renewable energy', 'solar power',
    'wind farm', 'biodiversity', 'deforestation', 'endangered species', 'air pollution', 'plastic waste',
    'schimbări climatice', 'încălzire globală', 'emisii de carbon', 'energie regenerabilă', 'poluare',
    'changement climatique', 'énergie renouvelable', 'cambio climático', 'energía renovable',
  ],
  crime_justice: [
    'trial begins', 'jury verdict', 'lawsuit filed', 'indicted', 'indictment', 'sentenced to',
    'court ruling', 'convicted of', 'fraud charges', 'corruption charges', 'guilty plea', 'acquitted',
    'proces', 'verdict', 'condamnat', 'arestat pentru', 'fraudă', 'acuzații de corupție',
    'procès', 'jugement', 'condena', 'juicio',
  ],
  education: [
    'university students', 'school district', 'tuition fees', 'curriculum', 'exam results',
    'graduation ceremony', 'scholarship program',
    'universitate', 'elevi', 'studenți', 'taxe de școlarizare', 'rezultatele examenului',
    'université', 'étudiants', 'universidad', 'estudiantes',
  ],
  religion: [
    'pope francis', 'the vatican', 'archbishop', 'grand imam', 'chief rabbi', 'pilgrimage', 'religious leader',
    'papa francisc', 'vatican', 'pelerinaj', 'lider religios',
    'le pape', 'el papa',
  ],
};

const NEWS_ORDER = [
  'crime_justice', 'technology', 'science', 'environment_climate', 'sports',
  'entertainment_culture', 'education', 'religion',
];

const SEVERE = [
  'killed', 'kill', 'kills', 'dead', 'deaths', 'death toll', 'casualties', 'massacre', 'wounded', 'injured', 'fatalities',
  'morți', 'morti', 'uciși', 'ucisi', 'victime', 'răniți', 'tués', 'morts', 'muertos', 'heridos', 'tote',
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (list) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${list.map(escape).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

const CAT_RE = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, wordRe(v)]));
const SEVERE_RE = wordRe(SEVERE);

const CONFLICT_TYPE_RE = Object.fromEntries(Object.entries(CONFLICT_TYPES).map(([k, v]) => [k, wordRe(v)]));
const NEWS_TOPIC_RE = Object.fromEntries(Object.entries(NEWS_TOPICS).map(([k, v]) => [k, wordRe(v)]));

// Ordinea contează la egalitate: conflictul și dezastrele au prioritate.
const ORDER = ['conflict', 'disaster', 'health', 'politics', 'economy'];

function count(re, text) {
  re.lastIndex = 0;
  return (text.match(re) || []).length;
}

/**
 * Sub-classifies a conflict-category event into a specific conflict type.
 * Only meaningful when the event's main category is 'conflict' — callers should
 * gate on that. Returns 'other' when no keyword group matches.
 */
function classifyConflictType(title, summary = '') {
  const text = `${title || ''} ${title || ''} ${summary || ''}`;
  let type = 'other';
  let top = 0;
  for (const k of CONFLICT_ORDER) {
    const n = count(CONFLICT_TYPE_RE[k], text);
    if (n > top) {
      top = n;
      type = k;
    }
  }
  return type;
}

/**
 * Sub-classifies a non-conflict/disaster/health event (category 'general'/'politics'/'economy')
 * into a finer news topic. Politics/economy pass through as-is (already a strong signal);
 * 'general' gets a real shot at a topic via keyword matching. Returns 'other' with no match.
 */
function classifyNewsTopic(title, summary, category) {
  if (category === 'politics') return 'politics';
  if (category === 'economy') return 'business_economy';
  const text = `${title || ''} ${title || ''} ${summary || ''}`;
  let topic = 'other';
  let top = 0;
  for (const k of NEWS_ORDER) {
    const n = count(NEWS_TOPIC_RE[k], text);
    if (n > top) {
      top = n;
      topic = k;
    }
  }
  return topic;
}

/**
 * @returns {{ category: string, severity: number, scores: object }}
 *   severity: 0 = informativ, 1 = notabil, 2 = important, 3 = critic (victime)
 */
function classify(title, summary = '') {
  const text = `${title || ''} ${title || ''} ${summary || ''}`; // titlul cântărește dublu
  const scores = {};
  for (const k of ORDER) scores[k] = count(CAT_RE[k], text);
  let category = 'general';
  let top = 0;
  for (const k of ORDER) {
    if (scores[k] > top) {
      top = scores[k];
      category = k;
    }
  }
  const severe = count(SEVERE_RE, text) > 0;
  let severity = 0;
  if (category === 'conflict' || category === 'disaster') severity = severe ? 3 : 2;
  else if (category === 'health') severity = severe ? 2 : 1;
  else if (category !== 'general') severity = 1;
  return { category, severity, scores };
}

module.exports = { classify, classifyConflictType, classifyNewsTopic, CATEGORIES, CONFLICT_TYPES, NEWS_TOPICS };
