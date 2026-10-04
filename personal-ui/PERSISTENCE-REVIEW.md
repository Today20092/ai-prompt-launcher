# Issue #5 implementation review

## Current scope

The maintainer subsequently removed presets from the requested feature set and chose per-prompt chat-app memory. The preset section, preset dialog, author controls, operations and styles are removed. Existing preset records and variable metadata remain archived in saved data and are never applied. Each prompt's optional `chatApp` is validated against the existing app catalog; older prompts fall back to the saved preferred app. Editing a template preserves its app and archived data. All current variable values remain session-only.

Validation for this change: Astro check passes with zero diagnostics, the existing four tests pass, and the production build passes. Browser checks assigned ChatGPT to Grammar corrector and Claude to Transcript cleanup, verified independent selection across switching and reload, and confirmed template editing preserves the selected app. The 390px mobile view has no preset text or horizontal overflow. Preview app choices were returned to T3 Chat after verification.

Independent reviews of this scope change found zero Standards findings and zero Spec findings.

The sections below record the earlier preset implementation and review, before that scope change.

Working branch: `codex/personal-mobile-workbench`, selected by the maintainer to continue on the branch containing issue #4. Fixed point: `9adbcb0cb19ea468d6ed30423ba8ee9cf60c85b3`. Issue #4 is complete on this branch; its implementation and validation are recorded in REVIEW.md.

The workspace uses a versioned browser-local document. Template definitions, favorites, named presets, preferred app, and last-used selection persist. Current field values stay in memory. Defaults are entered separately in the preset editor, limited to variables the author explicitly allows as reusable. Text and transcript variable names always remain temporary.

## Standards

The independent reviewer found no documented-standard violations or concrete data-preservation defect. One optional duplication finding was fixed: a shared typed chat-app catalog now supplies both the selector and saved-data validation.

## Spec

The independent reviewer found one incorrect fallback: an absent Grammar corrector could cause a stale selection to open an arbitrary prompt. The fallback now restores Grammar corrector without replacing saved templates. Both reviewers rechecked the fixes and reported zero remaining code findings. No other incorrect implementation or scope creep was identified.

The required automated persistence behavior coverage is pending the maintainer's response to the test-seam question. This issue is not claimed complete until that coverage is added and passes.

## Validation

- Astro typechecking passed with zero errors, warnings, or hints. The static production build passed.
- The existing full suite passed all four prompt-rendering tests. These tests do not cover the new persistence module.
- Tailscale HTTPS preview on port 8449 verified template creation, favorite restoration, last-used selection, preferred-app restoration, preset creation, rename and application, and preserved temporary input during application. Reload restored the template, favorite and preset while clearing pasted input. Saved JSON did not contain the synthetic pasted text.
- Malformed JSON and version 99 displayed recovery guidance; retry did not overwrite malformed data. A missing last-used ID opened Grammar corrector.
- Simulated quota failure produced a visible saving warning while keeping the changed favorite in session memory. Denied storage at startup produced a saving warning while allowing synthetic input editing. Normal storage behavior was restored afterward. The preview was returned to its original two starters and T3 Chat preference after synthetic testing.
- The corrected fallback was also verified in the preview with both the Grammar corrector template and last-used selection missing.
- The 390px mobile viewport showed no horizontal overflow. The preset dialog fit inside the viewport, with visible labels, focused name input, defaults, app selector and actions.

The legacy GitHub Pages deployment is unchanged. The new storage key is separate from the legacy app's saved data. Existing Tailscale mappings are preserved.
