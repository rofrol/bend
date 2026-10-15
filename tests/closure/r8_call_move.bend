# C008: a capture is a Call only while f is call-only: here f is also
# moved (keep(f)), so the capture and the move clash (R5)
import Base

def keep(g: U32 *-> U32) -> U32 *-> U32:
  g

def bad(f: U32 *-> U32) -> U32 *-> U32:
  h : U32 -> U32 = x => f(x)
  n = h(1)
  keep(f)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|7 |
#|8>| def bad(f: U32 *-> U32) -> U32 *-> U32:
#|  |         ^
#|9 |   h : U32 -> U32 = x => f(x)
#|exit 1
