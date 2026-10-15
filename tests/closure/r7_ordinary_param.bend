# C007: a borrowed binder cannot be passed to an ordinary parameter (B2)
import Base

def take(g: U32 *-> U32) -> U32:
  g(1)

def bad(&f: U32 *-> U32) -> U32:
  take(f)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#|7 | def bad(&f: U32 *-> U32) -> U32:
#|8>|   take(f)
#|  |        ^
#|9 |
#|exit 1
