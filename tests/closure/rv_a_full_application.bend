# review (a): a FULL application of a def returns an ordinary closure,
# which may hold an affine value built in the def's body (here an Array);
# only a def or a def partially applied to Data fits A *-> B (R6)
import Base

def keep(a: Array<U32>, x: U32) -> U32:
  x

def make(u: Unit) -> U32 -> U32:
  a : Array<U32> = [0 : U32 ^ 1n]
  x => keep(a, x)

def twice(f: U32 *-> U32) -> U32:
  (f(1) + f(2) : U32)

def bad() -> U32:
  twice(make(Unit{}))

#|SOME PROOFS FAIL
#|Error:
#|- expected : @_:U32 *-> U32
#|- observed : @_:U32 -> U32
#|Location: bad
#|16 | def bad() -> U32:
#|17>|   twice(make(Unit{}))
#|   |         ^^^^^^^^^^^^
#|18 |
#|exit 1
