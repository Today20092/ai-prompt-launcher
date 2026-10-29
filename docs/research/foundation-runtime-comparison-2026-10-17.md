# Foundation comparison: local runtime evidence

Date: 2026-10-17. Issue: [#3](https://github.com/Today20092/ai-prompt-launcher/issues/3). Status: maintainer selected focused Promptroom after reviewing this comparison. The approved layout is the current baseline; further visual work is deferred. This report does not claim a finished community product.

## Recommendation

Keep Promptroom's personal workspace and build a focused account/library backend. Use the approved always-visible content layout and take the useful browsing patterns from prompts.chat. Put community discovery in a separate Explore area. A person should land in their own prompts and explicitly save independent copies from the community.

The maintainer accepted this recommendation in chat: "Yes I agree. Prompt room looks good. Later I do want to work on the UI, but the layout is pretty good so far." The focused service has fewer existing community features, but its tested ownership and approval rules match the requested personal-first product. Forking prompts.chat provides more community UI now, while still requiring custom presets, snapshot storage, publication approval, and personal-first navigation.

Do not merge the throwaway backend into production as it stands. The most significant remaining technical gate is combining the approved editor, account UI, and rendered pages in the actual Astro/Workers application. The standalone Workers service passed; the previous Astro Cloudflare development adapter did not become usable in this environment. A passing standalone service does not prove that adapter integration.

## Candidates and reproducible locations

| Candidate | Local artifact | Runtime |
| --- | --- | --- |
| Focused editor | `.scratch/prompt-content-layout`, branch `codex/prompt-content-layout`, based on `10afe81` | Built static Astro/React/shadcn UI at http://127.0.0.1:4351/ |
| Focused integration service | `.scratch/foundation-focused/personal-ui/prototype-service/` | Better Auth 1.7.7, Wrangler 4.147.0, local workerd/D1 at http://localhost:4342/ |
| Customized prompts.chat | `.scratch/foundation-upstream`, branch `codex/issue-3-comparison`, pinned upstream `7d3f248962d1dca209d59e033524bcb86c2b26b8` | Next.js 16.1.0, Node 24 container, Prisma/PostgreSQL; http://localhost:4341/prompts/comparison-grammar |

No production data, third-party accounts, paid infrastructure, or public prompt corpus was used. Accounts created by the checks are synthetic users in the named local databases. Local HTTP and test credentials are unsuitable for public deployment.

## What was actually tested

| Flow | Focused launcher/service | Customized prompts.chat |
| --- | --- | --- |
| Personal grammar-corrector workflow | Maintainer confirmed the existing published launcher sends to T3 Chat. Approved revised editor shows variables and complete prompt without unfolding. | Same grammar-corrector wording added with upstream `${text}` syntax; multiline fields added and T3 added to Run menu. Maintainer-signed-in T3 delivery from this candidate is still unverified. |
| Real account sign-in | Better Auth email/password; two independently signed-in HTTP clients for the same synthetic user. | Existing credentials registration and NextAuth sign-in; two independent sessions. |
| Private saved templates | Owner reads their templates; another user sees none; guest mutation denied; direct cross-owner preset creation denied. | Owner creates a private prompt through existing API; second session reads exact content; guest API access denied. Broader private-preview/export routes were not exhaustively audited live. |
| Named preset persistence | Explicitly saved named values restore exactly in the second session; whitespace, Unicode, newlines, dollar signs and literal variable-like text preserved. Preset and session survive a service restart. | Dedicated model/API/UI absent in the pinned source audit. Not implemented or mocked for this comparison. |
| Export | Owner export restores exact template and preset strings; no other user's rows included in these tests. | Prompt access demonstrated; no named-preset export exists in this comparison. |
| Community approval | Pending submission absent from public library; ordinary user cannot approve; moderator role stored in database; approval makes it public. Contributor cannot request `approved` status directly. | Confirmed an ordinary contributor's public creation becomes guest-readable and listed without moderator approval. An initial short fixture was auto-delisted by the length heuristic; a meaningful-length fixture passed and published. Heuristic/background delisting is not approval-before-publication. |
| Rendered public metadata | Approved page includes server-rendered title, content, index/follow robots, and Open Graph title. No search-engine indexing or social crawler was contacted. | Existing rendered public prompt UI is running. Full metadata correctness after a custom approval model remains work. |
| Expiring stored snapshot | Explicit storage consent required. Frozen template and selected values restore exactly through an anonymous reader. UI shows a 90-day expiry. Setting that fixture's stored expiry in the past makes subsequent reads return 404. | No 90-day stored snapshot service implemented in this candidate. Its ordinary prompt links are not equivalent. |
| Guest protection | Missing token blocked. Server called real Siteverify with Cloudflare's official always-pass testing secret/token. Three guest snapshots/day allowed; fourth rejected. Signed-in allowance is 10/day in code. | Equivalent guest creation flow absent. |

Second-session checks establish cross-session server storage, not physical-device/browser synchronization UX. Local test clocks established exact expiry arithmetic and an expired database row; the tests did not wait 90 days. The guest check proves integration and quota behavior only: Cloudflare dummy keys do not demonstrate bot resistance, challenge solving, replay prevention with real tokens, or production hostname/action validation. All guest requests deliberately share one local test quota bucket. Production needs trusted identity/IP handling, real keys and verified hostname/action checks. Snapshot expiry blocks access; physical deletion/retention cleanup is not implemented.

## Setup, maintenance, and portability

The approved editor changes are two source files: Workbench and its existing stylesheet. Its 40 tests, typecheck and static production build passed; wide/narrow UI was inspected. No community controls were added to the personal editor.

The focused backend uses real D1 queries and Better Auth, not in-memory account mocks. It is a separate integration spike with API checks and minimal rendered public/snapshot pages, not an integrated sign-in/preset/moderation product UI. The earlier adapter startup issue was avoided by running Wrangler directly. The installed workerd rejected compatibility date 2026-10-17; the spike uses its supported 2026-10-08 date. Missing CA certificates in the slim container initially broke Worker outbound verification; installing ca-certificates and restarting resolved it. These are setup-friction findings, not hidden passes.

Upstream keeps its existing framework, PostgreSQL schema, auth, revisions, collections, comments and votes. Clone branding hides the HF Data Studio surface in the observed library UI; `mcp: false` disables MCP configuration features. AI search/generation and comments were disabled for the minimal comparison, and no inference credentials were supplied. Removing UI clutter is feasible. Removing its schema, migration and dependency responsibilities is a separate undertaking.

Observed manifests: focused backend checkout has 14 direct runtime dependencies and 6 development dependencies; pinned upstream has 53 and 24. These counts describe these checkouts, not bundle size, security, or equivalent completed products; the focused checkout predates the approved editor's Effect refactor. The standalone service adds no new installed dependency. Upstream's T3 and multiline changes touch central components with many consumers, so upstream updates require reviewing those patches. A true fork would also need pending/approved checks across lists, detail/API/raw/export/preview/webhook paths, not only a hidden list item.

Portability: the current personal editor remains a static site with versioned JSON backup/share formats. A D1 service uses SQLite and Workers bindings; moving it requires an auth/database/runtime adapter and data export. Upstream's Node/Postgres stack is more conventional to self-host, but SQL databases and sessions still need migrations, backups, recovery and patching. Neither candidate earns an operating-cost or maintenance win solely from its UI.

## Expected costs, checked against primary sources

Local comparison cost: no new paid resources provisioned. Developer hardware/storage/network costs were not measured.

For a small focused deployment, a plausible planning allowance is **$5/month plus domain/email/overages**, using Workers Paid to avoid assuming password hashing and SSR fit Free CPU. This is a budget scenario, not a quote or measured bill. Workers Paid starts at $5/month and includes 10 million requests and 30 million CPU milliseconds/month; overages are $0.30/million requests and $0.02/million CPU milliseconds. Source: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

D1 Free includes 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. Paid includes 25 billion reads/month, 50 million writes/month and 5 GB storage, with additional reads $0.001/million, writes $1/million and storage $0.75/GB-month. A hypothetical 100,000 monthly backend requests scanning 100 rows each and 100,000 row writes totals 10 million reads and 100,000 writes, within those Paid allowances. Actual query scans, indexed writes, CPU, auth and snapshot size must be measured before relying on that estimate. Source: [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Turnstile has a Free plan; no production widget was created here. Source: [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

Upstream needs a Node runtime plus PostgreSQL. Its software does not impose a hosting subscription, but we did not choose or provision a host; therefore no honest fixed monthly total can be assigned. It may fit eligible free offerings, or incur separate app/database charges. Prior provider-specific figures in `foundation-operating-comparison.md` are dated 2026-10-04 and are not refreshed quotes in this report. Add any chosen domain, transactional email, backup and recovery costs to either candidate. A paid plan is not a hard spending cap.

## Licensing and unresolved product rules

The pinned [upstream license map](https://github.com/f/prompts.chat/blob/7d3f248962d1dca209d59e033524bcb86c2b26b8/LICENSE) separates MIT application code from CC0 submitted prompt content. Reusing code requires preserving notices. We imported no public corpus. The maintainer still needs to select contribution terms for Promptroom, explain what a publication grants, and keep private templates/presets outside public licensing assumptions. This is a license-document observation, not legal advice.

Unresolved approval/revision rules: can the owner revise a published prompt without review; does a revision leave the last approved version live; who can withdraw/reject; how are authors credited on independent copies; can moderators read private prompts; how are reports/appeals handled? The spike implements only private/pending/approved creation and approval. It does not implement an edit/revision workflow, comments/votes, email verification/password recovery, OAuth, production abuse defense, deletion/revocation UI, snapshot purging, offline conflict resolution, or automatic synchronization of browser-local templates.

The old personal-workspace plan removed preset UI. The maintainer's 2026-10-17 instruction explicitly asks to evaluate named presets again; this spike demonstrates server persistence without silently restoring presets to the current published app.

## Checks and handoff

Focused service: `node prototype-service/check.mjs` from `.scratch/foundation-focused/personal-ui`. Requires Docker container `promptroom-comparison-api` and local-only D1 state. The script creates synthetic users, assigns a synthetic moderator through local SQL, ages its local guest quota fixtures, tests expiry, and restarts only that named service container. All reported checks passed on the final run. It prints no passwords or session cookies.

Upstream: `node scripts/check-comparison.cjs` from `.scratch/foundation-upstream`, with local containers `promptroom-foundation-upstream` and `promptroom-foundation-db` running. Credentials/private-access and immediate-publication checks passed. No missing feature was represented as a working mock.

The local service runs with: `node ../node_modules/wrangler/bin/wrangler.js dev --local --ip 0.0.0.0 --port 4342 --persist-to .wrangler/state` from its `prototype-service` directory inside the existing Node container, with that port published only on host 127.0.0.1. Preserve its ignored `.dev.vars` and `.wrangler/state` across restarts. The container needs CA certificates. All bindings are local; do not deploy this configuration. Local documentation references: [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/), [Better Auth D1/migrations](https://www.better-auth.com/docs/concepts/database), [Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

The approved layout is tracked separately in `.scratch/prompt-content-layout/LAYOUT-APPROVAL.md`. GitHub issue creation failed with integration HTTP 403; GitHub CLI is unavailable. No GitHub issue was closed or falsely reported as created.

**Decision recorded:** continue with focused Promptroom plus an account/library backend. Begin by connecting the approved editor to explicit private-template saves and a separate Explore area. Convert remaining integration/product gates into implementation tickets. GitHub #3 still needs reconciliation when repository write access is available.
