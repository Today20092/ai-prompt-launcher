# Git workflow

`main` is the only long-lived branch: reviewed release source and the GitHub default. Each task gets its own branch and pull request into `main`; there is no integration branch and no stacked PRs.

## Work on a task

1. Work in a worktree the host manages, based on current `origin/main`. A T3 Code thread on the main checkout moves itself with `t3_worktree_handoff` before editing; the project's worktree script runs `pnpm install --frozen-lockfile`. Without host worktree tools, use `git worktree add`. Agent branches use `codex/<scope>`; `feat/`, `fix/` and `chore/` prefixes are also in use.
2. Commit work in progress instead of using `git stash`: stashes are shared by every worktree.
3. Make the change and run the checks below.
4. End every code task with a commit and a pull request to `main`, without being asked. Opening a PR is safe; only a merge deploys.
5. **CI does not run on pull requests.** Report the check results in the PR.
6. Merge only when the user asks, with a **merge commit** (other methods are enabled on GitHub, so choose it explicitly).

Fetch before choosing a base. Use `git pull --ff-only` to advance a local `main`; inspect divergent histories and merge deliberately. Never force-push `main`.

## Checks

```bash
for file in js/*.js; do node --check "$file"; done
cd personal-ui
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

These match `.github/workflows/pages.yml`, except that CI builds with `DEPLOY_BASE` and `DEPLOY_SITE` set for GitHub Pages.

## Preview

From `personal-ui`, on the branch being previewed:

```bash
pnpm dev --background        # live reload; the legacy launcher is not served
pnpm exec astro dev stop
pnpm build && pnpm preview --background --host 127.0.0.1 --port 4329   # includes /legacy/
pnpm exec astro preview stop
```

Both use local port 4329 and only one can run at a time. Tailscale Serve already maps HTTPS port 8449 to it. See [the workbench README](../personal-ui/README.md#review).

## What triggers a release

| Action | Effect |
| --- | --- |
| Push to a task branch | Nothing runs |
| Open or update a pull request | Nothing runs |
| Push or merge to `main` | Runs checks, then **deploys to the public GitHub Pages site** |
| Manual `workflow_dispatch` of Pages | Runs checks and deploys |
| A commit message containing `[skip ci]` on `main` | GitHub skips the workflow, so nothing deploys |
| Version tag | Nothing runs |

`main` has no branch protection, because no check runs on pull requests, so a direct push deploys immediately. Treat every push to `main` as a release, and do not push there without explicit approval. The `development` branch was retired on 2026-11-21 with no commits that `main` lacked.

## Clean up

GitHub deletes a merged PR's branch. Remove the task's worktree through the host (or `git worktree remove`) once it has no uncommitted or unmerged work.
