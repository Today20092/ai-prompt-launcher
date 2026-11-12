# Device transfer verification

2026-11-12. Synthetic content only. Local implementation, not a production deployment or physical-device acceptance.

## Automated and build evidence

- Vitest: 53 tests passed, including transfer approval/acknowledgement, bounded framing, fragmented reads, late dial cancellation, oversized send rejection, reviewed import, storage failure, stale review and invalid replacement invitations.
- Astro check: zero errors, warnings or hints.
- Root build and GitHub Pages base-path build pass, including unchanged legacy staging.
- Pinned tailcat Go/WASM assets built twice with identical hashes; see `personal-ui/public/tailcat/provenance.json` and [build notes](tailcat-build.md).

## Browser evidence

Two isolated installed Playwright Chromium sessions, desktop sender and 390px receiver, using the actual public tailcat DERP map and relays. The live transfer passed with a synthetic Unicode/multiline prompt, matching pairing codes, explicit approvals, no import before review, exact saved text, current-input exclusion and sender success only after committed import acknowledgement. Receiver QR rendered and phone-width page had no horizontal overflow.

The transfer also passed against the GitHub Pages base-path build served as raw static files without `Content-Encoding`, exercising the raw-gzip loader path. Keyboard Escape/Enter closed and reopened the transfer dialog. The existing desktop/mobile browser smoke script passed backups, sharing, clipboard/popup recovery and legacy redirects; its Include text selector was updated to address the visible checkbox by role rather than matching both it and Base UI's hidden input.

Browser checks caught and fixed double gzip decompression under Astro, a transfer trigger hidden by the mobile library layout, and same-document invitation navigation not opening the sender. Reviews caught and fixed stale recipient state after malformed invitations and browser/history operations outside the library boundary.

## Remaining acceptance

- Physical phone/laptop on different networks (including cellular), actual QR camera opening, screen lock, network switching and multiple browser engines.
- Relay outage/rate-limit behavior on real networks. Free rate limits and availability are upstream-controlled; no paid fallback is configured.
- Upstream experimental WASM bridge retains JS callbacks. Repeated transfers may grow runtime memory until reload; isolate the runtime if measurements show pressure. No long-session memory profile was performed.

Use JSON backup export/import if connectivity fails. A lost final acknowledgement means the sender cannot know whether the import committed; check the receiver before retrying. Identical imports use the existing duplicate handling.
