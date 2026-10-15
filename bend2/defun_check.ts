// Defun check
// ===========
// The validator of C006 phase 1 (SPEC 7.3, T6): an independent check of
// the defunctionalization that `--verdict` and `-o x.bendtt` apply to a
// book with callable-many closures (defun.ts). It reads three things and
// shares no data structure with the translator:
//   S  the source book, as bend2 parsed and checked it (Def.e: checked
//      terms, each node wrapped in the type bend2 checked it at);
//   T  the emitted translation (Bend text), parsed and checked again by
//      bend2 from that text;
//   K  the emitted BendTT text, read by this module's own parser (a port of
//      the grammar of bendtt.lean's Term.parse, not safe.ts's printer).
// It fails closed: any form a rule below does not name is a violation, and
// --verdict then refuses. The rules were written before the code.
//
// Correspondence rule set (phase 1: V0, stratum 0, one apply per type)
// --------------------------------------------------------------------
// Notation. A site is a callable-many lambda `*x => f` of S (a Lam flagged
// c), or an R6 lift: a node checked at a type A *-> B whose term is a def
// k, bare or applied to fewer arguments than its parameters, where k's
// own type at that point is an ordinary arrow. A closure call is an App
// of S whose head was checked at a type A *-> B. The captures of a lambda
// site are the variables its body (checked term, checker types dropped)
// names below the lambda's own level, in increasing level (binding order:
// binder identity, not names); the captures of a lift are its arguments.
// The class of a site or call is its arrow A *-> B. "Equal" for terms is
// alpha-equivalence: variables compare by the binder they point to.
//
// P. Policy (T1). No law (a def flagged l) and no proof (a def whose type
//    holds an equation) of S holds *-> or *x => in its type or body, in
//    the type of any of its binders, or in a type it mentions, followed
//    through datatypes (constructor fields) and through the types of the
//    defs it names (and the bodies of those that return a kind).
// I. Items. T's own items (outside Base) are S's own items, with the same
//    kind and name, plus generated items, each reached by rules C, A, R
//    below: one Data datatype per class, one constructor per site, one
//    body def per site, one apply def per class. No other item, and no
//    item of S missing (an omitted definition fails here).
// L. Lockstep. Each own def of S and its namesake in T check to the same
//    term, walked together, up to these differences only:
//    L1 a site of S stands in T as a constructor K{a1, .., an}: for a
//       lambda the ai are exactly the site's captures, as variables, in
//       binding order; for a lift they equal its arguments, in order;
//    L2 a closure call h(x) of S stands in T as apply(h', x') with h', x'
//       equal to h, x, and apply the apply def of the call's class;
//    L3 a type A *-> B of S stands in T as the class's datatype;
//    L4 a binder of a *-> type (a def parameter or a let) may be + in T;
//    L5 every other form (Var, Ref, Sub, Let, Typ, Qnt, Qua, Min, All,
//       Lam, App, ADT, Ctr, Lit, Mat, Efq, Eql, Rfl, Rwt, Hol, Ann) has
//       the same constructor, the same data (quantities, names of book
//       items, literals, labels) and corresponding children. Def types
//       (Def.T) are compared the same way, borrowed (&) parameters of a
//       *-> type matching a + parameter of the class's datatype.
// C. Constructors (T2). Each constructor K met by L1 belongs to the class
//    datatype of its site; K is met at one site only (two sites never
//    share a constructor, even with equal captures: tag injectivity),
//    and every constructor of a class datatype is met at some site. Its
//    fields are the captures (lifts: the lifted def's parameters), same
//    count, order and types, each a closed type; the datatype is Data and
//    takes no parameters.
// R. Run (body) defs. The apply arm of each K calls one def, the body of
//    K, with K's fields in order and then the argument. For a lambda the
//    body def's type is the captures' types then A, to B; its term,
//    after binding those parameters, equals the lambda's body with each
//    capture replaced by the matching parameter and the lambda's binder
//    by the last one (content, not shape only; nested sites and calls in
//    it follow L1-L3). For a lift the body applies the lifted def to the
//    parameters in order.
// A. Apply. The apply def of a class A *-> B has type @c:D -> @x:A' ->
//    B' (D the class datatype; A', B' the class's A, B under L3), and
//    its term is a match on c with one arm per constructor of D, in
//    declaration order, each arm as R says, and no other arm. Every
//    closure call of one class goes to the same apply, and distinct
//    classes have distinct applies.
// G. Call graph (T9 phase 1). The calls among T's own defs (live code)
//    have no cycle but a def's call to itself.
// K. BendTT text. K parses in full with this module's parser, and:
//    K1 each own item of T, and nothing else of the book's own, has a
//       kernel def: a def by its name, a datatype D as D and D.arms;
//    K2 for each class datatype D, D.arms switches on exactly the labels
//       of D's constructors, in order, each to a Σ chain with as many
//       fields as the constructor has, ending in <()>; and D is the Σ
//       over that enum;
//    K3 the kernel type of each apply is ∀c : D -> ∀x : A -> B, with
//       A and B, as text, the type of the last parameter and the result
//       of every body def of D's constructors;
//    K4 the kernel term of each apply matches the tag of c and, for each
//       label K, splits the fields and calls K's body def with the
//       fields in order and then x;
//    K5 each constructor tuple (.K, (f1, .. (fn, ()))) of a class has n
//       fields;
//    K6 for each own def, the generated names (class datatypes, labels of
//       their constructors, applies, body defs) its kernel term names are
//       the ones its checked term in T names.
// Not checked (stated by T7): that the source's behavior or laws are
// preserved, and ownership (call-only, move-once), which only the source
// checker enforces; the translated closure is copyable Data.
//
// Amended while implementing (the rules above stand, these refine them):
// - L3/R/A compare a source type with a translated one structurally and,
//   failing that, up to bend2's conversion in T (a family index such as
//   zero(n) goes out normalized, as 0n).
// - K1 is exact (consult round 20261015-142035-a8c0): the kernel defs
//   of T's own items are exactly their names (a datatype D: D, D.arms,
//   and D.efq when empty), with no duplicate; every other kernel def must
//   come from Base (a Base item's name, or it with a suffix, no own name
//   a longer prefix). An own item that goes out under another name (a
//   quantity instance, a group) fails closed.
// - K2 also checks each field's kernel type against the body def's
//   kernel parameter type; K5 also checks that a lambda site's tuple
//   holds distinct variables (its captures).
// - C006c: K is the text the pinned, unmodified upstream elaborator
//   (bend2/defun_upstream.ts, Bend 014ccd03, hash-pinned) produced from
//   the translation, and the kernel checks exactly those bytes; this
//   fork's own elaboration must equal them (a tripwire in safe.ts), so T,
//   which bend2 here checked, is the program upstream elaborated.
// - The verdict's statement (T7) said, before C006c, what this covers: the validator
//   checks the defunctionalization between the source and the translated
//   Bend; the step to BendTT is bend2's own unverified elaborator, as for
//   every program, checked here for structure only (a content check at
//   the kernel level is deferred, C006c).
// - K4 accepts the call η-long: the kernel elaborates a function-typed
//   result (IO(..) is one) with extra binders after x, passed last, and an
//   argument of function type as its η-expansion.
// - Content (rule R, a body's terms) is compared between S and T, not
//   against K: comparing a source lambda with kernel text would need a
//   second elaborator. K is checked for structure (K1-K6) against T.

import * as B from "./bend.ts";
import type { Book, Def, HTerm, LTerm, Name } from "./bend.ts";

// Shared
// ======

// a checker annotation's type: bend2 wraps each checked node in one
function ann_type(t: LTerm): HTerm | null {
  return t.$ === "Ann" && t.T.$ === "Var" && t.T.i === -1 && t.T.v !== undefined ? t.T.v as HTerm : null;
}

function own_keys(book: Book): Name[] {
  return [...new Set(book.order)].filter((k) => book.tlds[k].b !== true);
}

// the first callable-many arrow or lambda in a term, or null
function many_in(t: unknown): LTerm | null {
  if (t === null || typeof t !== "object") {
    return null;
  }
  const o = t as Record<string, unknown>;
  if ((o.$ === "All" || o.$ === "Lam") && o.c === true) {
    return o as LTerm;
  }
  if (o.$ === "Var" && typeof o.i === "number" && o.i < 0 && o.v !== undefined) {
    return many_in(B.term_lower(o.v as HTerm, 1 << 20));
  }
  for (const k in o) {
    if (k !== "s" && !(k === "v" && o.$ === "Var")) {
      const got = many_in(o[k]);
      if (got !== null) {
        return got;
      }
    }
  }
  return null;
}

// a construct as the source spells it (a lambda by its head), else as
// bend2 shows it
function spell(t: LTerm): string {
  const s = t.s;
  if (t.$ === "Lam") {
    const at = s === undefined ? [0, 0] : line_col(s.file.str, s.beg);
    return "*" + t.k + " => .. (line " + String(at[0]) + ", column " + String(at[1] - 1) + ")";
  }
  if (s !== undefined && s.end > s.beg) {
    const txt = s.file.str.slice(s.beg, s.end).trim();
    return txt.length > 60 ? txt.slice(0, 57) + " .." : txt;
  }
  return B.term_show(t);
}

function line_col(s: string, i: number): [number, number] {
  const pre = s.slice(0, i).split("\n");
  return [pre.length, pre[pre.length - 1].length + 1];
}

function many_what(t: LTerm): string {
  return t.$ === "Lam" ? "the callable-many lambda " + spell(t) : "the callable-many type `" + spell(t) + "`";
}

// the book items a term names, types inside checker annotations too
function names_of(t: unknown, out: Set<string> = new Set()): Set<string> {
  if (t === null || typeof t !== "object") {
    return out;
  }
  const o = t as Record<string, unknown>;
  if ((o.$ === "Ref" || o.$ === "ADT" || o.$ === "Ctr") && typeof o.k === "string") {
    out.add(o.k.split("~")[0]);
  }
  if (o.$ === "Var" && typeof o.i === "number" && o.i < 0 && o.v !== undefined) {
    names_of(B.term_lower(o.v as HTerm, 1 << 20), out);
  }
  for (const k in o) {
    if (k !== "s" && !(k === "v" && o.$ === "Var")) {
      names_of(o[k], out);
    }
  }
  return out;
}

// Policy (rule P; SPEC 7.3 T1)
// ======

// null when no law or proof of the book touches *->, else why: a law (a
// def flagged l) or a proof (a def whose type holds an equation) may not
// hold *-> or *x => in its statement or body, handle a value whose type
// holds *-> (a binder's type included), or name a datatype or def whose
// type (a type-level def: whose body) holds one, transitively
export function policy(book: Book): string | null {
  for (const k of own_keys(book)) {
    const t = book.tlds[k];
    if (t.$ !== "Def") {
      continue;
    }
    const lowT = B.term_lower(t.T);
    const law = t.l === true;
    if (!law && !has_eql(lowT)) {
      continue;
    }
    const who = (law ? "law " : "proof ") + B.name_key(k);
    const why = " (T1: a law or proof may not quantify over, compare or observe callable-many closures; after"
      + " defunctionalization it would range over this book's closures only)";
    const bind = binder_many(lowT);
    if (bind !== null) {
      return who + " binds " + bind + why;
    }
    const inT = many_in(lowT);
    if (inT !== null) {
      return who + ": its statement holds " + many_what(inT) + why;
    }
    if (t.v !== null) {
      const inV = many_in(B.term_lower(t.v));
      if (inV !== null) {
        return who + ": its proof holds " + many_what(inV) + why;
      }
    }
    if (t.e !== undefined) {
      const bad = ann_many(t.e);
      if (bad !== null) {
        return who + ": its proof handles a value of " + many_what(bad) + why;
      }
    }
    const seen = new Set<string>([k]);
    const todo: Array<[string, string]> = [];
    for (const n of names_of([lowT, t.v === null ? null : B.term_lower(t.v), t.e ?? null])) {
      todo.push([n, who]);
    }
    while (todo.length > 0) {
      const [n, via] = todo.pop() as [string, string];
      const fam = book.ctrs[n] !== undefined && book.tlds[n] === undefined ? B.book_fam(book, n) : n;
      if (seen.has(fam)) {
        continue;
      }
      seen.add(fam);
      const tld = book.tlds[fam];
      if (tld === undefined || tld.b === true) {
        continue;
      }
      const path = via + " mentions " + B.name_key(fam);
      const parts: unknown[] = [];
      if (tld.$ === "ADT") {
        parts.push(B.term_lower(tld.T), ...tld.c.map((c) => B.term_lower(c.T)));
      } else {
        parts.push(B.term_lower(tld.T));
        if (tld.v !== null && B.tele_unbind(book, tld.T).ret.$ === "Typ") {
          parts.push(B.term_lower(tld.v));
        }
      }
      for (const part of parts) {
        const bad = many_in(part);
        if (bad !== null) {
          return path + ", whose " + (tld.$ === "ADT" ? "datatype" : "type") + " holds " + many_what(bad) + why;
        }
        for (const m of names_of(part)) {
          todo.push([m, path]);
        }
      }
    }
  }
  return null;
}

function has_eql(t: unknown): boolean {
  if (t === null || typeof t !== "object") {
    return false;
  }
  const o = t as Record<string, unknown>;
  if (o.$ === "Eql") {
    return true;
  }
  for (const k in o) {
    if (k !== "s" && has_eql(o[k])) {
      return true;
    }
  }
  return false;
}

// a binder of a telescope whose type holds *->: "k at <construct>"
function binder_many(t: LTerm): string | null {
  let cur: LTerm = t;
  while (cur.$ === "All") {
    const bad = many_in(cur.A);
    if (bad !== null) {
      return (cur.l === true ? "&" : B.quant_show(cur.q)) + cur.k + " at " + many_what(bad);
    }
    cur = cur.B;
  }
  return null;
}

// the first *-> in the type of a checked node
function ann_many(t: unknown): LTerm | null {
  if (t === null || typeof t !== "object") {
    return null;
  }
  const o = t as Record<string, unknown>;
  const ty = o.$ === "Ann" ? ann_type(o as LTerm) : null;
  if (ty !== null) {
    const bad = many_in(B.term_lower(ty, 1 << 20));
    if (bad !== null) {
      return bad;
    }
  }
  for (const k in o) {
    if (k !== "s" && !(k === "v" && o.$ === "Var") && k !== "T") {
      const got = ann_many(o[k]);
      if (got !== null) {
        return got;
      }
    }
  }
  if (o.$ !== "Ann" && o.T !== undefined) {
    return ann_many(o.T);
  }
  return null;
}

// BendTT text
// ===========
// a reader of the kernel's text, ported from bendtt.lean (Term.parse and
// Book.parse_defs); a variable is its de Bruijn index

type KQ = 0 | 1 | 2;

export type KT =
  | { $: "Var"; i: number }
  | { $: "Ref"; k: string }
  | { $: "Ann"; x: KT; T: KT }
  | { $: "Let"; q: KQ; k: string; v: KT; f: KT }
  | { $: "Typ"; q: KT | null; n: number }
  | { $: "Min"; a: KT; b: KT }
  | { $: "All"; q: KQ; k: string; A: KT; B: KT }
  | { $: "Sig"; q: KQ; k: string; A: KT; B: KT }
  | { $: "Lam"; q: KQ; k: string; f: KT }
  | { $: "App"; q: KQ; f: KT; x: KT }
  | { $: "Tup"; q: KQ; a: KT; b: KT }
  | { $: "Prj"; h: KT }
  | { $: "Enu"; ks: string[] }
  | { $: "Lab"; k: string }
  | { $: "Mat"; k: string; h: KT; m: KT }
  | { $: "Efq" }
  | { $: "Eql"; a: KT; b: KT; T: KT }
  | { $: "Rfl" }
  | { $: "Rwt"; e: KT; P: KT; f: KT };

export type KDef = { k: string; T: KT; v: KT; o: boolean };

class KFail {
  constructor(readonly why: string) {}
}

export function kernel_parse(text: string): KDef[] {
  let i = 0;
  const fail = (e: string): never => {
    throw new KFail("parse error: expected " + e + " at '" + text.slice(i, i + 30) + "'");
  };
  const skip = (): void => {
    while (i < text.length) {
      if (text[i] === "#") {
        while (i < text.length && text[i] !== "\n") {
          i++;
        }
      } else if (/\s/.test(text[i])) {
        i++;
      } else {
        break;
      }
    }
  };
  const peek = (): string => {
    skip();
    return i < text.length ? text[i] : " ";
  };
  const sees = (w: string): boolean => {
    skip();
    return text.startsWith(w, i);
  };
  const take = (w: string): boolean => {
    if (sees(w)) {
      i += w.length;
      return true;
    }
    return false;
  };
  const eat = (w: string): void => {
    if (!take(w)) {
      fail("'" + w + "'");
    }
  };
  const isname = (c: string): boolean => /[A-Za-z0-9_.]/.test(c);
  const name = (): string => {
    skip();
    const j = i;
    while (i < text.length && isname(text[i])) {
      i++;
    }
    if (i === j) {
      fail("a name");
    }
    return text.slice(j, i);
  };
  const label = (): string => take("()") ? "()" : name();
  const key = (): string => {
    if (take("()")) {
      return "()";
    }
    eat(".");
    return name();
  };
  const quan = (): KQ => take("-") ? 0 : take("+") ? 2 : 1;
  const term = (vs: string[]): KT => {
    const c = peek();
    if (sees("∀")) {
      return bind(vs, "∀");
    }
    if (sees("Σ")) {
      return bind(vs, "Σ");
    }
    if (sees("λ")) {
      eat("λ");
      if (take("{")) {
        return match(vs);
      }
      const q = quan();
      const k = name();
      eat("=>");
      return { $: "Lam", q, k, f: term([k, ...vs]) };
    }
    switch (c) {
      case "{": {
        eat("{");
        if (take("==")) {
          eat("}");
          return { $: "Rfl" };
        }
        const a = term(vs);
        if (take("==")) {
          const b = term(vs);
          eat(":");
          const T = term(vs);
          eat("}");
          return { $: "Eql", a, b, T };
        }
        eat(":");
        const T = term(vs);
        eat("}");
        return { $: "Ann", x: a, T };
      }
      case "*": {
        eat("*");
        if (take("(")) {
          const q = term(vs);
          eat(")");
          return { $: "Typ", q, n: 0 };
        }
        if (take("2")) {
          return { $: "Typ", q: null, n: 2 };
        }
        eat("1");
        return { $: "Typ", q: null, n: 1 };
      }
      case "!": {
        eat("!");
        const q = quan();
        const k = name();
        eat("=");
        const v = term(vs);
        eat(";");
        return { $: "Let", q, k, v, f: term([k, ...vs]) };
      }
      case "(": {
        eat("(");
        if (take(")")) {
          return { $: "Lab", k: "()" };
        }
        const q = quan();
        const a = term(vs);
        if (take(",")) {
          return { $: "Tup", q, a, b: tup(vs) };
        }
        if (q !== 1) {
          fail("a pair after a quantity mark");
        }
        if (take("<&>")) {
          const b = term(vs);
          eat(")");
          return { $: "Min", a, b };
        }
        let f = a;
        while (!take(")")) {
          const q2 = quan();
          f = { $: "App", q: q2, f, x: term(vs) };
        }
        return f;
      }
      case "<": {
        eat("<");
        const ks: string[] = [];
        while (!take(">")) {
          const k = label();
          if (ks.includes(k)) {
            fail("a fresh label");
          }
          ks.push(k);
          take(",");
        }
        return { $: "Enu", ks };
      }
      case ".": {
        return { $: "Lab", k: key() };
      }
      case "%": {
        eat("%");
        const e = term(vs);
        eat(":");
        const x = name();
        eat(",");
        const h = name();
        eat("=>");
        const P = term([h, x, ...vs]);
        eat(";");
        return { $: "Rwt", e, P, f: term(vs) };
      }
      default: {
        const k = name();
        const j = vs.indexOf(k);
        return j >= 0 ? { $: "Var", i: j } : { $: "Ref", k };
      }
    }
  };
  const bind = (vs: string[], c: string): KT => {
    eat(c);
    const q = quan();
    const k = name();
    eat(":");
    const A = term(vs);
    eat("->");
    const B = term([k, ...vs]);
    return c === "∀" ? { $: "All", q, k, A, B } : { $: "Sig", q, k, A, B };
  };
  const match = (vs: string[]): KT => {
    if (take("}")) {
      return { $: "Efq" };
    }
    if (take("(,)")) {
      eat(":");
      const h = term(vs);
      eat("}");
      return { $: "Prj", h };
    }
    const k = key();
    eat(":");
    const h = term(vs);
    eat(";");
    const m = term(vs);
    eat("}");
    return { $: "Mat", k, h, m };
  };
  const tup = (vs: string[]): KT => {
    const q = quan();
    const a = term(vs);
    if (take(",")) {
      return { $: "Tup", q, a, b: tup(vs) };
    }
    if (q !== 1) {
      fail("a pair after a quantity mark");
    }
    eat(")");
    return a;
  };
  const defs: KDef[] = [];
  while (true) {
    skip();
    if (i >= text.length) {
      return defs;
    }
    let k = name();
    const o = k === "opaque" && peek() !== ":";
    if (o) {
      k = name();
    }
    eat(":");
    const T = term([]);
    eat("=");
    const v = term([]);
    defs.push({ k, T, v, o });
  }
}

// structural equality of kernel terms (names of binders aside)
function k_eq(a: KT, b: KT): boolean {
  if (a.$ !== b.$) {
    return false;
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  for (const key of Object.keys(x)) {
    if (key === "k" && (a.$ === "All" || a.$ === "Sig" || a.$ === "Lam" || a.$ === "Let")) {
      continue;
    }
    const u = x[key];
    const w = y[key];
    if (u !== null && typeof u === "object" && !Array.isArray(u)) {
      if (w === null || typeof w !== "object" || !k_eq(u as KT, w as KT)) {
        return false;
      }
    } else if (JSON.stringify(u) !== JSON.stringify(w)) {
      return false;
    }
  }
  return true;
}

function k_walk(t: KT, f: (t: KT) => void): void {
  f(t);
  for (const v of Object.values(t)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && "$" in (v as object)) {
      k_walk(v as KT, f);
    }
  }
}

// whether t is the variable i, or an η-expansion of it
function k_eta_var(t: KT, i: number): boolean {
  let cur = t;
  let n = 0;
  while (cur.$ === "Lam") {
    cur = cur.f;
    n++;
  }
  const [h, xs] = k_unapp(cur);
  return h.$ === "Var" && h.i === i + n && xs.length === n && xs.every((x, j) => k_eta_var(x, n - 1 - j));
}

function k_unapp(t: KT): [KT, KT[]] {
  const xs: KT[] = [];
  let cur = t;
  while (cur.$ === "App") {
    xs.push(cur.x);
    cur = cur.f;
  }
  return [cur, xs.reverse()];
}

// Validate
// ========

// a site of S, as rule L1 met it
type SiteRec = {
  kind: "lam" | "lift"; where: string; ctor: Name; D: Name; arrow: HTerm;
  // a lambda: its node, its captures' levels and types (S)
  lam?: Extract<LTerm, { $: "Lam" }>; caps?: number[]; capT?: HTerm[];
  // a lift: the def and its parameters' types at the arguments (S)
  tgt?: Name; argT?: HTerm[];
};

// the levels of S matched to levels of T, and S's binder types
type Env = { m: number[]; cs: Array<HTerm | null> };

function strip_ann(t: LTerm): LTerm {
  let u = t;
  while (u.$ === "Ann" && ann_type(u) !== null) {
    u = u.x;
  }
  return u;
}

function unapp(t: LTerm): [LTerm, LTerm[]] {
  const xs: LTerm[] = [];
  let cur = strip_ann(t);
  while (cur.$ === "App") {
    xs.push(cur.x);
    cur = strip_ann(cur.f);
  }
  return [cur, xs.reverse()];
}

function free_below(t: LTerm, lo: number): number[] {
  const out = new Set<number>();
  const go = (x: unknown): void => {
    if (x === null || typeof x !== "object") {
      return;
    }
    const o = x as Record<string, unknown>;
    if (o.$ === "Ann" && ann_type(o as LTerm) !== null) {
      go(o.x);
      return;
    }
    if (o.$ === "Var" && typeof o.i === "number" && o.i >= 0 && o.i < lo) {
      out.add(o.i);
    }
    for (const k in o) {
      if (k !== "s" && !(k === "v" && o.$ === "Var")) {
        go(o[k]);
      }
    }
  };
  go(t);
  return [...out].sort((a, b) => a - b);
}

// the violations of the rule set by S (source book), T (the emitted
// translation, checked by bend2 from its text) and K (BendTT text); empty
// when the translation validates
export function validate(S: Book, T: Book, ktext: string): string[] {
  const bad: string[] = [];
  try {
    run_rules(S, T, ktext, bad);
  } catch (e) {
    bad.push(e instanceof KFail ? "K: " + e.why : "unexpected form (fail closed): " + String(e instanceof Error ? e.message : e));
  }
  return bad;
}

function run_rules(S: Book, T: Book, ktext: string, bad: string[]): void {
  let sink = bad;
  const no = (rule: string, why: string): false => {
    sink.push(rule + ": " + why);
    return false;
  };
  // P
  const pol = policy(S);
  if (pol !== null) {
    no("P", pol);
  }
  // I (source items kept)
  const sk = own_keys(S);
  const tk = own_keys(T);
  const tset = new Set(tk);
  for (const k of sk) {
    if (!tset.has(k)) {
      no("I", "the item " + B.name_key(k) + " of the source is missing from the translation (an omitted definition)");
    }
  }
  const sites: SiteRec[] = [];
  const ctor_site = new Map<Name, SiteRec>();
  const class_arrow = new Map<Name, HTerm>();
  const apply_arrow = new Map<Name, HTerm>();
  const arrow_eq = (a: HTerm, b: HTerm): boolean => B.term_compare("EQ", S, a, b, 0);
  const arrow_s = (A: HTerm): string => B.term_show(B.term_lower(A, 0));
  const fam = (k: Name): Name | null => B.book_ctr(T, k) === null ? null : B.book_fam(T, k);
  // a datatype D stands for one class, and a class for one datatype (C)
  const class_of = (D: Name, arrow: HTerm, w: string): boolean => {
    const got = class_arrow.get(D);
    if (got !== undefined) {
      return arrow_eq(got, arrow) || no("C", D + " stands for two classes (" + arrow_s(got) + ", " + arrow_s(arrow) + ") at " + w);
    }
    for (const [D2, a2] of class_arrow) {
      if (arrow_eq(a2, arrow)) {
        return no("C", "the class " + arrow_s(arrow) + " has two datatypes, " + D2 + " and " + D + " (at " + w + ")");
      }
    }
    if (sk.includes(D)) {
      return no("C", D + " is a source item, not a generated datatype (at " + w + ")");
    }
    class_arrow.set(D, arrow);
    return true;
  };
  const arrow_of = (t: HTerm | null): Extract<HTerm, { $: "All" }> | null => {
    if (t === null) {
      return null;
    }
    const w = B.term_wnf(S, t);
    return w.$ === "All" && w.c === true ? w : null;
  };
  const bind = (env: Env, sl: number, tl: number, T0: HTerm | null): Env => {
    const m = env.m.slice();
    const cs = env.cs.slice();
    m[sl] = tl;
    cs[sl] = T0;
    return { m, cs };
  };
  // is s (stripped, checked at sty) an R6 lift in S?
  const is_lift = (s0: LTerm, sty: HTerm | null): boolean => {
    if (arrow_of(sty) === null) {
      return false;
    }
    const [h, xs] = unapp(s0);
    const tld = h.$ === "Ref" ? S.tlds[h.k] : undefined;
    if (tld === undefined || tld.$ !== "Def") {
      return false;
    }
    let tl: HTerm = tld.T;
    for (const x of xs) {
      const t = B.tele_open(S, tl);
      if (t === null) {
        return false;
      }
      tl = t.B(B.term_higher(x));
    }
    const nxt = B.tele_open(S, tl);
    return nxt !== null && nxt.c !== true;
  };

  // L: s (S) and t (T) walked together
  const eq = (s: LTerm, t: LTerm, env: Env, w: string, ty = false): boolean => {
    const sty = ty ? null : ann_type(s);
    const s0 = ty ? s : strip_ann(s);
    const t0 = ty ? t : strip_ann(t);
    // L1: a lambda site
    if (s0.$ === "Lam" && s0.c === true) {
      const arrow = arrow_of(sty);
      if (arrow === null) {
        return no("L1", "a lambda with no *-> type at " + w);
      }
      if (t0.$ !== "Ctr") {
        return no("L1", "the lambda " + spell(s0) + " in " + w + " does not stand as a constructor");
      }
      const D = fam(t0.k);
      if (D === null || !class_of(D, arrow, w)) {
        return D === null ? no("L1", t0.k + " is no constructor (at " + w + ")") : false;
      }
      const caps = free_below(s0.f, s0.i);
      if (t0.x.length !== caps.length) {
        return no("L1", t0.k + " takes " + String(t0.x.length) + " fields at " + w + ", the lambda " + spell(s0)
          + " captures " + String(caps.length));
      }
      for (let j = 0; j < caps.length; j++) {
        const a = strip_ann(t0.x[j]);
        if (a.$ !== "Var" || env.m[caps[j]] !== a.i) {
          return no("L1", "field " + String(j) + " of " + t0.k + " at " + w + " is not the capture " + String(j)
            + " of the lambda " + spell(s0) + " (captures go in binding order)");
        }
      }
      if (ctor_site.has(t0.k)) {
        return no("C", "two sites share the constructor " + t0.k + " (" + (ctor_site.get(t0.k) as SiteRec).where + " and "
          + spell(s0) + " in " + w + ")");
      }
      const capT = caps.map((i) => env.cs[i] ?? null);
      if (capT.some((x) => x === null)) {
        return no("L1", "a capture of " + spell(s0) + " has no known type");
      }
      const rec: SiteRec = { kind: "lam", where: spell(s0) + " in " + w, ctor: t0.k, D, arrow, lam: s0, caps, capT: capT as HTerm[] };
      ctor_site.set(t0.k, rec);
      sites.push(rec);
      return true;
    }
    // L1: a lift
    if (!ty && is_lift(s0, sty)) {
      const arrow = arrow_of(sty) as HTerm;
      const [h, xs] = unapp(s0);
      if (t0.$ !== "Ctr" || t0.x.length !== xs.length) {
        return no("L1", "the use of " + B.term_show(h) + " as a closure in " + w + " does not stand as a constructor of its arguments");
      }
      const D = fam(t0.k);
      if (D === null || !class_of(D, arrow, w)) {
        return D === null ? no("L1", t0.k + " is no constructor (at " + w + ")") : false;
      }
      for (let j = 0; j < xs.length; j++) {
        if (!eq(xs[j], t0.x[j], env, w)) {
          return false;
        }
      }
      if (ctor_site.has(t0.k)) {
        return no("C", "two sites share the constructor " + t0.k + " (at " + w + ")");
      }
      const tld = S.tlds[(h as Extract<LTerm, { $: "Ref" }>).k] as Def;
      const argT: HTerm[] = [];
      let tl: HTerm = tld.T;
      for (const x of xs) {
        const tt = B.tele_open(S, tl) as Extract<HTerm, { $: "All" }>;
        argT.push(tt.A);
        tl = tt.B(B.term_higher(x));
      }
      const rec: SiteRec = { kind: "lift", where: "the use of " + B.name_key((h as Extract<LTerm, { $: "Ref" }>).k) + " in " + w,
        ctor: t0.k, D, arrow, tgt: (h as Extract<LTerm, { $: "Ref" }>).k, argT };
      ctor_site.set(t0.k, rec);
      sites.push(rec);
      return true;
    }
    // L2: a closure call
    if (!ty && s0.$ === "App" && arrow_of(ann_type(s0.f)) !== null) {
      const arrow = arrow_of(ann_type(s0.f)) as HTerm;
      const t1 = t0.$ === "App" ? strip_ann(t0.f) : null;
      const p = t1 !== null && t1.$ === "App" ? strip_ann(t1.f) : null;
      if (t0.$ !== "App" || t1 === null || t1.$ !== "App" || p === null || p.$ !== "Ref") {
        return no("L2", "a closure call in " + w + " does not go through an apply");
      }
      const got = apply_arrow.get(p.k);
      if (got !== undefined && !arrow_eq(got, arrow)) {
        return no("A", p.k + " applies two classes (" + arrow_s(got) + ", " + arrow_s(arrow) + ")");
      }
      for (const [p2, a2] of apply_arrow) {
        if (p2 !== p.k && arrow_eq(a2, arrow)) {
          return no("A", "the class " + arrow_s(arrow) + " has two applies, " + p2 + " and " + p.k);
        }
      }
      if (sk.includes(p.k)) {
        return no("A", p.k + " is a source item, not a generated apply");
      }
      apply_arrow.set(p.k, arrow);
      return eq(s0.f, t1.x, env, w) && eq(s0.x, t0.x, env, w);
    }
    // L3: a type A *-> B
    if (s0.$ === "All" && s0.c === true) {
      const D = t0.$ === "ADT" && t0.x.length === 0 ? t0.k : t0.$ === "Ref" ? t0.k : null;
      if (D === null) {
        return no("L3", "the type " + spell(s0) + " in " + w + " does not stand as a class datatype");
      }
      return class_of(D, B.term_higher(s0), w);
    }
    // L5
    if (s0.$ !== t0.$) {
      return no("L5", "a " + s0.$ + " of the source stands as a " + t0.$ + " in " + w);
    }
    const t1 = t0 as Record<string, unknown>;
    const same = (k: string): boolean => JSON.stringify((s0 as Record<string, unknown>)[k]) === JSON.stringify(t1[k])
      || no("L5", "the " + s0.$ + "'s " + k + " differs in " + w + " (" + JSON.stringify((s0 as Record<string, unknown>)[k])
        + " vs " + JSON.stringify(t1[k]) + ")");
    switch (s0.$) {
      case "Var": {
        const t2 = t0 as Extract<LTerm, { $: "Var" }>;
        return (s0.i >= 0 && env.m[s0.i] === t2.i) || no("L5", "the variable " + s0.k + " in " + w + " points to another binder");
      }
      case "Ref":
      case "Hol": {
        return same("k");
      }
      case "Let": {
        const t2 = t0 as Extract<LTerm, { $: "Let" }>;
        if (s0.k.length !== t2.k.length) {
          return no("L5", "a let binds " + String(s0.k.length) + " names in the source, " + String(t2.k.length) + " in " + w);
        }
        let e2 = env;
        for (let j = 0; j < s0.k.length; j++) {
          const vt = ann_type(s0.v[j]);
          const ok = s0.q[j].$ === t2.q[j].$ || (arrow_of(vt) !== null && t2.q[j].$ === "Many");
          if (!ok) {
            return no("L4", "the let " + s0.k[j] + " in " + w + " changed quantity");
          }
          if (!eq(s0.v[j], t2.v[j], env, w)) {
            return false;
          }
          e2 = bind(e2, s0.i[j], t2.i[j], vt);
        }
        return eq(s0.f, t2.f, e2, w);
      }
      case "Lam": {
        const t2 = t0 as Extract<LTerm, { $: "Lam" }>;
        if (t2.c === true) {
          return no("L5", "an affine lambda became callable-many in " + w);
        }
        const all = sty === null ? null : B.term_wnf(S, sty);
        return eq(s0.f, t2.f, bind(env, s0.i, t2.i, all !== null && all.$ === "All" ? all.A : null), w, ty);
      }
      case "All": {
        const t2 = t0 as Extract<LTerm, { $: "All" }>;
        const sA = s0.A;
        const many = sA.$ === "All" && sA.c === true;
        const qok = s0.q.$ === t2.q.$ || (many && t2.q.$ === "Many" && s0.q.$ !== "None");
        if (!qok || (s0.l === true) !== (t2.l === true) && !(many && s0.l === true && t2.l !== true)) {
          return no("L4", "the binder " + s0.k + " in " + w + " changed quantity or borrowing");
        }
        if (t2.c === true) {
          return no("L3", "a *-> type is left in " + w);
        }
        return eq(s0.A, t2.A, env, w, ty) && eq(s0.B, t2.B, bind(env, s0.i, t2.i, null), w, ty);
      }
      case "App": {
        const t2 = t0 as Extract<LTerm, { $: "App" }>;
        return eq(s0.f, t2.f, env, w, ty) && eq(s0.x, t2.x, env, w, ty);
      }
      case "ADT": {
        const t2 = t0 as Extract<LTerm, { $: "ADT" }>;
        return same("k") && same("r") && s0.x.length === t2.x.length && s0.x.every((x, j) => eq(x, t2.x[j], env, w, ty));
      }
      case "Ctr": {
        const t2 = t0 as Extract<LTerm, { $: "Ctr" }>;
        return same("k") && (s0.x.length === t2.x.length || no("L5", "a constructor changed arity in " + w))
          && s0.x.every((x, j) => eq(x, t2.x[j], env, w, ty));
      }
      case "Lit": {
        return same("k") && same("v");
      }
      case "Mat": {
        const t2 = t0 as Extract<LTerm, { $: "Mat" }>;
        return same("k") && eq(s0.h, t2.h, env, w, ty) && eq(s0.m, t2.m, env, w, ty);
      }
      case "Efq":
      case "Rfl":
      case "Qnt": {
        return true;
      }
      case "Typ": {
        return eq(s0.g, (t0 as Extract<LTerm, { $: "Typ" }>).g, env, w, ty);
      }
      case "Qua": {
        return s0.q.$ === (t0 as Extract<LTerm, { $: "Qua" }>).q.$ || no("L5", "a quantity changed in " + w);
      }
      case "Min": {
        const t2 = t0 as Extract<LTerm, { $: "Min" }>;
        return eq(s0.a, t2.a, env, w, ty) && eq(s0.b, t2.b, env, w, ty);
      }
      case "Eql": {
        const t2 = t0 as Extract<LTerm, { $: "Eql" }>;
        return eq(s0.a, t2.a, env, w, ty) && eq(s0.b, t2.b, env, w, ty) && eq(s0.T, t2.T, env, w, ty);
      }
      case "Rwt": {
        const t2 = t0 as Extract<LTerm, { $: "Rwt" }>;
        return eq(s0.e, t2.e, env, w, ty) && eq(s0.p, t2.p, env, w, ty) && eq(s0.f, t2.f, env, w, ty);
      }
      case "Ann": {
        const t2 = t0 as Extract<LTerm, { $: "Ann" }>;
        return eq(s0.x, t2.x, env, w, ty) && eq(s0.T, t2.T, env, w, true);
      }
      case "Sub": {
        const t2 = t0 as Extract<LTerm, { $: "Sub" }>;
        return JSON.stringify(s0.v, (k, v) => k === "s" ? undefined : v) === JSON.stringify(t2.v, (k, v) => k === "s" ? undefined : v)
          && eq(s0.f, t2.f, bind(env, s0.i, t2.i, null), w, ty);
      }
      default: {
        return no("L5", "an unknown form " + (s0 as { $: string }).$ + " in " + w + " (fail closed)");
      }
    }
  };
  const empty: Env = { m: [], cs: [] };
  // a type of S (HTerm, closed) against a type of T (LTerm), as rule L3
  // (structurally, else up to bend2's conversion in T: a family index
  // the translation printed normalized)
  const ty_eq = (sT: HTerm, tT: LTerm, w: string): boolean => {
    const saved = sink;
    const tmp: string[] = [];
    sink = tmp;
    const ok = eq(B.term_lower(sT, 0), tT, empty, w, true);
    sink = saved;
    if (ok) {
      return true;
    }
    try {
      if (B.term_compare("EQ", T, B.term_higher(B.term_lower(sT, 0)), B.term_higher(tT), 0)) {
        return true;
      }
    } catch (e) {
      tmp.push("L3: " + w + ": the types do not compare (" + String(e) + ")");
    }
    bad.push(...tmp);
    return false;
  };

  // L over every source item
  for (const k of sk) {
    const s = S.tlds[k];
    const t = T.tlds[k];
    if (t === undefined) {
      continue;
    }
    const w = B.name_key(k);
    if (s.$ !== t.$) {
      no("I", w + " changed kind");
      continue;
    }
    if (s.$ === "ADT") {
      const t2 = t as typeof s;
      if (s.n !== t2.n || s.g !== t2.g || s.c.length !== t2.c.length) {
        no("L5", "the datatype " + w + " changed shape");
        continue;
      }
      eq(B.term_lower(s.T), B.term_lower(t2.T), empty, w, true);
      s.c.forEach((c, j) => {
        if (c.k !== t2.c[j].k || c.n !== t2.c[j].n) {
          no("L5", "the constructor " + c.k + " of " + w + " changed");
        } else {
          eq(B.term_lower(c.T), B.term_lower(t2.c[j].T), empty, w + "." + c.k, true);
        }
      });
      continue;
    }
    const t2 = t as Def;
    if (s.n !== t2.n || s.x !== t2.x || (s.l === true) !== (t2.l === true) || (s.u === true) !== (t2.u === true)
      || (s.v === null) !== (t2.v === null) || (s.e === undefined) !== (t2.e === undefined)) {
      no("L5", "the def " + w + " changed shape");
      continue;
    }
    eq(B.term_lower(s.T), B.term_lower(t2.T), empty, w + " (its type)", true);
    if (s.e !== undefined && t2.e !== undefined) {
      eq(s.e, t2.e, empty, w);
    }
  }

  // C, R, A: the generated items, from the sites and calls met
  const runs = new Map<Name, SiteRec>();
  const applies = new Map<Name, Name>();
  for (const [P, arrow] of apply_arrow) {
    for (const [D, a2] of class_arrow) {
      if (arrow_eq(arrow, a2)) {
        applies.set(D, P);
      }
    }
  }
  const checked_apply = new Set<Name>();
  const check_class = (D: Name, P: Name, arrow0: HTerm): void => {
    const arrow = B.term_wnf(S, arrow0) as Extract<HTerm, { $: "All" }>;
    const d = T.tlds[D];
    if (d === undefined || d.$ !== "ADT") {
      no("C", D + " is not a datatype of the translation");
      return;
    }
    const kind = B.term_lower(d.T);
    if (d.n !== 0 || kind.$ !== "Typ" || kind.g.$ !== "Qua" || kind.g.q.$ !== "Many") {
      no("C", D + " is not a Data datatype without parameters");
    }
    for (const c of d.c) {
      if (!ctor_site.has(c.k)) {
        no("C", "the constructor " + c.k + " of " + D + " is met at no site");
      }
    }
    for (const [K, r] of ctor_site) {
      if (r.D === D && !d.c.some((c) => c.k === K)) {
        no("C", K + " is not a constructor of " + D);
      }
    }
    // A: the apply's type and arms
    const p = T.tlds[P];
    if (p === undefined || p.$ !== "Def" || p.e === undefined || p.n !== 2) {
      no("A", P + " is not a two-parameter def of the translation");
      return;
    }
    const pt = B.term_lower(p.T);
    if (pt.$ !== "All" || pt.B.$ !== "All" || !((pt.A.$ === "ADT" && pt.A.k === D && pt.A.x.length === 0) || (pt.A.$ === "Ref" && pt.A.k === D))) {
      no("A", P + " does not take " + D + " first: its type is " + B.term_show(pt));
      return;
    }
    if (pt.B.q.$ !== arrow.q.$) {
      no("A", P + "'s argument changed quantity");
    }
    ty_eq(arrow.A, pt.B.A, P + " (its argument type)");
    ty_eq(arrow.B(B.Var("_", 1)), pt.B.B, P + " (its result type)");
    let m: LTerm = strip_ann(p.e);
    for (const c of d.c) {
      if (m.$ !== "Mat" || m.k !== c.k) {
        no("A", P + " does not match " + c.k + " next (one arm per constructor, in order)");
        return;
      }
      check_arm(P, c.k, c.n, m.h, ctor_site.get(c.k), arrow);
      m = strip_ann(m.m);
    }
    if (m.$ !== "Efq") {
      no("A", P + " has an arm past the constructors of " + D);
    }
  };
  // R: an apply arm calls the site's body def with the fields, then x;
  // the body def holds the site's body
  const check_arm = (P: Name, K: Name, n: number, h: LTerm, r: SiteRec | undefined, arrow: Extract<HTerm, { $: "All" }>): void => {
    let cur = strip_ann(h);
    const lv: number[] = [];
    for (let j = 0; j <= n; j++) {
      if (cur.$ !== "Lam") {
        no("A", "the arm " + K + " of " + P + " does not bind its fields and argument");
        return;
      }
      lv.push(cur.i);
      cur = strip_ann(cur.f);
    }
    const [hd, xs] = unapp(cur);
    if (hd.$ !== "Ref" || xs.length !== n + 1 || xs.some((x, j) => {
      const v = strip_ann(x);
      return v.$ !== "Var" || v.i !== lv[j];
    })) {
      no("R", "the arm " + K + " of " + P + " does not call one def with its fields in order and then the argument");
      return;
    }
    if (r === undefined) {
      return;
    }
    const R = hd.k;
    if (runs.has(R)) {
      no("R", R + " is the body def of two constructors");
      return;
    }
    runs.set(R, r);
    const rd = T.tlds[R];
    if (rd === undefined || rd.$ !== "Def" || rd.e === undefined || rd.n !== n + 1 || sk.includes(R)) {
      no("R", R + " is not a generated def of " + String(n + 1) + " parameters");
      return;
    }
    // its type: the fields' types, then A, to B
    let rt = B.term_lower(rd.T);
    const fts = r.kind === "lam" ? r.capT as HTerm[] : r.argT as HTerm[];
    if (fts.length !== n) {
      no("R", K + " has " + String(n) + " fields, its site " + String(fts.length) + " captures or arguments");
      return;
    }
    const dctor = (T.tlds[r.D] as Extract<typeof T.tlds[string], { $: "ADT" }>).c.find((c) => c.k === K);
    let ct: LTerm | null = dctor === undefined ? null : B.term_lower(dctor.T);
    for (let j = 0; j < n; j++) {
      if (rt.$ !== "All" || ct === null || ct.$ !== "All") {
        no("R", R + " or " + K + " has too few parameters");
        return;
      }
      ty_eq(fts[j], rt.A, R + " (parameter " + String(j) + ")");
      ty_eq(fts[j], ct.A, K + " (field " + String(j) + ")");
      rt = rt.B;
      ct = ct.B;
    }
    if (rt.$ !== "All") {
      no("R", R + " has too few parameters");
      return;
    }
    ty_eq(arrow.A, rt.A, R + " (its argument type)");
    ty_eq(arrow.B(B.Var("_", n + 1)), rt.B, R + " (its result type)");
    // its term
    let body: LTerm = strip_ann(rd.e);
    const tl: number[] = [];
    for (let j = 0; j <= n; j++) {
      if (body.$ !== "Lam") {
        no("R", R + " does not bind its parameters");
        return;
      }
      tl.push(body.i);
      body = strip_ann(body.f);
    }
    if (r.kind === "lift") {
      const [bh, bx] = unapp(body);
      if (bh.$ !== "Ref" || bh.k !== r.tgt || bx.length !== n + 1 || bx.some((x, j) => {
        const v = strip_ann(x);
        return v.$ !== "Var" || v.i !== tl[j];
      })) {
        no("R", R + " does not apply " + B.name_key(r.tgt as string) + " to its parameters in order");
      }
      return;
    }
    const lam = r.lam as Extract<LTerm, { $: "Lam" }>;
    let env: Env = empty;
    (r.caps as number[]).forEach((c, j) => {
      env = bind(env, c, tl[j], (r.capT as HTerm[])[j]);
    });
    env = bind(env, lam.i, tl[n], arrow.A);
    eq(lam.f, body, env, R + " (the body of " + r.where + ")");
  };
  // to a fixpoint: a body def's comparison may meet further sites
  for (let round = 0; round < 64; round++) {
    let more = false;
    for (const P of [...apply_arrow.keys()]) {
      if (checked_apply.has(P)) {
        continue;
      }
      more = true;
      checked_apply.add(P);
      let D: Name | undefined;
      for (const [D2, a2] of class_arrow) {
        if (arrow_eq(a2, apply_arrow.get(P) as HTerm)) {
          D = D2;
        }
      }
      if (D === undefined) {
        const pt = T.tlds[P];
        const lo = pt?.$ === "Def" ? B.term_lower(pt.T) : null;
        const d0 = lo !== null && lo.$ === "All" ? lo.A : null;
        D = d0 !== null && d0.$ === "ADT" ? d0.k : d0 !== null && d0.$ === "Ref" ? d0.k : undefined;
        if (D === undefined || !class_of(D, apply_arrow.get(P) as HTerm, P)) {
          no("A", P + " does not take a class datatype first");
          continue;
        }
      }
      applies.set(D, P);
    }
    for (const [D, arrow] of [...class_arrow]) {
      const P = applies.get(D);
      if (checked_apply.has("#" + D)) {
        continue;
      }
      if (P === undefined) {
        // a class built but never called: its apply is found by name
        const cand = tk.filter((k) => {
          const t = T.tlds[k];
          if (t.$ !== "Def" || sk.includes(k)) {
            return false;
          }
          const lo = B.term_lower(t.T);
          return lo.$ === "All" && ((lo.A.$ === "ADT" && lo.A.k === D) || (lo.A.$ === "Ref" && lo.A.k === D)) && t.n === 2
            && t.e !== undefined && strip_ann(t.e).$ !== "Lam";
        });
        if (cand.length !== 1) {
          no("A", "the class datatype " + D + " has " + String(cand.length) + " applies");
          checked_apply.add("#" + D);
          continue;
        }
        applies.set(D, cand[0]);
        checked_apply.add(cand[0]);
      }
      more = true;
      checked_apply.add("#" + D);
      check_class(D, applies.get(D) as Name, arrow);
    }
    if (!more) {
      break;
    }
  }
  for (const r of sites) {
    if (![...runs.values()].includes(r)) {
      no("R", "the site " + r.where + " (" + r.ctor + ") reaches no body def through an apply");
    }
  }

  // I: every item of the translation is accounted for
  const gen = new Set<string>([...class_arrow.keys(), ...applies.values(), ...runs.keys()]);
  for (const k of tk) {
    if (!sk.includes(k) && !gen.has(k)) {
      no("I", "the item " + B.name_key(k) + " of the translation is no source item and no generated item");
    }
  }

  // G: no call cycle but a def's call to itself
  const calls = new Map<string, Set<string>>();
  for (const k of tk) {
    const t = T.tlds[k];
    if (t.$ === "Def" && t.e !== undefined) {
      calls.set(k, new Set([...names_of(t.e)].filter((n) => n !== k && T.tlds[n]?.$ === "Def" && tset.has(n))));
    }
  }
  const state = new Map<string, number>();
  const visit = (n: string, path: string[]): string[] | null => {
    state.set(n, 1);
    for (const m of calls.get(n) ?? []) {
      if (state.get(m) === 1) {
        return [...path.slice(path.indexOf(m)), n, m];
      }
      if (!state.has(m)) {
        const got = visit(m, [...path, n]);
        if (got !== null) {
          return got;
        }
      }
    }
    state.set(n, 2);
    return null;
  };
  for (const k of calls.keys()) {
    if (!state.has(k)) {
      const cyc = visit(k, []);
      if (cyc !== null) {
        no("G", "a call cycle: " + cyc.join(" -> "));
        break;
      }
    }
  }

  // K: the BendTT text
  const kd = new Map<string, KDef>();
  for (const d of kernel_parse(ktext)) {
    if (kd.has(d.k)) {
      no("K", "two kernel defs named " + d.k);
    }
    kd.set(d.k, d);
  }
  // K1, exact: the kernel defs of T's own items are exactly their names
  // (a datatype D: D, D.arms, and D.efq when it has no constructor);
  // every other kernel def comes from Base: its name is a Base item's,
  // or one with a suffix (.arms, .lit2, _1, ..), and no own item's name
  // is a longer prefix of it
  const tt = (k: string): string => B.name_key(k).replace(/[^A-Za-z0-9_.]|^[.0-9]/g,
    (c) => "_" + (c.codePointAt(0) ?? 0).toString(16) + "_");
  const want = new Map<string, string>();
  for (const k of tk) {
    const t = T.tlds[k];
    const n = tt(k);
    for (const m of t.$ === "ADT" ? [n, n + ".arms", ...(t.c.length === 0 ? [n + ".efq"] : [])] : [n]) {
      want.set(m, k);
    }
  }
  for (const [n, k] of want) {
    if (!kd.has(n)) {
      no("K1", "the kernel text has no def " + n + " (for " + B.name_key(k) + ")");
    }
  }
  const owns = [...new Set(tk.map(tt))];
  const bases = Object.keys(T.tlds).filter((k) => T.tlds[k].b === true).map(tt);
  const pre = (n: string, k: string): boolean => n === k || n.startsWith(k + ".") || /^_\d+$/.test(n.slice(k.length)) && n.startsWith(k);
  for (const n of kd.keys()) {
    if (want.has(n)) {
      continue;
    }
    const o = owns.filter((k) => pre(n, k, false)).sort((a, b) => b.length - a.length)[0];
    const b = bases.filter((k) => pre(n, k, true)).sort((a, b) => b.length - a.length)[0];
    if (b === undefined || (o !== undefined && o.length >= b.length)) {
      no("K1", "the kernel def " + n + " is no item of the translation" + (o === undefined ? "" : " (beside " + o + ")"));
    }
  }
  const nfields = new Map<string, number>();
  for (const D of class_arrow.keys()) {
    const d = T.tlds[D];
    if (d?.$ !== "ADT") {
      continue;
    }
    for (const c of d.c) {
      nfields.set(c.k, c.n);
    }
    // K2
    const arms = kd.get(D + ".arms");
    const top = kd.get(D);
    if (arms === undefined || top === undefined) {
      continue;
    }
    let m = arms.v;
    for (const c of d.c) {
      if (m.$ !== "Mat" || m.k !== c.k) {
        no("K2", D + ".arms does not switch on " + c.k + " next");
        break;
      }
      let sg = m.h;
      let n = 0;
      const fts: KT[] = [];
      while (sg.$ === "Sig") {
        n++;
        fts.push(sg.A);
        sg = sg.B;
      }
      // K2: each field's kernel type is the body def's parameter type
      const R = [...runs.entries()].find(([, r]) => r.ctor === c.k)?.[0];
      let rt: KT | undefined = R === undefined ? undefined : kd.get(R)?.T;
      for (let j = 0; j < fts.length; j++) {
        if (rt === undefined || rt.$ !== "All" || !k_eq(rt.A, fts[j])) {
          no("K2", D + ".arms gives " + c.k + "'s field " + String(j) + " a type its body def " + String(R)
            + " does not take there");
          break;
        }
        rt = rt.B;
      }
      if (n !== c.n || sg.$ !== "Enu" || sg.ks.join(",") !== "()") {
        no("K2", D + ".arms gives " + c.k + " " + String(n) + " fields, not " + String(c.n));
      }
      m = m.m;
    }
    if (m.$ !== "Efq") {
      no("K2", D + ".arms has a label past " + D + "'s constructors");
    }
    if (top.v.$ !== "Sig" || top.v.A.$ !== "Enu" || top.v.A.ks.join(",") !== d.c.map((c) => c.k).join(",")) {
      no("K2", D + " is not the Σ over the labels of its constructors");
    }
    // K3, K4
    const P = applies.get(D);
    const pk = P === undefined ? undefined : kd.get(P);
    if (P === undefined || pk === undefined) {
      continue;
    }
    if (pk.T.$ !== "All" || pk.T.A.$ !== "Ref" || pk.T.A.k !== D || pk.T.B.$ !== "All") {
      no("K3", "the kernel type of " + P + " does not take " + D + " first");
      continue;
    }
    const kA = pk.T.B.A;
    const kB = pk.T.B.B;
    let pm = pk.v;
    if (pm.$ !== "Prj") {
      no("K4", "the kernel term of " + P + " does not split its closure's tag");
      continue;
    }
    pm = pm.h;
    for (const c of d.c) {
      if (pm.$ !== "Mat" || pm.k !== c.k) {
        no("K4", "the kernel term of " + P + " does not match " + c.k + " next");
        break;
      }
      let arm = pm.h;
      for (let j = 0; j < c.n; j++) {
        if (arm.$ !== "Prj" || arm.h.$ !== "Lam") {
          no("K4", "the kernel arm " + c.k + " of " + P + " does not split field " + String(j));
          arm = { $: "Efq" };
          break;
        }
        arm = arm.h.f;
      }
      if (arm.$ !== "Mat" || arm.k !== "()" || arm.h.$ !== "Lam") {
        no("K4", "the kernel arm " + c.k + " of " + P + " does not end its fields and bind the argument");
        pm = pm.m;
        continue;
      }
      // the call, η-long: extra binders y after x, passed last
      let call = arm.h.f;
      let m = 0;
      while (call.$ === "Lam") {
        call = call.f;
        m++;
      }
      const [hd, xs] = k_unapp(call);
      const idx = (j: number): number => j <= c.n ? c.n - j + m : m - 1 - (j - c.n - 1);
      const ok = hd.$ === "Ref" && xs.length === c.n + 1 + m && xs.every((x, j) => k_eta_var(x, idx(j)));
      if (!ok) {
        no("K4", "the kernel arm " + c.k + " of " + P + " does not call one def with the fields in order, then the argument");
      } else {
        const R = (hd as { k: string }).k;
        if (runs.get(R)?.ctor !== c.k) {
          no("K4", "the kernel arm " + c.k + " of " + P + " calls " + R + ", not the body def of " + c.k);
        }
        const rk = kd.get(R);
        let rt: KT | undefined = rk?.T;
        for (let j = 0; j < c.n && rt !== undefined; j++) {
          rt = rt.$ === "All" ? rt.B : undefined;
        }
        if (rt === undefined || rt.$ !== "All" || !k_eq(rt.A, kA) || !k_eq(rt.B, kB)) {
          no("K3", "the kernel type of " + P + " does not end as the kernel type of " + R);
        }
      }
      pm = pm.m;
    }
    if (pm.$ !== "Efq") {
      no("K4", "the kernel term of " + P + " has an arm past " + D + "'s constructors");
    }
  }
  // K5, K6
  const gnames = new Set<string>([...applies.values(), ...runs.keys()]);
  for (const k of tk) {
    const t = T.tlds[k];
    const kdef = kd.get(k);
    if (t.$ !== "Def" || kdef === undefined) {
      continue;
    }
    const kn = new Set<string>();
    k_walk(kdef.v, (x) => {
      if (x.$ === "Tup" && x.a.$ === "Lab" && nfields.has(x.a.k)) {
        let n = 0;
        let b = x.b;
        while (b.$ === "Tup") {
          n++;
          b = b.b;
        }
        if (n !== nfields.get(x.a.k) || b.$ !== "Lab" || b.k !== "()") {
          no("K5", "a kernel " + x.a.k + " tuple in " + k + " has " + String(n) + " fields, not " + String(nfields.get(x.a.k)));
        }
        // K5: a lambda site's fields are its captures: distinct variables
        if (ctor_site.get(x.a.k)?.kind === "lam") {
          const vs: number[] = [];
          for (let f = x.b; f.$ === "Tup"; f = f.b) {
            vs.push(f.a.$ === "Var" ? f.a.i : -1);
          }
          if (vs.some((v, j) => v < 0 || vs.indexOf(v) !== j)) {
            no("K5", "a kernel " + x.a.k + " tuple in " + k + " does not hold distinct variables (its captures)");
          }
        }
        kn.add("." + x.a.k);
      }
      if (x.$ === "Ref" && gnames.has(x.k)) {
        kn.add(x.k);
      }
    });
    const tn = new Set<string>();
    const go = (x: unknown): void => {
      if (x === null || typeof x !== "object") {
        return;
      }
      const o = x as Record<string, unknown>;
      if (o.$ === "Ctr" && typeof o.k === "string" && nfields.has(o.k)) {
        tn.add("." + o.k);
      }
      if (o.$ === "Ref" && typeof o.k === "string" && gnames.has(o.k)) {
        tn.add(o.k);
      }
      for (const kk in o) {
        if (kk !== "s" && !(kk === "v" && o.$ === "Var") && kk !== "T") {
          go(o[kk]);
        }
      }
      if (o.$ !== "Ann" && o.T !== undefined) {
        go(o.T);
      }
    };
    if (t.e !== undefined) {
      go(t.e);
    }
    const a = [...kn].sort().join(" ");
    const b = [...tn].sort().join(" ");
    if (a !== b) {
      no("K6", "the kernel term of " + k + " names {" + a + "}, its checked term {" + b + "}");
    }
  }
}
