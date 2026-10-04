# Prototype the focused launcher and a customized prompts.chat

Planning ticket draft, 2026-10-04. The maintainer selected this comparison before choosing the application foundation. This file does not claim either prototype has been built.

## Question

Which foundation delivers our library-first prompt-launching workflow with the least implementation and operating burden while remaining free and open source?

## Compare the same user journey

1. A guest searches a small curated library, opens a public prompt page, fills variables, and launches or copies the result.
2. A contributor signs in with Google or GitHub, saves a personal preset, and submits a prompt for approval.
3. A moderator approves a submission, producing an indexable public page with correct share metadata.
4. A guest explicitly creates an unlisted snapshot link with a visible 90-day expiry, subject to bot checks and tighter limits, then opens it without sign-in.

## Candidate A: focused launcher

Evaluate React + shadcn with a rendered public-page framework on Cloudflare Workers, D1 storage, and a compatible authentication adapter. Reuse the current launch/variable/share behaviors where reliable. Demonstrate the hardest integration first: sign-in, persistent preset, and rendered prompt metadata.

## Candidate B: customize prompts.chat

Pin an upstream version and examine its self-hosting requirements, code/content licenses, account behavior, and review workflow. Keep its existing framework and database for the comparison. Add only the minimum launcher/variable/preset adaptation needed for the same journey. Do not assume its existing moderation behavior matches our approval requirement.

## Boundaries

- Use local development and synthetic data. No production migration, paid services, public prompt imports, or new accounts without separate authorization.
- Keep each candidate isolated from the current working site; preserve the original application and existing public deployment.
- Use real UI components and clearly label any mocked backend behavior. A mock cannot establish authentication, persistence, or runtime compatibility.
- Limit visual work to a coherent library/editor slice. Final references can guide later styling.
- Test exact prompt restoration, not merely redirect generation, for short links.

## Report

Compare working versus mocked flows, setup friction, migration burden, maintenance/dependency footprint, portability, upstream update burden, and sourced expected costs. List unresolved approval/revision behavior and content-license decisions. Recommend a foundation with evidence and ask the maintainer to choose before implementation tickets.

Related: planning issue #2; docs/product-decisions.md and docs/research/*.md.
