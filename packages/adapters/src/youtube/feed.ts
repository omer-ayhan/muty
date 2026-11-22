import {
  HIDDEN_CLASS,
  clean,
  findMatch,
  setHidden,
  type CardText,
  type CompiledPhrase,
  type Settings,
} from '@spoiler-mute/core';

const OUTER_TAGS = new Set([
  'ytd-rich-item-renderer',
  'ytm-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-reel-item-renderer',
  'ytd-playlist-panel-video-renderer',
  'ytd-playlist-video-renderer',
  'ytm-video-with-context-renderer',
  'ytm-video-card-renderer',
  'ytm-compact-video-renderer',
  'ytm-playlist-panel-video-renderer',
  'ytm-channel-featured-video-renderer',
  'ytd-backstage-post-renderer',
  'ytm-backstage-post-renderer',
  'ytd-post-renderer',
]);

const LOOSE_TAGS = new Set([
  'yt-lockup-view-model',
  'ytm-shorts-lockup-view-model',
  'ytm-shorts-lockup-view-model-v2',
  'ytd-channel-renderer',
  'ytm-channel-renderer',
  'ytd-grid-channel-renderer',
  'ytd-compact-channel-renderer',
]);

const CHANNEL_CARDS = new Set([
  'ytd-channel-renderer',
  'ytm-channel-renderer',
  'ytd-grid-channel-renderer',
  'ytd-compact-channel-renderer',
]);

const CARD_SELECTOR = [...OUTER_TAGS, ...LOOSE_TAGS].join(',');
const SHELF_SELECTOR = [
  'ytd-rich-shelf-renderer',
  'ytd-reel-shelf-renderer',
  'ytm-rich-shelf-renderer',
  'ytm-reel-shelf-renderer',
  'ytd-rich-section-renderer',
  'ytd-shelf-renderer',
  'grid-shelf-view-model',
  'horizontal-shelf-view-model',
  'yt-official-card-view-model',
].join(',');
const EXEMPT_SELECTOR = '.spoiler-mute-ui, ytd-reel-video-renderer, ytd-miniplayer';

const TITLE_SELECTORS = [
  'a.ytLockupMetadataViewModelTitle',
  '.ytLockupMetadataViewModelTitle',
  'a.yt-lockup-metadata-view-model__title',
  '.yt-lockup-metadata-view-model__title',
  '#video-title',
  'a#video-title-link',
  'h3.shortsLockupViewModelHostMetadataTitle',
  '.shortsLockupViewModelHostMetadataTitle',
  '.YtmCompactMediaItemHeadline',
  '#content-text',
  '.ytmBackstagePostRendererHostContentText',
];

const DESCRIPTION_SELECTORS = [
  '#description-text',
  '.metadata-snippet-text',
  '.metadata-snippet-text-navigation',
  'yt-formatted-string.metadata-snippet-text',
];

const CHANNEL_SELECTORS = [
  'ytd-channel-name a',
  'ytd-channel-name #text',
  '#channel-name a',
  '#channel-name #text',
  '.ytContentMetadataViewModelMetadataRow a',
  '.yt-content-metadata-view-model__metadata-row a',
  '.YtmCompactMediaItemByline',
  '.ytSpecAvatarShapeHost',
];

interface Budget {
  nodes: number;
  depth: number;
}

function tagName(node: Element | null): string {
  return node?.tagName ? node.tagName.toLowerCase() : '';
}

function elementText(el: Element): string {
  const titled = clean(el.getAttribute('title'));
  if (titled) return titled;
  const text = clean(el.textContent);
  if (text) return text;
  return clean(el.getAttribute('aria-label')).replace(/^go to channel\s+/i, '').trim();
}

function textFrom(root: ParentNode | null, selectors: readonly string[]): string {
  if (!root || !('querySelector' in root)) return '';
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    const text = el ? elementText(el) : '';
    if (text) return text;
  }
  return '';
}

function isElement(node: ParentNode): node is Element {
  return node.nodeType === 1;
}

function textFromShadows(root: ParentNode | null, selectors: readonly string[], budget: Budget): string {
  if (!root || budget.nodes > 500 || budget.depth > 6) return '';
  if (isElement(root) && root.shadowRoot) {
    budget.depth += 1;
    const inHost = textFrom(root.shadowRoot, selectors) || textFromShadows(root.shadowRoot, selectors, budget);
    budget.depth -= 1;
    if (inHost) return inHost;
  }
  for (const el of root.querySelectorAll('*')) {
    budget.nodes += 1;
    if (!el.shadowRoot) continue;
    budget.depth += 1;
    const found = textFrom(el.shadowRoot, selectors) || textFromShadows(el.shadowRoot, selectors, budget);
    budget.depth -= 1;
    if (found) return found;
  }
  return '';
}

function firstText(root: ParentNode, selectors: readonly string[]): string {
  return textFrom(root, selectors) || textFromShadows(root, selectors, { nodes: 0, depth: 0 });
}

function looksLikeStats(text: string): boolean {
  if (!text) return true;
  if (/^[\d,.]+[kmb]?\s+views?$/i.test(text)) return true;
  if (/\b(views?|watching|subscribers?)\b/i.test(text) && /\d/.test(text)) return true;
  if (/^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.test(text)) return true;
  return false;
}

function readChannel(card: Element): string {
  for (const selector of CHANNEL_SELECTORS) {
    const text = firstText(card, [selector]);
    if (text && !looksLikeStats(text)) return text;
  }
  return '';
}

function findElement(root: ParentNode | null, selector: string, budget: Budget): Element | null {
  if (!root || budget.nodes > 500 || budget.depth > 6) return null;
  if ('querySelector' in root) {
    const found = root.querySelector(selector);
    if (found) return found;
  }
  if (isElement(root) && root.shadowRoot) {
    budget.depth += 1;
    const inHost = findElement(root.shadowRoot, selector, budget);
    budget.depth -= 1;
    if (inHost) return inHost;
  }
  for (const el of root.querySelectorAll('*')) {
    budget.nodes += 1;
    if (!el.shadowRoot) continue;
    budget.depth += 1;
    const nested = findElement(el.shadowRoot, selector, budget);
    budget.depth -= 1;
    if (nested) return nested;
  }
  return null;
}

function ariaTitle(card: Element): string {
  const link = findElement(card, 'a[href*="/watch"], a[href*="/shorts/"]', { nodes: 0, depth: 0 });
  const aria = link?.getAttribute('aria-label');
  if (!aria) return '';
  const [title] = clean(aria).split(/\s+by\s+/i);
  return (title ?? '').trim();
}

export function readYouTubeCard(card: Element, settings: Settings): CardText {
  let title = firstText(card, TITLE_SELECTORS) || ariaTitle(card);
  if (!title && CHANNEL_CARDS.has(tagName(card))) title = readChannel(card);
  const description = firstText(card, DESCRIPTION_SELECTORS);
  const channel = settings.matchChannel ? readChannel(card) : '';
  const haystack = [title, description, channel].filter(Boolean).join('\n');
  return { title, channel, description, haystack };
}

function isExempt(node: Element): boolean {
  return Boolean(node.closest(EXEMPT_SELECTOR));
}

function outermost(node: Element): Element {
  let best = node;
  let current: Element | null = node;
  while (current?.parentElement) {
    current = current.parentElement;
    if (!OUTER_TAGS.has(tagName(current))) continue;
    const nestedCards = current.querySelectorAll(CARD_SELECTOR).length;
    if (nestedCards > 12) break;
    best = current;
  }
  return best;
}

function targetsIn(root: ParentNode): Element[] {
  const seen = new Set<Element>();
  const targets: Element[] = [];
  for (const node of root.querySelectorAll(CARD_SELECTOR)) {
    if (isExempt(node)) continue;
    const target = outermost(node);
    if (seen.has(target) || isExempt(target)) continue;
    seen.add(target);
    targets.push(target);
  }
  return targets;
}

function sectionTitle(shelf: Element): string {
  const title = shelf.querySelector('.ytPageHeaderViewModelTitle, h1.dynamicTextViewModelH1');
  return title ? clean(title.textContent) : '';
}

export function collapseYouTubeShelves(
  root: ParentNode,
  compiled: readonly CompiledPhrase[],
  forceShow: boolean,
): void {
  for (const shelf of root.querySelectorAll(SHELF_SELECTOR)) {
    const targets = targetsIn(shelf).filter((target) => shelf.contains(target));
    const allHidden =
      !forceShow && targets.length > 0 && targets.every((target) => target.classList.contains(HIDDEN_CLASS));
    const title = sectionTitle(shelf);
    const titleHit = !forceShow && Boolean(title && findMatch(title, compiled));
    setHidden(shelf, allHidden || titleHit);
  }
}

export function findYouTubeTargets(root: ParentNode): Element[] {
  return targetsIn(root);
}
