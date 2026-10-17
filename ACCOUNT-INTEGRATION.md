# Private account integration checkpoint

Foundation selected by the maintainer: continue with focused Promptroom, retain the approved layout, defer further visual redesign.

The private development preview connects the static editor to the real local Better Auth/D1 integration service through a same-origin Node bridge. Account prompts offers sign-in/sign-out, explicit private template-copy saving, opening account copies on another session/device, and submission for review. Explore reads only approved prompts and opens an independent temporary copy. Saved account templates exclude pasted values and device settings. Browser-local data is not automatically uploaded or replaced.

The account UI is enabled only in a separate build with `PUBLIC_ACCOUNT_PREVIEW=true`; normal static builds keep the approved account-free layout. The bridge serves only `dist-account`, blocks setup access and path traversal, rejects foreign-origin mutations, and forwards requests only to the fixed local service. It rewrites the allowed preview origin for the local auth base URL. This is a development bridge, not the production hosting architecture.

## Run

From `personal-ui`, build with `PUBLIC_ACCOUNT_PREVIEW=true` in the environment and `node node_modules/astro/bin/astro.mjs build --outDir ./dist-account`. Run `node scripts/account-preview.mjs`, with `promptroom-comparison-api` running on localhost:4342. The service source/state are in the separate `.scratch/foundation-focused/personal-ui/prototype-service` checkout. It is not yet packaged into this branch.

Preview: https://desktop-ayoub.cuttlefish-coho.ts.net:8452/ (tailnet only), proxying localhost:4352. The earlier layout preview is on port 8451. Both depend on the development computer remaining awake and its preview processes running.

## Checks

- 43 component/domain tests pass; Astro check reports no errors/warnings; production static build passes.
- `node scripts/check-account-preview.mjs` passes locally and with `PREVIEW_URL` set to the private Tailscale origin. It checks real synthetic registration/sign-in, explicit private save, second-session restoration, exclusion from Explore, sign-out, setup/traversal blocking and cross-origin rejection.
- Browser inspection confirms the account dialog and approved Explore list; the sign-in dialog fits the narrow viewport. Synthetic test accounts/prompts are used. No real user password was entered by the agent.
- Full browser-form test on the Tailscale preview passed: create a disposable account, explicitly save the grammar template, sign out, sign back in, find the saved private copy, and open it in the editor. A synthetic pasted transcript was excluded; the restored field was empty and the original placeholder remained. Signed out of the disposable account afterward. This supplements the independent-session API checks; no physical phone was used.

## Limits and next work

This is a development checkpoint. Use a test account and synthetic prompts. Email verification/recovery, Google sign-in, named-preset UI, account template update/delete, conflict handling, moderation UI, comments/votes, and production secure-cookie/auth-origin configuration remain work. Repeated Save private copy actions intentionally create independent copies; this is not automatic synchronization. Changing an opened account copy is temporary until explicitly saved again. The account service and editor still need a reproducible unified production project before deployment. No GitHub Pages or production data was changed.
