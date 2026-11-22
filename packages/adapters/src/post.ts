import type { CardText, PageController } from '@spoiler-mute/core';
import { textsFrom } from '@spoiler-mute/core';

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
