# C003: parallel calls of one shared callable-many closure (a parallel
# let forks its calls), of a nested closure built by it, and of an alias
# the closure was moved into once
import Base

type Box is Data:
  Box{v: U32, w: U32}

def get(b: Box, x: U32) -> U32:
  match b:
    case Box{v, w}:
      (x * v + w : U32)

def main() -> List<U32>:
  b : Box = Box{10, 5}
  m : U32 *-> (U32 *-> U32) = *x => *y => (get(b, x) + y : U32)
  p q r = m(1) m(2) m(3)
  g = p
  s t u = g(100) g(200) q(1000)
  [s, t, u, r(0)]

#|[115, 215, 1025, 35]
