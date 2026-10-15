# N1: a callable-many closure cannot capture an affine handle (File is
# Type, not Data) and close it in its body (R4)
import Base

def bad(h: File) -> Unit *-> IO(Unit):
  *u => File.close(h)

#|SOME PROOFS FAIL
#|Error:
#|- expected : a Data capture (h: a *x => closure copies what it captures on each call)
#|- observed : File
#|Context:
#|- h : File
#|Location: bad
#|5 | def bad(h: File) -> Unit *-> IO(Unit):
#|6>|   *u => File.close(h)
#|  |    ^
#|7 |
#|exit 1
