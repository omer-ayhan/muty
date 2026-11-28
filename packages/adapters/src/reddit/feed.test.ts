import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings } from '@muty/core';
import { parseHTML } from 'linkedom';
import { createRedditAdapter } from './index.ts';

const settings = normalizeSettings({ keywords: ['gta 6', 'grand theft auto vi'] });
const reddit = createRedditAdapter();

function hidden(document: Document, id: string): boolean {
  return document.querySelector(`#${id}`)?.classList.contains('muty-hidden') === true;
}

test('a Reddit post hides on the title, body, flair, or subreddit, and a GTA 5 post stays', () => {
  const { document } = parseHTML(`
    <div>
      <article id="shell">
        <shreddit-post id="title" post-title="GTA 6 ending explained" subreddit-prefixed-name="r/games">
          <a slot="title">GTA 6 ending explained</a>
        </shreddit-post>
      </article>
      <shreddit-post id="body" post-title="thoughts" subreddit-prefixed-name="r/games">
        <a slot="title">thoughts</a>
        <div slot="text-body">the map in GTA 6 leaked</div>
      </shreddit-post>
      <shreddit-post id="flair" post-title="look" subreddit-prefixed-name="r/games">
        <a slot="title">look</a>
        <span slot="post-flair">Grand Theft Auto VI</span>
      </shreddit-post>
      <shreddit-post id="sub" post-title="daily thread" subreddit-prefixed-name="r/GTA6">
        <a slot="title">daily thread</a>
      </shreddit-post>
      <shreddit-post id="five" post-title="GTA 5 is still fun" subreddit-prefixed-name="r/gaming">
        <a slot="title">GTA 5 is still fun</a>
      </shreddit-post>
      <shreddit-post id="user" post-title="hello" author="gta6daily" subreddit-prefixed-name="r/pics">
        <a slot="title">hello</a>
        <a href="/user/gta6daily">u/gta6daily</a>
      </shreddit-post>
    </div>
  `);
  applyFeed(document, reddit, settings, {});
  assert.equal(hidden(document, 'title'), true);
  assert.equal(hidden(document, 'shell'), true);
  assert.equal(hidden(document, 'body'), true);
  assert.equal(hidden(document, 'flair'), true);
  assert.equal(hidden(document, 'sub'), true);
  assert.equal(hidden(document, 'five'), false);
  assert.equal(hidden(document, 'user'), false);
});

test('a matching comment hides without taking the post or a sibling comment', () => {
  const { document } = parseHTML(`
    <div>
      <shreddit-post id="post" post-title="weather today" subreddit-prefixed-name="r/casual">
        <a slot="title">weather today</a>
      </shreddit-post>
      <shreddit-comment id="parent">
        <div slot="comment">nice weather</div>
        <shreddit-comment id="reply">
          <div slot="comment">the GTA 6 map leaked</div>
        </shreddit-comment>
      </shreddit-comment>
      <shreddit-comment id="ok">
        <div slot="comment">bring a coat</div>
      </shreddit-comment>
    </div>
  `);
  applyFeed(document, reddit, settings, {});
  assert.equal(hidden(document, 'post'), false);
  assert.equal(hidden(document, 'parent'), false);
  assert.equal(hidden(document, 'reply'), true);
  assert.equal(hidden(document, 'ok'), false);
});

test('a search result hides its card and the article around that one post', () => {
  const { document } = parseHTML(`
    <article id="shell">
      <search-telemetry-tracker data-testid="search-sdui-post" id="search">
        <shreddit-post post-title="GTA 6 trailer" subreddit-prefixed-name="r/games">
          <a slot="title">GTA 6 trailer</a>
        </shreddit-post>
      </search-telemetry-tracker>
    </article>
  `);
  applyFeed(document, reddit, settings, {});
  assert.equal(hidden(document, 'search'), true);
  assert.equal(hidden(document, 'shell'), true);
});

test('an article that holds more than one post stays up', () => {
  const { document } = parseHTML(`
    <article id="feed">
      <shreddit-post id="bad" post-title="GTA 6 leak" subreddit-prefixed-name="r/games">
        <a slot="title">GTA 6 leak</a>
      </shreddit-post>
      <shreddit-post id="ok" post-title="banana bread" subreddit-prefixed-name="r/baking">
        <a slot="title">banana bread</a>
      </shreddit-post>
    </article>
  `);
  applyFeed(document, reddit, settings, {});
  assert.equal(hidden(document, 'bad'), true);
  assert.equal(hidden(document, 'ok'), false);
  assert.equal(hidden(document, 'feed'), false);
});

test('old Reddit hides a matching post, subreddit, and comment', () => {
  const { document } = parseHTML(`
    <div>
      <div class="thing link" id="title" data-subreddit-prefixed="r/gaming">
        <p class="title"><a class="title" href="/r/gaming/">GTA 6 ending explained</a></p>
      </div>
      <div class="thing link" id="sub" data-subreddit-prefixed="r/GTA6">
        <p class="title"><a class="title">daily thread</a></p>
      </div>
      <div class="thing link" id="ok">
        <p class="title"><a class="title">banana bread</a></p>
      </div>
      <div class="thing comment" id="comment">
        <div class="entry"><div class="usertext-body"><div class="md">the GTA 6 map leaked</div></div></div>
        <div class="child">
          <div class="thing comment" id="child">
            <div class="entry"><div class="usertext-body"><div class="md">agreed</div></div></div>
          </div>
        </div>
      </div>
      <div class="thing comment" id="quiet">
        <div class="entry"><div class="usertext-body"><div class="md">hello</div></div></div>
      </div>
    </div>
  `);
  applyFeed(document, reddit, settings, {});
  assert.equal(hidden(document, 'title'), true);
  assert.equal(hidden(document, 'sub'), true);
  assert.equal(hidden(document, 'ok'), false);
  assert.equal(hidden(document, 'comment'), true);
  assert.equal(hidden(document, 'child'), false);
  assert.equal(hidden(document, 'quiet'), false);
});
