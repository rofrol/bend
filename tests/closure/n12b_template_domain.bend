# N12: a template's ~ parameter is an opaque constant while its body
# checks, not a handle: T(~U32 -> U32) would unfold to an arrow domain
# (R2)
import Base

def T(~A: Type) -> Type:
  A *-> U32

def bad(f: T(~U32 -> U32)) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : T~A
#|Location: T
#|6 | def T(~A: Type) -> Type:
#|7>|   A *-> U32
#|  |   ^
#|8 |
#|exit 1
