# C003 review (3): a partial application at *-> whose argument is a
# computed expression (mk(acc)) evaluates it once and captures the value;
# a three-parameter def applied to one argument fits U32 *-> (U32 -> U32)
import Base

type Cfg is Data:
  Cfg{mul: U32, add: U32}

def mk(+k: U32) -> Cfg:
  Cfg{(k + 1 : U32), k}

def apply_cfg(c: Cfg, x: U32) -> U32:
  match c:
    case Cfg{m, a}:
      (x * m + a : U32)

def add3(c: Cfg, x: U32, y: U32) -> U32:
  (apply_cfg(c, x) + y : U32)

def thrice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) + f((x + 2 : U32)) : U32)

def go(+k: U32) -> List<U32>:
  g : U32 *-> (U32 -> U32) = add3(mk(k))
  [thrice(apply_cfg(mk(k)), 2), g(1)(2), g(3)(4)]

def main() -> List<U32>:
  go(2)

#|[33, 7, 15]
