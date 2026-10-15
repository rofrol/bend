# C007: a borrowed binder cannot be let-bound (B2)
import Base

def bad(&f: U32 *-> U32) -> U32:
  g = f
  g(1)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|4 | def bad(&f: U32 *-> U32) -> U32:
#|5>|   g = f
#|  |       ^
#|6 |   g(1)
#|exit 1
