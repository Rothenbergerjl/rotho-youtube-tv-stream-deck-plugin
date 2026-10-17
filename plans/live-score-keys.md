# Live Score Keys

Issue: #22

Show the live score on Game Slot keys in the "Scoreboard" layout (layout A), with an alert when a
score changes. Scores come from ESPN's public scoreboard JSON, fetched by the plugin. The extension
and the WebSocket protocol don't change. Findings and mockups: #16,
https://claude.ai/artifact/T3HYP5tSsFLP6D1xDHbVpq

## For Future Agents

As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done, set its status
to `Complete` and write its **Phase Summary** (what was done, key decisions, anything needed to
continue with zero context); run the phase's **Verification Plan** and record the result before
moving on. After each phase, follow the **GitHub sync** section below. When all phases are done,
fill in **Final Recap** and **Deployment Plan**; the single PR carries `Fixes #22`.

## GitHub sync

Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #22 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBg67w`. Board ids and tested
recipes live in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`).

- **First phase starts:** set board Status to **In Progress**:
  `gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBg67w --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (recipe "Tick a phase in an
  issue body" in `.github/gh-recipes.md`), read it back, and tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria): draft the edit in
  chat and **ask first**, then `gh issue edit 22 --body-file <scratchpad file>`.
- **Deviation from the plan:** **ask first**, then `gh issue comment 22 --body-file <file>` with a
  comment starting "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #22`. Merging closes it and the board moves
  it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Decisions (agreed 2026-10-17)

- **Source:** ESPN `https://site.api.espn.com/apis/site/v2/sports/<sport>/<league>/scoreboard`,
  fetched by the plugin (Node `fetch`, 10 s timeout, same style as `updates.ts`). No extension,
  protocol or `FEATURES` change.
- **Leagues:** every league in `packages/shared/src/teams`. Matched only when both teams resolve
  to table entries (`Side.teamId` set on both). Unknown teams and ambiguous titles keep today's key.
- **Matching:** by team name (our `names`, folded, against ESPN `displayName`, `shortDisplayName`,
  `name` and `location`), as an unordered pair. ESPN abbreviations are not used; they differ from
  ours (WAS/WSH, GSW/GS, NJD/NJ, …).
- **Polling:** every 15 s while a matched game is live (or a scheduled one has passed its start
  time), every 5 min while matched games are only scheduled or final, never when no slot has a
  matched game. Only the feeds those games need.
- **Failure:** log at info. A feed whose last successful fetch is more than 2 min old drops its
  scores, and those keys fall back to today's look.
- **Delay:** per-key setting, choice of 0, 15, 30, 45, 60, 90 s, default 30. The tracker keeps a
  timed history per game; a key shows the newest snapshot at least `delay` old, or the oldest one
  it has when none is old enough (first sight, e.g. after a restart).
- **Layout A:** two team-color rows (abbreviation left, score right) and a 24 px info band at
  y 60–84 with slot number, service monogram, status and speaker. Pregame: larger abbreviations,
  kickoff time in the band ("8:15P", local time). Final: "FINAL", loser's score at 50 % opacity.
  Possession dot after the abbreviation (football possession, baseball batting team). Heard game:
  green band (`#22c55e`, dark ink) instead of the border. Team colors off: same layout on the dark
  key. Update badge moves into the band, left of the speaker.
- **Alerts:** per-key setting, default on. Fires when either score goes up in the key's delayed
  view, never on the first snapshot of a game or on a decrease. Sequence: 6 frames 350 ms apart
  with the scoring team's row alternating white and its color, then the band shows "+N ABBR" in
  that team's fill for 10 s, then the normal key. A new score during a sequence restarts it.
- **Show score:** per-key setting, default on. Keys made before this release get every default.
- **Out of scope:** Focus key, unknown teams, special handling for the heard game, artwork (#14).

## Phase 1: ESPN client and matching

Status: Complete

- [x] Save trimmed real scoreboard responses as fixtures in
      `packages/plugin/test/fixtures/espn/` (fetch to the scratchpad, trim to a few events, write
      with the file tools): NFL, college football, men's college basketball, MLB, NHL, NBA, EPL,
      Champions League. Each should include `pre`, `in` and `post` events where available, a
      halftime, and a baseball half inning.
- [x] Add `packages/plugin/src/scores/feeds.ts`: `LeagueId` → ESPN paths. `ncaa` →
      `football/college-football` (with `groups=80`), `basketball/mens-college-basketball` and
      `basketball/womens-college-basketball` (with `groups=50`); a "Basketball" / "Football" hint in
      the title narrows it. Pool `europe` with no shared league → `soccer/uefa.champions`,
      `soccer/uefa.europa` and both teams' domestic feeds. `intl` → a fixed list of international
      competition feeds (World Cup, qualifiers, Nations League, friendlies, Gold Cup). Export
      `feedsFor(matchup, title): string[]`.
- [x] Add `packages/plugin/src/scores/espn.ts`: `parseScoreboard(json): EspnEvent[]` with event
      id, start time, state (`pre` | `in` | `post`), both competitors (names, `homeAway`, score as a
      number), possession team id, sport. Malformed events are skipped, not thrown.
- [x] Status text for the band in `espn.ts` (`statusText(event, sport)`), from `status.period`,
      `displayClock` and `status.type.name`: football and basketball "Q4 2:08" (college basketball
      "2H 9:15"), "HALF", hockey "P2 12:01", baseball "▲ 7th" / "▼ 7th", soccer "67'" and "HT",
      "FINAL" (also "F/OT"), pregame local time "8:15P". Keep each at 8 characters or fewer.
- [x] Add `packages/plugin/src/scores/match.ts`: `matchEvent(matchup, events)` returns the event
      whose two competitors fold-match the matchup's two teams (by `names` from the team tables),
      plus the scores and possession reordered to the title's order. No match, or more than one,
      returns undefined.
- [x] Tests in `packages/plugin/test/scores.test.ts`: parsing each fixture, status text per sport,
      matching both orders, the code mismatches (Commanders, Warriors, Devils), a European
      cross-league pair, no match and double match.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes, including the new scores tests.
- `pnpm typecheck` and `pnpm lint` pass.

### Phase Summary

Done 2026-10-17. All checks pass: `pnpm test` (shared 688, plugin 166 including 24 new score
tests, extension 78), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.

- **Files:** `packages/plugin/src/scores/{feeds,espn,match}.ts`,
  `packages/plugin/test/scores.test.ts`, eight fixtures in `packages/plugin/test/fixtures/espn/`.
  Fixtures are trimmed real responses (only the fields we read). Events with ids starting
  `9000000` are real events hand-edited into live states that weren't on air at capture time.
- **Shared:** exported `fold` from `title.ts` and added `teamById(teamId)` to `teams/index.ts`
  (team plus league), used by feeds and matching.
- **feeds.ts:** `feedsFor(matchup, title)` returns `Feed` objects (`path`, `sport`, `query`,
  `halves`) instead of strings, because status text needs the sport and halves. `feedKey` and
  `feedUrl` build the map key and URL. Domestic leagues also search their cups (FA Cup, League Cup,
  Copa del Rey, DFB-Pokal, Coppa Italia, Coupe de France), and European clubs also search the
  Conference League. `ucl-extras` clubs only search UEFA feeds. Teams from different pools
  return no feeds.
- **espn.ts:** `parseScoreboard` keeps `displayName`, `shortDisplayName` and `location` as names.
  ESPN's `name` (the mascot) is left out so "Rebels" or "Tigers" can't match the wrong school.
  Possession is the side (`home` / `away`) from `situation.possession`, or Top / Bot in the detail
  for baseball. `statusText(event, feed, { now, timeZone })` covers live, breaks, overtime,
  finals (`F/OT`, `F/SO`, `F/10`, soccer `F/ET` and `F/PK`), postponed and delayed games. Pregame
  shows kickoff from the event's `date`, because soccer's detail just says "Scheduled".
- **match.ts:** `matchEvent(matchup, events, now)` only considers events starting within 18 h of
  now, because soccer feeds return the nearest match day even when it isn't today. When several
  match (an MLB doubleheader), the live game wins, then the closest start. A pair whose names fit
  both ways round is skipped.
- **Changes from the plan text:** status text can be 9 characters ("MON 8:15P" for a kickoff on
  another day); matching takes `now` and picks the best of several matches instead of returning
  undefined; ESPN `name` isn't used for matching.
- **Next (Phase 2):** the tracker should call `feedsFor`, then fetch `feedUrl(feed)`, then run
  `parseScoreboard` and `matchEvent` with the slot's matchup. It can stop polling a game's other
  candidate feeds once one of them has matched it.

## Phase 2: Score tracker

Status: Not started

- [ ] Add `packages/plugin/src/scores/tracker.ts`: `ScoreTracker` with injected `fetch`, clock
      and logger. `setGames(games)` (called from the store subscription) parses each title, keeps
      matchups where both sides have a `teamId`, and works out the feeds to poll.
- [ ] Polling schedule as decided: 15 s while any matched event in a feed is live or past its start
      time, 5 min otherwise, stopped when nothing is matched. Timers `unref`'d.
- [ ] History per event: append a snapshot (`at`, state, status, scores, possession) only when it
      changes; prune entries older than 2 min beyond the longest delay, keeping the newest one.
- [ ] `scoreFor(slot, delayMs)`: the newest snapshot at least `delayMs` old, else the oldest; none
      when the feed's last success is over 2 min old or the slot has no match.
- [ ] Notify subscribers after each poll that changed something, so keys can re-render.
- [ ] Wire it into `packages/plugin/src/plugin.ts`: create the tracker, feed it
      `store.current.games` on every store change, pass it to `SlotAction`.
- [ ] Tests with a fake `fetch` and `vi.useFakeTimers()`: schedule switches between 15 s and 5 min,
      stops with no matched games, only needed feeds are fetched, delay picks the right snapshot,
      first sight shows the oldest, stale feed drops scores, fetch errors are logged and don't
      throw.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes, including the tracker tests.
- `pnpm typecheck` and `pnpm lint` pass.
- `pnpm build` succeeds.

### Phase Summary

_(write when phase completes)_

## Phase 3: Layout A rendering

Status: Not started

- [ ] Add an optional `score` to `SlotKeyView` in `packages/plugin/src/render.ts`: state, status,
      scores in title order, possession index, and an optional `alert`
      (`{ team: 0 | 1, points, mode: "row" | "band", on: boolean }`).
- [ ] Add `scoreboardKey(view)` drawing layout A as in the mockups: rows at y 0–60 and 84–144,
      abbreviation at x 12 (24 px; 30 px pregame), score right-aligned at x 134 (up to 42 px,
      shrunk for 3 digits), possession dot, band with slot disc, monogram, status and speaker,
      green band when heard, loser dimmed at FINAL, dark rows when team colors are off or unknown.
- [ ] Alert frames: `mode: "row"` with `on` fills the scoring row with `#f5f5f5` and dark ink;
      `mode: "band"` fills the band with the scoring team's fill and reads "+N ABBR".
- [ ] `slotKeySvg` uses `scoreboardKey` when `score` is set and the slot holds a matchup; otherwise
      today's paths, unchanged. Move the update badge into the band for this layout.
- [ ] Tests in `packages/plugin/test/render.test.ts` with snapshots: pregame, live with
      possession, halftime, baseball inning, soccer, 3-digit scores, final, heard, team colors off,
      each alert frame, update badge. Existing snapshots must not change.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes; `git diff --stat packages/plugin/test/__snapshots__`
  shows only added snapshots, no changed ones.
- `pnpm typecheck` and `pnpm lint` pass.

### Phase Summary

_(write when phase completes)_

## Phase 4: Slot key integration

Status: Not started

- [ ] `packages/plugin/src/settings.ts`: `showScoreSetting`, `scoreAlertsSetting` (missing means
      on) and `scoreDelaySetting` (one of 0, 15, 30, 45, 60, 90; anything else means 30), with
      tests in `packages/plugin/test/settings.test.ts`.
- [ ] `packages/plugin/src/actions/slot.ts`: read the three settings per key; render with
      `tracker.scoreFor(slot, delay)` when Show score is on; re-render on tracker changes and on a
      1 s tick while any visible key shows a score (skip `setImage` when the SVG is unchanged).
- [ ] Alert sequence per key: compare the delayed snapshot with the last one shown for the same
      event; on an increase, run the 6 row frames at 350 ms, then 10 s of band callout, then the
      normal key. Restart on a new score; clear timers in `onWillDisappear` and when the slot's
      game changes.
- [ ] `packages/plugin/com.rotho.yttv-multiview.sdPlugin/ui/slot.html`: "Show score" and "Score
      alerts" checkboxes, "Score delay" select (0, 15, 30, 45, 60, 90 s, default 30), and a line in
      the help text about ESPN scores and the delay.
- [ ] `packages/plugin/test/fake-extension.ts`: a `--title "<title>"` flag that puts that title in
      slot 1, so a game on today's ESPN slate can be checked on real keys.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` pass.
- `pnpm --filter @rotho/plugin validate` passes.
- `pnpm build` succeeds.

### Phase Summary

_(write when phase completes)_

## Phase 5: Docs and hardware check

Status: Not started

- [ ] `PRIVACY.md`: under the Stream Deck plugin, describe the ESPN requests (which games trigger
      them, how often, that they hold only league names, and that ESPN sees the IP address).
- [ ] `README.md`: Game Slot scores, alerts and the three settings in the Keys section; a line in
      How it works.
- [ ] `CHANGELOG.md`: an Unreleased section with the new scores and settings, noting that only the
      plugin needs updating.
- [ ] User check on hardware during a live game: run the dev build plus
      `pnpm --filter @rotho/plugin fake-extension --title "<a game live on ESPN now>"`, then confirm
      score, status, delay and an alert on real keys. Record the result in the Phase Summary.

### Verification Plan

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- The hardware check above is done by the user and recorded here.

### Phase Summary

_(write when phase completes)_

## Final Recap

_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan

_(write when all phases complete: step-by-step deployment instructions)_
