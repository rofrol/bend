# A4: a callable-many closure passed (its single move) to a parameter
# f: U32 *-> U32 of a def that calls f three times; a top-level def is
# also accepted at U32 *-> U32 (it captures nothing, R6)
import Base

def thrice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) + f((x + 2 : U32)) : U32)

def double(x: U32) -> U32:
  (x * 2 : U32)

def main() -> U32:
  +k : U32 = 3
  m : U32 *-> U32 = *x => (x * k : U32)
  (thrice(m, 1) + thrice(double, 1) : U32)

#|30
