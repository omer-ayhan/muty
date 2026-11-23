import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings } from '@spoiler-mute/core';
import { parseHTML } from 'linkedom';
import { createTwitchAdapter } from './index.ts';

const settings = normalizeSettings({ keywords: ['gta 6', 'grand theft auto vi'] });

test('a Twitch stream card, category, and sidebar row hide when the game matches', () => {
  const { document } = parseHTML(`
    <div>
      <article id="bad">
        <a data-a-target="preview-card-image-link" href="/someone"></a>
        <a data-a-target="preview-card-channel-link" href="/someone">
          <h4>just hanging out</h4>
          <p data-a-target="preview-card-channel-link">someone</p>
        </a>
        <a data-a-target="preview-card-game-link" href="/directory/category/grand-theft-auto-vi">Grand Theft Auto VI</a>
      </article>
      <article id="ok">
        <a data-a-target="preview-card-image-link" href="/baker"></a>
        <a data-a-target="preview-card-channel-link" href="/baker"><h4>sourdough</h4></a>
        <a data-a-target="preview-card-game-link" href="/directory/category/just-chatting">Just Chatting</a>
      </article>
      <div id="category">
        <a data-a-target="tw-box-art-card-link" href="/directory/category/grand-theft-auto-vi"></a>
        <div data-a-target="tw-card-title"><h2>Grand Theft Auto VI</h2></div>
      </div>
      <div id="five">
        <a data-a-target="tw-box-art-card-link" href="/directory/category/grand-theft-auto-v"></a>
        <div data-a-target="tw-card-title"><h2>Grand Theft Auto V</h2></div>
      </div>
      <a data-test-selector="recommended-channel" id="side" href="/caseoh_">
        <p data-a-target="side-nav-title">caseoh_</p>
        <p>Grand Theft Auto VI</p>
      </a>
    </div>
  `);
  applyFeed(document, createTwitchAdapter(), settings, {});
  assert.equal(document.querySelector('#bad')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#category')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#side')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('spoiler-mute-hidden'), false);
  assert.equal(document.querySelector('#five')?.classList.contains('spoiler-mute-hidden'), false);
});

test('a Twitch category still hides when a badge is stuck to it', () => {
  const { document } = parseHTML(`
    <article id="glued">
      <a data-a-target="preview-card-image-link" href="/caseoh_"></a>
      <h4>losing my mind</h4>
      <a data-a-target="preview-card-game-link" href="/directory/category/grand-theft-auto-vi">Grand Theft Auto VI</a><span>Drops Enabled</span>
    </article>
  `);
  applyFeed(document, createTwitchAdapter(), settings, {});
  assert.equal(document.querySelector('#glued')?.classList.contains('spoiler-mute-hidden'), true);
});

test('a Twitch chat line and the live player hide when the stream or message matches', () => {
  const { document } = parseHTML(`
    <div>
      <div data-a-target="video-player" id="player"></div>
      <p data-a-target="stream-title">losing my mind</p>
      <a data-a-target="stream-game-link" href="/directory/category/grand-theft-auto-vi">Grand Theft Auto VI</a>
      <div data-a-target="chat-line-message" id="bad" class="chat-line__message">
        <span data-a-target="chat-message-username">viewer</span>
        <span data-a-target="chat-line-message-body">the GTA 6 ending</span>
      </div>
      <div data-a-target="chat-line-message" id="ok" class="chat-line__message">
        <span data-a-target="chat-line-message-body">go back</span>
      </div>
    </div>
  `);
  applyFeed(document, createTwitchAdapter(), settings, {});
  assert.equal(document.querySelector('#player')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('[data-a-target="stream-game-link"]')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('[data-a-target="stream-title"]')?.classList.contains('spoiler-mute-hidden'), false);
  assert.equal(document.querySelector('#bad')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('spoiler-mute-hidden'), false);
});
