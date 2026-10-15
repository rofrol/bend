# N5: a universe is not a first-order domain (R2)
import Base

def bad(f: Type *-> U32) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : Type
#|Location: bad
#|3 |
#|4>| def bad(f: Type *-> U32) -> U32:
#|  |            ^^^^
#|5 |   0
#|exit 1
