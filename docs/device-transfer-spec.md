# One-time device transfer

Approved experience and tailcat transport selection, 2026-11-12. Working browser/device verification remains pending. See [research](research/peer-to-peer-transfer.md).

## Agreed scope

- Phone and laptop use browsers, with no installation or account required.
- Support devices on different networks, including cellular to Wi-Fi.
- Sender explicitly transfers the whole saved prompt library once.
- Pair with an expiring, single-use QR/link; confirm on both devices before sending.
- Receiver reviews a merge before saving. Preserve existing prompts and exclude current pasted input.
- Reuse existing backup validation, import planning and atomic workspace commit. Preserve duplicate handling and destination validation. Do not silently restore receiving-device preferences.
- Allow signaling and encrypted relay fallback only within verified $0 service terms. No paid signup or automatic paid upgrades.
- Disconnect afterward. Continuous synchronization, persistent device pairing, deletion propagation and account work are outside this feature.

## First implementation slice

Prove one synthetic backup can travel between two browser devices using tailcat's Go/WASM browser stream API. Start with an isolated experiment, not a production workbench button. Tailcat is selected; do not add WebRTC, TURN, iroh or a separate signaling service for this slice.

Before integration, review tailcat address capability authentication and the two-device confirmation protocol. Encryption alone does not authenticate the intended receiver. Keep invitation secrets out of diagnostics. Use fresh ephemeral keys, never persistent device identities.

The spike must demonstrate browser-to-browser DERP relay connections; bounded payload/chunk buffering; exact Unicode preservation; explicit receipt/import acknowledgement; cancellation, expiry and disconnect with no partial saved state; rejection of invalid backup data; and repeat-safe import. Browser tailcat is relay-only: do not claim direct connections. Use existing backup size policies where applicable; establish a separate transport cap without narrowing existing backup imports.

Physical acceptance: phone and laptop on different networks, same Wi-Fi, wrong pairing confirmation, second receiver, backgrounded phone and unavailable relay. Record browser/device versions and actual outcomes. Local browser simulation is not physical acceptance.

## Tailcat integration plan

Initial source revision: `e00cdde6ff787f801361ff85ed085775c775d4c5`. Build and serve the WASM and matching Go runtime locally with the app; do not execute an unpinned remote script. The revision requires Go 1.27.2, which was not found in the current shell. Preserve upstream BSD-3-Clause notices and record build provenance.

The [upstream browser bridge](https://github.com/tailscale/tailcat/blob/e00cdde6ff787f801361ff85ed085775c775d4c5/web/main_js.go) provides:

- `tailcatListen({ derpMapURL, onConnection })` returning an address and listener close function.
- `tailcatDial({ addr, derpMapURL })` returning a connection.
- Connection `read`, `write`, `closeWrite`, and `close`; pull-based reads supply stream backpressure.

The receiving device creates the listener and displays its capability address as a QR/link for the sender. Both confirm before prompt bytes are sent. Close the listener after admitting one connection; reject subsequent connections, expire idle invitations, and close pending connections on cancellation. Application acknowledgement must distinguish validated import from transport EOF.

Tailcat's [repository](https://github.com/tailscale/tailcat) offers free rate-limited DERP relays at the canonical map `https://tailcat.dev/derpmap.json`; the upstream browser app supports fetching it cross-origin. Verify actual relay access, rate limits and intended embedded usage before release. No paid relay fallback. Show a recoverable error and keep backup export/import available during relay outages.

Load the WASM only when a user opens device transfer. Verify GitHub Pages base-path asset loading and gzip decompression support. Do not reuse the demo's file-picker-dependent receive path: feed bounded received JSON through Promptroom's validation and review flow instead. Never copy its unbounded text accumulator into the production receiver.

## Completion

Integrate only after the transport/security spike passes. Run affected import/transport tests, app typecheck and build; verify keyboard and phone-width operation. Retain JSON backup transfer as recovery. Deployment and real-device success must be reported separately from code completion.
