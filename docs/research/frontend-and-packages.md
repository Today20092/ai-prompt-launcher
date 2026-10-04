# Frontend and package choices

Research date: 2026-10-04. Planning only; nothing installed or migrated.

## Confirmed requirements

shadcn/ui is required. The first screen is a searchable library with one-click launch or editing. Contributors should have easy sign-in; submissions require maintainer approval. Each public prompt needs its own indexable page and useful share preview. Personal short links are wanted if free or cheap. Target $0 launch costs, with $5–10/month later if needed.

## Frontend

shadcn supports both Vite and Next.js and copies editable component source into the project. It does not require Vercel or a paid host. Its current Vite guide uses React, TypeScript, and Tailwind. Retrieved through Context7 /shadcn-ui/ui: [Vite guide](https://ui.shadcn.com/docs/installation/vite), [CLI](https://ui.shadcn.com/docs/cli).

Recommendation: migrate the existing DOM-driven editor into React components with semantic theme tokens. Use library search, prompt cards, a variable form, a provider picker, and accessible dialogs. Choose the final visual direction after the maintainer supplies references.

Public prompt pages require a deliberate rendering strategy. React Router framework mode supports SPA, prerendering, and runtime server rendering. Static prerendered content requires a rebuild when records change. Retrieved through Context7 /remix-run/react-router: [rendering](https://reactrouter.com/start/framework/rendering), [prerendering](https://reactrouter.com/how-to/pre-rendering).

Recommendation: compare React Router framework mode on Workers with Next.js on Vercel for dynamic public prompt pages. A single static SPA shell would not meet the requested page-content and share-preview behavior by itself. Keep metadata derived from the published record; a useful text preview does not require AI-generated images.

## Package shortlist

These are recommendations by role, not a list to install wholesale.

| Role | Candidate | Purpose |
| --- | --- | --- |
| Interface | React, TypeScript, Tailwind, shadcn/ui | Library, editor, variables, submission and moderation screens |
| Routing and rendering | React Router framework mode or Next.js | Choose one stack with rendered public prompt pages |
| Validation | zod | Prompt records, imports, submissions, and shared snapshots |
| Database access | Native D1 queries or drizzle-orm | Use one migration approach consistent with the auth adapter |
| Forms | react-hook-form if needed | Dynamic variable and submission form state |
| Icons | lucide-react if chosen by the shadcn preset | Consistent icons |
| Unit tests | vitest | Substitution, encoding, import validation, authorization |
| Browser tests | @playwright/test | Browse/edit/launch, sign-in, moderation, share restoration |
| Portable sharing | Existing lz-string | Preserve older compressed links; optional portable shares |

Primary sources: [Zod](https://github.com/colinhacks/zod), [Drizzle](https://github.com/drizzle-team/drizzle-orm), [React Hook Form](https://github.com/react-hook-form/react-hook-form), [Lucide](https://github.com/lucide-icons/lucide), [Vitest](https://github.com/vitest-dev/vitest), [Playwright](https://github.com/microsoft/playwright). Fetch scoped API docs and verify pinned compatibility before implementation. This note does not claim the combined stack has been integration-tested.

## Defer until needed

Start with title/tag/text search rather than an external search service or embeddings. Launching prompts in external chatbots does not require an AI SDK or paid inference. Avoid adding realtime collaboration, billing, object storage, a rich text editor, or a global state library without a first-release need.

Treat prompt bodies as text, not trusted HTML or executable template expressions. Preserve exact content unless users deliberately choose whitespace normalization.

## Migration requirements

- Preserve v1/v2 compressed URLs and legacy prompt links, including Unicode and literal plus signs.
- Import existing browser-local templates and custom providers without silent loss.
- Distinguish templates, filled prompts, public records, personal presets, and share snapshots.
- Verify each provider separately; offer copy-and-open for unsupported prefill and excessive destination URLs.
- Verify guest, contributor, and moderator permissions independently.

See stack-options.md, community-examples.md, and link-shortening.md for related research. Final choices remain subject to the maintainer's review.
