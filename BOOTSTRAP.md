# Bootstrap: Bend's compiler in Bend, rebuilt from a wasm seed

Goal (the user, 2026-10-16): make Bend's compiler self-hosted (written in
Bend) and keep a wasm build of it in the repository, plus a small C program
that rebuilds a working compiler from that wasm on any machine with a C
compiler, as Zig does, so Bend is rebuildable in the spirit of Guix and
Debian.

How Zig does it (checked through the GitHub API, ziglang/zig, and
https://ziglang.org/news/goodbye-cpp/): `stage1/zig1.wasm` (now committed
zstd-compressed, about 637 KB) is the compiler built for wasm32-wasi with
only its C backend; `stage1/wasm2c.c` is about 4000 lines of portable C
(standard libc only, no sandboxing) and `stage1/wasi.c` implements the 22
WASI calls the compiler needs. `bootstrap.c` builds wasm2c with the system
C compiler, translates zig1.wasm to zig1.c, builds zig1, which compiles
the compiler's source to zig2.c with Zig's C backend, then builds zig2.
The wasm is updated only when a language change or fix affects the
compiler building itself. Zig calls it a build artifact, not source: it
does not give a full-source bootstrap. A third party reproduced Zig 0.13's
`zig1.wasm` byte for byte without the committed binary, and Guix tracks
removing the blob (https://issues.guix.gnu.org/72386); whether Guix ships
such a package is unverified.

Context: a consult round in the bend-wasm project
(`~/personal_projects/bend/bend-wasm/DECISIONS.md`, section "Bend
self-hosting and a wasm bootstrap seed") judged self-hosting a large
upstream-scale project (months to a year) and warned that interaction nets
suit a sequential, string-heavy compiler poorly. bend-wasm builds Bend's
emitted C to wasm through a patch series on `bend2/comp.ts`
(`~/personal_projects/bend/bend-wasm/patches/`): portable limits and
Emscripten, not WASI.

## What the compiler is today (checked 2026-10-16, branch base 234cb9b9)

- Pipeline: `bend2/main.ts` `cli_file` calls `book_read`, which runs
  `Bend.book_load` (parse, `bend2/bend.ts:952`) and `Bend.book_valid`
  (check, `bend.ts:3804`); the check stores each def's elaborated term in
  `Def.e` (`bend.ts:3875`). `-o x.c` runs `Comp.compile_book`
  (`comp.ts:2846`); a binary name writes the C and runs clang
  (`main.ts:373-451`, clang only, `-std=c11 -O3 -lpthread -lm`).
- There is no separate IR: the emitters read the checker's `LTerm`
  (`bend.ts:281-308`, 22 forms) and compute erasure and layouts
  (`w32`, `w64`, `box`) from types (`comp.ts:18-115`).
- `bend2/comp.ts` (6417 lines): about 2850 lines of analysis and the C
  emitter, 310 of the JS emitter, 2750 of the C runtime (a string
  template, `comp.ts:3280-6027`), 390 of the JS runtime.
- The emitted C is one standalone file, but: it always starts pthreads
  (`comp.ts:4798`, `5683`), reserves 8 GiB with mmap (`comp.ts:5291`),
  and on the host dispatches segments with `musttail` (`comp.ts:3419`).
  `preserve_none` is already guarded by `__has_attribute`
  (`comp.ts:3384`), and the GPU device path already dispatches with a
  portable `switch` loop instead of tail calls (`comp.ts:3404-3411`).
- Imports: local files, the `Base` prelude (`bend2/base.bend`, 3154 lines)
  and hub imports fetched by hash over the network (`bend.ts:899-920`).
- Bend as a language for a compiler: `String` is a cons list of
  `Chr{U32}` (`base.bend:73`; README: text processing is slow), `Map` a
  string-keyed trie, `Array` a balanced tree with linear update and no
  push; numbers are Nat, U32 and F32 only. Files, args and process runs
  exist as effects (`bend2/effs/`). The JS lane overflows the host stack
  on deep recursion (WONTFIX). The `lexer` bench takes 2.1 s against 1.0 s
  for C (`bench/runtime/_pin_/apple_m4_max.txt`). No compiler or type
  checker written in Bend exists; the largest relevant program is a
  1916-line Interaction Calculus evaluator with a parser
  (`demos/pure_hvm5_mini/main.bend`).
- The "small kernel" is BendTT (`bend2/bendtt.lean`): about 1055 code
  lines of theory (terms, evaluator, conversion, checker, the live check,
  a `.bendtt` parser, a CLI) and about 2500 lines of proofs.
  `bend2/safe.ts` elaborates a checked book into `.bendtt`: datatypes
  become Σ chains over labels, and natives, laws and foreign effects go out
  opaque. So the kernel checks an elaborated core; it is not a
  compilation IR and has no runtime semantics for U32, strings or effects.
- Tests: every test is a Bend file ending in the `#|` lines its run must
  print; the gates run on the upstream mini cluster, which this fork does
  not have. Here one test runs with `bun bend2/main.ts <file>` (this tree's
  compiler; `/opt/homebrew/bin/bend` is a released build).
- The repository gate (`gates/repo.ts`) rejects every file outside its
  allow list, so this branch already fails it (`AGENTS-bend.md`,
  `BOOTSTRAP.md`, `LAWS.bend`, `PROOF.bend`).

## Plan

Decided by the agent after consult round `20261016-205348-e3c5` (sol,
mimo, deepseek, argon, wonder, unanimous on the order), pending the user's
answers in `TODO.md`, "Needs a decision":

1. **The seed machinery first, with an existing program (TODO item 1).**
   The one unknown that can sink the whole goal is whether Bend's emitted
   C can run as wasm32-wasi and come back through wasm2c to native C with
   only a C compiler. Prove it with an existing program before writing any
   Bend-in-Bend code.
2. **A versioned IR boundary (TODO item 2).** `comp.ts` dumps an erased,
   layout-annotated IR (every quantity, erasure, layout, constructor tag
   and match already resolved), and the current C emitter is made to
   consume that dump, which proves the dump is complete. With it, a back
   end needs no types and no checker.
3. **The back end in Bend.** A Bend program reads the IR and emits C,
   tested differentially against `comp.ts`'s C on the test corpus, growing
   from the small forms (Var, Ref, Lam, App, Let, Ctr, Mat, U32) to the
   whole IR. It embeds the C runtime text; emitting it must not walk a
   cons list deep enough to overflow the stack.
4. **Back-end self-hosting.** The Bend back end compiles the IR of its own
   source: stage2's C equals stage3's C byte for byte. The seed is its
   wasm; the TS front end still supplies the IR.
5. **The front end in Bend.** Parser, sugars and the elaboration needed to
   produce the IR, for `base.bend` and the compiler's own source (hub
   imports vendored); whether it also type-checks is the user's choice
   (TODO, "Needs a decision"). When the compiler builds its own Bend
   source without TypeScript, it is self-hosted, and the seed is the whole
   compiler's wasm.

Why not the kernel first: porting BendTT to Bend would give a well-specified
Bend-in-Bend program with a Lean oracle, but not one line on the path from
Bend source to C to a wasm seed; extending the kernel with natives and
effects to make it an IR would drop the proofs that make it small and
trusted. It fits stage 5, as the differential oracle for a checker written
in Bend (all five models; the user's choice is in `TODO.md`).

Why not an untyped `bend0` subset compiler as the main path: its fixed
point proves only that the seed rebuilds itself, and it becomes a second
compiler to maintain (mimo, wonder). Uniform boxing stays an option for the
back end's first version.

Rules for every stage:

- Upstream is pinned at this branch's base (234cb9b9) and moved only at a
  named event (a stage boundary, an upstream release the user names);
  each move regenerates the differential goldens. `bend2/bend.ts` is not
  edited; changes go into `bend2/comp.ts` and new files.
- The seed is deterministic: pinned tool versions and flags, no paths,
  dates or build ids in outputs, sorted iteration. A regenerated wasm must
  equal the committed one byte for byte.
- The seed needs no network: the prelude and every import it compiles are
  in the repository.
- Each stage's exit criterion is a command anyone can run, recorded in
  `TODO.md` with its result.
