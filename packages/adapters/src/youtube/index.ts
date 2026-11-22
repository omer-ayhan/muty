import type { PlatformAdapter } from '@spoiler-mute/core';
import { collapseYouTubeShelves, findYouTubeTargets, readYouTubeCard } from './feed.ts';
import { createYouTubePage } from './page.ts';

const HOST = /^https:\/\/(www|m)\.youtube\.com\//i;

export function createYouTubeAdapter(): PlatformAdapter {
  return {
    id: 'youtube',
    label: 'YouTube',
    matches: ['https://www.youtube.com/*', 'https://m.youtube.com/*'],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets: findYouTubeTargets,
    readCard: readYouTubeCard,
    afterFeed: collapseYouTubeShelves,
    createPageController: createYouTubePage,
  };
}
