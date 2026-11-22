import { applyFeed, GTA_PACK, addKeyword, addPack, cautionFor, normalizeSettings, removeKeyword, type Settings } from '@spoiler-mute/core';
import { createYouTubeAdapter } from '@spoiler-mute/adapters';

const youtube = createYouTubeAdapter();
const feed = must<HTMLElement>('#feed');
const count = must<HTMLElement>('#count');
const emptyFeed = must<HTMLElement>('#feed-empty');
const form = must<HTMLFormElement>('#add-form');
const phraseInput = must<HTMLInputElement>('#phrase');
const hint = must<HTMLElement>('#hint');
const list = must<HTMLElement>('#keywords');
const empty = must<HTMLElement>('#empty');
const restore = must<HTMLButtonElement>('#restore-gta');
const enabled = must<HTMLInputElement>('#enabled');
const matchChannel = must<HTMLInputElement>('#match-channel');
const toggle = must<HTMLButtonElement>('#toggle-show');
const defaultHint = hint.textContent ?? '';
const storageKey = 'spoiler-mute-sample';

let settings = load();
let forceShow = false;

function must<T extends Element>(selector: string): T {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node as T;
}

function load(): Settings {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return normalizeSettings(null);
    return normalizeSettings(JSON.parse(raw) as unknown);
  } catch {
    return normalizeSettings(null);
  }
}

function persist(): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    /* the sample still works for this page view */
  }
}

function videoWord(value: number): string {
  return value === 1 ? '1 video' : `${value} videos`;
}

function setHint(message: string, isError: boolean): void {
  hint.textContent = message || defaultHint;
  hint.classList.toggle('error', isError);
}

function renderList(): void {
  list.replaceChildren();
  for (const phrase of settings.keywords) {
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
      settings = removeKeyword(settings, phrase);
      forceShow = false;
      persist();
      setHint(defaultHint, false);
      render();
    });
    item.append(text, remove);
    list.append(item);
  }
  const missing = GTA_PACK.some((phrase) => !settings.keywords.includes(phrase));
  empty.hidden = settings.keywords.length > 0;
  restore.hidden = !missing;
}

function render(): void {
  const result = applyFeed(feed, youtube, settings, { forceShow });
  const total = feed.querySelectorAll('[data-sample]').length;
  enabled.checked = settings.enabled;
  matchChannel.checked = settings.matchChannel;
  if (!settings.enabled) {
    count.textContent = 'Filtering is off. The sample feed is unchanged.';
  } else if (settings.keywords.length === 0) {
    count.textContent = 'Add a word to start hiding videos.';
  } else if (forceShow && result.matches > 0) {
    count.textContent = `Showing ${videoWord(result.matches)} that match.`;
  } else if (result.hidden === 0) {
    count.textContent = `Nothing in these ${total} videos matches.`;
  } else {
    count.textContent = `${videoWord(result.hidden)} hidden. ${total - result.hidden} still in the feed.`;
  }
  toggle.hidden = result.matches === 0;
  toggle.textContent = forceShow ? 'Hide again' : 'Show hidden';
  emptyFeed.hidden = !(settings.enabled && settings.keywords.length > 0 && !forceShow && result.hidden === total);
  renderList();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const outcome = addKeyword(settings, phraseInput.value);
  if (!outcome.ok) {
    setHint(outcome.error, true);
    phraseInput.focus();
    return;
  }
  settings = outcome.settings;
  phraseInput.value = '';
  forceShow = false;
  persist();
  const caution = cautionFor(settings.keywords[0] ?? '');
  setHint(caution || defaultHint, false);
  render();
  phraseInput.focus();
});

restore.addEventListener('click', () => {
  settings = addPack(settings, GTA_PACK);
  forceShow = false;
  persist();
  setHint(defaultHint, false);
  render();
});

enabled.addEventListener('change', () => {
  settings = { ...settings, enabled: enabled.checked };
  forceShow = false;
  persist();
  render();
});

matchChannel.addEventListener('change', () => {
  settings = { ...settings, matchChannel: matchChannel.checked };
  forceShow = false;
  persist();
  render();
});

toggle.addEventListener('click', () => {
  forceShow = !forceShow;
  render();
});

render();
