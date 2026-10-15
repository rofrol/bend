# C007: map lends its borrowed &f to its own recursive call and calls it
# on each element; the caller keeps m and calls it afterwards (an owned
# call-only binder called and lent in one scope)
import Base

def map(&f: U32 *-> U32, xs: List<U32>) -> List<U32>:
  match xs:
    case []:
      []
    case h <> t:
      f(h) <> map(f, t)

def main() -> List<U32>:
  +k : U32 = 10
  m : U32 *-> U32 = *x => (x * k : U32)
  ys = map(m, [1, 2, 3])
  (m(7) <> ys)

#|[70, 10, 20, 30]
