# C008: nested capture: x => (y => f(..)) captures the call-only f
# through two ordinary lambdas, then f is called directly too
import Base

def once(g: U32 -> U32) -> U32:
  g(1)

def go(f: U32 *-> U32) -> U32:
  (once(x => once(y => f((x + y : U32)))) + f(10) : U32)

def main() -> U32:
  +k : U32 = 5
  go(*x => (x * k : U32))

#|60
