# Rotho YTTV Multiview

Watch several games at once in separate Chrome windows and use a Stream Deck to choose which one
you hear. Works with YouTube TV, Peacock and Paramount+, mixed however you like. Each open game
appears on a Stream Deck key; pressing a key unmutes that game and mutes the rest.

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
2. Optionally add **Mute All**, **Open Service** and **Focus Heard Game** keys. Select an Open
   Service key to pick its **Service** (YouTube TV, Peacock or Paramount+) and whether it opens a
   **New window** or **New tab**. Add one Open Service key per service you use.
3. Game Slot and Focus Heard Game keys show a known matchup in the two teams' colors, away team on
   top. To get plain text instead, select the key and uncheck **Team colors** in its settings.
4. Open each game in its own Chrome window or tab, or press an Open Service key.

### Services

YouTube TV is always on. Peacock is on by default. Paramount+ is off until you turn it on, because
the extension needs access to paramountplus.com to read the program on live channels.

To turn services on or off, open the extension's options: open `chrome://extensions`, click
**Details** on Rotho YTTV Multiview, then **Extension options**. An Open Service key for a service
that is off shows "Turn on"; pressing it opens the same page. Turning Paramount+ on asks Chrome for access to
paramountplus.com; if you decline, it stays off.

Which pages count as games:

| Service    | Pages                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| YouTube TV | Any `tv.youtube.com` page                                                            |
| Peacock    | The player (`peacocktv.com/watch/playback/…`), live events and clips                 |
| Paramount+ | Live channels (`/live-tv/stream/…`) and videos (`/shows/video/…`, `/movies/video/…`) |

Game Slot and Focus Heard Game keys show the service in a small badge in the bottom-left corner:
red "TV" for YouTube TV, black "P" for Peacock, blue "P+" for Paramount+.

### Keys

| Key              | Shows                                                                     | Press                                                         |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Game Slot        | Slot number, matchup in team colors, service badge; green border if heard | Hear only this game; hold to also bring it to the front       |
| Game Slot        | Slot number, title as text (show, or unknown teams), service badge        | Hear only this game; hold to also bring it to the front       |
| Game Slot        | Live score rows and game status band (see below); flashes on a score      | Hear only this game; hold to also bring it to the front       |
| Game Slot        | Just a dim number                                                         | Empty slot; nothing happens                                   |
| Mute All         | "Mute all" / "Restore" / "All muted"                                      | Mute everything, or bring back the last game                  |
| Open Service     | The service's name on a play button                                       | Open the service in a new window or tab (set in its settings) |
| Open Service     | Dim service badge, "Turn on"                                              | The service is off; opens the extension's options             |
| Open Service     | Dim "Full"                                                                | All 15 slots are taken; nothing happens                       |
| Focus Heard Game | The matchup you're hearing (team colors), with a green crosshair          | Bring that game's window and tab to the front                 |
| Focus Heard Game | Dim "Nothing heard"                                                       | Nothing is heard; nothing happens                             |
| Any key          | "No Chrome"                                                               | The extension isn't connected                                 |
| Any key          | Amber warning, "Update plugin" / "Update extension"                       | Nothing until you update that piece                           |
| Any key          | Small blue arrow in the bottom-right corner                               | Works as usual; a plugin update is available                  |

If only Open Service and Focus Heard Game keys say "Update extension", your Chrome extension is
older than the plugin. The other keys keep working until Chrome updates it.

Holding a Game Slot key for half a second hears that game and brings its window and tab to the
front, restoring the window if it's minimized, so you don't need a Focus Heard Game key. To turn
this off for a key, set **Long press** to **Off** in its settings; holding it then just hears the
game. An extension older than 0.3.0 can't focus, so the key shows an alert.

How games get slots and sound:

- Slots are given in the order games open, whatever the service. A game keeps its slot until its
  tab closes; the next new game takes the lowest free slot.
- New game tabs start muted, so opening a game never interrupts the one you're hearing.
- Closing the game you're hearing leaves everything muted.
- A tab that navigates away from a game page gets its sound back and frees its slot. A tab that
  moves from one service's player to another's keeps its slot.
- Turning a service off frees its games' slots and gives those tabs their sound back.
- Up to 15 games are tracked.

Live scores on Game Slot keys:

- A game between two teams the plugin knows (the same ones that get team colors) shows the score
  from ESPN. Each team gets a row with its abbreviation and score, and a band across the middle
  shows the slot, the service and the game status: the clock and period, the inning, the soccer
  minute, the kickoff time before the game, or FINAL. A dot marks the team with the ball, or the
  team at bat. When the key's game is the one you're hearing, the band turns green.
- When a team scores, its row and the points in the band ("+3 BUF") flash yellow for about 10
  seconds (white for a team whose color is yellow or gold), then the points stay in that team's
  color for 10 seconds.
- The stream runs behind the live game, so each key holds new scores back by its **Score delay**
  (default 30 seconds) to avoid spoilers. Raise it if the key still changes before you see the
  play.
- Each Game Slot key's settings have **Show score**, **Score alerts** and **Score delay**. Turn
  Show score off for the normal key. Games ESPN doesn't list, shows, and teams the plugin doesn't
  know keep the normal key.

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

**A game doesn't show up, or shows the service's name instead of the matchup.**

- Check the service is turned on in the extension's options (see [Services](#services)), and that
  the tab is on a game page rather than a home or browse page.
- YouTube TV and Paramount+ live titles come from the player and appear a few seconds after the
  game starts playing. If the tab was open before the extension was installed, reload the tab.
- Peacock and Paramount+ videos use the tab's title, which appears once the page has loaded.

**A Peacock or Paramount+ game stays silent when you press its key.** The key unmutes the Chrome
tab, but the player has its own mute too, and Peacock and Paramount+ remember it. If the tab shows
no speaker icon after the press, click the speaker button inside the player once to unmute it.
After that, leave the player's sound on and switch games with the Stream Deck.

**A game shows no score.** Scores need both teams to be ones the plugin knows (the key shows team
colors), and the game to be on ESPN's scoreboard today. Check that **Show score** is on in the
key's settings. If ESPN can't be reached for 2 minutes, keys go back to the normal look until it
answers again; the log shows `Scores: … failed` lines. If a key spoils plays, raise its **Score
delay**.

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
 Chrome (YouTube TV, Peacock, Paramount+ tabs)      Stream Deck app
 ┌──────────────────────────────┐   WebSocket       ┌──────────────────────────────┐
 │ @rotho/extension (MV3)       │ ◄──────────────►  │ @rotho/plugin (Node SDK)     │
 │ - tracks player tabs         │  127.0.0.1:47731  │ - WebSocket server           │
 │ - assigns slots, mutes tabs  │                   │ - Game Slot / Mute All /     │
 │ - opens + focuses windows    │                   │   Open / Focus keys          │
 │ - source of truth for state  │                   │ - draws titles + audio state │
 └──────────────────────────────┘                   └──────────────────────────────┘
                     both use @rotho/shared (protocol types + constants)
```

- The extension connects to the plugin; the plugin only accepts the extension's fixed origin.
- The extension's `hello` lists the optional features it supports (such as opening and focusing
  windows). A key that needs a missing feature shows "Update extension", and the other keys keep
  working. `PROTOCOL_VERSION` changes only for breaking changes.
- The services, their player URLs and their badges are listed once in
  `packages/shared/src/services.ts`, which both sides use.
- Titles come from where the program is named. On YouTube TV a content script reads the matchup
  from the player, because the page title is always "Home - YouTube TV". On Paramount+ live
  channels the tab title is only the channel, so a content script (registered only while
  Paramount+ is on) reads the program and channel. Peacock and Paramount+ videos use the tab
  title, minus the service's name.
- The options page saves the services that are on in `chrome.storage.local`. Paramount+ access is
  an optional host permission, so adding it doesn't make Chrome disable the extension on update.
- The state sent to the plugin lists each game's service and which services are on. Older plugins
  and extensions ignore what they don't know.
- Scores come from ESPN's public scoreboard JSON, fetched by the plugin, so the extension needs no
  new permission. `packages/plugin/src/scores/` maps each league to its ESPN feeds, matches a
  slot's game by team names, polls every 7 s while it's live, and keeps a short history so each
  key can show the score as it was its Score delay ago.
- Nothing leaves your computer except the plugin's update check against GitHub and its score
  requests to ESPN; see the [privacy policy](PRIVACY.md). To report a security problem, see
  [SECURITY.md](SECURITY.md).

## Development

### Repository layout

| Path                 | Package            | What                                               |
| -------------------- | ------------------ | -------------------------------------------------- |
| `packages/shared`    | `@rotho/shared`    | Message types, constants, team tables and colors   |
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
