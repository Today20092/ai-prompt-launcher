# Project skills

Vendored from https://github.com/mattpocock/skills at commit
`59db609eb1e18aaf59b63284d0e52255aff0c63c` (2026-10-27).
Upstream license: [MIT](MATT-POCOCK-LICENSE).

The 38 skill directories are copied unchanged from upstream `skills/`, flattened
into `.agents/skills/<name>/` for project-local discovery. Supporting resources
are included. This includes upstream's seven `in-progress` skills; treat those
as experimental. No upstream hooks, plugins, dependencies, or scripts are
automatically installed or executed.

In Codex, request a skill by name, for example `$implement`, `$tdd`,
`$code-review`, or `$to-tickets`. Newly installed skills can be discovered on
the next turn/session. This directory is versioned so other checkouts receive
the same skill definitions.

The upstream `setup-matt-pocock-skills` workflow is available but has not been
run. It separately configures issue-tracker, triage-label, and domain-document
conventions with the maintainer. Installing these files does not adopt new
project policies or authorize ticket automation, merges, or deployments.

To update, choose a new upstream commit and use the Codex skill-installer
`install-skill-from-github.py` helper with `--repo mattpocock/skills`, `--ref`
set to that commit, every upstream directory containing `SKILL.md` passed via
`--path`, and `--dest` pointing to a fresh staging directory. Review the diff,
replace only these vendored files, retain the upstream license, and update this
commit reference. The helper intentionally refuses to overwrite existing skills.
