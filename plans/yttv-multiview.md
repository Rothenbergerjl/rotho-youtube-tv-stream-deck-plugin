# Rotho YTTV Multiview — Stream Deck audio switcher for YouTube TV

Issue: #1

Build a Stream Deck plugin (`com.rotho.yttv-multiview`) plus a companion Chrome
extension so that open YouTube TV tabs appear on Stream Deck keys and pressing a key
solos that tab's audio (unmute it, mute every other YouTube TV tab). Target hardware is
a Stream Deck MK.2 (15 keys, model `20GBA9901`). Phase 1 sets up the repo; later phases
build, integrate, and release.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #<n>` for
every issue it resolves.

### Agreed scope and decisions (from planning interview, 2026-10-11)
- **Architecture:** TypeScript **pnpm-workspaces** monorepo with three packages:
  - `packages/shared` (`@rotho/shared`) — message protocol types, constants (port, plugin
    UUID, extension ID), pure helpers.
  - `packages/extension` (`@rotho/extension`) — Chrome Manifest V3 extension (service worker).
    **Source of truth** for tabs, slots, mute state, and "last heard" tab.
  - `packages/plugin` (`@rotho/plugin`) — Stream Deck plugin built on `@elgato/streamdeck`
    (Node SDK) and validated/linked/packed with `@elgato/cli` (installed as a devDependency of
    this package, invoked as `pnpm --filter @rotho/plugin exec streamdeck ...`). It is a view
    + command sender only.
- **Package manager:** pnpm (chosen over npm 2026-10-11 for strict dependency isolation,
  `workspace:*` links, catalogs, and install-script blocking). Pinned via the root
  `packageManager` field; installed with `npm i -g pnpm` (do **not** rely on Corepack — it is
  no longer bundled from Node 25). Shared tool versions live in the `catalog:` section of
  `pnpm-workspace.yaml`; cross-package deps use `workspace:*`. Elgato docs show `npm` commands
  — translate them to pnpm.
- **Plugin must be fully bundled:** Rollup bundles all plugin code and deps (including `ws`
  and `@rotho/shared`) into `bin/plugin.js`, so the `.sdPlugin` folder never depends on
  pnpm's symlinked `node_modules`. `ws`'s optional native add-ons (`bufferutil`,
  `utf-8-validate`) are marked external/optional so the bundle loads without them.
- **Runtime:** Node.js 24+ and Stream Deck 7.1+ (required by the current Stream Deck SDK);
  plugin manifest `Nodejs.Version` is `"24"`. The `@elgato/cli` GitHub repo moved into the
  Stream Deck SDK repo in Aug 2026; the npm package is unchanged.
- **Transport:** plugin runs a WebSocket server bound to `127.0.0.1` on a fixed port
  (constant in `shared`, e.g. `47731`). Extension service worker connects as client,
  auto-reconnects with backoff, and sends a heartbeat every ~20s (keeps the MV3 service
  worker alive; Chrome 116+). Server rejects connections whose `Origin` is not
  `chrome-extension://<our fixed extension id>`. The extension gets a stable ID via a
  `key` field in `manifest.json` (keypair generated in Phase 1; private key **not** committed).
- **Tab scope:** only tabs whose URL host is `tv.youtube.com`. One Chrome profile only.
- **Slots:** stable by open order. First game = slot 1 and keeps it; closing a game frees
  its slot; a new game takes the lowest free slot. Slot map persisted in
  `chrome.storage.session` so it survives service-worker restarts.
- **Actions:**
  - **Game Slot** (`com.rotho.yttv-multiview.slot`): property inspector lets the user pick
    slot number 1–15. Key shows slot number badge, matchup title, and a speaker highlight
    when that tab is the one being heard. Press = solo that tab's audio. Does **not** focus
    the window. Empty slot = dim key with just the slot number.
  - **Mute All** (`com.rotho.yttv-multiview.muteall`): toggle with restore. Press = mute all
    YouTube TV tabs (remember the heard tab); press again = unmute the remembered tab.
- **Auto rules:** new YouTube TV tabs start muted. If the heard tab closes, everything stays muted.
- **Offline:** when no extension is connected, Game Slot keys render dimmed "No Chrome";
  pressing shows the SDK alert (`showAlert`).
- **Titles:** matchup text (e.g. "KC @ BUF") extracted from the YouTube TV page. Source to be
  determined in Phase 3 by inspecting a live tab via Claude in Chrome (user approved,
  read-only). Fallback: tab title with the " - YouTube TV" suffix stripped.
- **Releases:** manual `workflow_dispatch` GitHub Action builds `.streamDeckPlugin` +
  extension `.zip` and attaches them to a GitHub Release.
- **Out of scope:** dials/Stream Deck+, window focus, fullscreen, live scores, non-YouTube-TV
  sites, multiple Chrome profiles, Elgato Marketplace / Chrome Web Store publishing.

## GitHub sync
Run these yourself with `gh`; do not wait to be asked, except where marked. The
issue is #1 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhACpuU` (project "Rotho YTTV
Multiview", number 3, id `PVT_kwHOBLWqFc4BmmYP`; Status field `PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`;
options Ready `a33a6237`, In Progress `96b69291`, Done `8a821b82`).
Board ids and tested `gh` recipes live in `.github/gh-recipes.md` if the repo has
one; read it and use its ids and commands. If it's missing, or a command fails
with an id error, look the ids up with `gh project list`, `gh project field-list`
and `gh project item-list` (all with `--format json`).

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id <item-id> --project-id <project-id> --field-id <status-field-id> --single-select-option-id <in-progress-option-id>`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view <n> --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit <n> --body-file <file>`). Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment <n> --body "Deviation: <what>, because <why>"`.
- **Last phase done:** confirm the PR body has one `Fixes #N` line per issue it
  resolves. Merging closes them and the board moves them to Done. Delete this plan
  `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

> Work branch: the user creates it from `main` (suggested name `1-yttv-multiview`) before
> Phase 1 starts.

## Phase 1: Repository setup
Status: Complete

- [x] Install pnpm (`npm i -g pnpm`) and record the version in root `package.json` `"packageManager": "pnpm@<exact version>"`
- [x] Root `package.json` (private, `engines.node >=24`, `packageManager` pin) with scripts that fan out via `pnpm -r`: `build`, `typecheck`, `lint`, `format`, `format:check`, `test`
- [x] `pnpm-workspace.yaml`: `packages: ["packages/*"]`; `catalog:` with shared versions (typescript, vitest, eslint, typescript-eslint, prettier, ws, @types/node, @types/chrome, @elgato/streamdeck, @elgato/cli, rollup + plugins, esbuild); `onlyBuiltDependencies:` allow-list kept empty unless a dependency demonstrably needs its install script (e.g. `esbuild`)
- [x] `.npmrc` with `engine-strict=true`
- [x] `tsconfig.base.json` (strict, `ES2022`, `moduleResolution: bundler`) and per-package `tsconfig.json` files extending it
- [x] Scaffold `packages/shared` (`@rotho/shared`; `src/index.ts` exporting `PLUGIN_UUID = "com.rotho.yttv-multiview"`, `WS_PORT`, placeholder protocol types)
- [x] Scaffold `packages/plugin` (`@rotho/plugin`, depends on `"@rotho/shared": "workspace:*"`, other deps `catalog:`): use the Elgato template layout (run `streamdeck create` in a scratch folder and copy the relevant files, translating npm scripts to pnpm) — `com.rotho.yttv-multiview.sdPlugin/manifest.json` (Name "Rotho YTTV Multiview", `Nodejs.Version` "24", `Software.MinimumVersion` "7.1", OS windows, both action UUIDs declared with placeholder icons), `rollup.config.mjs` bundling everything (incl. `@rotho/shared` and `ws`, with `bufferutil`/`utf-8-validate` external) to `bin/plugin.js`, stub `src/plugin.ts`; package scripts `validate`, `link`, `pack` wrapping `streamdeck`
- [x] Scaffold `packages/extension` (`@rotho/extension`, depends on `"@rotho/shared": "workspace:*"`): MV3 `manifest.json` (permissions `tabs`, `storage`; `host_permissions` `https://tv.youtube.com/*`; background service worker), stub `src/background.ts`, build with esbuild (bundling `@rotho/shared`) to `dist/`
- [x] Commit `pnpm-lock.yaml`
- [x] Generate extension RSA keypair; put the public key in `manifest.json` `key`; record the resulting extension ID in `packages/shared` as `EXTENSION_ID`; add `*.pem` to `.gitignore` and document where the user keeps the private key
- [x] ESLint (flat config, `typescript-eslint`), Prettier, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (node_modules, dist, bin, *.pem, *.streamDeckPlugin, coverage)
- [x] Vitest configured at root with one passing smoke test per package
- [x] `.github/workflows/ci.yml`: on `pull_request` and push to `main` — `pnpm/action-setup` (version from `packageManager`), `actions/setup-node` (Node 24, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm --filter @rotho/plugin validate`
- [x] `README.md` (what it does, architecture diagram in text, dev setup incl. Node 24+ and `npm i -g pnpm`, local install: `pnpm --filter @rotho/plugin link`, Chrome "Load unpacked") and `LICENSE` (MIT, Rothenbergerjl, 2026)
- [x] `.github/gh-recipes.md` with project/field/option ids for the board and tested `gh` commands (created during plan sync, 2026-10-11, along with the labels, board, and issue #1)
- [x] `.github/ISSUE_TEMPLATE/` with `bug.yml` and `plan.yml`; `.github/pull_request_template.md` with a `Fixes #` line

### Verification Plan
- `pnpm install --frozen-lockfile` exits 0 on a clean checkout
- `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` all exit 0
- `pnpm --filter @rotho/plugin validate` reports no errors
- `grep -cE "from ['\"](@rotho/shared|@elgato/streamdeck|ws)['\"]|require\(['\"](@rotho/shared|@elgato/streamdeck|ws)['\"]\)" packages/plugin/com.rotho.yttv-multiview.sdPlugin/bin/plugin.js` prints `0` (all deps inlined by Rollup)
- `grep -E '"Version": "24"' packages/plugin/com.rotho.yttv-multiview.sdPlugin/manifest.json` matches
- `packages/extension/dist/manifest.json` exists and `node -e` script confirms the ID derived from its `key` equals `EXTENSION_ID` in `shared`
- `git status --porcelain` shows no `*.pem` file and no build output tracked
- `gh label list` includes `plan`, `type:feature`, `area:plugin`, `area:extension`, `area:ci`; `gh project list --owner Rothenbergerjl` shows the board

### Phase Summary
Completed 2026-10-11 on branch `1-yttv-multiview`.

**What exists now**
- pnpm 10.33.0 workspace (`packageManager` pinned). Root scripts: `build`, `typecheck`, `test`
  fan out with `pnpm -r`; `lint` (`eslint .`), `format`, `format:check` run at root;
  `check:extension-id` runs `scripts/check-extension-id.mjs`.
- `pnpm-workspace.yaml` catalog pins every tool version. `onlyBuiltDependencies` allows only
  `esbuild` (needs its postinstall to fetch its binary).
- `@rotho/shared` exports TS source directly (`exports: "./src/index.ts"`, no build step) because
  both consumers bundle it. Constants: `PLUGIN_UUID`, `ACTION_UUIDS`, `EXTENSION_ID`,
  `EXTENSION_ORIGIN`, `WS_PORT = 47731`, `MAX_SLOTS = 15`, `PROTOCOL_VERSION = 1`, placeholder
  `Game` type.
- `@rotho/extension`: `manifest.json` lives at the package root (copied to `dist/` by
  `build.mjs`, which bundles `src/background.ts` with esbuild as an ESM service worker,
  `minimum_chrome_version` 116). Extension ID is `decadhapokljmmbknbfcpjckddhiicmg`.
- `@rotho/plugin`: based on the `@elgato/cli` 1.10.2 template (extracted from the npm package
  instead of running the interactive `streamdeck create` wizard). Manifest declares the Game Slot
  (`.slot`) and Mute All (`.muteall`) actions with the template's placeholder PNGs, Windows only,
  `Nodejs.Version` "24", `Software.MinimumVersion` "7.1". `src/plugin.ts` only logs and connects.
  Scripts `validate`, `link`, `pack` (to `../../dist`), `watch`.
- Tests (Vitest, `vitest run` per package, no config file needed): shared constants;
  extension manifest key → `EXTENSION_ID`; plugin manifest UUIDs/Node/Stream Deck versions.
- CI (`.github/workflows/ci.yml`), issue templates (`bug.yml`, `plan.yml`), PR template, README,
  MIT LICENSE.

**Key decisions / gotchas**
- **TypeScript 6.0.3, not 7.0.** typescript-eslint 8.71 requires TS `<6.1`. TS 6 defaults
  `types` to `[]`, so each package lists its `types` explicitly (`chrome`/`node`).
- **@elgato/streamdeck 3.0.2** (the template's latest major). It already depends on `ws` 8,
  so Phase 4 should import `ws` from the plugin's own dependency (add `ws: "catalog:"` then).
- **ws native add-ons:** no `external` setting needed. `@rollup/plugin-commonjs`'s default
  `ignoreTryCatch` leaves ws's `require("bufferutil")` inside its try/catch. Verified: the
  bundle imports only Node built-ins and runs from a copy outside the repo.
- **Rollup typescript plugin** needs `noEmit: false` (base tsconfig has `noEmit: true`) and
  includes `../shared/src/**/*.ts` so shared source compiles into the bundle.
- **Vitest runs per package** (`pnpm -r run test`) instead of a root config. Same outcome as
  the plan item, simpler.
- **Local machine:** pnpm was originally installed under nvm's Node 22, so it ran on Node 22
  and failed `engine-strict`. Fixed by `npm i -g pnpm@10.33.0` under Node 24
  (`C:\Program Files\nodejs\pnpm` now comes first on PATH).
- **Private key** is at `~/.config/rotho-yttv-multiview/extension-key.pem` (outside the repo;
  public key and ID in `~/.config/rotho-yttv-multiview/public.json`). Only needed for Chrome Web
  Store publishing.
- `.gitignore` must use `**/*.sdPlugin/bin/`; a pattern with a slash is anchored to the root.

**Verification results (all passed)**
- Clean `rm -rf node_modules && pnpm install --frozen-lockfile` → exit 0.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` → exit 0. `pnpm test`: 7 tests
  across 3 packages pass.
- `pnpm --filter @rotho/plugin validate` → "Validation successful".
- Inlined-deps grep on `bin/plugin.js` → `0`. Its only imports are Node built-ins. Copied
  `.sdPlugin` outside the repo, `node bin/plugin.js` → exit 0, no module-not-found errors.
- Manifest has `"Version": "24"`. `pnpm check:extension-id` → "Extension ID OK".
- `git add -n .` lists no `*.pem`, `bin/`, `dist/` or `node_modules` paths.
- `gh label list` has all 5 required labels. Project "Rotho YTTV Multiview" (#3) exists.

**Next:** Phase 2. Nothing is committed yet. The user commits Phase 1, including `pnpm-lock.yaml`.

## Phase 2: Shared protocol and extension tab/audio engine
Status: Complete

- [x] Define protocol in `packages/shared/src/protocol.ts`, with a version field:
  - Extension → plugin: `hello {protocolVersion, extensionVersion}`, `state {games: Array<{slot, tabId, title, heard: boolean}>, allMuted: boolean, lastHeardTabId?: number}`, `heartbeat`
  - Plugin → extension: `solo {slot}`, `toggleMuteAll`, `requestState`
  - Runtime validators (`parseMessage`) that reject malformed JSON
- [x] `packages/extension/src/slots.ts`: pure slot allocator (lowest free slot, stable assignment, release on close, max 15) with unit tests
- [x] `packages/extension/src/engine.ts`: pure state reducer for events (tab added/removed/url-changed/title-changed, solo, toggleMuteAll) returning next state + list of `{tabId, muted}` effects; unit tests cover: new tab starts muted, solo mutes all others, closing the heard tab leaves all muted, mute-all toggles and restores last heard, navigating a tab away from `tv.youtube.com` frees its slot
- [x] `packages/extension/src/background.ts`: wire `chrome.tabs.onCreated/onUpdated/onRemoved` and startup scan (`chrome.tabs.query({url: "https://tv.youtube.com/*"})`) into the engine; apply effects with `chrome.tabs.update(tabId, {muted})`; persist state in `chrome.storage.session`
- [x] `packages/extension/src/connection.ts`: WebSocket client to `ws://127.0.0.1:${WS_PORT}`, exponential backoff reconnect (1s→30s), 20s heartbeat, send `hello` + full `state` on connect and `state` after every change
- [x] Unit tests for `connection.ts` using a mock WebSocket (reconnect, heartbeat, message dispatch)

### Verification Plan
- `pnpm --filter @rotho/shared --filter @rotho/extension test` passes, with tests named for each engine rule above
- `pnpm --filter @rotho/extension build` produces `dist/background.js` and `dist/manifest.json`
- `pnpm typecheck && pnpm lint` exit 0

### Phase Summary
Completed 2026-10-11 on branch `1-yttv-multiview`.

**What exists now**
- `@rotho/shared` is split into `src/constants.ts` (unchanged constants) and `src/protocol.ts`
  (message types plus `parseExtensionMessage` and `parsePluginMessage`). `src/index.ts`
  re-exports both. The parsers return `null` for bad JSON, unknown types, wrong field types and
  slots outside 1..15. They copy only the known fields. The protocol version travels in `hello`;
  `PROTOCOL_VERSION` = 1.
- `@rotho/extension`:
  - `src/slots.ts`: `lowestFreeSlot(used, max = 15)`.
  - `src/engine.ts`: pure `reduce(state, event) -> { state, effects, changed }`.
    - State is `{ tabs: [{tabId, slot, title}], heardTabId, lastHeardTabId }`.
    - Events: `tabUpdated` (create, URL change or title change), `tabRemoved`, `sync` (the full
      tab list at startup), `solo`, `toggleMuteAll`.
    - `toStateMessage(state)` builds the protocol `state` message.
    - `isYouTubeTvUrl` accepts only `https://tv.youtube.com`.
  - `src/connection.ts`: `PluginConnection`.
    - Injectable socket factory.
    - Backoff of 1s, 2s, 4s, 8s, 16s, then 30s max, reset after a successful connect.
    - Heartbeat every 20s while open.
    - `ensureConnected()` for the alarm.
    - `send()` drops messages while disconnected; the full state is resent on every connect.
  - `src/background.ts`:
    - Registers the tab listeners synchronously.
    - A promise queue processes events one at a time after the saved state loads from
      `chrome.storage.session`.
    - Mute changes go through `chrome.tabs.update`, ignoring tabs that already closed.
    - State is persisted and broadcast only when `changed` is true, or always after the
      startup `sync`.
- Tests: shared has 20 (protocol plus constants); extension has 35 (slots, engine, connection,
  manifest).

**Decisions / behaviour beyond the original item text**
- **Added the `alarms` permission** (`chrome.alarms` every 30s calls `ensureConnected()`). When
  nothing is connected, the MV3 worker sleeps after about 30s idle and its reconnect timers die.
  Without the alarm, the extension would not reconnect when the Stream Deck app starts after
  Chrome. The manifest test was updated to `["tabs", "storage", "alarms"]`. When connected,
  WebSocket traffic plus the 20s heartbeat keeps the worker alive (Chrome 116+).
- **Startup scans all tabs** with `chrome.tabs.query({})`, not a URL filter. That lets `sync`
  notice tracked tabs that navigated away from YouTube TV while the worker slept. Unseen
  YouTube TV tabs are added in tab-id order, which roughly matches open order.
- **`sync` enforces the invariant** that every tracked tab is muted except `heardTabId`. Saved
  slots and the heard tab survive a worker restart; after a browser restart, tab IDs change, so
  everything gets re-slotted and muted.
- **A tab that navigates away from YouTube TV** is untracked and **unmuted**, so the user's
  other browsing isn't left silent.
- **More than 15 YouTube TV tabs:** the extra tabs are left untracked and untouched, not muted.
  They pick up a slot on their next URL or title change after one frees.
- `lastHeardTabId` is cleared when that tab closes, so Mute All has nothing to restore.
- Manual mute/unmute from Chrome's tab UI is not observed (out of scope). The next solo
  reasserts the state.
- `PluginConnection` casts the DOM `WebSocket` to `SocketLike`; it matches at runtime, but the
  DOM handler types are narrower.

**Verification results (all passed)**
- `pnpm --filter @rotho/shared --filter @rotho/extension exec vitest run --reporter=verbose`:
  55 tests pass. They include named engine tests for: new tabs start muted; solo mutes all
  others; closing the heard tab leaves all muted; mute all toggles and restores the last heard
  tab; navigating away frees the slot.
- `pnpm --filter @rotho/extension build` produces `dist/background.js` (10.4 kb) and
  `dist/manifest.json`.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` exit 0.
- Extra smoke test: the built `dist/background.js` ran in Node with a fake `chrome` object
  against a real `ws` server on 127.0.0.1:47731. Results:
  - Startup muted both YouTube TV tabs and skipped ESPN.
  - It sent `hello` then `state` (slots 1 and 2, `allMuted: true`).
  - `solo` slot 2 gave `[[7,true],[9,false]]`.
  - A new tab got slot 3 and was muted.
  - `toggleMuteAll` muted all three and stored `lastHeardTabId` = 9.

**Next:** Phase 3 (title extraction). It needs a live YouTube TV game tab open in Chrome.

## Phase 3: Matchup title extraction
Status: Complete

- [x] With the user's live YouTube TV game tab open, use Claude in Chrome (read-only: `get_page_text`/`read_page`/`javascript_tool` reading `document.title` and DOM) to find where the matchup/channel text lives; record findings (selectors, title format examples) in the Phase Summary
- [x] `packages/shared/src/title.ts`: pure `formatMatchup(raw: string): string` that shortens to fit a 72×72 key (e.g. "Chiefs at Bills" → "KC @ BUF" via an NFL team abbreviation table; otherwise trims the " - YouTube TV" suffix and truncates to 2 lines of ~8 chars) with table-driven unit tests from the real examples
- [x] If the DOM has better text than `document.title`: add a content script (`https://tv.youtube.com/*`) that reports the matchup text to the service worker on load and on change (`MutationObserver` on the relevant node, debounced); otherwise use `tab.title` from `chrome.tabs.onUpdated`
- [x] Feed titles into the engine's `title-changed` event

### Verification Plan
- `pnpm test` passes including `title.test.ts` with ≥5 real-world examples captured from the live tab
- `pnpm --filter @rotho/extension build` succeeds; if a content script was added, `dist/manifest.json` lists it under `content_scripts`

### Phase Summary
Completed 2026-10-11 on branch `1-yttv-multiview`.

**Live-page findings** (Claude in Chrome, read-only, on the user's game tab)
- **`document.title` is always `"Home - YouTube TV"`** on a watch page, even during a game. The
  tab title is useless, so the planned fallback to the tab title was dropped.
- **Program title** lives in the player header:
  `h1.ypc-video-title > ytu-endpoint > a > yt-formatted-string.ypc-video-title-text`, e.g.
  "San Francisco 49ers at Seattle Seahawks" (sibling text "LIVE").
- **Mini player** repeats it in `ytu-mini-player-info .ymp-primary-text`.
- **`navigator.mediaSession.metadata.title` and `.artist`** are the channel name ("FOX 59"),
  not the game.
- **Other real formats** seen in home tiles: "Monday Night Football with Peyton and Eli: Buffalo
  Bills at Los Angeles Rams", "Prime Vision Alt Cast: Seattle Seahawks at Denver Broncos", "CBS 4
  News at 6", "WRTV News at 6:00", "NFL GameDay Live".

**What exists now**
- `@rotho/shared/src/title.ts`:
  - `formatMatchup(raw)` finds `<team> at|@|vs|v <team>` anywhere in the title, using full NFL
    names or nicknames (case-insensitive, whole words). It returns `"AWAY @ HOME"`, or `"A vs B"`
    when the title says vs.
  - Anything else is whitespace-normalised, has a trailing " - YouTube TV" removed, and is cut
    to `MAX_TITLE_LENGTH` = 16 characters with "…".
  - Splitting into two lines for the key is left to the Phase 4 renderer.
- `@rotho/extension/src/page-title.ts`:
  - `TITLE_SELECTORS`: the player h1 title text, then the h1, then the mini player.
  - `extractPageTitle(root, mediaSessionTitle)` falls back to the channel name, then `""`.
  - Also defines the `PageTitleMessage` type and `isPageTitleMessage`.
- `@rotho/extension/src/content.ts`:
  - Runs on `https://tv.youtube.com/*` at `document_idle`.
  - A MutationObserver on the whole document, **throttled** to 500ms (a debounce would never
    fire because the player mutates the DOM constantly), sends `{type:"pageTitle", title}` only
    when the title changes.
  - It disconnects itself if the extension context is gone.
  - Built by esbuild as an **IIFE**, because content scripts aren't modules.
- `background.ts` changes:
  - `toTabInfo` no longer passes the tab title, and `onUpdated` only reacts to URL changes.
  - `runtime.onMessage` turns content-script reports, checked against our own extension ID and
    a sender tab, into `tabUpdated` events with `title`.
  - The engine is unchanged; titles persist in session storage, so a worker restart keeps them.
- **Added `scripting` permission + `runtime.onInstalled` injection** of `content.js` into
  YouTube TV tabs that were already open. Chrome doesn't inject declared content scripts into
  existing tabs on install or reload. Manifest permissions are now
  `["tabs","storage","alarms","scripting"]`, and the manifest test checks `content_scripts`.
- The protocol still carries the **raw** title; the plugin calls `formatMatchup` when drawing
  keys (Phase 4).

**Verification results (all passed)**
- `pnpm test`: shared 37 tests (17 in `title.test.ts`, including 8 real titles captured from the
  live tab), extension 40, plugin 2.
- `pnpm --filter @rotho/extension build` produces `dist/background.js`, `dist/content.js` and
  `dist/manifest.json`. `content_scripts` is listed in the built manifest.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` exit 0.
- Live re-check (2026-10-11, after the tab returned to the Claude group): all three
  `TITLE_SELECTORS` match on the live watch page and return "San Francisco 49ers at Seattle
  Seahawks" (that exact string is a `title.test.ts` case → "SF @ SEA"). The Media Session
  fallback reads "FOX 59".

**Next:** Phase 4 (Stream Deck plugin). Add `ws: "catalog:"` to `@rotho/plugin` for the
server, and use `formatMatchup` in `render.ts`.

## Phase 4: Stream Deck plugin — server, actions, rendering
Status: Complete

- [x] `packages/plugin/src/server.ts`: `ws` server bound to `127.0.0.1:WS_PORT`; verify `Origin === chrome-extension://${EXTENSION_ID}` in `verifyClient`; one active client (newest wins); emit `connected`/`disconnected`/`state` events; log via SDK logger
- [x] `packages/plugin/src/store.ts`: holds latest `state` + connection status; actions subscribe to it
- [x] `packages/plugin/src/render.ts`: pure function building a 144×144 SVG data URL for a key from `{slot, title?, heard, connected}`: slot badge top-left, title centered (≤2 lines), green border + speaker glyph when heard, dimmed "No Chrome" when disconnected, dim slot-number-only when empty; unit tests snapshot the SVG strings
- [x] `actions/slot.ts` (`SingletonAction`): per-key setting `slot` (1–15); re-render all visible slot keys on store change; `onKeyDown` → send `solo` if connected and slot occupied, else `showAlert()`
- [x] `actions/mute-all.ts`: render muted/unmuted state; `onKeyDown` → `toggleMuteAll` or `showAlert()` if offline
- [x] Property inspector `ui/slot.html` using sdpi-components: slot number dropdown 1–15
- [x] Real key icons (`imgs/actions/slot`, `imgs/actions/muteall`, plugin icon, category icon) at 1x/2x sizes required by the manifest
- [x] `test/fake-extension.ts`: Node script that connects to the server with the correct `Origin` header, sends a scripted `state`, and logs received commands (used for integration verification)

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes (render snapshots, server origin rejection test, server accepts correct origin)
- `pnpm --filter @rotho/plugin build && pnpm --filter @rotho/plugin validate` passes
- Copy only `com.rotho.yttv-multiview.sdPlugin/` to a temp dir outside the repo and run `node -e "import('./bin/plugin.js')"` there with a stubbed SDK connection check — module loads without `Cannot find module` errors (proves the bundle is self-contained)
- Integration test (Vitest) starts the server in-process, connects the fake extension, sends `state`, and asserts the store reflects it; a connection with origin `http://evil.example` is refused

### Phase Summary
Completed 2026-10-11 on branch `1-yttv-multiview`.

**What exists now** (`packages/plugin/src`)
- `server.ts` — `ExtensionServer` built on `ws`'s `WebSocketServer`, bound to `127.0.0.1`.
  - Origin: `verifyClient` accepts only `EXTENSION_ORIGIN`; anything else gets HTTP 401 and a
    log warning.
  - One client at a time: a newer connection replaces the old one, which is closed with code
    `4000` (`REPLACED_CLOSE_CODE`).
  - Malformed messages are logged and ignored.
  - Idle drop: a client silent for 60s is dropped (the extension heartbeats every 20s), so a
    half-open socket from a sleeping service worker doesn't leave keys showing stale state.
  - If the port is busy, it retries every 5s.
  - `port` getter; `port: 0` picks a free port for tests.
- `store.ts` — `Store` holds `{ connected, games, allMuted, canRestore }`. Disconnecting clears
  the games; connecting shows empty slots until the first `state` arrives.
- `render.ts` — pure SVG builders (144×144, base64 data URLs):
  - `slotKeySvg`:
    - Heard: green border and background, green slot badge, speaker with waves.
    - Muted: grey badge, speaker with a cross.
    - Empty: dim, large slot number.
    - Disconnected: dim "No / Chrome" with the badge.
    - Unknown title: shows "YouTube TV".
  - `muteAllKeySvg` states: "Mute all", "Restore", "All muted", "No Chrome".
  - `wrap()` splits text into at most 2 lines of 9 characters; the second line is cut with "…".
  - Labels come from `formatMatchup`. Font size shrinks to fit the longest line, and text is
    XML-escaped.
- `actions/slot.ts` — `SlotAction`:
  - Per-key setting `slot`. A **newly placed key defaults to the lowest slot no other visible
    key uses**, so dragging out 4 keys gives slots 1–4 with no setup.
  - Re-renders on store changes.
  - Press: `solo` if connected and the slot has a game, otherwise `showAlert()`.
- `actions/mute-all.ts` — `MuteAllAction`: press sends `toggleMuteAll`, or `showAlert()` when
  offline.
- `plugin.ts` — wires the store, server and actions. It logs the extension's `hello` and warns
  on a protocol mismatch.
- `ui/slot.html` — sdpi-components v4 `sdpi-select` (slot 1–15, `value-type="number"`) plus a
  short help text.
- **Icons are SVG** (`imgs/actions/{slot,muteall}/{icon,key}.svg`,
  `imgs/plugin/category-icon.svg`) instead of 1x/2x PNG pairs. `streamdeck validate` accepts
  them. The template's `marketplace.png` placeholder is still there; replacing it belongs with
  Phase 6 packaging if wanted.
- Both actions set `"ShowTitle": false` (the image carries all the text). The slot action has
  `PropertyInspectorPath`.
- `test/fake-extension.ts`:
  - Exports `connectFakeExtension()` and `sampleState`.
  - Script mode: `pnpm --filter @rotho/plugin fake-extension` runs under Node 24's type
    stripping and connects to the running plugin.
  - It imports `../../shared/src/constants.ts` directly, so the plugin tsconfig has
    `allowImportingTsExtensions`. The Rollup typescript options turn it off, since emitting
    doesn't allow it.
- Added `ws` and `@types/ws` (catalog) to `@rotho/plugin`.

**Verification results (all passed)**
- `pnpm --filter @rotho/plugin test`: 29 tests.
  - Render: 8 snapshots (`test/__snapshots__/render.test.ts.snap`) plus content assertions.
  - Integration: real server and fake extension. The store reflects the sent state; origins
    `http://evil.example` and empty are refused; commands reach the extension; malformed
    messages are ignored; the newest connection wins (old one closed with 4000); disconnect
    clears the store; an idle client is dropped.
- Whole repo: `pnpm test` (shared 37, extension 40, plugin 29), `pnpm typecheck`, `pnpm lint`
  and `pnpm format:check` all exit 0.
- `pnpm --filter @rotho/plugin build` + `validate` → "Validation successful".
  - `bin/plugin.js` is 98 KB and imports only Node built-ins.
  - Its only `require`s are ws's optional `bufferutil` and `utf-8-validate`, inside try/catch.
  - A copy of the `.sdPlugin` outside the repo runs with exit 0 and no module errors.
- Visual check: all 10 key states rendered at 144px and 72px in the browser pane (preview HTML
  at `dist/key-previews.html`, git-ignored) and look correct.

**Next:** Phase 5, on the user's PC: link the plugin, load the extension unpacked, and run the
scenarios with real games.

## Phase 5: End-to-end integration on the user's PC
Status: Not started

- [ ] `pnpm --filter @rotho/plugin link` and `pnpm --filter @rotho/plugin exec streamdeck restart com.rotho.yttv-multiview` (Stream Deck app must be 7.1+)
- [ ] User loads `packages/extension/dist` unpacked in Chrome (`chrome://extensions`, Developer mode) and confirms the extension ID matches `EXTENSION_ID`
- [ ] User drags 2–4 Game Slot keys (slots 1..N) and one Mute All key onto the MK.2
- [ ] Walk through the scenarios: open 2 games (both start muted, slots 1 & 2), press slot 1 (hear game 1), press slot 2 (switch), Mute All (silence), Mute All again (game 2 returns), close game 2 (all muted, slot 2 empty), open new game (takes slot 2, muted), quit Chrome (keys show "No Chrome"), reopen Chrome (reconnects, state restored)
- [ ] Fix any defects found; add regression tests for each

### Verification Plan
- Plugin log (`%APPDATA%\Elgato\StreamDeck\Plugins\com.rotho.yttv-multiview.sdPlugin\logs\`) shows a client connection from the extension origin and `solo`/`toggleMuteAll` commands matching key presses
- Via Claude in Chrome (read-only) or extension service-worker console: `chrome.tabs.query({url:"https://tv.youtube.com/*"})` mute states match the expected state after each scenario step
- All Phase 2–4 automated tests still pass

### Phase Summary
_(write when phase completes)_

## Phase 6: Packaging, release workflow, and docs
Status: Not started

- [ ] Single version source: root `package.json` version propagated by a `scripts/sync-version.mjs` into the plugin manifest (`Version` x.y.z.0) and extension manifest
- [ ] `pnpm package` (root script): builds both, runs `pnpm --filter @rotho/plugin pack` → `dist/com.rotho.yttv-multiview.streamDeckPlugin`, zips `packages/extension/dist` → `dist/yttv-multiview-extension-<version>.zip`
- [ ] `.github/workflows/release.yml`: `workflow_dispatch` with `version` input; same pnpm setup as CI (`pnpm/action-setup`, Node 24, `--frozen-lockfile`), runs CI steps, sync-version, package, creates tag `v<version>` and a GitHub Release with both files attached (`gh release create`)
- [ ] README: end-user install from a release (double-click `.streamDeckPlugin`; unzip extension and Load unpacked), usage, troubleshooting (port in use, extension ID mismatch, "No Chrome")
- [ ] `CHANGELOG.md` with the 0.1.0 entry

### Verification Plan
- `pnpm package` locally produces both files; `unzip -l` on the extension zip lists `manifest.json` and `background.js`
- `unzip -l dist/com.rotho.yttv-multiview.streamDeckPlugin` lists `manifest.json` and `bin/plugin.js` and contains **no** `node_modules/` entries
- `actionlint .github/workflows/*.yml` (or `npx action-validator`) reports no errors
- After merge, the user triggers the workflow (manual run, not done by the agent); `gh release view v0.1.0` shows both assets

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
