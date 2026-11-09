# label

2026-11-09, strategy: replaced with the `@cnippet/label` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/label.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- No consumer imports it directly; `FieldLabel` is used everywhere. Kept as the installed primitive.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes



## Verify by hand

- Click a field label and confirm its control takes focus.
