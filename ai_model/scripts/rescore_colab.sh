#!/usr/bin/env bash
# Re-evaluate and re-score models trained on Colab, once the laptop is free, so that they are
# measured on the same sets as the laptop models (the other categories' photos and the Roboflow
# pothole set are not on Colab). CPU latency is measured by evaluate.py on the otherwise idle laptop.
#   nohup scripts/rescore_colab.sh pothole__yolo11n__s0 > logs/rescore_colab.log 2>&1 &
# The Colab originals are kept in data/raw/colab/original_results/.
set -u
cd "$(dirname "$0")/.."
PY=${PY:-../ai_service/.venv/bin/python}
while pgrep -f "run_postqueue.sh" > /dev/null || pgrep -f "scripts/train.py" > /dev/null; do sleep 30; done
for T in "$@"; do
  echo "$(date '+%F %T') re-score $T"
  "$PY" scripts/evaluate.py --tags "$T" --force && "$PY" scripts/score_images.py --tags "$T" --force \
    && "$PY" scripts/complaint_eval.py --tag "$T"
  echo "$(date '+%F %T') end $T exit $?"
done
"$PY" scripts/summarize.py
