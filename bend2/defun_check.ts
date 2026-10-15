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

export {};
