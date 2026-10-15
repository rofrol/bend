# C006 phase 1, --verdict (from fixtures/c006a/src/e3_map_len.bend): map
# with a borrowed &f (T5: an ordinary parameter of the closure datatype)
# and a law about lists only (the closure is inside scaled). Accepted.
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def scaled(+k: U32, xs: List<U32>) -> List<U32>:
  map(*x => (x * k : U32), xs)

law scaled_len:
  for +k: U32
  for xs: List<U32>
  {List.length(&1, U32, scaled(k, xs)) == List.length(&1, U32, xs) : Nat}

def scaled_len(k, xs):
  match xs:
    case []:
      {==}
    case h <> t:
      %scaled_len(k, t) : {1n+List.length(&1, U32, scaled(k, t)) == 1n+_ : Nat}
      {==}

def main() -> List<U32>:
  scaled(3, [1, 2, 3])

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|The kernel accepted the emitted translation. The defunctionalization is unverified; a validator checked its structure. This does not establish that the source program's behavior or laws are preserved, and ownership rules are checked only by the source checker.
