import test from 'node:test';
import assert from 'node:assert/strict';
import { findMatch, normalizePhrase } from './match.ts';

const gta = ['gta 6', 'gta vi', 'grand theft auto 6', 'grand theft auto vi'];

test('gta 6 matches joined, spaced, and punctuated titles', () => {
  for (const title of [
    'GTA 6 ending explained',
    'GTA6 trailer',
    'GTA-6 leak',
    'GTA/6 map',
    'GTA_6 rumors',
    '(GTA 6)',
    'GTA 6!',
    'GTA 6?',
    'GTA 6:',
    'GTA 6somewords',
    'GTA?6',
    'GTA:6',
  ]) {
    assert.equal(findMatch(title, gta), 'gta 6', title);
  }
});

test('gta 6 does not match nearby titles', () => {
  for (const title of ['I replayed GTA 5', 'GTA 60 facts', 'mygta 6 night', 'gta video 6', 'Top 6 GTA moments']) {
    assert.equal(findMatch(title, ['gta 6']), null, title);
  }
});

test('gta vi matches the roman numeral and text stuck to it', () => {
  assert.equal(findMatch('GTA VI story leak', gta), 'gta vi');
  assert.equal(findMatch('GTAVI is close', ['gta vi']), 'gta vi');
  assert.equal(findMatch('GTA-VI opening', ['gta vi']), 'gta vi');
  assert.equal(findMatch('GTA VI?', ['gta vi']), 'gta vi');
  assert.equal(findMatch('GTA VI:', ['gta vi']), 'gta vi');
  assert.equal(findMatch('The GTA video essay', ['gta vi']), null);
  assert.equal(findMatch('GTA VII rumors', ['gta vi']), null);
  assert.equal(findMatch('GTA vibe check', ['gta vi']), null);
});

test('any phrase matches when punctuation or more text is stuck on the end', () => {
  const phrase = 'elden ring';
  for (const title of ['Elden Ring?', 'Elden Ring:', 'Elden Ringsomewords', 'Elden?Ring notes']) {
    assert.equal(findMatch(title, [phrase]), phrase, title);
  }
  assert.equal(findMatch('Elden scroll ring', [phrase]), null);
});

test('grand theft auto phrases match the long name only', () => {
  assert.equal(findMatch('Grand Theft Auto VI — opening hour', gta), 'grand theft auto vi');
  assert.equal(findMatch('Grand Theft Auto 6 secrets', gta), 'grand theft auto 6');
  assert.equal(findMatch('Grand Theft Auto V', gta), null);
});

test('a phrase is found inside a longer block of text', () => {
  assert.equal(findMatch('Saturday market\nWe somehow got onto GTA 6', ['gta 6']), 'gta 6');
});

test('punctuation in a saved phrase is escaped', () => {
  assert.equal(findMatch('Learn C++ today', ['c++']), 'c++');
  assert.equal(findMatch('Learn C+ today', ['c++']), null);
});

test('normalizePhrase folds case, dashes, and slashes', () => {
  assert.equal(normalizePhrase('  GTA/6!! '), 'gta 6');
  assert.equal(normalizePhrase('GTA-VI'), 'gta vi');
  assert.equal(normalizePhrase('“Grand Theft Auto 6”'), 'grand theft auto 6');
  assert.equal(normalizePhrase('!!!'), '');
});
