# A2: a Data record of build flags, bound once (no +), captured by a
# callable-many closure that builds three plans: the capture is charged
# once, like an argument to a + parameter (certify-once)
import Base

type Flags is Data:
  Flags{opt: U32, debug: Bool}

type Plan is Data:
  Plan{target: U32, opt: U32, debug: Bool}

def plan(+fl: Flags, t: U32) -> Plan:
  match fl:
    case Flags{o, g}:
      Plan{t, o, g}

def main() -> List<Plan>:
  fl : Flags = Flags{2, True{}}
  mk : U32 *-> Plan = *t => plan(fl, t)
  [mk(1), mk(2), mk(3)]

#|[Plan{1, 2, True{}}, Plan{2, 2, True{}}, Plan{3, 2, True{}}]
