# A6: a callable-many closure returns a fresh affine closure on each call;
# printer returns an IO action on each call (checked, not run)
import Base

def printer() -> U32 *-> IO(Unit):
  *n => IO.print("tick")

def main() -> U32:
  +k : U32 = 7
  mk : U32 *-> (U32 -> U32) = *a => (b => (a + b + k : U32))
  f = mk(1)
  g = mk(2)
  (f(10) + g(20) : U32)

#|47
