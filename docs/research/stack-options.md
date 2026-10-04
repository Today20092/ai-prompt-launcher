# Stack options for the public prompt library

Researched 2026-10-04. Library/API documentation fetched through Context7; pricing checked against official pages. These are feasibility findings, not tested integrations or a final stack decision.

## Recommendation to compare

Prototype two shadcn interfaces first: (A) a focused public library with a fast parameterized launcher; (B) a customized prompts.chat library with that launcher embedded. Compare browsing, individual prompt pages, filling variables, launching, saving a preset, and contributing. Use identical sample prompts and tasks. Decide whether the existing library saves enough work to justify maintaining a fork; do not let hosting choose the product prematurely.

| Route | Launch economics | Main tradeoff |
| --- | --- | --- |
| Cloudflare Workers static assets + D1 + Better Auth | $0 within limits; Workers paid starts at $5/month | Best budget fit; authentication/runtime integration requires a real deployment spike |
| Next.js on Vercel + Supabase Auth/Postgres | $0 only while eligible for Hobby and free database | Straightforward managed auth; paid minimums exceed $5–10 budget |
| prompts.chat fork + PostgreSQL | Depends on app host and database | Existing library foundation; launcher, presets and expiry need verification/customization |

Pricing sources: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing). Fork foundation: [upstream README](https://github.com/f/prompts.chat).

## Cloudflare route

Workers Free includes 100,000 dynamic requests/day and 10 ms CPU per invocation. Direct static asset requests are free and unlimited; SSR/API calls invoke the Worker and consume its allowance. Paid starts at $5/account/month, including 10 million requests and 30 million CPU ms/month; additional requests cost $0.30/million and CPU $0.02/million ms. This supports the budget if usage stays near included allowances; it is not a $5 hard cap. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

D1 Free allows 5 million rows read/day, 100,000 rows written/day and 5 GB total storage, but a single free database is capped at 500 MB (10 databases/account). Paid includes 25 billion reads/month, 50 million writes/month and 5 GB storage; overages are $0.001/million reads, $1/million writes and $0.75/GB-month. Free daily query limits cause errors when exceeded; indexes reduce scanned rows but add writes. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

Candidate packages: React + shadcn, a Workers-supported SSR framework, Better Auth, Drizzle ORM with its D1 driver/SQLite adapter, and Wrangler. A smaller alternative uses Better Auth's Kysely-backed D1 support rather than an ORM. Better Auth documents SQLite-compatible Drizzle configuration and Google/GitHub social providers. Its upstream D1 dialect explicitly rejects interactive transactions, advising D1 batch instead. Do not treat adapter documentation as proof that our exact pinned combination, plugins, migrations and OAuth callbacks work. Validate login/logout, session refresh, account linking, migration execution and free CPU limits in a deployed spike. Avoid importing undocumented internal adapter paths. [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [database options](https://better-auth.com/docs/concepts/database), [D1 dialect source](https://github.com/better-auth/better-auth/blob/main/packages/kysely-adapter/src/d1-sqlite-dialect.ts).

## Vercel + Supabase route

Vercel Hobby is restricted to personal, non-commercial use; Pro starts at $20/month. A public free library must still meet that eligibility rule. Supabase Free includes 50,000 monthly active users, a 500 MB database, 1 GB file storage, 5 GB egress and 5 GB cached egress, with two active projects. Low database activity over seven days can trigger pausing, even if some activity occurs. Supabase Pro starts at $25/month. Moving both services to their base paid tiers is approximately $45/month before overages/taxes. [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel pricing](https://vercel.com/pricing), [Supabase pricing](https://supabase.com/pricing), [pausing rules](https://supabase.com/docs/guides/platform/free-project-pausing).

Candidate packages: Next.js + shadcn + `@supabase/supabase-js` + `@supabase/ssr`. SSR OAuth requires preserving PKCE/session cookies across redirects and exchanging the callback code. Use owner-scoped database policies for presets and contributions. Hosted Supabase avoids operating the auth service, but Google/GitHub application credentials remain setup work. [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## prompts.chat fork

Upstream offers branding/themes and Google/GitHub/Azure AD authentication setup, and recommends PostgreSQL. Its current package manifest uses Next.js, React, Prisma and NextAuth, alongside Radix/Tailwind UI dependencies. Source code is MIT; prompt data is CC0. Verify the actual shadcn component sources and moderation behavior before claiming requirement parity. A fork does not require Vercel, but converting PostgreSQL/Prisma assumptions to D1 would be a separate migration. [README](https://github.com/f/prompts.chat), [package manifest](https://github.com/f/prompts.chat/blob/main/package.json), [Docker deployment](https://github.com/f/prompts.chat/blob/main/DOCKER.md).

## Product implications (proposed design)

All routes need public prompt HTML with per-page title, description, canonical URL and preview metadata; a client-only library shell is insufficient for dependable link previews. Server-rendered text metadata provides useful previews without paid image generation. Contributions enter a pending state; only moderator-approved revisions become public. Presets belong to authenticated users and persist in the database for cross-device access.

Anonymous unlisted snapshots can fit database storage: immutable text/variables, opaque token and indexed `expires_at`, with 90-day read-time expiry and scheduled indexed deletion. Expiry alone does not reclaim storage. Require tighter anonymous per-client and global creation caps plus text-size limits; omit attachments. Unlisted links are readable by any holder; exclude them from search/sitemaps and add noindex. Public prompt content will be CC0 and application code MIT, as selected by the user.

Turnstile Free includes unlimited challenges/verification requests and 20 widgets/account. Validate tokens server-side through Siteverify; tokens expire after five minutes and are single-use. This allows bot checks without a paid challenge service, but does not replace application quotas or guarantee a bounded hosting bill. [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

OAuth setup requires Google Cloud OAuth consent configuration, a web client ID/secret and exact authorized redirect URLs; GitHub requires an OAuth app and callback. Store secrets server-side and configure localhost and production separately. [Better Auth social-provider configuration](https://better-auth.com/docs/reference/options), [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [upstream OAuth environment variables](https://github.com/f/prompts.chat/blob/main/DOCKER.md).
