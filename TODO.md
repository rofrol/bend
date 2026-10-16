# TODO

The plan and its reasons are in `BOOTSTRAP.md`.

## Next, in order

1. **Seed machinery with an existing program.** Prove that Bend's emitted
   C can run as wasm32-wasi and come back to native C with only a C
   compiler, before any Bend-in-Bend code.
   - Add a portable runtime profile to `bend2/comp.ts` behind one C macro
     (single thread, no pthread, a bounded heap instead of the 8 GiB mmap,
     the existing device `switch` dispatch instead of `musttail` where
     wasm needs it); the default build stays byte-identical.
   - Build `demos/pure_hvm5_mini/main.bend` (parser and strings) and
     `bench/runtime/lexer/main.bend` to C with this tree's compiler, then
     to wasm32-wasi with a pinned toolchain (`zig cc`, Zig 0.17.0 is
     installed; or wasi-sdk), and list the wasm's WASI imports.
   - Vendor a wasm2c and WASI shim (first try Zig's `stage1/wasm2c.c` and
     `stage1/wasi.c`, MIT; WABT's wasm2c if they lack a feature the wasm
     uses) and a `bootstrap.c` under `boot/`.
   - Exit criterion: on a clean checkout, without Bun, Node, Lean or
     network, `cc boot/bootstrap.c && ./a.out` (cc = clang and gcc both)
     turns the committed wasm into a native binary whose stdout hash on a
     fixed input equals the direct native build's; rebuilding the wasm
     with the pinned tools gives the same SHA-256; the input includes a
     source of at least 1 MB, run without stack overflow or out of memory.
   - Record the wasm size (raw and zstd), the WASI import list and the
     run times in this item.
2. **A versioned IR boundary in `comp.ts`.** `-o x.bir` (name to settle in
   the item) dumps the erased, layout-annotated IR of a book as text; the C
   emitter reads its input from that dump, so its C is unchanged on the
   test corpus (byte for byte) and the dump is shown complete. Exit
   criterion: every `tests/compile` and `tests/run` file gives the same C
   through the dump as directly.

## Needs a decision

- Start with a port of BendTT (the kernel) to Bend?
  Options: Later, as the oracle for the checker in Bend (stage 5) | First, beside item 1, as a Bend-in-Bend benchmark | Not at all
  Checked: the kernel checks an elaborated core and has no runtime
  semantics for natives or effects (`bend2/safe.ts` header); consult round
  `20261016-205348-e3c5`, all five models: off the path to a seed.
- Must a rebuild from the seed type-check the compiler's own source?
  Options: No, the seed compiles source checked upstream; a checker in Bend comes last | Yes, no seed counts until the checker is in Bend
  Checked: compiling needs elaboration, not checking, once the IR carries
  layouts (`BOOTSTRAP.md`, plan step 2); a Bend checker of `bend.ts`'s
  depth is the months-scale part.
- Which C compiler must the bootstrap accept after the wasm2c step?
  Options: Any C11 compiler for the seed step, clang after it | Any C11 compiler at every step
  Checked: wasm2c output is plain C; the compiler's own C output is
  clang-only by upstream policy (WONTFIX #773, `musttail`, `#embed`), so
  "any C compiler" at every step means a second, portable emitter profile
  that the self-hosted compiler also emits.
- How does this branch follow upstream?
  Options: Fork only; pin and move at stage boundaries | Fork only; follow each upstream release | Aim to offer it upstream later
  Checked: upstream releases nearly daily; its repository gate rejects
  new files and its caps on `comp.ts` and `main.ts` are set by upstream's
  owner only (`gates/repo.ts`).

## Proposed

- Allow this branch's own files in `gates/repo.ts` (`BOOTSTRAP.md`,
  `TODO.md`, the policy files, `boot/`) so the repository gate passes
  here; a fork-only change.
