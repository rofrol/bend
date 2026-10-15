# C003: a callable-many closure over Data takes a fresh affine Array on
# each call and consumes it; the environment survives every call
import Base

def rd(r: Array<U32> & U32) -> U32:
  (a2, v) = r
  v

def first(a: Array<U32>) -> U32:
  rd(Array.get(U32, a, 0))

def main() -> U32:
  +k : U32 = 100
  m : Array<U32> *-> U32 = *a => (first(a) + k : U32)
  x = m(Array.set(U32, [0 : U32*2n], 0, 1))
  y = m(Array.set(U32, [0 : U32*2n], 0, 2))
  z = m([7 : U32*4n])
  (x + y + z : U32)

#|310
