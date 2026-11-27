#!/usr/bin/env bash
# Laptop work after the ablations: evaluate the two ablation models, then re-score the
# RT-DETR models trained on Colab with the photos Colab does not have (the other categories'
# splits, the Roboflow pothole set), then measure CPU latency of every model on the idle laptop.
#   nohup scripts/run_postqueue.sh > logs/postqueue.log 2>&1 &
# The Colab originals of every overwritten file are kept in data/raw/colab/original_results/.
set -u
cd "$(dirname "$0")/.."
PY=${PY:-../ai_service/.venv/bin/python}
while pgrep -f "run_ablations.sh" > /dev/null || pgrep -f "scripts/train.py" > /dev/null; do sleep 30; done
log() { echo "$(date '+%F %T') $*"; }

for T in graffiti__yolov8n-scratch__s0 garbage_litter_super__yolov8n__s0; do
  log "evaluate $T"
  "$PY" scripts/evaluate.py --tags "$T" && "$PY" scripts/score_images.py --tags "$T" \
    && "$PY" scripts/complaint_eval.py --tag "$T"
  log "end $T exit $?"
done

# RT-DETR: the GPU is free now, so score on MPS (CPU took close to 2 hours per model).
for T in graffiti__rtdetr-l__s0 garbage_litter__rtdetr-l__s0 pothole__rtdetr-l__s0; do
  log "re-score $T"
  if [ "$T" = pothole__rtdetr-l__s0 ]; then
    "$PY" scripts/evaluate.py --tags "$T" --force --device mps || "$PY" scripts/evaluate.py --tags "$T" --force
  fi
  "$PY" scripts/score_images.py --tags "$T" --force --device mps || "$PY" scripts/score_images.py --tags "$T" --force
  "$PY" scripts/complaint_eval.py --tag "$T"
  log "end $T exit $?"
done

log "CPU latency on the idle laptop"
"$PY" scripts/evaluate.py --latency-only --tags $(ls results/eval | sed 's/\.json$//')
"$PY" scripts/summarize.py
log "postqueue done"
