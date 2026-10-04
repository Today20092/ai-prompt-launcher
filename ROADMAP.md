# AI prompt launcher roadmap

Planning draft. No milestone below is claimed to be implemented in this new repository.

## 1. Publish the standalone foundation

- Extract the existing launcher into Today20092/ai-prompt-launcher.
- Add the MIT license, README, AGENTS.md, contribution guide, and GitHub issue forms.
- Make builds reproducible. Resolve the existing Tailwind build/dependency version mismatch.
- Publish a working GitHub Pages site. Keep Cloudflare deployment available as the next hosting option.
- Preserve existing compressed share links and imported personal templates.
- Review unsafe rendering of imported template text before accepting community data.

Acceptance: a fresh clone builds, the public site loads, variables and share links round-trip, and contributors can submit a prompt through an issue or pull request.

## 2. Add a community prompt library

- Keep reviewed prompts as versioned data in the repository.
- Define a prompt record with a stable ID, title, description, body, tags, author attribution, variable definitions, and example presets.
- Validate records in CI, including duplicate IDs and variable consistency.
- Add search, tags, previews, and a button to load a prompt into the editor.
- Let visitors submit prompts with a GitHub issue form without editing code. Maintainers review and publish accepted entries.
- Give each published prompt a compact stable link based on its ID.

Acceptance: a contributed prompt appears in the library after review, loads with its variables and presets, and can be shared by ID.

## 3. Improve reusable prompts and personal presets

- Define consistent variable syntax and missing-value behavior.
- Support defaults and useful field types where they improve input.
- Keep personal presets in browser storage with import and export.
- Distinguish public example presets from personal values.
- Keep URL state versioned and compatible with older links.
- Make editor, variables, and library usable with keyboard navigation and on mobile.

Acceptance: users can save multiple value sets for one template and share either the blank template or a filled version deliberately.

## 4. Make launcher support maintainable

- Put provider integrations in one documented registry.
- Record each provider's prefill behavior, limitations, and last verification date.
- Support community-added providers and user-defined destinations.
- Validate custom destination protocols and encode prompt values once.
- Offer copy-and-open when prefill is unavailable or the outgoing URL is too long.
- Avoid promising prefill support based only on undocumented query parameters.

Acceptance: adding a provider needs one registry entry, a meaningful check, and documented manual verification.

## 5. Add stored short links if the hosting decision supports them

- Compare ha.mr, Sink, and a small Cloudflare service using primary-source research in docs/research/link-shortening.md.
- Distinguish a stable community prompt ID from a saved snapshot of an arbitrary prompt.
- Make server storage explicit to users before creating a stored link.
- Decide anonymous versus authenticated creation, expiration, deletion, quotas, and abuse controls before enabling public writes.
- Keep ordinary compressed links usable without the short-link service.
- Do not expose a shortener administrator token in frontend code.

Acceptance: a large prompt produces a short share link that restores the exact chosen payload, creation is protected against abuse, and storage/deletion behavior is documented.

## Later, driven by actual requests

Consider accounts, cross-device presets, localization, prompt collections, and an API after the public library has active users. Track specific requests in GitHub Issues.
