# Long Press a Game Slot Key to Focus Its Tab

Issue: #18

Holding a Game Slot key for 500 ms brings that game's tab and window to the front. A short press
still solos. This is plugin-only: the `focus` message already takes a `slot`, the extension
already handles it (`packages/extension/src/background.ts`, `focusTab` in `windows.ts`), and older
extensions are detected with the existing `FEATURES.focus` check.

## Key decisions

- **Solo on key-down, focus on hold.** Key-down solos immediately, as today, with no added delay.
  If the key is still down 500 ms later, the plugin also sends `{ type: "focus", slot }`, so a long
  press solos and focuses. Key-up before 500 ms cancels the hold. Release after focus does
  nothing.
- **Threshold:** a fixed 500 ms constant (`LONG_PRESS_MS`), not a setting.
- **Fires while held:** a timer started on key-down fires at 500 ms, without waiting for key-up.
- **No success feedback:** the window coming forward is the feedback. Failures show the alert.
- **One alert on a failed press:** if the key-down solo fails (empty slot, version mismatch, not
  connected), the existing alert shows and no hold timer starts. So a long press on an empty slot
  alerts once.
- **Hold failures alert:** at 500 ms the plugin looks the slot's game up again. It shows the alert
  if there's a mismatch, the extension lacks `FEATURES.focus` (older extension), the game has left
  the slot, or the send fails.
- **Setting:** a property-inspector select `longPress` with Focus (`"focus"`, default) / Off
  (`"off"`). Keys made before the setting existed, and any unknown value, mean Focus.
- **Testability:** the hold timer lives in an SDK-free module (`packages/plugin/src/long-press.ts`),
  like `score-alerts.ts`, and is tested with vitest fake timers.
- Out of scope: version bump / release, extension or protocol changes, changes to the Focus Heard
  Game key.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #18`.

## GitHub sync
Run these yourself with `gh`; do not wait to be asked, except where marked. The
issue is #18 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBetcE`. Board ids and tested `gh`
recipes live in `.github/gh-recipes.md`; use its ids and commands. If a command fails with an id
error, look the ids up with `gh project list`, `gh project field-list` and `gh project item-list`
(all with `--format json`).

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBetcE --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view 18 --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit 18 --body-file <file>`). Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 18 --body-file <file>` starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #18`. Merging closes it and the board moves
  it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Hold timer and setting
Status: Complete

- [x] Add `packages/plugin/src/long-press.ts` (SDK-free, header comment like `score-alerts.ts`):
  export `LONG_PRESS_MS = 500` and a `HoldTimers` class keyed by action id with
  `start(id, onHold)` (replaces any running timer for that id; the timer is `unref`'d like the
  score tick), `cancel(id)` (no-op for unknown ids) and `cancelAll()`.
- [x] Add `longPressSetting(value: unknown): LongPress` to `packages/plugin/src/settings.ts`, with
  `type LongPress = "focus" | "off"`: `"off"` → `"off"`, anything else (including `undefined`) →
  `"focus"`. Doc comment in the style of the existing setting parsers.
- [x] Add `packages/plugin/test/long-press.test.ts` (vitest fake timers): fires once after 500 ms;
  doesn't fire at 499 ms; `cancel` before 500 ms prevents it; `start` twice for one id fires only
  the second callback once; timers for two ids are independent; `cancel` of an unknown id doesn't
  throw; `cancelAll` stops every timer.
- [x] Add a `longPressSetting` `it.each` block to `packages/plugin/test/settings.test.ts`:
  `undefined`, `"focus"`, `"off"`, `"other"`, `false`, `null`.

### Verification Plan
- `pnpm --filter @rotho/plugin test`: all tests pass, including the new ones.
- `pnpm --filter @rotho/plugin typecheck`: no errors.
- `pnpm lint` and `pnpm format:check`: clean.

Result (2026-10-18): 10 test files, 236 tests passed; typecheck, lint and format check clean.

### Phase Summary
Added `packages/plugin/src/long-press.ts`. It exports `LONG_PRESS_MS = 500` and `HoldTimers`, a
map of action id → timer with `start(id, onHold)`, `cancel(id)` and `cancelAll()`.
- `start` replaces a key's running timer and clears its own entry before calling `onHold`.
- Timers are `unref`'d like the score tick.
- The constructor takes an optional `ms` (defaults to `LONG_PRESS_MS`), so tests can rely on the
  default.

Added `LongPress` and `longPressSetting` to `settings.ts`: only `"off"` means off.

Tests are in `test/long-press.test.ts` (6 cases, vitest fake timers) and a `longPressSetting`
block in `test/settings.test.ts`.

Nothing is wired into `SlotAction` yet; that's Phase 2. There's no user-visible change, so no
CHANGELOG entry yet.

## Phase 2: Wire long press into Game Slot keys, settings UI and docs
Status: Complete

- [x] `packages/plugin/src/actions/slot.ts`: add `longPress?: string` to `SlotSettings` and
  `longPress: LongPress` to `KeyOptions` (filled in `keyOptions` via `longPressSetting`).
- [x] In `SlotAction`, hold a `HoldTimers` instance. In `onKeyDown`: on a failed solo, show the
  alert and return (no timer). On success, when the key's `longPress` is `"focus"`, start the hold
  timer for the slot captured at key-down.
- [x] Add `onKeyUp` (import `KeyUpEvent`), which cancels the key's hold timer. Cancel it in
  `onWillDisappear` too.
- [x] Add a private `focusSlot(action, slot)` called when the timer fires. It looks up
  `this.store.gameInSlot(slot)` again and shows the alert when there's a `mismatch`,
  `!this.store.has(FEATURES.focus)`, no game, or `!this.server.send({ type: "focus", slot })`.
  Import `FEATURES` from `@rotho/shared`.
- [x] Update the class doc comment ("pressing it plays only that game; holding it also brings its
  tab forward").
- [x] `packages/plugin/com.rotho.yttv-multiview.sdPlugin/ui/slot.html`: add a "Long press" select
  (`setting="longPress"`, `default="focus"`, options Focus / Off) after Slot. Add a help sentence:
  holding the key for half a second also brings the game's tab and window to the front.
- [x] `README.md`: in the key table, note that holding a Game Slot key brings that game's window
  and tab to the front. Mention the Long press setting where Game Slot settings are described.
- [x] `CHANGELOG.md` `[Unreleased]` → `### Added`: a **Long press** entry. Holding a Game Slot key
  for half a second brings that game's tab and window to the front (restoring a minimized window)
  and still solos it. It can be turned off per key, and it needs extension 0.3.0 or newer (older
  ones show the alert).

### Verification Plan
- `pnpm test`: all packages pass.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`: clean.
- `pnpm build` then `pnpm --filter @rotho/plugin validate`: the plugin builds and the manifest
  validates.
- `pnpm --filter @rotho/plugin test -- manifest`: the manifest/property-inspector tests still pass.
- Hand-check for the user (needs a Stream Deck and Chrome): a short press solos. Holding for about
  1 s solos and then brings the tab forward, restoring a minimized window. Holding an empty slot
  alerts once. With Long press Off, holding only solos.

Result (2026-10-18):
- `pnpm test`: shared 688, extension 78 and plugin 236 tests passed. The plugin's manifest tests
  are included.
- Typecheck, lint and format check: clean.
- `pnpm build`: succeeded.
- `streamdeck validate`: successful.
- Hand-check: not run yet; it needs the user's hardware.

### Phase Summary
`SlotAction` (`packages/plugin/src/actions/slot.ts`) now owns a `HoldTimers`.
- `onKeyDown` returns right after the alert when the solo fails, so no timer starts. Otherwise,
  unless the key's `longPress` is `"off"`, it starts a hold timer for `game.slot`.
- `onKeyUp` and `onWillDisappear` cancel the timer.
- The timer calls the new private `focusSlot(key, slot)`. It re-reads `store.gameInSlot(slot)`
  and alerts on a mismatch, a missing `FEATURES.focus`, no game, or a failed send.
- `KeyOptions` gained `longPress`, parsed by `longPressSetting`.

The property inspector (`ui/slot.html`) has a "Long press" select (Focus / Off, default Focus)
after Slot, plus a help paragraph.

Docs:
- The README's three populated Game Slot rows say "hold to also bring it to the front".
- A README paragraph after the key table covers long press, the setting, and extensions older
  than 0.3.0.
- CHANGELOG `[Unreleased]` has an Added entry.

## Final Recap
Game Slot keys now support a long press. Holding a key for 500 ms solos the game (on key-down, as
before) and then sends the existing `focus` message for that slot. The extension's `focusTab`
activates the tab and focuses its window, restoring it if it's minimized.
- This is plugin only, with no protocol or extension changes.
- Older extensions without `FEATURES.focus` get the alert.
- A per-key "Long press" setting (Focus / Off) turns it off.
- The hold logic lives in the SDK-free `packages/plugin/src/long-press.ts` with unit tests.
- README and CHANGELOG are updated.

## Deployment Plan
1. Run the hand-check from Phase 2's Verification Plan with `pnpm --filter @rotho/plugin watch`
   (or `pnpm build` and restart the plugin) on a real Stream Deck.
2. The user deletes this plan in the final commit, pushes `18-long-press-focus`, then runs
   `/open-pr`. The PR body carries `Fixes #18`.
3. After the squash-merge, release the plugin as usual: bump with `pnpm version:sync`, move the
   CHANGELOG `[Unreleased]` entry under the new version, and run `pnpm package`. The extension
   needs no update.
