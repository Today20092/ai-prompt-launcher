# Promptroom: shortest path to the community site

Reviewed October 17, 2026 against the seven open GitHub issues and local planning/comparison reports. This is a recommended priority order, not a claim that the proposed work is finished. No GitHub tickets were changed.

## Where we want the website to go

A personal prompt workspace with a community library, taking useful ideas from prompts.chat:

- Open your own saved prompts first. Fill variables, copy the result, or launch it in your preferred AI tool.
- Sign in and access your saved prompts on another device.
- Open a separate Explore area to search public prompts and save independent copies into your workspace.
- Submit prompts through the website, including importing a prompt file. A maintainer approves them before they become public.
- Give each approved prompt a permanent public page and share link.

We do not need feature parity with prompts.chat to launch. Comments, voting, social profiles, AI generation, a huge imported catalog, and complex collections are not required for this core experience.

The latest foundation report records your decision to continue focused Promptroom rather than fork prompts.chat. It also records approval of the current layout, with further visual work deferred. Older tickets still ask for that foundation decision; they need updating, not another comparison.

Evidence: [October 17 foundation comparison](docs/research/foundation-runtime-comparison-2026-10-17.md).

## What exists, and what is still missing

The published personal workbench already has local saving, backup import/export, sharing, and provider handoff, according to the current issue descriptions and comparison report. Some tickets remain open for verification, so unchecked boxes do not mean all those features still need building.

A separate local backend prototype demonstrated real sign-in, private templates, named preset persistence across sessions, owner-only export, submission approval, public page metadata, and expiring snapshots. That is useful integration evidence, but it is not the production website. It has not connected the approved editor, account UI, and public pages into a finished application.

The main missing pieces are:

1. **Integrated backend and deployment.** Connect the existing editor to the actual account/database application. Resolve the Astro/Workers integration gate identified by the comparison. The standalone Workers prototype passing does not establish that the complete app deploys and works.
2. **Usable accounts.** Sign-in/sign-out UI, production session configuration, and a complete path for the chosen login method. The prototype used email/password; Google login was discussed but is not implemented by that experiment. Password login needs recovery before a public launch.
3. **Private cloud saves and device sync.** Save and load each user's prompts, import existing local prompts deliberately, and handle failed or conflicting saves without silent data loss. Two devices must read the same server data. Live collaboration and elaborate offline merging can wait.
4. **Explore.** Searchable approved prompts, public detail pages, and an explicit Save a copy action. Start with a small useful collection.
5. **Contributions and moderation.** An authenticated submission form, a prompt-file import path, a pending queue, and approve/reject controls. Imported private prompts must not become public automatically. Existing sharing-file support should be reused where suitable; uploading a public contribution is a separate action.
6. **Basic production operations.** Secrets and permissions, database migrations and backups, clear save errors, a moderator account, and a way to remove unwanted published content.

Named presets have appeared in the desired long-term workflow, but the old personal plan removed their UI. The comparison demonstrated them on the server without restoring that UI. Basic prompt sync should ship first unless presets are essential to your daily use. Pasted transcripts should remain temporary by default.

## Every currently open ticket

| Ticket | What it represents now | Recommendation |
| --- | --- | --- |
| [#1 — Roadmap](https://github.com/Today20092/ai-prompt-launcher/issues/1) | An older umbrella plan, including a foundation already published and accounts described as later work. | Rewrite around the milestones below. Your current request moves accounts and sync into the core roadmap. Do not treat every historical bullet as a launch blocker. |
| [#2 — UI redesign and community planning](https://github.com/Today20092/ai-prompt-launcher/issues/2) | Mixes research, UI choices, foundation selection, accounts, hosting, and contributions. Several decisions are now recorded elsewhere. | Reconcile completed decisions and replace remaining broad planning with small implementation tickets. Defer another redesign. |
| [#3 — Focused launcher versus prompts.chat](https://github.com/Today20092/ai-prompt-launcher/issues/3) | GitHub still requests a comparison; the October 17 report records the comparison and your selection of focused Promptroom. | Record the evidence and decision. Close the comparison scope once its status is reconciled; carry production integration work into a new ticket. Do not repeat both prototypes. |
| [#6 — JSON backups](https://github.com/Today20092/ai-prompt-launcher/issues/6) | Backup implementation exists; outstanding cross-browser demonstration/verification remains. Some wording predates deployment. | Retain the no-data-loss checks and do one representative export/import smoke check. Close supported criteria rather than treating this as a new feature project. |
| [#7 — T3 handoff](https://github.com/Today20092/ai-prompt-launcher/issues/7) | Handoff and long-prompt fallback exist. The latest comparison records your confirmation that the published launcher sends to T3; the ticket requests broader signed-in mobile evidence. | Reconcile that confirmation with the ticket. Keep exact full-copy fallback; defer an exhaustive provider/device matrix. Record unverified combinations honestly. |
| [#9 — Prompt sharing](https://github.com/Today20092/ai-prompt-launcher/issues/9) | Sharing exists; actual cross-browser/mobile receipt and fallback checks remain outstanding. | Do one send/open/save smoke check and retain default exclusion of pasted values. Broader native-share/device coverage can follow launch. |
| [#10 — Effect 4 refactor](https://github.com/Today20092/ai-prompt-launcher/issues/10) | A technical refactor of existing local-data behavior; explicitly excludes accounts, sync, and community publishing. | Remove it from the launch critical path. Reconcile what has already landed—the comparison mentions an Effect refactor in another checkout—before deciding whether to defer or close the remaining scope. Do not repeat completed work. |

There are seven open issues, but there is no clear, current set of implementation tickets for the integrated accounts/sync/community release. That mismatch makes the backlog look busier while hiding the actual work needed.

## Recommended build order

### Milestone 1: my prompts on both devices

Build one complete flow: sign in → save a private prompt → sign in elsewhere → load/edit it → return and see the saved change.

- Integrate the existing workbench, authentication, database, and deployment.
- Add explicit private cloud save/load and a deliberate transfer of existing browser-local prompts.
- Prevent users from accessing each other's private data.
- Detect stale saves and offer reload/retry rather than silently overwriting a newer edit.
- Keep backup/export and guest local use available.

This is the next useful release. It delivers your biggest missing daily-use capability without waiting for community features.

### Milestone 2: discover and reuse public prompts

- Add Explore with search and a small curated set of approved prompts.
- Add permanent public prompt pages with useful titles and share previews.
- Let visitors use prompts without signing in; signing in lets them save a private copy.
- Keep the personal editor as the main entry point.

### Milestone 3: people contribute through the website

- Add signed-in submission by form or supported prompt file.
- Add a small moderator queue with approve/reject and removal.
- Keep pending content private from public browsing and public URLs.
- State contribution terms explicitly. Earlier decisions select CC0 for public contributions; the latest report flags the contributor permission wording as unfinished. Private content must remain outside those terms.
- Choose a minimal published-edit rule. Recommended first version: published content changes require approval; the last approved version stays public. This remains a product recommendation, not a previously settled rule.

This milestone completes the core community site you described.

### After the core site works

Stored short links and anonymous snapshot creation; advanced presets; collections and language/tag refinements; broader provider verification; visual redesign; comments/votes; bulk corpus imports; large technical refactors. Existing portable share links reduce the urgency of a stored short-link service.

## What testing is actually necessary

Reduce duplicated evidence requirements and broad matrices, not checks that protect private content and saved data.

Keep a small set of behavior checks:

- Another account and a guest cannot read or overwrite private prompts.
- Save on one session, load on another, preserve exact text, and detect conflicting edits.
- Failed imports or saves leave existing data intact.
- Pending submissions cannot be read publicly; approval makes the intended content public.
- Received/imported text is rendered safely, and sharing excludes private pasted values by default.

Run the existing relevant checks and production build, then smoke-test the main journey at desktop and mobile widths. One real two-device account journey is more valuable for this release than repeated synthetic handoff checks. Additional physical-device/provider combinations can be recorded as follow-up work without claiming they passed.

Do not block the launch on testing Effect internals, component markup, every optional browser feature, or every provider. Do not use a lack of exhaustive verification to reopen features that already work.

## Immediate backlog cleanup

1. Reconcile #1–#3 with the recorded foundation/layout decisions.
2. Separate completed implementation from remaining verification in #6, #7, and #9; finish the small checks that justify closing them.
3. Take #10 off the critical path and check its actual branch/merge status.
4. Create implementation tickets for the three milestones, starting with integrated accounts and private cloud saves.

The priority is a usable personal workspace with accounts and sync, then a useful public library, then moderated contributions. More planning prototypes and a broad refactor should not stand between us and those releases.

## Review limits

This review inspected the live open-issue list and local project reports, with graph discovery of the current checkout. It did not run the website, rerun tests, verify production accounts, or audit every branch. Some local reports describe work in separate scratch checkouts, so their integration/merge status must be confirmed before marking GitHub criteria complete. No new hosting prices or upstream feature claims were researched for this summary.
