# N2: a callable-many closure cannot capture an Array (R4)
import Base

def keep(a: Array<U32>, i: U32) -> U32:
  i

def bad(a: Array<U32>) -> U32 *-> U32:
  *i => keep(a, i)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data capture (a: a *x => closure copies what it captures on each call)
#|- observed : Array<U32>
#|Context:
#|- a : Array<U32>
#|Location: bad
#|7 | def bad(a: Array<U32>) -> U32 *-> U32:
#|8>|   *i => keep(a, i)
#|  |    ^
#|9 |
#|exit 1
