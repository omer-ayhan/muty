import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORM_CATALOG } from '@muty/core';
import { adapterFor, adapters } from './index.ts';

test('every catalog platform has one adapter', () => {
  assert.deepEqual(
    adapters.map((adapter) => adapter.id),
    PLATFORM_CATALOG.map((platform) => platform.id),
  );
});

test('a url picks the matching adapter', () => {
  assert.equal(adapterFor('https://www.youtube.com/watch?v=1')?.id, 'youtube');
  assert.equal(adapterFor('https://m.youtube.com/shorts/abc')?.id, 'youtube');
  assert.equal(adapterFor('https://www.linkedin.com/feed/')?.id, 'linkedin');
  assert.equal(adapterFor('https://x.com/home')?.id, 'twitter');
  assert.equal(adapterFor('https://twitter.com/home')?.id, 'twitter');
  assert.equal(adapterFor('https://kick.com/browse')?.id, 'kick');
  assert.equal(adapterFor('https://www.kick.com/3mr')?.id, 'kick');
  assert.equal(adapterFor('https://www.twitch.tv/directory/all')?.id, 'twitch');
  assert.equal(adapterFor('https://twitch.tv/caseoh_')?.id, 'twitch');
  assert.equal(adapterFor('https://www.twitch.com/')?.id, 'twitch');
  assert.equal(adapterFor('https://www.reddit.com/r/games/')?.id, 'reddit');
  assert.equal(adapterFor('https://reddit.com/r/all/')?.id, 'reddit');
  assert.equal(adapterFor('https://old.reddit.com/r/games/comments/abc/title/')?.id, 'reddit');
  assert.equal(adapterFor('https://new.reddit.com/')?.id, 'reddit');
  assert.equal(adapterFor('https://np.reddit.com/r/games/')?.id, 'reddit');
  assert.equal(adapterFor('https://sh.reddit.com/r/games/')?.id, 'reddit');
  assert.equal(adapterFor('https://m.reddit.com/')?.id, 'reddit');
  assert.equal(adapterFor('https://ads.reddit.com/'), null);
  assert.equal(adapterFor('https://example.com/'), null);
});
