# C006 phase 1, --verdict (from fixtures/c006a/src/e6_chain.bend): a finite
# same-type chain of sites, each called where it is built. V0 (phase 1) has
# one apply per type, so the outer body calls apply: a cycle, refused.
import Base

def main() -> U32:
  +k : U32 = 3
  a : U32 *-> U32 = *x => {*y => {*z => (z + k : U32) : U32 *-> U32}((y * 2 : U32)) : U32 *-> U32}((x + 1 : U32))
  (a(1) + a(2) : U32)

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): the defunctionalized call graph has a cycle (main_lam_8_21_run -> apply_U32_U32 -> main_lam_8_21_run), and phase 1 accepts no cycle but a def calling itself (bend2 and the kernel check descent one def at a time):
#|  the closure `*x => {*y => {*z => (z + k : U32) : U ..` (line 8, column 21 of main) calls a U32 *-> U32 closure, which may be that closure itself.
#|Phase 2 (strata and static site calls, C006b) is deferred.
#|exit 1
