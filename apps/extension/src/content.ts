import { adapterFor } from '@muty/adapters';
import { applyFeed, normalizeSettings, platformEnabled, PRIVACY_POLICY_URL, urlExcluded, type PageController, type Settings } from '@muty/core';

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
let consentTabAsked = false;

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

function requestConsentTab(): void {
  if (consentTabAsked || !adapter || settings.dataUseAccepted) return;
  consentTabAsked = true;
  try {
    const pending = chrome.runtime.sendMessage({ type: 'muty:open-consent' });
    void pending?.catch(() => undefined);
  } catch {
    /* the extension was reloaded */
  }
}

function showConsent(): void {
  const existing = document.getElementById('muty-consent');
  if (!adapter || settings.dataUseAccepted) {
    existing?.remove();
    return;
  }
  requestConsentTab();
  if (existing) return;
  const root = document.documentElement;
  if (!root) return;

  const dialog = document.createElement('aside');
  dialog.id = 'muty-consent';
  dialog.className = 'muty-consent muty-ui';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'muty-consent-title');

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = 'Muty';
  const title = document.createElement('h2');
  title.id = 'muty-consent-title';
  title.textContent = 'Agree to start hiding';
  const copy = document.createElement('p');
  copy.className = 'note';
  copy.textContent =
    'Muty reads titles, descriptions, categories, and chat on this site, and names when those checks are on. It hides matches. The list stays in this browser. Nothing is sent.';
  const actions = document.createElement('div');
  actions.className = 'actions';
  const policy = document.createElement('a');
  policy.href = PRIVACY_POLICY_URL;
  policy.target = '_blank';
  policy.rel = 'noreferrer';
  policy.textContent = 'Privacy policy';
  const agree = document.createElement('button');
  agree.type = 'button';
  agree.className = 'primary';
  agree.textContent = 'Agree and start';
  agree.addEventListener('click', () => {
    const next = { ...settings, dataUseAccepted: true };
    settings = next;
    chrome.storage.local.set({ settings: next });
    showConsent();
    start();
  });
  actions.append(policy, agree);
  sheet.append(kicker, title, copy, actions);
  dialog.append(sheet);
  root.append(dialog);
  agree.focus();
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
  showConsent();
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
  showConsent();
  start();
});

window.setInterval(showConsent, 1000);
