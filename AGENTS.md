# Promptroom

A prompt workbench published on GitHub Pages. The current app runs entirely in the browser and keeps saved data in `localStorage`. The original launcher ships unchanged at `/legacy/`.

## Layout

- `personal-ui/`: the current app, built with Astro, React islands, Base UI, cnippet components and Tailwind 4. It has its own lockfile and is where nearly all work happens.
  - `src/components/Workbench.tsx`: main screen. `src/components/ui/`: registry components.
  - `src/lib/`: domain and browser-boundary logic. Tests sit beside the code.
  - `.migration/`: reports from the Radix to Base UI migration.
- `js/`, `index.html`, `style.css`, `src-css/`: the original launcher. `personal-ui/scripts/stage-pages.mjs` copies it into the build.
- `docs/`: product decisions, research and [Effect boundary notes](docs/effect-boundaries.md).
- `.agents/skills/`: vendored skills. Do not edit them; see [their README](.agents/README.md) for updates.

## Commands

Run from `personal-ui/` with pnpm 11 and Node 22.12 or later. CI uses Node 24.

```bash
pnpm install --frozen-lockfile
pnpm check                                      # typecheck
pnpm test                                       # all tests
pnpm exec vitest run src/lib/prompt.test.ts     # one file
pnpm exec vitest run src/components/boundaries.test.tsx -t "template editor"   # one test
pnpm build
```

For changes to the original launcher, run this from the repository root:

```bash
for file in js/*.js; do node --check "$file"; done
```

Previews and the Tailscale URL are covered in [the workbench README](personal-ui/README.md#review).

No lint or format command exists. Match the surrounding code.

## UI components

- `components.json` uses `base-nova` with the `@cnippet` registry. Add components with `pnpm dlx shadcn@latest add @cnippet/<name>`. A name without the prefix installs a different stock design.
- These are Base UI components: use `render`, not `asChild`. A `Select` needs `items` to show labels instead of raw values.
- `src/styles/global.css` overrides some registry styles on purpose, including focus outlines and phone target sizes. Registry triggers may replace `data-slot`, so check selectors against the rendered element.
- UI changes follow [the accessibility review](personal-ui/ACCESSIBILITY-REVIEW.md). Verify the affected flow in a browser, including keyboard and phone width.

## Git

For branch setup, integration, promotion or cleanup, read [the Git workflow](docs/branch-workflow.md).

- CI does not run on pull requests, so run the checks above yourself and report the results.
- Every push or merge to `main` deploys the public site. Do not push to `main` without explicit approval.
- Commit messages use Conventional Commits, such as `fix: ...` or `feat(ui): ...`.
- More than one session may share a checkout. Confirm the current branch immediately before committing.

## Boundaries

Further contribution rules are in [CONTRIBUTING](CONTRIBUTING.md).

- Keep older share links (`#p=`, `?p=`, `?prompt=`) and saved browser data working unless a migration is explicitly designed.
- Never render prompt text or imported fields as trusted HTML. Validate custom destination URLs, and put no privileged tokens in frontend code.
- Keep untrusted JSON and browser APIs behind the existing `src/lib` boundaries.
- Keep other Tailscale Serve mappings intact, and check `tailscale serve status` before reusing a port.
- Use synthetic data in tests and examples. Do not weaken or delete a test to make it pass; report the failure instead.
