import { normalizePhrase } from './match.ts';
import { PLATFORM_CATALOG, isPlatformId, type PlatformId } from './platforms.ts';

export const GTA_PACK = [
  'gta 6',
  'gta vi',
  'grand theft auto 6',
  'grand theft auto vi',
] as const;

export const MAX_KEYWORDS = 200;
export const MAX_EXCLUDED_URLS = 100;
const MAX_LENGTH = 80;
const MAX_URL_LENGTH = 2000;

export interface Settings {
  version: 1;
  enabled: boolean;
  matchChannel: boolean;
  matchTwitterName: boolean;
  coverWatch: boolean;
  skipShorts: boolean;
  platforms: Record<PlatformId, boolean>;
  keywords: string[];
  excludedUrls: string[];
}

export interface KeywordOk {
  ok: true;
  settings: Settings;
}

export interface KeywordError {
  ok: false;
  error: string;
}

export type KeywordResult = KeywordOk | KeywordError;

function cleanList(values: unknown): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];
  const list = Array.isArray(values) ? values : [...GTA_PACK];
  for (const value of list) {
    const phrase = normalizePhrase(String(value || ''));
    if (!phrase || phrase.length > MAX_LENGTH || seen.has(phrase)) continue;
    seen.add(phrase);
    keywords.push(phrase);
    if (keywords.length >= MAX_KEYWORDS) break;
  }
  return keywords;
}

function defaultPlatforms(): Record<PlatformId, boolean> {
  const platforms = {} as Record<PlatformId, boolean>;
  for (const platform of PLATFORM_CATALOG) platforms[platform.id] = true;
  return platforms;
}

function readPlatforms(raw: unknown): Record<PlatformId, boolean> {
  const platforms = defaultPlatforms();
  if (!raw || typeof raw !== 'object') return platforms;
  const source = raw as Record<string, unknown>;
  for (const platform of PLATFORM_CATALOG) {
    if (source[platform.id] === false) platforms[platform.id] = false;
  }
  return platforms;
}

export function defaultSettings(): Settings {
  return {
    version: 1,
    enabled: true,
    matchChannel: false,
    matchTwitterName: true,
    coverWatch: true,
    skipShorts: true,
    platforms: defaultPlatforms(),
    keywords: [...GTA_PACK],
    excludedUrls: [],
  };
}

export function normalizeSettings(raw: unknown): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const source = raw as Record<string, unknown>;
  return {
    version: 1,
    enabled: source.enabled !== false,
    matchChannel: Boolean(source.matchChannel),
    matchTwitterName: source.matchTwitterName !== false,
    coverWatch: source.coverWatch !== false,
    skipShorts: source.skipShorts !== false,
    platforms: readPlatforms(source.platforms),
    keywords: cleanList(source.keywords),
    excludedUrls: cleanUrls(source.excludedUrls),
  };
}

function cleanUrls(values: unknown): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  if (!Array.isArray(values)) return urls;
  for (const value of values) {
    const url = String(value || '').trim();
    const key = url.toLowerCase();
    if (url.length < 3 || url.length > MAX_URL_LENGTH || seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
    if (urls.length >= MAX_EXCLUDED_URLS) break;
  }
  return urls;
}

export function addExcludedUrl(settings: Settings, value: string): KeywordResult {
  const url = value.trim();
  if (!url) return { ok: false, error: 'Paste a URL or part of one.' };
  if (url.length < 3) return { ok: false, error: 'Use at least 3 characters.' };
  if (url.length > MAX_URL_LENGTH) return { ok: false, error: 'That URL is too long.' };
  if (settings.excludedUrls.some((entry) => entry.toLowerCase() === url.toLowerCase())) {
    return { ok: false, error: 'That URL is already excluded.' };
  }
  if (settings.excludedUrls.length >= MAX_EXCLUDED_URLS) {
    return { ok: false, error: 'The exclude list is full at 100 URLs.' };
  }
  return { ok: true, settings: { ...settings, excludedUrls: [url, ...settings.excludedUrls] } };
}

export function removeExcludedUrl(settings: Settings, value: string): Settings {
  const target = value.trim().toLowerCase();
  return { ...settings, excludedUrls: settings.excludedUrls.filter((entry) => entry.toLowerCase() !== target) };
}

export function urlExcluded(settings: Settings, href: string): boolean {
  const page = href.toLowerCase();
  return settings.excludedUrls.some((entry) => page.includes(entry.toLowerCase()));
}

export function platformEnabled(settings: Settings, id: PlatformId): boolean {
  return settings.platforms[id] !== false;
}

export function setPlatform(settings: Settings, id: string, enabled: boolean): Settings {
  if (!isPlatformId(id)) return settings;
  return normalizeSettings({
    ...settings,
    platforms: { ...settings.platforms, [id]: enabled },
  });
}

export function addKeyword(settings: Settings, value: string): KeywordResult {
  const phrase = normalizePhrase(value);
  if (!phrase) return { ok: false, error: 'Type a word or phrase.' };
  if (phrase.length < 2) return { ok: false, error: 'Use at least 2 characters.' };
  if (phrase.length > MAX_LENGTH) return { ok: false, error: 'Keep it under 80 characters.' };
  if (settings.keywords.includes(phrase)) {
    return { ok: false, error: `“${phrase}” is already on the list.` };
  }
  if (settings.keywords.length >= MAX_KEYWORDS) {
    return { ok: false, error: 'The list is full at 200 phrases.' };
  }
  return { ok: true, settings: { ...settings, keywords: [phrase, ...settings.keywords] } };
}

export function removeKeyword(settings: Settings, value: string): Settings {
  const target = normalizePhrase(value);
  return { ...settings, keywords: settings.keywords.filter((entry) => entry !== target) };
}

export function addPack(settings: Settings, pack: readonly string[]): Settings {
  const missing = pack.filter((phrase) => !settings.keywords.includes(phrase));
  if (missing.length === 0) return settings;
  const room = MAX_KEYWORDS - settings.keywords.length;
  return { ...settings, keywords: [...missing.slice(0, room), ...settings.keywords] };
}

export function cautionFor(phrase: string): string {
  const parts = phrase.split(' ');
  const word = parts[0] ?? '';
  if (parts.length === 1 && word.length <= 3) {
    return `“${phrase}” is short, so any title that uses it as its own word will be hidden.`;
  }
  return '';
}
