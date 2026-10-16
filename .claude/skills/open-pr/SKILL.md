---
name: open-pr
description: Open a draft pull request for the current branch with a filled-in description. Use when the user says the branch is ready for a PR, asks to "open a PR", "create the PR", or runs /open-pr. Checks the branch is clean and pushed, reads the linked issue, commits and diff against main, drafts the body from the PR template, shows it for approval, then runs `gh pr create --draft`.
---

# Open PR

Opens a **draft** PR for the current branch. The user pushes the branch; this skill never runs git commands that change anything (no push, commit, rebase). Board ids and `gh` recipes are in `.github/gh-recipes.md`. Run `gh` from PowerShell and pass bodies with `--body-file` from the scratchpad.

## 1. Preflight (stop and report on any failure)

```powershell
git branch --show-current
git status --porcelain
git fetch origin
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
git rev-list --left-right --count 'HEAD...@{u}'
gh pr list --head (git branch --show-current) --state all --json number,url,state
```

- On `main`: stop.
- Uncommitted or untracked changes: list them and stop. The user decides whether they belong in the PR.
- No upstream, or the left count from `rev-list` is above 0 (local commits not pushed): ask the user to push, giving the command (`git push -u origin <branch>`), and stop.
- Right count above 0 (remote has commits you don't have locally): tell the user and stop.
- An open PR already exists for the branch: give its link and stop. Offer to rewrite its body instead (`gh pr edit <n> --body-file`), which is a body-text change, so ask first.
- Also note how far behind `main` the branch is (`git rev-list --count HEAD..origin/main`). Mention it if it's above 0, but don't block on it.

## 2. Gather context

- **Issue:** take the leading number from the branch name (`26-mute-all-icon` → #26). Run `gh issue view <n> --comments`. If the branch has no number, ask which issue it's for, or whether it's a `no-issue` PR.
- **Other issues:** look for `#N` references in commit messages (`git log origin/main..HEAD --format='%h %s%n%b'`) and ask whether each one is resolved by this PR. Only resolved issues get a `Fixes` line.
- **Commits:** `git log origin/main..HEAD --oneline`.
- **Diff:** `git diff origin/main...HEAD --stat`, then read the full diff (`git diff origin/main...HEAD`), file by file if it's large.
- **Plan:** if the issue has the `plan` label and its plan doc still exists on the branch, read it. It's normally deleted in the final commit, so the issue's phase checklist and the commits are the fallback.

## 3. Draft the PR

Title: the issue title as written. For a no-issue PR, a short imperative summary.

Body: follow `.github/pull_request_template.md` and drop its HTML comments.

- **Summary:** 2–4 sentences on what the PR does and why, from the issue's problem statement. Readers shouldn't need to open the issue.
- **Issues:** one `Fixes #N` line per resolved issue. For a no-issue PR, delete the section and add the `no-issue` label in step 4 (ask first, it's a label change).
- **Changes:** group bullets by what changed for users or the code (plugin, extension, shared protocol, tests, tooling), based on the diff. Fold fixup, lint and review-tweak commits into the change they belong to, and don't write one bullet per commit. Name key files where it helps a reviewer. If the work deviated from the plan, add a short "Deviations from plan" note.
- **Testing:** keep the Testing checkboxes. Tick a box only if that command passed in this session. Offer to run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` before creating the PR. Under the boxes, add any manual verification the user did or that the plan called for (e.g. testing on a real Stream Deck with YouTube TV tabs open).
- End the body with the attribution line from the system reminder, if there is one.

Write the body to `<scratchpad>\pr-body.md`. Show the title and the full body in chat and wait for approval or edits.

## 4. Create

After approval:

```powershell
gh pr create --draft --base main --head <branch> --title "<title>" --body-file "<scratchpad>\pr-body.md"
```

`--head` stops `gh` from offering to push. Area labels are added automatically by `pr-labeler.yml`, so don't add them.

Then:

1. Read it back: `gh pr view <n> --json url,title,isDraft,body`.
2. Check each `Fixes` issue's board status (`gh issue view <n> --json projectItems`). The board's "Pull request linked to issue" workflow moves it to **In Review**, so don't set it yourself. If it hasn't moved after a short wait, tell the user, since the workflow may be off.
3. Bind the PR with the `ccd_pr` tools as the system instructions describe.
4. Reply with the PR link, and remind the user it's a draft: they mark it ready (`gh pr ready <n>` or the GitHub button) when it's ready for review.

Never merge, close or delete PRs or issues.
