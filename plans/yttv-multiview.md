# Rotho YTTV Multiview — Stream Deck audio switcher for YouTube TV

Issue: #TBD   <!-- tracking issue; created after plan approval -->

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
issue is #TBD and its board item id is TBD (fill in when the tracking issue and board are
created during plan sync).
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

> Note: `main` has no commits yet. The user must make an initial commit on `main` and push
> it (e.g. this plan file) before creating the work branch, so the PR has a base.

## Phase 1: Repository setup
Status: Not started

- [ ] Install pnpm (`npm i -g pnpm`) and record the version in root `package.json` `"packageManager": "pnpm@<exact version>"`
- [ ] Root `package.json` (private, `engines.node >=24`, `packageManager` pin) with scripts that fan out via `pnpm -r`: `build`, `typecheck`, `lint`, `format`, `format:check`, `test`
- [ ] `pnpm-workspace.yaml`: `packages: ["packages/*"]`; `catalog:` with shared versions (typescript, vitest, eslint, typescript-eslint, prettier, ws, @types/node, @types/chrome, @elgato/streamdeck, @elgato/cli, rollup + plugins, esbuild); `onlyBuiltDependencies:` allow-list kept empty unless a dependency demonstrably needs its install script (e.g. `esbuild`)
- [ ] `.npmrc` with `engine-strict=true`
- [ ] `tsconfig.base.json` (strict, `ES2022`, `moduleResolution: bundler`) and per-package `tsconfig.json` files extending it
- [ ] Scaffold `packages/shared` (`@rotho/shared`; `src/index.ts` exporting `PLUGIN_UUID = "com.rotho.yttv-multiview"`, `WS_PORT`, placeholder protocol types)
- [ ] Scaffold `packages/plugin` (`@rotho/plugin`, depends on `"@rotho/shared": "workspace:*"`, other deps `catalog:`): use the Elgato template layout (run `streamdeck create` in a scratch folder and copy the relevant files, translating npm scripts to pnpm) — `com.rotho.yttv-multiview.sdPlugin/manifest.json` (Name "Rotho YTTV Multiview", `Nodejs.Version` "24", `Software.MinimumVersion` "7.1", OS windows, both action UUIDs declared with placeholder icons), `rollup.config.mjs` bundling everything (incl. `@rotho/shared` and `ws`, with `bufferutil`/`utf-8-validate` external) to `bin/plugin.js`, stub `src/plugin.ts`; package scripts `validate`, `link`, `pack` wrapping `streamdeck`
- [ ] Scaffold `packages/extension` (`@rotho/extension`, depends on `"@rotho/shared": "workspace:*"`): MV3 `manifest.json` (permissions `tabs`, `storage`; `host_permissions` `https://tv.youtube.com/*`; background service worker), stub `src/background.ts`, build with esbuild (bundling `@rotho/shared`) to `dist/`
- [ ] Commit `pnpm-lock.yaml`
- [ ] Generate extension RSA keypair; put the public key in `manifest.json` `key`; record the resulting extension ID in `packages/shared` as `EXTENSION_ID`; add `*.pem` to `.gitignore` and document where the user keeps the private key
- [ ] ESLint (flat config, `typescript-eslint`), Prettier, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (node_modules, dist, bin, *.pem, *.streamDeckPlugin, coverage)
- [ ] Vitest configured at root with one passing smoke test per package
- [ ] `.github/workflows/ci.yml`: on `pull_request` and push to `main` — `pnpm/action-setup` (version from `packageManager`), `actions/setup-node` (Node 24, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm --filter @rotho/plugin validate`
- [ ] `README.md` (what it does, architecture diagram in text, dev setup incl. Node 24+ and `npm i -g pnpm`, local install: `pnpm --filter @rotho/plugin link`, Chrome "Load unpacked") and `LICENSE` (MIT, Rothenbergerjl, 2026)
- [ ] `.github/gh-recipes.md` with project/field/option ids for the board and tested `gh` commands (board, labels, and tracking issue are created during plan sync)
- [ ] `.github/ISSUE_TEMPLATE/` with `bug.yml` and `plan.yml`; `.github/pull_request_template.md` with a `Fixes #` line

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
_(write when phase completes)_

## Phase 2: Shared protocol and extension tab/audio engine
Status: Not started

- [ ] Define protocol in `packages/shared/src/protocol.ts`, with a version field:
  - Extension → plugin: `hello {protocolVersion, extensionVersion}`, `state {games: Array<{slot, tabId, title, heard: boolean}>, allMuted: boolean, lastHeardTabId?: number}`, `heartbeat`
  - Plugin → extension: `solo {slot}`, `toggleMuteAll`, `requestState`
  - Runtime validators (`parseMessage`) that reject malformed JSON
- [ ] `packages/extension/src/slots.ts`: pure slot allocator (lowest free slot, stable assignment, release on close, max 15) with unit tests
- [ ] `packages/extension/src/engine.ts`: pure state reducer for events (tab added/removed/url-changed/title-changed, solo, toggleMuteAll) returning next state + list of `{tabId, muted}` effects; unit tests cover: new tab starts muted, solo mutes all others, closing the heard tab leaves all muted, mute-all toggles and restores last heard, navigating a tab away from `tv.youtube.com` frees its slot
- [ ] `packages/extension/src/background.ts`: wire `chrome.tabs.onCreated/onUpdated/onRemoved` and startup scan (`chrome.tabs.query({url: "https://tv.youtube.com/*"})`) into the engine; apply effects with `chrome.tabs.update(tabId, {muted})`; persist state in `chrome.storage.session`
- [ ] `packages/extension/src/connection.ts`: WebSocket client to `ws://127.0.0.1:${WS_PORT}`, exponential backoff reconnect (1s→30s), 20s heartbeat, send `hello` + full `state` on connect and `state` after every change
- [ ] Unit tests for `connection.ts` using a mock WebSocket (reconnect, heartbeat, message dispatch)

### Verification Plan
- `pnpm --filter @rotho/shared --filter @rotho/extension test` passes, with tests named for each engine rule above
- `pnpm --filter @rotho/extension build` produces `dist/background.js` and `dist/manifest.json`
- `pnpm typecheck && pnpm lint` exit 0

### Phase Summary
_(write when phase completes)_

## Phase 3: Matchup title extraction
Status: Not started

- [ ] With the user's live YouTube TV game tab open, use Claude in Chrome (read-only: `get_page_text`/`read_page`/`javascript_tool` reading `document.title` and DOM) to find where the matchup/channel text lives; record findings (selectors, title format examples) in the Phase Summary
- [ ] `packages/shared/src/title.ts`: pure `formatMatchup(raw: string): string` that shortens to fit a 72×72 key (e.g. "Chiefs at Bills" → "KC @ BUF" via an NFL team abbreviation table; otherwise trims the " - YouTube TV" suffix and truncates to 2 lines of ~8 chars) with table-driven unit tests from the real examples
- [ ] If the DOM has better text than `document.title`: add a content script (`https://tv.youtube.com/*`) that reports the matchup text to the service worker on load and on change (`MutationObserver` on the relevant node, debounced); otherwise use `tab.title` from `chrome.tabs.onUpdated`
- [ ] Feed titles into the engine's `title-changed` event

### Verification Plan
- `pnpm test` passes including `title.test.ts` with ≥5 real-world examples captured from the live tab
- `pnpm --filter @rotho/extension build` succeeds; if a content script was added, `dist/manifest.json` lists it under `content_scripts`

### Phase Summary
_(write when phase completes)_

## Phase 4: Stream Deck plugin — server, actions, rendering
Status: Not started

- [ ] `packages/plugin/src/server.ts`: `ws` server bound to `127.0.0.1:WS_PORT`; verify `Origin === chrome-extension://${EXTENSION_ID}` in `verifyClient`; one active client (newest wins); emit `connected`/`disconnected`/`state` events; log via SDK logger
- [ ] `packages/plugin/src/store.ts`: holds latest `state` + connection status; actions subscribe to it
- [ ] `packages/plugin/src/render.ts`: pure function building a 144×144 SVG data URL for a key from `{slot, title?, heard, connected}`: slot badge top-left, title centered (≤2 lines), green border + speaker glyph when heard, dimmed "No Chrome" when disconnected, dim slot-number-only when empty; unit tests snapshot the SVG strings
- [ ] `actions/slot.ts` (`SingletonAction`): per-key setting `slot` (1–15); re-render all visible slot keys on store change; `onKeyDown` → send `solo` if connected and slot occupied, else `showAlert()`
- [ ] `actions/mute-all.ts`: render muted/unmuted state; `onKeyDown` → `toggleMuteAll` or `showAlert()` if offline
- [ ] Property inspector `ui/slot.html` using sdpi-components: slot number dropdown 1–15
- [ ] Real key icons (`imgs/actions/slot`, `imgs/actions/muteall`, plugin icon, category icon) at 1x/2x sizes required by the manifest
- [ ] `test/fake-extension.ts`: Node script that connects to the server with the correct `Origin` header, sends a scripted `state`, and logs received commands (used for integration verification)

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes (render snapshots, server origin rejection test, server accepts correct origin)
- `pnpm --filter @rotho/plugin build && pnpm --filter @rotho/plugin validate` passes
- Copy only `com.rotho.yttv-multiview.sdPlugin/` to a temp dir outside the repo and run `node -e "import('./bin/plugin.js')"` there with a stubbed SDK connection check — module loads without `Cannot find module` errors (proves the bundle is self-contained)
- Integration test (Vitest) starts the server in-process, connects the fake extension, sends `state`, and asserts the store reflects it; a connection with origin `http://evil.example` is refused

### Phase Summary
_(write when phase completes)_

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
