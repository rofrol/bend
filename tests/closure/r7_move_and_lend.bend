# C007: an owned call-only binder both moved and lent clashes, as a call
# and a move do (B3, R5)
import Base

def apply(&g: U32 *-> U32, x: U32) -> U32:
  g(x)

def keep(g: U32 *-> U32) -> U32 *-> U32:
  g

def bad() -> U32:
  m : U32 *-> U32 = *x => x
  n = keep(m)
  apply(m, 1)

#|SOME PROOFS FAIL
#|Error:
#|- expected : m
#|- observed : m (called and also moved: a *-> binder is either only called, or moved once)
#|Location: bad
#|11 | def bad() -> U32:
#|12>|   m : U32 *-> U32 = *x => x
#|   |   ^
#|13 |   n = keep(m)
#|exit 1
