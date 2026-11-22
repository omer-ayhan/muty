import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings } from '@spoiler-mute/core';
import { parseHTML } from 'linkedom';
import { createTwitterAdapter } from './index.ts';

const settings = normalizeSettings({ keywords: ['gta 6'] });

test('a tweet hides on the tweet text and can match the name', () => {
  const { document } = parseHTML(`
    <div>
      <article data-testid="tweet" id="bad">
        <div data-testid="tweetText">GTA 6 ending explained</div>
      </article>
      <article data-testid="tweet" id="name">
        <div data-testid="User-Name">GTA 6 Daily</div>
        <div data-testid="tweetText">You will not believe this</div>
      </article>
      <article data-testid="tweet" id="quoted">
        <div data-testid="tweetText">Rain on the window</div>
        <article data-testid="tweet" id="inner">
          <div data-testid="tweetText">GTA 6 leak</div>
        </article>
      </article>
    </div>
  `);
  const twitter = createTwitterAdapter();
  applyFeed(document, twitter, settings, {});
  assert.equal(document.querySelector('#bad')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#name')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#quoted')?.classList.contains('spoiler-mute-hidden'), true);
  applyFeed(document, twitter, normalizeSettings({ keywords: ['gta 6'], matchTwitterName: false }), {});
  assert.equal(document.querySelector('#name')?.classList.contains('spoiler-mute-hidden'), false);
  assert.equal(document.querySelector('#bad')?.classList.contains('spoiler-mute-hidden'), true);
});

test('a matching tweet hides its timeline cell', () => {
  const { document } = parseHTML(`
    <div data-testid="cellInnerDiv" id="cell">
      <article data-testid="tweet" id="tweet">
        <div data-testid="tweetText">GTA 6 ending explained</div>
      </article>
    </div>
  `);
  applyFeed(document, createTwitterAdapter(), settings, {});
  assert.equal(document.querySelector('#tweet')?.classList.contains('spoiler-mute-hidden'), true);
  assert.equal(document.querySelector('#cell')?.classList.contains('spoiler-mute-hidden'), true);
});
