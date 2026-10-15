# N12: a type variable is not a first-order domain, so apply(U32 -> U32,
# ..) cannot smuggle an arrow in (R2)
import Base

def apply(-A: Type, f: A *-> A, x: A) -> A:
  f(x)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : A
#|Context:
#|- A : Type
#|Location: apply
#|4 |
#|5>| def apply(-A: Type, f: A *-> A, x: A) -> A:
#|  |                        ^
#|6 |   f(x)
#|exit 1
