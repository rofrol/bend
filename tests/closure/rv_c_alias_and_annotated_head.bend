# review (c): a call and a move of the same binder stay a Clash through a
# let alias (g = f moves f) even though the later head is a call
import Base

def bad(f: U32 *-> U32) -> U32:
  g = f
  (f(1) + g(2) : U32)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|4 |
#|5>| def bad(f: U32 *-> U32) -> U32:
#|  |         ^
#|6 |   g = f
#|exit 1
