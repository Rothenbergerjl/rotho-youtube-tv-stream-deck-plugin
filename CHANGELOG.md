# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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
