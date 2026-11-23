import type { PlatformId } from './platforms.ts';
import type { Settings } from './settings.ts';
import { compilePhrase, findMatch, type CompiledPhrase } from './match.ts';

export const HIDDEN_CLASS = 'muty-hidden';

export interface CardText {
  title: string;
  channel: string;
  description: string;
  haystack: string;
}

export interface FeedResult {
  matches: number;
  hidden: number;
}

export interface PageScan {
  document: Document;
  location: Location;
  settings: Settings;
  filtering: boolean;
  scan: () => void;
}

export interface PageController {
  start(document: Document): void;
  onScan(input: PageScan): void;
  onNavigate(): void;
  onNavigateStart(): void;
}

export interface PlatformAdapter {
  id: PlatformId;
  label: string;
  matches: readonly string[];
  testUrl(url: string): boolean;
  findTargets(root: ParentNode): Element[];
  readCard(element: Element, settings: Settings): CardText;
  afterFeed?(root: ParentNode, compiled: readonly CompiledPhrase[], forceShow: boolean): void;
  createPageController?(): PageController;
}

export function setHidden(node: Element, hidden: boolean): void {
  node.classList.toggle(HIDDEN_CLASS, hidden);
  if (!('style' in node)) return;
  const style = (node as HTMLElement).style;
  if (!style || typeof style.setProperty !== 'function') return;
  if (hidden) {
    style.setProperty('display', 'none', 'important');
    node.setAttribute('data-sm-style', '1');
    return;
  }
  if (node.getAttribute('data-sm-style') === '1') {
    style.removeProperty('display');
    node.removeAttribute('data-sm-style');
  }
}

export function clearMarks(root: ParentNode): void {
  for (const node of root.querySelectorAll(`.${HIDDEN_CLASS}, [data-sm-card]`)) {
    setHidden(node, false);
    node.removeAttribute('data-sm-card');
    node.removeAttribute('data-sm-phrase');
  }
}

export function applyFeed(
  root: ParentNode,
  adapter: PlatformAdapter,
  settings: Settings,
  options: { forceShow?: boolean } = {},
): FeedResult {
  const forceShow = Boolean(options.forceShow);
  if (!settings.enabled || settings.keywords.length === 0) {
    clearMarks(root);
    return { matches: 0, hidden: 0 };
  }

  const compiled: CompiledPhrase[] = [];
  for (const keyword of settings.keywords) {
    const phrase = compilePhrase(keyword);
    if (phrase) compiled.push(phrase);
  }

  let matches = 0;
  let hidden = 0;
  const seen = new Set<Element>();

  for (const target of adapter.findTargets(root)) {
    if (seen.has(target)) continue;
    seen.add(target);
    const card = adapter.readCard(target, settings);
    if (!card.haystack) continue;
    const phrase = findMatch(card.haystack, compiled);
    const shouldHide = Boolean(phrase) && !forceShow;
    setHidden(target, shouldHide);
    target.setAttribute('data-sm-card', phrase ? 'hide' : 'show');
    if (phrase) {
      matches += 1;
      target.setAttribute('data-sm-phrase', phrase);
      if (shouldHide) hidden += 1;
    } else {
      target.removeAttribute('data-sm-phrase');
    }
  }

  adapter.afterFeed?.(root, compiled, forceShow);
  return { matches, hidden };
}
