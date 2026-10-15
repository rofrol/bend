# N8: a callable-many closure moved twice (R5)
import Base

def thrice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) + f((x + 2 : U32)) : U32)

def main() -> U32:
  +k : U32 = 3
  m : U32 *-> U32 = *x => (x * k : U32)
  (thrice(m, 1) + thrice(m, 2) : U32)

#|SOME PROOFS FAIL
#|Error:
#|- expected : m
#|- observed : m (consumed more than once)
#|Context:
#|- k : U32
#|Location: main
#| 8 |   +k : U32 = 3
#| 9>|   m : U32 *-> U32 = *x => (x * k : U32)
#|   |   ^
#|10 |   (thrice(m, 1) + thrice(m, 2) : U32)
#|exit 1
