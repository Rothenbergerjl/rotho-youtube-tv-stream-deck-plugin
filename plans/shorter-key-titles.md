# Shorter Key Titles for More Sports

Issue: #6

Make `formatMatchup` shorten matchups beyond the NFL, to "AWY @ HOM" or "HOM v AWY". Cover NBA,
WNBA, MLB, NHL, college Power-conference schools, and soccer (Premier League, EFL Championship,
the top-5 European leagues, Champions League regulars, Liga MX, national teams). Return structured
team data for #7 (logos), and shorten non-sports titles more cleanly. MLS is out of scope (it is
mostly on Apple TV). Key layout does not change: no league tag on keys.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #6`.

## GitHub sync
Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #6 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVnVc`. Board ids and tested recipes
are in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`).

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBVnVc --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view 6 --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit 6 --body-file <file>`), then read it back. Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 6 --body-file <file>` starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #6`. Merging closes it and the board moves
  it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Key decisions

- **Leagues with tables:** NFL (existing), NBA, WNBA, MLB, NHL; Premier League, EFL Championship,
  La Liga, Bundesliga, Serie A, Ligue 1, Champions League regulars from outside the top 5 (about 20:
  Benfica, Porto, Sporting CP, Ajax, PSV, Feyenoord, Celtic, Rangers, Club Brugge, Galatasaray,
  Fenerbahçe, Red Bull Salzburg, Shakhtar, Red Star, Dinamo Zagreb, Young Boys, Copenhagen, Slavia
  Prague, Olympiacos, Sparta Prague), Liga MX, men's and women's national teams (about 60, FIFA
  codes); college: ACC, Big Ten, Big 12, SEC and Notre Dame. **Not covered:** MLS, other college schools
  (they use the generic fallback).
- **Abbreviations:** league-standard codes for US leagues; for soccer, the broadcast 3-letter codes
  that TV score bugs use (MCI, MUN, ARS, TOT, RMA, BAR, ATM, BAY, BVB, PSG, JUV, INT, ACM, AME, GDL),
  and FIFA codes for national teams; for college, common short forms (OSU = Ohio State, OKST =
  Oklahoma State, UNC, USC, LSU…).
- **Separator:** "at"/"@" → `@` (away first). "vs"/"vs."/"v"/"v." → `v`, in the order the title gives
  (soccer lists the home team first). Today's NFL "KC vs BUF" becomes "KC v BUF" so it fits one line.
- **Collision resolution (layered):** 1) the longest name wins (a full name like "Texas Rangers"
  beats the bare nickname). 2) A league hint in the title ("NHL Hockey:", "MLB:", "Premier League:",
  "UEFA Champions League:", "College Football:") limits the search to those leagues. 3) Otherwise
  use the one league that has both teams. 4) If no league or more than one league has both teams,
  use the generic short form. Never guess between leagues.
- **Generic fallback:** for an "X at Y" or "X vs. Y" title where a team isn't in any table, each side
  shortens to its first meaningful word (skipping "The", "University", "of"), uppercased, at most 4
  letters ("Wake Forest at Duke" → "WAKE @ DUKE"). It only applies when the title has a sports hint
  (a league hint or a sport word: Football, Basketball, Baseball, Softball, Hockey, Soccer, Fútbol,
  Volleyball, NCAA, College), or when one side is a known team. Each side must be 1–5 capitalised
  words with no digits. That keeps "CBS 4 News at 6" and "Breakfast at Tiffany's" safe.
- **Matching:** case-insensitive, accent-insensitive (NFD with combining marks removed, so
  "Atlético", "Club América" and "Bayern München" match), and whole words only. Soccer gets common
  aliases (Man City, Man United, Spurs, Wolves, Barça, Inter, Bayern Munich, PSG, USMNT, El Tri).
- **Structured output:** new `parseTitle(raw): ParsedTitle` in `@rotho/shared`, returning
  `{ display, matchup? }`. `matchup` is `{ league?, separator: "@" | "v", teams: [Side, Side] }`, and a
  `Side` is `{ abbr, teamId? }` with `teamId` like `"nba:BOS"` when it came from a table (omitted for
  generic sides). `formatMatchup(raw)` stays as `parseTitle(raw).display`, so callers in
  `packages/plugin` don't change. Nothing is added to the wire protocol.
- **Non-sports light rules:** drop " - YouTube TV" (as today) and filler such as a leading "Live:" /
  "LIVE:" / "New:" and a trailing "(Live)" / "(New)". For "Series: Episode" titles over the limit, keep
  the series name. Cut at a word boundary with "…", and hard-cut only when the first word alone is
  over the limit. `MAX_TITLE_LENGTH` stays 16.
- **Fixtures:** no real captures for non-NFL sports. Tests use best-guess title formats, marked with a
  `// Unverified format` comment, and the user checks real titles after deployment. Existing real
  NFL fixtures stay; their expectations change only where the "v" or word-boundary rules apply.
- **Data upkeep:** each league file has a header comment naming its season (2026–27, or 2026 for
  MLB/WNBA) and the source checked. Team names are verified against official league sites at
  implementation time (for example Utah Mammoth, Athletics, the 2026 WNBA expansion teams, and
  promoted/relegated soccer clubs).

## Phase 1: Parser refactor and structured output (NFL only)
Status: Complete

- [x] Create `packages/shared/src/teams/types.ts` with `LeagueId`, `Team` (`{ abbr, names: string[] }`,
      where `names` holds full names, nicknames and aliases) and `League`
      (`{ id, sport, hints: string[], teams }`).
- [x] Move the NFL table from `title.ts` into `packages/shared/src/teams/nfl.ts`, and add
      `packages/shared/src/teams/index.ts` exporting `LEAGUES`.
- [x] Add `normalize()` in `title.ts` (whitespace, " - YouTube TV" suffix, accent folding for
      matching only, so the display keeps the original text).
- [x] Build one name index: normalised name → list of `{ league, team }` (a list, so collisions are
      kept), and one regex of every name, longest first, with whole-word boundaries.
- [x] Add league-hint detection (case-insensitive phrases from each league's `hints`, searched
      anywhere in the title).
- [x] Implement `parseTitle()` with steps 1–4 of the collision resolution; the generic step only
      returns the existing truncation for now (Phase 4 replaces it).
- [x] Map "vs"/"vs."/"v"/"v." to the `v` separator, and update the existing NFL expectations
      (`"KC v BUF"`, `"GB v CHI"`).
- [x] Export `parseTitle`, `ParsedTitle`, `Side` and `LEAGUES` from `packages/shared/src/index.ts`,
      and keep `formatMatchup` as a wrapper.
- [x] Add tests in `title.test.ts` for `parseTitle` structure (teamId, league, separator) and
      accent-insensitive matching.

### Verification Plan
- `pnpm --filter @rotho/shared test` passes, including every existing NFL case with the updated `v`
  expectations.
- `pnpm --filter @rotho/plugin test` passes. If a render snapshot holds a "vs" label, update it with
  `pnpm --filter @rotho/plugin exec vitest run -u` and check that the diff only changes "vs" → "v".
- `pnpm typecheck` and `pnpm lint` exit 0.

**Result (2026-10-17):** shared 53/53 and plugin 90/90 tests pass. No plugin snapshot held a "vs"
label, so none changed. `pnpm typecheck`, `pnpm lint` and `prettier --check packages/shared plans`
are clean.

### Phase Summary
- New `packages/shared/src/teams/` holds `types.ts` (`LeagueId`, `Sport`, `Team`, `League`),
  `nfl.ts` (the 32 teams, plus hints "NFL", "NFL Football" and "Monday/Sunday/Thursday Night
  Football"), and `index.ts` (`LEAGUES`). `index.ts` at the package root re-exports it. To add a
  league, add its id to the `LeagueId` union, create the file, and append it to `LEAGUES`.
- `title.ts` now has `parseTitle()` → `{ display, matchup? }`, with `Side` and `Matchup` types.
  `formatMatchup` is a one-line wrapper, so plugin callers are unchanged.
- Matching runs on a folded copy of the title: NFD, combining marks removed, lower-cased. Word
  boundaries are Unicode lookarounds (`(?<![\p{L}\p{N}])` … `(?![\p{L}\p{N}])`) rather than `\W`.
  The display text keeps the original spelling.
- Collision resolution lives in `findMatchup()`. `entriesByName` maps a folded name to every team
  that uses it. Hints found anywhere in the title filter the candidates. The match resolves only if
  exactly one `(first, second)` pair shares a league; anything else returns `undefined`, and Phase
  4 replaces that with the generic short form. Only the first regex match in a title is tried.
- With only the NFL loaded, collisions and hint narrowing aren't exercised yet; Phase 2's tests
  cover them. The plan's `normalize()` became inline code at the top of `parseTitle` plus the
  `fold()` helper, not a separate exported function.
- Added a `LEAGUES` test checking that abbreviations and names are unique within each league;
  it covers every future league automatically.

## Phase 2: NBA, WNBA, MLB, NHL
Status: Complete

- [x] Add `teams/nba.ts`, `teams/wnba.ts`, `teams/mlb.ts`, `teams/nhl.ts` (full name, nickname, and
      city-less names such as "Athletics"), each with season and source header comments.
- [x] Add hints for each league (e.g. "NBA", "NBA Basketball", "WNBA", "MLB", "MLB Baseball",
      "Baseball Night in America", "NHL", "NHL Hockey", "Hockey Night").
- [x] Register them in `teams/index.ts`.
- [x] Add tests: at least two matchups per league (full and nickname forms, `@` and `v`), plus
      collisions: "Rangers at Kings" (both NHL → NYR @ LAK), "Texas Rangers at New York Yankees"
      (full name), "MLB: Giants at Cardinals" (hint → SF @ STL), "Giants at Cardinals" with no hint
      (NFL and MLB both fit → generic), "Panthers at Jets" (NFL and NHL both fit → generic),
      "NHL Hockey: Panthers at Jets" (→ FLA @ WPG), "Kings vs. Celtics" (NBA only → SAC v BOS).

### Verification Plan
- `pnpm --filter @rotho/shared test` passes, with the new league and collision cases.
- A test asserts that every `abbr` is unique within its league and that no name repeats within a
  league.
- `pnpm typecheck` and `pnpm lint` exit 0.

**Result (2026-10-17):** 83/83 shared and 90/90 plugin tests pass. `pnpm typecheck`, `pnpm lint` and
`prettier --check packages/shared plans` are clean.

### Phase Summary
- Added `teams/nba.ts` (30), `wnba.ts` (16), `mlb.ts` (30) and `nhl.ts` (32), registered in
  `LEAGUES` in the order NFL, NBA, WNBA, MLB, NHL. `LeagueId` now covers all five.
- WNBA: the 2026 season's 15 teams, plus "Houston Comets" (HOU). The Connecticut Sun relocate to
  Houston for 2027, and listing both now avoids an edit next season. Once the move is done, the
  Connecticut Sun entry can be dropped. Codes follow common 3-letter forms (NYL, LVA, LAS, GSV, CON).
- Codes: NBA uses GSW, NOP, SAS, NYK, BKN; MLB uses ATH, CWS, WSH; NHL uses LAK, NJD, SJS, TBL, VGK.
  A few common aliases are in (Cavs, Mavs, Sixers, Blazers, Wolves, A's, D-backs, Avs, Habs, Leafs,
  Caps). "Wolves" will also be a Wolverhampton alias in Phase 3; collision resolution handles that.
- `fold()` now also turns curly apostrophes (’) into straight ones, so "A’s" matches.
- Found and avoided a bug: two names of one team that fold to the same key (e.g. "Montréal" and
  "Montreal Canadiens") would create two index entries and make the match look ambiguous. Only the
  accented form is listed, and the uniqueness test now compares folded names, so it would catch it.
- Collision tests cover Rangers/Kings, Giants/Cardinals and Panthers/Jets, with and without hints and
  with full names, plus the check that "NBA" inside "WNBA" isn't treated as a hint. Ambiguous cases
  assert `matchup?.league` is undefined (not the display), so Phase 4's generic matchups won't break
  them.
- Team lists come from my own knowledge plus a 2026-10-17 web check of the WNBA list (sources:
  [Yahoo Sports on the Sun's sale](https://sports.yahoo.com/wnba/breaking-news/article/wnba-approves-sale-of-connecticut-sun-team-will-relocate-to-houston-in-2027-223603722.html),
  [Wikipedia: 2026 Connecticut Sun season](https://en.wikipedia.org/wiki/2026_Connecticut_Sun_season)).
  The headers name the official sites, but I didn't fetch those pages.

## Phase 3: Soccer
Status: Complete

- [x] Add `teams/epl.ts`, `teams/efl-championship.ts`, `teams/laliga.ts`, `teams/bundesliga.ts`,
      `teams/seriea.ts`, `teams/ligue1.ts`, `teams/ucl-extras.ts`, `teams/ligamx.ts`,
      `teams/national.ts`, using broadcast 3-letter / FIFA codes and the common aliases.
- [x] Add hints: "Premier League", "EPL", "EFL Championship", "Sky Bet Championship", "LaLiga"/
      "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Liga MX", "UEFA Champions League", "Champions
      League", "Europa League", "Conference League" (European hints cover every European club
      league), "World Cup", "WC Qualifier", "Gold Cup", "Nations League", "Copa América",
      "International Friendly" (national teams). A soccer-wide hint ("Soccer", "Fútbol") limits the
      search to soccer leagues.
- [x] Handle soccer collisions in tests: "Rangers" (Scottish club vs NHL/MLB; "Champions League:
      Rangers vs. Ajax" → RAN v AJA), "Athletic Club" vs "Athletics", "Inter" (Inter Milan only, since
      MLS is out), "Arsenal vs. Chelsea" (no hint, one league → ARS v CHE), "Real Madrid vs Barcelona",
      "Club América vs. Chivas" and "América vs. Guadalajara" (accents and aliases), "United States vs.
      Mexico" (→ USA v MEX), "Mexico" national team vs a Liga MX side, "Man City v Spurs".
- [x] Test that a club shared between the EPL and Championship tables in a promotion year isn't
      listed twice. Each club is in exactly one table.

### Verification Plan
- `pnpm --filter @rotho/shared test` passes, with every soccer league and collision case.
- The uniqueness test from Phase 2 covers the new leagues.
- `pnpm typecheck` and `pnpm lint` exit 0.

**Result (2026-10-17):** 138/138 shared and 90/90 plugin tests pass. `pnpm typecheck`, `pnpm lint` and
`prettier --check packages/shared plans` are clean.

### Phase Summary
- **Deviation: pools.** The plan said a matchup needs "one league that has both teams". That would
  have blocked every Champions League game (Arsenal is `epl`, Real Madrid is `laliga`), FA Cup ties
  between divisions, and promoted clubs still listed in the wrong English table. So `League` now has
  an optional `pool`, which defaults to the league id. Every European club table uses
  `pool: "europe"`, while Liga MX (`ligamx`) and national teams (`intl`) each have their own pool.
  Pairing, ambiguity checks and hints all work per pool, and a hint for any league allows its whole
  pool. `matchup.league` is set only when both teams share a league; each side's `teamId` always
  carries its own league (e.g. `epl:ARS`, `laliga:RMA`). The pool and sport-hint helpers are
  `poolOf()` and `SPORT_HINTS` in `teams/index.ts` (soccer: "Soccer", "Fútbol"); Phase 4 can add
  basketball, hockey and the like there.
- Nine new tables: `epl` (20), `efl-championship` (27, adds Cardiff, Luton, Plymouth), `laliga` (23),
  `bundesliga` (20), `seriea` (23), `ligue1` (21), `ucl-extras` (22, including Bodø/Glimt and Union SG),
  `ligamx` (18), `intl` (65 national teams with FIFA codes and the Spanish names Univision and
  Telemundo use). The European tables are 2025–26 clubs plus the 2025 relegations. 2026–27
  promotions weren't verified: a missing promoted club just falls back to Phase 4's generic form,
  and with the shared pool a club in the "wrong" table still matches.
- The European cup hints (Champions/Europa/Conference League, Super Cup, Scottish Premiership,
  Eredivisie, Primeira Liga) live in `ucl-extras.ts`. The English cup hints (FA Cup, Carabao Cup)
  are in `efl-championship.ts`.
- The uniqueness test now checks names per **pool** (folded), not per league, which covers "each
  club in exactly one table". Abbreviations are still checked per league. A few codes repeat across
  leagues in the pool (POR is Porto and Portsmouth, CEL is Celtic and Celta, BRE is Brentford and
  Brest), but `teamId` keeps them distinct.
- Known ambiguity: "Spurs vs. Wolves" fits the NBA and the Premier League, so it has no matchup
  without a hint. "Mexico vs. Club América" (national team vs club) has no matchup because they're
  in different pools.
- Deviation comment posted on #6 with the user's OK (2026-10-17).

## Phase 4: College and generic fallback
Status: Not started

- [ ] Add `teams/ncaa.ts` with ACC, Big Ten, Big 12, SEC and Notre Dame schools (school name, school
      + mascot, common short names such as "Ole Miss", "Pitt", "Cal"),
      one table for football and basketball.
- [ ] Add hints: "College Football", "College Basketball", "NCAA", "Men's College Basketball",
      "Women's College Basketball", conference names ("SEC", "Big Ten", "ACC", "Big 12").
- [ ] Implement the generic short form in `parseTitle` (first meaningful word, uppercased, ≤4 letters)
      with the guards: a sports hint or one known side; each side 1–5 capitalised words with no
      digits.
- [ ] Add tests: "College Football: Ohio State at Michigan" (→ OSU @ MICH), "Oklahoma State
      Cowboys at Texas Longhorns" (→ OKST @ TEX), "Cardinals at Panthers" with a college hint
      (Louisville/Pitt → LOU @ PITT), "Men's College Basketball: Gonzaga at Saint Mary's" (generic →
      GONZ @ SAIN), and the generic cases from Phase 2 ("Giants at Cardinals" → "GIAN @ CARD"). Also
      negatives: "CBS 4 News at 6", "Breakfast at Tiffany's", "Live at the Apollo", "Rams at
      Billsville" stay non-matchups.

### Verification Plan
- `pnpm --filter @rotho/shared test` passes, with the college, generic and negative cases.
- `pnpm typecheck` and `pnpm lint` exit 0.

### Phase Summary
_(write when phase completes)_

## Phase 5: Non-sports shortening and final checks
Status: Not started

- [ ] Implement the light rules in `parseTitle`'s non-matchup path: filler prefix and suffix removal,
      "Series: Episode" → series name, word-boundary cut with "…".
- [ ] Update the existing real-title expectations ("WRTV News at 6:00" → "WRTV News at…", "Disney
      Season Kickoff Tournament: U18/19 Boys (Final)" → "Disney Season…", "Rams at Billsville" →
      "Rams at…") and add cases for each rule, including a single over-long word (still hard-cut).
- [ ] Keep the `MAX_TITLE_LENGTH` invariant test.
- [ ] Add one render test in `packages/plugin/test/render.test.ts` for a soccer `v` label, checking it
      renders on one line.
- [ ] Update the doc comments on `parseTitle`/`formatMatchup` to describe the new behaviour.

### Verification Plan
- `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all exit 0.
- `pnpm build` succeeds (the shared tables bundle into the plugin and extension).

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
