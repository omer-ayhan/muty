import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings } from '@muty/core';
import { parseHTML } from 'linkedom';
import { createKickAdapter } from './index.ts';

const settings = normalizeSettings({ keywords: ['gta 6', 'grand theft auto vi'] });

test('a Kick stream card hides when the category matches and a GTA V card stays', () => {
  const { document } = parseHTML(`
    <div>
      <div data-testid="livestream-results-card" id="bad">
        <h3>late night irl</h3>
        <a href="/someone">Someone</a>
        <a href="/category/grand-theft-auto-vi">Grand Theft Auto VI (GTA)</a>
      </div>
      <div data-testid="livestream-results-card" id="five">
        <h3>story mode</h3>
        <a href="/category/grand-theft-auto-v">Grand Theft Auto V (GTA)</a>
      </div>
      <div data-testid="clips-card" id="clip">
        <h3>etaztjgzyhrfxsj</h3>
        <a href="/category/grand-theft-auto-vi">Grand Theft Auto VI (GTA)</a>
      </div>
      <div data-testid="category-card-root" id="category">
        <h3>Grand Theft Auto VI (GTA)</h3>
      </div>
    </div>
  `);
  applyFeed(document, createKickAdapter(), settings, {});
  assert.equal(document.querySelector('#bad')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#clip')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#category')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#five')?.classList.contains('muty-hidden'), false);
});

test('a Kick category still hides when the viewer count is stuck to it', () => {
  const { document } = parseHTML(`
    <div data-testid="livestream-results-card" id="glued">
      <span>38</span><a href="/category/grand-theft-auto-vi">Grand Theft Auto VI (GTA)</a>
    </div>
  `);
  applyFeed(document, createKickAdapter(), settings, {});
  assert.equal(document.querySelector('#glued')?.classList.contains('muty-hidden'), true);
});

test('a Kick chat line and the live player hide when the page is about the phrase', () => {
  const { document } = parseHTML(`
    <div>
      <div id="injected-channel-player">video</div>
      <div id="about">
        <h2 data-testid="livestream-title">late night irl</h2>
        <a href="/category/grand-theft-auto-vi">Grand Theft Auto VI (GTA)</a>
      </div>
      <div data-testid="chatroom-messages">
        <div data-index="0" id="bad"><span>the GTA 6 map leaked</span></div>
        <div data-index="1" id="ok"><span>hello from the gym</span></div>
      </div>
    </div>
  `);
  applyFeed(document, createKickAdapter(), settings, {});
  assert.equal(document.querySelector('#injected-channel-player')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#about')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#bad')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('muty-hidden'), false);
});
