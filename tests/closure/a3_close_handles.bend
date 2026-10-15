# A3: close: File *-> IO(Unit) captures nothing and is called on two
# handles. The two calls are a parallel let and the do block sequences
# their actions: a do block that calls close in two statements is
# rejected, since the second statement lives in the continuation
# closure, which moves close (R5; see r5_do_continuation.bend).
import Base

def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
  x y = close(a) close(b)
  do IO<Unit>:
    x
    y

def main() -> IO(Unit):
  do IO<Unit>:
    a : File <- IO.try(File, File.open("/tmp/bend_closure_a3_a", "w"))
    b : File <- IO.try(File, File.open("/tmp/bend_closure_a3_b", "w"))
    close : (File *-> IO(Unit)) = *f => File.close(f)
    u : Unit <- close_two(close, a, b)
    IO.print("closed two")

#|closed two
