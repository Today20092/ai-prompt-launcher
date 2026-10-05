# Personal workspace: share reusable templates and filled prompts

Published as [issue #9](https://github.com/Today20092/ai-prompt-launcher/issues/9). Agreed scope recorded 2026-10-04.

## Working branch

`codex/prompt-sharing`

Create from the updated default branch if absent. Keep unrelated local planning changes intact.

## Parent and blockers

Related to roadmap #1 and redesign #2. No blockers: the personal workbench is already public.

## Goal

Let someone share either a reusable template or its complete filled prompt from Promptroom. Recipients can edit, launch, and explicitly save their own copy. Sharing works without accounts or a backend.

## Agreed behavior

- One Share button opens options for Copy link, Copy template, and Copy filled prompt.
- Default to sharing the reusable template. Pasted field values are excluded unless the sender explicitly chooses to include them.
- Preview exactly what will be shared before copying a link or opening the phone share menu.
- Use versioned, self-contained URL snapshots initially. Later edits to the sender's saved template do not change an existing link. Links have no application-managed expiry or revocation.
- If a complete URL is too large for the supported transport budget, offer full-text copying or a single-prompt JSON file. Never truncate the payload.
- Offer the device share menu when supported, with copy/download fallbacks.
- Stored short links, accounts, synchronization, and public community publishing remain later work.

## Acceptance criteria

- [ ] Share is reachable on desktop and mobile and uses the existing shadcn design system, labels, visible focus, and both themes.
- [ ] Copy template preserves the unfilled body, including named placeholders. Copy filled prompt uses the complete rendered body and the existing required-value rules.
- [ ] Link sharing initially selects Template only. Including filled values requires a deliberate choice and a visible preview. Current pasted input never enters the default link, downloaded template, or saved recipient copy.
- [ ] The versioned link restores the template name, description, and body exactly; optional included values restore only the selected fields as temporary input. Workspace backups, other prompts, favorites, device preferences, and unrelated data are excluded.
- [ ] Shared values and prompt text render as plain text. Compression or encoding is described as transport formatting, not encryption; anyone with an included-value link can read its contents.
- [ ] Opening a shared link displays a temporary received prompt without changing saved templates, the last-used saved selection, or preferences. Recipients can edit, fill, preview, copy, and launch it. Saving a copy is explicit, creates an independent prompt, and handles matching names/IDs without overwriting existing prompts.
- [ ] Link format is distinct from the original launcher's legacy p/prompt format. Existing legacy shared links continue to redirect and work.
- [ ] Invalid, unsupported, or excessively large inbound payloads show a clear recovery message and leave the workspace intact.
- [ ] Choose and document a conservative encoded URL/payload budget; account for the full URL length. Oversized outbound sharing offers exact full-text copy and a validated single-prompt JSON download/import path. A single-prompt file excludes the rest of the workspace.
- [ ] Share menu availability, cancellation, denied clipboard access, and download failures have appropriate fallback/status behavior; cancellation is not reported as an error. Clipboard/navigation/share actions run only on explicit user actions.
- [ ] Automated behavior checks cover template-only exclusion, optional exact filled-value restoration, multiline/Unicode/reserved characters, snapshot independence, malformed/unsupported payloads, oversized fallback, and recipient saving without overwrites. Reuse the renderer's required-value tests.
- [ ] Demonstrate sending a template link from one browser and receiving/editing/saving it in another, plus mobile share/copy/file fallback checks. Use synthetic content and record which browser/device was actually verified.
- [ ] Typecheck, full tests, production build, and Standards/Spec review pass before committing. Verify public /ai-prompt-launcher/ and local preview base paths.

## Test seams

Share payload encode/decode and recipient copy/save behavior are the agreed behavior boundaries. Avoid tests that mirror component markup or private helpers.

## Deployment

Publish through the existing GitHub Pages workflow after validation. Preserve the legacy launcher and the Tailscale review preview.
