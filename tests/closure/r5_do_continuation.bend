# R5 consequence: a do block that calls a callable-many closure in two
# statements is rejected: the second call lives in the continuation
# closure, which moves close, and the first call is a call (A3 sequences
# the two calls through a parallel let instead)
import Base

def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
  do IO<Unit>:
    close(a)
    close(b)

#|SOME PROOFS FAIL
#|Error:
#|- expected : close
#|- observed : close (called and also moved: a *-> binder is either only called, or moved once)
#|Location: close_two
#|6 |
#|7>| def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
#|  |               ^^^^^
#|8 |   do IO<Unit>:
#|exit 1
