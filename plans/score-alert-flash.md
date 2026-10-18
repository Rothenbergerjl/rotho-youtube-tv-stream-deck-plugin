# Make the Score-Alert Flash More Noticeable

Issue: #24

When a team scores, the Game Slot key flashes the scoring team's row (and now the band callout too)
in bright yellow instead of white, faster (150 ms × 14 frames, 2.1 s instead of 350 ms × 6),
falling back to white when yellow is too close to the team's fill. The docs are updated to match.
Out of scope: a hardware fps check, settings for flash color or speed, and changing the 10 s
callout length.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #24`.

### Decisions (agreed with the user, 2026-10-18)
- Flash color: bright yellow `#ffe600` as `colors.scoreFlash`. It's far from the green "heard"
  color and the dark key background. The ink comes from `inkFor`, so it's dark on yellow.
- Fallback: white (`colors.text`, `#f5f5f5`) when `tooClose(colors.scoreFlash, teamFill)`, e.g.
  gold teams (Steelers `#FFB612`, Packers/Lakers golds). The color is picked in `render.ts`, not in
  `score-alerts.ts`, which stays free of colors.
- Timing: `FRAME_MS = 150`, `ROW_FRAMES = 14` (even, so it ends on an "off" frame; 7 blinks,
  2.1 s). `CALLOUT_MS` stays 10 000. The tick in `actions/slot.ts` already uses `FRAME_MS`.
- The band blinks with the row: during the row-flash frames the band already shows the callout
  ("+3 BUF"), in the flash color on "on" frames and the team fill on "off" frames. It then holds in
  the team fill for `CALLOUT_MS`, as it does now. So an "off" row frame is no longer the plain key.
- No hardware fps test (the user chose to skip it).
- CHANGELOG: a new `## [Unreleased]` section with a `### Changed` entry; the released 0.6.0 text
  stays as it is.

## GitHub sync
Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #24 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBikf0`. Board ids and tested
recipes live in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`). If a command fails with an id error, refresh the ids with
`gh project field-list 3 --owner Rothenbergerjl --format json`.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBikf0 --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch it with
  `gh issue view 24 --json body -q .body`, edit that line, write it to a scratchpad file, then
  `gh issue edit 24 --body-file <file>`) and read it back. Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 24 --body-file <file>` with "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #24`. Merging closes it and the board moves
  it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Yellow, faster flash on the row and band
Status: Not started

- [ ] `packages/plugin/src/score-alerts.ts`: set `ROW_FRAMES = 14` and `FRAME_MS = 150`; update the
      file header comment ("blinks white") and the `ROW_FRAMES` doc comment ("white on even
      frames") to describe the accent flash on the row and band.
- [ ] `packages/plugin/src/render.ts`: add `scoreFlash: "#ffe600"` to `colors`, with a short doc
      comment.
- [ ] `render.ts`: add a helper (e.g. `flashFill(fill: string): string`) returning
      `colors.scoreFlash`, or `colors.text` when `tooClose(colors.scoreFlash, fill)`.
- [ ] `render.ts` `scoreboardKey`: on a row "on" frame for the scoring team, use
      `flashFill(fills[i])` instead of `colors.text` (line ~213).
- [ ] `render.ts` `infoBand`: show the callout for any alert (`mode` "row" or "band"), not only
      "band". Fill = `flashFill(fills[team])` on a row frame with `on`, else `fills[team]`. The ink
      and glyph still come from `inkFor(fill)`, and "heard" stays suppressed while the callout shows.
      Update the `ScoreAlert` doc comment in `render.ts` if it says the band only shows in band mode.
- [ ] `packages/plugin/test/score-alerts.test.ts`: the blink test expects 14 frames alternating
      `on` true/false starting with true, at `FRAME_MS` 150, and the band starting at
      `10_000 + 2100`; add explicit assertions that `ROW_FRAMES * FRAME_MS === 2100` and the alert
      ends at `2100 + CALLOUT_MS`.
- [ ] `packages/plugin/test/render.test.ts`: rewrite "blinks the scoring team's row white…":
      an "on" frame fills the row and band `#ffe600` with dark ink (`#111418`); an "off" frame keeps
      the team row fill and shows "+3 BUF" in the band on the team fill (no longer `=== key()`).
- [ ] `render.test.ts`: add a gold-team case (e.g. a Steelers matchup, or call `flashFill` directly
      with `#FFB612`) that flashes white `#f5f5f5`, and a team-colors-off case that flashes yellow.
- [ ] Update the render snapshots (`pnpm --filter ./packages/plugin exec vitest run -u`) and review
      the snapshot diff: only the alert snapshots should change.

### Verification Plan
- `pnpm test`: all tests pass, including the updated `score-alerts` and `render` tests.
- `pnpm typecheck`: no errors.
- `pnpm lint`: no errors.
- `git diff --stat packages/plugin/test/__snapshots__`: only alert-related snapshot entries changed.
- Grep `packages/plugin/src` for `colors.text` inside the flash/callout logic: none left except the
  white fallback in `flashFill`.

### Phase Summary
_(write when phase completes)_

## Phase 2: Docs and settings text
Status: Not started

- [ ] `README.md` line ~115: "its row flashes white" → it and the band flash yellow (white if the
      team's color is yellow or gold), then the band shows the points in the team color for
      10 seconds. Check line ~82's table cell still reads right.
- [ ] `CHANGELOG.md`: add `## [Unreleased]` above `## [0.6.0]` with `### Changed`: score alerts
      flash yellow, faster (about 2 seconds), on both the scoring team's row and the band, falling
      back to white for gold teams. Leave the 0.6.0 text as it is.
- [ ] `packages/plugin/com.rotho.yttv-multiview.sdPlugin/ui/slot.html` lines ~58–59: update the
      Score alerts hint to say the row and the points flash yellow, then the points stay in the
      middle of the key.
- [ ] Grep the repo (excluding `node_modules` and CHANGELOG 0.6.0) for "flashes white" / "blinks
      white": none left.

### Verification Plan
- `rg -i "flashes white|blinks white|flash white" --glob '!node_modules' --glob '!CHANGELOG.md'`:
  no matches.
- `rg -n "Unreleased" CHANGELOG.md`: one match, above `[0.6.0]`.
- `pnpm lint` and `pnpm test`: still pass.

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
