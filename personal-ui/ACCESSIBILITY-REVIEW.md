# Accessibility review

2026-11-09. Target: WCAG 2.2 AA. This records one audit, not a conformance claim.

Scope: the single Promptroom page against a local production build, at 320, 390, 768 and 1280 px in light and dark. States: default, disclosures open, validation error, template editor, preferences, import, share, and an open select.

## Fixed

| Issue | Evidence before | Fix |
| --- | --- | --- |
| Dialog body had no height at a 400%-zoom-equivalent viewport (320x256) | Scroll pane 0px tall | The whole dialog scrolls at heights up to 480px |
| Mobile icon buttons under 24px | 36x20 | 44px minimum on the triggers that replace `data-slot="button"` |
| Share checkbox under 24px | 16-18px | 24px |
| Placeholder contrast | 3.09:1 light | Uses `--muted-foreground`, 5.52:1 |
| Control boundary contrast | 1.40:1 light, 1.82:1 dark | New `--input` token, 3.69:1 and 4.16:1 on the page background |
| Selected prompt relied on a faint fill | 1.11:1 | Primary border and inset bar, plus a forced-colors outline |
| Focus indicator removed by registry `outline-none` | Inputs had no outline | Unlayered 3px `:focus-visible` rule |
| Status messages could be missed by screen readers | `display: none` or inserted with their live region | Live regions stay mounted and in the accessibility tree |
| Named `pre` blocks had no role | axe `aria-prohibited-attr` | `role="group"` |
| Dialog subsections skipped the heading structure | `h2` under the dialog `h2` | `h3` |
| No reduced-motion handling | Transitions always ran | `prefers-reduced-motion` rule |
| Prompt list text centered after migration | Screenshot | Left aligned |

## Reviewed and left as is

- axe `region` on an open Select: the portaled listbox sits outside landmarks while open. Best-practice rule, transient popup.
- axe incomplete `aria-hidden-focus`: Base UI focus guards. In the editor, Tab stayed in the dialog, with one stop on the document body between cycles.
- axe incomplete `aria-valid-attr-value` on `#chat-app`: `aria-controls` resolves to the open list.
- "URL documentation" is 17px tall: inline link in a sentence, covered by the 2.5.8 inline exception, and underlined.
- Desktop controls of 28-40px meet the 24px AA minimum. 44px is applied at phone widths only.
- Icon-only buttons have names and tooltips, but tooltips do not appear on touch.

## Results after fixes

- `astro check`: 0 errors. Vitest: 41 of 41. Build passes.
- axe across 64 width, theme and state combinations: only the `region` entries above.
- 320 px, 200% root font size and WCAG text spacing: no horizontal overflow. Text spacing was checked on the page, not in dialogs.
- SquirrelScan 0.0.172, 5 pages, unpublished: Accessibility 100 before and after. Overall 33 (F) comes from SEO, legal and similar rules, such as missing `robots.txt` and sitemap, which are outside this review.

## Not checked

Screen readers, real phones, actual browser zoom (emulated by viewport and root font size), Accessibility Insights, and testing with representative users. A forced-colors screenshot of the share dialog was reviewed before the fixes only. The audit scripts were not added to the repository, so there is no CI gate.
