# C008: A3 written directly: a do block calls close: File *-> IO(Unit)
# in two statements; the second lives in the continuation closure, whose
# capture of the call-only close is a Call (Q-rule)
import Base

def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
  do IO<Unit>:
    close(a)
    close(b)

def main() -> IO(Unit):
  do IO<Unit>:
    a : File <- IO.try(File, File.open("/tmp/bend_closure_c8_a", "w"))
    b : File <- IO.try(File, File.open("/tmp/bend_closure_c8_b", "w"))
    close : (File *-> IO(Unit)) = *f => File.close(f)
    u : Unit <- close_two(close, a, b)
    IO.print("closed two")

#|closed two
