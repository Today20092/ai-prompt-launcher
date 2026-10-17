# Free Promptroom launch integration

User instruction, 2026-10-17: implement the roadmap, with hosting strictly $0. No paid plans, domains, mail service, storage or inference. Stop before external account/credential setup if needed. Existing GitHub Pages deployment stays intact until a reviewed migration.

Integration branch: `integration/promptroom-free`, based on origin/main 40c2250. Approved dirty editor files captured from `.scratch/prompt-content-layout`; preserve original worktrees and secrets. Related GitHub umbrella issues #1/#2; #3 comparison decision already recorded. Existing verification #6/#7/#9 is not implicitly closed by this work; Effect is already on main.

## Hosting

Workers Free + Static Assets, D1 Free, free workers.dev URL. Same-origin static Astro output and Worker API; no Astro SSR adapter needed. Route `/api/*` and `/p/*` through Worker, other requests serve assets. Workers free has 100,000 dynamic requests/day and 10 ms CPU/invocation; assets free/unlimited. D1 Free has 5 million rows read/day, 100,000 written/day, 5 GB total. Quota exhaustion is an availability limit, never authorization to upgrade. Sources: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/d1/platform/pricing/ (checked 2026-10-17).

Reuse Better Auth with Google OAuth only; no production password hashing/recovery/email costs. Google client credentials and Cloudflare account/binding configuration are external setup gates, not fake working sign-in. Default config must not provision or deploy resources implicitly. Local tests may inject sessions only through test harness; never expose test login/setup HTTP routes in shipped Worker.

## Task graph

T0 Capture approved editor and this spec (root). T1 Worker/backend/free deployment packaging depends T0. T2 Account sync/Explore/contribution UI depends T0 and agreed contracts below; can run beside T1. T3 merge/integration verification and deployment handoff depends T1/T2. T4 standards/spec review and fixes depends T3. Resolve tickets via PR on this single branch; if connector write unavailable retain local tasks/status honestly.

## T1: backend and packaging

Own `personal-ui/server/*`, migrations, Worker config, dependencies/lockfile, deployment scripts/docs. Reuse prototype patterns, not its setup route or snapshots/preset scope. Preserve static GitHub Pages build.

API JSON, `Cache-Control: no-store` on private/errors. Auth endpoints `/api/auth/*`; Google OAuth only, configured base URL/trusted origin and secure production cookies. All app mutations require matching Origin. Bounded UTF-8 JSON, parameterized SQL, owner predicates, indexed and bounded lists, sanitized errors. Never log prompts/tokens.

Authenticated app reads/mutations and sign-out also require `X-Promptroom-Owner` equal to the authenticated session's user ID. Mismatches/missing expected owner return 401 before private data access or writes, binding actions atomically to the account shown by the client even if another tab switches cookies. Public library/config/session/OAuth routes do not require this header.

- GET `/api/config`: `{googleEnabled:boolean}`. GET `/api/auth/get-session`: Better Auth session or null.
- GET `/api/prompts`: owner's rows `{id,title,description,body,status,revision}` (array). POST `/api/prompts`: `{title,description,body,status:'private'|'pending'}` returns full row, 201. No values/preferences.
- PUT `/api/prompts/:id`: `{title,description,body,revision}` edits private row with atomic revision precondition; return full row, 409 if stale, 404 if inaccessible. DELETE same URL with `{revision}`: private owner delete only; stale 409. Published/pending rows immutable; revisions are new submissions and approval keeps previous version unchanged.
- GET `/api/library?q=...`: approved rows only, bounded search. GET `/p/:id`: approved-only HTML public prompt page with escaped text, metadata and link to editor `/?community=<id>`; inaccessible/missing 404. GET `/api/library/:id`: approved row or 404.
- GET `/api/moderation`: `{moderator:boolean}`. GET `/api/pending`: moderator-only pending rows. POST `/api/approve`, `/api/reject`, `/api/unpublish`: `{id}` with moderator checks. Reject removes pending row; unpublish removes approved visibility. Never allow arbitrary client status changes.
- DB migrations include auth schema, prompts (revision default 1), moderators; no runtime schema creation. No public moderator registration. Document explicit local/remote moderator assignment and credential setup; do not run remote commands.

## T2: user-facing journey

Own AccountLibrary and its tests plus minimal Workbench integration. Retain approved layout. Google sign-in shown only when configured; otherwise explain setup is unavailable, keep guest local use. Remove preview-only password/signup controls. Cloud save/update is explicit and syncs server data across sessions; opening and editing an account prompt tracks id/revision, Update saves the same private identity, stale conflict preserves draft and offers reload, never overwrites automatically. Delete private prompts explicitly. Refresh reloads cloud list. Signing out or identity change clears account association and stale async work cannot leak previous account data. Pasted values stay temporary. Never silently upload local prompts.

Explore supports search/open, personal independent copies, permanent page links. Signed-in users may submit current template or imported version-1 single-prompt sharing file; reuse existing sharing parser and size limit. Require explicit confirmation/CC0 consent for publication request, preview template-only content, no uploaded values. Add minimal moderator queue approve/reject/remove UI; no comments/votes/shortener/preset UI/redesign.

## Agreed test seams and validation

Use existing AccountLibrary component behavior seam and Worker HTTP API seam (per roadmap checks and existing issue criteria). TDD one slice at a time: ownership/guest isolation, stale revision rejection without loss, pending hidden until approval, exact text, upload excludes pasted values, OAuth-only config and foreign-origin denial. Use local D1 runtime where available; do not add implementation-coupled tests. Run locked install, existing tests, typecheck, static build plus Worker packaging/local integration. Actual Google sign-in and free-tier CPU acceptance remain deployment gates until configured and measured. No claim that local sessions prove phone sync.

## Status

- T0: captured; backend/UI implementation pending.
- No paid or external resources provisioned. No production migration authorized by this document alone.
