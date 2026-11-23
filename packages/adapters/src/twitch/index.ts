import { clean, textsFrom, type CardText, type PlatformAdapter } from '@muty/core';
import { idlePage } from '../post.ts';

const HOST = /^https:\/\/([a-z0-9-]+\.)*(twitch\.tv|twitch\.com)\//i;
const ROW = [
  'a[data-test-selector="recommended-channel"]',
  'a[data-test-selector="followed-channel"]',
  '[data-a-target="chat-line-message"]',
  '[data-a-target="stream-title"]',
  '[data-a-target="stream-game-link"]',
  '[data-a-target="video-player"]',
].join(',');

function boxArtCard(link: Element): Element {
  let node: Element = link;
  for (let depth = 0; depth < 5; depth += 1) {
    if (node.querySelector('[data-a-target="tw-card-title"]')) return node;
    if (!node.parentElement) return node;
    node = node.parentElement;
  }
  return link;
}

function watchText(root: ParentNode): string {
  const title = clean(root.querySelector('[data-a-target="stream-title"]')?.textContent);
  const game = clean(root.querySelector('[data-a-target="stream-game-link"]')?.textContent);
  return [title, game].filter(Boolean).join('\n');
}

function findTwitchTargets(root: ParentNode): Element[] {
  const cards: Element[] = [];
  const add = (node: Element | null) => {
    if (!node || cards.includes(node)) return;
    cards.push(node);
  };
  for (const link of root.querySelectorAll(
    '[data-a-target="preview-card-image-link"], [data-a-target="preview-card-channel-link"], [data-a-target="preview-card-title-link"]',
  )) {
    add(link.closest('article') ?? link);
  }
  for (const link of root.querySelectorAll('[data-a-target="tw-box-art-card-link"]')) add(boxArtCard(link));
  for (const row of root.querySelectorAll(ROW)) add(row);
  return cards.filter((card) => !cards.some((other) => other !== card && other.contains(card)));
}

function textCard(text: string): CardText {
  return { title: text, channel: '', description: '', haystack: text };
}

function separateText(element: ParentNode): string {
  const title = textsFrom(element, [
    'h3',
    'h4',
    '[data-a-target="preview-card-title-link"]',
    '[data-a-target="stream-title"]',
    '[data-a-target="tw-card-title"]',
  ]);
  const game = textsFrom(element, [
    '[data-a-target="preview-card-game-link"]',
    '[data-a-target="stream-game-link"]',
    '.side-nav-card__metadata',
  ]);
  const chat = textsFrom(element, ['[data-a-target="chat-line-message-body"]', '[data-a-target="chat-message-text"]']);
  return [title, game, chat].filter(Boolean).join('\n');
}

function readTwitch(element: Element): CardText {
  if (element.getAttribute('data-a-target') === 'video-player') return textCard(watchText(element.ownerDocument));
  return textCard(separateText(element) || clean(element.textContent));
}

export function createTwitchAdapter(): PlatformAdapter {
  return {
    id: 'twitch',
    label: 'Twitch',
    matches: [
      'https://www.twitch.tv/*',
      'https://twitch.tv/*',
      'https://m.twitch.tv/*',
      'https://*.twitch.tv/*',
      'https://www.twitch.com/*',
      'https://twitch.com/*',
      'https://*.twitch.com/*',
    ],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets: findTwitchTargets,
    readCard: readTwitch,
    createPageController: idlePage,
  };
}
