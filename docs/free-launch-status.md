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
- GitHub issue creation returned HTTP 403 (`Resource not accessible by integration`). The local task graph remains the implementation record until tracker write access works. Do not mark unrelated verification issues closed.

## Validation

Before implementation: locked install succeeded; all 43 existing tests passed; Astro check had zero errors, warnings and hints. Windows command resolution required invoking the installed Node executable directly rather than the stale shell Node path.

Implementation and final checks are in progress. No production services have been provisioned or deployed, and no real account credentials have been entered.
