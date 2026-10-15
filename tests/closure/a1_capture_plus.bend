# A1: a + binder of Data type captured by a callable-many closure, called
# twice
import Base

def main() -> U32:
  +k : U32 = 10
  m : U32 *-> U32 = *x => (x * k : U32)
  (m(1) + m(2) : U32)

#|30
