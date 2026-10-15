# C007: @unsafe does not lift B2: a borrowed binder is still not
# returned
import Base

@unsafe def bad(&f: U32 *-> U32) -> U32 *-> U32:
  f

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|5 | @unsafe def bad(&f: U32 *-> U32) -> U32 *-> U32:
#|6>|   f
#|  |   ^
#|7 |
#|exit 1
