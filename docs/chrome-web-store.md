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
audio between YouTube TV, Peacock and Paramount+ tabs.`
- Description:

  ```text
  Watch several games at once on YouTube TV, Peacock and Paramount+, and pick which one you hear
  from your Stream Deck.

  This extension is the Chrome half of Rotho YTTV Multiview. It needs the Rotho YTTV Multiview
  Stream Deck plugin (Windows, Stream Deck 7.1+), available from
  https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases

  How it works:
  • Open each game in its own Chrome window or tab, on any mix of services.
  • Each game appears on a Stream Deck "Game Slot" key with its matchup (e.g. "SF @ SEA") and a
    small badge for its service.
  • Press a key to hear only that game; every other game tab is muted.
  • A "Mute All" key mutes everything or brings back the last game.
  • An "Open Service" key opens YouTube TV, Peacock or Paramount+ in a new Chrome window or tab.
  • A "Focus Heard Game" key brings the window and tab of the game you're hearing to the front.
  • New game tabs start muted, so opening a game never interrupts the one you're hearing.

  Services: YouTube TV is always on and Peacock is on by default. Turn Paramount+ on in the
  extension's options; Chrome then asks for access to paramountplus.com, used only to read the
  program name on live channels.

  Privacy: the extension only looks at the game pages of the services you turn on and talks only
  to the Stream Deck plugin on your own computer (127.0.0.1). Nothing is sent over the internet.

  Not affiliated with YouTube, Google, Peacock, NBCUniversal, Paramount or Elgato.
  ```

- Category: Productivity → Tools. Language: English.
- Icon: `icons/icon-128.png` from the zip (also in `packages/extension/dist/icons/` after
  `pnpm build`).
- Screenshots (at least one, 1280×800 PNG or JPEG): Chrome with two or three YouTube TV games side
  by side and the Stream Deck app showing Game Slot keys (one green, heard). Optional small promo
  tile 440×280.
- Homepage and support URL: `https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`

## Privacy tab

- Single purpose: `Mutes and unmutes streaming TV tabs (YouTube TV, Peacock, Paramount+) and
reports which games are open, so the Rotho YTTV Multiview Stream Deck plugin can show each game on
a key and switch which one is heard.`
- Permission justifications:
  - `tabs`: `Finds open YouTube TV, Peacock and Paramount+ player tabs by their address, reads the
Peacock and Paramount+ video tab titles to label Stream Deck keys, and mutes or unmutes those tabs
when a key is pressed. Also opens a new tab or window of a service, and brings a game's tab to the
front, when the matching key is pressed.`
  - `storage`: `Keeps the slot assignments and the currently heard tab in session storage so they
survive the service worker restarting, and saves which services the user turned on in the options
page.`
  - `alarms`: `Wakes the service worker periodically to reconnect to the local Stream Deck plugin
and keep the connection alive.`
  - `scripting`: `Injects the content script into YouTube TV tabs that were already open when the
extension was installed or updated, so their game titles appear without a reload. When the user
turns Paramount+ on, registers the Paramount+ live-channel content script and injects it into
live tabs that are already open.`
  - Host permission `https://tv.youtube.com/*`: `Reads the game matchup from the YouTube TV player,
since the page title is always "Home - YouTube TV".`
  - Optional host permission `https://www.paramountplus.com/*`: `Requested only when the user turns
Paramount+ on in the extension's options, and given back when they turn it off. Reads the program
and channel names from the Paramount+ live player, since the live tab title is only the channel
name. Nothing else on the site is read.`
- Remote code: `No, I am not using remote code.`
- Data usage: tick **Website content** (tab titles and the player's program text). Tick all three
  certifications (not sold, not used for unrelated purposes, not used for credit decisions).
- Privacy policy URL:
  `https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/blob/main/PRIVACY.md`

## Options page

The extension has an options page (`options.html`, opened in its own tab from
`chrome://extensions` → Details → Extension options, or by pressing an Open Service key that shows
"Turn on"). It has one switch per service: YouTube TV (always on), Peacock (on by default) and
Paramount+ (off by default; turning it on asks for the optional host permission above). A
screenshot of it can go in the listing's screenshots.

## Distribution tab

- Visibility: **Unlisted**. Regions: all. Free.

## How the item kept its ID

The store normally assigns a new ID. For the first upload (a draft, 2026-10-16) the zip had the
private key from `~/.config/rotho-yttv-multiview/extension-key.pem` at its root as `key.pem`, and
no `key` field in `manifest.json` (the store rejects it: "key field is not allowed in manifest").
The store took the ID from `key.pem`. Later uploads use the normal release zip and don't need the
private key.
