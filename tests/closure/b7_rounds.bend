# C007: 100000 rounds, each lends a fresh callable-many closure over a
# Data record to map over a short list (ten lends and calls a round),
# so a leaked lend or a double free shows
import Base

type Step is Data:
  Step{mul: U32, add: U32}

def step(s: Step, x: U32) -> U32:
  match s:
    case Step{m, a}:
      (x * m + a : U32)

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def sum(xs: List<U32>, acc: U32) -> U32:
  match xs:
    case []:
      acc
    case h <> t:
      sum(t, (acc + h : U32))

def round(acc: U32) -> U32:
  s : Step = Step{3, acc}
  m : U32 *-> U32 = *x => step(s, x)
  sum(map(m, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0)

def loop(n: Nat, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      loop(p, (round(acc) % 1000003 : U32))

def main() -> IO(Unit):
  IO.print(U32.show(loop(100000n, 1)))

#|491993
