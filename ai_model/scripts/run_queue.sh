#!/usr/bin/env bash
# Phase 3 training queue for the laptop (A2 and A8), limited to BUDGET_MIN minutes.
# A job is skipped when its results/train/<tag>.json already exists (restart-safe),
# and a job is not started when its estimated time would end past the budget.
# Seeds 1 and 2, YOLOv8s and RT-DETR-l run on Colab (notebooks/colab_train.ipynb).
#
#   nohup scripts/run_queue.sh > logs/queue.log 2>&1 &
set -u
cd "$(dirname "$0")/.."
PY=${PY:-../ai_service/.venv/bin/python}
BUDGET_MIN=${BUDGET_MIN:-240}

# category model seed estimated-minutes (40 epochs on the M5; measured 70 s/epoch for pothole)
JOBS=(
  "pothole yolov8n 0 47" "garbage_litter yolov8n 0 37" "graffiti yolov8n 0 20"
  "pothole yolo11n 0 52" "garbage_litter yolo11n 0 41" "graffiti yolo11n 0 22"
)

start=$(date +%s)
for job in "${JOBS[@]}"; do
  read -r cat model seed est <<< "$job"
  tag="${cat}__${model}__s${seed}"
  while pgrep -f "scripts/train.py" > /dev/null; do sleep 30; done
  if [ -f "results/train/${tag}.json" ]; then echo "skip ${tag} (done)"; continue; fi
  used=$(( ($(date +%s) - start) / 60 ))
  if [ $(( used + est )) -gt "$BUDGET_MIN" ]; then
    echo "$(date '+%F %T') skip ${tag}: ${used} min used, about ${est} min needed, budget ${BUDGET_MIN} min"
    continue
  fi
  echo "$(date '+%F %T') start ${tag}"
  "$PY" scripts/train.py "$cat" --model "$model" --seed "$seed" > "logs/${tag}.log" 2>&1
  echo "$(date '+%F %T') end ${tag} exit $?"
done
echo "$(date '+%F %T') queue done after $(( ($(date +%s) - start) / 60 )) min"
