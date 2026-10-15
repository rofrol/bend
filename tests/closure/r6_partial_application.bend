# R6: a def partially applied to a Data argument is accepted at U32 *->
# U32 (it captures that argument), and one applied to a non-Data
# argument (an affine closure) is not
import Base

def scale(k: U32, x: U32) -> U32:
  (x * k : U32)

def twice(f: U32 *-> U32, x: U32) -> U32:
  (f(x) + f(1) : U32)

def ok() -> U32:
  twice(scale(3), 5)

def call(g: U32 -> U32, x: U32) -> U32:
  g(x)

def bad(g: U32 -> U32) -> U32:
  twice(call(g), 5)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data argument (a partial application at *-> copies its arguments on each call)
#|- observed : @_:U32 -> U32
#|Context:
#|- g : @_:U32 -> U32
#|Location: bad
#|18 | def bad(g: U32 -> U32) -> U32:
#|19>|   twice(call(g), 5)
#|   |              ^
#|20 |
#|exit 1
