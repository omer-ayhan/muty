## Learned User Preferences

- Keep work on this repo local until asked to push or open a pull request.
- Use Conventional Commits, one group per commit: `type(scope): imperative summary`.
- Do not push or commit straight to `main`. Feature branches merge into `development` by pull request. Only `development` merges into `main`, and that merge is the release.
- Hide matching content with `display: none`. Leave no grey blocked placeholder in its place.
- Keep the hidden count on the toolbar badge and in the extension popup and details page. Do not add an in-page "N videos hidden / Show" pill.
- Show a platform icon to the left of each provider name in the popup.
- Match phrases across spacing and punctuation (`GTA6`, `GTA-6`, `GTA/6`). Do not match nearby titles such as GTA 5 or "GTA video".
- Platform toggles live in the popup. Turning a platform off leaves that site unchanged. The word list stays on the device.
- Open the first-run agreement as a new tab in the current window, selected and in front. A separate window can sit behind the browser, so the user never accepts and hiding stays off.

## Learned Workspace Facts

- Muty is a Chrome Manifest V3 extension that hides matching posts on YouTube, LinkedIn, X, Kick, Twitch, and Reddit. The X platform id stays `twitter` so saved settings keep working. Twitch runs on twitch.tv, and twitch.com is included too. Reddit runs on www, old, new, np, sh, and m.
- The repo is an npm-workspaces Turborepo. `packages/core` (`@muty/core`) owns matching, settings, and the hide loop. `packages/adapters` (`@muty/adapters`) contains the YouTube, LinkedIn, X, Kick, Twitch, and Reddit adapters, each in its own folder. `apps/extension` is the extension. Load it unpacked from `apps/extension/dist` after `npm run build`.
- Default keywords are the GTA 6 pack: `gta 6`, `gta vi`, `grand theft auto 6`, and `grand theft auto vi`.
- On YouTube, empty leftover containers (shelves, official cards, and channel headers) hide for any matching phrase, not only GTA 6. In-player end-screen tiles hide too, including creator cards in the last seconds of a video.
- On X, account names are matched by default. A popup checkbox turns that check off.
- On Reddit, a post hides when its title, body, flair, or subreddit name matches, and a comment hides on its own text. A one-post `article` hides with that post. Reddit usernames are not read.
- Excluded URLs match when the page address contains the entry, and those pages are not filtered. The list is on the popup, which is also the extension details page. The toolbar popup and that page include Open details in a tab.
- Hiding stays off until the user accepts the agreement. Install, reload, or the next YouTube, LinkedIn, X, Kick, Twitch, or Reddit page opens that agreement as a new tab while it is still pending. Agreeing closes the tab and starts hiding. The page also shows Agree and start.
