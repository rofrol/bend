# C008: an ordinary lambda capturing the call-only f is stored in a
# Type-kinded datatype, returned, and called after mk's scope ends; f is
# also called in mk. The capture holds a reference on f's closure
import Base

type Box is Type:
  Box{run: U32 -> U32}

def mk(+k: U32) -> Box:
  f : U32 *-> U32 = *x => (x * k : U32)
  a = f(1)
  Box{y => (f(y) + a : U32)}

def run(b: Box, x: U32) -> U32:
  match b:
    case Box{r}:
      r(x)

def main() -> U32:
  run(mk(3), 5)

#|18
