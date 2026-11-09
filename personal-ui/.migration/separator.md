# separator

2026-11-09, strategy: replaced with the `@cnippet/separator` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/separator.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- Consumer `BackupControls.tsx` unchanged.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes



## Verify by hand

- Open Preferences and confirm the divider above Backups renders.
