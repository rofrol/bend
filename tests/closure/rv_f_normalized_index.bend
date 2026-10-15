# review (f): a datatype index that normalizes to a closed term is
# closed: zero(n) is 0n whatever n is
import Base

type Tag<-k: Nat> is Data:
  Tag{}

def zero(n: Nat) -> Nat:
  0n

def ok(n: Nat, f: Tag<zero(n)> *-> U32) -> U32:
  0

def main() -> U32:
  0

#|0
