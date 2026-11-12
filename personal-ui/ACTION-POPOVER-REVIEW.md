# Action popup verification

2026-11-12. Implementation scope: Workspace in the header and Prompt actions beside the editor/picker. Target: WCAG 2.2 AA; this is a focused review, not a conformance claim.

## Pattern and source

Both action groups use the premade [cnippet Popover](https://ui.cnippet.dev/r/popover.json), installed with `corepack pnpm dlx shadcn@latest add @cnippet/popover --yes`. The registry added only `src/components/ui/popover.tsx`; the existing Base UI dependency already satisfied it. Existing buttons, tokens and global focus treatment remain authoritative.

The [Base UI 1.9 Popover documentation](https://base-ui.com/react/components/popover) defines anchored placement, collision handling, default focus, Escape and outside dismissal. These are nonmodal interactive popups with labeled dialog semantics and ordinary buttons, not ARIA menus requiring arrow-key navigation. Dialogs launched from the popup return to its visible toolbar trigger, following the focus-return principle in the [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Contract: opening either action group leaves the header, brand, prompt heading, input, preview and launch controls stationary. Popup content overlays the page and stays within the viewport. Preview and T3 options remain in-flow content disclosures. Transfer invitation listeners stay mounted while their popup is closed.

## Executed checks

OpenCode browser extension 0.0.16, connected Chrome, isolated local production build at `127.0.0.1:4341`, synthetic input only:

- At 320, 390, 768 and 1280 CSS px, each popup left all six measured content rectangles unchanged. Both stayed within the viewport with no horizontal page overflow.
- Enter opened the popup and moved focus inside. Escape closed both and restored the corresponding trigger. Outside click dismissed the popup while retaining input.
- Preferences, Transfer, Edit template and Share opened their dialogs; Escape returned focus to Workspace or Prompt actions, respectively.
- At 320px, dark theme, 200% root text size and simultaneous text-spacing overrides (line-height 1.5, paragraph margin 2em, letter-spacing .12em, word-spacing .16em), both popups fit and left the input stationary.
- Hovered popup action text measured above 13:1 in light and 11:1 in dark against composited rendered backgrounds. Phone popup actions retain a 44px minimum height.
- Forced-colors and reduced-motion emulation supported keyboard opening; focused Share retained a solid 3px outline.
- Phone light and desktop light screenshots were visually inspected with a popup open.
- Astro check: 0 errors, warnings or hints. Vitest: 60 tests across 9 files passed, including portaled popup/Escape focus, dialog-return focus and transfer-invitation regressions. Production build passed.

## Static scan and limits

SquirrelScan 0.0.43 ran offline against one local page before and after, using `squirrel audit http://127.0.0.1:4341 --offline --max-pages 1 --format json --output <report>` (follow-up also used `--refresh`). Both runs reported overall 30/F, Accessibility 87, 87 passed checks, 24 warnings and 6 failures. There were no new scan findings. The scanner's static report cannot validate popup positioning or focus.

Existing accessibility findings concern hidden Base UI Select inputs (focus/name/label rules) and heuristic class-based contrast warnings; this change did not address or classify those as conforming. Other findings include sitemap, robots and general site metadata. Raw local reports are in `.scratch/action-popover/baseline.json` and `after.json` (gitignored).

Not executed: axe, Accessibility Insights, screen-reader testing, real phone testing or actual 400% browser zoom. Narrow viewport and root-text resizing are separate checks, not substitutes for those. Real chat sends and relay transfers were not performed.
