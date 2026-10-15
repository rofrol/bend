# C008: a capture (a Call) in one branch and a move in the other join to
# a clash (R5)
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def take(g: U32 *-> U32) -> U32:
  g(2)

def bad(f: U32 *-> U32, b: Bool) -> U32:
  match b:
    case True{}:
      once(x => f(x))
    case False{}:
      take(f)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|10 |
#|11>| def bad(f: U32 *-> U32, b: Bool) -> U32:
#|   |         ^
#|12 |   match b:
#|exit 1
