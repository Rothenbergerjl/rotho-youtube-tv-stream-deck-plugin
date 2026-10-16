# Privacy Policy

Rotho YTTV Multiview is a Chrome extension and a Stream Deck plugin that work together on your
computer. Neither one collects, sells or shares personal data.

## Chrome extension

- **What it reads:** for open `tv.youtube.com` tabs only, the tab ID, the tab title, the game
  matchup shown in the player, and whether the tab is muted.
- **Where it goes:** only to the Rotho YTTV Multiview Stream Deck plugin on your own computer, over
  a local connection to `127.0.0.1:47731`. Nothing is sent over the internet.
- **What it stores:** the open YouTube TV tabs (ID, title, slot) and which one you're hearing, in
  Chrome's session storage so the extension survives being restarted. Chrome clears it when the
  browser closes, and closed tabs are dropped from it.
- **What it changes:** it mutes and unmutes YouTube TV tabs when you press a Stream Deck key.
- It does not read pages other than YouTube TV, your browsing history, cookies, account details or
  anything you type.

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
