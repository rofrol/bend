#!/usr/bin/env bash
# Runs `bend FILE --verdict` on each test file (default: tests/closure/verdict)
# and compares its output, stdout and stderr together plus `exit N` when it
# is not 0, with the file's trailing `#|` lines (the gate's format).
# Usage: tools/defun/verdict-tests.sh [--write] [FILE_OR_DIR...]
#   --write  replace each file's `#|` lines with what it printed (review the
#            diff before committing)
set -u
root=$(cd "$(dirname "$0")/../.." && pwd)
write=0
if [ "${1:-}" = "--write" ]; then write=1; shift; fi
[ $# -gt 0 ] || set -- "$root/tests/closure/verdict"
export BEND_NO_TELEMETRY=1
export BUN_JSC_maxPerThreadStackUsage=33554432
tidy() { awk '{sub(/[ \t]+$/, ""); l[NR]=$0} END{s=1; while (s<=NR && l[s]=="") s++;
  e=NR; while (e>=s && l[e]=="") e--; for (i=s; i<=e; i++) print l[i]}'; }
files=()
for a in "$@"; do
  if [ -d "$a" ]; then while IFS= read -r f; do files+=("$f"); done < <(find "$a" -maxdepth 1 -name '*.bend' | sort)
  else files+=("$a"); fi
done
pass=0 fail=0
for f in "${files[@]}"; do
  # an external bound on a hung run (the kernel's first build excepted:
  # run once beforehand), as the upstream gate's alarm
  got=$( (cd "$(dirname "$f")" && perl -e 'alarm 300; exec @ARGV' bun "$root/bend2/main.ts" "$(basename "$f")" --verdict 2>&1; c=$?; [ $c -ne 0 ] && echo "exit $c") | tidy)
  if [ $write -eq 1 ]; then
    body=$(grep -v '^#|' "$f" | tidy)
    { printf '%s\n\n' "$body"; printf '%s\n' "$got" | sed 's/^/#|/'; } > "$f"
    echo "WROTE $f"; continue
  fi
  want=$(grep '^#|' "$f" | sed 's/^#|//' | tidy)
  if [ "$got" = "$want" ]; then pass=$((pass+1)); echo "PASS verdict $f"
  else
    fail=$((fail+1)); echo "FAIL verdict $f"
    diff <(printf '%s\n' "$want") <(printf '%s\n' "$got") | sed 's/^/    /' | head -20
  fi
done
[ $write -eq 1 ] && exit 0
echo "verdict: $pass passed, $fail failed"
[ $fail -eq 0 ]
