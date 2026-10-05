# Personal prompt workbench

Issue [#4](https://github.com/Today20092/ai-prompt-launcher/issues/4), built from layout A of prototype `fbd96c5` with Astro, React, and shadcn. GitHub Pages publishes this workbench at the main URL and preserves the original launcher at `/legacy/`.

## Public deployment

The Pages workflow installs locked dependencies with Node 24 and the package's declared pnpm version, runs typechecking and all tests, then builds and publishes `dist`. `DEPLOY_SITE=https://today20092.github.io` and `DEPLOY_BASE=/ai-prompt-launcher/` configure production assets. Local builds default to `/`, preserving the existing Tailscale preview URL. The build also stages the unchanged original HTML, CSS and JavaScript under `legacy/`. Old `#p=`, `?p=` and `?prompt=` share links redirect to that launcher with their payload intact.

Export a backup from Tailscale and import it on the public site to transfer your workspace. These are separate storage origins. Legacy saved templates remain available in the original launcher on the same GitHub Pages origin; they are not automatically converted to Promptroom templates.

From this directory:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm preview --background --host 127.0.0.1 --port 4329
```

Development: `pnpm dev --background`. Manage it with `pnpm exec astro dev status`, `pnpm exec astro dev logs`, and `pnpm exec astro dev stop`.

## Review

The production build preview runs persistently in Astro's background mode on localhost port 4329. Check it with `pnpm exec astro preview status`, inspect `pnpm exec astro preview logs`, or stop it with `pnpm exec astro preview stop`. Tailscale Serve maps HTTPS port 8449 to it, without Funnel:

[Open the review app](https://desktop-ayoub.cuttlefish-coho.ts.net:8449/)

Keep other Serve mappings intact. Check `tailscale serve status` before reusing these ports. To recreate this mapping once the preview is running:

```powershell
tailscale serve --bg --https=8449 http://127.0.0.1:4329
```

## Behavior

- Grammar corrector opens initially. Transcript cleanup is the other starter template. Neither requires a tone.
- All named variables are required multiline fields. Names start with an ASCII letter or underscore, followed by letters, digits, underscores, or hyphens. Whitespace around a name is allowed. Repeated names use one field.
- Blank or whitespace-only values remain as placeholders in the preview and block copy/launch. Other values retain their exact whitespace and are substituted once. Pasted HTML and braces are plain text.
- Templates, favorites, each prompt's chat app, and the last-used prompt persist in this browser. Starter prompts are seeded only when no saved workspace exists. Reload returns to the last-used prompt, with Grammar corrector as the fallback for a missing selection. Switching prompts keeps current field values in memory; reload clears those values.
- T3 Chat is the initial preferred app. Change it through Preferences in the header; the preference stays in this browser. Prompts without a saved app choice follow that preference. Selecting a specific app remembers it for that prompt; choose "Use preferred" to remove the override. Editing a template preserves its chat-app choice. All variable input stays temporary.
- Saving uses a version-1 document at `promptroom.workspace`. Template definitions, favorites and chat-app choices enter this document; pasted input never enters autosave. Presets have been removed at the maintainer's request. Existing preset records and their old variable metadata are retained invisibly for data preservation and never applied.
- Preferences includes JSON backup export/import. Version 1 backups include templates, favorites, archived presets, preferred app, last-used prompt and per-prompt app/T3 options. Current pasted input is excluded. Choose a file and review additions, skipped duplicates and preference behavior before applying it. Import keeps existing prompts, remaps conflicting IDs and references, and labels same-name prompts with numbers without renaming saved templates. Repeating an import skips identical data even after remapping. Existing preferences remain; a fresh browser workspace restores the imported preference and selection until its first edit or reload. Invalid files and failed writes leave the saved and visible workspace intact. Backups contain your template definitions and any archived preset values, so keep the downloaded files somewhere appropriate for that content.
- Malformed data, unsupported versions, and invalid references are preserved without automatic migration or reset. Saving pauses with recovery instructions. Copy the original storage value through your browser's developer tools before repairing it or reopening with a compatible version. A stale last-used selection alone falls back safely. Changes made in another tab pause this tab's saving to prevent overwrites.
- Storage denial or a full quota leaves the tool usable for the session and reports that saving failed. Retry after allowing storage or freeing space. Keep the tab open until changes are saved. Clearing site data removes the workspace. Storage is device/browser-local; the Tailscale preview and GitHub Pages are separate origins with separate data.
- T3 Chat options appear in a collapsed panel when T3 is selected. Model ID, reasoning effort, web search, search limit, profile and temporary-chat settings are saved per prompt. Empty/default options are omitted; explicit off values are preserved. Model IDs and supported effort values come from T3 rather than a hardcoded model list. These parameters are documented in [T3's FAQ](https://t3.chat/faq), checked 2026-10-04.
- "Send to T3 Chat" opens a URL with the full rendered prompt in `q`, which T3 documents as the first message. URL construction and the consumer action were verified with synthetic text and intercepted navigation; actual signed-in mobile delivery remains for maintainer verification. The app uses a conservative 2,000-character encoded URL budget, not a claimed provider limit. Longer URLs use full-text clipboard handoff, with guidance to apply settings manually in T3; they are never truncated.
- Other apps use copy-and-open. The user pastes the full prompt to send.
- Clipboard failure opens the full preview for manual copying. A blocked popup leaves a manual app link and copy action available.
- Launch controls are in normal document flow. They do not float over a field or keyboard. Large pasted values scroll within the field; the preview always shows the complete text.

The automated suite covers prompt rendering, exact T3 URL encoding and options, long-prompt policy, option validation and per-prompt option restoration. Browser review covers edit, fill, preview, launch, mobile and desktop widths, themes, keyboard focus and enlarged text. Test data should be synthetic.
