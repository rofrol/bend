# The base program of the C006 validator's mutation tests
# (tools/defun/mutate.ts): two lambda sites of one class whose captures
# have the same types, a literal in one body, and a lifted def.
import Base

def double(x: U32) -> U32:
  (x * 2 : U32)

def twice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) : U32)

def main() -> U32:
  +k : U32 = 3
  +j : U32 = 5
  m : U32 *-> U32 = *x => (x * k + j : U32)
  n : U32 *-> U32 = *x => (x + j + k + 1 : U32)
  (twice(m, 1) + twice(n, 2) + twice(double, 3) : U32)

#|56
