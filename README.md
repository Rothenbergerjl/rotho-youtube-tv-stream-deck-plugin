# Rotho YTTV Multiview

Watch several YouTube TV games at once in separate Chrome windows and use a Stream Deck to choose
which one you hear. Each open game appears on a Stream Deck key; pressing a key unmutes that game
and mutes the rest.

> Status: in development. See [`plans/yttv-multiview.md`](plans/yttv-multiview.md) and issue #1.

## How it works

```
 Chrome (tv.youtube.com tabs)                       Stream Deck app
 ┌──────────────────────────────┐   WebSocket       ┌──────────────────────────────┐
 │ @rotho/extension (MV3)       │ ◄──────────────►  │ @rotho/plugin (Node SDK)     │
 │ - tracks YouTube TV tabs     │  127.0.0.1:47731  │ - WebSocket server           │
 │ - assigns slots, mutes tabs  │                   │ - Game Slot / Mute All keys  │
 │ - source of truth for state  │                   │ - draws titles + audio state │
 └──────────────────────────────┘                   └──────────────────────────────┘
                     both use @rotho/shared (protocol types + constants)
```

- The extension connects to the plugin; the plugin only accepts the extension's fixed origin.
- Slots are assigned in the order games open and stay fixed until that game closes.
- New YouTube TV tabs start muted.

## Repository layout

| Path                 | Package            | What                                                 |
| -------------------- | ------------------ | ---------------------------------------------------- |
| `packages/shared`    | `@rotho/shared`    | Message types, constants (port, UUIDs, extension ID) |
| `packages/extension` | `@rotho/extension` | Chrome Manifest V3 extension, bundled with esbuild   |
| `packages/plugin`    | `@rotho/plugin`    | Stream Deck plugin, bundled with Rollup              |

## Development setup

Requirements: Windows, Node.js 24+, Stream Deck app 7.1+, Chrome 116+.

```bash
npm i -g pnpm
pnpm install
pnpm build
```

Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`,
`pnpm --filter @rotho/plugin validate`, `pnpm --filter @rotho/plugin watch` (rebuild and restart
the plugin on change).

### Install locally

1. Link the plugin into Stream Deck: `pnpm --filter @rotho/plugin sd:link`, then restart the plugin
   with `pnpm --filter @rotho/plugin exec streamdeck restart com.rotho.yttv-multiview`.
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and
   choose `packages/extension/dist`. The extension ID should be
   `decadhapokljmmbknbfcpjckddhiicmg`.

### Extension signing key

The extension's fixed ID comes from the public `key` in `packages/extension/manifest.json`. The
matching private key is kept outside the repo at `~/.config/rotho-yttv-multiview/extension-key.pem`
and is only needed to publish to the Chrome Web Store. Never commit `*.pem` files.

## License

[MIT](LICENSE)
