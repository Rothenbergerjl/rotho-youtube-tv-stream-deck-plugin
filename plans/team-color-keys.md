# Team Colors on Game Slot Keys

Issue: #7

Game Slot and Focus Heard Game keys show a recognised matchup in the two teams' colors (split
layout: away / first-named team on the top half, home / second on the bottom). Only
`packages/shared` and `packages/plugin` change; the extension and the WebSocket protocol do not,
because the plugin already gets team ids from `parseTitle`. Program art from `mediaSession`
(option B in the research) is out of scope and becomes its own issue.

## For Future Agents

As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done, set its status
to `Complete` and write its **Phase Summary** (what was done, key decisions, anything needed to
continue with zero context); run the phase's **Verification Plan** and record the result before
moving on. After each phase, follow the **GitHub sync** section below. When all phases are done,
fill in **Final Recap** and **Deployment Plan**; the single PR carries `Fixes #7`.

Repo rules that matter here (from `CLAUDE.md`): edit files only with the editor tools, never with
shell scripts; never run git commands that change anything (the user branches and commits, one
commit per phase); run `gh` from PowerShell with `--body-file` from the scratchpad.

### Design decisions (agreed 2026-10-17)

- **Layout: split.** Top half = first team in the title (away for "@", first-named for "v"), bottom
  half = second team. Each half shows its abbreviation centred. A small dark disc on the seam holds
  the separator ("@" or "v"). Mockup reference: away text at y≈60, home at y≈122, font ≈30,
  separator disc r=11 at (72,72).
- **Overlays stay readable:** slot badge top-left as today; speaker top-right on a dark disc
  (`#111418`, ~85% opacity, r≈19). Heard game keeps the 8px green border and green badge.
- **No dimming** of games you aren't hearing.
- **Two colors per team:** `colors: [primary, secondary]`. When the two teams' primaries are too
  close (RGB distance below a threshold, ~90), the second team uses its secondary.
- **Text color** comes from relative luminance: dark text (`#111418`) on light fills (luminance >
  ~0.35), otherwise `#f5f5f5`. No per-team text color is stored.
- **Half-known matchup:** a side without colors (generic side, or a table team still missing
  colors) uses the normal key background `#111418`, keeping the split layout. If neither side has
  colors, the key uses today's text layout.
- **Non-matchup titles, empty slots, No Chrome, Update states:** unchanged.
- **Focus Heard Game** uses the same split layout for the heard game, with its green crosshair moved
  to a corner (top-left, where Game Slot keys have the badge).
- **Toggle:** a "Team colors" checkbox, default on, in the Game Slot property inspector
  (`ui/slot.html`) and in a new Focus property inspector (`ui/focus.html`). Setting key
  `teamColors`; `undefined` (keys made before this change) means on.
- **Color sources:** official team / league brand pages where available, cited in each league
  file's header comment as `nfl.ts` cites nfl.com. National teams use their usual home-kit colors.
- **Version:** 0.3.0 → 0.4.0 in the last phase. `scripts/sync-version.mjs` keeps every package in
  lockstep, so the extension moves to 0.4.0 too even though its code is unchanged.

## GitHub sync

Run these yourself with `gh`; do not wait to be asked, except where marked. The issue is #7 and
its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVnZc`. Board ids and tested recipes are in
`.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`). If a command fails with an id error, refresh ids with
`gh project field-list 3 --owner Rothenbergerjl --format json`.

- **First phase starts:** set board Status to **In Progress**:
  `gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBVnZc --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body using the "Tick a phase"
  recipe in `.github/gh-recipes.md`, then read the body back. Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria): draft the edit in
  chat and **ask first**, then `gh issue edit 7 --body-file <scratchpad file>`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 7 --body-file <scratchpad file>` starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #7` (run `/open-pr` when the user says the
  branch is pushed). Merging closes it and the board moves it to Done. Delete this plan `.md` in
  the final commit.
- Never run git commands that change anything; the user branches (`7-team-color-keys`) and commits.

## Phase 1: Color data model and pro leagues
Status: Complete

- [x] Add `colors?: readonly [primary: string, secondary: string]` to `Team` in
      `packages/shared/src/teams/types.ts`, with a doc comment (uppercase `#RRGGBB`, primary first;
      optional so leagues can be filled phase by phase)
- [x] Add `teamColors(teamId: string): readonly [string, string] | undefined` in
      `packages/shared/src/teams/index.ts`, built once as a `Map` from `"<league>:<abbr>"` (the
      same id format `tableSide` in `title.ts` produces); export it from `@rotho/shared`
- [x] Fill `colors` for every team in `nfl.ts` (32), `nba.ts` (30), `wnba.ts`, `mlb.ts` (30) and
      `nhl.ts` (32); add the color source to each file's header comment
- [x] Add a shared test file `packages/shared/src/teams/colors.test.ts`:
  - [x] every `colors` entry matches `/^#[0-9A-F]{6}$/` and has exactly two values
  - [x] every team in NFL, NBA, WNBA, MLB and NHL has `colors` (a `FULL_COVERAGE` list of league
        ids that later phases extend)
  - [x] `teamColors("nfl:BUF")` returns the Bills' colors; an unknown id returns `undefined`

### Verification Plan
- `pnpm --filter @rotho/shared test` passes, including the new colors tests
- `pnpm typecheck` and `pnpm lint` pass
- Spot-check: `teamColors` result for `parseTitle("Buffalo Bills at Los Angeles Rams").matchup.teams[*].teamId`
  is defined for both sides (covered by a test)

### Phase Summary
Done 2026-10-17. `Team.colors` is optional `[primary, secondary]`; `teamColors(teamId)` in
`teams/index.ts` (exported from `@rotho/shared` via `export * from "./teams"`) looks colors up from
a `Map` built once over `LEAGUES`. All 140 NFL/NBA/WNBA/MLB/NHL teams have colors, with each
file's header noting the source. Approximate colors (teams without published hex values) are
marked inline: NBA Utah Jazz (2025 rebrand), WNBA Valkyries, Houston Comets (no brand yet; red/navy
placeholder), Portland Fire, Toronto Tempo, NHL Utah Mammoth. Revisit these if official values
appear. Long team entries use Prettier's multi-line object form. `colors.test.ts` holds the
`FULL_COVERAGE` list that Phases 4 and 5 extend; it also checks that same-abbreviation teams in
different leagues stay apart (`nfl:PHI` vs `nba:PHI`). Verification: `pnpm test` (shared 328,
plugin 91, extension 53), `pnpm typecheck`, `pnpm lint`, `pnpm format:check` all pass.

## Phase 2: Split-layout keys
Status: Not started

- [ ] In `packages/plugin/src/render.ts`, add helpers: `luminance(hex)`, `inkFor(fill)`,
      `tooClose(a, b)` and `pickColors(first, second)` (applies the similar-colors rule)
- [ ] Add `teamColors?: boolean` to `SlotKeyView` and `FocusKeyView` (default treated as `true`)
- [ ] Add a `matchupSplit(...)` drawing helper: two fills, both abbreviations with `inkFor`, the
      separator disc, used by both keys
- [ ] `slotKeyBody`: when `teamColors !== false`, `parseTitle(title).matchup` exists and at least one
      side has colors, draw the split layout with the badge and the speaker-on-disc; otherwise keep
      today's text layout exactly
- [ ] `focusKeyBody`: same rule, with the green crosshair (on a dark disc) in the top-left corner
- [ ] A side without colors uses `colors.background` (`#111418`)
- [ ] Update badge (`withUpdateBadge`) still draws last, so it stays on top
- [ ] Tests in `packages/plugin/test/render.test.ts`:
  - [ ] SF @ SEA heard: both team fills present, green border, both abbreviations as separate
        `<text>` elements, snapshot
  - [ ] BUF @ LAR: second team falls back to its secondary color (similar primaries)
  - [ ] a light primary (e.g. PIT gold) gets dark text
  - [ ] half-known matchup (table team vs generic NCAA side) shows one team color plus `#111418`
  - [ ] `teamColors: false` gives the current text output (existing assertions still hold)
  - [ ] non-matchup title, empty slot, No Chrome and mismatch keys are unchanged (existing
        snapshots unchanged for those cases)
  - [ ] Focus key split layout, snapshot
- [ ] Update existing tests whose matchup expectations change because colors are now on by default
      (e.g. `>SF @ SEA</text>` becomes separate `>SF</text>` / `>SEA</text>`); review every
      snapshot diff with `vitest -u` only after checking it is intended

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes; snapshot diffs limited to matchup keys
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- Render SF @ SEA, PIT @ GB and BUF @ LAR to SVG files in the scratchpad (from a vitest test that
  writes to the scratchpad dir, or by reading the snapshot) and open them in the built-in browser
  to compare against the approved mockup

### Phase Summary
_(write when phase completes)_

## Phase 3: Team-colors toggle
Status: Not started

- [ ] `ui/slot.html`: add an `sdpi-checkbox` with `setting="teamColors"`, label "Team colors",
      default checked, above the slot help text
- [ ] New `ui/focus.html` using the same sdpi-components script, with the same checkbox and a one-line
      description
- [ ] `manifest.json`: add `"PropertyInspectorPath": "ui/focus.html"` to the Focus Heard Game action
- [ ] `actions/slot.ts`: extend `SlotSettings` with `teamColors?: boolean`; keep a per-action map of
      the setting (filled in `onWillAppear` / `onDidReceiveSettings`) and pass it to `slotKeySvg`
- [ ] `actions/focus.ts`: add settings handling (`onWillAppear` and `onDidReceiveSettings`), render
      each Focus key with its own setting instead of one shared image
- [ ] Tests: `manifest.test.ts` asserts Focus has `ui/focus.html` and the file exists; a settings
      helper (`teamColorsSetting(value: unknown): boolean`, `undefined` → true, also accepting
      the string forms sdpi may send) is unit tested

### Verification Plan
- `pnpm test`, `pnpm typecheck`, `pnpm lint` pass
- `pnpm build` succeeds and the built `.sdPlugin` folder contains `ui/focus.html`
- Manual (user, on hardware): toggling the checkbox on a Game Slot and a Focus key switches between
  colors and text immediately; a key placed before the update shows colors

### Phase Summary
_(write when phase completes)_

## Phase 4: Soccer and national teams
Status: Not started

- [ ] Fill `colors` in `epl.ts`, `efl-championship.ts`, `laliga.ts`, `bundesliga.ts`, `seriea.ts`,
      `ligue1.ts`, `ucl-extras.ts` and `ligamx.ts`, citing sources in each header comment
- [ ] Fill `colors` in `national.ts` using home-kit colors (e.g. USA navy/red, Netherlands orange)
- [ ] Add these league ids to `FULL_COVERAGE` in `colors.test.ts`
- [ ] Add a render test for a "v" matchup (MCI v ARS) showing the "v" separator

### Verification Plan
- `pnpm test` passes with the extended coverage list
- `pnpm typecheck`, `pnpm lint` pass

### Phase Summary
_(write when phase completes)_

## Phase 5: NCAA
Status: Not started

- [ ] Fill `colors` for all 68 teams in `ncaa.ts`, citing school athletics brand pages in the header
- [ ] Add `ncaa` to `FULL_COVERAGE`
- [ ] Add a render test for a table NCAA matchup

### Verification Plan
- `pnpm test` passes; every league is in `FULL_COVERAGE`
- `pnpm typecheck`, `pnpm lint` pass

### Phase Summary
_(write when phase completes)_

## Phase 6: Docs, version bump and follow-up
Status: Not started

- [ ] Add a `## [0.4.0] - <date>` section to `CHANGELOG.md` (Added: team colors on Game Slot and
      Focus keys; the Team colors setting; Focus key settings page. Note that the extension has no
      code changes and only its version moved)
- [ ] README: describe team colors and the toggle where the Game Slot and Focus keys are described
- [ ] Bump the version to `0.4.0` with the editor in root `package.json`, the three
      `packages/*/package.json`, `packages/extension/manifest.json` (`0.4.0`) and the plugin
      `manifest.json` (`0.4.0.0`)
- [ ] Draft the program-art issue in chat (mediaSession artwork: what's unknown, the console
      snippet to check it, the plugin-side download approach, PRIVACY.md impact) following
      `.github/ISSUE_TEMPLATE/feature.yml`; create it only after the user approves
- [ ] Give the user a short hardware checklist: split keys readable at real size, gold/white
      teams legible, speaker and badge visible, heard border visible, toggle works

### Verification Plan
- `node scripts/sync-version.mjs --check` prints `All versions are 0.4.0`
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- `pnpm build` succeeds

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
