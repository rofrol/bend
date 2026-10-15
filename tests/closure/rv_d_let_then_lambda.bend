# review (d): a lambda after a let in a def body is past the def's
# parameters, so it is a closure. History: under version 1 its capture
# of g was a move and clashed with the call before it; since C008 the
# lambda only calls g, so the capture is a Call and the def checks (the
# returned closure holds a reference on g's closure)
import Base

def call_and_capture(g: Unit *-> Nat) -> Unit -> Nat:
  a = g(Unit{})
  u => Nat.add(a, g(u))

#|ALL PROOFS CHECK
#|Use --verdict for mathematical validity.
