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
Status: Not started

- [ ] `packages/plugin/src/scores/tracker.ts`: `LIVE_INTERVAL_MS = 7_000`, with a one-line comment
  that ESPN's scoreboard cache refreshes about every 10 s
- [ ] `packages/plugin/test/tracker.test.ts`: rename the two tests that say "every 15 s" to "every
  7 s"; fix the timing comments in "shows the newest snapshot at least `delay` old" (`t0 + 15 s`
  → `t0 + 7 s`, `t0 + 45 s` → `t0 + 37 s`) and keep its assertions meaningful at 7 s (the
  `scoreFor(1, 15_000)` check still expects 14-14 because nothing is 15 s old yet; say so in a
  comment or change it to `7_000`)
- [ ] `README.md` (developer notes, "polls every 15 s while it's live"): change to 7 s
- [ ] `CHANGELOG.md` `[Unreleased]`: add a `### Changed` entry, e.g. "**Live scores** update
  about twice as often: the plugin checks ESPN every 7 seconds during a game instead of every 15."

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes, including all `ScoreTracker` tests
- `pnpm typecheck` and `pnpm lint` pass; `pnpm format:check` passes
- Grep `packages/plugin` and `README.md` for `15 s` / `15_000` and confirm no stale reference to
  the old live interval remains (the Score delay "15 seconds" option in `slot.html` is unrelated
  and stays)

### Phase Summary
_(write when phase completes)_

## Phase 2: Flash score alerts for about 10 s
Status: Not started

- [ ] `packages/plugin/src/score-alerts.ts`: `ROW_FRAMES = 68` (10.2 s); keep `FRAME_MS = 150` and
  `CALLOUT_MS = 10_000`; keep the "Even, so the flash ends unlit" note
- [ ] `packages/plugin/test/score-alerts.test.ts`: rename "blinks fast for about two seconds" to
  "about 10 seconds" and expect `ROW_FRAMES` 68 and `ROW_FRAMES * FRAME_MS` 10_200; in "blinks
  the row, then holds the band callout", use `ROW_FRAMES` instead of the literal `14` and derive
  the `2099` / `2100` times from `ROW_FRAMES * FRAME_MS`
- [ ] `README.md` (Game Slot score section, "flash yellow for about two seconds"): change to about
  10 seconds
- [ ] `CHANGELOG.md` `[Unreleased]` `### Changed`: add "**Score alerts** flash for about 10
  seconds instead of 2, so they're harder to miss. The points then stay in the band for 10
  seconds, as before."
- [ ] `slot.html` help text: no duration is mentioned, so no change; confirm

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes, including `alertFrame` and `nextScoreState` tests and
  the render snapshots
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- Grep the repo (excluding `node_modules`, `dist` and past CHANGELOG releases) for "two seconds"
  and `2100`; none remain for the alert
- `pnpm build` succeeds

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
