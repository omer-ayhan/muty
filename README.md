# Muty

A Chrome extension that hides videos and posts when the title contains words you choose. GTA 6 is on the list already, so trailers, leaks, endings, and reaction videos stay out of the feed until you remove those phrases.

YouTube, LinkedIn, and Twitter each have their own adapter. Turn a platform off and that site stays as it is. The word list stays in this browser. Nothing is sent anywhere.

On YouTube it covers Home, Search, Subscriptions, channel pages, Shorts shelves, community posts, and the sidebar next to a video. Opening a matching video covers the picture until you choose to play it. Matching Shorts are skipped. LinkedIn and Twitter hide the matching post.

## Layout

This is an npm workspace with Turborepo.

- `packages/core` matches phrases, stores the list, and runs the hide loop.
- `packages/adapters` is the plugin package. YouTube, LinkedIn, and Twitter each implement the same adapter.
- `apps/extension` is the Chrome extension. It bundles those packages into one content script.

## Try the filter

```bash
npm install
npm run build
```

Open `apps/extension/dist/demo/index.html`. The sample feed uses the same matcher as the extension. Add a word, remove one, or turn on channel names and the “GTA 6 Daily” video disappears even though its title doesn’t say GTA.

“gta 6” also matches `GTA6`, `GTA-6`, and `GTA/6`. It does not match GTA 5, and “gta vi” does not match “GTA video”.

## Install in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`. The same steps work in Edge (`edge://extensions`) and Brave.
3. Turn on Developer mode.
4. Click **Load unpacked** and choose `apps/extension/dist`.
5. Open YouTube, LinkedIn, or Twitter and refresh the tab if it was already open.
6. Click the Muty icon to add or remove words.

The toolbar badge counts how many items are hidden on that tab. Hover the icon, or open the popup, and the same count is written out.

## In the popup

- **Filtering** is the master switch.
- **Platforms** turns filtering on or off for YouTube, LinkedIn, and Twitter.
- **Check channel names** also hides an item when the channel or author name contains a phrase.
- **Cover a matching video I open on YouTube** pauses a matching watch page behind a cover. The title of that video is not repeated on the cover.
- **Skip matching YouTube Shorts** moves to the next Short. After several in a row, it stops and asks.

Remove a phrase if you still want those videos. A short single word, like `gta` on its own, hides every title that uses it.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```
