# GitHub recipes

IDs and tested `gh` commands for this repo's issues and project board.

## IDs

| Thing                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| Repo                   | `Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin`       |
| Project                | "Rotho YTTV Multiview", number `3`, owner `Rothenbergerjl` |
| Project id             | `PVT_kwHOBLWqFc4BmmYP`                                     |
| Status field id        | `PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI`                           |
| Status: Todo           | `d8787203`                                                 |
| Status: Ready          | `a33a6237`                                                 |
| Status: In Progress    | `96b69291`                                                 |
| Status: Done           | `8a821b82`                                                 |
| Issue #1 board item id | `PVTI_lAHOBLWqFc4BmmYPzhACpuU`                             |

Labels: `plan`, `type:feature`, `area:plugin`, `area:extension`, `area:shared`, `area:ci`.

## Commands

Set an item's Status (swap the option id):

```bash
gh project item-edit --id PVTI_lAHOBLWqFc4BmmYPzhACpuU --project-id PVT_kwHOBLWqFc4BmmYP --field-id PVTSSF_lAHOBLWqFc4BmmYPzhlOtxI --single-select-option-id 96b69291
```

Add an issue to the board (prints the new item id):

```bash
gh project item-add 3 --owner Rothenbergerjl --url <issue-url> --format json
```

List board items with status:

```bash
gh project item-list 3 --owner Rothenbergerjl --format json -q '.items[] | {id, status, title}'
```

Tick a phase in an issue body:

```bash
gh issue view 1 --json body -q .body > body.md
# edit "- [ ] Phase N: ..." to "- [x] Phase N: ..."
gh issue edit 1 --body-file body.md
```

Re-look-up ids if a command fails:

```bash
gh project list --owner Rothenbergerjl --format json
gh project field-list 3 --owner Rothenbergerjl --format json
gh project item-list 3 --owner Rothenbergerjl --format json
```
