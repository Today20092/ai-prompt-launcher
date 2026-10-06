# Promptroom data and browser boundaries

Issue: https://github.com/Today20092/ai-prompt-launcher/issues/10

## Ownership

`personal-ui/src/lib/contracts.ts` owns v1 recognized fields for workspace,
templates, archived presets, app names, all six T3 settings, backups and snapshots.
Types are derived from Schema contracts. A mapped mutable type retains the existing
simple React state and deterministic merge code. No state framework or long-lived
runtime is introduced. Extend the contract before adding a persistent field.

`validation.ts` parses unknown JSON and decodes through Effect 4.0.1's Result API.
Schema diagnostics are deliberately discarded: boundary errors must never contain
imported prompt text. `DataFailure` distinguishes invalid, unsupported and oversized
data. Unexpected exceptions propagate rather than becoming successful defaults.
Readers retain relational constraints (unique IDs, references, selected share
variables), whitespace checks and recognized-field selection. Undefined option
keys remain omitted. There is no format migration or storage reset.

Current pasted values remain session-only. Archived preset records are retained
but never applied or presented as controls. Backup and share serialization remain
version 1. Budget checks remain at their transport boundaries: the complete URL
includes origin and deployment base, and UTF-8 byte checks apply to single-prompt
files, never workspace backups.

## Storage and recovery

`WorkspaceStore` is the synchronous application boundary. Its load and atomic
read/check/write sequence run small typed effects through `runBoundarySync`.
`outcome` exposes success, unavailable storage, conflicting storage and invalid
data without source payloads. Existing `message` and boolean APIs map these results
to recovery UI. A corrupt/unsupported document blocks writes; a failed initial
read must see empty storage before a later write. A conflicting tab pauses writes.
Ordinary failed saves keep session edits usable. Import publishes visible state
only after persistence succeeds, preserving its non-destructive merge/retry rules.

## Browser adapters and lifecycle

`browser.ts` accepts only clipboard, navigation, native share and download
capabilities needed by each operation. The DOM implementation is supplied at event
boundaries. File reading takes an optional budget; backup callers omit it.
`boundary.ts` centralizes runners and tagged failure outcomes. Defects reject and
event handlers display a separate unexpected-error message; they are never
reported as successful browser actions. No failure logs include source data.

`beginClipboard`, `beginDeviceShare` and `beginProviderLaunch` invoke gesture-sensitive
browser capabilities synchronously before returning the effect. In particular,
the fallback blank window opens before clipboard permission is awaited, and native
share starts inside the initiating event. These effects represent one invocation:
do not retry or run them more than once. Direct noopener navigation may return null
even on success, so the existing manual retry link remains available.

`LatestOperation` permits one active runner per event surface. Superseding work,
closing a dialog, changing relevant data and component disposal abort its runner.
Generation guards suppress obsolete state updates, including finally blocks.
Browser promises that cannot physically be cancelled may finish, but their results
cannot publish. Effect finalizers close unused fallback windows on failure or
interruption. Downloads remove anchors and revoke object URLs after a short delay,
including failure during anchor construction/click. There are no background fibers,
automatic retries, accounts, provider logins, network writes or synchronization.

## Verification and dependency cost

Base commit: `f07ef3de30ee92b3b0bde158a87ec9f841fd5d0b`.
Effect is pinned to `4.0.1` with the workbench lockfile updated. Its official bundled
Schema/Effect sources were consulted for v4 APIs; v3 generator and mutability APIs
must not be copied into future changes.

Measured production `_astro/*.js` total (all three minified shipped chunks,
uncompressed): before 398,562 bytes; after 477,064 bytes. Increase: 78,502 bytes
(19.7%). This is the validation/effect runtime cost for these boundaries, not a
provider or transfer-size guarantee. The app still builds static assets only.

Locked install, focused behavior tests and typechecking passed. Both root and
`/ai-prompt-launcher` base-path builds passed and staged the original launcher at
`legacy/`. The deploy workflow, legacy sources and redirects were not changed.
Final locked install passed; `pnpm check` reported zero errors/warnings/hints;
`pnpm test` passed 39 tests in 7 files. Both production builds passed. Pages
asset references include `/ai-prompt-launcher/`. Staged legacy HTML/CSS hashes
match their repository sources. DOM integration tests use project-local
`@testing-library/react` and `jsdom` dev dependencies, which do not ship to users.

The Implement workflow's Standards and Spec reviews identified an unknown-field
compatibility defect and partial component integration coverage. The defect was
fixed by limiting version classification to versioned documents, with a regression
test retaining unrelated T3 fields' recognized-field exclusion. App literals now
derive from the existing destination list. Integration coverage now exercises
actual event handlers for cancelled/superseded reads, stale import review, repeated
clicks, disposal, native sharing and provider fallback. Tests assert observable
behavior, without coupling to Effect internals or component markup.

Interactive browser verification is **blocked**: the computer-use inventory in this
execution environment returns no browsers or apps. Desktop/mobile save/reload,
backup review/apply/cancel, temporary receipt/save and permission/popup UI checks
remain unverified. Adapter tests cover synthetic failure/ordering/cancellation;
they do not establish physical-device sharing or signed-in T3 delivery. Existing
#6/#7/#9 verification work remains open. Nothing has been pushed or deployed.
