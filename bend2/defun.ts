// Defun
// =====
// C006 phase 1 (SPEC 7.3: T1, T2, T5, T9 phase 1; this fork only): the
// defunctionalization that lets --verdict and -o x.bendtt take a book with
// callable-many closures. The kernel has no such closure; the translation
// rewrites the program into one it already checks:
//   - each class A *-> B (an arrow type, closed) becomes a Data datatype
//     Clo_A_B with one constructor per site: each *x => lambda, and each
//     def used at A *-> B bare or partially applied (R6), never shared
//     between sites; a constructor's fields are the site's captures in
//     binding order (a lift: its arguments);
//   - each site gets a body def <site>_run(captures.., x) holding the
//     lambda's body (a lift: the def applied to its arguments and x);
//   - each class gets one apply_A_B(c, x) that matches c and calls the
//     site's body def (V0: one apply per type, stratum 0);
//   - a closure call h(x) becomes apply_A_B(h, x), a type A *-> B becomes
//     Clo_A_B, and a binder of a *-> type (a def parameter, borrowed (&)
//     ones included (T5), or a let) becomes + (the closure is Data now).
// The rewrite is textual: it edits the source text at the spans bend2's
// parser recorded (a lambda's extent is found by running bend2's own
// parser from its *), so everything else (matches, do blocks, comments)
// goes out as written. The result is a Bend program for upstream Bend:
// bend2 checks it again, safe.ts elaborates it to BendTT, the validator
// (defun_check.ts) checks the correspondence, and the kernel checks it.
// Refused, with a message (fail closed): a book a law or proof of which
// touches *-> (T1, defun_check.policy); a book whose generated call graph
// has a cycle other than a def calling itself (T9 phase 1), named in
// source terms; and, in phase 1, closures in a file that imports more
// than Base, a *-> field in a datatype, a *-> value bound other than by a
// def parameter or a let, an erased or non-closed capture, a class whose
// type is not closed, and a template (~) def that holds a closure.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import * as B from "./bend.ts";
import type { Book, Def, HTerm, LTerm, Name, Quant, File, Span } from "./bend.ts";
import * as Check from "./defun_check.ts";

// a refusal of phase 1: why the book cannot be translated
export class Refusal {
  constructor(readonly why: string) {}
}

function refuse(why: string): never {
  throw new Refusal(why);
}

// injected translator bugs, for the validator's mutation tests only
export type Mutation = "swap_captures" | "drop_capture" | "share_ctor"
  | "wrong_site" | "change_body" | "wrong_apply_sig" | "omit_def";

// Types
// =====

// a closure class: an arrow A *-> B, its texts, and what it becomes
type Class = { key: string; A: string; B: string; q: Quant; name: Name; apply: Name; sites: Site[] };

// a binder in scope while walking a checked def
type Bind = { k: Name; q: Quant; T: HTerm | null };

// a capture: a binder below a lambda that its body names
type Cap = { k: Name; i: number; q: Quant; T: string };

// a site: a *x => lambda or a lifted def (R6)
type Site = {
  kind: "lam" | "lift"; def: Name; line: number; col: number; cls: Class;
  ctor: Name; run: Name; owner: string;
  // a lambda: its binder, captures, extent and body's extent
  x?: Name; xq?: Quant; caps?: Cap[]; beg: number; end: number; body?: [number, number];
  // a lift: the def, its argument extents and their field types
  tgt?: Name; args?: Array<[number, number]>; fts?: string[];
  text?: string;
};

// a text edit: [beg, end) replaced by render(holes rendered); a child
// edit lies inside one hole
type Edit = { beg: number; end: number; holes: Array<[number, number]>; render: (hs: string[]) => string };

// a top-level item of the source text
type Item = { key: Name; kind: "def" | "law" | "type"; beg: number; end: number; idx: number };

// a generated item
type Gen = { name: Name; text: string; deps: Set<string> };

// Text
// ====

const NAME = /[A-Za-z0-9_.]/;

// the first index at or after i that is not blank or in a comment
function skip_ws(s: string, i: number, nl = true): number {
  while (i < s.length) {
    if (s[i] === "#") {
      while (i < s.length && s[i] !== "\n") {
        i++;
      }
    } else if (s[i] === " " || s[i] === "\t" || s[i] === "\r" || (nl && s[i] === "\n")) {
      i++;
    } else {
      break;
    }
  }
  return i;
}

// the index after a string or char literal starting at i
function skip_lit(s: string, i: number): number {
  const q = s[i];
  i++;
  while (i < s.length && s[i] !== q) {
    i += s[i] === "\\" ? 2 : 1;
  }
  return i + 1;
}

// the index after the bracket group opening at i
function close_of(s: string, i: number): number {
  const open = "([{";
  const shut = ")]}";
  const stk: string[] = [];
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "\"" || c === "'") {
      j = skip_lit(s, j) - 1;
    } else if (c === "#") {
      while (j < s.length && s[j] !== "\n") {
        j++;
      }
    } else if (open.includes(c)) {
      stk.push(shut[open.indexOf(c)]);
    } else if (shut.includes(c)) {
      if (stk.pop() !== c) {
        return -1;
      }
      if (stk.length === 0) {
        return j + 1;
      }
    }
  }
  return -1;
}

// the trimmed top-level comma-separated parts of a group's inside
function split_args(s: string, beg: number, end: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let a = beg;
  for (let j = beg; j <= end; j++) {
    const c = s[j];
    if (j === end || c === ",") {
      let [b, e] = [skip_ws(s, a), j];
      while (e > b && /\s/.test(s[e - 1])) {
        e--;
      }
      if (e > b) {
        out.push([b, e]);
      } else if (j !== end || out.length > 0) {
        return [];
      }
      a = j + 1;
    } else if (c === "\"" || c === "'") {
      j = skip_lit(s, j) - 1;
    } else if ("([{".includes(c)) {
      j = close_of(s, j) - 1;
      if (j < 0) {
        return [];
      }
    }
  }
  return out;
}

// the end of a term's head at i: a bracket group or a name
function head_end(s: string, i: number): number {
  if ("([{".includes(s[i])) {
    return close_of(s, i);
  }
  let j = i;
  while (j < s.length && NAME.test(s[j])) {
    j++;
  }
  return j > i ? j : -1;
}

function line_col(s: string, i: number): [number, number] {
  const pre = s.slice(0, i).split("\n");
  return [pre.length, pre[pre.length - 1].length + 1];
}

function sanitize(t: string): string {
  return t.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "x";
}

// Terms
// =====

// a checker annotation: the type bend2 checked a node at
function ann_type(t: LTerm): HTerm | null {
  return t.$ === "Ann" && t.T.$ === "Var" && t.T.i === -1 && t.T.v !== undefined ? t.T.v as HTerm : null;
}

// a checked application's head and arguments, checker types dropped
function unapp(t: LTerm): [LTerm, LTerm[]] {
  const xs: LTerm[] = [];
  let cur = strip(t);
  while (cur.$ === "App") {
    xs.push(cur.x);
    cur = strip(cur.f);
  }
  return [cur, xs.reverse()];
}

function strip(t: LTerm): LTerm {
  let u = t;
  while (u.$ === "Ann" && ann_type(u) !== null) {
    u = u.x;
  }
  return u;
}

// the class arrow of a type, or null: an All flagged c after whnf
function arrow_of(book: Book, T: HTerm | null): Extract<HTerm, { $: "All" }> | null {
  if (T === null) {
    return null;
  }
  const w = B.term_wnf(book, T);
  return w.$ === "All" && w.c === true ? w : null;
}

// the variables a term names below level lo (free in it), checker types
// dropped
function free_vars(t: LTerm, lo: number, out: Set<number> = new Set()): Set<number> {
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
  return out;
}

// whether a term holds a callable-many arrow or lambda
function has_many(t: unknown): boolean {
  if (t === null || typeof t !== "object") {
    return false;
  }
  const o = t as Record<string, unknown>;
  if ((o.$ === "All" || o.$ === "Lam") && o.c === true) {
    return true;
  }
  for (const k in o) {
    if (k !== "s" && has_many(o[k])) {
      return true;
    }
  }
  return false;
}

// the book items a term names (a template instance by its template)
function refs_of(book: Book, t: unknown, out: Set<string> = new Set()): Set<string> {
  if (t === null || typeof t !== "object") {
    return out;
  }
  const o = t as Record<string, unknown>;
  if ((o.$ === "Ref" || o.$ === "ADT") && typeof o.k === "string") {
    out.add(o.k.split("~")[0]);
  }
  if (o.$ === "Ctr" && typeof o.k === "string" && B.book_ctr(book, o.k) !== null) {
    out.add(B.book_fam(book, o.k));
  }
  if (o.$ === "Var" && o.v !== undefined && typeof o.i === "number" && o.i < 0) {
    refs_of(book, B.term_lower(o.v as HTerm, 1 << 20), out);
  }
  for (const k in o) {
    if (k !== "s" && !(k === "v" && o.$ === "Var")) {
      refs_of(book, o[k], out);
    }
  }
  return out;
}

// Translate
// =========

// the translation of a checked book with callable-many closures to a Bend
// program without them (text); throws a Refusal
export function defun_translate(book: Book, mutate?: Mutation): string {
  const own = [...new Set(book.order)].filter((k) => book.tlds[k].b !== true);
  const file = book.many?.file ?? find_file(book, own);
  if (file === null) {
    refuse("no source text to translate");
  }
  const src = file.str;
  if (own.some((k) => k.includes(":"))) {
    refuse("phase 1 translates a program in one file: this book imports a module other than Base");
  }
  const pol = Check.policy(book);
  if (pol !== null) {
    refuse(pol);
  }
  for (const k of own) {
    const t = book.tlds[k];
    if (t.$ === "ADT" && t.c.some((c) => has_many(B.term_lower(c.T)))) {
      refuse("phase 1 does not translate a *-> field in a datatype (" + B.name_key(k) + ")");
    }
  }
  const taken = new Set<string>([...Object.keys(book.tlds), ...Object.keys(book.ctrs)]);
  const fresh = (want: string): string => {
    let n = want;
    for (let j = 2; taken.has(n); j++) {
      n = want + "_" + String(j);
    }
    taken.add(n);
    return n;
  };
  const classes = new Map<string, Class>();
  const sites: Site[] = [];
  const edits: Edit[] = [];
  // per owner (an own def, or a site's body), the defs it calls and the
  // classes it calls closures of
  const calls = new Map<string, Set<string>>();
  const call_of = (o: string): Set<string> => {
    let c = calls.get(o);
    if (c === undefined) {
      c = new Set();
      calls.set(o, c);
    }
    return c;
  };

  // a closed type's text, *-> arrows as their class datatypes; lo is the
  // depth below which a variable is free (refused)
  function ty_text(t: LTerm, lo: number, top = true): string {
    const go = (x: LTerm, prc: number): string => {
      switch (x.$) {
        case "Var": {
          if (x.i < 0 && x.v !== undefined) {
            return go(B.term_lower(x.v as HTerm, 1 << 20), prc);
          }
          if (x.i < lo) {
            refuse("phase 1 needs closed types around closures: " + x.k + " is a variable in a type");
          }
          return x.k;
        }
        case "Ref": {
          return B.name_show(file as File, x.k);
        }
        case "ADT": {
          if (x.r.length !== 0) {
            refuse("phase 1 does not print a refined type " + B.term_show(x));
          }
          return B.name_show(file as File, x.k) + (x.x.length === 0 ? "" : "<" + x.x.map((y) => go(y, 0)).join(", ") + ">");
        }
        case "App": {
          const [h, xs] = B.term_unapply(x);
          return go(h, 2) + "(" + xs.map((y) => go(y, 0)).join(", ") + ")";
        }
        case "All": {
          if (x.c === true) {
            return class_of(x.A, x.B, x.q, x.i, lo).name;
          }
          const used = free_vars(x.B, x.i + 1).has(x.i);
          const s = (used ? "@" + B.quant_show(x.q) + x.k + ":" + go(x.A, 0) : go(x.A, 2)) + " -> " + go(x.B, 1);
          return prc > 0 ? "(" + s + ")" : s;
        }
        case "Ann": {
          return go(x.x, prc);
        }
        default: {
          if (has_many(x)) {
            refuse("phase 1 does not print this type: " + B.term_show(x));
          }
          if (free_vars(x, lo).size !== 0) {
            refuse("phase 1 needs closed types around closures: " + B.term_show(x));
          }
          return B.term_show(x, prc, [], file as File);
        }
      }
    };
    return go(t, top ? 0 : 2);
  }

  // a closed type's text; a type that names a variable is normalized
  // first (a family index that reduces away leaves it closed)
  function closed(t: LTerm, lo: number): string {
    try {
      return ty_text(t, lo);
    } catch (e) {
      if (!(e instanceof Refusal)) {
        throw e;
      }
      let env: B.Env = null;
      for (const i of free_vars(t, lo)) {
        env = B.list_set(env, i, B.Var("_", i));
      }
      return ty_text(B.term_lower(B.term_snf(book, B.term_higher(t, env)), lo), lo);
    }
  }

  // the class of an arrow A *-> B (B under the binder at level i)
  function class_of(A: LTerm, Bt: LTerm, q: Quant, i: number, lo: number): Class {
    if (free_vars(Bt, i + 1).has(i)) {
      refuse("phase 1 does not translate a dependent *-> arrow");
    }
    const a = closed(A, lo);
    const b = closed(Bt, lo);
    const key = a + " *-> " + b;
    let c = classes.get(key);
    if (c === undefined) {
      const base = sanitize(a) + "_" + sanitize(b);
      c = { key, A: a, B: b, q, name: fresh("Clo_" + base), apply: fresh("apply_" + base), sites: [] };
      classes.set(key, c);
    }
    return c;
  }

  function class_h(T: Extract<HTerm, { $: "All" }>, d: number): Class {
    const lo = B.term_lower(T, d);
    if (lo.$ !== "All") {
      refuse("unreachable: a lowered arrow is not an arrow");
    }
    return class_of(lo.A, lo.B, T.q, lo.i, d);
  }

  const parsed = new Map<number, Extract<LTerm, { $: "Lam" }>>();

  // Scan: sites, calls, binders and types of each own def
  for (const k of own) {
    const def = book.tlds[k];
    if (def.$ !== "Def") {
      continue;
    }
    const lowT = B.term_lower(def.T);
    const lowV = def.v === null ? null : B.term_lower(def.v);
    const any = has_many(lowT) || (lowV !== null && has_many(lowV)) || (def.e !== undefined && has_many(def.e));
    if (any && def.x > 0) {
      refuse("phase 1 does not translate a template (~) def that holds a closure (" + B.name_key(k) + ")");
    }
    if (def.l === true) {
      continue;
    }
    // parameters of a *-> type become + (T5: a borrowed & one too)
    const pspans = new Set<number>();
    let tel: HTerm = def.T;
    for (let j = 0; j < def.n; j++) {
      const t = B.tele_open(book, tel);
      if (t === null) {
        break;
      }
      if (t.s !== undefined) {
        pspans.add(t.s.beg);
      }
      if ((t.l === true || arrow_of(book, t.A) !== null) && t.q.$ !== "None") {
        if (t.s === undefined) {
          refuse("cannot locate parameter " + t.k + " of " + B.name_key(k) + " in the source");
        }
        plus_at(t.s.beg, t.k);
      }
      tel = t.B(B.Var(t.k, j));
    }
    // the parsed *x => lambdas, by position
    parsed.clear();
    const lams = (x: unknown): void => {
      if (x === null || typeof x !== "object") {
        return;
      }
      const o = x as Record<string, unknown>;
      if (o.$ === "Lam" && o.c === true && (o.s as Span | undefined) !== undefined) {
        parsed.set((o.s as Span).beg, o as Extract<LTerm, { $: "Lam" }>);
      }
      for (const kk in o) {
        if (kk !== "s") {
          lams(o[kk]);
        }
      }
    };
    lams(lowV);
    // types A *-> B written in the def's type and body
    types_in(lowT);
    if (lowV !== null) {
      types_in(lowV);
    }
    if (def.e !== undefined) {
      walk(k, def.e, [], null, k, pspans);
    }
  }

  // a + before the binder named k at i (& becomes +)
  function plus_at(i: number, k: Name): void {
    if (src.slice(i, i + k.length) !== k) {
      refuse("cannot locate binder " + k + " in the source");
    }
    let j = i - 1;
    while (j >= 0 && (src[j] === " " || src[j] === "\t")) {
      j--;
    }
    if (src[j] === "&") {
      edits.push({ beg: j, end: j + 1, holes: [], render: () => "+" });
    } else if (src[j] !== "+" && src[j] !== "-") {
      edits.push({ beg: i, end: i, holes: [], render: () => "+" });
    }
  }

  function types_in(t: LTerm): void {
    const go = (x: unknown): void => {
      if (x === null || typeof x !== "object") {
        return;
      }
      const o = x as Record<string, unknown>;
      if (o.$ === "All" && o.c === true) {
        const a = o as Extract<LTerm, { $: "All" }>;
        const s = a.s;
        if (s === undefined || s.file.str !== src) {
          refuse("cannot locate a *-> type in the source");
        }
        let e = s.end;
        while (e > s.beg && /\s/.test(src[e - 1])) {
          e--;
        }
        if (!src.slice(s.beg, e).includes("*->")) {
          refuse("cannot locate a *-> type in the source");
        }
        const c = class_of(a.A, a.B, a.q, a.i, a.i);
        edits.push({ beg: s.beg, end: e, holes: [], render: () => c.name });
        return;
      }
      for (const k in o) {
        if (k !== "s") {
          go(o[k]);
        }
      }
    };
    go(t);
  }

  // walk a checked term: ctx by level; T the type bend2 checked it at;
  // owner the def or site whose code it is
  function walk(def: Name, tm: LTerm, ctx: Bind[], T: HTerm | null, owner: string, pspans: Set<number>): void {
    const ty = ann_type(tm);
    if (ty !== null) {
      // a lift: a def (or a partial application of one) at A *-> B
      const arr = arrow_of(book, ty);
      const x = strip(tm);
      if (arr !== null && unapp(x)[0].$ === "Ref") {
        const [h, xs] = unapp(x);
        const tld = h.$ === "Ref" ? book.tlds[h.k] : undefined;
        if (tld !== undefined && tld.$ === "Def") {
          let tl: HTerm = tld.T;
          const fts: string[] = [];
          for (let j = 0; j < xs.length; j++) {
            const t = B.tele_open(book, tl);
            if (t === null) {
              refuse("unreachable: a lifted def has fewer parameters than arguments");
            }
            if (t.q.$ === "None") {
              refuse("phase 1 does not lift a def with an erased argument (" + B.term_show(h) + ")");
            }
            fts.push(closed(B.term_lower(t.A, 1 << 20), 1 << 20));
            tl = t.B(B.term_higher(xs[j]));
          }
          const nxt = B.tele_open(book, tl);
          if (nxt !== null && nxt.c !== true) {
            lift(def, x, h as Extract<LTerm, { $: "Ref" }>, xs, fts, class_h(arr, ctx.length), ctx, owner, pspans);
            return;
          }
        }
      }
      walk(def, tm.$ === "Ann" ? tm.x : tm, ctx, ty, owner, pspans);
      return;
    }
    switch (tm.$) {
      case "Lam": {
        const all = T === null ? null : B.term_wnf(book, T);
        if (all === null || all.$ !== "All") {
          refuse("unreachable: a checked lambda has no arrow type");
        }
        if (tm.c === true) {
          site(def, tm, all, ctx, owner, pspans);
          return;
        }
        if (arrow_of(book, all.A) !== null && !(tm.s !== undefined && pspans.has(tm.s.beg))) {
          refuse("phase 1 translates a *-> value bound by a def parameter or a let only: " + tm.k + " in "
            + B.name_key(def) + " is bound by a lambda or a match field");
        }
        const c2 = ctx.slice();
        c2[tm.i] = { k: tm.k, q: all.q, T: all.A };
        walk(def, tm.f, c2, null, owner, pspans);
        return;
      }
      case "Let": {
        const c2 = ctx.slice();
        for (let j = 0; j < tm.k.length; j++) {
          walk(def, tm.v[j], ctx, null, owner, pspans);
          const vt = ann_type(tm.v[j]);
          c2[tm.i[j]] = { k: tm.k[j], q: tm.q[j], T: vt };
          if (arrow_of(book, vt) !== null) {
            let_plus(def, tm, j);
          }
        }
        walk(def, tm.f, c2, null, owner, pspans);
        return;
      }
      case "App": {
        chain(def, tm, ctx, owner, pspans);
        return;
      }
      case "Ref": {
        call_of(owner).add(tm.k.split("~")[0]);
        return;
      }
      default: {
        const o = tm as Record<string, unknown>;
        for (const key of ["A", "B", "f", "x", "a", "b", "h", "m", "T", "e", "p", "g"]) {
          const c = o[key];
          if (Array.isArray(c)) {
            for (const y of c) {
              walk(def, y as LTerm, ctx, null, owner, pspans);
            }
          } else if (c !== null && typeof c === "object" && "$" in (c as object)) {
            walk(def, c as LTerm, ctx, null, owner, pspans);
          }
        }
        return;
      }
    }
  }

  // a binder j of a let gets + (its type is *->)
  function let_plus(def: Name, tm: Extract<LTerm, { $: "Let" }>, j: number): void {
    if (tm.s === undefined || tm.s.file.str !== src) {
      refuse("cannot locate let " + tm.k[j] + " of " + B.name_key(def) + " in the source");
    }
    let i = tm.s.beg;
    for (let n = 0; n <= j; n++) {
      i = skip_ws(src, i, false);
      const at = src[i] === "+" || src[i] === "-" ? i + 1 : i;
      const e = head_end(src, at);
      if (e < 0) {
        refuse("cannot locate let " + tm.k[j] + " of " + B.name_key(def) + " in the source");
      }
      if (n === j) {
        if (src.slice(at, e) !== tm.k[j]) {
          refuse("cannot locate let " + tm.k[j] + " of " + B.name_key(def) + " in the source");
        }
        if (at === i) {
          edits.push({ beg: at, end: at, holes: [], render: () => "+" });
        }
      }
      i = e;
    }
  }

  // a callable-many lambda site
  function site(def: Name, tm: Extract<LTerm, { $: "Lam" }>, all: Extract<HTerm, { $: "All" }>, ctx: Bind[],
    owner: string, pspans: Set<number>): void {
    const s = tm.s;
    if (s === undefined || s.file.str !== src) {
      refuse("cannot locate a *x => lambda of " + B.name_key(def) + " in the source");
    }
    let st = s.beg - 1;
    while (st >= 0 && /\s/.test(src[st])) {
      st--;
    }
    if (src[st] !== "*") {
      refuse("cannot locate a *x => lambda of " + B.name_key(def) + " in the source");
    }
    const p = { book: { ...book }, dir: "", str: src, pos: st, stk: [], frs: 0, ns: file!.ns, al: file!.al } as unknown as B.Parse;
    B.parse_term_base(p, st);
    let end = p.pos;
    while (end > st && /\s/.test(src[end - 1])) {
      end--;
    }
    const arrow = src.indexOf("=>", s.end);
    if (arrow < 0 || arrow >= end) {
      refuse("cannot locate a *x => lambda of " + B.name_key(def) + " in the source");
    }
    const cls = class_h(all, ctx.length);
    const [line, col] = line_col(src, st);
    const caps: Cap[] = [...free_vars(tm.f, tm.i)].sort((a, b) => a - b).map((i) => {
      const b = ctx[i];
      if (b === undefined || b.T === null) {
        refuse("phase 1 cannot type the capture at level " + String(i) + " of the lambda at line " + String(line));
      }
      if (b.q.$ === "None") {
        refuse("phase 1 does not translate an erased capture (" + b.k + ", in the lambda at line " + String(line)
          + ", column " + String(col) + ")");
      }
      return { k: b.k, i, q: b.q, T: closed(B.term_lower(b.T, 1 << 20), 1 << 20) };
    });
    const pl = parsed.get(s.beg);
    if (pl === undefined) {
      refuse("cannot match the lambda at line " + String(line) + ", column " + String(col) + " to its source");
    }
    const named = new Set<string>();
    const scan = (x: unknown): void => {
      if (x === null || typeof x !== "object") {
        return;
      }
      const o = x as Record<string, unknown>;
      if (o.$ === "Var" && typeof o.i === "number" && o.i >= 0 && o.i < pl.i) {
        named.add(o.k as string);
      }
      for (const kk in o) {
        if (kk !== "s") {
          scan(o[kk]);
        }
      }
    };
    scan(pl.f);
    for (const n of named) {
      if (!caps.some((c) => c.k === n)) {
        refuse("phase 1 does not translate a lambda that names " + n + " only in a type (an erased capture): the lambda at line "
          + String(line) + ", column " + String(col) + " of " + B.name_key(def));
      }
    }
    const ctor = fresh(sanitize(def) + "_lam_" + String(line) + "_" + String(col));
    const st_: Site = { kind: "lam", def, line, col, cls, ctor, run: fresh(ctor + "_run"), owner, x: tm.k, xq: all.q,
      caps, beg: st, end, body: [skip_ws(src, arrow + 2), end] };
    sites.push(st_);
    cls.sites.push(st_);
    const c2 = ctx.slice();
    c2[tm.i] = { k: tm.k, q: all.q, T: all.A };
    walk(def, tm.f, c2, null, "site:" + ctor, pspans);
    edits.push({ beg: st, end, holes: [st_.body as [number, number]], render: (hs) => {
      st_.text = hs[0];
      return ctor_text(st_);
    } });
  }

  // a lifted def at A *-> B (R6), bare or partially applied
  function lift(def: Name, x: LTerm, h: Extract<LTerm, { $: "Ref" }>, xs: LTerm[], fts: string[], cls: Class,
    ctx: Bind[], owner: string, pspans: Set<number>): void {
    const s = (x.$ === "App" ? x.s : h.s);
    if (s === undefined || h.s === undefined || s.file.str !== src || h.s.beg !== s.beg) {
      refuse("cannot locate the use of " + B.name_key(h.k) + " at a *-> type in " + B.name_key(def));
    }
    const he = head_end(src, s.beg);
    const args: Array<[number, number]> = [];
    let i = he;
    while (args.length < xs.length && src[i] === "(") {
      const e = close_of(src, i);
      const got = split_args(src, i + 1, e - 1);
      if (e < 0 || got.length === 0) {
        refuse("cannot locate the arguments of " + B.name_key(h.k) + " in " + B.name_key(def));
      }
      args.push(...got);
      i = e;
    }
    if (args.length !== xs.length) {
      refuse("cannot locate the arguments of " + B.name_key(h.k) + " in " + B.name_key(def));
    }
    const [line, col] = line_col(src, s.beg);
    const ctor = fresh(sanitize(def) + "_lift_" + sanitize(h.k) + "_" + String(line) + "_" + String(col));
    const st_: Site = { kind: "lift", def, line, col, cls, ctor, run: fresh(ctor + "_run"), owner, beg: s.beg,
      end: xs.length === 0 ? he : i, tgt: h.k.split("~")[0], args, fts };
    sites.push(st_);
    cls.sites.push(st_);
    for (const y of xs) {
      walk(def, y, ctx, null, owner, pspans);
    }
    edits.push({ beg: st_.beg, end: st_.end, holes: args, render: (hs) => ctor_text(st_, hs) });
  }

  // a maximal application chain: closure calls in it go through apply
  function chain(def: Name, tm: Extract<LTerm, { $: "App" }>, ctx: Bind[], owner: string, pspans: Set<number>): void {
    // the chain's function types, head first, and its arguments
    const fs_: Array<HTerm | null> = [];
    const xs: LTerm[] = [];
    let cur: LTerm = tm;
    let hd: LTerm = tm;
    while (cur.$ === "App") {
      fs_.push(ann_type(cur.f));
      xs.push(cur.x);
      hd = cur.f;
      cur = strip(cur.f);
    }
    fs_.reverse();
    xs.reverse();
    const head = cur;
    const cl = fs_.map((t) => arrow_of(book, t));
    walk(def, hd, ctx, null, owner, pspans);
    for (const y of xs) {
      walk(def, y, ctx, null, owner, pspans);
    }
    if (cl.every((c) => c === null)) {
      return;
    }
    const s = tm.s;
    if (s === undefined || s.file.str !== src) {
      refuse("cannot locate a closure call in " + B.name_key(def) + " in the source");
    }
    const he = head_end(src, s.beg);
    if (he < 0 || (head.s !== undefined && head.s.file.str === src && (head.s.beg < s.beg || head.s.beg >= he))) {
      refuse("cannot locate a closure call in " + B.name_key(def) + " in the source");
    }
    const args: Array<[number, number]> = [];
    let i = he;
    while (args.length < xs.length && src[i] === "(") {
      const e = close_of(src, i);
      const got = e < 0 ? [] : split_args(src, i + 1, e - 1);
      if (got.length === 0) {
        refuse("cannot locate a closure call in " + B.name_key(def) + " in the source");
      }
      args.push(...got);
      i = e;
    }
    if (args.length !== xs.length) {
      const [l, c] = line_col(src, s.beg);
      refuse("cannot locate a closure call at line " + String(l) + ", column " + String(c) + " in the source");
    }
    const ccls = cl.map((c) => c === null ? null : class_h(c, ctx.length));
    for (const c of ccls) {
      if (c !== null) {
        call_of(owner).add("apply:" + c.key);
      }
    }
    edits.push({ beg: s.beg, end: i, holes: [[s.beg, he], ...args], render: (hs) => {
      let out = hs[0];
      let pend: string[] = [];
      const flush = (): void => {
        if (pend.length > 0) {
          out = out + "(" + pend.join(", ") + ")";
          pend = [];
        }
      };
      for (let j = 0; j < xs.length; j++) {
        const c = ccls[j];
        if (c === null) {
          pend.push(hs[j + 1]);
        } else {
          flush();
          out = mutate === "wrong_apply_sig" ? c.apply + "(" + hs[j + 1] + ", " + out + ")"
            : c.apply + "(" + out + ", " + hs[j + 1] + ")";
        }
      }
      flush();
      return out;
    } });
  }

  // the constructor a site stands as
  function ctor_text(st_: Site, hs?: string[]): string {
    if (st_.kind === "lift") {
      return st_.ctor + "{" + (hs ?? []).join(", ") + "}";
    }
    let ks = (st_.caps as Cap[]).map((c) => c.k);
    let ctor = st_.ctor;
    if (mutate === "swap_captures" && st_ === mut_site("swap") && ks.length >= 2) {
      ks = [ks[1], ks[0], ...ks.slice(2)];
    }
    if (mutate === "drop_capture" && st_ === mut_site("drop")) {
      ks = ks.slice(0, -1);
    }
    if (mutate === "share_ctor" && st_ === mut_site("share")) {
      ctor = (mut_site("share_with") as Site).ctor;
    }
    return ctor + "{" + ks.join(", ") + "}";
  }

  // the site a mutation acts on
  function mut_site(which: string): Site | undefined {
    const lams = sites.filter((s) => s.kind === "lam");
    switch (which) {
      case "swap": return lams.find((s) => (s.caps as Cap[]).length >= 2);
      case "drop": return lams.find((s) => (s.caps as Cap[]).length >= 1 && (s.caps as Cap[]).at(-1)?.T === "U32");
      case "share": {
        const two = pair_same();
        return two?.[1];
      }
      case "share_with": return pair_same()?.[0];
      case "body": return lams.find((s) => /\b\d+\b/.test(src.slice(...(s.body as [number, number]))));
    }
    return undefined;
  }

  // two lambda sites of one class with captures of the same types
  function pair_same(): [Site, Site] | null {
    const lams = sites.filter((s) => s.kind === "lam");
    for (let a = 0; a < lams.length; a++) {
      for (let b = a + 1; b < lams.length; b++) {
        const ca = lams[a].caps as Cap[];
        const cb = lams[b].caps as Cap[];
        if (lams[a].cls === lams[b].cls && ca.length === cb.length && ca.every((c, j) => c.T === cb[j].T)) {
          return [lams[a], lams[b]];
        }
      }
    }
    return null;
  }

  // Items
  const items = split_items(src, own);
  const shared = mutate === "share_ctor" ? mut_site("share") : undefined;

  // Render: each item's text, with its edits applied
  const sorted = edits.slice().sort((a, b) => a.beg - b.beg || b.end - a.end);
  function render(beg: number, end: number, es: Edit[]): string {
    let out = "";
    let at = beg;
    let j = 0;
    while (j < es.length) {
      const e = es[j];
      const kids: Edit[] = [];
      let n = j + 1;
      while (n < es.length && es[n].beg < e.end) {
        if (es[n].end > e.end) {
          refuse("unreachable: two edits overlap");
        }
        kids.push(es[n]);
        n++;
      }
      for (const k of kids) {
        if (!e.holes.some(([hb, he]) => k.beg >= hb && k.end <= he) && e.holes.length > 0) {
          refuse("unreachable: an edit outside its parent's holes");
        }
      }
      out += src.slice(at, e.beg);
      out += e.render(e.holes.map(([hb, he]) => render(hb, he, kids.filter((k) => k.beg >= hb && k.end <= he))));
      at = e.end;
      j = n;
    }
    return out + src.slice(at, end);
  }
  const texts = items.map((it) => render(it.beg, it.end, sorted.filter((e) => e.beg >= it.beg && e.end <= it.end && !(e.beg === e.end && e.beg === it.end))));
  for (const e of sorted) {
    if (!items.some((it) => e.beg >= it.beg && e.end <= it.end)) {
      refuse("unreachable: an edit outside every item");
    }
  }

  // Generate: the class datatypes, body defs and applies
  const gens: Gen[] = [];
  for (const c of classes.values()) {
    const ss = c.sites.filter((s) => s !== shared);
    const ctors = ss.map((s) => {
      if (s.kind === "lift") {
        return "  " + s.ctor + "{" + (s.fts as string[]).map((t, j) => "a" + String(j) + ": " + t).join(", ") + "}";
      }
      let cs = s.caps as Cap[];
      if (mutate === "drop_capture" && s === mut_site("drop")) {
        cs = cs.slice(0, -1);
      }
      return "  " + s.ctor + "{" + cs.map((x) => x.k + ": " + x.T).join(", ") + "}";
    });
    const tdeps = new Set<string>();
    for (const s of ss) {
      for (const t of (s.kind === "lift" ? s.fts as string[] : (s.caps as Cap[]).map((x) => x.T))) {
        names_in(t, tdeps);
      }
    }
    gens.push({ name: c.name, text: "type " + c.name + " is Data:\n" + ctors.join("\n") + "\n", deps: tdeps });
    for (const s of ss) {
      gens.push(run_def(s, c));
    }
    const arms = ss.map((s, j) => {
      const n = s.kind === "lift" ? (s.fts as string[]).length : (mutate === "drop_capture" && s === mut_site("drop")
        ? (s.caps as Cap[]).length - 1 : (s.caps as Cap[]).length);
      const fs2 = Array.from({ length: n }, (_, m) => "f" + String(m));
      let run = s.run;
      if (mutate === "wrong_site" && j === 0) {
        const other = ss.find((o, m) => m > 0 && o.kind === s.kind && same_fields(o, s));
        run = other?.run ?? run;
      }
      return "    case " + s.ctor + "{" + fs2.join(", ") + "}:\n      " + run + "(" + [...fs2, "x"].join(", ") + ")";
    });
    const xq = B.quant_show(c.q);
    const sig = mutate === "wrong_apply_sig" ? "(" + xq + "x: " + c.A + ", c: " + c.name + ")"
      : "(c: " + c.name + ", " + xq + "x: " + c.A + ")";
    const adeps = new Set<string>([c.name, ...ss.map((s) => s.run)]);
    names_in(c.A, adeps);
    names_in(c.B, adeps);
    gens.push({ name: c.apply, text: "def " + c.apply + sig + " -> " + c.B + ":\n  match c:\n" + arms.join("\n") + "\n",
      deps: adeps });
  }

  function same_fields(a: Site, b: Site): boolean {
    const fa = a.kind === "lift" ? a.fts as string[] : (a.caps as Cap[]).map((c) => c.T);
    const fb = b.kind === "lift" ? b.fts as string[] : (b.caps as Cap[]).map((c) => c.T);
    return fa.length === fb.length && fa.every((t, j) => t === fb[j]);
  }

  // the names of own items and generated items a text names
  function names_in(t: string, out: Set<string>): void {
    for (const m of t.matchAll(/[A-Za-z_][A-Za-z0-9_.]*/g)) {
      out.add(m[0]);
    }
  }

  // a site's body def
  function run_def(s: Site, c: Class): Gen {
    const deps = new Set<string>();
    names_in(c.A, deps);
    names_in(c.B, deps);
    if (s.kind === "lift") {
      const ps = (s.fts as string[]).map((t, j) => "a" + String(j) + ": " + t);
      const xs = [...(s.fts as string[]).map((_, j) => "a" + String(j)), "x"];
      for (const t of s.fts as string[]) {
        names_in(t, deps);
      }
      deps.add(s.tgt as string);
      return { name: s.run, text: "def " + s.run + "(" + [...ps, B.quant_show(c.q) + "x: " + c.A].join(", ") + ") -> " + c.B
        + ":\n  " + B.name_show(file as File, s.tgt as string) + "(" + xs.join(", ") + ")\n", deps };
    }
    let caps = s.caps as Cap[];
    let pre = "";
    if (mutate === "drop_capture" && s === mut_site("drop")) {
      const last = caps[caps.length - 1];
      caps = caps.slice(0, -1);
      pre = "  " + (last.q.$ === "Many" ? "+" : "") + last.k + " : U32 = 0\n";
    }
    for (const x of caps) {
      names_in(x.T, deps);
    }
    let body = s.text as string;
    if (mutate === "change_body" && s === mut_site("body")) {
      body = body.replace(/\b(\d+)\b/, (m) => String(Number(m) + 1));
    }
    const ps = [...caps.map((x) => "+" + x.k + ": " + x.T), B.quant_show(s.xq as Quant) + (s.x as string) + ": " + c.A];
    return { name: s.run, text: "def " + s.run + "(" + ps.join(", ") + ") -> " + c.B + ":\n" + pre + layout(body) + "\n",
      deps };
  }

  // Call graph (T9 phase 1): own defs, body defs and applies
  const nodes = new Map<string, Set<string>>();
  const ownset = new Set(own);
  const node_of = (o: string): string => o.startsWith("site:") ? (sites.find((s) => "site:" + s.ctor === o) as Site).run
    : o.startsWith("apply:") ? (classes.get(o.slice(6)) as Class).apply : o;
  for (const [o, cs] of calls) {
    const out = new Set<string>();
    for (const c of cs) {
      const n = node_of(c);
      if (ownset.has(n) || n.startsWith("apply_") || sites.some((s) => s.run === n)) {
        out.add(n);
      }
    }
    nodes.set(node_of(o), out);
  }
  for (const s of sites) {
    if (s.kind === "lift") {
      nodes.set(s.run, new Set(ownset.has(s.tgt as string) ? [s.tgt as string] : []));
    } else if (!nodes.has(s.run)) {
      nodes.set(s.run, new Set());
    }
  }
  for (const c of classes.values()) {
    nodes.set(c.apply, new Set(c.sites.map((s) => s.run)));
  }
  const cyc = find_cycle(nodes);
  if (cyc !== null) {
    refuse(cycle_text(cyc));
  }

  function cycle_text(cyc0: string[]): string {
    const cls_of = (n: string): Class | undefined => [...classes.values()].find((x) => x.apply === n);
    const at = cyc0.findIndex((n) => cls_of(n) === undefined);
    const cyc = [...cyc0.slice(at), ...cyc0.slice(0, at)];
    const what = (n: string): string => {
      const s = sites.find((x) => x.run === n);
      if (s === undefined) {
        return B.name_key(n);
      }
      const where = "line " + String(s.line) + ", column " + String(s.col) + " of " + B.name_key(s.def);
      if (s.kind === "lift") {
        return "the use of " + B.name_key(s.tgt as string) + " as a closure (" + where + ")";
      }
      const txt = src.slice(s.beg, s.end).replace(/\s+/g, " ");
      return "the closure `" + (txt.length > 40 ? txt.slice(0, 37) + " .." : txt) + "` (" + where + ")";
    };
    const steps: string[] = [];
    for (let j = 0; j < cyc.length; j++) {
      const a = cyc[j];
      const b = cyc[(j + 1) % cyc.length];
      const c = cls_of(b);
      if (c === undefined) {
        steps.push(what(a) + " calls " + what(b));
        continue;
      }
      const r = cyc[(j + 2) % cyc.length];
      steps.push(what(a) + " calls a " + c.key + " closure, which may be " + (r === cyc[0] && j + 2 >= cyc.length
        && steps.length === 0 ? "that closure itself" : what(r)));
      j++;
    }
    return "the defunctionalized call graph has a cycle (" + cyc.map((n) => cls_of(n)?.apply ?? n).join(" -> ") + " -> "
      + (cls_of(cyc[0])?.apply ?? cyc[0]) + "), and phase 1 accepts no cycle but a def calling itself"
      + " (bend2 and the kernel check descent one def at a time):\n  " + steps.join(";\n  ") + ".\n"
      + "Phase 2 (strata and static site calls, C006b) is deferred.";
  }

  // dependencies: what each item's live code calls, and the generated
  // names its text holds (a constructor stands for its datatype)
  const gname = new Map<string, string>();
  for (const g of gens) {
    gname.set(g.name, g.name);
  }
  for (const s of sites) {
    gname.set(s.ctor, s.cls.name);
  }
  const gen_in = (t: string, out: Set<string>): Set<string> => {
    for (const m of t.replace(/#[^\n]*/g, "").replace(/"(?:[^"\\]|\\.)*"/g, "").matchAll(/[A-Za-z_][A-Za-z0-9_.]*/g)) {
      const g = gname.get(m[0]);
      if (g !== undefined) {
        out.add(g);
      }
    }
    return out;
  };
  const called = (o: string): Set<string> => new Set([...(calls.get(o) ?? [])].map(node_of));
  const omit = mutate === "omit_def" ? "main" : null;
  const nodes2: Array<{ key: string; text: string; deps: Set<string>; rank: number }> = [];
  items.forEach((it, j) => {
    if (it.key === omit) {
      return;
    }
    const text = texts[j].split("\n").filter((l) => !l.startsWith("#|")).join("\n");
    const deps = gen_in(text, called(it.key));
    if (it.kind === "law") {
      refs_of(book, B.term_lower((book.tlds[it.key] as Def).T), deps);
    }
    nodes2.push({ key: it.key, text, deps, rank: j });
  });
  for (const g of gens) {
    const site_ = sites.find((x) => x.run === g.name);
    const deps = gen_in(g.text, site_ === undefined ? new Set(g.deps) : new Set([...called("site:" + site_.ctor), ...g.deps]));
    nodes2.push({ key: g.name, text: g.text, deps, rank: -1 });
  }
  return "# The defunctionalization of callable-many closures (C006 phase 1): one\n"
    + "# datatype Clo_A_B and one apply_A_B per type A *-> B, a constructor and a\n"
    + "# body def <site>_run per lambda site or lifted def (named by def, line and\n"
    + "# column in the source). Checked by bend2, the validator and the kernel.\n"
    + "import Base\n\n" + order(nodes2);
}

function find_file(book: Book, own: Name[]): File | null {
  for (const k of own) {
    const t = book.tlds[k];
    const s = t.$ === "Def" ? t.T.s ?? (t.v !== null ? t.v.s : undefined) : t.T.s;
    if (s !== undefined) {
      return s.file;
    }
  }
  return null;
}

// a body def's body: one line after two spaces, or a block re-indented
function layout(body: string): string {
  const lines = body.split("\n");
  if (lines.length === 1) {
    return "  " + body;
  }
  const rest = lines.slice(1).filter((l) => l.trim() !== "");
  const ind = Math.min(...rest.map((l) => l.match(/^ */)?.[0].length ?? 0));
  if (lines[0].trim() === "") {
    return lines.slice(1).map((l) => l.trim() === "" ? "" : "  " + l.slice(ind)).join("\n");
  }
  return "  " + lines[0] + "\n" + lines.slice(1).map((l) => l.trim() === "" ? "" : "  " + l.slice(ind) ).join("\n");
}

// the top-level items of a file's text: def, law, type and @unsafe def,
// each from its leading comments to the next item
function split_items(src: string, own: Name[]): Item[] {
  const lines = src.split("\n");
  const offs: number[] = [];
  let at = 0;
  for (const l of lines) {
    offs.push(at);
    at += l.length + 1;
  }
  const heads: Array<[number, Name, Item["kind"]]> = [];
  for (let j = 0; j < lines.length; j++) {
    const m = /^(?:@unsafe\s+)?(def|law|type)\s+([A-Za-z_][A-Za-z0-9_.]*)/.exec(lines[j]);
    if (m !== null) {
      heads.push([j, m[2], m[1] as Item["kind"]]);
    }
  }
  const items: Item[] = [];
  for (let h = 0; h < heads.length; h++) {
    let b = heads[h][0];
    while (b > 0 && (lines[b - 1].trim() === "" || lines[b - 1].startsWith("#")) && (h === 0 || b - 1 > heads[h - 1][0])) {
      b--;
    }
    if (h > 0 && b <= heads[h - 1][0]) {
      b = heads[h][0];
    }
    items.push({ key: heads[h][1], kind: heads[h][2], beg: offs[b], end: 0, idx: h });
  }
  for (let h = 0; h < items.length; h++) {
    items[h].end = h + 1 < items.length ? items[h + 1].beg : src.length;
  }
  const keys = new Set(items.map((i) => i.key));
  for (const k of own) {
    if (!keys.has(k)) {
      refuse("cannot locate the item " + B.name_key(k) + " in the source");
    }
  }
  for (const it of items) {
    if (!own.includes(it.key)) {
      refuse("cannot match the item " + it.key + " of the source to the book");
    }
  }
  return items;
}

// a cycle (two or more nodes) of a graph, or null
function find_cycle(g: Map<string, Set<string>>): string[] | null {
  const state = new Map<string, number>();
  const stack: string[] = [];
  let found: string[] | null = null;
  const visit = (n: string): void => {
    if (found !== null) {
      return;
    }
    state.set(n, 1);
    stack.push(n);
    for (const m of g.get(n) ?? []) {
      if (m === n || found !== null) {
        continue;
      }
      if (state.get(m) === 1) {
        found = stack.slice(stack.indexOf(m));
        return;
      }
      if (!state.has(m)) {
        visit(m);
      }
    }
    stack.pop();
    state.set(n, 2);
  };
  for (const n of [...g.keys()].sort()) {
    if (!state.has(n)) {
      visit(n);
    }
  }
  return found;
}

// the items in order: each after the items it depends on (a law's proof
// after the law), source items in source order where that allows,
// generated ones as early as they can go
function order(ns: Array<{ key: string; text: string; deps: Set<string>; rank: number }>): string {
  type Node = (typeof ns)[number];
  const last = new Map<string, Node>();
  const first = new Map<string, Node>();
  for (const n of ns) {
    last.set(n.key, n);
    if (!first.has(n.key)) {
      first.set(n.key, n);
    }
  }
  const before = new Map<Node, Set<Node>>();
  for (const n of ns) {
    const b = new Set<Node>();
    for (const d of n.deps) {
      const m = d === n.key ? first.get(d) : last.get(d);
      if (m !== undefined && m !== n) {
        b.add(m);
      }
    }
    before.set(n, b);
  }
  const done = new Set<Node>();
  const out: string[] = [];
  while (done.size < ns.length) {
    const ready = ns.filter((n) => !done.has(n) && [...(before.get(n) as Set<Node>)].every((m) => done.has(m)));
    if (ready.length === 0) {
      const left = ns.filter((n) => !done.has(n)).map((n) => n.key);
      refuse("the translated items cannot be ordered (each must follow what it calls): " + left.join(", "));
    }
    ready.sort((a, b) => a.rank - b.rank);
    done.add(ready[0]);
    out.push(ready[0].text.replace(/^(\s*\n)+/, "").replace(/\s+$/, "") + "\n");
  }
  return out.join("\n");
}

// Pipeline
// ========

// the translation checked again by bend2: its book, from its text in a
// fresh private dir; a bend2 error refuses
export async function defun_recheck(text: string): Promise<Book> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bend-defun-"));
  try {
    const file = path.join(dir, "defun.bend");
    fs.writeFileSync(file, text, { flag: "wx" });
    const book = B.book_nil();
    try {
      await B.book_load(book, file, "", new Map());
      B.book_valid(book);
    } catch (e) {
      const err = e as B.Err;
      refuse("the emitted translation does not check:\n" + (err?.$ === "Err" ? B.err_show(err) : String(e)));
    }
    if (book.hols > 0) {
      refuse("the emitted translation has holes");
    }
    return book;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

