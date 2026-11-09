# project

2026-11-09, whole-project migration to Base UI by adopting the `@cnippet` registry. Passing: `astro check` 0 errors, 41/41 tests (baseline 40/40 plus one new), build OK.

## Dependency swap

- `components.json`: style `radix-nova` to `base-nova`; added `@cnippet` registry (`https://ui.cnippet.dev/r/{name}.json`).
- Added `@base-ui/react`; removed `radix-ui`.

## App-code sweep

- Added and used: alert, checkbox, collapsible, fieldset, form, item, toggle, tooltip (with spinner and scroll-area as dependencies).
- Native `<details>` became Collapsible, and summary CSS selectors moved to `[data-slot="collapsible-trigger"]` / `[data-panel-open]`.
- `data-invalid` became `invalid` on Field; conditional FieldError uses `match`.
- cnippet has no FieldGroup/FieldSet/FieldLegend: replaced with flex divs and Fieldset/FieldsetLegend.

## Final build

`pnpm build` completes. No pre-existing failures at baseline. 0 wrappers remain on Radix.
