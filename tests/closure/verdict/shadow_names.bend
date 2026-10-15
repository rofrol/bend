# C006 phase 1, --verdict: user defs already named like the generated
# items (Clo_U32_U32, apply_U32_U32): the translation picks fresh names,
# and the validator's exact K1 still accounts for every kernel def.
import Base

type Clo_U32_U32 is Data:
  Mine{v: U32}

def apply_U32_U32(c: Clo_U32_U32, x: U32) -> U32:
  match c:
    case Mine{v}:
      (v + x : U32)

def main() -> U32:
  +k : U32 = 3
  m : U32 *-> U32 = *x => (x * k : U32)
  (m(1) + apply_U32_U32(Mine{10}, m(2)) : U32)

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|An independent validator checked the defunctionalization between the source and the translated Bend program. The step from that program to the BendTT text the kernel checked is bend2's own unverified elaborator, as for every program, and was checked only for structure. This does not establish that the source's behavior or laws are preserved; ownership rules are checked only by the source checker.
