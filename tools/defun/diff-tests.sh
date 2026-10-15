#!/usr/bin/env bash
# Differential check of C006 phase 1: for every runnable closure test (a
# .bend file with `import Base` and a main, not a rejection test) whose
# --verdict is EMITTED TRANSLATION ACCEPTED BY KERNEL, the source's output
# on this fork (interp, c, js) must equal, lane by lane, the output of its
# emitted translation (tools/defun/translate.ts) run by upstream Bend.
# Evidence only (SPEC 7.3 T8): it proves nothing about other inputs.
# Usage: tools/defun/diff-tests.sh [FILE_OR_DIR...]  (default: tests/closure
#        and tests/closure/verdict)
# Env:   BEND_UPSTREAM  upstream Bend checkout (default ../bend)
set -u
root=$(cd "$(dirname "$0")/../.." && pwd)
up=${BEND_UPSTREAM:-$(cd "$root/../bend" && pwd)}
[ $# -gt 0 ] || set -- "$root/tests/closure" "$root/tests/closure/verdict"
export BEND_NO_TELEMETRY=1
export BUN_JSC_maxPerThreadStackUsage=33554432
work=$(mktemp -d "${TMPDIR:-/tmp}/defun-diff.XXXXXX")
trap 'rm -rf "$work"' EXIT
tidy() { awk '{sub(/[ \t]+$/, ""); l[NR]=$0} END{s=1; while (s<=NR && l[s]=="") s++;
  e=NR; while (e>=s && l[e]=="") e--; for (i=s; i<=e; i++) print l[i]}'; }
# a run under an external 120 s alarm (a hung program), its output and `exit N`
probe() { local out code; out=$(perl -e 'alarm 120; exec @ARGV' "$@" 2>&1); code=$?
  printf '%s\n' "$out"; [ $code -ne 0 ] && echo "exit $code"; return 0; }
# lane output of FILE under the Bend checkout ROOT
lane() { local r=$1 f=$2 l=$3 n; n=$(basename "$f" .bend)-$(basename "$r")
  case $l in
    interp) probe bun "$r/bend2/main.ts" "$f" ;;
    c) if out=$(bun "$r/bend2/main.ts" "$f" -o "$work/$n" 2>&1); then probe "$work/$n"; else printf '%s\nBUILD FAILED\n' "$out"; fi ;;
    js) if out=$(bun "$r/bend2/main.ts" "$f" -o "$work/$n.js" 2>&1); then probe bun "$work/$n.js"; else printf '%s\nBUILD FAILED\n' "$out"; fi ;;
  esac | tidy; }
files=()
for a in "$@"; do
  if [ -d "$a" ]; then while IFS= read -r f; do files+=("$f"); done < <(find "$a" -maxdepth 1 -name '*.bend' | sort)
  else files+=("$a"); fi
done
same=0 diff=0 skip=0
for f in "${files[@]}"; do
  f=$(cd "$(dirname "$f")" && pwd)/$(basename "$f")
  n=$(basename "$f" .bend)
  grep -q '^import Base$' "$f" && grep -qE '^def main\(' "$f" || { skip=$((skip+1)); continue; }
  grep '^#|' "$f" | head -1 | grep -qE '^#\|(SOME PROOFS FAIL|Error:)' && { skip=$((skip+1)); continue; }
  v=$( (cd "$(dirname "$f")" && bun "$root/bend2/main.ts" "$(basename "$f")" --verdict 2>&1) | head -1)
  if [ "$v" != "EMITTED TRANSLATION ACCEPTED BY KERNEL (callable-many closures defunctionalized)" ]; then
    echo "SKIP $n (verdict: $v)"; skip=$((skip+1)); continue
  fi
  t="$work/$n.bend"
  bun "$root/tools/defun/translate.ts" "$f" "$t" || { echo "DIFF $n: no translation"; diff=$((diff+1)); continue; }
  ok=1 msg=""
  for l in interp c js; do
    a=$(lane "$root" "$f" $l)
    b=$(lane "$up" "$t" $l)
    if [ "$a" != "$b" ]; then ok=0; msg="$msg
  $l: source [$(printf '%s' "$a" | head -3 | tr '\n' '|')] translation [$(printf '%s' "$b" | head -3 | tr '\n' '|')]"; fi
  done
  if [ $ok -eq 1 ]; then same=$((same+1)); echo "SAME $n (interp, c, js): $(printf '%s' "$a" | head -1 | cut -c1-60)"
  else diff=$((diff+1)); echo "DIFF $n$msg"; fi
done
echo "differential: $same same, $diff different, $skip skipped"
[ $diff -eq 0 ]
