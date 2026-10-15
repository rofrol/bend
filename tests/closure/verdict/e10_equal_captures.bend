# C006 phase 1, --verdict (from fixtures/c006a/src/e10_equal_captures.bend):
# two closures from one site with equal captures, and two sites with equal
# captures and the same text; each site its own constructor. Accepted.
import Base

def mk(+k: U32) -> U32 *-> U32:
  *x => (x * k : U32)

def main() -> U32:
  +k : U32 = 2
  a = mk(k)
  b = mk(k)
  c : U32 *-> U32 = *x => (x + k : U32)
  d : U32 *-> U32 = *x => (x * k : U32)
  (a(5) + b(6) + c(5) + d(7) : U32)

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|An independent validator checked the defunctionalization between the source and the translated Bend program. The step from that program to the BendTT text the kernel checked is bend2's own unverified elaborator, as for every program, and was checked only for structure. This does not establish that the source's behavior or laws are preserved; ownership rules are checked only by the source checker.
