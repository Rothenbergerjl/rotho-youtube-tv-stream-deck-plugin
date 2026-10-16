# Rotho YTTV Multiview

Watch several YouTube TV games at once in separate Chrome windows and use a Stream Deck to choose
which one you hear. Each open game appears on a Stream Deck key; pressing a key unmutes that game
and mutes the rest.

## Install

You need Windows 10 or later, the Stream Deck app 7.1 or later, and Chrome 116 or later. There are
two pieces: a Chrome extension and a Stream Deck plugin.

1. **Chrome extension:** open the
   [Rotho YTTV Multiview page in the Chrome Web Store](https://chromewebstore.google.com/detail/decadhapokljmmbknbfcpjckddhiicmg)
   and click **Add to Chrome**. The listing is unlisted, so it won't show up in store searches;
   use this link.
2. **Stream Deck plugin:** open the
   [latest release](https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest),
   download `com.rotho.yttv-multiview.streamDeckPlugin`, double-click it, and confirm the install
   in the Stream Deck app.
3. Add keys to your Stream Deck (see [Usage](#usage)).

### Upgrading

- **Chrome extension:** updates itself. Chrome checks for updates every few hours; to update right
  away, open `chrome://extensions`, turn on **Developer mode** and click **Update**.
- **Stream Deck plugin:** when a new version is out, every key shows a small blue arrow in its
  bottom-right corner. Select a Game Slot key in the Stream Deck app and click **Plugin vX.Y.Z is
  available** in its settings to open the release, then download and double-click the new
  `com.rotho.yttv-multiview.streamDeckPlugin`. It installs over the old version and keeps your
  keys.

### Moving from a "Load unpacked" install

If you installed the extension from a zip with **Load unpacked** before it was in the Web Store:

1. Open `chrome://extensions` and click **Remove** on Rotho YTTV Multiview. Chrome can't have the
   unpacked copy and the store copy installed at the same time.
2. Install it from the Web Store link above.
3. Delete the folder you unzipped it into, and turn off **Developer mode** if you don't need it.

Your Stream Deck keys keep working; reload any open YouTube TV tabs if a game doesn't appear.

## Usage

1. In the Stream Deck app, open the **Rotho YTTV Multiview** category and drag **Game Slot** keys
   onto your deck, one per game you want to watch. New keys number themselves 1, 2, 3…; to change
   a key's slot, select it and pick a slot in its settings.
2. Optionally add a **Mute All** key.
3. Open each YouTube TV game in its own Chrome window or tab.

| Key       | Shows                                                                 | Press                                        |
| --------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Game Slot | Slot number, matchup (e.g. "SF @ SEA"); green with a speaker if heard | Hear only this game                          |
| Game Slot | Just a dim number                                                     | Empty slot; nothing happens                  |
| Game Slot | "No Chrome"                                                           | The extension isn't connected                |
| Mute All  | "Mute all" / "Restore" / "All muted"                                  | Mute everything, or bring back the last game |
| Any key   | Amber warning, "Update plugin" / "Update extension"                   | Nothing until you update that piece          |
| Any key   | Small blue arrow in the bottom-right corner                           | Works as usual; a plugin update is available |

How games get slots and sound:

- Slots are given in the order games open. A game keeps its slot until its tab closes; the next
  new game takes the lowest free slot.
- New YouTube TV tabs start muted, so opening a game never interrupts the one you're hearing.
- Closing the game you're hearing leaves everything muted.
- A tab that navigates away from YouTube TV gets its sound back and frees its slot.
- Up to 15 games are tracked.

## Troubleshooting

**Keys say "No Chrome".** The extension isn't connected to the plugin.

- Check the extension is installed and enabled in `chrome://extensions`.
- It reconnects within about 30 seconds of Chrome or the Stream Deck app starting. Reloading the
  extension forces an immediate reconnect.
- Check the extension ID is `decadhapokljmmbknbfcpjckddhiicmg`. The plugin only accepts that ID;
  a different ID means the extension wasn't installed from the Web Store link above. Remove it and
  reinstall from that link.

**Keys say "Update plugin" or "Update extension".** The plugin and extension are different
versions that can't talk to each other. Keys ignore presses until they match.

- "Update plugin": install the newest `.streamDeckPlugin` from the
  [latest release](https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest).
- "Update extension": Chrome usually updates it within a few hours. To update now, open
  `chrome://extensions`, turn on **Developer mode** and click **Update**.

**Keys have a small blue arrow.** A newer plugin is available; see [Upgrading](#upgrading). The
keys work normally in the meantime.

**A game doesn't show up, or shows "YouTube TV" instead of the matchup.** The title comes from the
YouTube TV player; it appears a few seconds after the game starts playing. If the tab was open
before the extension was installed, reload the tab.

**Another program is using port 47731.** The plugin talks to Chrome on `127.0.0.1:47731`. If that
port is busy, the plugin keeps retrying every 5 seconds and logs `Server error: EADDRINUSE`. Find
the other program with `netstat -ano | findstr 47731` and close it.

**Where are the logs?** Plugin logs are in
`%APPDATA%\Elgato\StreamDeck\Plugins\com.rotho.yttv-multiview.sdPlugin\logs\`. Each state change
is logged like `State: 1:SF @ SEA*, 2:DET @ ARI` (`*` = the game you're hearing), along with each
command sent. For the extension, open `chrome://extensions` and click **service worker** under
Rotho YTTV Multiview.

**The plugin doesn't appear after linking a dev build.** Quit the Stream Deck app from the system
tray and reopen it; newly linked plugins load only when the app starts.

## How it works

```
 Chrome (tv.youtube.com tabs)                       Stream Deck app
 ┌──────────────────────────────┐   WebSocket       ┌──────────────────────────────┐
 │ @rotho/extension (MV3)       │ ◄──────────────►  │ @rotho/plugin (Node SDK)     │
 │ - tracks YouTube TV tabs     │  127.0.0.1:47731  │ - WebSocket server           │
 │ - assigns slots, mutes tabs  │                   │ - Game Slot / Mute All keys  │
 │ - source of truth for state  │                   │ - draws titles + audio state │
 └──────────────────────────────┘                   └──────────────────────────────┘
                     both use @rotho/shared (protocol types + constants)
```

- The extension connects to the plugin; the plugin only accepts the extension's fixed origin.
- A content script reads the matchup from the player, because YouTube TV's page title is always
  "Home - YouTube TV".
- Nothing leaves your computer except the plugin's update check against GitHub; see the
  [privacy policy](PRIVACY.md). To report a security problem, see [SECURITY.md](SECURITY.md).

## Development

### Repository layout

| Path                 | Package            | What                                               |
| -------------------- | ------------------ | -------------------------------------------------- |
| `packages/shared`    | `@rotho/shared`    | Message types, constants, matchup title formatting |
| `packages/extension` | `@rotho/extension` | Chrome Manifest V3 extension, bundled with esbuild |
| `packages/plugin`    | `@rotho/plugin`    | Stream Deck plugin, bundled with Rollup            |
| `scripts/`           |                    | Version sync, packaging, release-notes helpers     |

### Setup

Requirements: Node.js 24+, pnpm, and the Stream Deck app and Chrome for manual testing.

```bash
npm i -g pnpm
pnpm install
pnpm build
```

Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`,
`pnpm --filter @rotho/plugin validate`, `pnpm --filter @rotho/plugin watch` (rebuild and restart
the plugin on change), `pnpm --filter @rotho/plugin fake-extension` (stand in for Chrome against a
running plugin).

### Run a dev build

1. Link the plugin into Stream Deck: `pnpm --filter @rotho/plugin sd:link`, then quit and reopen
   the Stream Deck app (first time only). After rebuilding, restart the plugin with
   `pnpm --filter @rotho/plugin exec streamdeck restart com.rotho.yttv-multiview`.
2. In Chrome, **Load unpacked** `packages/extension/dist` (needs **Developer mode** in
   `chrome://extensions`). Remove the Web Store copy first; both have the same ID. After
   rebuilding, click the reload icon on the extension.

### Release

1. Set the new version in the root `package.json`, then run `pnpm version:sync` to copy it into
   every package and both manifests.
2. Add a `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md`; it becomes the release notes.
3. Merge to `main`.
4. In GitHub, open **Actions → Release → Run workflow** on `main` and enter the same version. The
   workflow checks, builds, and packages everything, tags `vX.Y.Z`, and publishes a GitHub Release
   with both files. Installed plugins see the new release within 12 hours and show the update
   badge.
5. Publish the extension: download `yttv-multiview-extension-<version>.zip` from the release, open
   the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole),
   select Rotho YTTV Multiview, upload the zip under **Package**, and click **Submit for review**.
   Keep visibility **Unlisted**. Chrome updates installed copies a few hours after approval. The
   listing text and permission justifications live in
   [docs/chrome-web-store.md](docs/chrome-web-store.md); update them there when permissions or
   behaviour change.

`pnpm package` builds the same two files locally into `dist/`. The zip's manifest leaves out the
`key` field, which the Web Store rejects; the source manifest keeps it for unpacked dev builds.

**When `PROTOCOL_VERSION` changes,** users need both new pieces before their keys work again. Run
the release workflow first and submit the extension right after, so the plugin is available by the
time the store pushes the extension (which updates itself, while the plugin needs a manual
install). Mention it at the top of the changelog section.

### Extension signing key

The extension's fixed ID comes from the public `key` in `packages/extension/manifest.json`. The
matching private key is kept outside the repo at `~/.config/rotho-yttv-multiview/extension-key.pem`.
It was used once, for the first Web Store upload, so the store kept the same ID; later uploads
don't need it. Keep it backed up anyway, and never commit `*.pem` files.

## License

[MIT](LICENSE)
