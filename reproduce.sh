#!/usr/bin/env bash
# Rebuild the paper's tables from the committed result files and check that they
# match what is committed. Free tools only; nothing here needs a GPU.
#
#   ./reproduce.sh tables    model tables from ai_model/results/*.json (seconds, no download)
#   ./reproduce.sh privacy   Chicago 311 linkage analysis (about 18 MB download, a few minutes)
#   ./reproduce.sh load      load test of the API on this machine (minutes; numbers depend on the machine)
#   ./reproduce.sh all       tables, then privacy
#
# Training and evaluating the models needs the datasets and a GPU. That pipeline is
# described in ai_model/README.md and feedback/action.md (phase 3); its outputs are
# the JSON files that "tables" reads.
#
# PY selects the Python interpreter (default python3, 3.10 or later). "tables" and
# "privacy" need only the standard library; "load" needs Node.js 22.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-python3}

tables() {
  echo "== model tables: ai_model/scripts/summarize.py"
  (cd ai_model && "$PY" scripts/summarize.py)
  if git diff --quiet -- ai_model/results/phase3_summary.md; then
    echo "OK: ai_model/results/phase3_summary.md matches the committed result files"
  else
    git --no-pager diff --stat -- ai_model/results/phase3_summary.md
    echo "FAIL: the rebuilt tables differ from the committed ones" >&2
    return 1
  fi
}

privacy() {
  local dir=analysis/privacy
  if [ ! -f "$dir/data/chicago311_2024.csv" ]; then
    echo "== downloading Chicago 311 (2024) from the City of Chicago Data Portal"
    "$PY" "$dir/scripts/fetch_chicago311.py"
  fi
  echo "== linkage analysis: $dir/scripts/linkage_analysis.py"
  "$PY" "$dir/scripts/linkage_analysis.py"
  # The download time differs on every fetch; compare everything else.
  "$PY" - "$dir/results/linkage_chicago311.json" <<'PYCHECK'
import json, subprocess, sys
path = sys.argv[1]
new = json.loads(open(path).read())
old = json.loads(subprocess.run(["git", "show", f"HEAD:{path}"], capture_output=True, text=True, check=True).stdout)
same_data = new["source"].get("sha256") == old["source"].get("sha256")
new.pop("source"); old.pop("source")
if new == old:
    print("OK: linkage results match the committed ones" + ("" if same_data else
          " (the downloaded extract differs from the committed one, but no result changed)"))
else:
    print("FAIL: linkage results differ from the committed ones"
          + ("" if same_data else "; the City has updated the 2024 records since the committed download"), file=sys.stderr)
    sys.exit(1)
PYCHECK
}

load() {
  echo "== load test: backend/tests/load/run.js"
  (cd backend && npm ci --silent && npm run test:load)
  echo "Results are in backend/tests/load/results/. They describe this machine only."
}

case "${1:-tables}" in
  tables) tables ;;
  privacy) privacy ;;
  load) load ;;
  all) tables && privacy ;;
  *) sed -n '2,17p' "$0"; exit 2 ;;
esac
