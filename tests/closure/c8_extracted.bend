# C008: a call-only binder extracted by a match from a linear container
# is called and captured by an ordinary lambda in the same arm
import Base

type T is Type:
  T{f: U32 *-> U32}

def use(t: T) -> U32:
  match t:
    case T{f}:
      g : U32 -> U32 = x => f(x)
      (g(1) + f(2) : U32)

def main() -> U32:
  +k : U32 = 7
  use(T{*x => (x * k : U32)})

#|21
