# N2: a callable-many closure cannot capture an affine closure (R4)
import Base

def bad(g: U32 -> U32) -> U32 *-> U32:
  *x => g(x)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data capture (g: a *x => closure copies what it captures on each call)
#|- observed : @_:U32 -> U32
#|Context:
#|- g : @_:U32 -> U32
#|Location: bad
#|4 | def bad(g: U32 -> U32) -> U32 *-> U32:
#|5>|   *x => g(x)
#|  |    ^
#|6 |
#|exit 1
