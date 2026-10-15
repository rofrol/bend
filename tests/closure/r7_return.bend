# C007: a borrowed binder cannot be returned (B2)
import Base

def bad(&f: U32 *-> U32) -> U32 *-> U32:
  f

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|4 | def bad(&f: U32 *-> U32) -> U32 *-> U32:
#|5>|   f
#|  |   ^
#|6 |
#|exit 1
