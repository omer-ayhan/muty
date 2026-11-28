import { HIDDEN_CLASS, clean, setHidden, type CardText, type PlatformAdapter } from '@muty/core';
import { idlePage } from '../post.ts';

const HOST = /^https:\/\/((www|old|new|np|sh|m)\.)?reddit\.com\//i;
const POST = [
  'shreddit-post',
  'shreddit-ad-post',
  'search-telemetry-tracker[data-testid="search-sdui-post"]',
  '.thing.link',
].join(',');
const COMMENT = 'shreddit-comment, .thing.comment';
const NESTED = 'shreddit-comment, shreddit-post, shreddit-ad-post, .thing.comment, .thing.link';
const POST_TEXT = [
  '[slot="title"]',
  '[slot="text-body"]',
  '[slot="post-flair"]',
  'shreddit-post-flair',
  'a.title',
  'a.subreddit',
  '.expando .usertext-body',
];
const COMMENT_TEXT = ['[slot="comment"]', '[id$="-comment-rtjson-content"]', '.usertext-body'];
const ATTRS = ['post-title', 'subreddit-prefixed-name', 'subreddit-name', 'data-subreddit-prefixed', 'data-subreddit'];

function isComment(element: Element): boolean {
  return element.matches(COMMENT);
}

function cardText(text: string): CardText {
  return { title: text, channel: '', description: '', haystack: text };
}

function ownText(node: Element): string {
  if (!node.querySelector(NESTED)) return clean(node.textContent);
  const copy = node.cloneNode(true) as Element;
  for (const nested of copy.querySelectorAll(NESTED)) nested.remove();
  return clean(copy.textContent);
}

function collected(element: Element, selectors: readonly string[]): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | null | undefined) => {
    const text = clean(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    parts.push(text);
  };

  const hosts = isComment(element) ? [element] : [element, ...element.querySelectorAll(POST)];
  for (const host of hosts) {
    if (host !== element && host.closest(COMMENT)) continue;
    for (const name of ATTRS) add(host.getAttribute(name));
  }

  for (const selector of selectors) {
    for (const node of element.querySelectorAll(selector)) {
      const comment = node.closest(COMMENT);
      if (isComment(element)) {
        if (comment && comment !== element) continue;
      } else if (comment) {
        continue;
      }
      add(ownText(node));
    }
  }

  return parts.join('\n');
}

function readReddit(element: Element): CardText {
  const selectors = isComment(element) ? COMMENT_TEXT : POST_TEXT;
  return cardText(collected(element, selectors));
}

function findRedditTargets(root: ParentNode): Element[] {
  const posts = [...root.querySelectorAll(POST)];
  const outerPosts = posts.filter((post) => !posts.some((other) => other !== post && other.contains(post)));
  return [...outerPosts, ...root.querySelectorAll(COMMENT)];
}

function hidePostShell(root: ParentNode, _compiled: unknown, forceShow: boolean): void {
  for (const card of root.querySelectorAll(POST)) {
    const shell = card.closest('article');
    if (!shell || shell === card) continue;
    const cards = [...shell.querySelectorAll(POST)];
    const top = cards.filter((item) => !cards.some((other) => other !== item && other.contains(item)));
    if (top.length !== 1 || top[0] !== card) continue;
    setHidden(shell, !forceShow && card.classList.contains(HIDDEN_CLASS));
  }
}

export function createRedditAdapter(): PlatformAdapter {
  return {
    id: 'reddit',
    label: 'Reddit',
    matches: [
      'https://www.reddit.com/*',
      'https://reddit.com/*',
      'https://old.reddit.com/*',
      'https://new.reddit.com/*',
      'https://np.reddit.com/*',
      'https://sh.reddit.com/*',
      'https://m.reddit.com/*',
    ],
    testUrl(url) {
      return HOST.test(url);
    },
    findTargets: findRedditTargets,
    readCard: readReddit,
    afterFeed: hidePostShell,
    createPageController: idlePage,
  };
}
