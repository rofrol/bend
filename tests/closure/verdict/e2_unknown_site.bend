# C006 phase 1, --verdict (from fixtures/c006a/src/e2_unknown_site.bend):
# a def calls its *-> parameter whose site it cannot know; two lambda
# sites, a bare def and a partial application (R6) reach it. Accepted.
import Base

def thrice(f: U32 *-> U32, +x: U32) -> U32:
  (f(x) + f((x + 1 : U32)) + f((x + 2 : U32)) : U32)

def double(x: U32) -> U32:
  (x * 2 : U32)

def add3(a: U32, b: U32, x: U32) -> U32:
  (a + b + x : U32)

def main() -> U32:
  +k : U32 = 3
  +j : U32 = 5
  m : U32 *-> U32 = *x => (x * k : U32)
  n : U32 *-> U32 = *x => (x + j : U32)
  (thrice(m, 1) + thrice(n, 1) + thrice(double, 1) + thrice(add3(10, 20), 1) : U32)

#|EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)
#|An independent validator checked the defunctionalization between the source and the translated Bend program. The step from that program to the BendTT text the kernel checked is bend2's own unverified elaborator, as for every program, and was checked only for structure. This does not establish that the source's behavior or laws are preserved; ownership rules are checked only by the source checker.
