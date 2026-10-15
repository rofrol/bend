# A3: close: File *-> IO(Unit) captures nothing and is called on two
# handles. Check-only (no main): the interpreter runs IO through the JS
# backend, which refuses callable-many closures until C003. The two calls
# are a parallel let and the do block sequences their actions: a do block
# that calls close in two statements is rejected, since the second
# statement lives in the continuation closure, which moves close (R5; see
# r5_do_continuation.bend).
import Base

def closer() -> File *-> IO(Unit):
  *f => File.close(f)

def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
  x y = close(a) close(b)
  do IO<Unit>:
    x
    y

#|ALL PROOFS CHECK
#|Use --verdict for mathematical validity.
