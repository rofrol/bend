# R5 consequence: a recursive map calls f and passes it to its own
# recursive call, a call plus a move, so it is rejected (a def calls f
# many times only without passing it on, as in A4)
import Base

def map(f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: map
#|5 |
#|6>| def map(f: U32 *-> U32, xs: List<U32>) -> List<U32>:
#|  |         ^
#|7 |   match xs:
#|exit 1
