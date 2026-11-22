import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyFeed, normalizeSettings } from '@spoiler-mute/core';
import { createYouTubeAdapter } from '@spoiler-mute/adapters';
import { parseHTML } from 'linkedom';

test('the sample feed hides GTA 6 titles and leaves the lookalikes', () => {
  const htmlPath = fileURLToPath(new URL('../demo/index.html', import.meta.url));
  const html = fs.readFileSync(htmlPath, 'utf8');
  const { document } = parseHTML(html);
  const root = document.querySelector('#feed');
  if (!root) throw new Error('missing sample feed');
  const feed: Element = root;
  const youtube = createYouTubeAdapter();
  const settings = normalizeSettings(null);
  applyFeed(feed, youtube, settings, {});

  function hidden(text: string): boolean {
    const cards = [...feed.querySelectorAll('[data-sample]')];
    const card = cards.find((entry) => (entry.textContent ?? '').includes(text));
    assert.ok(card, `missing sample card: ${text}`);
    return card.classList.contains('spoiler-mute-hidden');
  }

  assert.equal(hidden('GTA 6 ending explained'), true);
  assert.equal(hidden('GTA6 map, fully walked'), true);
  assert.equal(hidden('Grand Theft Auto VI'), true);
  assert.equal(hidden('GTA-6 leak reaction'), true);
  assert.equal(hidden('GTA VI in 20 seconds'), true);
  assert.equal(hidden('Just watched the GTA 6 ending'), true);
  assert.equal(hidden('Rain on the window'), false);
  assert.equal(hidden('I replayed GTA 5'), false);
  assert.equal(hidden('The GTA video essay'), false);
  assert.equal(hidden('Sourdough in a cold kitchen'), false);
  assert.equal(hidden('You will not believe this'), false);

  applyFeed(feed, youtube, normalizeSettings({ ...settings, matchChannel: true }), {});
  assert.equal(hidden('You will not believe this'), true);
});
