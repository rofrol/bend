# Bootstrap: Bend's compiler in Bend, rebuilt from a wasm seed

Goal (the user, 2026-10-16): make Bend's compiler self-hosted (written in
Bend) and keep a wasm build of it in the repository, plus a small C program
that rebuilds a working compiler from that wasm on any machine with a C
compiler, as Zig does, so Bend is rebuildable in the spirit of Guix and
Debian.

How Zig does it (checked through the GitHub API, ziglang/zig):
`stage1/zig1.wasm` (3.2 MB, the compiler built for wasm32-wasi) is committed
with `stage1/wasm2c.c` (122 KB) and `stage1/wasi.c`; `bootstrap.c` builds
wasm2c with the system C compiler, translates zig1.wasm to zig1.c, builds
zig1, which compiles the compiler's source to zig2.c with Zig's C backend,
then builds zig2.

Context: a consult round in the bend-wasm project
(`~/personal_projects/bend/bend-wasm/DECISIONS.md`, section "Bend
self-hosting and a wasm bootstrap seed") judged self-hosting a large
upstream-scale project (months to a year), warned that interaction nets
suit a sequential, string-heavy compiler poorly, and noted that a wasm seed
gives a portable bootstrap but not Guix's full-source bootstrap (Guix
reportedly packages Zig through a source chain from its older C++
implementation; unverified) nor Debian source on its own. A related check
there (QuickJS running the TypeScript compiler) is bend-wasm's item.
bend-wasm also builds Bend's emitted C to wasm through a patch series on
`bend2/comp.ts` (`~/personal_projects/bend/bend-wasm/patches/`).

This file states the goal; the plan, its first bounded step and its
measurements are the agent's to write here and in `TODO.md`.
