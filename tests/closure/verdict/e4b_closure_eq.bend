# C006 phase 1, --verdict (from fixtures/c006a/src/e4_closure_eq.bend):
# a law equating two closures is refused by policy T1.
import Base

law two_sites_equal:
  for +k: U32
  {(*x => (x * k : U32)) == (*y => (y * k : U32)) : U32 *-> U32}

def two_sites_equal(k):
  {==}

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): law two_sites_equal: its statement holds the callable-many lambda *x => .. (line 7, column 5) (T1: a law or proof may not quantify over, compare or observe callable-many closures; after defunctionalization it would range over this book's closures only)
#|exit 1
