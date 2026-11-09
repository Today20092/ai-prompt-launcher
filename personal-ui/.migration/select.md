# select

2026-11-09, strategy: replaced with the `@cnippet/select` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/select.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- `Workbench.tsx`: six Selects now use a local `ChoiceSelect` passing `items`, since Base UI shows raw values without them. Received prompts use `null` rather than `''` for the placeholder.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes

- The popup aligns the selected item over the trigger (`alignItemWithTrigger` default), so its position may differ from the Radix version.

## Verify by hand

- Open each Select and use arrows, typeahead, Enter, Esc.
- Confirm triggers show labels, such as Use preferred (T3 Chat), never raw values.
- Open a received share link at phone width and confirm the picker shows Temporary received prompt.
