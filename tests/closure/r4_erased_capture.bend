# R4: an erased capture is free: the closure mentions -A only in a type
import Base

def mk(-A: Type) -> U32 *-> U32:
  *x =>
    n : Maybe<A> = None{}
    x

def main() -> U32:
  m : U32 *-> U32 = mk(Unit)
  (m(1) + m(2) : U32)

#|3
