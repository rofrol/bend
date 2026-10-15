// Prints (or writes to OUT) the C006 phase-1 defunctionalization of a Bend
// file with callable-many closures, as a Bend program upstream Bend runs.
// Usage: bun tools/defun/translate.ts FILE.bend [OUT.bend] [--mutate NAME]
import * as fs from "node:fs";
import * as B from "../../bend2/bend.ts";
import * as D from "../../bend2/defun.ts";

const args = process.argv.slice(2);
const mi = args.indexOf("--mutate");
const mutate = mi >= 0 ? args.splice(mi, 2)[1] as D.Mutation : undefined;
const [file, out] = args;
const book = B.book_nil();
try {
  await B.book_load(book, file, "", new Map());
  B.book_valid(book);
  const text = D.defun_translate(book, mutate);
  if (out === undefined) {
    process.stdout.write(text);
  } else {
    fs.writeFileSync(out, text);
  }
} catch (e) {
  if (e instanceof D.Refusal) {
    process.stderr.write("REFUSED: " + e.why + "\n");
    process.exit(3);
  }
  const err = e as B.Err;
  process.stderr.write((err?.$ === "Err" ? B.err_show(err) : String(e)) + "\n");
  process.exit(1);
}
