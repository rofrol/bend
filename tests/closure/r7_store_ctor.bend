# C007: a borrowed binder cannot be stored in a constructor (B2)
import Base

type Box is Type:
  Box{f: U32 *-> U32}

def bad(&f: U32 *-> U32) -> Box:
  Box{f}

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|7 | def bad(&f: U32 *-> U32) -> Box:
#|8>|   Box{f}
#|  |       ^
#|9 |
#|exit 1
