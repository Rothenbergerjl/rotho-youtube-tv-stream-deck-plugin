# Claude Project Instructions

## Tool Restrictions

- NEVER use Bash, shell commands, or throwaway Python scripts to edit, replace, or create files.
- ALWAYS use the native file editing and writing tools to make code modifications.
- Do not use Linux path formats (like `/d/Code`); always use standard Windows paths if referencing directories.
- Never run git commands that make changes (commit, push, merge, rebase, reset, checkout that discards work, etc.). Read-only git commands (status, diff, log, show, blame) are fine.

## Issue Tracking Workflow

- GitHub Issues on `Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin` is the single source of truth for bugs and enhancements. Do not create markdown bug or todo lists.
- Before working on an issue, read it with `gh issue view <n> --comments`. If it has the `plan` label, also open the plan doc it links to.
- Branch names are `<issue#>-short-slug` (e.g. `42-mute-all-icon`). One branch and one PR per issue. The user creates branches and makes commits (see the git rule above); typically one commit per plan phase. PRs are squash-merged.
- PR bodies use the PR template and include one `Fixes #N` line for every issue the PR resolves (bug work may close several). Merging closes them. For a PR with genuinely no issue (e.g. a dependency bump), apply the `no-issue` label. `pr-issue-link.yml` only warns and never blocks.
- PR area labels are applied automatically by `pr-labeler.yml` from `.github/labeler.yml`. When adding a new package or feature directory, add its globs there.
- When you find a bug or idea during unrelated work: draft the issue in chat (title, type + area labels, suggested Priority/Size, body following the matching issue template in `.github/ISSUE_TEMPLATE/`) and create it with `gh issue create` only after the user approves.
- Labels: one type label (`bug`, `enhancement`, `tech-debt`, `plan`, `question`) plus one or more `area:*` labels. Priority (P0-P3) and Size (XS-XL) are set on the Project board ("Rotho YTTV Multiview"), not as labels.
- Plans: start with `/real-work <issue link>`. Every planned issue carries the `plan` label (even with one phase), and the plan doc has an `Issue: #N` line under its title. Phases are commits, not sub-issues or separate PRs. The issue body holds the phase checklist; the plan's checkboxes are the detailed source of truth, and its GitHub sync section says when to tick phases, set status and comment. The agent runs those `gh` commands itself, except body-text changes and deviation comments, which it asks about first. When a plan completes, the PR's `Fixes #N` closes the issue and the plan `.md` is deleted in the final commit.
- `gh` commands: board ids and tested recipes live in `.github/gh-recipes.md`. Run `gh` from PowerShell, and pass multi-line bodies and comments with `--body-file` from the scratchpad, never inline. After any issue-body or board edit, read it back to confirm.
  - No need to ask: all reads, ticking a phase in an issue body, and moving board status.
  - Ask first: body-text changes beyond phase ticks, deviation comments, creating or closing issues, and adding or removing labels (other than `plan` via `/real-work`).
  - Never: `gh issue delete`, `gh pr merge`, or any command that merges or deletes.
  - Close issues that were merged into or superseded by another with `--reason "not planned"` and a comment saying where the content went. Issues finished by work are closed by the PR's `Fixes #N` lines, not by hand.
- Research: when asked to research an idea (no plan, no spike), stay read-only: read the code and docs, then report findings in chat (current state, options with rough size, a recommendation, open questions). No code changes, branches, board moves or `gh` writes. If the idea is worth keeping, draft an issue from the findings in chat and create it only after approval; if it becomes work, plan it with `/real-work`.
- PRs: when the user has pushed the branch and says it's ready, run `/open-pr`. It opens a draft PR with a body drafted from the issue, commits and diff, after the user approves the draft.
- Board status flow: Backlog → Ready (set by `/real-work` after the user approves the plan and the issue update) → In Progress (set by the agent when the first phase begins) → In Review (automatic when a PR links the issue) → Done (automatic on merge).
