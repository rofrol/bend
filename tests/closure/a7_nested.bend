# A7: a callable-many closure whose body builds another callable-many
# closure over Data captures (its own argument x and k)
import Base

def main() -> U32:
  +k : U32 = 100
  outer : U32 *-> (U32 *-> U32) = *x => *y => (x + y + k : U32)
  f = outer(1)
  g = outer(2)
  (f(10) + f(20) + g(30) : U32)

#|364
