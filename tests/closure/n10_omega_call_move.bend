# N10: omega by call plus move (consult round 20261015-102450-6325): f is
# called and also moved into Mk{f}, rejected by R5
import Base

type D is Type:
  Mk{run: Unit *-> (D -> Empty)}

def delta(d: D) -> Empty:
  match d:
    case Mk{f}:
      f(Unit{})(Mk{f})

#|SOME PROOFS FAIL
#|Error:
#|- expected : f
#|- observed : f (called and also moved: a *-> binder is either only called, or moved once)
#|Location: delta
#| 9 |   match d:
#|10>|     case Mk{f}:
#|   |             ^
#|11 |       f(Unit{})(Mk{f})
#|exit 1
