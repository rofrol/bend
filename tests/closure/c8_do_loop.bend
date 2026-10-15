# C008: 100000 rounds, each a do block that calls a fresh callable-many
# closure in three statements (memory probe)
import Base

def round(+acc: U32) -> IO(U32):
  s : (U32 *-> IO(U32)) = *x => IO.pure(U32, (x * 3 + acc : U32))
  do IO<U32>:
    a : U32 <- s(1)
    b : U32 <- s(2)
    c : U32 <- s(3)
    return (a + b + c : U32)

def loop(n: Nat, acc: U32) -> IO(U32):
  match n:
    case 0n:
      IO.pure(U32, acc)
    case 1n+p:
      do IO<U32>:
        r : U32 <- round(acc)
        loop(p, (r % 1000003 : U32))

def main() -> IO(Unit):
  do IO<Unit>:
    r : U32 <- loop(100000n, 1)
    IO.print(U32.show(r))

#|990960
