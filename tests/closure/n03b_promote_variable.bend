# N3: an affine closure variable does not convert to U32 *-> U32 (R6)
import Base

def use(f: U32 *-> U32) -> U32:
  f(1)

def bad(g: U32 -> U32) -> U32:
  use(g)

#|SOME PROOFS FAIL
#|Error:
#|- expected : @_:U32 *-> U32
#|- observed : @_:U32 -> U32
#|Context:
#|- g : @_:U32 -> U32
#|Location: bad
#|7 | def bad(g: U32 -> U32) -> U32:
#|8>|   use(g)
#|  |       ^
#|9 |
#|exit 1
