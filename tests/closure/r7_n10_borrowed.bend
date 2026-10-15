# C007: N10 rewritten with a borrowed parameter: f is called and stored
# in Mk{f}, which B2 forbids (B5)
import Base

type D is Type:
  Mk{run: Unit *-> (D -> Empty)}

def delta(&f: Unit *-> (D -> Empty)) -> Empty:
  f(Unit{})(Mk{f})

#|SOME PROOFS FAIL
#|Error:
#|- expected : a call of f, or a lend of it to a & parameter (f is borrowed: it is never moved, stored, returned or let-bound)
#|- observed : f
#|Context:
#|- f : @_:Unit *-> @_:D -> Empty
#|Location: delta
#| 8 | def delta(&f: Unit *-> (D -> Empty)) -> Empty:
#| 9>|   f(Unit{})(Mk{f})
#|   |                ^
#|10 |
#|exit 1
