# Personal prompt workbench

Issue [#4](https://github.com/Today20092/ai-prompt-launcher/issues/4), built from layout A of prototype `fbd96c5` with Astro, React, and shadcn. This app is separate from the legacy launcher. The repository's Pages workflow still publishes only the root HTML, CSS, and JavaScript.

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
- Template edits and field values remain in memory for this tab. Switching prompts preserves each prompt's values. Reloading resets the workspace. Local persistence and backups belong to #5 and #6.
- Open copies the full prompt and opens the selected chat app. The user pastes it to send. This avoids depending on unverified prefill URLs; provider verification belongs to #7. Long prompts follow the same clipboard path.
- Clipboard failure opens the full preview for manual copying. A blocked popup leaves a manual app link and copy action available.
- Launch controls are in normal document flow. They do not float over a field or keyboard. Large pasted values scroll within the field; the preview always shows the complete text.

The automated suite covers the agreed public `renderPrompt` seam, including required-value behavior. Browser review covers edit, fill, preview, copy/open, mobile and desktop widths, themes, and keyboard focus. Test data should be synthetic.
