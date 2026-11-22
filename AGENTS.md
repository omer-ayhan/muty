## Learned User Preferences

- Keep work on this repo local until asked to push or open a pull request.
- Hide matching content with `display: none`. Leave no grey blocked placeholder in its place.
- Keep the hidden count on the toolbar badge and in the extension popup and details page. Do not add an in-page "N videos hidden / Show" pill.
- Show a platform icon to the left of each provider name in the popup.
- Match phrases across spacing and punctuation (`GTA6`, `GTA-6`, `GTA/6`). Do not match nearby titles such as GTA 5 or "GTA video".
- Platform toggles live in the popup. Turning a platform off leaves that site unchanged. The word list stays on the device.

## Learned Workspace Facts

- Muty is a Chrome Manifest V3 extension that hides matching posts on YouTube, LinkedIn, and Twitter/X.
- The repo is an npm-workspaces Turborepo. `packages/core` (`@spoiler-mute/core`) owns matching, settings, and the hide loop. `packages/adapters` (`@spoiler-mute/adapters`) contains the YouTube, LinkedIn, and Twitter adapters. `apps/extension` is the extension. Load it unpacked from `apps/extension/dist` after `npm run build`.
- Default keywords are the GTA 6 pack: `gta 6`, `gta vi`, `grand theft auto 6`, and `grand theft auto vi`.
- On YouTube, empty leftover containers (shelves, official cards, and channel headers) hide for any matching phrase, not only GTA 6.
