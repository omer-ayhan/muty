export { PLATFORM_CATALOG, PLATFORM_IDS, isPlatformId, platformLabel } from './platforms.ts';
export type { PlatformId, PlatformInfo } from './platforms.ts';

export { compilePhrase, findMatch, normalizePhrase } from './match.ts';
export type { CompiledPhrase } from './match.ts';

export {
  GTA_PACK,
  MAX_KEYWORDS,
  PRIVACY_POLICY_URL,
  addExcludedUrl,
  addKeyword,
  addPack,
  cautionFor,
  defaultSettings,
  normalizeSettings,
  platformEnabled,
  removeExcludedUrl,
  removeKeyword,
  setPlatform,
  urlExcluded,
} from './settings.ts';
export type { KeywordResult, Settings } from './settings.ts';

export { clean, outermostMatches, textFrom, textsFrom } from './dom.ts';

export { HIDDEN_CLASS, applyFeed, clearMarks, setHidden } from './feed.ts';
export type { CardText, FeedResult, PageController, PageScan, PlatformAdapter } from './feed.ts';
