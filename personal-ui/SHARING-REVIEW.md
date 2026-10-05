# Prompt sharing, issue #9

Working branch: `codex/prompt-sharing`, based on `912579d` from updated `origin/main`. The original checkout and its local planning changes remain intact.

## Format and limits

Version 1 uses `#share=` followed by percent-encoded JSON with `format: "promptroom-share"`, `version: 1`, and a template containing only title, description and body. Optional `values` contains only deliberately selected named fields. This is transport encoding, not encryption. Anyone with the link can read included values. Links are independent snapshots without application-managed expiry or revocation.

The conservative transport budget is 8,000 characters for the entire absolute URL, including origin and base path. This is an application policy, not a guaranteed limit for every browser, messaging app or operating system. Larger URLs disable link/device sharing and offer complete unfilled or filled text copying and a template-only JSON download. Text is never truncated. Single-prompt JSON is limited to 256 KiB of UTF-8, checked before file reading and again during parsing. Larger files use full-text copying. There is no decompression step or expansion risk.

Single-prompt files use the same versioned format and exclude current input, IDs, destinations, favorites, other prompts, archived presets and preferences. File opening validates first and displays a temporary prompt; saving remains explicit. Readers validate required content and optional named string values, then select only recognized fields. Unsupported, malformed and excessive payloads preserve the workspace and show recovery guidance.

## Recipient behavior

Opening a snapshot leaves the saved selection and workspace intact. Received definitions and selected values live in tab memory. Editing, filling, copying and launching work on the temporary definition; app and T3 choices for it are temporary too. Save a copy creates a fresh ID, preserves the exact reusable definition and excludes values and device settings. Matching titles use the existing numbered display labels. A failed storage write leaves both saved and visible workspace data unchanged. Return to saved workspace restores the saved selection.

Clipboard, navigation, device sharing and downloads require explicit actions. Clipboard denial exposes exact manual-copy text. Device capability checks and share failures retain copy/download fallbacks; AbortError is cancellation. A download request is reported as a request rather than proof of a completed file save. Download exceptions provide full-text fallback.

## Validation record

Mobile screenshot follow-up used the refactoring-ui skill. The share dialog now uses a zero-minimum grid column, constrained viewport width, shrinkable fields and fixed field sizing for technical textareas. Its primary preview displays the exact template definition and selected values as plain text. Technical snapshot/link data and file transfer remain available in secondary details. Copy link is the primary full-width action; text-copy alternatives stack at narrow widths. Share moved to the template heading beside edit/favorite, leaving launch and prompt-copy controls paired. Typechecking, all 24 tests and the Pages build passed again. The browser provider still reports no apps or browsers, so rendered narrow/wide, enlarged-text and keyboard checks remain pending. The refreshed Tailscale preview is at https://desktop-ayoub.cuttlefish-coho.ts.net:8450/ai-prompt-launcher/.

Automated checks cover default value exclusion, selected value restoration, multiline/Unicode/reserved text, snapshot independence, malformed/unsupported/oversized input, full URL budgeting, exact file fallback, repeated independent saves, matching IDs/names, preference preservation and storage denial. Existing required-value renderer tests are reused.

Typechecking passed with zero errors, warnings or hints. The full suite passed all 24 tests across five files. Local root and GitHub Pages `/ai-prompt-launcher/` production builds passed separately. HTTP checks verify the Pages-base workbench and staged legacy launcher return 200. The legacy redirect logic is preserved. The existing Tailscale review service on port 4329 is untouched; this checkout uses a separate local preview on port 4330 with the Pages base path.

Browser/device verification is pending. The browser-control provider reported no available browser, and opening Chrome returned `Browser is not available: chrome`. No actual browser or phone has been verified during this implementation. Automated unit checks and HTTP/build checks must not be interpreted as the requested cross-browser or physical mobile demonstration.

Before sign-off, use synthetic content to fill a template in browser A, verify Template only excludes it, select a field and inspect its exact preview, then copy a link into browser B. Verify temporary receipt leaves storage unchanged, edit/fill/preview/copy/launch, and explicitly save twice without overwrites. Repeat at mobile width and in both themes; check keyboard focus, the physical phone share menu and cancellation, unavailable sharing, denied clipboard, oversize link fallback, JSON download/import and download failure. Check malformed links recover and legacy links still redirect.

Standards and Spec reviews ran independently against staged changes from starting commit `912579d`. Neither found a concrete code defect or scope creep. Standards reports one verification gap under CONTRIBUTING.md, which requires browser verification. Spec reports the same missing cross-browser/mobile demonstration under issue #9. These reviews do not constitute full acceptance while that gap remains.

After reviewing the mobile preview, the maintainer approved the result and explicitly requested shipment. This approval authorizes commit and publication despite the recorded limitation in automated browser/device verification. Publication uses the unchanged GitHub Pages workflow. The physical device share menu and every browser fallback have not been independently verified by the agent.
