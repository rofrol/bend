# N6: omega through the new arrow: Tn's own field is a function, so Tn
# is not a first-order domain (R2)
import Base

type Tn is Type:
  Ln{f: Tn *-> Tn}
  Vn{n: U32}

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : @_:Tn *-> Tn
#|Location: Ln
#|5 | type Tn is Type:
#|6>|   Ln{f: Tn *-> Tn}
#|  |         ^^
#|7 |   Vn{n: U32}
#|exit 1
