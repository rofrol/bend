# C003 review (1, 5): a callable-many closure captures a Data record
# built at run time with nested parts (a List<U32>, a Nat, a list of
# lists, a String) and each call consumes all of it deeply; two calls
# run in parallel and a third after them, for 1000 rounds. The closure is
# built by wrap, whose parameter starts borrowed: capturing it makes the
# parameter owned (val_own)
import Base

type Bag is Data:
  Bag{xs: +List<U32>, n: Nat, ls: +List<+List<U32>>, s: String}

def sum(xs: +List<U32>) -> U32:
  match xs:
    case []:
      0
    case h <> t:
      (h + sum(t) : U32)

def sums(ls: +List<+List<U32>>) -> U32:
  match ls:
    case []:
      0
    case h <> t:
      (sum(h) + sums(t) : U32)

def len(s: String) -> U32:
  match s:
    case SNil{}:
      0
    case SCon{c, t}:
      (1 + len(t) : U32)

def nat(n: Nat) -> U32:
  match n:
    case 0n:
      0
    case 1n+p:
      (1 + nat(p) : U32)

def use(b: Bag, x: U32) -> U32:
  match b:
    case Bag{xs, n, ls, s}:
      (x + sum(xs) + nat(n) + sums(ls) + len(s) : U32)

def wrap(b: Bag) -> U32 *-> U32:
  *x => use(b, x)

def round(+acc: U32) -> U32:
  b : Bag = Bag{[(acc % 7 : U32), 2, 3], U32.to_nat((acc % 5 : U32)),
    [[(acc % 3 : U32)], [20, 30]], U32.show(acc)}
  m : U32 *-> U32 = wrap(b)
  p q = m(100) m(200)
  r = m(300)
  (p + q + r : U32)

def loop(n: Nat, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      loop(p, (round(acc) % 1000003 : U32))

def main() -> IO(Unit):
  IO.print(U32.show(loop(1000n, 1)))

#|801
