# TODO

The plan and its reasons are in `BOOTSTRAP.md`.

## Next, in order

- [ ] Portable runtime profile, verified natively (stage 1, part a): add [t-wxinrqzi]
  to `bend2/comp.ts` one C macro, `BEND_PORTABLE`, over four explicit
  policies, so Bend's emitted C can later build for wasm32-wasi with no
  threads, mmap or tail calls. Decided by the coordinator after consult
  round `20261016-210544-d069` (sol, mimo, deepseek, argon, wonder):
  - Dispatch: the host runs the segments in the device's `switch` loop
    (`comp.ts:3404-3411`, `4356-4365`) instead of `musttail` calls
    (`comp.ts:3416-3420`); segments already pass their state through the
    shared bank `WL_SIG` (`comp.ts:2943`) and the Term stack, so no
    marshaling changes; the host-only segments (`#if !DEVICE`,
    `comp.ts:2958`) join the switch.
  - Scheduler: one worker; no `pthread.h`, `sys/mman.h`, `poll`/`select`,
    mutexes, TLS or atomics reach the preprocessor output under the
    macro (not only skipped calls: wasi-libc's thread stubs compile and
    return ENOSYS, and atomics pull in shared-memory wasm features).
  - Effects: file, args, print and clock effects run synchronously inline
    (`io_work`, `comp.ts:5677`, runs the call and its pack at once);
    every effect that needs a helper thread, `select` or sockets
    (timers, sockets, process runs) fails loudly by name.
  - Memory: corpus and Term stack are static arrays sized with
    `-DBEND_CORPUS_BYTES` and `-DBEND_STACK_BYTES` (ideas from bend-wasm's
    `patches/0001-portable-limits.patch` and `0002-emscripten.patch`),
    every size checked against `size_t`; a full corpus or stack stops
    with the runtime's own error.
  - Exit criteria: without the macro, the emitted C of every file in
    `tests/` is byte-identical to the branch base's (a golden hash list);
    with it, the runnable tests print the same stdout, stderr and exit
    code as the default build (clang, native), also under ASan and
    UBSan; a deep dispatch chain (at least 10^6 segment hops) runs under
    `ulimit -s 512`; a negative test shows each refused effect fails
    loudly; `bench/runtime/lexer` time with and without the macro is
    recorded here.
- [ ] Wasm seed of an existing program (stage 1, part b): build [t-qrmvyves]
  `demos/pure_hvm5_mini/main.bend` and `bench/runtime/lexer/main.bend`
  with the portable profile to wasm32-wasi, and rebuild them from the
  wasm with only a C compiler. Decided by the coordinator after consult
  round `20261016-210544-d069`:
  - Toolchain: `zig cc` 0.17.0 (record the SHA-256 of the Zig
    distribution used), an explicit wasm feature list (no multivalue,
    tail calls, threads, atomics or SIMD), `-g0`,
    `-ffile-prefix-map`, custom sections stripped by a named tool.
  - Audit gate before conversion: a script lists the wasm's features,
    opcodes and WASI imports and fails on anything outside an allow list
    the vendored translator supports; its output is committed.
  - Translator: Zig's `stage1/wasm2c.c` and `stage1/wasi.c` (MIT,
    zstd input) vendored under `boot/` with their license; if they need
    more than two small patches for these modules, stop and report
    instead of patching further (w2c2 or WABT are the alternatives).
  - `boot/bootstrap.c` builds the translator, translates the committed
    `.wasm.zst` to C and builds the program.
  - Exit criteria, two separate checks: (1) offline seed: on a clean
    checkout without Bun, Node, Lean, Zig or network, clang and a real
    gcc (the coordinator runs gcc on the MacBook 2010 Guix host) build
    `boot/bootstrap.c` and the program, whose stdout, stderr and exit
    code on fixed inputs (one source of at least 1 MB, one deep run)
    equal the native build's, also run three times and from another
    checkout path; (2) regeneration: with the pinned Zig, rebuilding the
    wasm from the tree gives the committed bytes (SHA-256), on this host
    platform only (no cross-host claim). Record wasm sizes (raw, zstd),
    the import list, peak memory and run times here.
- [ ] A versioned IR boundary in `comp.ts`: `-o x.bir` (name to settle in [t-x7bgmmpg]
  the item) dumps the erased, layout-annotated IR of a book as text; the C
  emitter reads its input from that dump, so its C is unchanged on the
  test corpus (byte for byte) and the dump is shown complete. Exit
  criterion: every `tests/compile` and `tests/run` file gives the same C
  through the dump as directly.

## Needs a decision

How should workers run this branch's items, given herdr's driver cannot target it?
Options: A standalone clone without remotes, on `bootstrap`, where runs land | The coordinator does the items itself here ("rób TODO sam") | Wait for herdr to take a configurable target branch
Checked: `herdr todo run` bases a worker on the branch origin's HEAD
names and pushes the landed commit to origin
(`~/personal_projects/herdr/src/workers/target_branch.rs:1-50`,
`src/workers/runs/finish.rs:590-692`); here origin is upstream
`bendlang/bend` (main), so a run would land on `main` and push upstream.
A repository with remotes but no origin is refused; one with no remote
targets its current branch and skips the push. Blocks every item in
"Next, in order".
Decided by the user 2026-10-16 (d-nqumjilh): herdr removes this
limitation as the next item of its own TODO; this repository waits until
it lands. Requested from herdr's coordinator (session herdr-8b, pane
wR:p2TH) the same day.

(The four plan questions were answered 2026-10-16 and are recorded in
`BOOTSTRAP.md`, "Decisions".)

## Proposed

- [ ] Allow this branch's own files in `gates/repo.ts` (`BOOTSTRAP.md`, [t-6cxkinmv]
  `TODO.md`, the policy files, `boot/`, `.herdr/`) so the repository gate
  passes here; a fork-only change.
- [ ] Smoke-test the seed step with TinyCC as a third C compiler (wonder, [t-lsdahjql]
  sol: clang and gcc passing does not show plain C11); needs tcc
  installed.
