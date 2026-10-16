# Easier Install and Upgrades for Invited Users

Issue: #5

Let invited, non-developer users install and upgrade both pieces without Developer mode or repo
access: the Chrome extension ships as an **Unlisted Chrome Web Store** item (auto-updates), the
Stream Deck plugin ships from **public GitHub releases** (repo made public after a security
hardening pass), the keys show a clear state on a **protocol mismatch**, and the plugin shows an
**update available** badge from the latest GitHub release. Ships as **0.2.0**.

Out of scope: Stream Deck Marketplace, automated Web Store uploads (manual for now), any extension
UI, restricting issue creation.

## For Future Agents

As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done, set its status
to `Complete` and write its **Phase Summary** (what was done, key decisions, anything needed to
continue with zero context); run the phase's **Verification Plan** and record the result before
moving on. After each phase, follow the **GitHub sync** section below. When all phases are done,
fill in **Final Recap** and **Deployment Plan**; the single PR carries `Fixes #5`.

Decisions already made with the user (do not re-litigate):

- Extension: Unlisted Web Store listing (link-based install), not Private/trusted testers.
- Plugin: make this repo public; no separate releases repo, no Marketplace.
- Repo security: the agent applies GitHub settings via `gh` **after the user approves each
  change**, then reads them back. Settings the API can't change become a UI checklist for the
  user. Only collaborators may open PRs; issues stay open to everyone.
- Going public is gated on a clean full-history secret scan, and needs the user's explicit go.
- Web Store uploads stay manual; no Google OAuth secrets in the repo.
- Mismatch = `protocolVersion` differs only. Keys say which side to update and ignore presses.
  Plain version differences are only logged.
- Update check: plugin polls GitHub `releases/latest` on start and every 12h; small badge on
  every key (keys keep working) plus a line with a link in the Game Slot Property Inspector.
  Failures are silent (logged at info). Mute All has no Property Inspector and gets none.
- Extension icons are generated from an SVG by a script; the user reviews the look.

Repo rules (from `CLAUDE.md`): never edit files with shell commands; never run git commands that
change anything (the user branches and commits, one commit per phase); run `gh` from PowerShell
with `--body-file` for multi-line text.

## GitHub sync

Run these yourself with `gh`; do not wait to be asked, except where marked. The issue is #5 and its
board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVnO8`. Board ids and tested `gh` recipes live in
`.github/gh-recipes.md`; read it and use its ids and commands. If a command fails with an id error,
look the ids up with `gh project list`, `gh project field-list` and `gh project item-list` (all
with `--format json`).

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBVnO8 --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`).
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the body with
  `gh issue view 5 --json body -q .body`, edit that line, write it to a scratch file,
  `gh issue edit 5 --body-file <file>`). Also tick it in this plan. Read the body back.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria): draft the edit in
  chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 5 --body-file <file>` with "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has a `Fixes #5` line. Merging closes it and the board
  moves it to Done. Delete this plan `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Pre-public audit and repo security

Status: Complete

Ruleset payload as applied (ruleset id `25274919`) (`gh api repos/.../rulesets --method POST --input <file>`):
`{"name":"protect-main","target":"branch","enforcement":"active","conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},"bypass_actors":[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}],"rules":[{"type":"deletion"},{"type":"non_fast_forward"},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":true,"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":true,"allowed_merge_methods":["squash"]}},{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":true,"do_not_enforce_on_create":false,"required_status_checks":[{"context":"check"}]}}]}`

Every `gh` write in this phase is **ask first**: show the exact command(s) in chat, run after the
user approves, then read the setting back. Save JSON payloads in the scratchpad and pass them with
`gh api ... --input <file>`.

Audit (read-only; going public waits on this):

- [x] Run a full-history secret scan: `gitleaks git --redact -v .` (install via
      `winget install gitleaks` if missing; ask before installing). Expect "no leaks found". Review
      and explain any hit; a real secret means stop and ask (rotate + history rewrite is the
      user's call).
- [x] `git log --all --name-only --format= | sort -u` and check for `*.pem`, `.env`, key files,
      personal paths or notes that shouldn't be public. Check `git log --all --format='%an <%ae>'`
      so the user knows which author emails become public.
- [x] Report audit results in chat and get the user's OK before any setting changes.

Repo files (committed in this phase):

- [x] Add `SECURITY.md`: supported version (latest release only), report privately via GitHub
      "Report a vulnerability" (private vulnerability reporting), no public issues for security.
- [x] Add `.github/CODEOWNERS` with `* @Rothenbergerjl`.
- [x] Add `SECURITY.md` / `.github/CODEOWNERS` globs to `.github/labeler.yml` under
      `area:ci-devex` if they don't match an existing glob.

GitHub settings (via `gh`, ask first, read back):

- [x] Merge settings: squash only, delete branch on merge
      (`gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge`).
- [x] Disable wiki and projects-on-repo if unused (`gh repo edit --enable-wiki=false`); keep
      issues on. (Wiki was already off; projects kept on because the board links through it.)
- [x] Ruleset `protect-main` on the default branch
      (`gh api repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/rulesets --method POST --input <file>`):
      target `~DEFAULT_BRANCH`; rules `deletion`, `non_fast_forward`, `pull_request`
      (required approvals 0 since the user is the only maintainer, dismiss stale reviews,
      require conversation resolution, allowed merge methods `squash`), `required_status_checks`
      with context `check` (the CI job) and strict mode on; bypass actor = repository admin role
      (`actor_id: 5, actor_type: RepositoryRole, bypass_mode: pull_request`) so the user can still
      merge their own PRs. Read back with `gh api .../rulesets` and `.../rules/branches/main`.
- [x] Actions permissions: default workflow token read-only and Actions can't approve PRs
      (`gh api repos/.../actions/permissions/workflow --method PUT -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false`).
      Workflows that need more already declare `permissions:` (`release.yml`: `contents: write`;
      `pr-labeler.yml`: `pull-requests: write`); confirm `ci.yml` needs nothing more and add
      `permissions: contents: read` to it.
- [x] Fork PR workflows require approval for all outside contributors
      (`gh api repos/.../actions/permissions/fork-pr-contributor-approval --method PUT -f approval_policy=all_external_contributors`;
      if the endpoint is unavailable, add a UI checklist item: Settings → Actions → General →
      "Require approval for all external contributors").
- [x] Allowed actions: GitHub-owned plus verified creators (`actions/*`, `pnpm/action-setup`)
      (`gh api repos/.../actions/permissions --method PUT` with `allowed_actions=selected`, then
      `.../actions/permissions/selected-actions` with `github_owned_allowed=true` and
      `patterns_allowed=["pnpm/action-setup@*"]`). Re-check every `uses:` in `.github/workflows/`
      is covered.
- [x] Security features: secret scanning + push protection
      (`gh api repos/... --method PATCH --input <file>` with
      `security_and_analysis.secret_scanning` and `secret_scanning_push_protection` enabled;
      available once public), Dependabot alerts (`gh api repos/.../vulnerability-alerts --method PUT`),
      private vulnerability reporting (`gh api repos/.../private-vulnerability-reporting --method PUT`).
- [x] Restrict PR creation to collaborators (GitHub setting added 2026-02-13, Settings → General →
      Features → Pull requests). Check whether the REST repo API exposes it
      (`gh api repos/... --jq 'keys'` after a UI change, or the REST docs); if not, give the user a
      UI checklist step and verify by reading the repo page/API afterwards.
- [x] **Explicit go from the user**, then make the repo public:
      `gh repo edit --visibility public --accept-visibility-change-consequences`. Then apply the
      security-feature item above if it needed public visibility.

### Verification Plan

- `gitleaks git --redact .` (or the Docker command in the Phase Summary) exits 0 with "no leaks found" (recorded before going public).
- `gh repo view --json visibility,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge`
  → `PUBLIC`, `true`, `false`, `false`, `true`.
- `gh api repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/rules/branches/main` lists
  `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks` (context `check`).
- `gh api repos/.../actions/permissions/workflow` → `default_workflow_permissions: read`,
  `can_approve_pull_request_reviews: false`.
- `gh api repos/... --jq .security_and_analysis` shows secret scanning and push protection
  `enabled`; `gh api repos/.../private-vulnerability-reporting` → `enabled: true`.
- Signed-out check: `curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest`
  → `200`.
- PR restriction: the setting reads back as collaborators-only (API, or the user confirms in the
  UI).

Result (2026-10-16): all checks passed. gitleaks exit 0 after `.gitleaksignore`; repo `PUBLIC`,
squash only, delete-on-merge; `main` rules `deletion`, `non_fast_forward`, `pull_request`
(squash), `required_status_checks` (`check`); workflow token `read`, can't approve PRs; fork
approval `all_external_contributors`; secret scanning + push protection `enabled`; Dependabot
alerts 204 (on); private vulnerability reporting `enabled: true`;
`pull_request_creation_policy` = `collaborators_only`; signed-out `releases/latest` → 200.

### Phase Summary

- Audit: no secrets, `.pem`/`.env` files or personal paths in history. gitleaks (run via Docker:
  `docker run --rm -v "D:\Code\rotho-youtube-tv-stream-deck-plugin:/repo:ro" zricethezav/gitleaks:v8.24.3 git /repo --redact`;
  winget isn't available) flagged only the manifest's public `key`, now ignored by fingerprint in
  `.gitleaksignore`. The user accepted that 2 commits show their Gmail address.
- Files: `SECURITY.md`, `.github/CODEOWNERS`, `.gitleaksignore`, `permissions: contents: read` in
  `ci.yml`, `SECURITY.md` and `.gitleaksignore` globs in `labeler.yml` (CODEOWNERS is already
  covered by `.github/**`).
- Deviation (posted on #5): GitHub Free blocks rulesets, fork-PR approval, secret scanning and
  private vulnerability reporting on private repos, so they were applied right after going
  public. PR creation was restricted to collaborators first.
- PR restriction is the REST repo field `pull_request_creation_policy` (`all` →
  `collaborators_only`); no UI step was needed.
- Also set the squash commit to PR title + PR body (keeps `Fixes #N` in `main`'s history). Repo
  Projects stays enabled because the board links through it; the wiki was already off; the
  board itself stays private.
- Admins bypass the ruleset only via PR (`bypass_mode: pull_request`): the user can merge a PR
  with red CI but can't push directly to `main`.
- Phase 4's update check can now hit `releases/latest` without a token.

## Phase 2: Chrome Web Store readiness

Status: Complete

- [x] Add `packages/extension/icons/icon.svg`, based on
      `packages/plugin/com.rotho.yttv-multiview.sdPlugin/imgs/plugin/category-icon.svg`, legible at
      16px (solid background, simple glyph).
- [x] Add `@resvg/resvg-js` (pnpm catalog + `packages/extension` devDependency) and render
      `icon-16.png`, `icon-48.png`, `icon-128.png` from the SVG in `packages/extension/build.mjs`
      into `dist/icons/` (generated at build, not committed).
- [x] Add `"icons": { "16": "icons/icon-16.png", "48": "icons/icon-48.png", "128": "icons/icon-128.png" }`
      to `packages/extension/manifest.json`.
- [x] Extend `packages/extension/test/manifest.test.ts`: every `icons` entry exists in `dist/`
      after build, or (if the test doesn't build) the SVG source exists and sizes are 16/48/128.
- [x] Show the user the rendered PNGs (read them as images) for approval of the look.
- [x] Add `PRIVACY.md` at the repo root: the extension reads YouTube TV tab titles and mute state
      and sends them only to the plugin on `127.0.0.1:47731`; nothing leaves the machine; the
      plugin's only network request is the anonymous GitHub release check (Phase 4); no analytics,
      no accounts. Its public URL
      (`https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/blob/main/PRIVACY.md`)
      is the listing's privacy policy.
- [x] Draft the store listing in a `### Store listing` subsection of this phase (below): name,
      summary (≤132 chars), description, category, single-purpose statement, justification for
      each permission (`tabs`, `storage`, `alarms`, `scripting`, host `https://tv.youtube.com/*`),
      data-usage answers ("website content" → tab titles, kept local), and screenshot guidance
      (1280×800, at least one: a multiview Chrome window next to the Stream Deck app).
- [x] **User steps** (agent waits): register a Chrome Web Store developer account ($5); run
      `pnpm package`; in the dashboard create a new item by uploading
      `dist/yttv-multiview-extension-0.1.0.zip` (or try the zip with `key.pem` at its root to keep
      the ID); **do not submit/publish**; report the Item ID and the Package tab's public key.
- [x] If the Item ID is `decadhapokljmmbknbfcpjckddhiicmg`: nothing to change. If it differs:
      replace `key` in `packages/extension/manifest.json` with the dashboard public key, update
      `EXTENSION_ID` in `packages/shared/src/constants.ts`, update the ID in `README.md` and any
      tests, and note that the old `extension-key.pem` is retired. If the dashboard rejects the
      `key` field in an upload, add stripping it to `scripts/zip-extension.mjs` (the store keeps
      the ID itself) and keep it in the source manifest for unpacked dev builds.
      (2026-10-16: the dashboard rejected it with "key field is not allowed in manifest";
      `zip-extension.mjs` now drops `key` from the zip's manifest. The retry with `key` removed and
      `key.pem` at the zip root worked: Item ID `decadhapokljmmbknbfcpjckddhiicmg`, and the
      dashboard public key matches the manifest `key`. Draft item, version 0.1.0, not submitted.)

### Store listing

Paste into the Chrome Web Store developer dashboard.

**Store listing tab**

- Name: `Rotho YTTV Multiview` (from the manifest)
- Summary (manifest `description`, 99 chars): `Lets the Rotho YTTV Multiview Stream Deck
  plugin switch audio between YouTube TV tabs.`
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
  • New YouTube TV tabs start muted, so opening a game never interrupts the one you're hearing.

  Privacy: the extension only looks at tv.youtube.com tabs and talks only to the Stream Deck plugin
  on your own computer (127.0.0.1). Nothing is sent over the internet.

  Not affiliated with YouTube, Google or Elgato.
  ```

- Category: Productivity → Tools. Language: English.
- Icon: `icons/icon-128.png` from the zip (also at `packages/extension/dist/icons/` after
  `pnpm build`).
- Screenshots (at least one, 1280×800 PNG/JPEG): Chrome with two or three YouTube TV games side
  by side and the Stream Deck app showing Game Slot keys (one green, heard). Optional small promo
  tile 440×280.
- Homepage/support URL: `https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`

**Privacy tab**

- Single purpose: `Mutes and unmutes YouTube TV tabs and reports which games are open, so the
  Rotho YTTV Multiview Stream Deck plugin can show each game on a key and switch which one is
  heard.`
- Permission justifications:
  - `tabs`: `Finds open tv.youtube.com tabs, reads their titles to label Stream Deck keys, and
    mutes or unmutes them when a key is pressed.`
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
  (live once this branch merges; `PRIVACY.md` is on this branch until then).

**Distribution tab**

- Visibility: **Unlisted**. Regions: all. Free.

**Keeping the extension ID** (first upload only): the store normally assigns its own ID. To try to
keep `decadhapokljmmbknbfcpjckddhiicmg`, upload a one-off zip with `key.pem` (the private key from
`~/.config/rotho-yttv-multiview/extension-key.pem`, renamed) at the zip root. If the dashboard
rejects the `key` field in `manifest.json`, remove that field from the one-off zip's manifest.
Never commit this zip or put it in the repo folder.

### Verification Plan

- `pnpm build` → `packages/extension/dist/icons/icon-{16,48,128}.png` exist; PNG dimensions match
  (checked in the test or by reading the files' IHDR bytes).
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass.
- `pnpm check:extension-id` passes (derived ID from manifest `key` == `EXTENSION_ID` == Web Store
  Item ID).
- `pnpm package` produces a zip containing `manifest.json`, `background.js`, `content.js`,
  `icons/icon-*.png` and no `.map` files.

Result (2026-10-16): all passed. Tests 110/110 (4 new: manifest icon map, 16/48/128 PNG IHDR
sizes); typecheck, lint, format clean; `check:extension-id` OK; zip holds `background.js`,
`content.js`, `icons/icon-{16,48,128}.png`, `manifest.json` (no `key`), no `.map`.

### Phase Summary

- Icon: `packages/extension/icons/icon.svg` (dark rounded tile, 2×2 screens, bottom-right green
  = heard), approved by the user. `icons/render.ts` renders it with `@resvg/resvg-js` 2.6.2 (no
  install scripts); `build.mjs` imports it directly (Node strips the types) and writes
  `dist/icons/`. 128px keeps 16px transparent padding; 16/48 crop to the artwork
  (`viewBox="16 16 96 96"`).
- `PRIVACY.md` matches the code: tab ID/title/slot/heard kept in `chrome.storage.session`, sent
  only to `127.0.0.1:47731`; the plugin's only network call is the Phase 4 GitHub release check.
  Its URL is the listing's privacy policy (live after merge).
- Web Store: the dashboard rejects a manifest `key` ("key field is not allowed in manifest"), so
  `scripts/zip-extension.mjs` drops it from the zip; the source manifest keeps it for unpacked
  dev builds and `check:extension-id`. The first upload used `key.pem` at the zip root and kept
  the ID `decadhapokljmmbknbfcpjckddhiicmg`. A draft item (0.1.0) exists, not submitted. Later
  uploads use the normal release zip.
- The user's shell is Windows PowerShell 5.1: no `utf8NoBOM`, and `Compress-Archive` may write
  backslash paths. Use `[IO.File]::WriteAllText` and `tar -a -c -f` in user-facing commands.
- Store listing text is in **Store listing** above, to paste at submit time (Deployment Plan).

## Phase 3: Protocol mismatch on keys

Status: Not started

- [ ] `packages/plugin/src/store.ts`: add `mismatch?: "plugin" | "extension"` to `PluginState`
      (the side that must update: `"plugin"` when the extension's protocol is newer, else
      `"extension"`), a `setProtocol(extensionProtocol: number)` method comparing to
      `PROTOCOL_VERSION`, and clear it on disconnect.
- [ ] `packages/plugin/src/plugin.ts`: on `hello`, call `store.setProtocol(...)` (keep the
      existing log lines). While `mismatch` is set, ignore `state` messages for display (log them
      as now).
- [ ] `packages/plugin/src/render.ts`: add a `mismatch` field to `SlotKeyView` and
      `MuteAllKeyView`; when set, draw a warning key (amber, e.g. `#f59e0b`, warning glyph, text
      "Update plugin" / "Update extension"). Disconnected ("No Chrome") wins over mismatch.
- [ ] `actions/slot.ts` and `actions/mute-all.ts`: pass `mismatch` into the views; `onKeyDown`
      shows `showAlert()` and sends nothing while mismatched.
- [ ] Tests: `render.test.ts` snapshots for both mismatch sides on both keys; store tests for
      `setProtocol` (equal → none, older/newer → correct side, disconnect clears); a server/plugin
      test using `test/fake-extension.ts` or the existing server tests that a `hello` with
      `protocolVersion: PROTOCOL_VERSION + 1` leads to `mismatch: "plugin"`.
- [ ] `fake-extension.ts`: add an option (e.g. `--protocol <n>`) to send a different protocol
      version for manual checks.

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes with the new snapshots (inspect the snapshot SVGs for
  the right text).
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm --filter @rotho/plugin validate` pass.

### Phase Summary

_(write when phase completes)_

## Phase 4: Update-available check

Status: Not started

- [ ] Embed the plugin version at build: in `packages/plugin/rollup.config.mjs` add a small
      replace plugin (or `@rollup/plugin-replace`) that injects the root `package.json` version as
      `__PLUGIN_VERSION__`; declare it in a `.d.ts`; vitest `define` it for tests. (Don't read
      `manifest.json` at runtime; Marketplace DRM would forbid it later.)
- [ ] Add `packages/plugin/src/updates.ts`: `UpdateChecker` with injectable `fetch`, clock and
      interval; GETs `https://api.github.com/repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest`
      with `Accept: application/vnd.github+json` and a `User-Agent`; parses `tag_name` (`vX.Y.Z`)
      and `html_url`; compares with a small semver compare (numeric `major.minor.patch`; ignore
      prereleases and drafts); runs on start and every 12h (`unref`'d timer); any error, non-200
      or unparseable tag → log at info and keep the previous result.
- [ ] Store: add `update?: { version: string; url: string }` to `PluginState` with a setter;
      survives connect/disconnect.
- [ ] `render.ts`: when `update` is set, add a small badge (e.g. blue `#3b82f6` up-arrow dot in
      the bottom-right corner) to every key state, including "No Chrome" and mismatch; keys keep
      working.
- [ ] Game Slot Property Inspector: on `onPropertyInspectorDidAppear`, the plugin sends
      `{ update }` with `streamDeck.ui.sendToPropertyInspector`; `ui/slot.html` shows
      "Plugin vX.Y.Z is available" and a button that sends `{ openUpdate: true }`; the plugin then
      calls `streamDeck.system.openUrl(update.url)`. Shows nothing when up to date.
- [ ] Wire `UpdateChecker` into `plugin.ts` after `streamDeck.connect()`.
- [ ] Tests: `updates.test.ts` (newer → set, equal/older → unset, prerelease ignored, network
      error/404/bad JSON → no throw and no change, interval re-checks using fake timers);
      `render.test.ts` snapshots with the badge; semver compare edge cases (`0.10.0 > 0.9.0`).

### Verification Plan

- `pnpm --filter @rotho/plugin test` passes.
- `pnpm build` then `node -e` grep: `packages/plugin/com.rotho.yttv-multiview.sdPlugin/bin/plugin.js`
  contains the current version string and no `__PLUGIN_VERSION__`.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @rotho/plugin validate` pass.
- Live API shape check (repo is public after Phase 1):
  `curl -s https://api.github.com/repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest`
  returns `tag_name` and `html_url`.

### Phase Summary

_(write when phase completes)_

## Phase 5: Docs and version 0.2.0

Status: Not started

- [ ] Rewrite README **Install** for non-developers: (1) install the extension from the Web Store
      link (`https://chromewebstore.google.com/detail/<item-id>`), (2) download and double-click
      `com.rotho.yttv-multiview.streamDeckPlugin` from the latest release, (3) add keys. Drop the
      Developer mode steps from the user path.
- [ ] README **Upgrading**: extension updates itself; for the plugin, keys show a blue badge and
      the Game Slot settings link to the release; install the new file over the old one.
- [ ] README **Moving from a Load unpacked install**: remove the unpacked extension in
      `chrome://extensions` first (same ID can't be installed twice), then install from the store;
      the old folder can be deleted.
- [ ] README **Troubleshooting**: add "Keys say Update plugin / Update extension" (what to do;
      store updates can take a few hours to arrive, `chrome://extensions` → Update forces it) and
      what the badge means.
- [ ] README **Development → Release**: add Web Store upload steps (upload the release zip in the
      dashboard, submit, Unlisted) and the release-order rule: when `PROTOCOL_VERSION` changes,
      publish the plugin release first and submit the extension after, so the auto-updating
      extension never runs ahead for long; keep the dev "Load unpacked" instructions.
- [ ] Link `PRIVACY.md` and `SECURITY.md` from the README.
- [ ] Set root `package.json` version to `0.2.0`, run `pnpm version:sync`.
- [ ] Add `## [0.2.0] - <date>` to `CHANGELOG.md`: Web Store distribution, extension icons,
      protocol-mismatch keys, update badge, public repo/security policy, privacy policy.

### Verification Plan

- `node scripts/sync-version.mjs --check` passes; both manifests show 0.2.0 / 0.2.0.0.
- `node scripts/changelog-section.mjs 0.2.0` prints the new section.
- `pnpm format:check` passes (README, CHANGELOG, PRIVACY, SECURITY formatted).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm package` pass; `dist/` contains
  `com.rotho.yttv-multiview.streamDeckPlugin` and `yttv-multiview-extension-0.2.0.zip`.
- README contains the real Web Store URL (no `<item-id>` placeholder) and no Developer mode step
  in the Install section.

### Phase Summary

_(write when phase completes)_

## Final Recap

_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan

_(write when all phases complete: step-by-step deployment instructions. Expected outline: merge
the PR; run Actions → Release with 0.2.0; upload `yttv-multiview-extension-0.2.0.zip` to the Web
Store item, fill the listing from Phase 2, set visibility Unlisted, submit for review; after
approval, on a clean Chrome profile install the extension from the link and the plugin from the
release, check the keys work and no badge shows; uninstall your own unpacked copy and switch to
the store copy.)_
