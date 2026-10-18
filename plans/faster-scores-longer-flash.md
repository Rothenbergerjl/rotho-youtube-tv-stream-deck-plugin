# Faster Live Scores and Longer Score-Alert Flash

Issue: #29

Check ESPN every 7 s instead of 15 s while a game is live, and make the score-alert row flash last
about 10 s instead of about 2 s. Plugin only; the extension does not change.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #29`.

## Key decisions

- **7 s fixed interval.** ESPN's scoreboard CDN returns `Cache-Control: max-age` counting down
  from 10 to 1 (sampled once a second on 2026-10-18, NFL, NBA, NHL, MLB, EPL, college football),
  so ESPN's data refreshes about every 10 s. A 7 s check sees a new response at most 7 s after it
  appears (about 3.5 s on average), compared with up to 15 s today. Timing checks to `max-age`
  was considered and rejected as more code for little gain.
- **68 frames × 150 ms = 10.2 s flash.** Keeps the blink speed from 0.7.0 and an even frame
  count so the flash ends unlit.
- **Band callout unchanged at 10 s** after the flash, so a whole alert is about 20 s. A new score
  during an alert restarts it (existing behavior).
- Idle interval (5 min), stale cutoff (2 min) and max Score delay (90 s) are unchanged.

## GitHub sync
Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #29 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBoECY` (added by hand; the board's
auto-add didn't pick it up). Board ids and tested recipes live
in `.github/gh-recipes.md`: project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`, In Progress option `05c39441`.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBoECY --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view 29 --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit 29 --body-file <file>`), then read it back. Also tick it in this
  plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then post a `Deviation: <what>, because <why>`
  comment with `gh issue comment 29 --body-file <file>`.
- **Last phase done:** confirm the PR body has `Fixes #29`. Merging closes it and the board
  moves it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Poll live games every 7 s
Status: Complete

- [x] `packages/plugin/src/scores/tracker.ts`: `LIVE_INTERVAL_MS = 7_000`, with a one-line comment
  that ESPN's scoreboard cache refreshes about every 10 s
- [x] `packages/plugin/test/tracker.test.ts`: rename the two tests that say "every 15 s" to "every
  7 s"; fix the timing comments in "shows the newest snapshot at least `delay` old" (`t0 + 15 s`
  → `t0 + 7 s`, `t0 + 45 s` → `t0 + 37 s`) and keep its assertions meaningful at 7 s (the
  `scoreFor(1, 15_000)` check still expects 14-14 because nothing is 15 s old yet; say so in a
  comment or change it to `7_000`)
- [x] `README.md` (developer notes, "polls every 15 s while it's live"): change to 7 s
- [x] `CHANGELOG.md` `[Unreleased]`: add a `### Changed` entry, e.g. "**Live scores** update
  about twice as often: the plugin checks ESPN every 7 seconds during a game instead of every 15."

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes, including all `ScoreTracker` tests
- `pnpm typecheck` and `pnpm lint` pass; `pnpm format:check` passes
- Grep `packages/plugin` and `README.md` for `15 s` / `15_000` and confirm no stale reference to
  the old live interval remains (the Score delay "15 seconds" option in `slot.html` is unrelated
  and stays)

### Phase Summary
`LIVE_INTERVAL_MS` is now 7 s with a comment on ESPN's ~10 s cache. In the tracker tests, the two
"every 15 s" names now say 7 s; in the delay test the `scoreFor(1, 15_000)` check became
`scoreFor(1, 7_000)` (the t0 snapshot is exactly one interval old) and the comments read t0 + 7 s
and t0 + 37 s. The other interval tests use the constant and needed no change. README developer
note and a new CHANGELOG `[Unreleased]` `### Changed` entry updated.
Verification: plugin tests 236/236 pass; typecheck, lint and format check pass. The only `15_000`
left in the plugin is `server.ts:154`, an unrelated idle-timeout cap.

## Phase 2: Flash score alerts for about 10 s
Status: Complete

- [x] `packages/plugin/src/score-alerts.ts`: `ROW_FRAMES = 68` (10.2 s); keep `FRAME_MS = 150` and
  `CALLOUT_MS = 10_000`; keep the "Even, so the flash ends unlit" note
- [x] `packages/plugin/test/score-alerts.test.ts`: rename "blinks fast for about two seconds" to
  "about 10 seconds" and expect `ROW_FRAMES` 68 and `ROW_FRAMES * FRAME_MS` 10_200; in "blinks
  the row, then holds the band callout", use `ROW_FRAMES` instead of the literal `14` and derive
  the `2099` / `2100` times from `ROW_FRAMES * FRAME_MS`
- [x] `README.md` (Game Slot score section, "flash yellow for about two seconds"): change to about
  10 seconds
- [x] `CHANGELOG.md` `[Unreleased]` `### Changed`: add "**Score alerts** flash for about 10
  seconds instead of 2, so they're harder to miss. The points then stay in the band for 10
  seconds, as before."
- [x] `slot.html` help text: no duration is mentioned, so no change; confirm

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes, including `alertFrame` and `nextScoreState` tests and
  the render snapshots
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- Grep the repo (excluding `node_modules`, `dist` and past CHANGELOG releases) for "two seconds"
  and `2100`; none remain for the alert
- `pnpm build` succeeds

### Phase Summary
`ROW_FRAMES` is now 68 (10.2 s at 150 ms a frame); `FRAME_MS` and `CALLOUT_MS` are unchanged.
The constants test now pins 68 frames and 10 200 ms; the frame-by-frame test derives its frame
count and the row/band boundary from `ROW_FRAMES * FRAME_MS` instead of literals. `slot.ts`
already ticks at `FRAME_MS` while any alert is running, so no change was needed there; it now
does so for about 20 s per alert. README Game Slot section and a second CHANGELOG `[Unreleased]`
`### Changed` entry updated; `slot.html` doesn't mention the duration.
Verification: plugin tests 236/236 pass; typecheck, lint, format check and `pnpm build` pass.
"two seconds" remains only in the released 0.7.0 CHANGELOG entry; no `2099`/`2100` remain.

## Final Recap
Issue #29, plugin only, in two commits. Live games are checked every 7 s instead of 15 s, chosen
because ESPN's scoreboard cache refreshes about every 10 s (pre-kickoff and unmatched games stay
at 5 min). The score-alert row flash runs 68 frames (about 10 s) instead of 14 (about 2 s), at
the same blink speed and still ending unlit, followed by the unchanged 10 s band callout. Tests,
README and CHANGELOG `[Unreleased]` are updated. Not checked: ESPN's `max-age` during a live game
(only sampled with no games live); a 7 s check is fine either way.

## Deployment Plan
1. Open the PR with `/open-pr`; its body carries `Fixes #29`. Squash-merge it.
2. In the final commit, delete this plan file.
3. Optional manual check before release: load the built plugin, watch a live game on a Game Slot
   key with Show score on, and confirm scores update within a few seconds of ESPN and the flash
   lasts about 10 s.
4. Release as usual: bump the version in `package.json`, run `pnpm version:sync`, move the
   CHANGELOG `[Unreleased]` entries into a new version section, merge, then run the Release
   workflow from the Actions tab on `main` with that version. Only the plugin changed, so users
   need to install the new `.streamDeckPlugin`; the extension needs no update.
