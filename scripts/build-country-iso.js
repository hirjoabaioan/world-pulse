'use strict';
// One-off generator for public/vendor/country-iso.json — maps the numeric UN M49 country codes
// used as `id` in public/vendor/countries-110m.json (world-atlas/Natural Earth convention) to our
// ISO2 codes, by matching each feature's `properties.name` against src/data/places.js COUNTRIES
// (via countryByName, which already backs GDELT's sourcecountry matching). Auto-matches ~165/177;
// the rest are Natural Earth's abbreviated short names ("Dem. Rep. Congo") or disputed/uninhabited
// territories not worth adding as full country aliases just for this — patched by hand below.
//
// Usage: node scripts/build-country-iso.js > public/vendor/country-iso.json

const topo = require('../public/vendor/countries-110m.json');
const { countryByName } = require('../src/lib/geo');

// Natural Earth's abbreviated names -> ISO2 (verified against the numeric `id`, ISO 3166-1 numeric).
const MANUAL = {
  'W. Sahara': 'EH',
  'Dem. Rep. Congo': 'CD',
  'Dominican Rep.': 'DO',
  'Central African Rep.': 'CF',
  'Eq. Guinea': 'GQ',
  'Solomon Is.': 'SB',
  'Bosnia and Herz.': 'BA',
  'S. Sudan': 'SS',
  'New Caledonia': 'NC',
  'Falkland Is.': 'FK',
  // No meaningful ISO2/no news relevance — left unmapped (choropleth shows them as "no data"):
  // 'Fr. S. Antarctic Lands', 'Antarctica', 'N. Cyprus', 'Somaliland'
};

const map = {};
let unresolved = 0;
for (const g of topo.objects.countries.geometries) {
  const name = g.properties.name;
  const iso = MANUAL[name] || (countryByName(name) || {}).iso;
  if (iso) map[g.id] = iso;
  else unresolved++;
}

process.stdout.write(JSON.stringify(map) + '\n');
console.error(`${Object.keys(map).length} mapped, ${unresolved} left without an ISO2 (disputed/uninhabited territories)`);
