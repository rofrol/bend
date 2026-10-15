# review (b): a datatype argument for a type-family parameter is checked
# first-order at a fresh variable, and the fields it shapes are checked
# too: D<(y => Unit)> holds only a Unit, so it is a first-order domain;
# D<(y => y)> would put the field at an unknown type, so it is not
import Base

type D<-F0: Type -> Type> is Type:
  D{x: F0(Unit)}

def ok(f: D<(y => Unit)> *-> U32) -> U32:
  0

def bad(f: D<(y => y)> *-> U32) -> U32:
  0

#|SOME PROOFS FAIL
#|Error:
#|- expected : a closed first-order domain for *-> (a primitive, a handle, an Array or a datatype of those: no function, universe, type variable or stuck type family)
#|- observed : y => y
#|Location: bad
#|12 |
#|13>| def bad(f: D<(y => y)> *-> U32) -> U32:
#|   |            ^^^^^^^^^^
#|14 |   0
#|exit 1
