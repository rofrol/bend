// Defun upstream
// ==============
// C006c (this fork only): the kernel checks only BendTT text that the
// pinned, unmodified upstream elaborator produced from the validated
// translation. bend2/upstream/ holds exact copies of upstream's bend.ts,
// safe.ts and base.bend at UPSTREAM_REV; MANIFEST.sha256 pins them, and
// the kernel source bend2/bendtt.lean, by SHA-256, verified before every
// use (a mismatch refuses). Vendoring, not calling a checkout elsewhere:
// the fork then needs no other tree at a path and revision that can move,
// and the copy is three files, checked by hash.
//
// The elaboration runs in its own process (this file run as a script, the
// driver): it verifies the manifest, imports the copies, and does what
// upstream's `bend FILE -o x.bendtt` does (book_load, book_valid, no
// holes, safe_emit), on the translation file the caller wrote once into
// a private directory, into a fresh output path; it prints the SHA-256 of
// the translation it read and of the text it wrote, which the caller
// checks against the bytes it wrote and reads back. Any failure refuses.

import * as child from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as url from "node:url";

export const UPSTREAM_REV = "014ccd03c43270c151f46679075f7f04593077ea";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));

export const UPSTREAM_DIR = path.join(HERE, "upstream");

export class UpstreamRefusal {
  constructor(readonly why: string) {}
}

export function sha256(b: Buffer | string): string {
  return crypto.createHash("sha256").update(b).digest("hex");
}

// null when every file of the manifest in dir hashes as pinned, else why
export function upstream_verify(dir: string = UPSTREAM_DIR): string | null {
  let man: string;
  try {
    man = fs.readFileSync(path.join(dir, "MANIFEST.sha256"), "utf8");
  } catch {
    return "no manifest in " + dir;
  }
  const lines = man.split("\n").filter((l) => l.trim() !== "" && !l.startsWith("#"));
  if (lines.length === 0) {
    return "an empty manifest in " + dir;
  }
  for (const l of lines) {
    const m = /^([0-9a-f]{64})  (\S+)$/.exec(l);
    if (m === null) {
      return "a malformed manifest line: " + l;
    }
    let got: string;
    try {
      got = sha256(fs.readFileSync(path.join(dir, m[2])));
    } catch {
      return "a pinned file is missing: " + m[2];
    }
    if (got !== m[1]) {
      return "the pinned file " + m[2] + " hashes to " + got + ", not " + m[1] + " (upstream " + UPSTREAM_REV.slice(0, 8) + ")";
    }
  }
  return null;
}

// the BendTT text the pinned upstream elaborator gives for a Bend file
// (the caller's private, written-once translation); throws an
// UpstreamRefusal
export function upstream_elaborate(file: string, dir: string = UPSTREAM_DIR): string {
  const bad = upstream_verify(dir);
  if (bad !== null) {
    throw new UpstreamRefusal("the pinned upstream elaborator does not verify: " + bad);
  }
  const want = sha256(fs.readFileSync(file));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bend-upstream-"));
  try {
    const out = path.join(tmp, "out.bendtt");
    const log = path.join(tmp, "log");
    const fd = fs.openSync(log, "wx");
    let got: child.SpawnSyncReturns<Buffer>;
    try {
      got = child.spawnSync(process.execPath, [url.fileURLToPath(import.meta.url), dir, file, out],
        { stdio: ["ignore", fd, fd], env: { ...process.env, BEND_NO_TELEMETRY: "1" } });
    } finally {
      fs.closeSync(fd);
    }
    const text = fs.readFileSync(log, "utf8");
    if (got.error || got.signal || got.status !== 0) {
      throw new UpstreamRefusal("upstream " + UPSTREAM_REV.slice(0, 8) + " refuses the translation:\n"
        + (text.trim() || got.error?.message || "exit " + String(got.status ?? got.signal)));
    }
    const m = /^OK ([0-9a-f]{64}) ([0-9a-f]{64})$/m.exec(text);
    const kt = fs.existsSync(out) ? fs.readFileSync(out) : null;
    if (m === null || kt === null || m[1] !== want || m[2] !== sha256(kt) || want !== sha256(fs.readFileSync(file))) {
      throw new UpstreamRefusal("the upstream elaboration did not report the translation and text it was given and wrote");
    }
    return kt.toString("utf8");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// the driver: bun defun_upstream.ts DIR IN.bend OUT.bendtt
async function driver(dir: string, inp: string, out: string): Promise<number> {
  const bad = upstream_verify(dir);
  if (bad !== null) {
    process.stderr.write("the pinned upstream elaborator does not verify: " + bad + "\n");
    return 3;
  }
  const src = fs.readFileSync(inp);
  const B = await import(path.join(dir, "bend.ts"));
  const S = await import(path.join(dir, "safe.ts"));
  const book = B.book_nil();
  try {
    await B.book_load(book, inp, "", new Map());
    B.book_valid(book);
  } catch (e) {
    process.stderr.write((e?.$ === "Err" ? B.err_show(e) : String(e)) + "\n");
    return 1;
  }
  if (book.hols > 0) {
    process.stderr.write("the translation has holes\n");
    return 1;
  }
  if (fs.existsSync(out)) {
    process.stderr.write("the output path exists already\n");
    return 1;
  }
  const oos: string[] = S.safe_emit(book, out);
  if (oos.length !== 0) {
    process.stderr.write("out of the kernel's scope:\n" + oos.join(""));
    return 1;
  }
  process.stdout.write("OK " + sha256(src) + " " + sha256(fs.readFileSync(out)) + "\n");
  return 0;
}

if (import.meta.main) {
  const [dir, inp, out] = process.argv.slice(2);
  process.exitCode = await driver(dir, inp, out);
}
