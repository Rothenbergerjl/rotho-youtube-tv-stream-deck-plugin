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
Status: Complete

- [x] In `packages/plugin/src/render.ts`, add helpers: `luminance(hex)`, `inkFor(fill)`,
      `tooClose(a, b)` and `pickColors(first, second)` (applies the similar-colors rule)
- [x] Add `teamColors?: boolean` to `SlotKeyView` and `FocusKeyView` (default treated as `true`)
- [x] Add a `matchupSplit(...)` drawing helper: two fills, both abbreviations with `inkFor`, the
      separator disc, used by both keys
- [x] `slotKeyBody`: when `teamColors !== false`, `parseTitle(title).matchup` exists and at least one
      side has colors, draw the split layout with the badge and the speaker-on-disc; otherwise keep
      today's text layout exactly
- [x] `focusKeyBody`: same rule, with the green crosshair (on a dark disc) in the top-left corner
- [x] A side without colors uses `colors.background` (`#111418`)
- [x] Update badge (`withUpdateBadge`) still draws last, so it stays on top
- [x] Tests in `packages/plugin/test/render.test.ts`:
  - [x] SF @ SEA heard: both team fills present, green border, both abbreviations as separate
        `<text>` elements, snapshot
  - [x] BUF @ LAR: second team falls back to its secondary color (similar primaries)
  - [x] a light primary (e.g. PIT gold) gets dark text
  - [x] half-known matchup (table team vs generic NCAA side) shows one team color plus `#111418`
  - [x] `teamColors: false` gives the current text output (existing assertions still hold)
  - [x] non-matchup title, empty slot, No Chrome and mismatch keys are unchanged (existing
        snapshots unchanged for those cases)
  - [x] Focus key split layout, snapshot
- [x] Update existing tests whose matchup expectations change because colors are now on by default
      (e.g. `>SF @ SEA</text>` becomes separate `>SF</text>` / `>SEA</text>`); review every
      snapshot diff with `vitest -u` only after checking it is intended

### Verification Plan
- `pnpm --filter @rotho/plugin test` passes; snapshot diffs limited to matchup keys
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- Render SF @ SEA, PIT @ GB and BUF @ LAR to SVG files in the scratchpad (from a vitest test that
  writes to the scratchpad dir, or by reading the snapshot) and open them in the built-in browser
  to compare against the approved mockup

### Phase Summary
Done 2026-10-17. `render.ts` exports `teamSplit(title)` (matchup → `{ abbrs, separator, fills }`,
or undefined when not a matchup or neither side has colors), `pickFills`, `tooClose`, `luminance`
and `inkFor`; `matchupSplit` and `onDisc` draw it. `slotKeyBody` and `focusKeyBody` use the split
unless `teamColors === false`. The "No Chrome", "Update" and empty-slot branches run first, so
they are unaffected.

Small departures from the design notes, all within the approved behavior:
- The helper is `pickFills`, not `pickColors`. Besides the second team switching to its
  secondary on a clash, a team whose primary clashes with the dark key background on a
  half-known matchup (e.g. Seahawks navy next to an unknown team) switches to its own secondary.
- `inkFor` picks whichever of light/dark text has the higher WCAG contrast instead of a fixed
  0.35 luminance cutoff. The effective crossover is about 0.2, so mid oranges (Bengals, Broncos)
  get dark text.
- Existing text-layout tests now pass `teamColors: false` instead of being rewritten, so no
  existing snapshot changed; the toggle-off path is covered by them. Only 2 new snapshots
  (split Game Slot key and Focus key) were written; `vitest -u` was not needed.
- Half-known test uses "Football: Kansas City Chiefs at Gonzaga" (generic matcher), not an NCAA
  table team, so it stays stable when Phase 5 adds NCAA colors.
- A long non-matchup fallback like "GONZ @ SAIN" wraps to two lines (`GONZ @` / `SAIN`), as before.

Verification: plugin tests 109 pass; `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass.
The real SVGs from the snapshots (SF @ SEA Game Slot and Focus) were viewed at 144 and 72 px and
match the approved mockup. PIT @ GB and BUF @ LAR are covered by assertions rather than viewed.
The Phase 4 "MCI v ARS" test still passes `teamColors: false`, so adding EPL colors won't change it.

## Phase 3: Team-colors toggle
Status: Complete

- [x] `ui/slot.html`: add an `sdpi-checkbox` with `setting="teamColors"`, label "Team colors",
      default checked, above the slot help text
- [x] New `ui/focus.html` using the same sdpi-components script, with the same checkbox and a one-line
      description
- [x] `manifest.json`: add `"PropertyInspectorPath": "ui/focus.html"` to the Focus Heard Game action
- [x] `actions/slot.ts`: extend `SlotSettings` with `teamColors?: boolean`; keep a per-action map of
      the setting (filled in `onWillAppear` / `onDidReceiveSettings`) and pass it to `slotKeySvg`
- [x] `actions/focus.ts`: add settings handling (`onWillAppear` and `onDidReceiveSettings`), render
      each Focus key with its own setting instead of one shared image
- [x] Tests: `manifest.test.ts` asserts Focus has `ui/focus.html` and the file exists; a settings
      helper (`teamColorsSetting(value: unknown): boolean`, `undefined` → true, also accepting
      the string forms sdpi may send) is unit tested

### Verification Plan
- `pnpm test`, `pnpm typecheck`, `pnpm lint` pass
- `pnpm build` succeeds and the built `.sdPlugin` folder contains `ui/focus.html`
- Manual (user, on hardware): toggling the checkbox on a Game Slot and a Focus key switches between
  colors and text immediately; a key placed before the update shows colors

### Phase Summary
Done 2026-10-17. `src/settings.ts` holds `teamColorsSetting(value)`: anything but `false` or
`"false"` is on, so keys without the setting show colors. `SlotAction` and `FocusAction` each keep
a `teamColors` map by action id, filled in `onWillAppear` / `onDidReceiveSettings` and cleared in
`onWillDisappear`. `FocusAction.renderAll` draws at most two images (colors on and off) and gives
each key the one for its setting. A new Game Slot key now saves `{ ...settings, slot }` instead of
`{ slot }`, so it can't drop a `teamColors` value. The checkbox is
`<sdpi-checkbox setting="teamColors" default="true">` (sdpi-components v4: `default` is what it
shows while nothing is saved; it saves a boolean). Both panels' help text mentions the setting.
`manifest.test.ts` now checks each action's `PropertyInspectorPath` and that the file exists;
`settings.test.ts` covers the helper.

Verification: `pnpm test` (shared 328, plugin 116, extension 53), `pnpm typecheck`, `pnpm lint`,
`pnpm format:check` pass; `pnpm build` succeeds and `ui/focus.html` is in the `.sdPlugin` folder.
Not yet done: the manual check on hardware (toggling both keys, and a pre-update key showing
colors). It is in the Phase 6 hardware checklist.

## Phase 4: Soccer and national teams
Status: Complete

- [x] Fill `colors` in `epl.ts`, `efl-championship.ts`, `laliga.ts`, `bundesliga.ts`, `seriea.ts`,
      `ligue1.ts`, `ucl-extras.ts` and `ligamx.ts`, citing sources in each header comment
- [x] Fill `colors` in `national.ts` using home-kit colors (e.g. USA navy/red, Netherlands orange)
- [x] Add these league ids to `FULL_COVERAGE` in `colors.test.ts`
- [x] Add a render test for a "v" matchup (MCI v ARS) showing the "v" separator

### Verification Plan
- `pnpm test` passes with the extended coverage list
- `pnpm typecheck`, `pnpm lint` pass

### Phase Summary
Done 2026-10-17. Colors filled for all 241 soccer teams: 174 clubs across the eight club tables
and 67 national teams. Clubs and federations rarely publish hex values, so every file's header
says the colors are crest and home-kit colors and approximate. For clubs whose home kit is
white (Real Madrid, Fulham, Germany, England and others) the primary is `#FFFFFF`, so they draw
white with dark text and fall back to their trim color when they meet another white team. The
clash rule (`tooClose`, distance 90) also catches dark-on-dark pairs such as USA navy vs Mexico
green; Mexico then shows its red. `FULL_COVERAGE` now lists every league except `ncaa`. New
render tests: "MCI v ARS" (sky blue over red, "v" separator) and USA v MEX via `teamSplit`. The
older "fits a soccer 'v' matchup on one line" test keeps `teamColors: false`, so it still checks
the text layout. Verification: `pnpm test` (shared 578, plugin 118, extension 53),
`pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass.

## Phase 5: NCAA
Status: Complete

- [x] Fill `colors` for all 68 teams in `ncaa.ts`, citing school athletics brand pages in the header
- [x] Add `ncaa` to `FULL_COVERAGE`
- [x] Add a render test for a table NCAA matchup

### Verification Plan
- `pnpm test` passes; every league is in `FULL_COVERAGE`
- `pnpm typecheck`, `pnpm lint` pass

### Phase Summary
Done 2026-10-17. All 68 NCAA schools have their athletics brand colors (primary, then secondary).
`ncaa.ts` uses Prettier's multi-line form for any entry that would pass 100 characters with
`colors` added, so most entries are multi-line. `colors.test.ts` gains a "covers every league"
test (`FULL_COVERAGE` sorted equals every `LEAGUES` id), so a new league table can't silently skip
colors. New render test: "College Football: Michigan Wolverines at Ohio State Buckeyes" splits
Michigan blue over Ohio State scarlet. Schools outside the tables (Gonzaga, Saint Mary's) still
fall back to text or to a neutral half, as tested in Phase 2. Verification: `pnpm test` (shared
648, plugin 119, extension 53), `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass.

## Phase 6: Docs, version bump and follow-up
Status: Complete

- [x] Add a `## [0.4.0] - <date>` section to `CHANGELOG.md` (Added: team colors on Game Slot and
      Focus keys; the Team colors setting; Focus key settings page. Note that the extension has no
      code changes and only its version moved)
- [x] README: describe team colors and the toggle where the Game Slot and Focus keys are described
- [x] Bump the version to `0.4.0` with the editor in root `package.json`, the three
      `packages/*/package.json`, `packages/extension/manifest.json` (`0.4.0`) and the plugin
      `manifest.json` (`0.4.0.0`)
- [x] Draft the program-art issue in chat (mediaSession artwork: what's unknown, the console
      snippet to check it, the plugin-side download approach, PRIVACY.md impact) following
      `.github/ISSUE_TEMPLATE/feature.yml`; create it only after the user approves
- [x] Give the user a short hardware checklist: split keys readable at real size, gold/white
      teams legible, speaker and badge visible, heard border visible, toggle works

### Verification Plan
- `node scripts/sync-version.mjs --check` prints `All versions are 0.4.0`
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- `pnpm build` succeeds

### Phase Summary
Done 2026-10-17. `CHANGELOG.md` has a `[0.4.0] - 2026-10-17` section: Added team colors, the
clash and text-color rules, and the Team colors checkbox; Changed notes that unknown teams and
shows look as before. Its intro says only the plugin changed and the extension's version moved
to stay in step. README Usage gains a step about team colors and the checkbox; the key table
describes the colored and text Game Slot states and the colored Focus key; the repo layout row
for `packages/shared` mentions team tables and colors. The version moved to 0.4.0 in all six
files with the editor (not `pnpm version:sync`, per the repo's no-shell-edits rule). The
program-art follow-up was drafted in chat from `feature.yml`. It is created only with the user's
approval, and isn't created by this phase. The hardware checklist was given in chat.
Verification: `sync-version --check` prints "All versions are 0.4.0"; `pnpm test` (shared 648,
plugin 119, extension 53), `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass;
`pnpm build` succeeds.

## Final Recap
Issue #7 asked for logos or art on Game Slot keys. After research, it shipped as team colors.
League logos were ruled out over trademark licensing, and program art moves to a follow-up issue.

- **Data (`packages/shared`):** every one of the 449 teams in the 15 league tables has
  `colors: [primary, secondary]`, and `teamColors(teamId)` looks them up. A test enforces full
  coverage, including any league added later. Pro and NCAA colors follow published team palettes.
  Soccer, national-team and a few new pro teams' colors are approximate and marked as such.
- **Drawing (`packages/plugin/src/render.ts`):** `teamSplit` turns a title into a two-color split
  (first/away team on top). `pickFills` handles clashes between the two teams and with the dark
  background. `inkFor` picks the higher-contrast text. Game Slot keys keep the slot badge, a
  speaker on a dark disc and the green heard border; the Focus key puts its crosshair top-left.
  Non-matchups, unknown teams and every error state are unchanged.
- **Setting:** a per-key "Team colors" checkbox (on by default, missing = on) in `ui/slot.html`
  and a new `ui/focus.html`, read through `teamColorsSetting`.
- **Release:** 0.4.0 with CHANGELOG and README updates. The protocol and extension code are
  unchanged.
- **Deviation** (posted on #7): contrast-based text color and the background-clash fallback.

## Deployment Plan
1. Check the hardware checklist on a real Stream Deck with a dev build
   (`pnpm --filter @rotho/plugin sd:link`, restart the plugin). Fix anything found before
   merging.
2. Delete `plans/team-color-keys.md` in the final commit, push the branch, and run `/open-pr`.
   The PR body carries `Fixes #7`.
3. Squash-merge the PR into `main` (the user does this; merging closes #7).
4. Follow README → Release: in GitHub, **Actions → Release → Run workflow** on `main` with
   version `0.4.0`. The workflow tags `v0.4.0` and publishes both files. Installed plugins show
   the update badge within 12 hours.
5. Extension: its code is unchanged, so uploading `yttv-multiview-extension-0.4.0.zip` to the
   Chrome Web Store is optional. Upload it to keep the store version in step with the plugin;
   there's no protocol change, so 0.3.0 extensions keep working with the 0.4.0 plugin.
6. Program-art follow-up: created as #14 (2026-10-17).
