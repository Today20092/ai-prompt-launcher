# Free Cloudflare deployment handoff

Use **Workers Free with Static Assets + D1 Free**, on the supplied `workers.dev` subdomain. This replaces the backend prototype packaging, not the existing GitHub Pages deployment. No paid plan, custom domain, email service, inference, R2, analytics, logs or traces is needed. Keep the existing Pages workflow until migration is explicitly approved.

## Local verification

From `personal-ui`, use Node >=22.12 and the pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm build:cloud
pnpm db:local
pnpm test:worker
pnpm dev:cloud
```

`build:cloud` enables the account UI with `PUBLIC_CLOUD=true` and serves Astro's static output at `/`. The existing `build` command retains GitHub Pages staging. `/api/*` and `/p/*` run through the Worker; other assets bypass it. The Worker has no setup/test-login endpoints and never creates schema on requests. Tests use ephemeral local D1 and synthetic signed sessions inside the test harness; they exercise the shipped Worker HTTP seam, not a production sign-in bypass.

Sign-in stays unavailable until configuration is complete. Local guest editing remains usable. For optional real localhost OAuth, put `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in ignored `.dev.vars` and use the exact `http://localhost:8787/api/auth/callback/google` callback. Never commit that file or copy another worktree's secrets/state.

## External setup gates — not performed

1. Confirm the Cloudflare account is on Workers **Free** and D1 **Free**. Do not enable a paid subscription or auto-provision resources during deployment. Create one D1 database only after approval, replace the all-zero placeholder `database_id` in `wrangler.jsonc`, and set `AUTH_BASE_URL` to the exact HTTPS workers.dev origin. The placeholder is deliberately not deployable. No command in the normal build creates remote resources.
2. Configure Google OAuth's web application client, consent screen, app name, support contact, privacy policy and authorized origins. Use basic Google identity scopes only (`openid`, `email`, `profile`), no Gmail/Drive access or paid Identity Platform. Add the exact `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/auth/callback/google` redirect URI. Confirm Google Console accepts that hosted origin. No domain purchase is assumed.
3. Generate a strong random `AUTH_SECRET` and set it and `GOOGLE_CLIENT_SECRET` with Wrangler's secret commands. Configure `GOOGLE_CLIENT_ID` too. Do not put credentials in source. HTTPS base URL makes auth cookies secure. Google is the sole provider; password signup, recovery and outbound mail are disabled.
4. After backup/review, apply migrations explicitly with `wrangler d1 migrations apply DB --remote`. This is a remote write; no automation here runs it. Then deploy the built Worker only after deployment approval.
5. Grant a chosen existing user moderator access through an explicit administrator SQL command: `INSERT INTO moderators(owner) SELECT id FROM user WHERE email='chosen@example.com';`. Use `wrangler d1 execute DB --local --command "..."` for local D1, or `--remote` only after approval. Revoke with an explicit `DELETE FROM moderators WHERE owner=...`. There is no public registration path for moderators.

## Launch checks and limits

Measure real Google sign-in, sign-out, independent sessions on two devices, and the Worker Free CPU budget before calling deployment accepted. Synthetic sessions do not prove OAuth or phone sync. Verify contribution approval and removal in the deployed environment. Review the privacy policy and CC0 consent before accepting public contributions.

Free quotas are availability limits, never permission to upgrade: Workers Free allows 100,000 dynamic requests/day and 10 ms CPU/request; static assets are free/unlimited. D1 Free allows 5 million rows read/day, 100,000 rows written/day and 5 GB total. At quota limits the dynamic service may stop. Accounts are bounded to 100 prompt rows, list/search/review responses to 100 rows, JSON requests to 128 KiB, and template text to 64,000 characters. Search uses the approved status index but substring search scans approved rows; revisit indexing/pagination if the library grows. Auth library request rate limiting remains enabled; production abuse and quota use must be monitored without paid services.

Context7 documentation consulted: [Better Auth native D1](https://github.com/better-auth/better-auth/blob/main/docs/content/blogs/1-5.mdx), [Google OAuth provider](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/concepts/oauth.mdx), [Wrangler asset routing implementation](https://github.com/cloudflare/workers-sdk/blob/main/packages/deploy-helpers/src/deploy/helpers/assets.ts). Pricing: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/). Google setup: [web server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).
