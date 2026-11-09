# Git workflow

`main` is reviewed release source and the GitHub default branch. `development` combines selected concurrent work for a development preview. Individual changes use temporary scoped branches or worktrees.

## Choose a route

| Work | Start from | Route |
| --- | --- | --- |
| One independent feature or fix | current `main` | Scoped branch, then a PR to `main`. It does not need to pass through `development`. |
| Several features to preview together | current `main`, or `development` if the work depends on the batch | Scoped branches, integrated into `development`, then one `development` to `main` PR. |
| Sequential work in the current batch | `development` | May commit directly to `development`. |
| External contribution | matches its route | PR to `development` for a batch, or to `main` for an independent release. Reviewed and checked the same way. |

Use `codex/<scope>` for agent branches. Type prefixes such as `feat/`, `fix/` and `chore/` are also in use. A branch cut from `development` can carry unfinished work, so check that any PR to `main` contains only what you intend to release.

Keep the primary checkout and existing worktrees intact. A later revision of a feature is not in the preview until it is integrated into `development` again.

## Check before integrating or opening a PR

**CI does not run on pull requests or on `development`.** Run these yourself and report the results in the PR. Confirm a combined batch on `development`, and a direct release against current `main`.

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

## Synchronize and promote

- Run `git fetch origin` before deciding how to synchronize. Advance with `git pull --ff-only`. If histories diverge, inspect the commits and integrate deliberately. Never discard local work or force-push to resolve a failed fast-forward.
- Pushing a branch is a backup. It is not evidence that the change was tested or released.
- Promote a batch through a `development` to `main` PR and merge it with a **merge commit**, which keeps ancestry. Other merge methods are enabled on GitHub, so choose this one explicitly.
- Record the source revision and check results in the PR.
- Bring independently shipped features and main-only fixes back into `development` with a merge before starting the next batch.

## What triggers a release

| Action | Effect |
| --- | --- |
| Push or merge to `development` or a scoped branch | Nothing runs |
| Open or update a pull request | Nothing runs |
| Push or merge to `main` | Runs checks, then **deploys to the public GitHub Pages site** |
| Manual `workflow_dispatch` of Pages | Runs checks and deploys |
| A commit message containing `[skip ci]` on `main` | GitHub skips the workflow, so nothing deploys |
| Version tag | Nothing runs |

`main` has no branch protection, so a direct push deploys immediately. Treat every push to `main` as a release, and do not push there without explicit approval.

## Clean up

Remove a temporary branch or worktree only after its changes are integrated. First check for uncommitted files, unmerged commits and ignored files you still need. Keep `main` and `development`. Deleting remote branches or rewriting history requires explicit approval.
