# review (d): a lambda after a let in a def body is past the def's
# parameters, so it is a closure: capturing g there moves g, and with
# the call before it that is a Clash
import Base

def call_and_capture(g: Unit *-> Nat) -> Unit -> Nat:
  a = g(Unit{})
  u => Nat.add(a, g(u))

#|SOME PROOFS FAIL
#|Error:
#|- expected : g
#|- observed : g (called and also moved: a *-> binder is either only called, or moved once)
#|Location: call_and_capture
#|5 |
#|6>| def call_and_capture(g: Unit *-> Nat) -> Unit -> Nat:
#|  |                      ^
#|7 |   a = g(Unit{})
#|exit 1
