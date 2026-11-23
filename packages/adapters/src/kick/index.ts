import { clean, outermostMatches, textsFrom, type CardText, type PlatformAdapter } from '@muty/core';
import { idlePage } from '../post.ts';

const HOST = /^https:\/\/([a-z0-9-]+\.)*kick\.com\//i;
const CARD = [
  '[data-testid="livestream-results-card"]',
  '[data-testid="category-card-root"]',
  '[data-testid="clips-card"]',
  '[data-testid^="sidebar-recommended-channel-"]',
  '[data-testid="chatroom-messages"] [data-index]',
].join(',');

function kickChannelHeader(root: ParentNode): Element | null {
  const title = root.querySelector('[data-testid="livestream-title"]');
  if (!title) return null;
  let node: Element = title;
  for (let depth = 0; depth < 8; depth += 1) {
    const parent = node.parentElement;
    if (!parent) return node;
    if (parent.querySelector('#injected-channel-player, [data-testid="chatroom-messages"], [data-testid="livestream-results-card"]')) {
      return node;
    }
    if (parent.querySelector('a[href*="/category/"]')) return parent;
    node = parent;
  }
  return title;
}

function findKickTargets(root: ParentNode): Element[] {
  const cards = outermostMatches(root, CARD);
  const header = kickChannelHeader(root);
  const player = root.querySelector('#injected-channel-player');
  for (const extra of [header, player]) {
    if (extra && !cards.some((card) => card === extra || card.contains(extra))) cards.push(extra);
  }
  return cards.filter((card) => !cards.some((other) => other !== card && other.contains(card)));
}

function textCard(text: string): CardText {
  return { title: text, channel: '', description: '', haystack: text };
}

function separateText(element: ParentNode): string {
  const title = textsFrom(element, ['h2', 'h3', '[data-testid="livestream-title"]']);
  const category = textsFrom(element, ['a[href*="/category/"]']);
  const message = textsFrom(element, ['span.font-normal']);
  return [title, category, message].filter(Boolean).join('\n');
}

function readKick(element: Element): CardText {
  if (element.id === 'injected-channel-player') {
    const header = kickChannelHeader(element.ownerDocument);
    return textCard(header ? separateText(header) : '');
  }
  return textCard(separateText(element) || clean(element.textContent));
}

export function createKickAdapter(): PlatformAdapter {
  return {
    id: 'kick',
    label: 'Kick',
    matches: ['https://kick.com/*', 'https://www.kick.com/*', 'https://*.kick.com/*'],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets: findKickTargets,
    readCard: readKick,
    createPageController: idlePage,
  };
}
