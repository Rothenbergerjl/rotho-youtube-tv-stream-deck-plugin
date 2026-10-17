# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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
