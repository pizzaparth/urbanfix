#!/usr/bin/env bash
# A8 ablations on the laptop, run after the main queue (same 40-epoch budget and splits):
#   (a) graffiti YOLOv8n trained from scratch (no COCO weights) vs the pretrained graffiti YOLOv8n
#   (b) litter YOLOv8n on TACO's 28 super-categories, scored as one class, vs the merged-class model
#   nohup scripts/run_ablations.sh > logs/ablations.log 2>&1 &
set -u
cd "$(dirname "$0")/.."
PY=${PY:-../ai_service/.venv/bin/python}
while pgrep -f "run_queue.sh" > /dev/null || pgrep -f "scripts/train.py" > /dev/null; do sleep 30; done
[ -d data/v2/garbage_litter_super ] || "$PY" scripts/build_litter_supercategories.py
for job in "graffiti yolov8n-scratch 0" "garbage_litter_super yolov8n 0"; do
  read -r cat model seed <<< "$job"
  tag="${cat}__${model}__s${seed}"
  if [ -f "results/train/${tag}.json" ]; then echo "skip ${tag} (done)"; continue; fi
  echo "$(date '+%F %T') start ${tag}"
  "$PY" scripts/train.py "$cat" --model "$model" --seed "$seed" > "logs/${tag}.log" 2>&1
  echo "$(date '+%F %T') end ${tag} exit $?"
done
echo "$(date '+%F %T') ablations done"
