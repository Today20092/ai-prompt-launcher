# Community website planning decisions

Recorded 2026-10-04. Research and interview only; no website implementation is authorized by this document.

## Settled with the maintainer

- Use shadcn/ui.
- Make the searchable prompt library the first screen, with one-click launch or editing.
- Allow anyone to submit; require maintainer approval before public publication.
- Make contributor sign-in easy. Start with sign-in for contributions; anonymous submission is a possible later option, not a first-release requirement.
- Keep guest browsing and launching account-free as the working recommendation.
- Give every public prompt its own indexable page and useful share preview.
- Support personal short links if free or cheap; omit or limit the feature if it cannot fit the budget.
- Target $0 at launch and allow $5–10/month later if needed.
- Synchronize signed-in users' personal presets across devices.
- Personal stored short links may expire after 90 days to bound cost; public library links should remain permanent.
- Compare a focused launcher and a customized prompts.chat in small prototypes before choosing the foundation.
- Allow anonymous personal short-link creation with bot checks and tighter limits.
- License contributed public prompt content under CC0; application code remains MIT.
- Research hosting, backend, frontend packages, similar open source sites, and shortening before implementation.

## Pending interview answers

| Question | Proposed default, not approved |
| --- | --- |
| Review edits to published prompts? | Yes; keep the previous approved version live while reviewing |

## Additional decisions before a build specification

- Final hosting/rendering/authentication stack after research review.
- Design anonymous short-link limits, bot checks, and a global creation cap; reading an unlisted link is possible for anyone holding it under the proposal.
- Personal-link size limits, quotas, deletion, and what happens when free-tier allowances are exhausted.
- Contributor permission wording for CC0 public prompts. Do not apply public-library licensing automatically to personal snapshots or private presets.
- Initial variable field types and scope of preset behavior.
- Moderator workflow and removal/reporting controls.
- Visual direction after supplied references are reviewed.

## Research documents

- docs/research/stack-options.md
- docs/research/frontend-and-packages.md
- docs/research/community-examples.md
- docs/research/link-shortening.md

Continue the interview from unanswered questions. Do not silently turn a recommended default into an approved requirement. After agreement, turn the decisions into a build specification and dependent implementation tickets under planning issue #2.
