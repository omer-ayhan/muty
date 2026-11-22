import { HIDDEN_CLASS, outermostMatches, setHidden, type PlatformAdapter } from '@spoiler-mute/core';
import { idlePage, readPost } from '../post.ts';

const HOST = /^https:\/\/([a-z0-9-]+\.)*(twitter\.com|x\.com)\//i;
const CARD = '[data-testid="tweet"], [data-testid="cellInnerDiv"] article[role="article"]';
const TEXT = ['[data-testid="tweetText"]'];
const ACTOR = ['[data-testid="User-Name"]'];

export function createTwitterAdapter(): PlatformAdapter {
  return {
    id: 'twitter',
    label: 'Twitter',
    matches: [
      'https://twitter.com/*',
      'https://x.com/*',
      'https://www.twitter.com/*',
      'https://www.x.com/*',
      'https://*.twitter.com/*',
      'https://*.x.com/*',
    ],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets(root) {
      return outermostMatches(root, CARD);
    },
    readCard(element, settings) {
      return readPost(element, settings.matchTwitterName, TEXT, [], ACTOR);
    },
    afterFeed(root, _compiled, forceShow) {
      for (const cell of root.querySelectorAll('[data-testid="cellInnerDiv"]')) {
        const tweets = [...cell.querySelectorAll(CARD)].filter((tweet) => cell.contains(tweet));
        const allHidden =
          !forceShow && tweets.length > 0 && tweets.every((tweet) => tweet.classList.contains(HIDDEN_CLASS));
        setHidden(cell, allHidden);
      }
    },
    createPageController: idlePage,
  };
}
