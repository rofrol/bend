# C006 phase 1, --verdict (from fixtures/c006a/src/e8_cycle.bend): a true
# cycle between two sites through a def (it terminates; the fork accepts
# it): refused with the cycle named.
import Base

def g(n: Nat, x: U32) -> U32:
  match n:
    case 0n:
      x
    case 1n+p:
      {*y => {*z => g(p, z) : U32 *-> U32}((y + 1 : U32)) : U32 *-> U32}(x)

def main() -> U32:
  g(3n, 0)

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): the defunctionalized call graph has a cycle (g_lam_11_8_run -> apply_U32_U32 -> g_lam_11_8_run), and phase 1 accepts no cycle but a def calling itself (bend2 and the kernel check descent one def at a time):
#|  the closure `*y => {*z => g(p, z) : U32 *-> U32}(( ..` (line 11, column 8 of g) calls a U32 *-> U32 closure, which may be that closure itself.
#|Phase 2 (strata and static site calls, C006b) is deferred.
#|exit 1
