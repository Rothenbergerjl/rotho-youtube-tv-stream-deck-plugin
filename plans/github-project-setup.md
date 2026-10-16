# GitHub project board and issue automation

Issue: #3

Bring this repo's GitHub setup up to the same standard as `bulldog-window-cleaning`.
That covers the "Rotho YTTV Multiview" project board (#3): its statuses, fields,
views and built-in workflows. It also covers labels, issue and PR templates, the PR
labeler, the PR issue-link check, `gh-recipes.md`, `CLAUDE.md` and the `open-pr`
skill. The reference is project #2 (https://github.com/users/Rothenbergerjl/projects/2)
and the files in `D:\code\bulldog-window-cleaning`.

## For Future Agents
As work proceeds: mark checkboxes `- [x]` as items complete; when a phase is done,
set its status to `Complete` and write its **Phase Summary** (what was done, key
decisions, anything needed to continue with zero context); run the phase's
**Verification Plan** and record the result before moving on. After each phase,
follow the **GitHub sync** section below. When all phases are done, fill in
**Final Recap** and **Deployment Plan**; the single PR carries `Fixes #<n>` for
every issue it resolves.

### Agreed scope and decisions (from the planning interview, 2026-10-16)
- **Reuse project #3** ("Rotho YTTV Multiview", id `PVT_kwHOBLWqFc4BmmYP`, already linked
  to this repo). Don't create a new project.
- **Status options become** Backlog, Ready, In Progress, In Review, Done (same order,
  colors and descriptions as #2). Replacing the options gives them **new ids**: re-set
  issue #1 to Done and the tracking issue to its current status afterwards, and rewrite
  the ids in `gh-recipes.md`.
- **Add the Priority (P0–P3) and Size (XS–XL) single-select fields**, matching #2.
- **The user configures the views and built-in workflows in the web UI** (the API can't
  create views or turn on workflows). Phase 3 is their click-through checklist. The
  agent checks the result with GraphQL afterwards.
- **Labels match bulldog fully:**
  - Type labels: `bug`, `enhancement`, `tech-debt`, `plan`, `question`, plus `no-issue`.
  - Area labels: `area:plugin`, `area:extension`, `area:shared`, `area:ci-devex`,
    `area:testing`, `area:docs`, all `c5def5` with descriptions.
  - `area:ci` is renamed to `area:ci-devex`, which keeps it on existing issues.
  - `enhancement` already exists, so `type:feature` can't be renamed into it. Instead,
    `enhancement` is added to #1 and `type:feature` is deleted.
  - GitHub's default labels are deleted: `accessibility`, `documentation`, `duplicate`,
    `good first issue`, `help wanted`, `invalid`, `wontfix`.
- **Issue templates are merged.** `bug.yml` uses bulldog's structure (summary, repro,
  expected, actual, cause, fix, severity) plus this repo's Area dropdown, Versions and
  Logs fields. `feature.yml` and `config.yml` (blank issues off) are added. This repo's
  richer `plan.yml` stays as it is.
- **`CLAUDE.md` is bulldog's version, adapted:** Tool Restrictions plus the Issue
  Tracking Workflow, with the repo name, board name and commands changed. Nothing else.
- **The `open-pr` skill and `.claude/settings.json` are copied from bulldog**, with npm
  replaced by pnpm.
- **Repo merge settings stay as they are.** Squash-merging is a convention, as it is in
  bulldog.
- **`plans/yttv-multiview.md` is deleted.** #1 is closed and v0.1.0 has been released,
  so its one "pending" item is done.
- **Commits:** Phases 1–3 are GitHub-only and produce no commits. Phases 4 and 5 are one
  commit each, and the final commit also deletes this plan.

## GitHub sync
Run these yourself with `gh`; do not wait to be asked, except where marked. The issue
is #3 and its board item id is `PVTI_lAHOBLWqFc4BmmYPzhBVNBE` (#1's is
`PVTI_lAHOBLWqFc4BmmYPzhACpuU`). Phase 2 sets #3 to Priority P2 and Size M.
Use the ids and recipes in `.github/gh-recipes.md`. Until Phase 5 rewrites that file,
use the ids in this plan. If a command fails with an id error, look the ids up with
`gh project field-list 3 --owner Rothenbergerjl --format json` and
`gh project item-list 3 --owner Rothenbergerjl --format json`. Run `gh` from
PowerShell and pass multi-line bodies with `--body-file` from the scratchpad.

Current ids (since Phase 2): project `PVT_kwHOBLWqFc4BmmYP`, Status field
`PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`, In Progress `05c39441`. The full table is in
Phase 2's summary.

- **First phase starts:** set board Status to **In Progress**
  (`gh project item-edit --id <item-id> --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id <in-progress-option-id>`).
  After Phase 2, re-set it to the new In Progress id.
- **Each phase done:** tick `- [x] Phase N: <title>` in the issue body (fetch the
  body with `gh issue view <n> --json body -q .body`, edit that line, write it to a
  scratch file, `gh issue edit <n> --body-file <file>`). Also tick it in this plan.
- **Body text changes** (scope, decisions, dependencies, acceptance criteria):
  draft the edit in chat and **ask first**, then `gh issue edit`.
- **Deviation from the plan:** **ask first**, then
  `gh issue comment <n> --body "Deviation: <what>, because <why>"`.
- **Last phase done:** confirm the PR body has one `Fixes #N` line per issue it
  resolves. Merging closes them and the board moves them to Done. Delete this plan
  `.md` in the final commit.
- Never run git commands that change anything; the user branches and commits.

## Phase 1: Labels
Status: Complete

- [x] Add `enhancement` to #1: `gh issue edit 1 --add-label enhancement`
- [x] Rename `area:ci`: `gh label edit area:ci --name area:ci-devex --color c5def5 --description "CI, scripts, developer tooling"`
- [x] Delete `type:feature` and the GitHub defaults (`accessibility`, `documentation`,
      `duplicate`, `good first issue`, `help wanted`, `invalid`, `wontfix`) with
      `gh label delete <name> --yes`
- [x] Set colors and descriptions to match bulldog (`gh label edit`, or `gh label create --force`):
  - `bug` d73a4a "Something is broken or behaves incorrectly"
  - `enhancement` a2eeef "New feature or improvement"
  - `question` d876e3 "Needs a decision or discussion before work"
  - `plan` 5319e7 "Tracks a /real-work plan doc in plans/"
- [x] Create `tech-debt` fbca04 "Refactor, cleanup or internal quality work"
- [x] Create `no-issue` ededed "PR intentionally has no linked issue (skips the link check)"
- [x] Area labels, all `c5def5`:
  - `area:plugin` "Stream Deck plugin (packages/plugin)"
  - `area:extension` "Chrome extension (packages/extension)"
  - `area:shared` "Shared protocol and helpers (packages/shared)"
  - `area:testing` "Unit and integration tests"
  - `area:docs` "README, CHANGELOG and other docs"

### Verification Plan
- `gh label list --limit 100 --json name,color,description` returns exactly these 12
  labels: bug, enhancement, tech-debt, plan, question, no-issue, and area:plugin,
  extension, shared, ci-devex, testing, docs. Each has the color and description above.
- `gh issue view 1 --json labels` shows plan, enhancement, area:plugin, area:extension,
  area:shared, area:ci-devex.
- The tracking issue's labels now include `area:ci-devex`.

### Phase Summary
Done on 2026-10-16, GitHub only, no commit. #3 was set to In Progress (old option id
`96b69291`) before starting.
- Ran the commands above. Every label in the list was written with
  `gh label create <name> --color --description --force`, which creates it or updates
  it in place.
- **Verified:**
  - `gh label list` shows exactly the 12 labels, with the colors and descriptions above.
  - #1 has enhancement, plan, area:plugin, area:extension, area:shared and area:ci-devex.
  - #3 has enhancement, plan and area:ci-devex. The rename carried `area:ci` over on
    both issues.
- Next is Phase 2. #3 is currently In Progress, and replacing the Status options will
  clear it, so re-set it with the new id.

## Phase 2: Board fields and statuses
Status: Complete

- [x] Read #2's option colors and descriptions:
      `gh api graphql -f query='query{node(id:"PVT_kwHOBLWqFc4BlhYx"){... on ProjectV2{fields(first:30){nodes{... on ProjectV2SingleSelectField{id name options{name color description}}}}}}}'`
- [x] Replace #3's Status options with the `updateProjectV2Field` mutation
      (`fieldId: PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`, `singleSelectOptions` = Backlog, Ready,
      In Progress, In Review, Done with #2's colors and descriptions)
- [x] Create Priority: `gh project field-create 3 --owner Rothenbergerjl --name Priority --data-type SINGLE_SELECT --single-select-options "P0,P1,P2,P3"`,
      then set #2's colors and descriptions with `updateProjectV2Field`
- [x] Create Size the same way with `XS,S,M,L,XL`
- [x] Re-set Status on the existing items: #1 → Done, tracking issue → In Progress
- [x] Set #3's Priority to P2 and Size to M
- [x] Record the new field and option ids in this phase's summary

### Verification Plan
- `gh project field-list 3 --owner Rothenbergerjl --format json`: Status options are
  Backlog, Ready, In Progress, In Review, Done in that order; Priority is P0–P3; Size is
  XS–XL.
- Comparing #2 and #3 on `{name color description}` for the three fields with GraphQL
  shows no differences.
- `gh project item-list 3 --owner Rothenbergerjl --format json`: #1 has status Done, and
  the tracking issue has In Progress plus its Priority and Size.

### Phase Summary
Done on 2026-10-16, GitHub only, no commit.
- **Status:** replaced with the `updateProjectV2Field` mutation, sent as a query file:
  `gh api graphql -F query=@status.graphql`. Inline nested input objects don't work
  well from PowerShell.
- **Priority and Size:** #2's options are all GRAY with no descriptions. That is what
  `field-create` produces, so no follow-up mutation was needed.
- **Re-set:** #1 back to Done, and #3 to In Progress, P2, M.
- **Verified:** a GraphQL comparison of `{name, options{name color description}}` for
  the three fields in #2 and #3 came out IDENTICAL, and the item list showed the right
  values. #1 has no Priority or Size, which is fine because it's closed.

New ids (project `PVT_kwHOBLWqFc4BmmYP`), for `gh-recipes.md` in Phase 5:

| Field | Field id | Options |
|---|---|---|
| Status | `PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI` | Backlog `6cd334fc`, Ready `217c607b`, In Progress `05c39441`, In Review `55aacf25`, Done `06818f0a` |
| Priority | `PVTSSF_lAHOBLWqFc4BmmYPzhl-KnE` | P0 `bbe9f2d7`, P1 `801c2fd2`, P2 `b4925dba`, P3 `49664824` |
| Size | `PVTSSF_lAHOBLWqFc4BmmYPzhl-KoU` | XS `fe88457c`, S `5d69542c`, M `e2b0f215`, L `9320b576`, XL `8421f9a9` |

## Phase 3: Views and built-in workflows (user, in the web UI)
Status: Complete

Open project #2 in one tab as the reference and project #3
(https://github.com/users/Rothenbergerjl/projects/3) in another. The agent gives the
user this checklist and waits for them to finish.

- [x] **Triage view:** rename "View 1" to **Triage**. Layout: Table. Filter: `no:priority`.
      Sort: Created, ascending. Visible fields: Title, Assignees, Status, Linked pull
      requests, Sub-issues progress. Save.
- [x] **Board view:** create a new view called **Board**. Layout: Board. Column by:
      Status. Visible fields: Title, Assignees, Status, Labels, Linked pull requests,
      Sub-issues progress. No filter. Save.
- [x] **Workflows** (⋯ → Workflows). For each one, open #2's version, copy its trigger,
      filter and target status, then turn it on in #3:
  - [x] Item added to project
  - [x] Item reopened (create it if it isn't listed)
  - [x] Item closed
  - [x] Pull request linked to issue
  - [x] Pull request merged
  - [x] Auto-close issue
  - [x] Auto-add to project: repo `rotho-youtube-tv-stream-deck-plugin`, same filter as #2
  - [x] Auto-add sub-issues to project (already on; check it matches)

### Verification Plan
- The agent runs
  `gh api graphql -f query='query{user(login:"Rothenbergerjl"){projectV2(number:3){views(first:20){nodes{name layout filter sortByFields(first:5){nodes{field{... on ProjectV2FieldCommon{name}} direction}} verticalGroupByFields(first:3){nodes{... on ProjectV2FieldCommon{name}}} fields(first:20){nodes{... on ProjectV2FieldCommon{name}}}}} workflows(first:20){nodes{name enabled}}}}}'`
  and runs the same query against project 2. Views (name, layout, filter, sort, grouping,
  visible fields) match, and #3's workflow list has the same 8 names, all with
  `enabled: true`.
- A behavioral check comes later. When the Phase 5 PR is opened, the tracking issue
  should move to **In Review** on its own, and after merge to **Done**.

### Phase Summary
The user did this in the web UI on 2026-10-16. GitHub only, no commit.
- **How it was checked:** the agent ran the query above against both projects and
  normalized it with jq: views sorted by name, `{name, layout, filter, sort, group,
  fields}`, plus the workflows sorted by name. #2's filter has a trailing space, which
  was trimmed before comparing.
- **Result:** IDENTICAL.
  - Triage: table, `no:priority`, sorted by Created ascending.
  - Board: board layout, columns by Status.
  - All 8 workflows are enabled.
- **Not checked yet:** the API doesn't expose each workflow's target status or filter.
  The open PR checks those when #3 moves to In Review by itself, and the merge checks
  the move to Done. Confirm both at PR time, in `/open-pr` step 4.

## Phase 4: Issue templates, PR template and PR workflows
Status: Complete

- [x] Rewrite `.github/ISSUE_TEMPLATE/bug.yml` to bulldog's structure:
  - "What's wrong?", "Steps to reproduce", "Expected behavior" and "Actual behavior"
    (all required), "Suspected cause / relevant files" and "Possible fix" (optional),
    and the Severity dropdown (Low, Medium, High, Critical, required).
  - Keep this repo's Area dropdown (required) and its Versions and Logs fields
    (including the logs path and `render: text`).
  - Name: "Bug report". Labels: `[bug]`.
- [x] Add `.github/ISSUE_TEMPLATE/feature.yml`, copied from bulldog (labels `[enhancement]`),
      with this repo's Area dropdown added
- [x] Add `.github/ISSUE_TEMPLATE/config.yml` with `blank_issues_enabled: false`
- [x] Leave `.github/ISSUE_TEMPLATE/plan.yml` unchanged
- [x] Rewrite `.github/pull_request_template.md` in bulldog's shape (Summary, Issues with
      `Fixes #` and the no-issue comment, Changes, Testing). The Testing checkboxes are
      `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build`,
      matching `ci.yml`.
- [x] Add `.github/workflows/pr-issue-link.yml`, copied from bulldog unchanged
- [x] Add `.github/workflows/pr-labeler.yml`, copied from bulldog unchanged
- [x] Add `.github/labeler.yml` with this header comment ("When adding a new package or
      feature directory, add its globs here") and these globs:
  - `area:plugin`: `packages/plugin/**`
  - `area:extension`: `packages/extension/**`
  - `area:shared`: `packages/shared/**`
  - `area:testing`: `packages/*/test/**`, `**/*.test.ts`
  - `area:docs`: `README.md`, `CHANGELOG.md`, `LICENSE`
  - `area:ci-devex`: `.github/**`, `scripts/**`, `.claude/**`, `CLAUDE.md`,
    `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`,
    `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`,
    `.gitattributes`, `.gitignore`, `.npmrc`

### Verification Plan
- `pnpm format:check` and `pnpm lint` pass.
- Every new or changed `.yml` parses: for each file, `pnpm dlx js-yaml@4 <file>` exits 0
  and prints JSON.
- Every label named in `labeler.yml` exists (`gh label list`).
- Once the PR is open, `pr-labeler` and `pr-issue-link` run, the labeler adds
  `area:ci-devex`, and `pr-issue-link` gives no warning.

### Phase Summary
Done on 2026-10-16. Waiting for the user to commit.
- **Issue templates:**
  - `bug.yml` keeps bulldog's fields and order and adds this repo's fields: Area right
    after "What's wrong?", and Versions and Logs after "Actual behavior". The cause, fix
    and severity fields come last.
  - `feature.yml` has the Area dropdown after "Problem or motivation".
- **`labeler.yml`:** uses double-quoted keys and globs. Bulldog uses single quotes, but
  this repo's Prettier config (`pnpm format:check`, which runs in CI) requires double
  quotes.
- **Verified:**
  - `pnpm format:check` passes, and `pnpm lint` passes.
  - All 7 YAML files under `.github/` that were touched or kept parse with
    `pnpm dlx js-yaml@4` (exit 0).
  - All 6 area labels used in `labeler.yml` exist.
- **Not checked yet:** the PR-time behaviour of `pr-labeler` and `pr-issue-link`. Check
  it when the PR opens.

## Phase 5: Agent docs, recipes and cleanup
Status: Not started

- [ ] Create `CLAUDE.md` from bulldog's, with Tool Restrictions and the Issue Tracking
      Workflow. Change the repo to `Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`
      and the board name to "Rotho YTTV Multiview". Keep the branch example generic.
      Keep the instruction to add globs to `.github/labeler.yml` when adding a package
      or feature directory.
- [ ] Rewrite `.github/gh-recipes.md` in bulldog's format:
  - PowerShell recipes and a board constants table with the Phase 2 Status, Priority and
    Size field and option ids.
  - Keep the "Add an issue to the board" recipe.
  - Mark a recipe "tested" only if it was run against this repo during this plan.
- [ ] Add `.claude/skills/open-pr/SKILL.md`, copied from bulldog with these changes:
  - npm commands become the five pnpm commands from the PR template.
  - "keep the four checkboxes" becomes "keep the Testing checkboxes".
  - The offer to run e2e is dropped (this repo has none).
- [ ] Add `.claude/settings.json` that allows `Bash(pnpm *)` and `PowerShell(pnpm *)`
      (bulldog's `worktree.bgIsolation: none` is included)
- [ ] Delete `plans/yttv-multiview.md`
- [ ] Delete this plan (`plans/github-project-setup.md`) in the final commit

### Verification Plan
- `pnpm format:check` and `pnpm lint` pass.
- Grep the new files for leftovers: `bulldog|Bulldog|npm run|npm ci|PVT_kwHOBLWqFc4BlhYx`
  in `CLAUDE.md`, `.github/` and `.claude/` returns no matches.
- Every id in `gh-recipes.md` appears in the output of
  `gh project field-list 3 --owner Rothenbergerjl --format json`.
- Run `gh project item-list 3 --owner Rothenbergerjl --format json` and confirm the
  board-item lookup recipe returns the tracking issue's item id.
- Once the PR is open, the tracking issue moves to In Review by itself (Phase 3's
  workflow check).

### Phase Summary
_(write when phase completes)_

## Final Recap
_(write when all phases complete: summary of the entire piece of work)_

## Deployment Plan
_(write when all phases complete: step-by-step deployment instructions)_
