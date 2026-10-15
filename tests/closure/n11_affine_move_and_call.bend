# N11: an affine closure x => f(x) passed to an affine parameter, plus a
# call of f. History: rejected in version 1 (capture counted as a move,
# R5); accepted since C008: the closure only calls f, so its capture is
# a Call (Q-rule), and it holds a reference on f's closure
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def bad(f: U32 *-> U32) -> U32:
  (once(x => f(x)) + f(1) : U32)

#|ALL PROOFS CHECK
#|Use --verdict for mathematical validity.
