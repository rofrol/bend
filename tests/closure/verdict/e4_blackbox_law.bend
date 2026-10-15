# C006 phase 1, --verdict (from fixtures/c006a/src/e4_blackbox_law.bend):
# a law quantifying over a closure (for f: U32 *-> U32) is refused by
# policy T1 before translation.
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

law map_len:
  for f: U32 *-> U32
  for xs: List<U32>
  {List.length(&1, U32, map(f, xs)) == List.length(&1, U32, xs) : Nat}

def map_len(f, xs):
  match xs:
    case []:
      {==}
    case h <> t:
      %map_len(f, t) : {1n+List.length(&1, U32, map(f, t)) == 1n+_ : Nat}
      {==}

def main() -> List<U32>:
  +k : U32 = 3
  map(*x => (x * k : U32), [1, 2, 3])

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): law map_len binds f at the callable-many type `U32 *-> U32` (T1: a law or proof may not quantify over, compare or observe callable-many closures; after defunctionalization it would range over this book's closures only)
#|exit 1
