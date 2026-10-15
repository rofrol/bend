# Experimental branch: callable-many closures

This branch of a personal fork adds an experimental language extension to
Bend 2 (upstream bendlang/bend at 014ccd03): closures whose values may be
called many times (`A *-> B`, `*x => e`), borrowed call-only parameters
(`&f`), C and JS runtime support, and `--verdict` support by
defunctionalization with a pinned, unmodified upstream elaborator.

It is not proposed upstream and is not endorsed by the Bend maintainers.
Upstream's AGENTS.md says `bend2/bend.ts` is human-written and must not be
edited by agents; this branch edits it as a local experiment only.
Soundness of the new rules is argued, not proved.

Design, decisions and evidence: the planning pack that drives it
(SPEC sections 7.1-7.3, TASKS C001-C008, C006, C006a, C006c). Tests:
`tests/closure/`; verdict tools: `tools/defun/`.
