# C006 phase 1, --verdict (from fixtures/c006a/src/e7b_def_maps.bend): a
# closure calls a first-order def that maps another closure of its type:
# the cycle through the def and apply is refused and named.
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def sum(xs: List<U32>) -> U32:
  match xs:
    case []:
      0
    case h <> t:
      (h + sum(t) : U32)

def total(+k: U32) -> U32:
  sum(map(*y => (y + k : U32), [1, 2, 3]))

def main() -> List<U32>:
  +j : U32 = 100
  map(*x => total((x + j : U32)), [1, 2])

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): the defunctionalized call graph has a cycle (main_lam_25_7_run -> total -> map -> apply_U32_U32 -> main_lam_25_7_run), and phase 1 accepts no cycle but a def calling itself (bend2 and the kernel check descent one def at a time):
#|  the closure `*x => total((x + j : U32))` (line 25, column 7 of main) calls total;
#|  total calls map;
#|  map calls a U32 *-> U32 closure, which may be the closure `*x => total((x + j : U32))` (line 25, column 7 of main).
#|Phase 2 (strata and static site calls, C006b) is deferred.
#|exit 1
