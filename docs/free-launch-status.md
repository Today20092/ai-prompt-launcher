# Free launch implementation status

## Hosting decision

Use Cloudflare Workers **Free** with Static Assets and D1 **Free**, on the free `workers.dev` address. No paid hosting plan, custom domain purchase, email provider, AI inference service, or file storage subscription is part of this launch. Keep the current GitHub Pages deployment until a separately reviewed migration.

Google OAuth is the selected login path for the cloud build, avoiding application-hosted password hashing and recovery email. This requires configuring your own OAuth client; code alone cannot establish that Google login works on the final hostname.

Checked sources, October 17, 2026:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): static asset requests free/unlimited; Free dynamic requests 100,000/day, CPU 10 ms/invocation.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): Free 5 million rows read/day, 100,000 written/day, 5 GB total storage. These are account allowances, not guaranteed site capacity.
- [Google OAuth web application setup](https://developers.google.com/identity/protocols/oauth2/web-server): register the exact redirect URI for the final hostname.

Free quotas are availability limits. Do not upgrade automatically. Production OAuth, actual CPU use and expected traffic still need checking on the final Free deployment.

## Integration

Branch: `integration/promptroom-free`, based on remote main `40c2250`.

- Captured the approved layout and newer account UI without changing their original dirty worktree.
- Retained Effect already merged on main; no second refactor.
- Task graph and contracts: [free-launch-spec.md](free-launch-spec.md).
- GitHub connector writes returned HTTP 403 (`Resource not accessible by integration`). Existing Git repository credentials allowed creating [PR #12](https://github.com/Today20092/ai-prompt-launcher/pull/12) and [integration ticket #13](https://github.com/Today20092/ai-prompt-launcher/issues/13) through the GitHub API. Issues #1–#3 now record the selected foundation and strict $0 priority. PR #12 closes #13 and records completion of the #3 comparison when merged; unrelated verification issues remain open.

## Validation

Before implementation: locked install succeeded; all 43 existing tests passed; Astro check had zero errors, warnings and hints. Windows command resolution required invoking the installed Node executable directly rather than the stale shell Node path.

Final merged implementation checks: 50 component/domain tests pass; Astro check reports zero errors, warnings and hints; cloud build and Worker dry packaging pass (335.97 KiB gzip); two Worker HTTP tests pass against real local D1, including ownership, revision conflicts, moderation, input bounds and account-switch races. The normal GitHub Pages build also passes with `/ai-prompt-launcher/` asset prefixes and the legacy launcher staged. These checks use synthetic sessions, not Google login.

Browser inspection: local integrated Worker at `http://localhost:8787/`, desktop and 390px phone width. Account dialog explains missing Google configuration; Explore search and empty state work. The phone viewport had no horizontal document overflow. No real account was used. Authenticated control behavior is covered by component tests and the local HTTP suite, not a signed-in browser journey.

Standards review found no actionable issues. Spec review found an account-switch race between the UI session preflight and mutation. It is fixed: authenticated app requests and sign-out carry an expected-account header, checked against the session on that same server request before private reads or writes. Missing/mismatched identity is rejected without changing data. The reviewer confirmed resolution; focused HTTP and UI regressions pass.

No production services have been provisioned or deployed, and no real account credentials have been entered.

## What remains before going live

Follow [DEPLOYMENT.md](../personal-ui/DEPLOYMENT.md): select a Cloudflare Free account, create/bind D1, configure the final workers.dev origin and Google OAuth client, set secrets securely, then explicitly apply remote migrations and deploy. Do not paste secrets into chat. Before public acceptance, check real Google login, private saves between two actual devices, moderator approval/removal, and CPU use on Workers Free. A support/privacy policy and Google consent configuration must describe the actual service.

Deferred work stays deferred: stored short links, preset UI, comments/votes, a broad redesign, a large catalog import and advanced offline merging. No new paid dependency is required. Quota exhaustion may make the cloud service unavailable; local guest editing remains available from static assets.
