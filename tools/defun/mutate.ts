// Mutation tests of the C006 validator (bend2/defun_check.ts): each
// injected translator bug, or edit of the emitted BendTT text, must be
// rejected. A translator bug goes in through defun_translate's test-only
// mutate hook; a BendTT edit rewrites the text the validator reads. For
// each, the script says whether bend2's re-check and the kernel would
// have accepted the mutant (so the validator is what catches it) and
// which rules the validator broke. Exit 1 if a mutant validates.
// Usage: bun tools/defun/mutate.ts [FILE.bend]
import * as path from "node:path";
import * as B from "../../bend2/bend.ts";
import * as D from "../../bend2/defun.ts";
import * as V from "../../bend2/defun_check.ts";
import * as Safe from "../../bend2/safe.ts";

const file = process.argv[2] ?? path.join(import.meta.dir, "mutation_base.bend");
const src = B.book_nil();
await B.book_load(src, file, "", new Map());
B.book_valid(src);

type Got = { stage: string; recheck: string; kernel: string; rules: string[] };

async function stages(bend: string, kedit?: (k: string, t: B.Book) => string): Promise<Got> {
  let tb: B.Book;
  try {
    tb = await D.defun_recheck(bend);
  } catch (e) {
    return { stage: "recheck", recheck: "rejects", kernel: "-", rules: [e instanceof D.Refusal ? e.why.split("\n")[0] : String(e)] };
  }
  const el = Safe.safe_elaborate(tb);
  if (el.oos.length !== 0) {
    return { stage: "scope", recheck: "accepts", kernel: "-", rules: el.oos.map(([k, w]) => k + ": " + w) };
  }
  const text = kedit === undefined ? el.text : kedit(el.text, tb);
  let kernel: string;
  try {
    kernel = Safe.safe_kernel(text) === null ? "accepts" : "rejects";
  } catch (e) {
    kernel = "error";
  }
  const rules = V.validate(src, tb, text);
  return { stage: rules.length === 0 ? "none" : "validator", recheck: "accepts", kernel, rules };
}

const good = D.defun_translate(src);
const base = await stages(good);
console.log("unmutated: validator " + (base.rules.length === 0 ? "accepts" : "REJECTS " + base.rules.join("; "))
  + ", kernel " + base.kernel);

// the kernel text of the good translation, for the BendTT edits
const tb0 = await D.defun_recheck(good);
const k0 = Safe.safe_elaborate(tb0).text;
const lab = [...k0.matchAll(/\.(main_lam_\d+_\d+)\b/g)].map((m) => m[1]);
const labs = [...new Set(lab)];
const block = (k: string, name: string): RegExp => new RegExp("(^|\\n)" + name.replace(/\./g, "\\.") + " :[^\\n]*\\n[^\\n]*\\n", "m");

const kedits: Array<[string, string, (k: string) => string]> = [
  ["omitted definition", "delete the kernel def of twice", (k) => k.replace(block(k, "twice"), "$1")],
  ["call to the wrong site", "main builds " + labs[1] + " where it built " + labs[0],
    (k) => k.replace(/^(main :[^\n]*\n[^\n]*)/m, (l) => l.split("." + labs[0] + ",").join("." + labs[1] + ","))],
  ["dropped capture", "main's " + labs[0] + " tuple loses a field",
    (k) => k.replace(/^(main :[^\n]*\n[^\n]*)/m, (l) => l.replace(new RegExp("\\(\\." + labs[0] + ", \\(([^,()]+), "), "(." + labs[0] + ", ("))],
  ["two sites sharing a constructor", "Clo_U32_U32.arms drops the arm of " + labs[1],
    (k) => k.replace(/^(Clo_U32_U32\.arms :[^\n]*\n)([^\n]*)/m, (_, h, l) => {
      const out = l.replace(new RegExp("λ\\{\\." + labs[1] + ": [^;]*; "), "");
      return h + (out === l ? l : out.slice(0, -1));
    })],
  ["wrong apply signature", "apply_U32_U32's kernel type returns Nat",
    (k) => k.replace(/^(apply_U32_U32 : .*-> )U32 =$/m, "$1Nat =")],
];

let fails = 0;
const show = (what: string, how: string, g: Got): void => {
  const ok = g.stage !== "none";
  fails += ok ? 0 : 1;
  console.log((ok ? "REJECTED " : "ACCEPTED ") + what + " (" + how + "): recheck " + g.recheck + ", kernel " + g.kernel
    + ", caught by " + g.stage + "\n    " + g.rules.slice(0, 3).join("\n    "));
};
const muts: Array<[D.Mutation, string]> = [
  ["swap_captures", "swapped captures"],
  ["drop_capture", "a dropped capture"],
  ["share_ctor", "two sites sharing a constructor"],
  ["wrong_site", "a call routed to the wrong site"],
  ["change_body", "a changed body (x + 1 emitted as x + 2)"],
  ["wrong_apply_sig", "a wrong apply signature"],
  ["omit_def", "an omitted definition"],
];
for (const [m, what] of muts) {
  show(what, "translator mutation " + m, await stages(D.defun_translate(src, m)));
}
for (const [what, how, f] of kedits) {
  const k1 = f(k0);
  if (k1 === k0) {
    console.log("NOT APPLIED " + what + " (" + how + ")");
    fails += 1;
    continue;
  }
  show(what, "BendTT edit: " + how, await stages(good, () => k1));
}
console.log(fails === 0 ? "all mutants rejected" : String(fails) + " mutant(s) not rejected");
process.exit(fails === 0 && base.rules.length === 0 ? 0 : 1);
