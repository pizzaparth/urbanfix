"""Train one model on the leak-free splits (actions A2 and A8).

    python scripts/train.py pothole --model yolov8n --seed 0
    python scripts/train.py garbage_litter --model yolo11n --seed 0 --device mps

Data: data/v2/<category>/data.yaml (built by build_yolo_sets.py).
Checkpoint selection uses the validation split only; the test split is never
read here. Settings: 640 px, batch 16, COCO-pretrained weights, at most 40 epochs
with early stopping after 10 epochs without improvement. (The submitted paper used
60 and 15; the cap was lowered so that the laptop queue fits in 4 hours. Every
model in the comparison gets the same budget.) Litter is a segmentation task, so YOLO models use their -seg variant;
RT-DETR has no segmentation head and is trained on the boxes of the same labels.

Outputs:
    runs/v2/<category>/<model>_s<seed>/          Ultralytics run (git-ignored)
    weights/v2/<category>__<model>__s<seed>.pt   best checkpoint (git-ignored)
    results/train/<category>__<model>__s<seed>.json   settings, time, best epoch, val metrics
"""
from __future__ import annotations

import argparse
import csv
import json
import platform
import shutil
import time
from pathlib import Path

import torch
from ultralytics import RTDETR, YOLO

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
RUNS = ROOT / "runs" / "v2"
WEIGHTS = ROOT / "weights" / "v2"
RESULTS = ROOT / "results" / "train"

SEGMENT = {"garbage_litter"}
MODELS = ("yolov8n", "yolov8s", "yolo11n", "rtdetr-l")


def base_weights(model: str, category: str) -> str:
    if model.startswith("rtdetr"):
        return f"{model}.pt"
    return f"{model}-seg.pt" if category in SEGMENT else f"{model}.pt"


def default_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    return "mps" if torch.backends.mps.is_available() else "cpu"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("category", choices=["pothole", "garbage_litter", "graffiti"])
    ap.add_argument("--model", default="yolov8n", choices=MODELS)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--epochs", type=int, default=40)
    ap.add_argument("--patience", type=int, default=10)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--device", default=None)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--resume", action="store_true", help="continue an interrupted run from its last.pt")
    args = ap.parse_args()

    device = args.device if args.device is not None else default_device()
    data_yaml = DATA / args.category / "data.yaml"
    assert data_yaml.exists(), f"{data_yaml} missing: run scripts/build_yolo_sets.py first"
    name = f"{args.model}_s{args.seed}"
    tag = f"{args.category}__{args.model}__s{args.seed}"
    weights = base_weights(args.model, args.category)
    cls = RTDETR if args.model.startswith("rtdetr") else YOLO
    model = cls(weights)

    run = RUNS / args.category / name
    t0 = time.time()
    if args.resume and (run / "weights" / "last.pt").exists():
        cls(str(run / "weights" / "last.pt")).train(resume=True)
    else:
        model.train(
            data=str(data_yaml), epochs=args.epochs, imgsz=640, batch=args.batch, patience=args.patience,
            device=device, seed=args.seed, deterministic=False, workers=args.workers, plots=True,
            project=str(RUNS / args.category), name=name, exist_ok=True, verbose=False,
        )
    minutes = (time.time() - t0) / 60  # time of this session only when resumed
    WEIGHTS.mkdir(parents=True, exist_ok=True)
    best = WEIGHTS / f"{tag}.pt"
    shutil.copy(run / "weights" / "best.pt", best)

    rows = list(csv.DictReader(open(run / "results.csv")))
    rows = [{k.strip(): v for k, v in r.items()} for r in rows]
    key = "metrics/mAP50-95(M)" if "metrics/mAP50-95(M)" in rows[0] else "metrics/mAP50-95(B)"
    # Ultralytics selects best.pt by fitness = mAP50-95 on val (box, plus mask for segmentation).
    fit = [float(r["metrics/mAP50-95(B)"]) + (float(r[key]) if key.endswith("(M)") else 0) for r in rows]
    best_i = max(range(len(rows)), key=fit.__getitem__)
    val = {k: float(v) for k, v in rows[best_i].items() if k.startswith("metrics/")}

    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / f"{tag}.json").write_text(json.dumps({
        "category": args.category, "model": args.model, "base_weights": weights, "seed": args.seed,
        "task": "segment" if (args.category in SEGMENT and not args.model.startswith("rtdetr")) else "detect",
        "imgsz": 640, "batch": args.batch, "max_epochs": args.epochs, "patience": args.patience,
        "epochs_run": len(rows), "best_epoch": int(float(rows[best_i]["epoch"])),
        "train_minutes": round(minutes, 1), "device": str(device),
        "machine": f"{platform.platform()} / {platform.processor()}", "torch": torch.__version__,
        "val_metrics_at_best_epoch": val, "weights": str(best.relative_to(ROOT)),
    }, indent=1))
    print(tag, f"{minutes:.1f} min, best epoch {rows[best_i]['epoch']}", val)


if __name__ == "__main__":
    main()
