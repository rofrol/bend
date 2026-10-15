# C008: N10 rewritten with a capturing lambda: h captures f (a Call) and
# Mk{f} moves f, so they clash (R5)
import Base

type D is Type:
  Mk{run: Unit *-> (D -> Empty)}

def delta(d: D) -> Empty:
  match d:
    case Mk{f}:
      h : Unit -> (D -> Empty) = x => f(x)
      h(Unit{})(Mk{f})

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: delta
#| 9 |   match d:
#|10>|     case Mk{f}:
#|   |             ^
#|11 |       h : Unit -> (D -> Empty) = x => f(x)
#|exit 1
