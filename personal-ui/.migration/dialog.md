# dialog

2026-11-09, strategy: replaced with the `@cnippet/dialog` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/dialog.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- Consumers: bodies moved into `DialogPanel`; `onCloseAutoFocus` became `finalFocus={opener}`; `max-h`/overflow overrides removed; `.share-dialog` CSS reduced to panel layout.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes

- Dialog bodies scroll through ScrollArea instead of the popup itself.
- On phones, dialogs now stick to the bottom of the screen (cnippet `bottomStickOnMobile` default).
- Footers have a muted bar with a top border.

## Verify by hand

- Open New prompt, Esc, confirm focus returns to New prompt. Repeat with Preferences and Edit template.
- Open Import backup inside Preferences (nested), close each in turn.
- Fill a long template and confirm the dialog body scrolls with the footer visible.
