import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GTA_PACK,
  addExcludedUrl,
  addKeyword,
  addPack,
  cautionFor,
  normalizeSettings,
  platformEnabled,
  removeExcludedUrl,
  removeKeyword,
  setPlatform,
  urlExcluded,
} from './settings.ts';

const allOn = { youtube: true, linkedin: true, twitter: true, kick: true, twitch: true };

test('missing settings fall back to the GTA 6 list', () => {
  const settings = normalizeSettings(null);
  assert.equal(settings.enabled, true);
  assert.equal(settings.matchChannel, false);
  assert.equal(settings.matchTwitterName, true);
  assert.equal(settings.coverWatch, true);
  assert.equal(settings.skipShorts, true);
  assert.deepEqual(settings.platforms, allOn);
  assert.equal(platformEnabled(settings, 'youtube'), true);
  assert.deepEqual(settings.keywords, [...GTA_PACK]);
  assert.deepEqual(settings.excludedUrls, []);
});

test('an empty keyword list stays empty', () => {
  const settings = normalizeSettings({
    keywords: [],
    enabled: false,
    matchChannel: true,
    matchTwitterName: false,
    coverWatch: false,
    skipShorts: false,
  });
  assert.deepEqual(settings.keywords, []);
  assert.equal(settings.enabled, false);
  assert.equal(settings.matchChannel, true);
  assert.equal(settings.matchTwitterName, false);
  assert.equal(settings.coverWatch, false);
  assert.equal(settings.skipShorts, false);
});

test('variants of the same phrase collapse', () => {
  const settings = normalizeSettings({ keywords: ['GTA 6', 'gta-6', 'GTA/6', 'baking'] });
  assert.deepEqual(settings.keywords, ['gta 6', 'baking']);
});

test('addKeyword rejects blanks, duplicates, and one-character words', () => {
  const settings = normalizeSettings({ keywords: ['gta 6'] });
  assert.equal(addKeyword(settings, '   ').ok, false);
  assert.equal(addKeyword(settings, 'a').ok, false);
  assert.equal(addKeyword(settings, 'GTA-6').ok, false);
  const added = addKeyword(settings, 'Ending leak');
  assert.equal(added.ok, true);
  if (added.ok) assert.deepEqual(added.settings.keywords, ['ending leak', 'gta 6']);
  assert.deepEqual(settings.keywords, ['gta 6']);
});

test('the list stops at 200 phrases', () => {
  const keywords = Array.from({ length: 200 }, (_item, index) => `word${index}ab`);
  const settings = normalizeSettings({ keywords });
  const outcome = addKeyword(settings, 'one more');
  assert.equal(outcome.ok, false);
});

test('removeKeyword and addPack round-trip the GTA words', () => {
  let settings = normalizeSettings({ keywords: ['baking'] });
  settings = addPack(settings, GTA_PACK);
  assert.deepEqual(settings.keywords.slice(0, 4), [...GTA_PACK]);
  settings = removeKeyword(settings, 'GTA 6');
  assert.equal(settings.keywords.includes('gta 6'), false);
  settings = addPack(settings, GTA_PACK);
  assert.equal(settings.keywords[0], 'gta 6');
});

test('a known platform stays on unless it is turned off', () => {
  const fresh = normalizeSettings({ keywords: ['baking'] });
  assert.equal(fresh.platforms.youtube, true);
  assert.equal(fresh.platforms.linkedin, true);
  assert.equal(fresh.platforms.twitter, true);
  assert.equal(fresh.platforms.kick, true);
  assert.equal(fresh.platforms.twitch, true);
  const off = normalizeSettings({ platforms: { youtube: false, vimeo: true } });
  assert.deepEqual(off.platforms, { youtube: false, linkedin: true, twitter: true, kick: true, twitch: true });
  assert.equal(platformEnabled(off, 'youtube'), false);
  const on = setPlatform(off, 'youtube', true);
  assert.equal(on.platforms.youtube, true);
  assert.equal(off.platforms.youtube, false);
  assert.equal(setPlatform(off, 'vimeo', true), off);
});

test('an excluded URL matches when the page address contains it', () => {
  const added = addExcludedUrl(normalizeSettings({ keywords: ['gta 6'] }), 'LinkedIn.com/search');
  assert.equal(added.ok, true);
  if (!added.ok) return;
  const page = 'https://www.linkedin.com/search/results/all/?keywords=gta%206';
  assert.equal(urlExcluded(added.settings, page), true);
  assert.equal(urlExcluded(added.settings, 'https://www.linkedin.com/in/someone'), false);
  const again = addExcludedUrl(added.settings, 'linkedin.com/search');
  assert.equal(again.ok, false);
  const removed = removeExcludedUrl(added.settings, 'linkedin.com/SEARCH');
  assert.deepEqual(removed.excludedUrls, []);
  assert.equal(urlExcluded(removed, page), false);
});

test('a single short word gets a caution', () => {
  assert.match(cautionFor('gta'), /short/i);
  assert.equal(cautionFor('gta 6'), '');
});
