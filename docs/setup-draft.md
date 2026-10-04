# Repository setup draft

Review draft. These settings have not yet been applied.

Repository: `Today20092/ai-prompt-launcher`, public, MIT license. Extract only the current `LLM-Made-Sites/prompt-launcher` app. Preserve the source repository and its local changes.

## Proposed AGENTS.md addition

```markdown
## Agent skills

### Issue tracker

Track work in this repository's GitHub Issues. See docs/agents/issue-tracker.md.

### Triage labels

Use the default five triage labels. See docs/agents/triage-labels.md.

### Domain docs

Use one root CONTEXT.md glossary and docs/adr/ for architectural decisions. See docs/agents/domain.md.
```

## Proposed docs/agents/issue-tracker.md

Issues and specs live in this repository's GitHub Issues. Infer the repository from the origin remote. Use the authenticated GitHub CLI to create, read, label, comment on, and close issues. Supply multiline bodies with --body-file. Never put secrets or private prompt contents in issues.

PRs as a request surface: no.

When a skill asks to publish a ticket, create a GitHub issue. Read its body, labels, and comments before implementation. Record blockers using native issue dependencies where available, otherwise a Blocked by line.

## Proposed docs/agents/triage-labels.md

| Role | GitHub label | Meaning |
| --- | --- | --- |
| needs-triage | needs-triage | Maintainer must evaluate the issue |
| needs-info | needs-info | Waiting for information from the reporter |
| ready-for-agent | ready-for-agent | Specified and ready for an agent |
| ready-for-human | ready-for-human | Requires human implementation |
| wontfix | wontfix | Will not be implemented |

## Proposed docs/agents/domain.md

Before code exploration, read CONTEXT.md if present and relevant decisions in docs/adr/. If absent, proceed. CONTEXT.md is a glossary, not a specification. Use its terms in code, tickets, and documentation. Report conflicts with an existing decision explicitly.

This is a single-context repository. Create glossary entries as terms are settled and record architectural decisions only when a real tradeoff warrants it.
