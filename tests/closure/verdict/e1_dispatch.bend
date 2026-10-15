# C006 phase 1, --verdict (from fixtures/c006a/src/e1_dispatch.bend): two
# callable-many sites with Data captures, each called twice. Accepted:
# one datatype, one apply, a body def per site.
import Base

def main() -> U32:
  +k : U32 = 3
  +j : U32 = 5
  m : U32 *-> U32 = *x => (x * k : U32)
  n : U32 *-> U32 = *x => (x + j : U32)
  (m(1) + m(2) + n(1) + n(2) : U32)

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|An independent validator checked the defunctionalization between the source and the translated Bend program. The BendTT text the kernel checked was produced from that validated translation by an unmodified upstream elaborator (Bend 014ccd03, pinned by hash), the same trust as any upstream --verdict. This does not establish that the source's behavior or laws are preserved; ownership rules are checked only by the source checker.
