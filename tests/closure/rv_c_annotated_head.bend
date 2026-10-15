# review (c): an annotated head {f : T}(x) is not a bare variable, so it
# counts as a move of f, and with a call of f it is a Clash
import Base

def bad(f: U32 *-> U32) -> U32:
  ({f : U32 *-> U32}(1) + f(2) : U32)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|4 |
#|5>| def bad(f: U32 *-> U32) -> U32:
#|  |         ^
#|6 |   ({f : U32 *-> U32}(1) + f(2) : U32)
#|exit 1
