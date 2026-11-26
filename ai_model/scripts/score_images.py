"""Score every image a model may be asked about, the way the vision service does (A4 to A7, A11).

    python scripts/score_images.py                     # every trained run not yet scored
    python scripts/score_images.py --tags pothole__yolov8n__s0

For one photo the service runs `model.predict(image, conf=tau)` at 640 px and
uses the highest confidence (s* in Eq. 3); a complaint is flagged when s* < tau
(Eq. 5). So the highest confidence per image, computed once at conf=0.001, is
all the complaint-level evaluation needs for any tau.

Sets scored for a model of category k:
    val        k's validation split (used to choose tau_k, A4)
    test       k's test split
    <external> k's external test sets
    other_val:<j>, other:<j>   the val and test splits of the other categories (wrong-category photos)
    coco_val, coco             two halves of 1,000 COCO 2017 val photos (unrelated photos);
                               only the *_val sets may be used to choose tau

Output: results/scores/<tag>.json  {set: [{"file", "positive", "stratum", "max_conf"}]}
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from ultralytics import RTDETR, YOLO

ROOT = Path(__file__).resolve().parents[1]
SPLITS = ROOT / "splits"
RESULTS = ROOT / "results"
CATEGORIES = ("pothole", "garbage_litter", "graffiti")


def sets_for(cat: str) -> dict[str, list[dict]]:
    spec = json.loads((SPLITS / f"{cat}.json").read_text())
    out = {"val": spec["splits"]["val"], "test": spec["splits"]["test"]}
    for ext in sorted((SPLITS / "external").glob("*.json")):
        e = json.loads(ext.read_text())
        if e["category"] == cat:
            out[ext.stem] = e["test"]
    for other in CATEGORIES:
        if other != cat:
            other_spec = json.loads((SPLITS / f"{other}.json").read_text())["splits"]
            out[f"other_val:{other}"] = other_spec["val"]
            out[f"other:{other}"] = other_spec["test"]
    coco = SPLITS / "negatives" / "coco_val2017.json"
    if coco.exists():
        ims = json.loads(coco.read_text())["images"]
        # Half of the COCO photos (even position) may be used to choose tau, the other half only to report.
        for half, name in ((0, "coco_val"), (1, "coco")):
            out[name] = [{"file": im["file"], "positive": False, "stratum": "coco", "litter_like": im["litter_like"]}
                         for k, im in enumerate(ims) if k % 2 == half]
    return out


def score(model, items: list[dict], device: str) -> list[dict]:
    items = [it for it in items if (ROOT / it["file"]).exists()]  # sources missing on this machine
    files = [str(ROOT / it["file"]) for it in items]
    rows = []
    for k in range(0, len(files), 32):
        for it, res in zip(items[k:k + 32],
                           model.predict(files[k:k + 32], conf=0.001, imgsz=640, device=device,
                                         verbose=False, stream=True)):
            confs = res.boxes.conf.tolist() if res.boxes is not None else []
            row = {"file": it["file"], "positive": bool(it.get("positive", False)),
                   "stratum": it.get("stratum", "all"), "max_conf": round(max(confs), 5) if confs else 0.0}
            if "litter_like" in it:
                row["litter_like"] = it["litter_like"]
            rows.append(row)
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tags", nargs="*")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--device", default="cpu")
    args = ap.parse_args()
    (RESULTS / "scores").mkdir(parents=True, exist_ok=True)
    for run_file in sorted((RESULTS / "train").glob("*.json")):
        tag = run_file.stem
        if args.tags and tag not in args.tags:
            continue
        out = RESULTS / "scores" / f"{tag}.json"
        if out.exists() and not args.force:
            continue
        run = json.loads(run_file.read_text())
        model = (RTDETR if run["model"].startswith("rtdetr") else YOLO)(str(ROOT / run["weights"]))
        result = {"tag": tag, "category": run["category"], "model": run["model"], "seed": run["seed"], "sets": {}}
        for name, items in sets_for(run["category"]).items():
            result["sets"][name] = score(model, items, args.device)
            print(tag, name, len(items))
        out.write_text(json.dumps(result))


if __name__ == "__main__":
    main()
