import { adapterFor, adapters } from '@muty/adapters';
import {
  GTA_PACK,
  PLATFORM_CATALOG,
  addExcludedUrl,
  addKeyword,
  addPack,
  cautionFor,
  isPlatformId,
  PRIVACY_POLICY_URL,
  normalizeSettings,
  platformEnabled,
  removeExcludedUrl,
  removeKeyword,
  setPlatform,
  type PlatformId,
  type Settings,
} from '@muty/core';

const enabledButton = must<HTMLButtonElement>('#enabled');
const status = must<HTMLElement>('#status');
const form = must<HTMLFormElement>('#add-form');
const phraseInput = must<HTMLInputElement>('#phrase');
const hint = must<HTMLElement>('#hint');
const list = must<HTMLElement>('#keywords');
const empty = must<HTMLElement>('#empty');
const restore = must<HTMLButtonElement>('#restore-gta');
const excludeForm = must<HTMLFormElement>('#exclude-form');
const excludeInput = must<HTMLInputElement>('#exclude-url');
const excludeHint = must<HTMLElement>('#exclude-hint');
const excludeList = must<HTMLElement>('#excluded-urls');
const excludeEmpty = must<HTMLElement>('#exclude-empty');
const defaultExcludeHint = excludeHint.textContent ?? '';
const matchChannel = must<HTMLInputElement>('#match-channel');
const matchTwitterName = must<HTMLInputElement>('#match-twitter-name');
const coverWatch = must<HTMLInputElement>('#cover-watch');
const skipShorts = must<HTMLInputElement>('#skip-shorts');
const platformBox = must<HTMLElement>('#platforms');
const agreement = must<HTMLElement>('#agreement');
const agreeButton = must<HTMLButtonElement>('#agree');
const openTab = must<HTMLButtonElement>('#open-tab');
const defaultHint = hint.textContent ?? '';

type PageState =
  | { kind: 'loading' }
  | { kind: 'preview' }
  | { kind: 'elsewhere' }
  | { kind: 'refresh'; id: PlatformId; label: string }
  | { kind: 'active'; id: PlatformId; label: string; hidden: number; matches: number };

interface StorageArea {
  get(key: string, callback: (data: { settings?: unknown }) => void): void;
  set(items: { settings: Settings }, callback?: () => void): void;
}

let settings: Settings | null = null;
let page: PageState = { kind: 'loading' };

function must<T extends Element>(selector: string): T {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node as T;
}

function storageArea(): StorageArea {
  const chromeStorage = globalThis.chrome?.storage?.local;
  if (chromeStorage) return chromeStorage;
  return {
    get(_key, callback) {
      const raw = localStorage.getItem('muty-settings');
      let stored: unknown;
      try {
        stored = raw ? JSON.parse(raw) : undefined;
      } catch {
        stored = undefined;
      }
      callback({ settings: stored });
    },
    set(items, callback) {
      localStorage.setItem('muty-settings', JSON.stringify(items.settings));
      callback?.();
    },
  };
}

const storage = storageArea();

function everyPlatformOff(current: Settings): boolean {
  return PLATFORM_CATALOG.every((platform) => !platformEnabled(current, platform.id));
}

function statusText(): string {
  if (!settings) return 'Loading your list…';
  if (!settings.dataUseAccepted) return 'Agree to start hiding. Until then, every page stays as it is.';
  if (!settings.enabled) return 'Filtering is off.';
  if (everyPlatformOff(settings)) return 'Every platform is turned off.';
  if (settings.keywords.length === 0) return 'Add a word to start hiding videos.';
  switch (page.kind) {
    case 'loading':
      return 'Checking this tab…';
    case 'preview':
      return 'Your list is saved in this browser.';
    case 'elsewhere':
      return 'Open YouTube, LinkedIn, X, Kick, Twitch, or Reddit. This list is ready.';
    case 'refresh':
      return `Refresh the ${page.label} tab to start filtering.`;
    case 'active': {
      if (!platformEnabled(settings, page.id)) return `${page.label} is turned off. This page is unchanged.`;
      if (page.matches === 0) return 'Nothing on this page matches.';
      if (page.hidden === 0) {
        return page.matches === 1
          ? '1 matching video is currently shown.'
          : `${page.matches} matching videos are currently shown.`;
      }
      if (page.hidden === 1) return '1 video hidden on this page.';
      return `${page.hidden} videos hidden on this page.`;
    }
    default: {
      const unknown: never = page;
      return unknown;
    }
  }
}

function setHint(message: string, isError: boolean): void {
  hint.textContent = message || defaultHint;
  hint.classList.toggle('error', isError);
}

function renderList(): void {
  if (!settings) return;
  const current = settings;
  list.replaceChildren();
  for (const phrase of current.keywords) {
    const item = document.createElement('li');
    item.className = 'keyword';
    const text = document.createElement('span');
    text.className = 'phrase';
    text.textContent = phrase;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${phrase}`);
    remove.addEventListener('click', () => {
      save(removeKeyword(current, phrase));
      setHint(defaultHint, false);
    });
    item.append(text, remove);
    list.append(item);
  }
  const missing = GTA_PACK.some((phrase) => !current.keywords.includes(phrase));
  empty.hidden = current.keywords.length > 0;
  restore.hidden = !missing;
}

function renderExcluded(): void {
  if (!settings) return;
  const current = settings;
  excludeList.replaceChildren();
  for (const url of current.excludedUrls) {
    const item = document.createElement('li');
    item.className = 'keyword';
    const text = document.createElement('span');
    text.className = 'phrase';
    text.textContent = url;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${url}`);
    remove.addEventListener('click', () => {
      save(removeExcludedUrl(current, url));
      excludeHint.textContent = defaultExcludeHint;
      excludeHint.classList.remove('error');
    });
    item.append(text, remove);
    excludeList.append(item);
  }
  excludeEmpty.hidden = current.excludedUrls.length > 0;
}

function svg(paths: readonly string[], viewBox = '0 0 24 24'): SVGSVGElement {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', viewBox);
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('platform-icon');
  for (const markup of paths) {
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.innerHTML = markup;
    while (wrapper.firstChild) icon.append(wrapper.firstChild);
  }
  return icon;
}

function platformIcon(id: PlatformId): SVGSVGElement {
  switch (id) {
    case 'youtube':
      return svg([
        '<rect x="1" y="5" width="22" height="14" rx="4" fill="#ff0033"/>',
        '<path d="M10 9.2v5.6l5.2-2.8z" fill="#fff"/>',
      ]);
    case 'linkedin':
      return svg([
        '<rect width="24" height="24" rx="4" fill="#0a66c2"/>',
        '<path fill="#fff" d="M6.6 9.4H4.2V19h2.4V9.4zM5.4 4.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM19.8 19h-2.4v-4.7c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5V19H11.6V9.4h2.3v1.3h.1c.3-.6 1.1-1.3 2.3-1.3 2.5 0 3 1.6 3 3.7V19z"/>',
      ]);
    case 'twitter':
      return svg([
        '<path fill="#111" d="M14.7 3h2.6l-5.7 6.5L18.8 21h-4.8l-3.8-5-4.3 5H3.3l6.1-7L3 3h4.9l3.4 4.6L14.7 3zm-1 16.2h1.5L7.4 4.7H5.8l7.9 14.5z"/>',
      ]);
    case 'kick':
      return svg([
        '<rect width="24" height="24" rx="5" fill="#53fc18"/>',
        '<path fill="#111" d="M7.2 5.2h2.6v5.1l4.2-5.1h3.1l-5.2 6.1 5.6 7.5h-3.2l-4.2-5.8v5.8H7.2V5.2z"/>',
      ]);
    case 'twitch':
      return svg([
        '<path fill="#9146ff" d="M6 2 2.4 5.6v12.8h4.3V22l3.6-3.6h2.8L20.6 12V2H6zm12.1 9.3-2.9 2.9h-2.8l-2.5 2.5v-2.5H6.4V3.4h11.7v7.9z"/>',
        '<path fill="#fff" d="M14.2 6.2h-1.4v4.3h1.4V6.2zm-3.8 0H9v4.3h1.4V6.2z"/>',
      ]);
    case 'reddit':
      return svg([
        '<path fill="#ff4500" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>',
      ]);
    default: {
      const unknown: never = id;
      return unknown;
    }
  }
}

function buildPlatforms(): void {
  platformBox.replaceChildren();
  for (const platform of adapters) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.platform = platform.id;
    input.addEventListener('change', () => {
      if (!settings) return;
      save(setPlatform(settings, platform.id, input.checked));
    });
    const name = document.createElement('span');
    name.textContent = platform.label;
    label.append(input, platformIcon(platform.id), name);
    platformBox.append(label);
  }
}

function render(): void {
  if (!settings) return;
  agreement.hidden = settings.dataUseAccepted;
  enabledButton.setAttribute('aria-checked', settings.enabled ? 'true' : 'false');
  enabledButton.setAttribute('aria-label', settings.enabled ? 'Filtering on' : 'Filtering off');
  matchChannel.checked = settings.matchChannel;
  matchTwitterName.checked = settings.matchTwitterName;
  coverWatch.checked = settings.coverWatch;
  skipShorts.checked = settings.skipShorts;
  for (const input of platformBox.querySelectorAll('input')) {
    const id = input.dataset.platform ?? '';
    if (!isPlatformId(id)) continue;
    input.checked = platformEnabled(settings, id);
  }
  status.textContent = statusText();
  status.classList.toggle('has-count', page.kind === 'active' && page.hidden > 0);
  renderList();
  renderExcluded();
}

function save(next: Settings): void {
  settings = next;
  render();
  storage.set({ settings: next }, () => {
    void chrome.runtime?.lastError;
  });
}

function readPage(): void {
  const tabs = globalThis.chrome?.tabs;
  if (!tabs?.query) {
    page = { kind: 'preview' };
    render();
    return;
  }
  tabs.query({ active: true, currentWindow: true }, (tabsInfo) => {
    const tab = tabsInfo[0];
    const url = tab?.url ?? '';
    const site = adapterFor(url);
    if (!site || typeof tab?.id !== 'number') {
      page = { kind: 'elsewhere' };
      render();
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: 'muty:get-count' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        page = { kind: 'refresh', id: site.id, label: site.label };
      } else {
        const payload = response as { hidden?: number; matches?: number };
        page = {
          kind: 'active',
          id: site.id,
          label: site.label,
          hidden: payload.hidden || 0,
          matches: payload.matches || 0,
        };
      }
      render();
    });
  });
}

const consentTab = new URLSearchParams(location.search).get('consent') === '1';

function closeConsentTab(): void {
  const tabs = globalThis.chrome?.tabs;
  if (!tabs?.getCurrent || !tabs.remove) {
    window.close();
    return;
  }
  tabs.getCurrent((tab) => {
    if (typeof tab?.id === 'number') {
      tabs.remove(tab.id);
      return;
    }
    window.close();
  });
}

if (consentTab) {
  document.documentElement.classList.add('is-consent');
  document.title = 'Agree to start Muty';
  agreeButton.textContent = 'Agree and start';
}

agreeButton.addEventListener('click', () => {
  if (!settings) return;
  const next = { ...settings, dataUseAccepted: true };
  settings = next;
  render();
  storage.set({ settings: next }, () => {
    void chrome.runtime?.lastError;
    if (consentTab) closeConsentTab();
  });
});

enabledButton.addEventListener('click', () => {
  if (!settings) return;
  save({ ...settings, enabled: !settings.enabled });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!settings) return;
  const outcome = addKeyword(settings, phraseInput.value);
  if (!outcome.ok) {
    setHint(outcome.error, true);
    phraseInput.focus();
    return;
  }
  phraseInput.value = '';
  const caution = cautionFor(outcome.settings.keywords[0] ?? '');
  save(outcome.settings);
  setHint(caution || defaultHint, false);
  phraseInput.focus();
});

excludeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!settings) return;
  const outcome = addExcludedUrl(settings, excludeInput.value);
  if (!outcome.ok) {
    excludeHint.textContent = outcome.error;
    excludeHint.classList.add('error');
    excludeInput.focus();
    return;
  }
  excludeInput.value = '';
  excludeHint.textContent = defaultExcludeHint;
  excludeHint.classList.remove('error');
  save(outcome.settings);
  excludeInput.focus();
});

restore.addEventListener('click', () => {
  if (!settings) return;
  save(addPack(settings, GTA_PACK));
  setHint(defaultHint, false);
});

const toggles = [
  [matchChannel, 'matchChannel'],
  [matchTwitterName, 'matchTwitterName'],
  [coverWatch, 'coverWatch'],
  [skipShorts, 'skipShorts'],
] as const;

for (const [input, key] of toggles) {
  input.addEventListener('change', () => {
    if (!settings) return;
    save({ ...settings, [key]: input.checked });
  });
}

if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settings = normalizeSettings(changes.settings.newValue);
    render();
    if (consentTab && settings.dataUseAccepted) closeConsentTab();
  });
}

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'muty:count') return;
    if (page.kind !== 'active' && page.kind !== 'refresh') return;
    const payload = message as { hidden?: number; matches?: number };
    page = {
      kind: 'active',
      id: page.id,
      label: page.label,
      hidden: payload.hidden || 0,
      matches: payload.matches || 0,
    };
    render();
  });
}

const popupViews = chrome.extension?.getViews?.({ type: 'popup' }) ?? [];
const toolbarPopup = popupViews.includes(window);
if (toolbarPopup) document.documentElement.classList.add('is-popup');

function alreadyDetailsTab(): boolean {
  if (consentTab || toolbarPopup) return false;
  try {
    return window.top === window;
  } catch {
    return false;
  }
}

openTab.hidden = alreadyDetailsTab();
openTab.addEventListener('click', () => {
  const runtime = globalThis.chrome?.runtime;
  if (runtime?.sendMessage) {
    void runtime.sendMessage({ type: 'muty:open-details' });
    return;
  }
  window.open('popup.html', '_blank');
});

for (const link of document.querySelectorAll<HTMLAnchorElement>('a.privacy-policy')) {
  link.href = PRIVACY_POLICY_URL;
  link.target = '_blank';
  link.rel = 'noreferrer';
}

buildPlatforms();

storage.get('settings', (data) => {
  settings = normalizeSettings(data.settings);
  render();
  readPage();
  if (consentTab && settings.dataUseAccepted) closeConsentTab();
});
