# C007: a def that borrows a parameter is only called with all its
# arguments: apply(m) as a value would keep the lent closure
import Base

def apply(&g: U32 *-> U32, x: U32) -> U32:
  g(x)

def once(h: U32 -> U32) -> U32:
  h(1)

def bad() -> U32:
  m : U32 *-> U32 = *x => x
  once(apply(m))

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of apply with all 2 arguments (it borrows a parameter, and a partial application would keep it)
#|- observed : apply
#|Context:
#|- m : @_:U32 *-> U32
#|Location: bad
#|12 |   m : U32 *-> U32 = *x => x
#|13>|   once(apply(m))
#|   |        ^^^^^
#|14 |
#|exit 1
