# Chat destination URLs

Checked 2026-11-09 against first-party documentation and live HTTP requests (`curl` with a desktop browser user agent, signed out). No real browser session was used, so a `200` shows only that the URL answered. It does not show that a prompt reached the composer.

## Recommendation

Change one entry: move Copilot's host to `copilot.com`. Keep every other destination. Only T3 Chat has a documented prefill for its web URL, so every other `q` template is undocumented behaviour that could stop working without notice.

## Summary

Two surfaces define destinations. `personal-ui` lists three apps and passes a prompt in the URL for T3 Chat only; for the others it copies the prompt and opens the plain URL (`personal-ui/src/components/Workbench.tsx:58`, `:185`). The legacy launcher lists ten apps and substitutes the encoded prompt into `{{{s}}}` when `supportsQueryParam` is true (`js/ui.js:463-466`).

| App | Current URL in code | Recommended URL | Prefill parameter | Auto-submit | Confidence | Source |
| --- | --- | --- | --- | --- | --- | --- |
| T3 Chat | `https://t3.chat/new` (`personal-ui/src/lib/chat-apps.ts:2`, `personal-ui/src/lib/t3.ts:13`); `https://t3.chat/new?q={{{s}}}` (`js/config.js:33`) | No change | `q`, URL-encoded (documented) | Yes (documented: "Sends this text as the first user message") | High | [T3 Chat FAQ](https://t3.chat/faq) |
| ChatGPT | `https://chatgpt.com/` (`personal-ui/src/lib/chat-apps.ts:3`); `https://chatgpt.com/?q={{{s}}}&hints=search&temporary-chat=true` (`js/config.js:15`) | No change | `q` undocumented; unverified | Unverified | Host: high. Prefill: unverified | Observed `chat.openai.com` 308 to `chatgpt.com` |
| Claude | `https://claude.ai/new` (`personal-ui/src/lib/chat-apps.ts:4`, `js/config.js:21`) | No change | None documented for `https://claude.ai/new`. `q` is documented for `claude://claude.ai/new` (Desktop only) | No on Desktop: user reviews and sends. Web: unverified | Web URL: medium (bot-blocked). Desktop link: high | [Open Claude Desktop with a link](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link) |
| Perplexity | `https://www.perplexity.ai/search/new?q={{{s}}}` (`js/config.js:27`) | No change | `q`: path confirmed by redirect; effect unverified | Unverified | Path: medium. Prefill: unverified | Observed `/search?q=hello` 301 to `/search/new?q=hello` |
| Google Gemini | `https://gemini.google.com/app` (`js/config.js:39`) | No change | None documented | Not applicable | Host: high. Prefill: none found | [Gemini in Chrome help](https://support.google.com/gemini/answer/14886647?hl=en) |
| Grok | `https://grok.com/?q={{{s}}}` (`js/config.js:45`) | No change | `q` undocumented; unverified | Unverified | Host: medium. Prefill: unverified | [Grok FAQ](https://docs.x.ai/grok/faq) (silent on URL parameters) |
| Mistral | `https://chat.mistral.ai/chat?q={{{s}}}` (`js/config.js:51`) | No change for now | `q` undocumented; unverified | Unverified | Host: medium. Path and prefill: unverified | Observed `vibe.mistral.ai` 301 to `chat.mistral.ai` |
| Poe | `https://poe.com` (`js/config.js:57`) | No change | None documented for chats | Not applicable | Medium | Observed 307 to `/login` when signed out |
| DeepSeek | `https://chat.deepseek.com` (`js/config.js:63`) | No change | No first-party evidence | Not applicable | Low (inconclusive `202`) | Observed `202` with a 1-byte body |
| Copilot | `https://copilot.microsoft.com/?q={{{s}}}` (`js/config.js:69`) | `https://copilot.com/?q={{{s}}}` | `q` undocumented; reported as no longer filling the input | Unverified | Host: high. Prefill: unverified | Observed 301 to `copilot.com`; [Microsoft Q&A report](https://learn.microsoft.com/en-us/answers/questions/5612477/copilot-web-app-q-parameter-no-longer-populates-ch) (user report) |

## What should change

1. `js/config.js:69`: replace the host with `https://copilot.com/?q={{{s}}}`. The old host still works by redirect and keeps the query, so this removes a hop and is not an urgent fix.

Nothing else has evidence for a change. No current URL returned a not-found response or pointed at a retired domain.

## Could not be verified

- **Prefill and auto-submit:** ChatGPT, Perplexity, Grok, Mistral and Copilot. None has first-party documentation for these parameters on its web URL.
- **`https://claude.ai/new?q=`:** first-party documentation covers the `claude://` form only.
- **ChatGPT `hints=search` and `temporary-chat=true`:** no first-party documentation found.
- **Blocked or challenged responses:** `claude.ai/new` 403 (the `?q=hello` variant returned 200), `www.perplexity.ai` 403, `chat.mistral.ai` 403, `poe.com/login` 403, `chat.deepseek.com` 202, `t3.chat/` and `t3.chat/new?q=hello` 429. Grok returned 200 with a challenge marker in the page.
- **DeepSeek and Poe prefill:** absence of documentation is not proof that no parameter exists. Their `supportsQueryParam: false` setting remains the safe choice.

## Per-app notes

### T3 Chat

The FAQ documents starting a chat at `/new` with `q` (required, URL-encoded), which "Sends this text as the first user message in the new chat". If `q` is missing or left as `%s`, the app redirects home. It also documents `model`, `effort`, `search`, `search_limit` (clamped to 1..5), `profile` and `temporary`. [T3 Chat FAQ](https://t3.chat/faq)

`readT3Options` and `t3Handoff` pass exactly those option names (`personal-ui/src/lib/t3.ts:5-20`). Because T3 sends immediately, a prompt in this URL runs without a review step.

`T3_URL_BUDGET` is 2000 (`personal-ui/src/lib/t3.ts:11`). The code comment correctly calls it application policy rather than a T3 or browser limit. `SHARE_URL_LIMIT` is 8000 (`personal-ui/src/lib/sharing.ts:7`) but applies to PromptRoom's own share links, not chat destinations.

### ChatGPT

`https://chat.openai.com/` returned 308 to `https://chatgpt.com/`, so the code's host is the current one. `https://chatgpt.com/?q=hello` returned 200, which does not show prefill.

A search limited to OpenAI domains found no help-centre or developer documentation for `q`, `hints` or `temporary-chat`. The only results were [OpenAI Developer Community threads](https://community.openai.com/t/query-parameters-in-chatgpt/1027747), which are user reports rather than OpenAI documentation.

### Claude

Anthropic documents `claude://claude.ai/new?q=...` for Claude Desktop: all values must be URL-encoded, `q` is truncated to roughly 14,000 characters, and the prompt field is prefilled "so you can review and send it". [Support article](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link)

That scheme needs Desktop installed, so it is not a replacement for the web URL. The legacy `supportsQueryParam: false` setting matches the lack of web documentation.

### Perplexity

`https://www.perplexity.ai/search?q=hello` returned 301 to `/search/new?q=hello`, and `https://perplexity.ai/` returned 301 to `https://www.perplexity.ai/`. This first-party redirect supports the code's host and path. The final page returned 403, so its handling of `q` was not observed. The [developer docs](https://docs.perplexity.ai/docs/getting-started/quickstart) that surfaced cover the API only, and no consumer URL parameter documentation was found.

### Google Gemini

`https://gemini.google.com/app` returned 200. Google's help documents reaching the web app through Chrome's `@gemini` shortcut, not a URL parameter. [Gemini Apps Help](https://support.google.com/gemini/answer/14886647?hl=en) No documented prefill was found, which matches `supportsQueryParam: false`.

### Grok

`https://grok.com/?q=hello` returned 200, but the page contained a challenge marker, so this is inconclusive. The [Grok FAQ](https://docs.x.ai/grok/faq) points users to grok.com and does not mention URL parameters.

### Mistral

The consumer product now appears to be branded Vibe: `https://mistral.ai/products/le-chat` returned 301 to `/products/vibe/`. The application host has not moved: `https://vibe.mistral.ai/` returned 301 to `https://chat.mistral.ai/`, and mistral.ai still links to `https://chat.mistral.ai/`. The `/chat` path returned 403, so it could not be confirmed. No Mistral documentation for `q` was found. The button label "Mistral Le Chat" (`js/config.js:48`) may be out of date, which is separate from the URL.

### Poe

`https://poe.com/` returned 307 to `/login?redirect_url=%2F` when signed out. Poe documents `prompt` and `base_bot` for prefilling [`poe.com/create_bot`](https://creator.poe.com/docs/server-bots/server-bots-functional-guides), which creates a bot and does not start a chat. Do not use it as a chat prefill.

### DeepSeek

`https://chat.deepseek.com/` returned 202 with a 1-byte body, which is inconclusive. No first-party documentation for a prefill parameter was found.

### Copilot

`https://copilot.microsoft.com/?q=hello` returned 301 to `https://copilot.com/?q=hello`, and `https://copilot.com/` returned 200. `https://www.copilot.com/` returned 302 to `https://copilot.com/`.

No Microsoft documentation for `q` was found. A [Microsoft Q&A thread](https://learn.microsoft.com/en-us/answers/questions/5612477/copilot-web-app-q-parameter-no-longer-populates-ch) is a user report that `?q=` stopped filling the input. If a signed-in browser test confirms that, set Copilot's `supportsQueryParam` to `false` so the prompt goes through the clipboard path.
