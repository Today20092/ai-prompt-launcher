# T3 Chat URL options

The maintainer requested a place to configure the parameters shown in their T3 screenshot. The implementation uses the existing shadcn fields, inputs and selects inside a collapsed panel beside the launch controls. It is visible only when T3 is the effective destination and saves six optional settings per prompt. The main action stays prominent; the panel uses two columns on desktop and one on mobile.

Source: [T3 FAQ, custom search URLs](https://t3.chat/faq), checked 2026-10-04. The FAQ confirms `q`, `model`, `effort`, `search`, `search_limit`, `profile` and `temporary`. Model and effort are free-form to avoid inventing a supported list. The maintainer's screenshot supplies the Settings → Models → Copy Search URL guidance. Search limits are constrained to 1–5. Default values are omitted, while explicit false remains in the URL.

The direct action is labeled "Send to T3 Chat" because the documented `q` behavior sends the prompt as the first message. It requires complete variable values and runs only on an explicit click. It does not depend on clipboard permission. A manual send link remains available for blocked popups. Encoded URLs over the conservative application budget of 2,000 characters use complete clipboard copy and ordinary app navigation, with explicit guidance that URL settings must be selected manually on that path. This budget is not a measured or guaranteed provider limit.

## Verification

- Six new automated behavior checks cover exact multiline/Unicode query restoration and all options, default omission and explicit false, untruncated long prompts, invalid types/limits, independent prompt option restoration, and preservation of invalid saved documents.
- The browser launch action was intercepted with synthetic text. Its generated URL matched the complete rendered prompt and all six configured options. No test chat was sent. Intercepted long-prompt copy contained the entire 7,930-character rendered prompt and opened the base app URL with visible paste/settings guidance.
- All options survived refresh. Turning search off disabled its limit control. Reset removed the options, and selecting ChatGPT hid the panel. The preview was returned to T3 with blank/default options after testing.
- Checked desktop 1280px, mobile 390px, narrow 320px, and 200% root text sizing at 320px. A discovered enlarged-text overflow was fixed through wrapping header actions and constraining the launch grid. Final checks showed no horizontal overflow. Keyboard Tab from Model ID reaches Reasoning effort.
- Measured minimum new-panel text contrast was 5.81:1 in light mode and 6.96:1 in dark mode. Labels, descriptions, summary and documentation link were checked against their actual backgrounds.
- Actual signed-in mobile delivery and provider-side model/effort/profile interpretation are not claimed verified.

Final Astro typecheck passed with zero errors, warnings or hints. The full suite passed all 10 tests, and the production build passed. Independent Standards and Spec reviews each reported zero actionable findings.
