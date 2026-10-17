# Privacy Policy

Rotho YTTV Multiview is a Chrome extension and a Stream Deck plugin that work together on your
computer. Neither one collects, sells or shares personal data.

## Chrome extension

- **What it reads:** the address of each open tab, to find player pages of the services you've
  turned on. For those player tabs only, it reads the tab ID, whether the tab is muted, and the
  program name:
  - **YouTube TV** (`tv.youtube.com`): the game matchup shown in the player.
  - **Peacock** (`www.peacocktv.com/watch/playback/…`): the tab title.
  - **Paramount+** (`www.paramountplus.com`), only after you turn it on and allow access to the
    site: on live channels (`/live-tv/stream/…`), the program and channel names shown in the
    player; on videos (`/shows/video/…`, `/movies/video/…`), the tab title.
- **Where it goes:** only to the Rotho YTTV Multiview Stream Deck plugin on your own computer, over
  a local connection to `127.0.0.1:47731`. Nothing is sent over the internet.
- **What it stores:**
  - The open game tabs (ID, title, service, slot) and which one you're hearing, in Chrome's
    session storage so the extension survives being restarted. Chrome clears it when the browser
    closes, and closed tabs are dropped from it.
  - Which services you've turned on, in Chrome's local extension storage, until you change it or
    remove the extension.
- **What it changes:** it mutes and unmutes game tabs when you press a Stream Deck key or turn a
  service off.
- It does not read the content of other pages, your browsing history, cookies, account details or
  anything you type. Turning Paramount+ off gives back its access to paramountplus.com.

## Stream Deck plugin

- Receives the data above from the extension and shows it on your Stream Deck keys. It writes a
  local log file in the Stream Deck plugins folder.
- About every 12 hours it asks GitHub's public API for the latest release of this project, to
  show when an update is available. The request contains no personal data; GitHub sees your IP
  address as with any web request (see
  [GitHub's privacy statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)).

## No analytics

There are no accounts, analytics, tracking or ads.

## Contact

Questions: open an issue at
<https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/issues>.
