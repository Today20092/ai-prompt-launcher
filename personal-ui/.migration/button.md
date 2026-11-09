# button

2026-11-09, strategy: replaced with the `@cnippet/button` Base UI wrapper via CLI (not the shadcn base-nova golden pair, because the request was to adopt cnippet). Migrated; check, tests and build pass.

## Changed

- `src/components/ui/button.tsx`: replaced with the cnippet Base UI version (stock wrapper, no local customizations carried over).
- Consumers: `asChild` triggers became `render={<Button />}`; the manual-copy link is now `Button variant="link" render={<a />}`.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` finds nothing in this component's files.

## Left alone

- `js/config.js` and `docs/research/chat-destination-urls.md`: unrelated changes that appeared in the working tree during this run; not committed here.

## Behavior changes

- New look and sizing (h-9, h-8 at sm and up). Global 44px mobile rules in `global.css` still apply.

## Verify by hand

- Tab through header buttons and confirm a visible focus ring.
- At phone width, confirm buttons are still 44px tall.
