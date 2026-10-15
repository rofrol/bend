# C006 phase 1, --verdict: policy T1 follows a law's names: the law below
# binds no closure, but mentions map, whose type takes &f: U32 *-> U32,
# so the law could observe a closure through it. Refused.
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def double(x: U32) -> U32:
  (x * 2 : U32)

law map_double_len:
  for xs: List<U32>
  {List.length(&1, U32, map(double, xs)) == List.length(&1, U32, xs) : Nat}

def map_double_len(xs):
  match xs:
    case []:
      {==}
    case h <> t:
      %map_double_len(t) : {1n+List.length(&1, U32, map(double, t)) == 1n+_ : Nat}
      {==}

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): law map_double_len: its proof handles a value of the callable-many type `U32 *-> U32` (T1: a law or proof may not quantify over, compare or observe callable-many closures; after defunctionalization it would range over this book's closures only)
#|exit 1
