# Contributing

## Submit a prompt

Open a prompt submission issue with its title, purpose, prompt body, variable descriptions, and any example presets. Use synthetic example values. Do not publish secrets, personal data, or prompts you do not have permission to share.

Maintainers review submissions before they enter a future shared library. Issue submission does not automatically publish a prompt in the app. The public data format and library UI are still planned.

Submit prompts you wrote or have permission to contribute under this repository's MIT license. Include attribution and the original source where applicable.

## Report a launcher problem

Include the provider, browser, expected behavior, actual behavior, and a small non-sensitive example prompt. Distinguish a prefilled input from a provider that automatically sends the prompt. Avoid relying on undocumented URL behavior without testing it.

## Change code

Keep changes focused and explain the user-visible behavior in the pull request. Verify the affected flow in a browser, including mobile or keyboard navigation when relevant. Run node --check for changed JavaScript files. Preserve older compressed share links and existing local templates unless a migration is explicitly designed.

Never render community prompt text or imported fields as trusted HTML. Validate custom destination URLs and do not expose privileged backend tokens in the frontend.

Use GitHub Issues for implementation work. The proposed agent configuration is in docs/setup-draft.md pending maintainer review.
