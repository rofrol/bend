# N4: a + binder cannot have a callable-many type (R1)
import Base

def bad(+f: U32 *-> U32) -> U32:
  f(1)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data type for +f
#|- observed : @_:U32 *-> U32
#|Location: bad
#|3 |
#|4>| def bad(+f: U32 *-> U32) -> U32:
#|  |             ^^^^^^^^^^^
#|5 |   f(1)
#|Note: a callable-many closure is called many times, never copied: bind it without +.
#|exit 1
