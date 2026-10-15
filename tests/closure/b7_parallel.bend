# C007: a borrowed &f lent to two parallel calls (a parallel let), and a
# temporary *x => closure and an R6-lifted def lent directly
import Base

def apply(&g: U32 *-> U32, x: U32) -> U32:
  g(x)

def both(&f: U32 *-> U32, +x: U32) -> U32:
  a b = apply(f, x) apply(f, (x + 1 : U32))
  (a + b : U32)

def double(x: U32) -> U32:
  (x * 2 : U32)

def main() -> List<U32>:
  +k : U32 = 100
  m : U32 *-> U32 = *x => (x + k : U32)
  [both(m, 1), both(*y => (y * 3 : U32), 5), both(double, 10), m(0)]

#|[203, 33, 42, 100]
