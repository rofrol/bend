# A5: a callable-many closure passed where U32 -> U32 is expected, through
# an explicit eta-expansion x => m(x), its single move (R6)
import Base

def apply_once(g: U32 -> U32, x: U32) -> U32:
  g(x)

def main() -> U32:
  +k : U32 = 10
  m : U32 *-> U32 = *x => (x * k : U32)
  apply_once(x => m(x), 5)

#|50
