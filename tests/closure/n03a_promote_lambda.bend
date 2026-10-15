# N3: an affine lambda x => e is not a callable-many closure (R6)
import Base

def bad() -> U32 *-> U32:
  x => x

#|SOME PROOFS FAIL
#|Error:
#|- expected : @_:U32 *-> U32
#|- observed : an affine lambda (x => ..; a *-> type takes a *x => lambda)
#|Location: bad
#|4 | def bad() -> U32 *-> U32:
#|5>|   x => x
#|  |   ^
#|6 |
#|exit 1
