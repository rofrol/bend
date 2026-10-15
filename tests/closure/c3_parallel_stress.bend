# C003 review (6): 20000 rounds, each shares one closure over a fresh
# Data record between two parallel calls (both final holders race to
# release the node) and nothing else
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
  p q = m(1) m(2)
  (p + q : U32)

def loop(n: Nat, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      loop(p, (round(acc) % 1000003 : U32))

def main() -> IO(Unit):
  IO.print(U32.show(loop(20000n, 1)))

#|598404
