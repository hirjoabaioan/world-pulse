'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { classify } = require('../src/lib/classify');

test('conflict cu victime → severitate 3', () => {
  const c = classify('Airstrike on market kills 20 in Sudan');
  assert.strictEqual(c.category, 'conflict');
  assert.strictEqual(c.severity, 3);
});
test('conflict fără victime → severitate 2', () => {
  assert.deepStrictEqual(
    (({ category, severity }) => ({ category, severity }))(classify('Ceasefire talks resume in Doha')),
    { category: 'conflict', severity: 2 }
  );
});
test('dezastru, sănătate, politică, economie, general', () => {
  assert.strictEqual(classify('Magnitude 6.1 earthquake hits Peru').category, 'disaster');
  assert.strictEqual(classify('Cholera outbreak spreads in Yemen').category, 'health');
  assert.strictEqual(classify('Parliament approves new government').category, 'politics');
  assert.strictEqual(classify('Central bank raises interest rates').category, 'economy');
  assert.strictEqual(classify('Museum opens new exhibition').category, 'general');
});
test('limba română', () => {
  assert.strictEqual(classify('Bombardament asupra orașului, zeci de morți').category, 'conflict');
  assert.strictEqual(classify('Alegeri anticipate anunțate de guvern').category, 'politics');
});
