'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { geolocate, countryByName } = require('../src/lib/geo');

test('orașul are prioritate față de demonim (actor ≠ loc)', () => {
  const g = geolocate('Israeli strikes on Gaza kill 12');
  assert.strictEqual(g.place, 'Gaza');
  assert.strictEqual(g.country, 'PS');
  assert.strictEqual(g.precision, 'city');
  assert.strictEqual(geolocate('Ukrainian drones hit Moscow refinery').country, 'RU');
});

test('numele de țară bate demonimul', () => {
  assert.strictEqual(geolocate('Russian delegation arrives in Turkey for talks').country, 'TR');
});

test('cea mai lungă potrivire câștigă (Guinea-Bissau, Papua New Guinea)', () => {
  assert.strictEqual(geolocate('Vote count delayed in Guinea-Bissau').country, 'GW');
  assert.strictEqual(geolocate('Landslide in Papua New Guinea').country, 'PG');
});

test('nume românești cu diacritice', () => {
  assert.strictEqual(geolocate('Guvernul de la Chișinău anunță măsuri').country, 'MD');
  assert.strictEqual(geolocate('Cutremur puternic resimțit în România').country, 'RO');
});

test('acronimele scurte doar cu majuscule', () => {
  assert.strictEqual(geolocate('UK announces new sanctions').country, 'GB');
  assert.strictEqual(geolocate('Ele disse que a sua casa foi destruída'), null);
  assert.strictEqual(geolocate('SUA anunță noi sancțiuni').country, 'US');
});

test('fără potrivire parțială în interiorul cuvintelor', () => {
  assert.strictEqual(geolocate('Chadwick Boseman tribute'), null);
});

test('rezumatul e folosit doar dacă titlul nu conține un loc', () => {
  assert.strictEqual(geolocate('Talks collapse', 'Negotiators left Doha on Monday').place, 'Doha');
});

test('countryByName (GDELT sourcecountry)', () => {
  assert.strictEqual(countryByName('United States').iso, 'US');
  assert.strictEqual(countryByName('Nowhere'), null);
});
