# N7: a domain that mentions Type (here an existential package, the shape
# Hurkens' paradox needs) is not first-order (R2)
import Base

type Pkg is Type:
  Pkg{A: Type, x: A}

def bad(f: Pkg *-> U32) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : Type
#|Location: bad
#|7 |
#|8>| def bad(f: Pkg *-> U32) -> U32:
#|  |            ^^^
#|9 |   0
#|exit 1
