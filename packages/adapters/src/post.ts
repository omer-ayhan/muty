import type { CardText, PageController } from '@muty/core';
import { textsFrom } from '@muty/core';

export function idlePage(): PageController {
  return {
    start() {},
    onScan() {},
    onNavigate() {},
    onNavigateStart() {},
  };
}

export function readPost(
  element: Element,
  includeActor: boolean,
  titleSelectors: readonly string[],
  bodySelectors: readonly string[],
  actorSelectors: readonly string[],
): CardText {
  const title = textsFrom(element, titleSelectors);
  const description = textsFrom(element, bodySelectors);
  const channel = includeActor ? textsFrom(element, actorSelectors) : '';
  return {
    title,
    channel,
    description,
    haystack: [title, description, channel].filter(Boolean).join('\n'),
  };
}
