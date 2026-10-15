# C003: partial applications lifted under R6 (a def applied to fewer
# arguments than its parameters, a Data record among them) are called
# three times by their receiver; a bare def is too
import Base

type Cfg is Data:
  Cfg{mul: U32, add: U32}

def apply_cfg(c: Cfg, x: U32) -> U32:
  match c:
    case Cfg{m, a}:
      (x * m + a : U32)

def scale(k: U32, x: U32) -> U32:
  (x * k : U32)

def double(x: U32) -> U32:
  (x * 2 : U32)

def thrice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) + f((x + 2 : U32)) : U32)

def main() -> List<U32>:
  [thrice(apply_cfg(Cfg{3, 1}), 2), thrice(scale(5), 1), thrice(double, 1)]

#|[30, 30, 12]
