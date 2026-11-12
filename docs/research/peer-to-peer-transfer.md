# One-time prompt transfer between devices

Research date: 2026-11-12. External research only; no source exploration or device testing. Project context (Astro/React, GitHub Pages, localStorage and validated backup/import) supplied by the task. Recommendations below are design proposals, not verified implementation behavior.

## Recommendation

Spike a native **WebRTC reliable ordered data channel**, with explicit sender and receiver confirmation. Keep backup/import as the fallback. A static frontend can initiate connections, but GitHub Pages cannot supply signaling or TURN. Choose infrastructure before promising reliable cross-network transfer. Do not introduce continuous synchronization, accounts, persistent pairing, or an iroh runtime for this small feature.

| Option | Browser path and dependencies | Fit |
| --- | --- | --- |
| WebRTC | Exchange SDP offer/answer and ICE candidates through a separate signaling mechanism; STUN discovers reachable addresses; TURN carries traffic when direct connectivity fails. | Smallest browser-native option; direct LAN/internet paths when possible, relay fallback for difficult networks. |
| iroh/WASM | Official browser examples compile an endpoint to `wasm32-unknown-unknown`; browser cannot open raw UDP/QUIC sockets, so traffic uses relays. | Real browser support, but extra Rust/WASM integration and an always-relayed browser path; native iroh direct-connect claims do not carry over. |
| tailcat | Official experimental browser demo uses WASM and exclusively DERP relays, unlike native tailcat. | Worth a separate experiment only if this is the project the user means; not a browser direct-transfer shortcut. |

Sources: [WebRTC peer connections](https://webrtc.org/getting-started/peer-connections), [TURN](https://webrtc.org/getting-started/turn-server), [official iroh browser example](https://github.com/n0-computer/iroh-esp32-examples/blob/main/wasm-gui/README.md), [tailcat browser demo](https://tailscale.github.io/tailcat/).

## Connectivity, hosting and cost

Same Wi-Fi is favorable, not sufficient: guest isolation, VPNs and firewalls can prevent direct connectivity. Different networks may connect directly through ICE, but STUN is not a relay and does not guarantee success. TURN is needed for robust fallback; test forced relay separately. WebRTC does not define an application signaling service. Manual two-way offer/answer exchange can eliminate that service in a spike, but is awkward for phones: a single QR containing an offer does not return the answer. A QR/link containing an opaque room identifier can instead rendezvous through a small HTTPS/WSS signaling service. [WebRTC guide](https://webrtc.org/getting-started/peer-connections), [TURN guide](https://webrtc.org/getting-started/turn-server).

Zero **incremental** cost is plausible for manual/direct trials or modest usage within an expressly permitted free service tier; zero-cost reliable internet connectivity is not established. Someone pays signaling availability and relay bandwidth. Do not embed privileged TURN credentials in the static bundle: obtain short-lived credentials from a service, with abuse controls. Public demo infrastructure is not a production SLA. No current provider quota/pricing comparison or permission to reuse upstream public relays was verified. Self-hosting also has operational cost.

## Encryption and authenticating the other device

WebRTC encrypts data channels with DTLS. TURN forwards encrypted traffic, but sees network metadata and can deny service. Encryption alone does not establish that the endpoint is the intended device: malicious signaling can substitute identities. Bind pairing to authenticated signaling/fingerprints, or a reviewed application protocol using an independently shared high-entropy secret and authenticated transcript. Do not invent cryptography or treat a short room code as sufficient authentication. [WebRTC security architecture](https://www.rfc-editor.org/rfc/rfc8827.html), [Mozilla data-channel guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels).

Proposed UX: sender selects one prompt, creates an expiring single-use invitation, receiver opens QR/link, both verify the same authentication code, then sender approves sending and receiver approves import. Put any bearer secret in the URL fragment rather than query parameters; remove it from visible history after consumption, never log it, and recognize that scripts/extensions on the page can still read it. A copied invitation remains a capability until consumed or expired. Reject replay, second receivers and expired invitations. Infrastructure still learns connection metadata; the frontend publisher remains trusted because it serves executable code.

## Browser and transport constraints

WebRTC is the target for desktop Chrome/Firefox/Safari, Android Chrome and iPhone Safari/Chrome, but no hardware/browser matrix was tested here. Do not infer Chrome-on-iPhone behavior from Android Chrome. Verify actual engine/version, QR opening, foreground lifetime, screen locking and tab suspension. A data-only channel requires no microphone/camera permission; prefer the phone's existing camera QR opener over adding an in-app scanner. Provide copy/paste pairing too.

For payloads, do not send arbitrary JSON as one unbounded message. The negotiated SCTP maximum matters (64 KiB is the default when SDP omits the attribute). Proposal: cap the complete UTF-8 envelope at 1 MiB for the spike, send chunks no larger than 16 KiB and never above the negotiated maximum, use `bufferedAmount`/`bufferedamountlow` to bound queued bytes, and validate declared lengths before allocating. These sizes are proposed limits, not existing Promptroom limits. [Data-channel buffering and message limits](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels).

Use a versioned envelope, transfer ID, total byte length, chunk sequence and completion acknowledgement. Progress means bytes received; success means validated import committed and acknowledged. Cancellation closes the connection, discards incomplete buffers and invalidates the invitation. Timeout/disconnect leaves saved state untouched; retry starts a fresh session, with duplicate completion protection. No resumable transfer is needed for one small prompt. Lost final acknowledgements must produce an honest uncertain outcome rather than silently importing twice.

## Established project evidence and “tailcat” ambiguity

[PairDrop's primary repository](https://github.com/schlagmichdoch/PairDrop) documents browser file transfer, QR/code pairing, temporary rooms and cross-network TURN fallback. Its [deployment notes](https://github.com/schlagmichdoch/PairDrop/blob/master/docs/host-your-own.md) explicitly require TURN for cross-network hosting. Borrow interaction lessons, not its full persistent-device/discovery model. Its claims of modern-browser operation are upstream claims, not our device verification. Review licensing before copying code.

“Tailcat” plausibly means [Tailscale's tailcat](https://github.com/tailscale/tailcat), whose official browser demo says it is experimental and DERP-only. Another related candidate is [Tailscale tailcatchat](https://github.com/tailscale/tailcatchat), described by its repository as ephemeral encrypted web chat/transfers. Ask for the intended URL before choosing either; the name alone is insufficient. Neither a demo nor a repository description proves phone support, production availability or permission to depend on its hosted relays. No other established transfer project was assessed deeply enough to recommend.

## Minimal spike and acceptance gates

1. Isolated browser experiment: one synthetic JSON prompt; manual offer/answer exchange, then replace that only if QR/link usability warrants signaling. Record browser versions, connection candidate type, time to connect and bytes; never record prompt content or pairing secrets.
2. Add expiring one-use pairing and explicit two-device approval. Test invitation interception, wrong authentication code, expiry, replay and simultaneous second receiver. No payload leaves before authentication/approval.
3. Exercise reliable channel framing, byte caps and backpressure. Test Unicode, empty/max-size payload, over-limit declaration, malformed JSON, unsupported version, truncated/reordered/duplicate chunks, disconnect, cancellation and lost acknowledgement. Memory and buffered bytes remain bounded.
4. Conceptually route received bytes into the existing validated JSON import boundary, not directly to localStorage or HTML. Reuse export serialization where its scope fits; avoid sending an entire workspace for one prompt. Inspect actual contracts during implementation: no claim here that current backup format supports a single-record import. Preserve custom-URL validation, preview/confirmation, schema handling and existing data on failure. Test quota/storage failure and duplicate retry behavior.
5. Test physical iPhone Safari and Chrome, Android Chrome, and desktop Safari/Chrome/Firefox: phone↔desktop and phone↔phone; same Wi-Fi, isolated guest Wi-Fi, Wi-Fi↔cellular, separate home networks, VPN, forced TURN and relay outage. Include screen lock/backgrounding and network switching. Pass requires either one confirmed import or a clear recoverable failure with no partial writes.
6. Verify the built static deployment path, deep-link/fragment handling, WASM asset paths if evaluating alternatives, keyboard operation, readable status announcements and phone-width controls. Retain backup/import recovery. Provision/deploy nothing until infrastructure choice is authorized.

Unresolved decisions: one prompt versus selected prompts; accepted payload cap and schema; import conflict policy; minimum tested browser versions; signaling/relay operator, budget and retention; pairing protocol/security review; invitation lifetime; whether “no backend” or reliable cross-network use has priority; exact tailcat project intended.

Method: read `oc --help`; retrieved official documentation and primary repositories with only-cli, with web search fallback for failed iroh URLs and sparse raw GitHub responses. Current docs do not establish a supported iroh JS package/version or complete Safari compatibility matrix; pin and verify those in any iroh spike. No code, provisioning, deployment, commits or subagents were used.
