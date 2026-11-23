import { adapterFor } from '@muty/adapters';
import { applyFeed, normalizeSettings, platformEnabled, urlExcluded, type PageController, type Settings } from '@muty/core';

const adapter = adapterFor(location.href);
const page: PageController | null = adapter?.createPageController?.() ?? null;

let settings: Settings = normalizeSettings(null);
let lastHidden = 0;
let lastMatches = 0;
let lastHref = location.href;
let scanning = false;
let scanTimer = 0;
let publishedHidden = -1;
let publishedMatches = -1;

function filteringOn(): boolean {
  return Boolean(
    adapter &&
      settings.dataUseAccepted &&
      settings.enabled &&
      platformEnabled(settings, adapter.id) &&
      !urlExcluded(settings, location.href),
  );
}

function publishCount(): void {
  if (publishedHidden === lastHidden && publishedMatches === lastMatches) return;
  publishedHidden = lastHidden;
  publishedMatches = lastMatches;
  try {
    const pending = chrome.runtime.sendMessage({
      type: 'muty:count',
      hidden: lastHidden,
      matches: lastMatches,
    });
    void pending?.catch(() => undefined);
  } catch {
    /* the extension was reloaded; this page catches up after a refresh */
  }
}

function scan(): void {
  if (scanning || !adapter || !settings.dataUseAccepted) return;
  scanning = true;
  try {
    const feedSettings = filteringOn() ? settings : { ...settings, enabled: false };
    const result = applyFeed(document, adapter, feedSettings, {});
    lastMatches = result.matches;
    lastHidden = result.hidden;
    page?.onScan({ document, location, settings, filtering: filteringOn(), scan });
    publishCount();
  } finally {
    scanning = false;
  }
}

function scheduleScan(): void {
  if (scanTimer) return;
  scanTimer = window.setTimeout(() => {
    scanTimer = 0;
    scan();
  }, 80);
}

function onNavigate(): void {
  if (location.href === lastHref) return;
  lastHref = location.href;
  page?.onNavigate();
  scheduleScan();
}

function removePills(): void {
  for (const node of document.querySelectorAll('.muty-pill')) node.remove();
}

removePills();
document.addEventListener('yt-navigate-finish', onNavigate);
document.addEventListener('yt-navigate-start', () => {
  page?.onNavigateStart();
});
window.addEventListener('popstate', onNavigate);
window.setInterval(onNavigate, 700);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'muty:get-count') return;
  sendResponse({ hidden: lastHidden, matches: lastMatches });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  settings = normalizeSettings(changes.settings.newValue);
  page?.onNavigate();
  start();
  scheduleScan();
});

const observer = new MutationObserver(() => {
  removePills();
  scheduleScan();
});

let watching = false;

function start(): void {
  if (!settings.dataUseAccepted || watching) return;
  const root = document.documentElement;
  if (!root) return;
  watching = true;
  page?.start(document);
  observer.observe(root, { childList: true, subtree: true });
  scan();
}

chrome.storage.local.get('settings', (data) => {
  settings = normalizeSettings(data.settings);
  start();
});
