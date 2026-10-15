# N15: a do block that calls a callable-many closure in two statements.
# History: rejected in version 1, since the second call lives in the
# continuation closure and a capture counted as a move (A3 went through a
# parallel let); accepted since C008 (Q-rule: the continuation only calls
# close, so its capture is a Call). c8_do_close runs this form.
import Base

def close_two(close: File *-> IO(Unit), a: File, b: File) -> IO(Unit):
  do IO<Unit>:
    close(a)
    close(b)

#|ALL PROOFS CHECK
#|Use --verdict for mathematical validity.
