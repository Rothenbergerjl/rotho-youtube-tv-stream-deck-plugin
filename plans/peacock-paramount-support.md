# Peacock and Paramount+ Support

Issue: #10

Track Peacock and Paramount+ player tabs alongside YouTube TV: they take Game Slots, switch audio
the same way, and show a service badge. Users turn each new service on from a new extension
options page. The Open key gets a per-key service setting. ESPN and regular YouTube are out of
scope (deferred on #10). The product name, plugin UUID and extension ID stay the same.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #10`.

## GitHub sync
Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #10 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVnmY`. Board ids and tested
recipes live in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`). If a command fails with an id error, refresh the ids as that
file describes.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBVnmY --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (recipe "Tick a phase in
  an issue body" in `.github/gh-recipes.md`). Also tick it in this plan. Read the body back.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then `gh issue comment 10 --body-file <file>`
  starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #10`. Merging closes it and the board moves
  it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Findings this plan relies on
Checked live in Chrome on 2026-10-17 (see the findings comment on #10).

| | URL patterns tracked | Title source |
|---|---|---|
| Peacock | `https://www.peacocktv.com/watch/playback/*` (seen: `/event/`, `/clip/`) | Tab title, minus ` - Peacock` |
| Paramount+ live | `https://www.paramountplus.com/live-tv/stream/*` | Content script: program from `main .video__player-area .video__metadata p`, channel from `.skin-metadata-manager-title`. The tab title is only the channel, or just "On Paramount Plus" |
| Paramount+ on demand | `https://www.paramountplus.com/shows/video/*` (seen), `/movies/video/*` (assumed, verify in Phase 5) | Tab title, minus a leading `Watch ` and a trailing ` - Paramount+` |

- Neither service sets `navigator.mediaSession.metadata`.
- Several streams on one account play at once on both services. Muting a tab doesn't pause the
  player or show a prompt.
- Reading tab titles needs only the existing `tabs` permission. Only Paramount+ live needs a
  content script, so only `www.paramountplus.com` needs host access.
- Chrome disables an updated extension until the user approves new `host_permissions` or
  `content_scripts.matches`; `optional_host_permissions` don't do that.

## Key decisions
- **Service registry in `@rotho/shared`:** ids `youtubeTv`, `peacock`, `paramountPlus`, each with
  display name, home URL, URL matcher, title source (`tab` or `content`) per URL pattern, title
  cleanup, and badge monogram and color. Extension and plugin both read it.
- **Opt-in:** extension options page with a toggle per service. YouTube TV is always on. Peacock
  defaults on (no permission needed). Paramount+ defaults off; turning it on calls
  `chrome.permissions.request` for `https://www.paramountplus.com/*` (an
  `optional_host_permissions` entry) and registers its content script with
  `chrome.scripting.registerContentScripts`. Revoking access in Chrome turns it off.
- **Turning a service off** frees its tabs' slots and unmutes them, as navigating away from
  YouTube TV does today.
- **Protocol stays at version 1.** New optional fields and a new feature: `Game.service` (missing
  means `youtubeTv`), `StateMessage.services` (enabled services; missing means only `youtubeTv`),
  feature `openService` covering new messages `openService { service, target }` and `openOptions`.
  The plugin keeps sending `openYouTubeTv` for YouTube TV so older extensions still work.
- **Paramount+ live title** is sent as `<program> (<channel>)`, e.g. "Bologna vs. Inter (Serie A)":
  the channel gives the title parser a league hint, and non-matchup programs still show the
  program first after shortening.
- **Service badge:** a monogram disc in the bottom-left corner of every Game Slot and Focus Heard
  Game key with a game, YouTube TV included ("TV" on YouTube red, "P" on Peacock black, "P+" on
  Paramount blue; exact colors chosen in Phase 4). No setting to hide it. It sits on the dark disc
  style used on team-color keys, so it works on team colors and on #14 artwork.
- **Open key:** per-key **Service** setting (YouTube TV default, keeps existing keys unchanged).
  Shows the service name. If the service is off in the extension, it shows the monogram dimmed
  with "Turn on", and pressing sends `openOptions`. With an extension lacking `openService`, a
  non-YouTube TV key shows "Update extension". The action's display name becomes "Open Service";
  its UUID stays `com.rotho.yttv-multiview.open`.
- **Naming:** keep "Rotho YTTV Multiview". Only wording that says the extension works on YouTube
  TV alone changes (descriptions, tooltips, README, PRIVACY, store listing).

## Phase 1: Shared service registry and protocol
Status: Complete

- [x] Add `packages/shared/src/services.ts`: `SERVICES` registry, `ServiceId` type,
      `serviceForUrl(url): { service, titleSource } | undefined` (https only, exact host, path
      prefixes from the findings table), `cleanTabTitle(service, title)` (strip ` - Peacock`;
      strip leading `Watch ` and trailing ` - Paramount+`), and badge monogram/colors.
- [x] Export it from `packages/shared/src/index.ts`.
- [x] `protocol.ts`: optional `Game.service`, optional `StateMessage.services`; parse and validate
      both. Unknown service ids from a newer extension are dropped from `services`, and a game
      with an unknown service is dropped from `games`, so the plugin never shows a slot it can't
      draw.
- [x] `protocol.ts`: `OpenServiceMessage { type: "openService"; service; target }` and
      `OpenOptionsMessage { type: "openOptions" }`, added to `PluginMessage` and
      `parsePluginMessage`.
- [x] `constants.ts`: `FEATURES.openService`.
- [x] Tests: `services.test.ts` (URL matching incl. non-player pages, http, look-alike hosts,
      title cleanup); `protocol.test.ts` cases for the new fields and messages, and that old
      messages without them still parse.

### Verification Plan
- `pnpm --filter @rotho/shared test` passes.
- `pnpm typecheck` passes.

Result (2026-10-17): shared tests pass (5 files, 688 tests); `pnpm typecheck`, `pnpm lint` and
Prettier on `packages/shared/src` pass; plugin (119) and extension (53) tests still pass.

### Phase Summary
- **`services.ts`** exports `SERVICE_IDS` (display order `youtubeTv`, `peacock`, `paramountPlus`),
  `ServiceId`, `TitleSource` (`"tab" | "content"`), `PlayerPage`, `ServiceInfo`, `SERVICES`,
  `isServiceId`, `serviceForUrl` and `cleanTabTitle`. Each `ServiceInfo` has `name`, `homeUrl`
  (`https://<host>`, no trailing slash, matching the old `YOUTUBE_TV_URL`), exact `host`,
  `players` (path prefix + title source) and `badge { monogram, color, text }`.
- **YouTube TV** keeps today's rule: every https `tv.youtube.com` page is tracked
  (`pathPrefix: "/"`), title source `content`. So Phase 2 can swap `isYouTubeTvUrl(url)` for
  `serviceForUrl(url)?.service === "youtubeTv"` with no behavior change.
- **Paramount+** `/movies/video/` is in the registry but still unverified (Phase 5 live check).
  Paramount+ `/live-tv/stream/` is `content`; `/shows/video/` and `/movies/video/` are `tab`.
- **Badge colors are placeholders** (`#ff0033` red "TV", `#000000` black "P", `#0064ff` blue "P+",
  white text); Phase 4 picks the final colors and may change them in `SERVICES`.
- **`cleanTabTitle`** trims, then strips ` - Peacock` (Peacock) or a leading `Watch ` and trailing
  ` - Paramount+` (Paramount+). YouTube TV titles are only trimmed.
- **Protocol:** `Game.service` and `StateMessage.services` are optional and only set on the parsed
  message when sent. A non-string `service` or a non-string-array `services` rejects the message;
  unknown ids are filtered as planned. `openService` needs a known service and a valid target;
  `openOptions` has no fields. `FEATURES.openService` covers both messages.
- **Typing note:** `@rotho/shared` has `types: []` and lib ES2023 only, so `services.ts` declares
  a minimal `URL` constructor locally instead of adding DOM or Node types to the package.

## Phase 2: Extension tracks Peacock and Paramount+ tabs
Status: Complete

- [x] `engine.ts`: replace `isYouTubeTvUrl` with `serviceForUrl` limited to enabled services;
      `TrackedTab.service`; `EngineState.enabledServices` (default `["youtubeTv", "peacock"]`;
      saved state without it gets the default); `toStateMessage` sends `service` per game and
      `services`.
- [x] `engine.ts`: new event `servicesChanged { enabled, tabs }` that untracks tabs of disabled
      services with unmute effects and tracks open tabs of newly enabled services (muted).
      A tab whose URL moves to another service's player keeps its slot and updates `service`.
- [x] `background.ts`: also dispatch on `changeInfo.title` for tabs whose `titleSource` is `tab`,
      passing `cleanTabTitle(...)`; keep ignoring tab titles for YouTube TV and Paramount+ live.
- [x] `background.ts`: load enabled services from `chrome.storage.local` (key `services`) at
      startup before the sync; dispatch `servicesChanged` on `chrome.storage.onChanged`.
- [x] `background.ts`: handle `openService` (open the service's home URL via `windows.ts`,
      generalized from `openYouTubeTv` to take a URL) and `openOptions`
      (`chrome.runtime.openOptionsPage()`); add `FEATURES.openService` to `hello`.
- [x] Tests in `engine.test.ts` and `windows.test.ts` for the above.

### Verification Plan
- `pnpm --filter @rotho/extension test` passes.
- `pnpm typecheck` and `pnpm lint` pass.

Result (2026-10-17): extension tests pass (6 files, 69 tests); `pnpm test` (shared 688, plugin
119, extension 69), `pnpm typecheck`, `pnpm lint`, Prettier on the extension, and
`pnpm --filter @rotho/extension build` pass. Not checked live in Chrome yet (Phase 5).

### Phase Summary
- **Engine (`engine.ts`):**
  - `TrackedTab.service` is set when a tab is tracked.
  - `EngineState.enabledServices` is always normalized by `enabledServicesFrom(stored)`: it
    always has `youtubeTv`, drops unknown ids, sorts in `SERVICE_IDS` order, and falls back to
    `DEFAULT_SERVICES` (`youtubeTv`, `peacock`) when the stored value is missing or not an array.
  - Matching goes through the private `trackedService(state, url)` (`serviceForUrl` limited to
    enabled services). `isYouTubeTvUrl` is gone.
  - `restoreState(saved)` upgrades `chrome.storage.session` saves from 0.4.0: tabs without
    `service` become `youtubeTv`, and a missing `enabledServices` gets the defaults.
- **`servicesChanged` carries `tabs`** (every open tab, as for `sync`), because the engine is pure
  and can't see untracked tabs. It sets `enabledServices`, then runs the same reconcile as `sync`.
  That reconcile frees and unmutes tabs of disabled services, tracks newly enabled ones in tab-id
  order, and re-applies the "only the heard tab is unmuted" rule. A heard tab whose service is
  turned off leaves everything muted.
- **Service changes on a tracked tab** (`refresh`) keep the slot, the heard state and the old
  title until a new one arrives. Moving to a disabled service's player frees the slot and
  unmutes, as leaving YouTube TV always did. `sync` also updates a tab's service if it moved
  while the worker slept.
- **Tab titles:** `tabTitleFor(url, title)` (pure, in `engine.ts`) returns the cleaned title only
  where the title source is `tab`. It skips empty titles and titles contained in the URL (Chrome
  shows the URL while loading). `background.ts` `toTabInfo` uses it, so `onCreated`, `onUpdated`,
  `sync` and `servicesChanged` all get Peacock and Paramount+ on-demand titles. `onUpdated` now
  also fires on title-only changes, but only dispatches when `tabTitleFor` gives a title.
- **`background.ts` startup:** reads `chrome.storage.session` `engine` and
  `chrome.storage.local` `services` in one queued task, then syncs. `storage.onChanged` (area
  `local`, key `services`) queries all tabs and dispatches `servicesChanged`. Phase 3's options
  page only needs to write `services` as an array of service ids.
- **Open messages:** `windows.ts` `openYouTubeTv` became `openPage(api, url, target)`, and
  `YOUTUBE_TV_URL` was removed (`SERVICES.youtubeTv.homeUrl` is the same URL). `openYouTubeTv`
  and `openService` both keep the `MAX_SLOTS` check. `openOptions` calls
  `chrome.runtime.openOptionsPage()`; until Phase 3 adds the page this rejects, and the queue
  logs the error. `hello` now lists `openService`.
- The `onInstalled` content-script injection is still YouTube TV only; Phase 3 adds Paramount+.

## Phase 3: Options page and Paramount+ content script
Status: Complete

- [x] `manifest.json`: `options_ui { page: "options.html", open_in_tab: true }` and
      `optional_host_permissions: ["https://www.paramountplus.com/*"]`. `host_permissions` and
      `content_scripts` stay YouTube TV only.
- [x] Add `src/options.html` + `src/options.ts`: a toggle per service (YouTube TV shown as always
      on). Turning Paramount+ on calls `chrome.permissions.request` from the click handler and
      saves only if granted; turning it off saves and calls `chrome.permissions.remove`. Writes
      `services` to `chrome.storage.local`. Follows the key art's dark look.
- [x] Add `src/paramount-content.ts`: on `/live-tv/stream/` pages reports
      `<program> (<channel>)` (or just the program when the channel is missing) with the same
      throttled MutationObserver and `pageTitle` message as `content.ts`; share the reporter by
      moving it to `src/report-title.ts`. Selectors and extraction in
      `src/paramount-title.ts`, unit-tested like `page-title.ts`.
- [x] `background.ts`: when Paramount+ is enabled and access is granted, register the content
      script (`registerContentScripts`, id `paramountPlus`, matches
      `https://www.paramountplus.com/live-tv/*`) and inject it into open live tabs; unregister when
      disabled. On startup reconcile registration with `chrome.permissions.contains`. On
      `chrome.permissions.onRemoved` for that origin, turn Paramount+ off.
- [x] `build.mjs`: bundle `options.ts` and `paramount-content.ts`, copy `options.html`.
- [x] `test/manifest.test.ts`: assert the new fields and that required host permissions are
      unchanged (guards against the re-approval prompt).

### Verification Plan
- `pnpm --filter @rotho/extension test` and `pnpm --filter @rotho/extension build` pass;
  `dist/` contains `options.html`, `options.js`, `paramount-content.js`.
- `pnpm typecheck` and `pnpm lint` pass.

Result (2026-10-17): extension tests pass (7 files, 77 tests); the build writes `options.html`,
`options.js` and `paramount-content.js` to `dist/`; `pnpm test`, `pnpm typecheck`, `pnpm lint`
and Prettier on the extension pass. The options page, permission prompt, script registration and
Paramount+ selectors are not checked in Chrome yet (Phase 5).

### Phase Summary
- **`src/service-settings.ts`** (new, used by the options page and the worker): `SERVICES_KEY`
  (`"services"`), `PARAMOUNT_ORIGINS`, `PARAMOUNT_LIVE_MATCHES`, `PARAMOUNT_SCRIPT_ID`,
  `loadServices()`, `saveServices()` and `setServiceEnabled(service, on)`. Saves always go through
  `enabledServicesFrom`, so the stored list always has `youtubeTv` and is in `SERVICE_IDS` order.
  The `SERVICES_KEY` constant moved here from `background.ts`.
- **Options page:** `options.html` is static (dark palette from the key art, badge discs, CSS
  switches); `options.ts` builds one row per `SERVICE_IDS` entry.
  - YouTube TV's switch is disabled and always on.
  - Peacock just saves.
  - Turning Paramount+ on calls `chrome.permissions.request` synchronously in the change
    handler. It saves only if access is granted; otherwise it shows a red note and reverts.
  - Turning Paramount+ off saves, then calls `permissions.remove`.
  - The page shows Paramount+ as on only while access is granted, and re-renders on storage and
    permission changes.
- **Content scripts:**
  - The throttled MutationObserver reporter moved to `report-title.ts`
    (`startTitleReporter(read)`), and `content.ts` is now a two-line wrapper.
  - `read` may return `null` (report nothing). That also clears the last title, so a tab that
    leaves the live player and comes back gets its title resent.
  - `paramount-title.ts` `extractParamountTitle(root, pathname)` returns null off
    `/live-tv/stream/` pages. Otherwise it returns `program (channel)`, or just the program or
    the channel, or `""`. A program equal to the channel isn't repeated.
- **Worker (`background.ts`):**
  - `checkServices` treats Paramount+ as off without host access and saves the corrected list.
  - `reconcileParamountScript` registers or unregisters the `paramountPlus` script to match.
    When it registers, it also injects the script into open `/live-tv/*` tabs. Errors are only
    logged, so tracking keeps working.
  - Both run at startup (before the sync) and on every `services` storage change (before
    `servicesChanged`).
  - When Chrome reports the Paramount+ origin removed (`permissions.onRemoved`), the worker
    saves Paramount+ as off, and the storage change handles the rest.
  - `onInstalled` is now queued after startup. It injects the YouTube TV script as before, and
    injects the Paramount+ script only if startup didn't already.
  - `pageTitle` messages are now ignored unless the sender tab's URL has title source
    `content`.
- **Phase 5 live check should cover:** the options page look and the permission prompt; that the
  registered script survives a browser restart and an extension reload (startup re-registers it
  if Chrome dropped it); the Paramount+ selectors; and SPA navigation into `/live-tv/` from
  another Paramount+ page. That last case gets no script, because only `/live-tv/*` is matched.
  Widen the matches to the whole site if that's a problem.

## Phase 4: Plugin badge and Open key service setting
Status: Complete

- [x] `store.ts`: keep `services` from state (default `["youtubeTv"]`).
- [x] `render.ts`: `serviceBadge(service)` disc in the bottom-left on Game Slot and Focus keys
      with a game (text, team-color and heard variants); move or narrow the text block so two-line
      labels don't overlap the badge; empty-title fallback label is the service name instead of
      "YouTube TV".
- [x] `slot.ts`, `focus.ts`: pass `game.service` through to the view.
- [x] `open.ts` + `ui/open.html`: **Service** select (`youtubeTv` default); key shows the service
      name; "Turn on" state when the service isn't in `services` (press sends `openOptions`);
      "Update extension" when a non-YouTube TV service is picked and `openService` is missing;
      YouTube TV keeps sending `openYouTubeTv`.
- [x] Plugin `manifest.json`: Open action name "Open Service", tooltips and plugin description
      mention Peacock and Paramount+.
- [x] Tests: `render.test.ts` cases and snapshot updates for each badge and Open key state;
      `store.test.ts` for `services`; `manifest.test.ts` if it checks names.

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes (snapshots reviewed, not blindly updated).
- `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.

Result (2026-10-17): plugin tests pass (6 files, 142 tests); `pnpm test` (shared 688, plugin 142,
extension 77), `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.
Snapshots were reviewed twice: first as a rendered PNG sheet of 16 keys (every badge layout and
Open key state), then in the `.snap` diff. Only the 7 keys that show a game changed, as intended,
and 4 new snapshots were written. The empty-slot, No Chrome, mismatch, Mute All and YouTube TV
Open key snapshots are unchanged. Not checked on a real Stream Deck yet (Phase 5).

### Phase Summary
- **Badge colors are final as set in Phase 1:** "TV" `#ff0033`, "P" `#000000`, "P+" `#0064ff`,
  white letters. Every monogram disc has a 1.5px `#6b7280` ring so Peacock's black disc shows on
  dark keys.
- **`render.ts`:**
  - Badge layout: `serviceBadge(service)` (exported) is a dark `onDisc` (r17) at (22, 122) with
    a monogram disc (r13) on top. `onDisc` gained an optional radius.
  - Which keys get it: every Game Slot and Focus key with a game, YouTube TV included (also when
    `service` is missing, i.e. from older extensions). Never on empty, No Chrome, mismatch or
    Nothing-heard keys.
  - Text layout: Game Slot text labels are centred at y=70 instead of 86. The Focus key uses
    crosshair y=28 and text max 26px centred at y=74 (was y=32, 30px, y=92).
  - Team-color layout: the bottom team abbreviation moved from x=72 to x=82, and the shared font
    is sized for 84px instead of 112px. Abbreviations of up to 4 characters still get 30px.
  - Labels: the empty-title fallback is `SERVICES[service].name`.
  - `OpenKeyView` gained `service` and `off`. The order of precedence is No Chrome → Update
    (mismatch or missing feature) → Turn on (dimmed monogram, r28) → Full → normal.
  - Normal Open key: YouTube TV keeps the old `#ef4444` play button, so its snapshot is
    unchanged. Peacock and Paramount+ use their badge color with the service name.
- **`store.ts`:** `PluginState.services` (from the state message, defaulting to `["youtubeTv"]`,
  reset on disconnect) and `Store.isEnabled(service)`.
- **`settings.ts`:** `serviceSetting(value)` (unknown or missing means `youtubeTv`), next to
  `teamColorsSetting`, so it can be tested without the SDK.
- **`open.ts`:** keeps a per-key service map, as `focus.ts` does for Team colors, and draws each
  service's image once.
  - `messageFor` decides what a press sends.
  - The needed feature is `openYouTubeTv` for YouTube TV and `openService` for the others.
  - Mismatch, missing feature, Full or a failed send → alert.
  - Service off → `openOptions`.
  - YouTube TV → `openYouTubeTv`; others → `openService`.
- **Wording:**
  - `ui/open.html` has a Service select (default `youtubeTv`) and a note about "Turn on".
  - `ui/slot.html`'s help text mentions the three services and the badge.
  - Manifest: Open action "Open Service"; Game Slot, Mute All and Open tooltips; plugin
    description.
  - `packages/plugin/package.json` description also updated. It isn't on the Phase 5 list, which
    covers the extension and root `package.json` files.
- **Tests:**
  - `render.test.ts`: new Open key cases (Peacock, Paramount+, Turn on, Update over Turn on) and
    a "service badge" block.
  - `store.test.ts`: a services block. `settings.test.ts`: `serviceSetting`.
  - `manifest.test.ts`: the Open name, tooltip and description.
  - `server.test.ts`: now expects `services: ["youtubeTv"]`.

## Phase 5: Docs and live check
Status: Complete

- [x] `README.md`: usage (services, options page, Open key Service setting, badge), key table,
      "How games get slots and sound", how it works.
- [x] `PRIVACY.md`: what is read on Peacock and Paramount+ pages and that it stays local.
- [x] `docs/chrome-web-store.md`: description, the optional `https://www.paramountplus.com/*`
      justification, options page.
- [x] Extension `manifest.json` and `package.json` descriptions; root `package.json` description.
- [x] `CHANGELOG.md`: `## [Unreleased]` section describing the feature (version set at release).
- [x] Live check with the user in Chrome (unpacked dev build): Peacock live event and clip, and
      Paramount+ live and on-demand, each take a slot, show the right title and badge, and switch
      audio; Paramount+ toggle prompts for access and works after granting; turning a service
      off unmutes its tabs; a Paramount+ `/movies/video/` URL is tracked (fix the pattern if not).

### Verification Plan
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- Live check results recorded in this phase's summary.

Result (2026-10-17): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (shared
688, plugin 142, extension 78) and `pnpm build` pass after the live-check fixes and doc additions.
Live check: after unmuting each player once, the user tested and reported "All is looking good"
(details below).

### Phase Summary

- **Docs written:**
  - README: a new "Services" subsection (options page, defaults, a table of pages that count as
    games, the badge), a "Keys" subsection with Open Service rows, "How games get slots and
    sound" rules for any service and for turning a service off, troubleshooting for missing
    titles, and "How it works" (registry, title sources, optional permission, protocol fields).
  - PRIVACY: what is read per service, the stored services list, and that turning Paramount+ off
    gives back its access.
  - Store doc: new summary and description; `tabs`, `storage` and `scripting` justifications
    updated; a new optional host permission justification; an "Options page" section.
  - CHANGELOG: an `## [Unreleased]` section.
  - Descriptions: extension manifest, extension `package.json` and root `package.json`.
- **README says to open the options page only through `chrome://extensions` → Details →
  Extension options** (or a "Turn on" key). The extension has no toolbar `action`, so it's
  unclear whether the toolbar Extensions menu offers "Options"; check during the live check and
  add that route if it does.
- **The extension manifest `description` changed**, so the Web Store summary must be pasted with
  the next upload (`docs/chrome-web-store.md` has the text).

### Live check findings (2026-10-17)

- **"Peacock and Paramount+ don't unmute":**
  - The plugin log shows the Peacock tab tracked and marked heard on its key press, and the tab
    strip showed no speaker icon at all. So the tab was un-muted but made no sound.
  - In a test tab, Peacock's `<video>` was `muted: true, volume: 0`, with an "Unmute Sound"
    button. Its localStorage keeps a per-profile `player-volume-settings`/`audioSettings`
    `muted: true`.
  - Paramount+ live's `<video>` was `muted: true`, with localStorage `spliceVolumeOn: "0"`.
  - So the players' own mute is on. The extension only controls Chrome's tab mute, which can't
    turn the player's sound on.
  - Fix: click the player's own unmute button once per service, then leave sound to the Stream
    Deck. The user confirmed sound then switches for both. No code change; documented in the
    README troubleshooting section and the CHANGELOG `[Unreleased]` intro.
  - A possible follow-up is warning on the key when a player is muted inside the page. That would
    need a content script (and host access) on Peacock too, so it was left out.
- **Paramount+ "doesn't show up":** it was off (the default). Once turned on, its tile showed.
- **Paramount+ live selector works:** the program read "WTTV - College Football" on
  `/live-tv/`. Note that `/live-tv/` itself plays a channel but isn't tracked; only
  `/live-tv/stream/…` is.
- **Fixed:** Peacock briefly reported the bare tab title "Peacock" while loading. `tabTitleFor`
  now ignores a title that is just the service's name, with a test added.
- **Still open:** the first title after tracking can be the previous page's (`2:Sports` from
  "Sports - Peacock") until the player sets its own title a second later. Left as is.

### Live check checklist (with the user, unpacked dev build)

Seen directly in the plugin log or a test tab: Peacock tracked with its title and switching
heard; Paramount+ off by default and shown once turned on; Paramount+ live selectors still match.
The user tested the rest and reported "All is looking good" without listing items one by one.

- [x] Peacock live event and Peacock clip: each takes a slot, shows the right title and the "P"
      badge, and switches audio.
- [x] Paramount+ off by default: its tabs aren't tracked; an Open Service key set to Paramount+
      shows "Turn on", and pressing it opens the options page.
- [x] Options page look; turning Paramount+ on shows Chrome's access prompt; declining keeps it
      off with the red note; allowing turns it on.
- [x] Paramount+ live: takes a slot, shows `<program> (<channel>)` (selectors still match), "P+"
      badge, switches audio. Tabs already open when it was turned on get titles without a reload.
- [x] Paramount+ on demand: `/shows/video/` and a `/movies/video/` URL are tracked with clean
      titles (fix the `/movies/video/` pattern if not).
- [x] Turning Peacock or Paramount+ off unmutes its tabs and frees their slots.
- [x] Removing Paramount+ access in Chrome's site settings turns it off in the options page.
- [x] Reloading the extension and restarting Chrome keep Paramount+ live titles working.
- [x] Moving into a live channel by clicking within Paramount+ (not loading a `/live-tv/` URL
      directly) still gets a title. If not, widen `PARAMOUNT_LIVE_MATCHES` to the whole site.
- [x] Open Service keys for Peacock and Paramount+ open the right site in a window or tab.
- [ ] Whether the toolbar Extensions menu offers "Options". Not checked; the README documents
      only the `chrome://extensions` route and the "Turn on" key, which are known to work.

## Final Recap

Peacock and Paramount+ player tabs now work alongside YouTube TV.
- **Shared** (`services.ts`): one registry of services, player URL rules, title cleanup and
  badges. Protocol v1 gains optional `Game.service`, `StateMessage.services`, and the
  `openService`/`openOptions` messages behind feature `openService`. Older peers ignore all of it.
- **Extension:**
  - The engine tracks enabled services, keeps a tab's slot when it moves between services, and
    frees and unmutes tabs of a service that's turned off.
  - Peacock and Paramount+ on-demand titles come from the tab title.
  - A new options page turns services on. Paramount+ asks for an optional host permission, so
    updating the extension doesn't make Chrome disable it.
  - A dynamically registered content script reads Paramount+ live program and channel names.
- **Plugin:**
  - A service badge on Game Slot and Focus keys, with text layouts adjusted to clear it.
  - The Open key became "Open Service", with a per-key Service setting and "Turn on" and
    "Update extension" states. Existing keys keep opening YouTube TV.
- **Docs:** README, PRIVACY, the store listing and the CHANGELOG `[0.5.0]` section.
- **Version:** bumped to 0.5.0 everywhere.
- **Live check:** the only problem was the players' own saved mute in Peacock and Paramount+.
  It's fixed by unmuting the player once, and now documented. A bare "Peacock" title flash was
  fixed.
- **Tests:** shared 688, plugin 142, extension 78, all passing.

## Deployment Plan

1. Delete this plan file in the final commit, and confirm the PR body has `Fixes #10` (run
   `/open-pr` once the branch is pushed). Squash-merge.
2. Version is already **0.5.0** (done 2026-10-17 on this branch): root, shared, extension and
   plugin `package.json`, the extension manifest and the plugin manifest (`0.5.0.0`).
   `sync-version.mjs --check` passes. `CHANGELOG.md` has `## [0.5.0] - 2026-10-17`; change the
   date if the release happens on another day. Merge to `main`.
3. Run **Actions → Release → Run workflow** on `main` with version `0.5.0`.
4. Upload `yttv-multiview-extension-<version>.zip` to the Chrome Web Store dashboard. Paste the
   updated Summary, Description, single purpose and permission justifications (including the new
   optional host permission) from `docs/chrome-web-store.md`, and consider an options-page
   screenshot. Keep visibility Unlisted and submit for review.
5. `PROTOCOL_VERSION` is unchanged, so the release needs no special ordering. Users with only one
   piece updated keep working. An Open Service key set to Peacock or Paramount+ shows "Update
   extension" until Chrome updates the extension.
