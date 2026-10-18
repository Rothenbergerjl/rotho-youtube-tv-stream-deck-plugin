# Rows-and-band layout for Focus Heard Game and score-less Game Slot keys

Issue: #25

Draw every parsed matchup, on Game Slot keys with or without a score and on the Focus Heard Game
key, with the scoreboard's two team rows and info band, from shared helpers in
`packages/plugin/src/render.ts`, and delete the old `matchupSplit` layout.

## For Future Agents

As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done, set its status
to `Complete` and write its **Phase Summary** (what was done, key decisions, anything needed to
continue with zero context); run the phase's **Verification Plan** and record the result before
moving on. After each phase, follow the **GitHub sync** section below. When all phases are done,
fill in **Final Recap** and **Deployment Plan**; the single PR carries `Fixes #25`.

## Decisions (agreed with the user)

- **Scope covers both keys.** Score-less Game Slot keys (Show score off, a league ESPN doesn't
  track, or no ESPN match) move to rows and a band too. `matchupSplit` is deleted.
- **Any parsed matchup** uses rows and a band. Team colors off, or neither team known, gives dark
  rows (`colors.background`) with light text, as `scoreboardKey` does today. `teamSplit` is no
  longer the gate for the layout; `parseTitle(title).matchup` is.
- **No score → pre-game sizing**: abbreviations up to 30px, no score text, no possession dot.
- **No separator.** `separator` is dropped from `TeamSplit`, since nothing reads it once
  `matchupSplit` is gone.
- **Update badge** is the small band dot (`bandUpdateBadge`), never the corner badge, on every
  rows-and-band key.
- **Score-less Game Slot band**: slot number, service monogram and speaker, as now, with nothing in
  the middle. When the game is heard the band is green (`colors.heard`, `colors.heardInk`), with no
  border.
- **Focus key band**: always green. The crosshair (`target`, in `colors.heardInk`) sits where the
  slot number circle is (x≈14), the service monogram is next to it (x=35), and the middle is
  empty. The update dot goes at the band's right end (x≈127, where the speaker is on a Game Slot
  key). No score, possession dot or alerts, and `focus.ts` gets no score data.
- **Unchanged**: titles that aren't matchups, and the service-name fallback, keep their text
  layouts on both keys. "Nothing heard", "No Chrome" and "Update …" keys don't change.
- The band's open question (status or slot number on the Focus key) is answered: **no**, only the
  crosshair and monogram.

## GitHub sync

Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #25 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBikhg`. Board ids and tested
recipes live in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`). If a command fails with an id error, refresh the ids as that
file describes.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBikhg --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (use the "Tick a phase"
  recipe in `.github/gh-recipes.md`, with `--body-file` from the scratchpad), read it back, and
  tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria): draft the edit in
  chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 25 --body-file <scratchpad file>` starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has a `Fixes #25` line. Merging closes the issue and the
  board moves it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Shared rows and band, and score-less Game Slot keys

Status: Complete

- [x] In `render.ts`, factor the row drawing out of `scoreboardKey` into a shared helper (e.g.
      `teamRows(abbrs, fills, score?)`) that draws both 60px rows with abbreviations, and scores,
      possession dot and alert flash only when a score is given. With no score it uses the
      pre-game abbreviation sizing (`Math.min(30, …)`).
- [x] Factor the band's common parts (band rect, fill/ink choice, update dot position) into a
      helper that the Game Slot band and, in Phase 2, the Focus band both use, so their geometry
      (`BAND`, x positions) comes from one place.
- [x] Make the Game Slot rows-and-band layout handle a missing score: rename
      `scoreboardKey` to fit (e.g. `matchupKey`) and draw it for any connected, non-mismatched slot
      whose title parses as a matchup, score or not. The band's status text is empty without a
      score; heard turns the band green; the update badge stays in the band.
- [x] Remove the `split` branch from `slotKeyBody` (only the text layout for non-matchup titles
      stays) and update `slotKeySvg` to match.
- [ ] Delete `matchupSplit`. Drop `separator` from `TeamSplit`/`teamSplit`. Remove any helper left
      unused (check `onDisc` and `badge` callers before removing; `serviceBadge` still uses
      `onDisc`). **Moved to Phase 2** (approved, deviation comment posted on #25):
      `focusKeyBody` still calls `matchupSplit` until Phase 2 replaces it.
- [x] Update `packages/plugin/test/render.test.ts`: replace the `matchupSplit`-based Game Slot
      tests ("splits a known matchup…", "keeps the speaker off and drops the border…", "shows a 'v'
      separator…", "draws text when team colors are turned off", "keeps the update badge on top of
      team colors") with rows-and-band equivalents. Remove `separator` from `teamSplit` `toEqual`
      expectations (moved to Phase 2 with `separator`). Add tests: score-less matchup heard (green
      band, no border) and not heard; Team colors off → dark rows; unknown teams → dark rows;
      update dot in the band, not the corner; no score text drawn without a score.
- [x] Review snapshot changes (`pnpm --filter @rotho/plugin exec vitest run -u`) and confirm each
      diff is an intended layout change before accepting it.
- [x] Write the new Game Slot SVGs (score-less heard, not heard, colors off, unknown teams,
      update) to the scratchpad and give the user the paths to look at.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` pass.
- Grep `packages/plugin/src` for `matchupSplit` and `separator`: no hits in `render.ts` (the
  `separator` on `parseTitle`'s matchup in `@rotho/shared` may stay).
- Scoreboard tests ("scoreboard layout" describe block) pass with unchanged snapshots, which shows
  the refactor didn't change keys that have a score.

Result (2026-10-18): 222 plugin tests pass; typecheck, lint and format:check pass. No
"scoreboard layout" snapshot changed. `matchupSplit`/`separator` remain, used only by the Focus key
(deferred to Phase 2, see above).

### Phase Summary

- `render.ts`: `scoreboardKey` became `matchupKey`, drawn for any connected, non-mismatched Game
  Slot key whose title parses as a matchup, with or without a score. New helpers:
  `matchupRows(title, teamColors)` (abbrs + fills; dark fills when Team colors is off or neither
  team is known), `teamRows(rows, score?)` (no score draws like pre-game: 30px abbreviations
  only), `bandRect(fill)`, and `BAND_X` (`lead` 14, `service` 35, `update` 106, `end` 127) for the
  band glyph positions. `infoBand(view, rows)` reads the score from `view.score` and skips the
  status text when there is none.
- `slotKeyBody` lost its team-color split branch; it now only draws non-matchup titles (text
  layout) plus the empty, No Chrome and Update keys.
- Tests: the Game Slot text-layout tests use "NFL GameDay Live" instead of matchups;
  `rowFill`/`bandFill` helpers moved to module scope; Game Slot team-color tests now assert row and
  band fills. A new test shows a score-less key equals a pre-game key with an empty status.
- Phase 2 builds the Focus band from `bandRect`, `BAND_X`, `teamRows` and `matchupRows`, then
  deletes `matchupSplit` and `TeamSplit.separator` (and the `separator` in the two `teamSplit`
  `toEqual` tests).
- Previews: `preview.test.ts` in the session scratchpad renders keys through vitest, which
  resolves the shared package's extensionless imports (plain `node` can't). Set
  `$env:PREVIEW_OUT` and `$env:PREVIEW_RENDER`, then run
  `pnpm --filter @rotho/plugin exec vitest run --root <scratchpad dir>`.

## Phase 2: Focus Heard Game on rows and band

Status: Not started

- [ ] In `focusKeyBody` (or a new `focusMatchupKey`), draw a title that parses as a matchup with
      the shared row helper (no score) and a Focus band: always green, crosshair (`target`, scaled
      to fit the 24px band, in `colors.heardInk`) at the slot-number position, service monogram at
      x=35, empty middle, update dot at the right end when `updateAvailable`.
- [ ] Delete `matchupSplit` and any helper it leaves unused (check `onDisc` callers;
      `serviceBadge` still uses it). Drop `separator` from `TeamSplit`/`teamSplit` and from the
      two `teamSplit` `toEqual` tests (moved from Phase 1).
- [ ] Make `focusKeySvg` skip `withUpdateBadge` for the rows-and-band layout (the band has its own
      dot), and keep it for the text, "Nothing heard", "No Chrome" and "Update" keys.
- [ ] Keep the text layout (big crosshair + wrapped label + corner service badge) for non-matchup
      titles and the service-name fallback. Remove the old `split` branch.
- [ ] Update `render.test.ts` `focusKeySvg` / team colors / service badge / update badge tests:
      replace "splits the heard game on the Focus key, crosshair in the corner" and "keeps the
      Focus key's text layout when team colors are turned off" with: known matchup → two team
      rows plus green band with crosshair and monogram; no digits or score text; Team colors off
      → dark rows; unknown teams → dark rows; update dot in the band, not the corner. Adjust "is
      drawn on heard, team-color and Focus keys" in the service badge block, since the monogram
      moves into the band for matchups.
- [ ] Review and accept the snapshot updates.
- [ ] Write the Focus SVGs (known matchup, colors off, unknown teams, update) to the scratchpad
      next to a Game Slot key for the same game, and give the user the paths for a side-by-side
      look.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` pass.
- A test asserts the Focus key with a matchup contains both team rows and the green band
  (`colors.heard` fill) and no score text.
- Unchanged snapshots for "Nothing heard", "No Chrome" and "Update extension" Focus keys.

### Phase Summary

_(write when phase completes)_

## Final Recap

_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan

_(write when all phases complete: step-by-step deployment instructions)_
