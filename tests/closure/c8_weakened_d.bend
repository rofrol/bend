# C008: argon's "weakened D": D's field is an ordinary arrow, so a value
# of D is built from wrappers u => f(u) around the call-only f. Each
# wrapper is a one-shot token: matching Mk{r} yields r once, and nothing
# can rebuild a D holding f inside delta, so no omega forms. With Empty
# (weak) it type-checks and nothing can run it; the U32 twin (Mk2) runs
# and terminates: each Mk2 wrapper calls f once, f counts one layer.
import Base

type D is Type:
  Mk{run: Unit -> (D -> Empty)}

def weak(f: Unit *-> (D -> Empty)) -> D:
  Mk{u => f(u)}

type E is Type:
  Mk2{run: Unit -> (E -> U32)}
  Stop{}

def count(e: E) -> U32:
  match e:
    case Stop{}:
      0
    case Mk2{r}:
      (1 + r(Unit{})(Stop{}) : U32)

def main() -> U32:
  f : Unit *-> (E -> U32) = *u => (e => count(e))
  d1 : E = Mk2{u => f(u)}
  d2 : E = Mk2{u => f(u)}
  (f(Unit{})(d1) + f(Unit{})(d2) : U32)

#|2
