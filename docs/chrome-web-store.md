# Chrome Web Store listing

The extension is published as an **unlisted** item in the Chrome Web Store: anyone with the link
can install it, and Chrome keeps it updated. This page holds the listing text so it can be pasted
into the [developer dashboard](https://chrome.google.com/webstore/devconsole) and kept in sync
with the code.

- Item ID: `decadhapokljmmbknbfcpjckddhiicmg` (same as the ID derived from the manifest `key`)
- Store page: <https://chromewebstore.google.com/detail/decadhapokljmmbknbfcpjckddhiicmg>
- Upload: the `yttv-multiview-extension-<version>.zip` from a GitHub release (see README →
  Release). Its manifest leaves out `key`, which the store rejects.

Update this page when the extension's behaviour or permissions change, and paste the changes into
the dashboard with the next upload.

## Store listing tab

- Name: `Rotho YTTV Multiview` (from the manifest)
- Summary: the manifest `description`, `Lets the Rotho YTTV Multiview Stream Deck plugin switch
audio between YouTube TV tabs.`
- Description:

  ```text
  Watch several YouTube TV games at once and pick which one you hear from your Stream Deck.

  This extension is the Chrome half of Rotho YTTV Multiview. It needs the Rotho YTTV Multiview
  Stream Deck plugin (Windows, Stream Deck 7.1+), available from
  https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases

  How it works:
  • Open each YouTube TV game in its own Chrome window or tab.
  • Each game appears on a Stream Deck "Game Slot" key with its matchup (e.g. "SF @ SEA").
  • Press a key to hear only that game; every other YouTube TV tab is muted.
  • A "Mute All" key mutes everything or brings back the last game.
  • An "Open YouTube TV" key opens YouTube TV in a new Chrome window or tab.
  • A "Focus Heard Game" key brings the window and tab of the game you're hearing to the front.
  • New YouTube TV tabs start muted, so opening a game never interrupts the one you're hearing.

  Privacy: the extension only looks at tv.youtube.com tabs and talks only to the Stream Deck plugin
  on your own computer (127.0.0.1). Nothing is sent over the internet.

  Not affiliated with YouTube, Google or Elgato.
  ```

- Category: Productivity → Tools. Language: English.
- Icon: `icons/icon-128.png` from the zip (also in `packages/extension/dist/icons/` after
  `pnpm build`).
- Screenshots (at least one, 1280×800 PNG or JPEG): Chrome with two or three YouTube TV games side
  by side and the Stream Deck app showing Game Slot keys (one green, heard). Optional small promo
  tile 440×280.
- Homepage and support URL: `https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`

## Privacy tab

- Single purpose: `Mutes and unmutes YouTube TV tabs and reports which games are open, so the
Rotho YTTV Multiview Stream Deck plugin can show each game on a key and switch which one is
heard.`
- Permission justifications:
  - `tabs`: `Finds open tv.youtube.com tabs, reads their titles to label Stream Deck keys, and
mutes or unmutes them when a key is pressed. Also opens a new YouTube TV tab or window, and brings
a game's tab to the front, when the matching key is pressed.`
  - `storage`: `Keeps the slot assignments and the currently heard tab in session storage so they
survive the service worker restarting.`
  - `alarms`: `Wakes the service worker periodically to reconnect to the local Stream Deck plugin
and keep the connection alive.`
  - `scripting`: `Injects the content script into YouTube TV tabs that were already open when the
extension was installed or updated, so their game titles appear without a reload.`
  - Host permission `https://tv.youtube.com/*`: `Reads the game matchup from the YouTube TV player,
since the page title is always "Home - YouTube TV". No other sites are accessed.`
- Remote code: `No, I am not using remote code.`
- Data usage: tick **Website content** (tab titles and the player's matchup text). Tick all three
  certifications (not sold, not used for unrelated purposes, not used for credit decisions).
- Privacy policy URL:
  `https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/blob/main/PRIVACY.md`

## Distribution tab

- Visibility: **Unlisted**. Regions: all. Free.

## How the item kept its ID

The store normally assigns a new ID. For the first upload (a draft, 2026-10-16) the zip had the
private key from `~/.config/rotho-yttv-multiview/extension-key.pem` at its root as `key.pem`, and
no `key` field in `manifest.json` (the store rejects it: "key field is not allowed in manifest").
The store took the ID from `key.pem`. Later uploads use the normal release zip and don't need the
private key.
