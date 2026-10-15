# C008: capture by a *x => lambda stays forbidden (R4), also through an
# ordinary lambda nested in it
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def bad(f: U32 *-> U32) -> U32 *-> U32:
  *x => once(y => f(y))

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data capture (f: a *x => closure copies what it captures on each call)
#|- observed : @_:U32 *-> U32
#|Context:
#|- f : @_:U32 *-> U32
#|Location: bad
#| 8 | def bad(f: U32 *-> U32) -> U32 *-> U32:
#| 9>|   *x => once(y => f(y))
#|   |    ^
#|10 |
#|exit 1
