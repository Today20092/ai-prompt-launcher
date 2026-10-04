# AI prompt launcher

Write a prompt, fill its variables, and open it in an AI chatbot. Free and open source under the MIT license.

[Open the launcher](https://today20092.github.io/ai-prompt-launcher/)

This standalone project was extracted from [LLM-Made-Sites](https://github.com/Today20092/LLM-Made-Sites/tree/main/prompt-launcher).

## Available today

- Prompt variables, local saved templates, and template import/export.
- Built-in destinations for ChatGPT, Claude, Perplexity, T3 Chat, Gemini, Grok, Mistral Le Chat, Poe, DeepSeek, and Copilot.
- Custom destinations and controls for hiding built-in destinations.
- Compressed share links containing the prompt and optionally variable values and metadata.
- A responsive interface with light and dark themes.

Prefill behavior depends on the provider and can change. Some destinations use copy and paste. The provider registry needs fresh compatibility checks; listing a provider does not guarantee its query parameter works.

Saved templates live in the current browser. They are not yet a public community library or synchronized account storage. A share link gives anyone who has it access to its included prompt and values. Compression is not encryption. The app currently loads its compression library from jsDelivr.

## Run locally

Serve this directory with any static HTTP server, then open index.html through that server. The checked-in style.css lets the existing app run without a CSS build.

The inherited package configuration has a Tailwind version mismatch and is being tracked for cleanup before a reproducible source build becomes required. Avoid treating its placeholder test script as a passing test suite.

## Contribute

Use a [prompt submission issue](https://github.com/Today20092/ai-prompt-launcher/issues/new?template=prompt.yml) to propose a community prompt. You can also report a broken launcher or suggest a feature. See [CONTRIBUTING.md](CONTRIBUTING.md).

The shared library, stronger presets, verified provider registry, and stored short links are planned in [ROADMAP.md](ROADMAP.md). Shortening research lives in [docs/research/link-shortening.md](docs/research/link-shortening.md).

## Hosting

GitHub Actions publishes only index.html, style.css, and js/ to GitHub Pages. The workflow checks JavaScript syntax before deployment. Deployment uses the [official GitHub Pages workflow actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The current frontend can be hosted as static assets on Cloudflare. Stored short links would require an additional backend; no Cloudflare service is provisioned yet.
