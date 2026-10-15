# C006 phase 1, --verdict: policy T1 covers a proof's body: this proof
# builds a closure (its law is about U32 only). Refused.
import Base

def id(x: U32) -> U32:
  x

law three:
  {id(3) == 3 : U32}

def three():
  m : U32 *-> U32 = *x => id(x)
  {==}

#|SOME PROOFS FAIL
#|Error: --verdict cannot check this book's callable-many closures (C006 phase 1): law three: its proof holds the callable-many lambda *x => .. (line 12, column 21) (T1: a law or proof may not quantify over, compare or observe callable-many closures; after defunctionalization it would range over this book's closures only)
#|exit 1
