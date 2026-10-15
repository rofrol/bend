# N11: a move into an affine parameter (the closure x => f(x) moves f)
# plus a call of f (R5)
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def bad(f: U32 *-> U32) -> U32:
  (once(x => f(x)) + f(1) : U32)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|7 |
#|8>| def bad(f: U32 *-> U32) -> U32:
#|  |         ^
#|9 |   (once(x => f(x)) + f(1) : U32)
#|exit 1
