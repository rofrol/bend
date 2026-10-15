# C007: a *x => closure cannot capture a borrowed binder (B2)
import Base

def bad(&f: U32 *-> U32) -> U32 *-> U32:
  *x => f(x)

#|SOME PROOFS FAIL
#|Error:
#|- expected : no capture of the borrowed f (a closure outlives the call that lent it)
#|- observed : @_:U32 *-> U32
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|4 | def bad(&f: U32 *-> U32) -> U32 *-> U32:
#|5>|   *x => f(x)
#|  |    ^
#|6 |
#|exit 1
