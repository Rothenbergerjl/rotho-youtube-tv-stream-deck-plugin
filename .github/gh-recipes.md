# `gh` recipes

Commands for keeping GitHub issues and the "Rotho YTTV Multiview" project board in sync with plans.
Run them from PowerShell. Write multi-line bodies and comments to a scratchpad file and pass
`--body-file`; never inline them.

Recipes marked tested were run against a real issue in this repo (2026-10-16).

## Board constants

- Owner: `Rothenbergerjl`, repo `Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`
- Project number: `3`, project id: `PVT_kwHOBLWqFc4BmmYP`
- Token needs the `project` scope (check with `gh auth status`)

| Field    | Field id                         | Options                                                                                             |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Status   | `PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI` | Backlog `6cd334fc`, Ready `217c607b`, In Progress `05c39441`, In Review `55aacf25`, Done `06818f0a` |
| Priority | `PVTSSF_lAHOBLWqFc4BmmYPzhl-KnE` | P0 `bbe9f2d7`, P1 `801c2fd2`, P2 `b4925dba`, P3 `49664824`                                          |
| Size     | `PVTSSF_lAHOBLWqFc4BmmYPzhl-KoU` | XS `fe88457c`, S `5d69542c`, M `e2b0f215`, L `9320b576`, XL `8421f9a9`                              |

If a command fails with an id error, the options were probably recreated in the UI. Refresh these
ids with:

```powershell
gh project field-list 3 --owner Rothenbergerjl --format json
```

## Read an issue (tested)

```powershell
gh issue view <n> --comments
gh issue view <n> --json title,body,labels,state,projectItems
```

`projectItems` shows the board status but not the board item id; use the next recipe for that.

## Find an issue's board item id (tested)

```powershell
$item = (gh project item-list 3 --owner Rothenbergerjl --limit 200 --format json | ConvertFrom-Json).items |
  Where-Object { $_.content.number -eq <n> } | Select-Object -ExpandProperty id
```

The same list shows each item's `status`, `priority` and `size`.

## Add an issue to the board (tested)

Normally not needed: the board's "Auto-add to project" workflow adds new issues. Prints the new
item id.

```powershell
$item = (gh project item-add 3 --owner Rothenbergerjl --url <issue-url> --format json | ConvertFrom-Json).id
```

## Set Status, Priority or Size (tested)

Use the item id from above and a field id and option id from the table. Example, set Status to In
Progress:

```powershell
gh project item-edit --id $item --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 05c39441
```

## Tick a phase in an issue body (tested)

```powershell
$body = gh issue view <n> --json body -q .body
$new = ($body -join "`n") -replace '- \[ \] Phase <N>:', '- [x] Phase <N>:'
Set-Content -Path "<scratchpad>\body.md" -Value $new -Encoding utf8NoBOM
gh issue edit <n> --body-file "<scratchpad>\body.md"
```

Read the body back afterwards to confirm the change.

## Create an issue, replace a body or add a label (tested)

```powershell
gh issue create --title "<title>" --label plan --label enhancement --body-file "<scratchpad>\body.md"
gh issue edit <n> --body-file "<scratchpad>\body.md" --add-label plan
```

## Comment on an issue (untested)

```powershell
gh issue comment <n> --body-file "<scratchpad>\comment.md"
```

For a deviation from the plan, start the comment with "Deviation: <what>, because <why>".

## Open a draft PR (untested)

Used by `/open-pr`. The branch must already be pushed; `--head` stops `gh` from offering to push.

```powershell
gh pr list --head <branch> --state all --json number,url,state
gh pr create --draft --base main --head <branch> --title "<title>" --body-file "<scratchpad>\pr-body.md"
gh pr view <n> --json url,title,isDraft,body
```

The board's "Pull request linked to issue" workflow moves each fixed issue to In Review; check it
with `gh issue view <n> --json projectItems`. The user marks the PR ready with `gh pr ready <n>` or
the GitHub button.

## Close an issue that was merged or superseded (untested)

```powershell
gh issue close <n> --reason "not planned" --comment "Merged into #<other>."
```

Issues finished by work are closed by the PR's `Fixes #N` lines on merge; do not close them by hand.
