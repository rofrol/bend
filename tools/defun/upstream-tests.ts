// C006c tests: the kernel's input comes only from the pinned, unmodified
// upstream elaborator (bend2/defun_upstream.ts, bend2/upstream/).
//  1. the manifest hashes match the vendored files, and (when the pristine
//     checkout is at hand) upstream's git objects at UPSTREAM_REV;
//  2. a tampered vendored file: the hash check refuses, before any use;
//  3. upstream rejecting a translation: refused;
//  4. this fork's elaborator mutated through the test hook: the tripwire
//     refuses, and the unhooked kernel input is upstream's bytes.
// Usage: bun tools/defun/upstream-tests.ts   (Env: BEND_UPSTREAM, default ../bend)
import * as child from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as B from "../../bend2/bend.ts";
import * as D from "../../bend2/defun.ts";
import * as Safe from "../../bend2/safe.ts";
import * as U from "../../bend2/defun_upstream.ts";

let fails = 0;
const ok = (good: boolean, what: string): void => {
  console.log((good ? "PASS " : "FAIL ") + what);
  fails += good ? 0 : 1;
};
const refused = (f: () => unknown): string | null => {
  try {
    f();
    return null;
  } catch (e) {
    if (e instanceof U.UpstreamRefusal) {
      return e.why;
    }
    throw e;
  }
};

// 1
ok(U.upstream_verify() === null, "the vendored files hash as the manifest pins them");
const up = process.env.BEND_UPSTREAM ?? path.join(import.meta.dir, "../../../bend");
if (fs.existsSync(path.join(up, ".git"))) {
  const man = fs.readFileSync(path.join(U.UPSTREAM_DIR, "MANIFEST.sha256"), "utf8").split("\n")
    .filter((l) => /^[0-9a-f]{64}  /.test(l));
  for (const l of man) {
    const [h, f] = l.split("  ");
    const rel = "bend2/" + path.normalize(path.join("upstream", f)).replace(/^upstream\//, "").replace(/^\.\.\//, "");
    const blob = child.execFileSync("git", ["-C", up, "show", U.UPSTREAM_REV + ":" + rel]);
    ok(U.sha256(blob) === h, "the manifest's " + f + " is upstream's " + rel + " at " + U.UPSTREAM_REV.slice(0, 8));
  }
} else {
  console.log("SKIP the comparison with upstream's git objects (no checkout at " + up + ")");
}

// 2
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bend-c006c-"));
try {
  const td = path.join(tmp, "upstream");
  fs.cpSync(U.UPSTREAM_DIR, td, { recursive: true });
  fs.copyFileSync(path.join(U.UPSTREAM_DIR, "../bendtt.lean"), path.join(tmp, "bendtt.lean"));
  ok(U.upstream_verify(td) === null, "an exact copy of the vendored dir verifies");
  fs.appendFileSync(path.join(td, "safe.ts"), "\n// tampered\n");
  const prog = path.join(tmp, "p.bend");
  fs.writeFileSync(prog, "import Base\n\ndef main() -> U32:\n  3\n");
  const why = refused(() => U.upstream_elaborate(prog, td));
  ok(why !== null && why.includes("safe.ts hashes to"), "a tampered vendored safe.ts is refused: " + why?.split("\n")[0]);

  // 3
  const bad = path.join(tmp, "closure.bend");
  fs.writeFileSync(bad, "import Base\n\ndef main() -> U32:\n  m : U32 *-> U32 = *x => x\n  m(3)\n");
  const w3 = refused(() => U.upstream_elaborate(bad));
  ok(w3 !== null && w3.startsWith("upstream 014ccd03 refuses"), "upstream refuses a translation it cannot check (fork syntax left in)");
  const ill = path.join(tmp, "ill.bend");
  fs.writeFileSync(ill, "import Base\n\ndef main() -> U32:\n  True{}\n");
  ok(refused(() => U.upstream_elaborate(ill)) !== null, "upstream refuses an ill-typed translation");
  ok(U.upstream_elaborate(prog).includes("main : U32"), "upstream elaborates a good program");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// 4
const file = path.join(import.meta.dir, "mutation_base.bend");
const book = B.book_nil();
await B.book_load(book, file, "", new Map());
B.book_valid(book);
const good = await Safe.safe_defun(book);
const d2 = fs.mkdtempSync(path.join(os.tmpdir(), "bend-c006c-"));
try {
  const f2 = path.join(d2, "t.bend");
  fs.writeFileSync(f2, good.bend);
  ok(good.text === U.upstream_elaborate(f2), "the kernel input is upstream's elaboration of the translation, byte for byte");
} finally {
  fs.rmSync(d2, { recursive: true, force: true });
}
const hooks: Array<[string, (t: string) => string]> = [
  ["a changed literal", (t) => t.replace("U32.lit1", "U32.lit2")],
  ["a dropped def", (t) => t.replace(/^twice :[^\n]*\n[^\n]*\n/m, "")],
  ["one more byte", (t) => t + " "],
];
for (const [what, f] of hooks) {
  let why: string | null = null;
  try {
    await Safe.safe_defun(book, { fork: f });
  } catch (e) {
    why = e instanceof D.Refusal ? e.why : String(e);
  }
  ok(why !== null && why.startsWith("tripwire"), "this fork's elaborator mutated (" + what + ") is refused by the tripwire");
}
console.log(fails === 0 ? "upstream tests: all passed" : "upstream tests: " + String(fails) + " failed");
process.exit(fails === 0 ? 0 : 1);
