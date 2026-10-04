# Sharing long prompts

Researched 2026-10-04 against primary repositories and Cloudflare documentation fetched through Context7. Recommendation below is a design proposal, not an implemented service.

## Recommendation

Use three complementary sharing modes:

1. **Community templates:** stable URLs such as `/p/code-review`. The reviewed prompt lives in Git; the slug loads it. Variables can remain local, or be explicitly included in a share snapshot. This keeps ordinary library links short without storing every visitor's prompt.
2. **Portable personal shares:** versioned, optionally compressed state in a URL fragment. No application database upload; the whole payload remains in the link. Compression reduces repetitive text but cannot promise short links for arbitrary content.
3. **Short personal shares:** an explicit “Create short link” action POSTs a versioned prompt-state snapshot to a small Cloudflare Worker, stores it in D1, and returns `/s/<random-id>`. Opening that link loads the launcher and retrieves the snapshot as JSON. Do not redirect to a huge reconstructed URL: that recreates the original length problem.

These are project-specific recommendations. A stored prompt snapshot also naturally captures variables, presets, and provider selections, whereas a generic shortener only stores a destination URL.

## The two projects

| Question | ha.mr | Sink |
| --- | --- | --- |
| Mechanism | Entire URL encoded into a compressed payload | Short code identifies a persisted destination URL |
| Persistence | No database; link contains its data, but decoder hosting must remain available | D1 authoritative store plus KV redirect cache; operating the service and preserving data remain necessary |
| Long content | No constant-length guarantee | Current default target limit 16,384 characters; configurable 256–24,000 |
| Creation | Browser-side, no creation account/backend | Privileged site token or verified Cloudflare Access login |
| Integration | JS compression/decompression functions; static hosting | REST API and dashboard; separate Nuxt application and Cloudflare resources |
| License | MIT | AGPL-3.0-only |
| Fit | Optional portable URL/QR optimization | Useful separate managed shortener; extra public-write gateway needed for this launcher |

Sources: [ha.mr README](https://github.com/p2r3/ha.mr), [compression source](https://github.com/p2r3/ha.mr/blob/af23d13ed488df891f65cf4df18c474859cb5e64/docs/compress.js), [Sink README](https://github.com/miantiao-me/Sink), [Sink configuration](https://docs.sink.cool/configuration/), [Sink API](https://docs.sink.cool/api/).

### ha.mr details

The compressor optimizes common URL components and character sets; it is not a database-backed shortener. Ordinary links put compressed data after `#`; QR mode uses a path. A standalone script demonstrates `compress`/`decompress`. The maintainer intentionally keeps scope small. [README](https://github.com/p2r3/ha.mr), [standalone script](https://github.com/p2r3/ha.mr/blob/af23d13ed488df891f65cf4df18c474859cb5e64/standalone.js).

Its decoder reads the fragment or QR path and decompresses the target. This suggests fragment-containing launcher URLs can round-trip, but compatibility must be tested with our actual serialized states before adopting it. No documented universal input/browser URL limit or guaranteed compression ratio was found. Compression is reversible, not encryption. Self-hosting the decoder avoids depending on the public ha.mr domain. [browser source](https://github.com/p2r3/ha.mr/blob/af23d13ed488df891f65cf4df18c474859cb5e64/docs/main.js).

### Sink details

Sink now uses D1 as its link source and KV as a cache. Workers deployment is recommended; Pages deployment is deprecated. Analytics, R2 backups/images, and AI are additional capabilities. This makes it a larger maintenance surface than the launcher's two snapshot endpoints. [README](https://github.com/miantiao-me/Sink).

The current source enforces configurable URL length. Older cached source pages can still show 2,048 characters; this research checked live master `bafa4e1f7e3ec034929e11e5542c4c3e116d69da`. Pin and verify any adopted version. [schema](https://github.com/miantiao-me/Sink/blob/bafa4e1f7e3ec034929e11e5542c4c3e116d69da/shared/schemas/link.ts).

The API requires the site's privileged bearer token; CORS does not remove authentication. Never embed that token in the launcher. Public creation would need our backend to authenticate or limit visitors and call Sink privately. It is not a ready-made anonymous community submission system. [API](https://docs.sink.cool/api/), [authentication source](https://github.com/miantiao-me/Sink/blob/bafa4e1f7e3ec034929e11e5542c4c3e116d69da/server/middleware/2.auth.ts).

The normal redirect builds its target from the saved URL and optionally merges visitor query parameters; it does not explicitly strip the saved target fragment. This is source-based evidence, not a browser round-trip test. Test Unicode, `#` state, query handling, and password redirects. [redirect source](https://github.com/miantiao-me/Sink/blob/bafa4e1f7e3ec034929e11e5542c4c3e116d69da/server/middleware/1.redirect.ts).

Analytics are optional. With analytics enabled, destination URLs can be recorded alongside visitor fields; near-limit URLs can exceed Analytics Engine's total blob capacity and disappear from analytics while still redirecting. For prompt shares, prefer no prompt payload in analytics/logs and no automatic page-content AI enrichment. [configuration](https://docs.sink.cool/configuration/), [analytics](https://docs.sink.cool/features/analytics).

Sink is AGPL-3.0-only; do not copy its source into an MIT project and label that code MIT. A separately operated service is a different integration choice and deserves an explicit license review before adoption. [license](https://github.com/miantiao-me/Sink/blob/bafa4e1f7e3ec034929e11e5542c4c3e116d69da/LICENSE).

## Cloudflare constraints and implementation choices

Workers incoming URLs have a 16 KB limit. Put snapshot creation data in a POST JSON body, not a query string. Static assets are free and unlimited; Worker execution has separate limits, including 100,000 requests/day on Free. D1 Free includes 5 million rows read/day, 100,000 rows written/day, and 5 GB total storage. These are allowances, not a guarantee that an abused public service remains free. Domain registration is separate. [limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/), [asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

Prefer D1 alone initially. KV can cache later, but new values and even previously missing keys can take 60 seconds or more to propagate; a freshly shared prompt should work immediately. [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

Proposed public endpoint controls: validate a narrow snapshot schema; bound UTF-8 payload bytes; random non-enumerable IDs with collision handling; per-client creation throttling; bot checks when needed; expiration, deletion capability, and abuse reporting; no arbitrary external redirect targets. Cloudflare's rate-limit binding is permissive and eventually consistent, so it is unsuitable for strict global quotas. Enforce hard storage/creation budgets separately if required. These controls are recommendations, not features already provided by either project. [rate-limit documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## What shortening cannot fix

A short launcher share URL solves sharing and opening the launcher. When a provider needs `?q=<prompt>`, a short redirect still eventually sends that long URL to the provider. It cannot bypass the provider's URL limit or add prefill support where none exists. For excessive provider URLs, offer explicit “Copy prompt and open” behavior; provider-specific thresholds require separate verified research. A stored launcher snapshot avoids huge URLs until the user selects a provider.

## Decisions before public short-link creation

- Anonymous creation with abuse controls versus authenticated creation; public reading can remain account-free.
- Retention/expiration and a clear statement that anyone holding the link can read it. Random IDs are not access control.
- Maximum prompt-state size in UTF-8 bytes; expiration/deletion and backup policy.
- Variable values included only by explicit sharing action; never silently publish locally saved secrets.
- Domain and accepted operating budget; whether analytics are needed at all.
- Whether community template links track current content or pin a template revision.

Start with template slugs and portable shares; design the stored snapshot adapter without making Cloudflare necessary to run a GitHub-hosted or local static copy. Implement public storage after these policy choices are settled.
