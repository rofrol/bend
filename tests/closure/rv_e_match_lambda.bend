# review (e): a match lambda is not a *x => lambda, so it does not
# inhabit A *-> B (no implicit conversion, R6); write *x => f(x) with a
# def f that matches
import Base

def bad() -> Nat *-> U32:
  \{Zero: 0; Succ: p => 1}

#|SOME PROOFS FAIL
#|Error:
#|- expected : @_:Nat *-> U32
#|- observed : a match lambda (affine; a *-> type takes *x => f(x), f a def that matches)
#|Location: bad
#|6 | def bad() -> Nat *-> U32:
#|7>|   \{Zero: 0; Succ: p => 1}
#|  |   ^^^^^^^^^^^^^^^^^^^^^^^^
#|8 |
#|exit 1
