# Community prompt libraries and sharing tools

Researched 2026-10-04 using first-party repositories and documentation. Recommendations are proposed decisions; no product implementation changed.

## Closest existing project: prompts.chat

[prompts.chat](https://prompts.chat), formerly Awesome ChatGPT Prompts, is the strongest verified match: a self-hostable community prompt website. Its repository explicitly licenses application code under MIT and prompt data/user submissions under CC0. Users can add prompts through the website, which syncs them to the repository. [Repository and licensing](https://github.com/f/prompts.chat).

Its self-hosting guide documents anonymous browsing, GitHub/Google sign-in for creating and saving prompts, private prompts, inline variables, categories, tags, voting, version history, and change requests. Deployment requires Node.js 24 and PostgreSQL. AI-powered search is optional and requires an API key. [Self-hosting guide](https://github.com/f/prompts.chat/blob/main/SELF-HOSTING.md).

The source already contains shadcn configuration; dependencies include Next.js, React, Prisma, NextAuth, React Hook Form, Zod, Lucide, and Tailwind. These are observed dependencies, not recommendations to copy their versions. In particular the listed NextAuth dependency is a beta. [shadcn configuration](https://github.com/f/prompts.chat/blob/main/components.json), [package manifest](https://github.com/f/prompts.chat/blob/main/package.json).

**Recommendation:** evaluate a fork/customized instance before building accounts, moderation, versioning, and a public library from scratch. The alternative is to keep our launcher focused and import selected CC0 templates with source attribution. Our differentiator could be reliable provider launching, useful typed variables, reusable personal presets, and portable sharing. Neither broad model compatibility nor “use in any chat” establishes that every provider supports URL prefill. The reviewed docs do not establish a general short-link service or all ten existing launcher providers.

## Other verified open-source references

| Project | What is verified | Fit and reuse |
| --- | --- | --- |
| [LangGPT](https://github.com/langgptai/LangGPT) | Structured prompt framework, examples, variables, modular prompt design; repository Apache-2.0 license. [License](https://github.com/langgptai/LangGPT/blob/main/LICENSE). | Learn reusable template structure and explanatory examples. It is a prompt design collection/framework, not a verified signed-in public prompt-library application with moderation or shortening. |
| [PromptSource](https://github.com/bigscience-workshop/promptsource) | Apache-2.0 toolkit, structured prompt files, Jinja templates, contribution guidelines, and a web GUI. Hosted GUI is explicitly read-only; contributions follow repository guidelines. | Learn portable template files, previews against example inputs, metadata and review. This is dataset-oriented NLP tooling, not a consumer chatbot launcher. Its documented Python 3.7 constraint makes it a poor runtime dependency for our app. |

These are three verified open-source matches with different purposes. Only prompts.chat is a close replacement for the requested community website. Do not pad a shortlist by treating every prompt list or free website as an equivalent application.

## Useful references with unverified or unsuitable reuse rights

- [AI Prompt Genius](https://github.com/AI-Prompt-Genius/AI-Prompt-Genius) is a React/Tailwind browser extension for a custom prompt library and Google-auth syncing. Its README specifies CC BY-NC-SA 4.0, including a noncommercial restriction. Treat it as a UX reference, not a permissively licensed foundation for our MIT project or an established public community website.
- [FlowGPT](https://flowgpt.com/) exposes discovery, categories, leaderboards, and creation. No official source repository/license establishing that the full hosted platform is open source was verified here. Use it as a discovery/UI reference only; “open platform” is not evidence of an open-source software license.
- [Prompt Stack](https://github.com/strand1/prompt-stack) demonstrates tags, copy, duplicate/edit, JSON import/export, and image prompt cards using Node/SQLite. The reviewed README does not establish community account/moderation features, and a root LICENSE fetch did not succeed. Reuse rights remain unverified; use the product ideas, not its code.

## Link shortening: keep the distinctions clear

The earlier [link-shortening research](link-shortening.md) remains the detailed proposal.

| Option | What it does | Recommendation |
| --- | --- | --- |
| [ha.mr](https://github.com/p2r3/ha.mr) ([MIT](https://github.com/p2r3/ha.mr/blob/main/LICENSE)) | Encodes/compresses a URL entirely in the browser without a database; optimizes URL components and QR encoding. | Optional portable URL/QR feature. Cannot guarantee a small fixed-size URL for arbitrary long prompt text. Applying another compressor to already compressed state may achieve little. Benchmark representative prompts first. |
| [Sink](https://github.com/miantiao-me/Sink) | Cloudflare-hosted redirect service; current README says D1 authoritative storage, KV cache, Drizzle, Nuxt, shadcn-vue, analytics, expiry, and JSON import/export. AGPL-3.0-only. Intended for individuals/small teams; API/MCP access uses a privileged site token. | Strong separate self-hosted generic shortener. Public community writes still need our authenticated/limited gateway; never ship the site token in the frontend. Its Vue components do not directly supply React shadcn components. |
| [lz-string](https://github.com/pieroxy/lz-string) | JavaScript text compression library. | Keep existing portable state compatibility; changing codecs needs a versioned decoder and round-trip tests. Compression is reversible and does not encrypt prompts. It does not replace storage-backed short IDs. |
| App-owned snapshot IDs | Our proposed `/s/<random-id>` loads saved prompt state directly rather than redirecting to a huge URL. | Best fit for prompt text, variables, presets, and provider selections. Implement a narrow storage adapter, not a general arbitrary-target shortener. This row is our design recommendation, not an existing package. |

Sink's [current README](https://github.com/miantiao-me/Sink) recommends Workers deployment and marks Pages deployment deprecated. Do not use old tutorials as current architecture evidence. Separately operating Sink and copying AGPL source into our MIT repository are different choices; preserve the source's actual license if reused.

**Recommended share modes:** reviewed community template slugs; database-free compressed fragments; explicit opt-in stored snapshots for long personal shares. A short launcher URL cannot remove a chatbot's own URL limits when launching into its query parameters. Maintain copy-and-open fallback. Snapshot sharing must clearly say what text and variable values become readable by a link holder.

## Questions that change the product decision

User decisions received during research: anyone may submit; maintainer approval is required before publication; the primary flow is searching the library then launching or editing; initial service budget is $0, with $5–10/month acceptable later. Therefore a pending/published moderation state and a review queue are requirements. Do not assume the reviewed projects' voting/change requests implement exactly that publication policy; verify it in source before choosing a fork. Library cards should prioritize task title, a concise description, variables, and launch/edit actions.

1. Why should a user choose this over prompts.chat: better launching, simpler variables/presets, a niche library, or a different community?
2. Would customizing prompts.chat be acceptable, or is preserving our small launcher architecture essential?
3. How quickly can the maintainer review the queue, and who handles removal requests? Publication must wait for approval.
4. Are private cloud prompts needed, or do local presets plus public templates cover the first release?
5. Should share links preserve an immutable snapshot or always show the latest template revision?
6. Can public prompts use CC0 while application code remains MIT, or should contributors retain another content license?
7. Is anonymous short-link creation required, or can sign-in be required only for storage/submission while browsing and launching remain open?

Choose these before copying a feature-rich platform or creating multiple hosted services. Library content licensing and application licensing need explicit separate rules; making the code MIT does not automatically license third-party prompts.
