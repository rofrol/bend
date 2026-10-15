# C006 phase 1, --verdict (from fixtures/c006a/src/e9_nonterm.bend): a
# non-terminating source; bend2 itself refuses it (no decreasing
# self-call), before any translation.
import Base

def spin(n: Nat, x: U32) -> U32:
  {*y => spin(1n+n, y) : U32 *-> U32}(x)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a decreasing self-call (arguments are read left to right: each passed unchanged until one shrinks)
#|- observed : spin
#|Context:
#|- n : Nat
#|- x : U32
#|- y : U32
#|Location: spin
#|6 | def spin(n: Nat, x: U32) -> U32:
#|7>|   {*y => spin(1n+n, y) : U32 *-> U32}(x)
#|  |          ^^^^
#|8 |
#|exit 1
