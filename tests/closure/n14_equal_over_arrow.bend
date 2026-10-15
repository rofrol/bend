# N14: an equation over an arrow type is not a first-order domain (R2)
import Base

def double(x: U32) -> U32:
  (x * 2 : U32)

def bad(f: {double == double : U32 -> U32} *-> U32) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : @_:U32 -> U32
#|Location: bad
#|6 |
#|7>| def bad(f: {double == double : U32 -> U32} *-> U32) -> U32:
#|  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#|8 |   0
#|exit 1
