# Decisions

Closed TODO items and the decisions behind them; the plan is in
`BOOTSTRAP.md`, open work in `TODO.md`.

## The fork's repository gate (t-6cxkinmv)

Done 2026-10-16 (run r-5zi2vs54, attempt 2): `gates/repo.ts` allows the
bootstrap branch's own files by exact path (`.herdr/checks.toml`,
`AGENTS-bend.md`, `BOOTSTRAP.md`, `DECISIONS.md`, `LAWS.bend`,
`PROOF.bend`, `TODO.md`), caps `bend2/comp.ts` at 66000 ttok (ttok 0.3,
upstream CI's pin; the base is already 64092 against upstream's 64000),
and fails when `bend2/bend.ts` differs from the pinned base 234cb9b9.
Approved by the user (d-c24j3whb); the cap and the pin check decided by
the coordinator after consult round `20261016-231106-aacd`. The user
asked whether 64000 is too small; consult round `20261016-231623-0cf6`
(all five): keep 66000 as a tripwire, do not raise it in advance, and
add a churn budget on `comp.ts` against the pinned base, the measure of
rebase surface and agent drift (follow-up in TODO.md). Not a concern:
upstream's CI checkout is shallow, but its workflow gates pull requests
into main with main's gate, and this branch is not proposed upstream.

## The comp.ts churn budget (t-hssxbai2)

Done 2026-10-16 (run r-2nyhdsyx): `gates/repo.ts` fails when
`git diff --numstat 234cb9b9 -- bend2/comp.ts` shows more than
`COMP_CHURN` = 200 added plus deleted lines, naming the counts; a git
failure or an unreadable count fails too. The 66000 ttok cap stays as a
backstop. Follow-up of t-6cxkinmv, after consult round
`20261016-231623-0cf6` that the user asked for ("isn't 64000 small?"):
all five models kept the cap as a tripwire and named divergence from the
pinned base as the measure of rebase surface and agent drift; the budget
is raised only from a measured patch, with its evidence here.
