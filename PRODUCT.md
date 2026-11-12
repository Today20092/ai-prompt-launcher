# Promptroom

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals who reuse saved prompts with their own input in AI chat apps. Their recurring job is to open a saved prompt, add input, and send it to chat easily and intuitively.

## Product Purpose

Promptroom is a personal prompt workbench. It makes reusable prompts practical for everyday use: choose a template, fill its variables, preview the complete result, and send it to a preferred chatbot.

Success means completing that flow with little effort and a clear understanding of what will be sent.

## Operating Context

- The current app lives in `personal-ui/` and is published as a static site on GitHub Pages.
- The workbench runs in the browser without an account. Saved workspaces belong to the current browser and origin.
- Users can save and edit templates, mark favorites, and choose a preferred chat app or a per-prompt override.
- JSON backups and explicit device transfers move saved libraries between browsers. Device transfer is a one-time action, not background synchronization.
- The original launcher remains available at `/legacy/`.

## Capabilities and Constraints

- Named variables are required multiline inputs. Repeated names share one field. Missing values remain visible as placeholders and block copy or launch.
- The preview shows the complete rendered prompt. User input and template text remain plain text, including HTML and braces.
- Template definitions, favorites, and chat-app preferences persist locally. Current variable input stays temporary and is excluded from autosave, backups, and device transfers.
- Preserve existing saved data and legacy `#p=`, `?p=`, and `?prompt=` links. Existing archived preset records are retained for compatibility; presets are not an active workbench feature.
- Invalid or incompatible stored data must not be silently reset. Failed saves, clipboard failures, and blocked popups need clear recovery paths.
- T3 Chat can receive a prompt through a URL within the app's conservative encoded-length budget. Longer prompts use clipboard handoff without truncation. Other destinations use copy-and-open; provider behavior is outside Promptroom's control.
- Browser-local storage, temporary pasted input, and account-free use are product constraints to preserve.
- The proposed community library is a separate future plan, not a current capability or an implementation commitment of this product record. See `docs/product-decisions.md` for that planning context.

## Brand Commitments

The current workbench is named **Promptroom**. Product language should make the saved-prompt → input → chat workflow easy to understand. This record does not establish a new visual direction.

## Evidence on Hand

- `personal-ui/README.md`: current workflows, persistence, destination behavior, and operational limits.
- `personal-ui/ACCESSIBILITY-REVIEW.md`: the accessibility target, audit scope, fixes, and remaining verification limits.
- `CONTRIBUTING.md`: data compatibility, plain-text rendering, destination validation, and synthetic example requirements.
- The working app includes Grammar corrector and Transcript cleanup starter templates.

## Product Principles

1. Make opening a saved prompt, adding input, and sending to chat easy and intuitive.
2. Keep the complete result inspectable before handoff; never silently truncate a prompt.
3. Preserve saved work and provide recovery when a browser boundary fails.
4. Keep temporary input separate from the saved library and require explicit actions to transfer saved content.

## Accessibility & Inclusion

Target WCAG 2.2 AA, following `personal-ui/ACCESSIBILITY-REVIEW.md`; the existing audit is not a conformance claim. Preserve keyboard navigation, visible focus, usable phone-width controls, enlarged-text support, status announcements, and reduced-motion handling. Verify affected UI flows at phone widths and with a keyboard.
