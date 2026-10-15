# N9: no Data container hides affine contents: a +-bound List<&2, File>
# would let a callable-many closure capture handles, but File does not
# fit Data, so the container type does not form (certify-once applies)
import Base

def bad(+hs: List<&2, File>) -> U32 *-> U32:
  *x => x

#|SOME PROOFS FAIL
#|Error:
#|- expected : Data
#|- observed : Type
#|Location: bad
#|5 |
#|6>| def bad(+hs: List<&2, File>) -> U32 *-> U32:
#|  |                       ^^^^
#|7 |   *x => x
#|exit 1
