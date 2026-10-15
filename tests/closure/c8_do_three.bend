# C008: a do block calls a callable-many closure in three statements
import Base

def main() -> IO(Unit):
  +k : U32 = 10
  say : (U32 *-> IO(Unit)) = *x => IO.print(U32.show((x * k : U32)))
  do IO<Unit>:
    say(1)
    say(2)
    say(3)

#|10
#|20
#|30
