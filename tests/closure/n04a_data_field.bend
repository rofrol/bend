# N4: a Data datatype cannot hold a callable-many closure (R1, R7)
import Base

type Box is Data:
  Box{f: U32 *-> U32}

#|SOME PROOFS FAIL
#|Error:
#|- expected : Data
#|- observed : Type
#|Location: Box
#|4 | type Box is Data:
#|5>|   Box{f: U32 *-> U32}
#|  |          ^^^^^^^^^^^
#|6 |
#|exit 1
