# C006 phase 1, --verdict (from fixtures/c006a/src/e5_fusion.bend): fusion
# of two concrete closures by list induction; the law mentions only
# first-order defs. Accepted.
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def addk(+a: U32, xs: List<U32>) -> List<U32>:
  map(*x => (x + a : U32), xs)

def mulk(+b: U32, xs: List<U32>) -> List<U32>:
  map(*x => (x * b : U32), xs)

def muladd(+b: U32, +a: U32, xs: List<U32>) -> List<U32>:
  map(*x => (x * b + a : U32), xs)

law fuse:
  for +a: U32
  for +b: U32
  for xs: List<U32>
  {addk(a, mulk(b, xs)) == muladd(b, a, xs) : List<U32>}

def fuse(a, b, xs):
  match xs:
    case []:
      {==}
    case h <> t:
      %fuse(a, b, t) : {U32.add(U32.mul(h, b), a) <> addk(a, mulk(b, t)) == U32.add(U32.mul(h, b), a) <> _ : List<U32>}
      {==}

def main() -> List<U32>:
  addk(1, mulk(2, [1, 2, 3]))

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|An independent validator checked the defunctionalization between the source and the translated Bend program. The BendTT text the kernel checked was produced from that validated translation by an unmodified upstream elaborator (Bend 014ccd03, pinned by hash), the same trust as any upstream --verdict. This does not establish that the source's behavior or laws are preserved; ownership rules are checked only by the source checker.
