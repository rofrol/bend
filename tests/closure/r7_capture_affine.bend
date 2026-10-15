# C007: an ordinary closure cannot capture a borrowed binder either (B2)
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def bad(&f: U32 *-> U32) -> U32:
  once(x => f(x))

#|SOME PROOFS FAIL
#|Error:
#|- expected : no capture of the borrowed f (a closure outlives the call that lent it)
#|- observed : @_:U32 *-> U32
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|7 | def bad(&f: U32 *-> U32) -> U32:
#|8>|   once(x => f(x))
#|  |        ^
#|9 |
#|exit 1
