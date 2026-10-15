# C003: 100000 rounds, each builds a callable-many closure over a fresh
# Data record and calls it three times (two shared calls, then the last
# one consumes it), so a leak or a double free of the environment shows;
# main is IO so the interp lane runs it through the JS runtime
import Base

type Step is Data:
  Step{mul: U32, add: U32}

def step(s: Step, x: U32) -> U32:
  match s:
    case Step{m, a}:
      (x * m + a : U32)

def round(acc: U32) -> U32:
  s : Step = Step{3, acc}
  m : U32 *-> U32 = *x => step(s, x)
  (m(1) + m(2) + m(3) : U32)

def loop(n: Nat, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      loop(p, (round(acc) % 1000003 : U32))

def main() -> IO(Unit):
  IO.print(U32.show(loop(100000n, 1)))

#|990960
