# Agent Instructions: Bend Policy

Read `LAWS.bend` and `PROOF.bend` in full before starting work. Use this pair
as the project's working policy; reading `AGENTS.md` is not required because
its full policy is embedded in `LAWS.bend`.

- Follow the embedded policy, including its comments, approval requirements,
  change procedure, and Stop and Ask rules.
- Treat the formal laws as specifications. Update proofs when changing the
  modeled implementation; do not weaken laws merely to make verification pass.
- Run `bend PROOF.bend` after changing either file and before committing work
  governed by this policy. Resolve failures or report the work as blocked.
  If Bend is unavailable, explicitly report that verification was not performed.
- Run relevant project tests separately. A successful proof verifies only the
  formal model, not the agent's conduct, the truth of supplied assessments,
  or compliance with instructions expressed in comments.
- Keep the embedded policy and the retained `AGENTS.md` synchronized when
  intentionally revising their shared policy. Report conflicts and seek
  direction rather than silently choosing one version.

This file and the Bend filenames are not guaranteed to be discovered
automatically by agent tools. Explicitly load this file into the agent's
instructions or context when selecting this policy.
