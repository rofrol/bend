# C007: a tail-recursive map with a borrowed &f over 100000 elements,
# the closure lent 100000 times down the recursion and called once per
# element (a non-tail map this deep overflows the JS lane's stack, with
# or without closures)
import Base

def map(&f: U32 *-> U32, xs: List<U32>, acc: List<U32>) -> List<U32>:
  match xs:
    case []:
      acc
    case h <> t:
      map(f, t, f(h) <> acc)

def range(n: Nat, acc: List<U32>, +i: U32) -> List<U32>:
  match n:
    case 0n:
      acc
    case 1n+p:
      range(p, i <> acc, (i + 1 : U32))

def sum(xs: List<U32>, acc: U32) -> U32:
  match xs:
    case []:
      acc
    case h <> t:
      sum(t, (acc + h : U32))

def main() -> IO(Unit):
  +k : U32 = 3
  m : U32 *-> U32 = *x => (x * k + 1 : U32)
  IO.print(U32.show(sum(map(m, range(100000n, [], 0), []), 0)))

#|2115048112
