# R4: a capture is charged once (certify-once), so a plain binder that a
# callable-many closure captures cannot also be used after it
import Base

def main() -> U32:
  k : U32 = 10
  m : U32 *-> U32 = *x => (x * k : U32)
  (m(1) + k : U32)

#|SOME PROOFS FAIL
#|Error:
#|- expected : k
#|- observed : k (consumed more than once)
#|Location: main
#|5 | def main() -> U32:
#|6>|   k : U32 = 10
#|  |   ^
#|7 |   m : U32 *-> U32 = *x => (x * k : U32)
#|exit 1
