# Muty

A Chrome extension that hides videos and posts when the title contains words you choose. GTA 6 is on the list already, so trailers, leaks, endings, and reaction videos stay out of the feed until you remove those phrases.

YouTube, LinkedIn, X, Kick, and Twitch each have their own adapter. Turn a platform off and that site stays as it is. The word list stays in this browser. Nothing is sent anywhere.

On YouTube it covers Home, Search, Subscriptions, channel pages, Shorts shelves, community posts, and the sidebar next to a video. Opening a matching video covers the picture until you choose to play it. Matching Shorts are skipped. LinkedIn and X hide the matching post. Kick and Twitch hide the matching stream, category, clip, chat line, and a live player whose title or category matches.

## Layout

This is an npm workspace with Turborepo.

- `packages/core` matches phrases, stores the list, and runs the hide loop.
- `packages/adapters` is the plugin package. YouTube, LinkedIn, X, Kick, and Twitch each implement the same adapter.
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
5. Open YouTube, LinkedIn, X, Kick, or Twitch and refresh the tab if it was already open. Twitch’s site is twitch.tv; twitch.com is covered too.
6. Click the Muty icon to add or remove words.

The toolbar badge counts how many items are hidden on that tab. Hover the icon, or open the popup, and the same count is written out.

## In the popup

- **Filtering** is the master switch.
- **Platforms** turns filtering on or off for YouTube, LinkedIn, X, Kick, and Twitch.
- **Check channel names** also hides an item when the channel or author name contains a phrase.
- **Cover a matching video I open on YouTube** pauses a matching watch page behind a cover. The title of that video is not repeated on the cover.
- **Skip matching YouTube Shorts** moves to the next Short. After several in a row, it stops and asks.

Remove a phrase if you still want those videos. A short single word, like `gta` on its own, hides every title that uses it.

## Chrome Web Store

Category: Productivity. Homepage: the address of this repository. Privacy policy: [PRIVACY.md](PRIVACY.md).

The package name and the short description are already set for search. Paste the long description into the store listing. Use the same facts. Muty is not affiliated with YouTube, LinkedIn, X, Kick, or Twitch.

Hide videos and posts when the title, description, category, or chat contains words you choose. YouTube, LinkedIn, X, Kick, and Twitch are included. The list stays in this browser. Nothing is sent anywhere.

GTA 6 is on the list already, so trailers, leaks, endings, and reaction videos stay out of the feed until you remove those phrases. “gta 6” also matches GTA6, GTA-6, and GTA/6. It does not match GTA 5.

On YouTube, Home, Search, Subscriptions, Shorts shelves, and the sidebar are filtered. A matching video you open stays covered until you play it. Matching Shorts are skipped. LinkedIn and X hide the matching post. Kick and Twitch hide the matching stream, category, clip, chat line, and a live player whose title or category matches.

The toolbar badge counts how many items are hidden on that tab. Turn a platform off and that site stays as it is.

For the Turkish listing, use the name `Muty — Eşleşen Videoları ve Gönderileri Gizle` and this summary: YouTube, LinkedIn, X, Kick ve Twitch’te başlık seçtiğiniz kelimeleri içerince videoyu veya gönderiyi gizler.

Muty, seçtiğiniz kelimeleri içeren videoları ve gönderileri gizler. YouTube, LinkedIn, X, Kick ve Twitch desteklenir. Liste bu tarayıcıda kalır. Hiçbir şey gönderilmez. GTA 6 listede hazırdır. “gta 6”; GTA6, GTA-6 ve GTA/6 ile de eşleşir. GTA 5 ile eşleşmez. YouTube’da ana sayfa, arama, abonelikler, Shorts rafları ve video kenar çubuğu süzülür. Eşleşen bir videoyu açarsanız, siz oynatana kadar görüntü kapalı kalır. LinkedIn ve X eşleşen gönderiyi gizler. Kick ve Twitch eşleşen yayını, kategoriyi, klibi, sohbet satırını ve başlığı ya da kategorisi eşleşen oynatıcıyı gizler. Araç çubuğundaki rozet, o sekmede gizlenen öğe sayısını gösterir. Bir platformu kapatırsanız o site olduğu gibi kalır. Muty; YouTube, LinkedIn, X, Kick veya Twitch ile bağlantılı değildir.

Screenshots should show a real feed with matching items gone and the badge count visible. Five of those help more than a picture of the popup.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```
