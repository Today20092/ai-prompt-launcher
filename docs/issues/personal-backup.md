# Personal workspace: export and safely merge JSON backups

Issue: https://github.com/Today20092/ai-prompt-launcher/issues/6

## Working branch

`codex/personal-mobile-workbench`, confirmed by the maintainer. Blockers #4 and #5 are implemented on this branch at review base `563e6447ab025d3dcabd5863a0e251ef071e7751`.

## Scope

Export a versioned JSON backup of templates, favorites, archived presets, preferred app, last-used prompt and per-prompt app/T3 options. Current pasted input is temporary and excluded. Presets remain archived without controls, as agreed during #5.

Validate the entire file before any write. Review additions and identical duplicates before applying a merge. Preserve existing prompts, remap conflicting IDs and references, and distinguish equal names with different content. Repeated import must not duplicate tools or archived presets. Keep device preferences; restore backup preferences only into a fresh workspace. Failed imports preserve saved and session data and explain the failure.

Agreed test seams: export/merge public functions and the workspace storage interface, including round trips, repeated import, collisions, malformed/unsupported files and failed storage. Use TDD in vertical slices, typecheck regularly, then run the full suite once at the end. Review against `563e644` with the code-review workflow and commit to the working branch.

Use Astro, React and existing shadcn components. Demonstrate transfer through the Tailscale preview. Keep the legacy GitHub Pages site available. Accounts, backend, community publishing and stored short links are outside this ticket.
