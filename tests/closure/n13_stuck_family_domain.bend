# N13: a type family stuck on a variable is not a first-order domain:
# F(0n) is an arrow (R2)
import Base

def F(n: Nat) -> Type:
  match n:
    case 0n:
      U32 -> U32
    case 1n+p:
      U32

def bad(n: Nat, f: F(n) *-> U32) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : F(n)
#|Context:
#|- n : Nat
#|Location: bad
#|11 |
#|12>| def bad(n: Nat, f: F(n) *-> U32) -> U32:
#|   |                    ^^^^
#|13 |   0
#|exit 1
