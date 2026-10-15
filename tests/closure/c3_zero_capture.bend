# C003 review (2): a callable-many closure with no capture has no node
# (location 0, a trivial term): sharing it allocates no reference cell
# and a call frees nothing. Called twice in parallel and once after, for
# 100000 rounds
import Base

def round(acc: U32) -> U32:
  inc : U32 *-> U32 = *x => (x + 1 : U32)
  p q = inc(acc) inc(2)
  (p + q + inc(3) : U32)

def loop(n: Nat, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      loop(p, (round(acc) % 1000003 : U32))

def main() -> IO(Unit):
  IO.print(U32.show(loop(100000n, 1)))

#|800001
