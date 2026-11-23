import { defaultSettings } from '@muty/core';

function hiddenTitle(hidden: number): string {
  if (hidden <= 0) return 'Muty';
  if (hidden === 1) return 'Muty — 1 video hidden';
  return `Muty — ${hidden} videos hidden`;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    if (!data.settings) chrome.storage.local.set({ settings: defaultSettings() });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
