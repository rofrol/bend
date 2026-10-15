# C008: a borrowed &f still may not be captured (B2), so a do block
# cannot call it in two statements: the IO value runs after the call
import Base

def bad(&f: U32 *-> IO(Unit)) -> IO(Unit):
  do IO<Unit>:
    f(1)
    f(2)

#|SOME PROOFS FAIL
#|Error:
#|- expected : no capture of the borrowed f (a closure outlives the call that lent it)
#|- observed : @_:U32 *-> @-R:Type -> @k:(@_:Unit -> IO.OP<R>) -> IO.OP<R>
#|Context:
#|- f : @_:U32 *-> @-R:Type -> @k:(@_:Unit -> IO.OP<R>) -> IO.OP<R>
#|Location: bad
#|6 |   do IO<Unit>:
#|7>|     f(1)
#|  |     ^^^^
#|8 |     f(2)
#|exit 1
