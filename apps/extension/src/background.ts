import { defaultSettings, normalizeSettings } from '@muty/core';

function hiddenTitle(hidden: number): string {
  if (hidden <= 0) return 'Muty';
  if (hidden === 1) return 'Muty — 1 video hidden';
  return `Muty — ${hidden} videos hidden`;
}

let consentTabId: number | null = null;
let consentTabOpening = false;

function createConsentTab(): void {
  if (consentTabOpening) return;
  consentTabOpening = true;
  chrome.tabs.create(
    {
      url: chrome.runtime.getURL('popup.html?consent=1'),
      active: true,
    },
    (created) => {
      consentTabOpening = false;
      consentTabId = created?.id ?? null;
    },
  );
}

function openConsentTab(): void {
  if (consentTabId === null) {
    createConsentTab();
    return;
  }
  chrome.tabs.update(consentTabId, { active: true }, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      consentTabId = null;
      createConsentTab();
      return;
    }
    chrome.windows.update(tab.windowId, { focused: true });
  });
}

chrome.tabs.onRemoved.addListener((id) => {
  if (id === consentTabId) consentTabId = null;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings ? normalizeSettings(data.settings) : defaultSettings();
    if (!data.settings) chrome.storage.local.set({ settings });
    if (!settings.dataUseAccepted) openConsentTab();
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'muty:open-consent') {
    chrome.storage.local.get('settings', (data) => {
      const settings = normalizeSettings(data.settings);
      if (!settings.dataUseAccepted) openConsentTab();
    });
    return;
  }
  if (!message || message.type !== 'muty:count') return;
  const tabId = sender.tab?.id;
  if (typeof tabId !== 'number') {
    sendResponse({ ok: false });
    return;
  }
  const hidden = Number(message.hidden) || 0;
  const text = hidden > 0 ? String(Math.min(hidden, 999)) : '';
  void chrome.action.setBadgeText({ tabId, text });
  void chrome.action.setBadgeBackgroundColor({ tabId, color: '#1c1915' });
  if (chrome.action.setBadgeTextColor) {
    void chrome.action.setBadgeTextColor({ tabId, color: '#f3ecdf' });
  }
  void chrome.action.setTitle({ tabId, title: hiddenTitle(hidden) });
  sendResponse({ ok: true });
});
