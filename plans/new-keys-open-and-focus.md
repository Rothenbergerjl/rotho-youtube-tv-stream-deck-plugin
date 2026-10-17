# New Keys: Open YouTube TV and Focus Heard Game

Issue: #8

Add two Stream Deck actions: **Open YouTube TV**, which opens tv.youtube.com in a new Chrome
window or tab (a key setting), and **Focus Heard Game**, which brings the heard game's window and
tab to the front. Rolled out with feature flags in `hello`, so older extensions keep working with
the existing keys. Ships as release 0.3.0.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #8`.

## GitHub sync
Run these yourself with `gh` (from PowerShell); do not wait to be asked, except where marked.
The issue is #8 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVndk`. Board ids and tested
recipes live in `.github/gh-recipes.md`. If a command fails with an id error, refresh the ids
with `gh project field-list 3 --owner Rothenbergerjl --format json` and
`gh project item-list 3 --owner Rothenbergerjl --format json`.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBVndk --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view 8 --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit 8 --body-file <file>`). Also tick it in this plan. Read it back.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 8 --body-file <file>` starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has a `Fixes #8` line. Merging closes it and the
  board moves it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Key decisions

- **No protocol bump.** `PROTOCOL_VERSION` stays `1`. `hello` gains an optional
  `features: string[]`; a missing list means "no optional features". The plugin enables a new
  key only when the connected extension lists its feature. With an old extension, Game Slot and
  Mute All keep working and only the new keys show "Update extension". `PROTOCOL_VERSION` stays
  reserved for breaking changes; new optional messages add a feature name instead.
- **Messages (plugin → extension):** `{ type: "openYouTubeTv", target: "window" | "tab" }` and
  `{ type: "focus", slot }`. Focus takes a slot, like `solo`, so a later long-press on Game Slot
  could reuse it. The plugin sends the heard game's slot.
- **Feature names:** `FEATURES = { openYouTubeTv: "openYouTubeTv", focus: "focus" }` in
  `packages/shared/src/constants.ts`.
- **Open YouTube TV:**
  - Key setting `target`, Window (default) or Tab, in a new property inspector `ui/open.html`.
  - Window: `chrome.windows.create({ url: "https://tv.youtube.com", focused: true })`.
  - Tab: `chrome.windows.getLastFocused({ windowTypes: ["normal"] })`, then a new active tab in
    that window, which also gets focus. With no normal window, fall back to a new window.
  - New tabs start muted through the existing `tabs.onCreated` → engine path; no engine change.
  - When 15 games are already tracked, the plugin refuses with an alert (it knows the count), and
    the extension also does nothing.
  - When the extension isn't connected: "No Chrome" face and an alert on press. No
    default-browser fallback.
- **Focus Heard Game:**
  - Face: a focus glyph plus the heard matchup (`formatMatchup`), a dim "Nothing heard" when
    nothing is heard, and the same No Chrome / mismatch / update-badge states as other keys.
  - Press shows the alert when nothing is heard, when disconnected, on a mismatch, or when the
    feature is missing.
  - The extension makes the tab active (`chrome.tabs.update(tabId, { active: true })`) and
    focuses its window (`chrome.windows.update(windowId, { focused: true })`). If the window is
    minimized it also sets `state: "normal"`; maximized and fullscreen windows stay as they are.
- **No new extension permissions.** `chrome.windows` needs none, and `tabs` is already granted.
- **Out of scope:** long-press on Game Slot keys, a default-browser fallback, and changing what
  happens to manually opened tabs when all slots are full.
- **Known risk:** Windows' foreground lock may stop Chrome taking focus when Stream Deck triggers
  it, and Windows may only flash the taskbar button. Check this by hand in Phase 5. If it happens,
  record it and ask before trying workarounds (e.g. `drawAttention`, minimize-then-restore).

## Phase 1: Protocol and feature flags
Status: Complete

- [x] `packages/shared/src/constants.ts`: add `ACTION_UUIDS.open` (`${PLUGIN_UUID}.open`) and
      `ACTION_UUIDS.focus` (`${PLUGIN_UUID}.focus`); add `FEATURES` and a `Feature` type; update
      the `PROTOCOL_VERSION` doc comment to say optional additions use `FEATURES` instead.
- [x] `packages/shared/src/protocol.ts`: add `features?: Feature[]` to `HelloMessage`; add
      `OpenYouTubeTvMessage` (`target: OpenTarget`, `type OpenTarget = "window" | "tab"`) and
      `FocusMessage` (`slot`) to `PluginMessage`.
- [x] `parseExtensionMessage`: accept `hello` with or without `features`. Reject a non-array or
      an array with non-strings. Keep only known feature names and drop unknown ones, so newer
      extensions still parse.
- [x] `parsePluginMessage`: parse `openYouTubeTv` (reject a bad `target`) and `focus` (reject a
      bad slot).
- [x] `packages/shared/src/protocol.test.ts`: cases for all of the above, including an old
      `hello` without `features`.
- [x] `packages/extension/src/background.ts`: send `features: [FEATURES.openYouTubeTv,
      FEATURES.focus]` in `hello`. (The handlers come in Phase 2. Until then the extension
      ignores the two messages, which no key sends yet.)
- [x] `packages/plugin/src/store.ts`: add `features: Feature[]` to `PluginState` (empty in
      `disconnected`, kept across `applyState` and `setProtocol`). Add `setFeatures` and a
      `has(feature)` helper. `packages/plugin/src/plugin.ts`: call it from the `hello` handler
      and log the features.
- [x] `packages/plugin/test/store.test.ts`: features are set from hello, survive `applyState`,
      and clear on disconnect.
- [x] `packages/plugin/test/fake-extension.ts`: send all features by default; add a `features`
      option and a `--no-features` script flag to imitate an old extension.

### Verification Plan
- `pnpm test`: all suites pass, including the new protocol and store cases.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check`: no errors.

### Phase Summary
Done on 2026-10-17. Verification passed: `pnpm test` (shared 46, plugin 74, extension 44
tests), `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all clean.

- `FEATURES`, `Feature`, `ACTION_UUIDS.open` and `ACTION_UUIDS.focus` are in
  `packages/shared/src/constants.ts`. `index.test.ts` also checks the new UUIDs.
- `protocol.ts` has `OpenTarget`, `OpenYouTubeTvMessage` and `FocusMessage`, and
  `HelloMessage.features?`. The hello parser rejects a malformed `features` and filters out unknown
  names. If `features` is missing, the parsed hello leaves it off (it isn't set to `[]`).
- `background.ts` sends both features in `hello`. Its `onMessage` is now a `switch`: the
  `openYouTubeTv` and `focus` cases are empty placeholders, and Phase 2 fills them in. The switch
  was needed because `dispatch` only accepts engine events.
- `Store` has `features` (reset by `setConnected`, kept by `applyState`), `setFeatures(features =
  [])` (only notifies when the set changes, ignoring order) and `has(feature)`. `plugin.ts` logs
  the features and calls `setFeatures` from `hello`.
- `server.test.ts` compares the whole store state, so it now expects `features: []`. That test
  server doesn't wire up `hello`.
- `fake-extension.ts` sends all features by default. Pass `features: undefined` in the options,
  or the `--no-features` script flag, to leave them out.

## Phase 2: Extension open and focus handlers
Status: Complete

- [x] New `packages/extension/src/windows.ts` with `openYouTubeTv(chromeApi, target)` and
      `focusTab(chromeApi, tabId)`. They take a minimal injected `WindowsApi` interface
      (`windows.create/getLastFocused/get/update`, `tabs.create/get/update`) so tests can pass a
      fake. Behaviour as in Key decisions: tab mode falls back to a new window; focus restores
      only minimized windows. Errors (e.g. a closed tab) are caught and logged, never thrown.
- [x] `packages/extension/src/background.ts`: handle `openYouTubeTv` (skip when
      `state.tabs.length >= MAX_SLOTS`) and `focus` (look up the slot's `tabId` in `state`; skip
      when the slot is empty). Run both through `enqueue` so they see the loaded state.
- [x] `packages/extension/test/windows.test.ts`: window target creates a focused window; tab
      target uses the last-focused window and focuses it; tab target with no window falls back
      to a new window; focus activates the tab and focuses its window; a minimized window gets
      `state: "normal"`; a maximized window keeps its state; a missing tab doesn't throw.
- [x] `packages/extension/test/manifest.test.ts` still asserts the same permissions (no
      `windows` permission needed). Leave it unchanged.

### Verification Plan
- `pnpm --filter @rotho/extension test`: the new `windows.test.ts` passes.
- `pnpm build`: the extension bundles; `packages/extension/dist/background.js` exists.
- `pnpm typecheck` and `pnpm lint`: no errors.

### Phase Summary
Done on 2026-10-17. Verification passed: `pnpm test` (extension now 53 tests, including 9 in
`windows.test.ts`), `pnpm build` (`dist/background.js` exists), `pnpm typecheck`, `pnpm lint`
and `pnpm format:check` all clean. The manifest and its permissions are unchanged.

- `packages/extension/src/windows.ts` exports `YOUTUBE_TV_URL`, `WindowsApi`, `openYouTubeTv`
  and `focusTab`. Every Chrome error is caught and logged with `console.warn`.
- `background.ts` passes the real `chrome` object; it type-checks against `WindowsApi`.
  `getLastFocused` uses `chrome.windows.QueryOptions` for its parameter, because the
  `@types/chrome` enums aren't assignable from plain strings. The call writes
  `"normal" as chrome.windows.WindowType`, so tests don't need a `chrome` global.
- Tab mode: if `getLastFocused` rejects or returns no id, it falls back to a new window. Both the
  tab path and focus go through `focusWindow`, which sets `state: "normal"` only for a minimized
  window. So a tab opened in a minimized last-focused window also restores that window.
- `background.ts` handles both messages through `enqueue`. `openYouTubeTv` is skipped when
  `state.tabs.length >= MAX_SLOTS`, and `focus` is skipped when the slot is empty.

## Phase 3: Open YouTube TV key
Status: Complete

- [x] `packages/plugin/src/render.ts`: add an `OpenKeyView` (`connected`, `mismatch`,
      `featureMissing`, `full`, `updateAvailable`) and `openKeySvg`. Faces:
      - "No Chrome": dimmed.
      - Mismatch, or a missing feature: amber warning with "Update extension", reusing the
        mismatch layout.
      - Normal: a red play-button glyph with "YouTube TV" and a small plus.
      - All slots full: dimmed glyph with "Full".
- [x] New `packages/plugin/src/actions/open.ts`: `OpenAction` (UUID `ACTION_UUIDS.open`) with
      settings `{ target?: "window" | "tab" }`, default `"window"`. It re-renders on store
      changes. On key down it alerts when disconnected, on a mismatch, when the feature is
      missing, when `games.length >= MAX_SLOTS`, or when `server.send` fails; otherwise it sends
      `openYouTubeTv`.
- [x] Register `OpenAction` in `packages/plugin/src/plugin.ts`.
- [x] `packages/plugin/com.rotho.yttv-multiview.sdPlugin/manifest.json`: add an "Open YouTube TV"
      action (UUID `com.rotho.yttv-multiview.open`, Icon `imgs/actions/open/icon`, Tooltip,
      `PropertyInspectorPath: "ui/open.html"`, Keypad, state image `imgs/actions/open/key`,
      `ShowTitle: false`).
- [x] Add `imgs/actions/open/icon.svg` (40×40, white glyph) and `imgs/actions/open/key.svg`
      (144×144), styled like the existing muteall SVGs.
- [x] New `ui/open.html`: an sdpi-select `target` (Window / Tab, default `window`) and a short
      note that new games start muted.
- [x] `packages/plugin/test/render.test.ts`: tests and snapshots for each open-key face.
- [x] `packages/plugin/test/manifest.test.ts`: the expected action UUID list includes
      `ACTION_UUIDS.open`.

### Verification Plan
- `pnpm --filter @rotho/plugin test`: render and manifest tests pass. Check that the new
  snapshots are only additions (`git diff --stat` shows no changed existing snapshot lines).
- `pnpm --filter @rotho/plugin validate`: the Stream Deck manifest validates.
- `pnpm build`, `pnpm typecheck` and `pnpm lint`: no errors.

### Phase Summary
Done on 2026-10-17. Verification passed:
- `pnpm --filter @rotho/plugin test`: 81 tests. 4 snapshots were written, and the snapshot diff
  is 8 lines added and none changed.
- `validate`: "Validation successful".
- `pnpm build`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check`: all clean.

The key faces haven't been seen on a real Stream Deck yet; that happens in Phase 5.

- `render.ts` adds `colors.play` (`#ef4444`), `OpenKeyView` and `openKeySvg`, plus a `play()`
  helper (a rounded rect with a triangle and an optional white plus badge). Phase 4 can reuse
  `play()` or follow the same pattern for its glyph.
- Faces are checked in this order: No Chrome → Update (`mismatch`, or `featureMissing` →
  "extension") → Full → normal.
- `OpenAction` (`src/actions/open.ts`) reads `settings.target` and treats anything but `"tab"` as
  `"window"`. It doesn't write default settings. It re-renders every key on each store change, the
  same way `MuteAllAction` does.
- Manifest action order: slot, muteall, open. `ui/open.html` uses
  `<sdpi-select setting="target" default="window">`.

## Phase 4: Focus Heard Game key
Status: Complete

- [x] `packages/plugin/src/render.ts`: add a `FocusKeyView` (`connected`, `mismatch`,
      `featureMissing`, `title?` of the heard game, `updateAvailable`) and `focusKeySvg`. Faces:
      - "No Chrome": dimmed.
      - Mismatch, or a missing feature: warning with "Update extension".
      - Nothing heard: dim "Nothing heard".
      - Heard: a focus/target glyph above the wrapped matchup, with
        `formatMatchup(title) || "YouTube TV"`.
- [x] New `packages/plugin/src/actions/focus.ts`: `FocusAction` (UUID `ACTION_UUIDS.focus`), no
      settings. It re-renders on store changes. On key down it alerts when disconnected, on a
      mismatch, when the feature is missing, when no game is heard, or when `server.send` fails;
      otherwise it sends `{ type: "focus", slot }` for the heard game.
- [x] Register `FocusAction` in `packages/plugin/src/plugin.ts`.
- [x] Manifest: add a "Focus Heard Game" action (UUID `com.rotho.yttv-multiview.focus`, Icon
      `imgs/actions/focus/icon`, Tooltip, Keypad, state image `imgs/actions/focus/key`,
      `ShowTitle: false`). No property inspector.
- [x] Add `imgs/actions/focus/icon.svg` and `imgs/actions/focus/key.svg`.
- [x] `packages/plugin/test/render.test.ts`: tests and snapshots for each focus-key face,
      including a long non-matchup title that wraps.
- [x] `packages/plugin/test/manifest.test.ts`: the expected UUID list includes
      `ACTION_UUIDS.focus`, in manifest order (slot, muteAll, open, focus).

### Verification Plan
- `pnpm --filter @rotho/plugin test`: passes; the new snapshots are additions only.
- `pnpm --filter @rotho/plugin validate`: passes.
- `pnpm build`, `pnpm typecheck` and `pnpm lint`: no errors.

### Phase Summary
Done on 2026-10-17. Verification passed:
- `pnpm --filter @rotho/plugin test`: 90 tests. 5 snapshots were written, and the snapshot diff
  is 10 lines added and none changed.
- `validate`: "Validation successful".
- `pnpm build`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check`: all clean.

The key faces haven't been seen on a real Stream Deck yet; that happens in Phase 5.

- `render.ts` adds `FocusKeyView`, `focusKeySvg` and a `target()` crosshair glyph helper. Faces
  are checked in this order: No Chrome → Update (`mismatch`, or `featureMissing` → "extension")
  → "Nothing heard" (no `title`) → heard. The heard face is a green crosshair at the top with the
  wrapped `formatMatchup(title) || "YouTube TV"` underneath (max font 30, centred at y 92).
- `FocusAction` (`src/actions/focus.ts`) finds the heard game with `games.find((g) => g.heard)`
  and sends `{ type: "focus", slot }`. It has no settings and no property inspector.
- Manifest action order: slot, muteall, open, focus. `manifest.test.ts` asserts that order.

- [ ] `README.md` Usage:
      - Steps: mention the optional Open YouTube TV and Focus Heard Game keys.
      - Table: rows for Open YouTube TV ("YouTube TV" / "Full" / "No Chrome"; press opens a
        window or tab, set in the key's settings) and Focus Heard Game (heard matchup /
        "Nothing heard"; press brings that game's window and tab to the front).
      - The "Any key" warning row says it also covers new keys with an old extension.
- [ ] `README.md` How it works diagram: list the new keys, and focus/open on the extension side.
- [ ] `docs/chrome-web-store.md`: add the open/focus behaviour to the description. Permissions
      are unchanged. Note it must be pasted into the store listing at release.
- [ ] Set the root `package.json` version to `0.3.0` and run `pnpm version:sync`.
- [ ] `CHANGELOG.md`: add a `## [0.3.0] - <release date>` section. **Added:** the two keys and
      the Window/Tab setting. **Changed:** an older extension no longer blocks all keys when only
      new features are missing.
- [ ] Manual check with a dev build (the user runs it; the agent writes down what they report):
      1. Open YouTube TV, Window: a new window opens.
      2. Open YouTube TV, Tab: a tab opens in the last-focused window.
      3. The new game starts muted and takes a slot.
      4. Focus brings a background, minimized or maximized window forward, and the right tab is
         active.
      5. Record whether Windows lets Chrome take focus.
      6. "No Chrome" shows on both keys with Chrome closed.
      7. `fake-extension --no-features` shows "Update extension" on the new keys only.

### Verification Plan
- `pnpm version:sync --check` (via `node scripts/sync-version.mjs --check`): no mismatch.
- `pnpm package`: builds `dist/` with the `.streamDeckPlugin` and the extension zip at 0.3.0.
- `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check`: all pass.
- Manual check results are recorded in this phase's summary.

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
