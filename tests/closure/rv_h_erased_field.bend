# review (h): an erased field is absent from storage and dead, so a
# function in it does not stop a first-order domain (SPEC 7.1: live
# fields)
import Base

type E is Type:
  E{-f: U32 -> U32, n: U32}

def get(e: E) -> U32:
  match e:
    case E{f, n}:
      n

def main() -> U32:
  m : E *-> U32 = *e => get(e)
  m(E{x => x, 7})

#|7
