# badge

2026-11-09, strategy: replaced with the `@cnippet/badge` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/badge.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- Consumer `Workbench.tsx` unchanged apart from the badge now sitting inside a Collapsible trigger.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes



## Verify by hand

- Open the prompt preview and confirm the variable-count badge reads correctly in light and dark.
