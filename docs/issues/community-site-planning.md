# Plan the UI redesign and low-budget community prompt website

## Goal

Turn AI Prompt Launcher into a polished, easy-to-use community website where people can discover, reuse, and contribute prompts. Keep operating costs as low as possible and preserve the free, open source project.

This is a planning ticket. Do not implement the redesign, provision services, or migrate hosting as part of this ticket.

## Current foundation

The standalone repository and GitHub Pages site are live. The current app has a prompt editor, variables, browser-local saved templates, custom chatbot destinations, and compressed URL shares. Prompt submission issues are available, but there is no in-app community library, account system, or stored short-link backend.

## Requirements and preferences

- Improve the interface substantially, including mobile usability, clear navigation, accessible controls, and the relationship between the editor and library.
- Prefer shadcn/ui for the new interface. Confirm the framework and migration approach before changing the existing static app.
- The maintainer will provide visual references. Review them before settling the visual direction.
- Keep browsing prompts and launching them simple. Avoid requiring login for these basic actions unless an identified requirement demands it.
- Explore Google login so people can contribute additional prompts and potentially keep personal presets across devices.
- Compare Cloudflare and Vercel for ease of operation, current pricing and allowances, and support for the required backend. Keep GitHub Pages in the comparison as the current static baseline.
- Plan contribution review, editing, ownership, and moderation rather than assuming every submitted prompt is published immediately.
- Coordinate with the existing roadmap and link-shortening research. Preserve current share links and personal template imports during any migration.

## Decisions settled during research

- shadcn/ui is required.
- Start with a searchable library and one-click launch or editing.
- Require easy sign-in for contributions, with maintainer approval before publication.
- Signed-in users' personal presets should synchronize across devices.
- Give every public prompt its own indexable page and useful share preview.
- Support unlisted personal short links only if free or cheap; a 90-day lifetime is acceptable.
- Target $0 at launch with $5–10/month later if needed.
- Compare a focused launcher with a customized prompts.chat in bounded prototypes before choosing the foundation. See issue #3.
- Allow anonymous short-link creation with bot checks and tighter limits.
- Use CC0 for contributed public prompts and MIT for the application code.

## Interview topics

Some topics below are now settled above; retain the list as the planning checklist rather than asking the same questions again.

1. What visual references and layout direction should guide the redesign? Is the main entry point the prompt editor, the library, or a combined view?
2. Should visitors contribute through GitHub issues initially, or should the first redesign include signed-in submissions directly on the site?
3. Should Google be the only sign-in option, or should GitHub also be supported for an open source audience?
4. Do submissions require approval before appearing publicly? Who can edit a published prompt, and how should changes be reviewed?
5. Are personal presets device-local initially, or must accounts synchronize them in the first release?
6. What monthly spending ceiling is acceptable? Distinguish an intended $0 launch from a firm ongoing spending cap.
7. Which capabilities belong in the first release versus later tickets: library search, tags, presets, accounts, submissions, saved prompts, or stored short links?

Do not treat proposed answers as approved requirements. Fetch current official documentation and pricing when comparing hosting, authentication, and framework options.

## Deliverables

- A brief agreed UI direction grounded in the supplied references and the editor/library workflow.
- A hosting and authentication comparison with sourced costs, relevant limits, required external setup, and an explicit recommendation.
- An agreed first-release scope, including guest behavior, submission review, and preset storage.
- A migration plan that preserves existing prompt data and share links.
- Small implementation tickets with acceptance criteria and blocking dependencies.

## Completion criteria

The maintainer has reviewed the decisions and first-release scope, and the resulting implementation tickets are actionable without guessing at the unresolved questions above. This planning ticket's completion does not authorize production migration or paid service purchases.

Related: roadmap issue #1; docs/research/link-shortening.md.

## Research and follow-up

- [Hosting, database, authentication, and costs](https://github.com/Today20092/ai-prompt-launcher/blob/main/docs/research/stack-options.md)
- [Frontend and package shortlist](https://github.com/Today20092/ai-prompt-launcher/blob/main/docs/research/frontend-and-packages.md)
- [Similar community libraries and reuse](https://github.com/Today20092/ai-prompt-launcher/blob/main/docs/research/community-examples.md)
- [Shortening comparison](https://github.com/Today20092/ai-prompt-launcher/blob/main/docs/research/link-shortening.md)
- [Recorded product decisions](https://github.com/Today20092/ai-prompt-launcher/blob/main/docs/product-decisions.md)

Foundation prototype comparison: #3. Cloudflare is the strongest budget candidate in the research; it is not yet a selected or deployed replacement. Review of edits to already-published prompts remains an unanswered interview question.
