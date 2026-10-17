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

Status: Complete

- [x] Add `packages/plugin/src/scores/tracker.ts`: `ScoreTracker` with injected `fetch`, clock
      and logger. `setGames(games)` (called from the store subscription) parses each title, keeps
      matchups where both sides have a `teamId`, and works out the feeds to poll.
- [x] Polling schedule as decided: 15 s while any matched event in a feed is live or past its start
      time, 5 min otherwise, stopped when nothing is matched. Timers `unref`'d.
- [x] History per event: append a snapshot (`at`, state, status, scores, possession) only when it
      changes; prune entries older than 2 min beyond the longest delay, keeping the newest one.
- [x] `scoreFor(slot, delayMs)`: the newest snapshot at least `delayMs` old, else the oldest; none
      when the feed's last success is over 2 min old or the slot has no match.
- [x] Notify subscribers after each poll that changed something, so keys can re-render.
- [x] Wire it into `packages/plugin/src/plugin.ts`: create the tracker, feed it
      `store.current.games` on every store change, pass it to `SlotAction`.
- [x] Tests with a fake `fetch` and `vi.useFakeTimers()`: schedule switches between 15 s and 5 min,
      stops with no matched games, only needed feeds are fetched, delay picks the right snapshot,
      first sight shows the oldest, stale feed drops scores, fetch errors are logged and don't
      throw.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes, including the tracker tests.
- `pnpm typecheck` and `pnpm lint` pass.
- `pnpm build` succeeds.

### Phase Summary

Done 2026-10-17. All checks pass: `pnpm test` (plugin 174 including 8 new tracker tests),
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`.

- **Files:** `packages/plugin/src/scores/tracker.ts`, `packages/plugin/test/tracker.test.ts`;
  `plugin.ts` creates the tracker and feeds it the store's games; `SlotAction` takes it as a third
  constructor argument and re-renders on its changes (it doesn't read scores yet; Phase 4).
- **API:** `setGames(games)`, `scoreFor(slot, delayMs)` returning a `ScoreSnapshot`
  (`eventId`, `state`, `status`, `scores` in title order, optional `possession` index),
  `subscribe(listener)`, `stop()`. Constants `LIVE_INTERVAL_MS`, `IDLE_INTERVAL_MS`, `STALE_MS`,
  `MAX_DELAY_MS` are exported.
- **Scheduling:** one timer for the soonest due feed. Each feed has its own next time, 15 s when
  a slot matched in it is live or past its kickoff time, else 5 min. A slot's candidate feeds are
  all polled until one matches, then only that one. A newly added game is looked up right away,
  even in a feed already on a timer. A failed fetch retries on the same schedule.
- **History:** snapshots are compared as JSON and appended only when they change; the status text
  is part of the snapshot, so the clock ticking adds entries every live poll. A new event id in a
  slot clears its history. Pruning keeps the newest entry at least 90 s old and everything after.
- **Changes from the plan text:** a slot with two known teams but no match yet still has its
  candidate feeds polled every 5 min, so a game is found when ESPN lists it. Polling stops only
  when no slot holds two known teams. Stale means more than 2 min since the feed's last success,
  so a key with an alert still running could lose its score mid-sequence; Phase 4 should handle
  that.
- **Next (Phase 3):** rendering takes a `ScoreSnapshot`-shaped `score` on `SlotKeyView`.

## Phase 3: Layout A rendering

Status: Not started

- [x] Add an optional `score` to `SlotKeyView` in `packages/plugin/src/render.ts`: state, status,
      scores in title order, possession index, and an optional `alert`
      (`{ team: 0 | 1, points, mode: "row" | "band", on: boolean }`).
- [x] Add `scoreboardKey(view)` drawing layout A as in the mockups: rows at y 0–60 and 84–144,
      abbreviation at x 12 (24 px; 30 px pregame), score right-aligned at x 134 (up to 42 px,
      shrunk for 3 digits), possession dot, band with slot disc, monogram, status and speaker,
      green band when heard, loser dimmed at FINAL, dark rows when team colors are off or unknown.
- [x] Alert frames: `mode: "row"` with `on` fills the scoring row with `#f5f5f5` and dark ink;
      `mode: "band"` fills the band with the scoring team's fill and reads "+N ABBR".
- [x] `slotKeySvg` uses `scoreboardKey` when `score` is set and the slot holds a matchup; otherwise
      today's paths, unchanged. Move the update badge into the band for this layout.
- [x] Tests in `packages/plugin/test/render.test.ts` with snapshots: pregame, live with
      possession, halftime, baseball inning, soccer, 3-digit scores, final, heard, team colors off,
      each alert frame, update badge. Existing snapshots must not change.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes; `git diff --stat packages/plugin/test/__snapshots__`
  shows only added snapshots, no changed ones.
- `pnpm typecheck` and `pnpm lint` pass.

### Phase Summary

Done 2026-10-17. All checks pass: `pnpm test` (plugin 189 including 15 new scoreboard tests),
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`. The snapshot file gained 11
entries (22 lines added) and no existing snapshot changed.

- **API:** `ScoreView` (`state`, `status`, `scores`, `possession?`, `alert?`) and `ScoreAlert`
  are exported from `render.ts`; a tracker `ScoreSnapshot` fits `ScoreView` as is.
  `slotKeySvg` tries `scoreboardKey(view)` first. That needs a score, a connection, no protocol
  mismatch, and a title that parses as a matchup. Otherwise it draws exactly today's key.
- **Layout:** rows at y 0–60 and 84–144 in team colors (`teamSplit`, so clashing colors are
  already resolved), dark `#111418` with Team colors off or unknown teams. The band at y 60–84 is
  `#0a0a0a`, or `#22c55e` with `#06210f` ink when heard.
  - **Sizing:** scores are 42 px, 38 px for three digits. Abbreviations are 24 px (30 px pregame,
    with no scores) and shrink to clear the score, e.g. NYK at 20 px beside 112, GONZ at 22 px.
    The status is centred between the monogram and the speaker, up to 14 px, shrinking to fit
    ("MON 8:15P" is 13 px, or 9 px when the update badge takes room).
  - **Update badge:** a smaller 8 px badge at (106, 72) in the band replaces the corner badge.
- **Alerts:** a row frame with `on` paints that row `#f5f5f5` with dark ink; an "off" frame is
  identical to the normal key. A band frame paints the band in the scoring team's row color with
  "+N ABBR"; on a team without colors that band is dark, and only the text marks it.
- **Helper change:** `text()` takes an optional anchor and opacity; existing output is
  byte-identical.
- **Visual check:** the snapshots, rendered to PNG with headless Edge at 144 px and key size,
  match the mockups.
- **Next (Phase 4):** pass `tracker.scoreFor(slot, delay)` as `score` and drive `alert` frames
  from `SlotAction`.

## Phase 4: Slot key integration

Status: Complete

- [x] `packages/plugin/src/settings.ts`: `showScoreSetting`, `scoreAlertsSetting` (missing means
      on) and `scoreDelaySetting` (one of 0, 15, 30, 45, 60, 90; anything else means 30), with
      tests in `packages/plugin/test/settings.test.ts`.
- [x] `packages/plugin/src/actions/slot.ts`: read the three settings per key; render with
      `tracker.scoreFor(slot, delay)` when Show score is on; re-render on tracker changes and on a
      1 s tick while any visible key shows a score (skip `setImage` when the SVG is unchanged).
- [x] Alert sequence per key: compare the delayed snapshot with the last one shown for the same
      event; on an increase, run the 6 row frames at 350 ms, then 10 s of band callout, then the
      normal key. Restart on a new score; clear timers in `onWillDisappear` and when the slot's
      game changes.
- [x] `packages/plugin/com.rotho.yttv-multiview.sdPlugin/ui/slot.html`: "Show score" and "Score
      alerts" checkboxes, "Score delay" select (0, 15, 30, 45, 60, 90 s, default 30), and a line in
      the help text about ESPN scores and the delay.
- [x] `packages/plugin/test/fake-extension.ts`: a `--title "<title>"` flag that puts that title in
      slot 1, so a game on today's ESPN slate can be checked on real keys.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes.
- `pnpm typecheck`, `pnpm lint` and `pnpm format:check` pass.
- `pnpm --filter @rotho/plugin validate` passes.
- `pnpm build` succeeds.

### Phase Summary

Done 2026-10-17. All checks pass: `pnpm test` (plugin 220, including 31 new settings and alert
tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and
`streamdeck validate`. A Node `fetch` of the college football feed with the plugin's headers
returned 200 with 13 live games. ESPN refuses some clients (WebFetch got 403), so the hardware
check should confirm the plugin's own requests in its log.

- **Settings:** `showScoreSetting` and `scoreAlertsSetting` (missing or anything but
  `false`/"false" means on) and `scoreDelaySetting` (seconds, one of `SCORE_DELAYS`, else 30).
  The panel has two checkboxes, a "Score delay" select ("None" to "90 seconds") and a help
  paragraph.
- **Alert logic:** `packages/plugin/src/score-alerts.ts`, free of the SDK and unit-tested.
  `nextScoreState(prev, snapshot, now, alertsOn)` returns the key's state: an alert starts on any
  increase for the same event, and the bigger gain picks the team. It's kept while running,
  restarted on a new score, and dropped when done or when alerts are turned off. No snapshot
  clears the state, so a score returning after a stale feed or Show score off doesn't alert.
  `alertFrame(state, now)` turns elapsed time into a frame: 6 row frames of 350 ms (white on even
  frames), then 10 s of band callout.
- **SlotAction:** one options map per key (team colors, show score, alerts, delay in ms), a
  score state per key (two keys on one slot can have different delays), and the last image per
  key so an unchanged image isn't sent again. A single timer re-renders all keys every 350 ms
  while an alert runs, every 1 s while any key shows a score, and stops otherwise. Disconnects,
  protocol mismatches and Show score off draw today's key.
- **fake-extension:** `--title "<title>"` (and the exported `stateWithTitle`) puts the title in
  slot 1 as the heard game.
- **Not covered by tests:** `SlotAction` itself, as before; it needs the Stream Deck SDK. The
  Phase 5 hardware check covers it.

## Phase 5: Docs and hardware check

Status: Complete

- [x] `PRIVACY.md`: under the Stream Deck plugin, describe the ESPN requests (which games trigger
      them, how often, that they hold only league names, and that ESPN sees the IP address).
- [x] `README.md`: Game Slot scores, alerts and the three settings in the Keys section; a line in
      How it works.
- [x] `CHANGELOG.md`: an Unreleased section with the new scores and settings, noting that only the
      plugin needs updating. (Done as a `[0.6.0] - 2026-10-17` section instead; see below.)
- [x] Version 0.6.0 (asked for by the user during this phase): root `package.json` plus every
      package and both manifests (`0.6.0.0` for Stream Deck); `node scripts/sync-version.mjs
      --check` passes, and `node scripts/changelog-section.mjs 0.6.0` prints the new section.
- [x] User check on hardware during a live game: run the dev build plus
      `pnpm --filter @rotho/plugin fake-extension --title "<a game live on ESPN now>"`, then confirm
      score, status, delay and an alert on real keys. Record the result in the Phase Summary.

### Verification Plan

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- The hardware check above is done by the user and recorded here.

### Phase Summary

Done 2026-10-17. All checks pass: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
(shared 688, plugin 220, extension 78), `pnpm build`, `streamdeck validate`, and
`node scripts/sync-version.mjs --check`.

- **Hardware check (user, 2026-10-17, college football live):** score, status, delay and an alert
  all looked right on real keys.
- **PRIVACY.md:** new Stream Deck plugin bullet on the ESPN requests. It covers when they happen
  (a slot holds a game between known teams), how often (15 s live, 5 min otherwise), and what they
  contain (only the league path). ESPN sees the IP address, with a link to Disney's privacy policy.
  It also says Show score off only hides the score; requests continue while the game is in a slot,
  because the tracker polls per slot, not per key.
- **README.md:**
  - Keys: a new Game Slot row and a "Live scores on Game Slot keys" list (layout, alerts, delay,
    the three settings).
  - Troubleshooting: a "A game shows no score" entry.
  - How it works: a bullet on `packages/plugin/src/scores/`, and the network sentence now
    includes ESPN.
- **CHANGELOG.md:** a `[0.6.0] - 2026-10-17` section (Added and Changed) instead of Unreleased,
  because the user asked for the version bump.
- **Version:** 0.6.0 everywhere; the Stream Deck manifest is `0.6.0.0`. The extension has no code
  changes, only the version.

## Final Recap

Game Slot keys now show the live score from ESPN in the "Scoreboard" layout, with an alert when a
team scores (#22, from the #16 investigation and mockups). The extension and the WebSocket
protocol are unchanged; everything new is in the plugin, plus two small helpers in
`@rotho/shared` (`fold` exported, `teamById` added).

- **Feed and matching** (`packages/plugin/src/scores/feeds.ts`, `espn.ts`, `match.ts`): every
  league in the team tables maps to its ESPN feeds. That includes college football and both
  basketball feeds narrowed by the title, domestic cups, UEFA competitions for European clubs, and
  international competitions. Games are matched by team name, both ways round, within 18 h of now,
  preferring a live game. Status text covers every sport, breaks, overtime, finals, postponements
  and kickoff times.
- **Tracker** (`scores/tracker.ts`): polls only the feeds the slots need, every 15 s while live and
  every 5 min otherwise. It keeps a timed history per slot, so `scoreFor(slot, delay)` gives the
  score as it was `delay` ago. A feed that hasn't answered for 2 min drops its scores.
- **Rendering** (`render.ts`): layout A, with team-color rows, an info band, a possession dot, the
  loser dimmed at the final, a green band when heard, and the update badge in the band, plus both
  alert frames. Today's keys render byte-identically when there's no score.
- **Key** (`actions/slot.ts`, `score-alerts.ts`): per-key Show score, Score alerts and Score delay
  (0–90 s, default 30). The alert is a white row flash, then a 10 s "+N TEAM" band, driven by one
  timer, and unchanged images aren't re-sent.
- **Docs and release:** PRIVACY, README, CHANGELOG 0.6.0, version 0.6.0.
- **Deviations** (commented on #22): matching takes `now` and picks the best of several matches;
  status text can be 9 characters; ESPN mascot names aren't matched; unmatched games with two
  known teams are polled every 5 min until found.
- **Known limit:** Show score off hides the score but doesn't stop the ESPN requests for that
  slot (documented in PRIVACY.md).

## Deployment Plan

1. Commit Phase 5 with this plan file deleted, push `22-live-scores-and-flash`, and open the PR
   (`/open-pr`) with `Fixes #22`. Squash-merge to `main` once CI passes.
2. Release from `main` as in the README's Release section: GitHub **Actions → Release → Run
   workflow**, version `0.6.0`. The workflow checks, builds, tags `v0.6.0` and publishes the GitHub
   Release with the `.streamDeckPlugin` and the extension zip. Release notes come from the
   CHANGELOG `[0.6.0]` section.
3. Installed plugins show the update badge within 12 hours. Users install the new
   `.streamDeckPlugin`; their Game Slot keys get scores with the default settings.
4. The extension only changed its version. Uploading the 0.6.0 zip to the Chrome Web Store keeps
   versions in step, but it isn't urgent: a 0.5.0 extension works with the 0.6.0 plugin, because
   the protocol and features are unchanged.
5. After release, watch the plugin log on a live game day for `Scores: … failed` lines, in case
   ESPN starts refusing the plugin's requests.
