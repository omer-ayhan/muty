import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORM_CATALOG } from '@spoiler-mute/core';
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
  assert.equal(adapterFor('https://example.com/'), null);
});
