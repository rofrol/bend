# C007: a borrowed parameter has a *-> type only (B1)
import Base

def bad(&f: U32 -> U32) -> U32:
  f(1)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a callable-many type A *-> B for the borrowed &f
#|- observed : @_:U32 -> U32
#|Location: bad
#|3 |
#|4>| def bad(&f: U32 -> U32) -> U32:
#|  |             ^^^^^^^^^^
#|5 |   f(1)
#|exit 1
