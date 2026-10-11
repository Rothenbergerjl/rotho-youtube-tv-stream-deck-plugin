# Rotho YTTV Multiview

Watch several YouTube TV games at once in separate Chrome windows and use a Stream Deck to choose
which one you hear. Each open game appears on a Stream Deck key; pressing a key unmutes that game
and mutes the rest.

## Install

Requirements: Windows 10+, Stream Deck app 7.1+, Chrome 116+.

1. Download both files from the latest
   [release](https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases):
   `com.rotho.yttv-multiview.streamDeckPlugin` and `yttv-multiview-extension-<version>.zip`.
2. **Stream Deck plugin:** double-click `com.rotho.yttv-multiview.streamDeckPlugin` and confirm
   the install in the Stream Deck app.
3. **Chrome extension:**
   1. Unzip `yttv-multiview-extension-<version>.zip` to a folder you'll keep, for example
      `Documents\yttv-multiview-extension`. Chrome loads it from there, so don't delete it.
   2. Open `chrome://extensions` and turn on **Developer mode** (top right).
   3. Click **Load unpacked** and choose the unzipped folder. The dialog only shows folders, so
      select the folder itself rather than looking for files inside it.
   4. Check that the extension ID is `decadhapokljmmbknbfcpjckddhiicmg`.

To update, install the new `.streamDeckPlugin`, unzip the new extension over the same folder, and
click the reload icon on the extension in `chrome://extensions`.

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
  a different ID means the extension was built without its `key` and must be reinstalled from a
  release.

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
2. In Chrome, **Load unpacked** `packages/extension/dist`. After rebuilding, click the reload icon
   on the extension.

### Release

1. Set the new version in the root `package.json`, then run `pnpm version:sync` to copy it into
   every package and both manifests.
2. Add a `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md`; it becomes the release notes.
3. Merge to `main`.
4. In GitHub, open **Actions → Release → Run workflow** on `main` and enter the same version. The
   workflow checks, builds, and packages everything, tags `vX.Y.Z`, and publishes a GitHub Release
   with both files.

`pnpm package` builds the same two files locally into `dist/`.

### Extension signing key

The extension's fixed ID comes from the public `key` in `packages/extension/manifest.json`. The
matching private key is kept outside the repo at `~/.config/rotho-yttv-multiview/extension-key.pem`
and is only needed to publish to the Chrome Web Store. Never commit `*.pem` files.

## License

[MIT](LICENSE)
