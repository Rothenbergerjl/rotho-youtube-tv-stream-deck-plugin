# Open Service Picker

Issue: #31

Add an **Open Service Picker** key that switches a 15-key Stream Deck to a bundled "Services"
profile holding one Open Service key per service and a Back key. Picking a service opens it and
returns to the previous profile. Other device models are out of scope for now.

## For Future Agents

As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done, set its status
to `Complete` and write its **Phase Summary** (what was done, key decisions, anything needed to
continue with zero context); run the phase's **Verification Plan** and record the result before
moving on. After each phase, follow the **GitHub sync** section below. When all phases are done,
fill in **Final Recap** and **Deployment Plan**; the single PR carries `Fixes #31`.

## Decisions (agreed with the user 2026-10-18)

- **Profile:** editable (not `Readonly`), `DontAutoSwitchWhenInstalled: true`, `DeviceType` 0
  (15-key Stream Deck / MK.2) only. The user builds it in the Stream Deck app with the dev-linked
  plugin and exports it, and the `.streamDeckProfile` file is committed as a binary.
- **Layout (5x3):** Back in the top-left. YouTube TV, Peacock and Paramount+ in row 2,
  columns 2–4.
- **Window vs tab:** each Open Service key inside the profile keeps its own **Open in** setting
  (default New window). No new plumbing.
- **Return after pick:** Open Service gets a **"Return to previous profile after opening"**
  checkbox (setting `returnAfterOpen`), off by default and turned on for the keys in the bundled
  profile. It returns only after a successful open, meaning the message was sent and the message
  was an open (not `openOptions`). On an alert or "Turn on" press, the key stays where it is.
- **Off services:** the existing "Turn on" rendering and behavior.
- **Back:** a new visible action, `com.rotho.yttv-multiview.back`. When pressed, it calls
  `switchToProfile(deviceId)` with no profile name, which returns to the previous profile. No
  Property Inspector.
- **Picker key:**
  - **UUID and settings:** `com.rotho.yttv-multiview.picker`, no Property Inspector.
  - **Image:** the three service badges with an "Open" label.
  - **Blocked states:** "No Chrome", "Update …" and "Full" are drawn the same way as on Open
    Service. In any of those states, pressing the key shows an alert and doesn't switch.
  - **Other devices:** on any device whose `type` isn't `DeviceType.StreamDeck`, the key shows
    "Not supported" and shows an alert when pressed.
- **Constants:** `ACTION_UUIDS.picker` and `ACTION_UUIDS.back` in
  `packages/shared/src/constants.ts`. The profile name is shared as a constant
  (e.g. `SERVICES_PROFILE = "profiles/Services"`).
- **Known caveat:** Stream Deck may not reinstall a bundled profile when the plugin is upgraded,
  so changing the layout later may require users to remove the profile and reinstall the plugin.
  Document this in the README.

## GitHub sync

Run these yourself with `gh` from PowerShell; do not wait to be asked, except where marked. The
issue is #31 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBoPM8`. Board ids and tested
recipes are in `.github/gh-recipes.md` (project id `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`).

- **First phase starts:** set board Status to **In Progress**:
  `gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhBoPM8 --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441`
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body. Fetch it with
  `gh issue view 31 --json body -q .body`, edit that line, write it to a scratchpad file, and run
  `gh issue edit 31 --body-file <file>`. Read the body back to confirm, and tick the phase in this
  plan too.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria): draft the edit in
  chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment 31 --body-file <file>` with "Deviation: <what>, because <why>".
- **Last phase done:** confirm the PR body has `Fixes #31`. Delete this plan `.md` in the final
  commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Back action and "return after opening" on Open Service

Status: Complete

- [x] Add `back: \`${PLUGIN_UUID}.back\`` to `ACTION_UUIDS` in `packages/shared/src/constants.ts`
- [x] Add `returnAfterOpenSetting(value)` to `packages/plugin/src/settings.ts`: only `true` or
      `"true"` means on, and missing means off (unlike the other checkboxes, which default to on)
- [x] `packages/plugin/src/actions/open.ts`: add `returnAfterOpen?: boolean` to `OpenSettings`. In
      `onKeyDown`, after a successful `server.send` of an `openYouTubeTv`/`openService` message
      with the setting on, call `streamDeck.profiles.switchToProfile(ev.action.device.id)`. Don't
      return for `openOptions` or on alert
- [x] `ui/open.html`: add a `sdpi-checkbox` with `setting="returnAfterOpen"` and the label "Return
      to previous profile after opening", plus a line of help text saying it's for keys inside the
      Services picker
- [x] Add `packages/plugin/src/actions/back.ts`: a `BackAction` whose `onKeyDown` calls
      `streamDeck.profiles.switchToProfile(ev.action.device.id)`. Static key image
- [x] Add a Back action to the plugin manifest (Name "Back", Tooltip "Returns to the previous
      profile, e.g. from the Services picker.", Keypad only), with `imgs/actions/back/icon.svg`
      and `key.svg` drawn in the style of the existing action icons
- [x] Register `BackAction` in `packages/plugin/src/plugin.ts`
- [x] Tests: `returnAfterOpenSetting` cases in `test/settings.test.ts`. Update `test/manifest.test.ts`
      for the new action order (Back's manifest entry has no Property Inspector)
- [x] CHANGELOG `[Unreleased]`: Back key and the Open Service checkbox

### Verification Plan

- `pnpm typecheck`: no errors
- `pnpm test`: all pass, including the new settings and manifest cases
- `pnpm --filter @rotho/plugin build` then `pnpm --filter @rotho/plugin validate`: the manifest
  validates
- `pnpm lint` and `pnpm format:check`: clean

Result (2026-10-18): typecheck clean; tests 688 shared, 78 extension, 243 plugin, all passing;
lint clean; format:check clean after wrapping one long condition in `open.ts`; build succeeded
and `streamdeck validate` reported "Validation successful".

### Phase Summary

- `ACTION_UUIDS.back` added. The Back action (`src/actions/back.ts`) has no constructor
  dependencies and no Property Inspector. On press it calls
  `streamDeck.profiles.switchToProfile(deviceId)` with no profile name, which returns to the
  previous profile. Its icons are `imgs/actions/back/{icon,key}.svg`, a left arrow in the style
  of the other icons. It's last in the manifest's `Actions` list and is registered last in
  `plugin.ts`.
- Open Service:
  - **Setting:** `returnAfterOpen`, parsed by `returnAfterOpenSetting`. Only `true`/`"true"` count
    as on.
  - **Property Inspector:** an "After opening" item holding a checkbox labelled "Return to
    previous profile", plus a help paragraph.
  - **`onKeyDown`:** returns early after showing an alert. It switches profiles only when the sent
    message isn't `openOptions` ("Turn on").
- The return logic can't be unit tested without mocking the SDK; the existing tests don't mock
  actions. It'll be checked by hand on the deck in Phase 3.
- CHANGELOG `[Unreleased]` now has an `### Added` section; Phases 2 and 3 add to it.

## Phase 2: Open Service Picker action

Status: Complete

- [x] Add `picker: \`${PLUGIN_UUID}.picker\`` to `ACTION_UUIDS`, and a `SERVICES_PROFILE` constant
      naming the bundled profile path (without extension) as it will appear in the manifest
- [x] `packages/plugin/src/render.ts`: add a `PickerKeyView` (connected, mismatch,
      featureMissing, full, unsupported, updateAvailable) and a `pickerKeySvg` that wraps the body
      with `withUpdateBadge`. Order of states: unsupported → "Not supported"; not connected → "No
      Chrome"; mismatch/featureMissing → "Update …"; full → "Full"; otherwise the three
      `monogram` badges (TV, P, P+) with an "Open" label
- [x] Add `packages/plugin/src/actions/picker.ts`: a `PickerAction`, modeled on `OpenAction`.
      - **Rendering:** it subscribes to the store and draws each key from its device type
        (`a.device.type !== DeviceType.StreamDeck` means unsupported).
      - **featureMissing:** set when the extension lacks both `openYouTubeTv` and `openService`.
      - **`onKeyDown`:** shows an alert in any blocked or unsupported state. Otherwise it calls
        `streamDeck.profiles.switchToProfile(ev.action.device.id, SERVICES_PROFILE)`.
- [x] Add the picker action to the plugin manifest (Name "Open Service Picker", Tooltip "Opens a
      picker of YouTube TV, Peacock and Paramount+ keys. 15-key Stream Deck only.", Keypad only),
      with `imgs/actions/picker/icon.svg` and `key.svg`
- [x] Register `PickerAction` in `plugin.ts`
- [x] Tests: `test/render.test.ts` snapshots for each picker state, and `test/manifest.test.ts` for
      the new action and tooltip
- [x] CHANGELOG `[Unreleased]`: the picker key

### Verification Plan

- `pnpm typecheck` and `pnpm test`: all pass. Review the new snapshots and confirm the normal
  state shows three badges and "Open"
- `pnpm --filter @rotho/plugin build` and `validate`: clean
- `pnpm lint` and `pnpm format:check`: clean

Result (2026-10-18):
- **Typecheck:** clean.
- **Tests:** shared 688, extension 78 and plugin 250 all pass, with 5 new snapshots written. The
  normal-state snapshot shows the TV, P and P+ discs in #ff0033, #000000 and #0064ff, with
  "Open" underneath.
- **Lint and format:** lint is clean. `format:check` passed after one long `svg(...)` call in
  `render.ts` was wrapped.
- **Build and validate:** the build succeeded and `streamdeck validate` reported "Validation
  successful". `bin/plugin.js` contains `profiles/Services`.

### Phase Summary

- **Constants:** `ACTION_UUIDS.picker` and `SERVICES_PROFILE = "profiles/Services"` are in
  `packages/shared/src/constants.ts`. Phase 3's manifest `Profiles[0].Name` must equal
  `SERVICES_PROFILE`.
- **Rendering (`render.ts`):**
  - `PickerKeyView` and `pickerKeySvg`, wrapped in `withUpdateBadge`.
  - States are checked in this order: unsupported ("Not / supported"), then not connected
    ("No Chrome"), then mismatch or featureMissing ("Update …"), then full ("Full").
  - `serviceRow(dim)` draws every `SERVICE_IDS` monogram (r=20) evenly across y=50, so a fourth
    service would fit automatically. Every blocked state except Update shows the row greyed out.
- **Action (`src/actions/picker.ts`):** `PickerAction(store)`.
  - `featureMissing` is set when the extension lists neither `openYouTubeTv` nor
    `openService`.
  - `unsupported` is `device.type !== DeviceType.StreamDeck`.
  - A press in any blocked state shows an alert. Otherwise it calls
    `switchToProfile(deviceId, SERVICES_PROFILE)`.
  - `renderAll` draws at most two images: supported and unsupported.
- **Manifest and icons:** the manifest action comes after Back and has no Property Inspector.
  `imgs/actions/picker/key.svg` is a copy of the normal-state render, and `icon.svg` is a
  three-tiles-plus-play glyph.
- **Until Phase 3:** the manifest has no `Profiles` entry yet, so pressing the picker on a dev
  build does nothing visible.

## Phase 3: Bundled Services profile, docs

Status: Not started

- [ ] Give the user step-by-step instructions for building and exporting the profile:
      1. `pnpm --filter @rotho/plugin build` and `sd:link`, then restart the plugin.
      2. Create a profile named "Services" on the 15-key deck.
      3. Put Back in the top-left.
      4. Put Open Service keys for YouTube TV, Peacock and Paramount+ in row 2, columns 2–4,
         each with the return checkbox on and Open in set to New window.
      5. Export the profile and save it to
         `packages/plugin/com.rotho.yttv-multiview.sdPlugin/profiles/Services.streamDeckProfile`.
- [ ] Add `"Profiles": [{ "Name": "profiles/Services", "DeviceType": 0, "Readonly": false,
      "DontAutoSwitchWhenInstalled": true }]` to the plugin manifest, with `Name` matching
      `SERVICES_PROFILE`
- [ ] Make sure the profile file ends up in the packed `.streamDeckPlugin` (`sd:pack` includes the
      whole `.sdPlugin` folder; check `.gitattributes` treats `*.streamDeckProfile` as binary and
      add it if not)
- [ ] `test/manifest.test.ts`: there is exactly one profile, its `Name` equals `SERVICES_PROFILE`,
      `DeviceType` is 0, `DontAutoSwitchWhenInstalled` is true, and
      `profiles/Services.streamDeckProfile` exists
- [ ] README: under Keys, add Open Service Picker and Back, plus the new Open Service checkbox. Note
      the install prompt, 15-key only, and the reinstall caveat for layout changes
- [ ] CHANGELOG `[Unreleased]`: the bundled profile, and finalize the entry wording

### Verification Plan

- `pnpm -r test`: the manifest profile test passes and the file exists
- `pnpm --filter @rotho/plugin build`, `validate` and `sd:pack`: clean. List the packed archive's
  entries, e.g. with `tar -tf dist/*.streamDeckPlugin`, and confirm it contains
  `profiles/Services.streamDeckProfile`
- Manual check by the user after installing the packed plugin:
  1. The app prompts to install the profile and doesn't switch to it.
  2. The picker key opens it.
  3. Picking a service opens it and returns to the previous profile.
  4. Back returns to the previous profile.

### Phase Summary

_(write when phase completes)_

## Final Recap

_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan

_(write when all phases complete: step-by-step deployment instructions)_
