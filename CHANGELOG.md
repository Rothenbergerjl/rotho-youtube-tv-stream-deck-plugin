# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.7.0] - 2026-10-18

Game Slot and Focus Heard Game keys share the score layout, and score alerts are easier to spot.
Only the plugin changed; the extension's version moves to 0.7.0 to stay in step, with no code
changes, so there's no need to wait for Chrome to update it.

### Changed

- **Score alerts** are easier to spot: the scoring team's row and the points in the band
  ("+3 BUF") flash yellow instead of white, and faster, for about two seconds. Teams whose color
  is yellow or gold flash white. The points then stay in the team's color for 10 seconds, as
  before.
- **Game Slot and Focus Heard Game keys share one look** for games between two teams: a row per
  team in its colors and a band across the middle, as on keys with a score. Game Slot keys
  without a score (Show score off, or a league without scores) show the slot, service and speaker
  in the band, which turns green for the game you're hearing. Focus Heard Game shows the crosshair
  and service in a green band, with no score. With Team colors off, or for teams the plugin
  doesn't know, the rows are dark. The update arrow sits in the band on these keys, and the "@" or
  "v" between the teams is gone.

## [0.6.0] - 2026-10-17

Game Slot keys show the live score, with an alert when a team scores. Only the plugin changed; the
extension's version moves to 0.6.0 to stay in step, with no code changes, so there's no need to
wait for Chrome to update it.

### Added

- **Live scores** on Game Slot keys for games between two teams the plugin knows: each team gets
  a row in its colors with its abbreviation and score, and a band across the middle shows the slot,
  service and game status (clock and period, inning, soccer minute, kickoff time, or FINAL). A dot
  marks the team with the ball or at bat, and the losing score dims at the final. Scores come from
  ESPN's public scoreboard for every league the plugin knows.
- **Score alerts:** when a team scores, its row flashes white, then the band shows the points
  ("+3 BUF") in that team's color for 10 seconds.
- Three Game Slot settings: **Show score** and **Score alerts** (both on by default) and **Score
  delay** (none to 90 seconds, default 30), which holds new scores back so the key doesn't spoil
  plays the stream hasn't shown yet.

### Changed

- With a score on the key, the game you're hearing turns the middle band green instead of
  drawing a green border, and the update arrow sits in the band.
- The plugin now contacts ESPN while a slot holds a game between known teams; see the
  [privacy policy](PRIVACY.md).

## [0.5.0] - 2026-10-17

Peacock and Paramount+ games work alongside YouTube TV. Update both the plugin and the extension.
With an older extension the new services don't appear, and an Open Service key set to Peacock or
Paramount+ shows "Update extension"; everything else keeps working. The extension doesn't ask for
any new permission on update.

If a Peacock or Paramount+ game stays silent when you press its key, unmute the player itself once
with its speaker button; both services remember their own mute setting.

### Added

- **Peacock and Paramount+** player tabs take Game Slots and switch audio just like YouTube TV,
  in any mix. Peacock live events and clips, Paramount+ live channels and Paramount+ shows and
  movies are tracked.
- An **options page** in the extension with a switch per service. YouTube TV is always on and
  Peacock is on by default. Paramount+ is off until you turn it on; Chrome then asks for access to
  paramountplus.com, which is used only to read the program name on live channels.
- A **service badge** in the bottom-left corner of Game Slot and Focus Heard Game keys: red "TV"
  for YouTube TV, black "P" for Peacock, blue "P+" for Paramount+.
- A **Service** setting on the Open key (YouTube TV, Peacock or Paramount+). For a service that's
  off, the key shows "Turn on", and pressing it opens the extension's options.

### Changed

- **Open YouTube TV** is now called **Open Service**. Existing keys keep opening YouTube TV.
- Paramount+ live keys show the program with the channel, so league names help pick team colors
  (for example "Bologna vs. Inter (Serie A)").
- Turning a service off frees its games' slots and gives those tabs their sound back.
- Text on Game Slot and Focus Heard Game keys sits a little higher, and the bottom team's
  abbreviation a little further right, to make room for the badge.

## [0.4.0] - 2026-10-17

Game keys show the two teams' colors. Only the plugin changed; the extension's version moves to
0.4.0 to stay in step, with no code changes, so there's no need to wait for Chrome to update it.

### Added

- **Team colors** on Game Slot and Focus Heard Game keys: a known matchup splits the key into the
  away team's color on top and the home team's on the bottom, each with its abbreviation. The
  slot number, speaker and green "heard" border stay on top. Covers every team the plugin knows:
  NFL, NBA, WNBA, MLB, NHL, the major college conferences, the soccer leagues and national teams.
- When both teams' colors are too alike (Bills and Rams, both royal blue), the home team uses its
  second color. Text turns dark on light colors such as gold or white.
- A **Team colors** checkbox in the Game Slot settings and in new Focus Heard Game settings. It's
  on by default; turn it off for the plain text look.

### Changed

- Games between teams the plugin doesn't know, and shows that aren't games, look the same as
  before. If only one team is known, the other half uses the normal dark key background.

## [0.3.0] - 2026-10-17

Two new keys. Update both the plugin and the extension to use them; with an older extension
they show "Update extension" while the other keys keep working.

### Added

- **Open YouTube TV** key: opens YouTube TV in a new Chrome window, or a new tab if you pick
  **New tab** in the key's settings. The new game starts muted and takes the next free slot. The
  key shows "Full" when all 15 slots are taken.
- **Focus Heard Game** key: shows the game you're hearing; press it to bring that game's Chrome
  window and tab to the front.
- Short matchups for more than the NFL: NBA, WNBA, MLB, NHL, major college teams (ACC, Big Ten,
  Big 12, SEC and Notre Dame), soccer (Premier League, EFL Championship, LaLiga, Bundesliga,
  Serie A, Ligue 1, Champions League regulars, Liga MX) and national teams. For example
  "BOS @ LAL", "MCI v ARS", "USA v MEX". Other games show a short form of each team, such as
  "GONZ @ SAIN".

### Changed

- The extension now tells the plugin which optional features it supports. An older extension no
  longer blocks every key when only a new feature is missing; only the keys that need it ask for
  an update.
- "vs" matchups show as "v" so they fit on one line ("KC v BUF" instead of "KC vs BUF").
- Long non-game titles are cut at a word boundary and drop filler like "Live:" and "(New)"; shows
  with an episode name keep just the show name ("The Simpsons").
- Smaller extension download: the team lists now ship only in the plugin.

## [0.2.0] - 2026-10-16

Easier install and upgrades. If you installed the extension with **Load unpacked**, remove it in
`chrome://extensions` and install it from the Chrome Web Store instead (see the README).

### Added

- The Chrome extension is in the Chrome Web Store (unlisted, install by link) and updates itself.
  No Developer mode or unzipped folder needed.
- Keys show "Update plugin" or "Update extension" when the two pieces can't talk to each other,
  and ignore presses until they match.
- The plugin checks GitHub for a newer release on start and every 12 hours. Keys show a small blue
  arrow when one is available, and the Game Slot settings link to it.
- Extension icons.
- [Privacy policy](PRIVACY.md) and [security policy](SECURITY.md).

### Changed

- The repository and releases are public, so the plugin can be downloaded without a GitHub
  account.
- README install and upgrade steps rewritten for non-developers.

## [0.1.0] - 2026-10-11

First release.

### Added

- **Game Slot** Stream Deck action: shows the YouTube TV game in its slot (slot number, short
  matchup such as "SF @ SEA", and whether you're hearing it). Press to hear only that game.
  New keys number themselves 1, 2, 3…; change a key's slot in its settings.
- **Mute All** action: mutes every game; press again to bring back the last game you heard.
- Chrome extension that tracks `tv.youtube.com` tabs, gives each game a stable slot in the order
  it opened, starts new games muted, and reads the matchup from the player.
- Keys show "No Chrome" when the extension isn't connected; it reconnects automatically.
- Localhost-only connection between Chrome and the plugin, restricted to this extension's ID.
