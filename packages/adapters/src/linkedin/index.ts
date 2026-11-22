import { clean, outermostMatches, textsFrom, type CardText, type PlatformAdapter, type Settings } from '@spoiler-mute/core';
import { idlePage, readPost } from '../post.ts';

const HOST = /^https:\/\/([a-z0-9-]+\.)*linkedin\.com\//i;
const CARD = [
  '[data-testid="mainFeed"] [role="listitem"]',
  '[data-test-id="mainFeed"] [role="listitem"]',
  'main [role="listitem"]',
  '[role="main"] [role="listitem"]',
  '.search-results-container [role="listitem"]',
  '.search-results-container li',
  '[data-chameleon-result-urn]',
  'li.reusable-search__result-container',
  '.entity-result',
  'article.main-feed-activity-card',
  'li.feed-item',
  '.feed-shared-update-v2',
  '.occludable-update',
].join(',');
const TEXT = [
  '[data-testid="expandable-text-box"]',
  '.update-components-text',
  '.feed-shared-inline-show-more-text',
  '.update-components-update-v2__commentary',
  '.feed-shared-update-v2__description',
  '[data-test-id="main-feed-activity-card__commentary"]',
  '.entity-result__title-text',
  '.entity-result__primary-subtitle',
  '.entity-result__summary',
];
const ACTOR = [
  '.update-components-actor__name',
  '.feed-shared-actor__name',
  '[data-test-id="main-feed-activity-card__entity-lockup"] a',
  'a[href*="/in/"]',
];

function readLinkedInCard(element: Element, settings: Settings): CardText {
  const body = textsFrom(element, TEXT);
  if (body) return readPost(element, settings.matchChannel, TEXT, [], ACTOR);
  const text = clean(element.textContent);
  return { title: text, channel: '', description: '', haystack: text };
}

export function createLinkedInAdapter(): PlatformAdapter {
  return {
    id: 'linkedin',
    label: 'LinkedIn',
    matches: ['https://www.linkedin.com/*', 'https://*.linkedin.com/*', 'https://linkedin.com/*'],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets(root) {
      const cards = outermostMatches(root, CARD);
      for (const box of root.querySelectorAll('[data-testid="expandable-text-box"]')) {
        const card = box.closest('[role="listitem"], li, article') ?? box;
        if (!cards.includes(card)) cards.push(card);
      }
      return cards.filter((card) => !cards.some((other) => other !== card && other.contains(card)));
    },
    readCard(element, settings) {
      return readLinkedInCard(element, settings);
    },
    createPageController: idlePage,
  };
}
