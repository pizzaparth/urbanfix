"""Evaluate trained models once on their test and external test sets, with bootstrap CIs (A2, A3, A8, A11).

    python scripts/evaluate.py                       # every run in results/train/ not yet evaluated
    python scripts/evaluate.py --tags pothole__yolov8n__s0 --force

For each model and each set it reports precision, recall, mAP50 and mAP50-95
(box, and mask for segmentation models) with 95 % percentile bootstrap intervals
over images (1,000 resamples, seed 0). Per-image statistics are taken from the
Ultralytics validator, so point estimates equal `model.val()`; P and R are at the
confidence that maximises F1, as in Ultralytics. For the pothole test set the
metrics are also given per country (A11). CPU latency per image is measured
on 40 test images after 3 warm-up runs (batch 1, pre- and post-processing included).

Output: results/eval/<tag>.json
"""
from __future__ import annotations

import argparse
import json
import platform
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
from ultralytics import RTDETR, YOLO
from ultralytics.utils.metrics import ap_per_class

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
SPLITS = ROOT / "splits"
RESULTS = ROOT / "results"
BOOT = 1000


def link_name(rel: str) -> str:  # same rule as build_yolo_sets.py
    p = Path(rel)
    return f"{p.parent.parent.name}__{p.parent.name}__{p.name}".replace(" ", "_")


def collect(model, data_yaml: Path, device: str) -> tuple[list[dict], list[str]]:
    """Run validation on the test split and return per-image statistics and file names."""
    per_image: list[dict] = []
    state = {"files": None, "seen": 0}

    def on_batch_end(validator):
        stats = validator.metrics.stats
        n = len(stats["tp"])
        for i in range(state["seen"], n):
            per_image.append({k: v[i] for k, v in stats.items()})
        state["seen"] = n
        if state["files"] is None:
            state["files"] = list(validator.dataloader.dataset.im_files)

    model.callbacks["on_val_batch_end"] = [on_batch_end]
    model.val(data=str(data_yaml), split="test", imgsz=640, batch=16, device=device, conf=0.001,
              plots=False, verbose=False, save_json=False, project=str(ROOT / "runs" / "v2" / "_eval"),
              name="tmp", exist_ok=True)
    files = [Path(f).name for f in state["files"]]
    assert len(files) == len(per_image), (len(files), len(per_image))
    return per_image, files


def metrics_of(items: list[dict], tp_key: str) -> dict:
    tp = np.concatenate([d[tp_key] for d in items], 0)
    conf = np.concatenate([d["conf"] for d in items], 0)
    pred_cls = np.concatenate([d["pred_cls"] for d in items], 0)
    target_cls = np.concatenate([d["target_cls"] for d in items], 0)
    if len(target_cls) == 0:
        return {"precision": float("nan"), "recall": float("nan"), "mAP50": float("nan"), "mAP50-95": float("nan")}
    if len(conf) == 0:
        return {"precision": 0.0, "recall": 0.0, "mAP50": 0.0, "mAP50-95": 0.0}
    _, _, p, r, _, ap, *_ = ap_per_class(tp, conf, pred_cls, target_cls)
    if len(ap) == 0:
        return {"precision": 0.0, "recall": 0.0, "mAP50": 0.0, "mAP50-95": 0.0}
    return {"precision": float(p.mean()), "recall": float(r.mean()),
            "mAP50": float(ap[:, 0].mean()), "mAP50-95": float(ap.mean())}


def with_ci(items: list[dict], tp_key: str, seed: int = 0) -> dict:
    point = metrics_of(items, tp_key)
    rng = np.random.default_rng(seed)
    n = len(items)
    draws = defaultdict(list)
    for _ in range(BOOT):
        sample = [items[i] for i in rng.integers(0, n, n)]
        for k, v in metrics_of(sample, tp_key).items():
            draws[k].append(v)
    out = {}
    for k, v in point.items():
        arr = np.array(draws[k], dtype=float)
        arr = arr[~np.isnan(arr)]
        lo, hi = (np.percentile(arr, [2.5, 97.5]) if len(arr) else (float("nan"), float("nan")))
        out[k] = {"value": round(v, 4), "ci95": [round(float(lo), 4), round(float(hi), 4)]}
    return out


def evaluate_set(model, data_yaml: Path, task: str, device: str, strata: dict | None) -> dict:
    per_image, files = collect(model, data_yaml, device)
    n_obj = int(sum(len(d["target_cls"]) for d in per_image))
    res = {"images": len(per_image), "images_with_defect": int(sum(len(d["target_cls"]) > 0 for d in per_image)),
           "objects": n_obj, "box": with_ci(per_image, "tp")}
    if task == "segment":
        res["mask"] = with_ci(per_image, "tp_m")
    if strata:
        groups = defaultdict(list)
        for d, f in zip(per_image, files):
            groups[strata.get(f, "unknown")].append(d)
        res["by_stratum"] = {s: {"images": len(items), "box": with_ci(items, "tp")} for s, items in sorted(groups.items())}
    return res


def latency_ms(weights: Path, is_rtdetr: bool, images: list[Path]) -> float:
    m = (RTDETR if is_rtdetr else YOLO)(str(weights))
    for im in images[:3]:
        m.predict(str(im), imgsz=640, device="cpu", verbose=False)
    t0 = time.perf_counter()
    for im in images[:40]:
        m.predict(str(im), imgsz=640, device="cpu", verbose=False)
    return round((time.perf_counter() - t0) / min(40, len(images)) * 1000, 1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tags", nargs="*")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--latency-only", action="store_true",
                    help="only remeasure CPU latency of already evaluated runs (e.g. a model trained on Colab)")
    args = ap.parse_args()
    (RESULTS / "eval").mkdir(parents=True, exist_ok=True)
    if args.latency_only:
        for tag in args.tags or []:
            out = RESULTS / "eval" / f"{tag}.json"
            res = json.loads(out.read_text())
            imgs = sorted((DATA / res["category"] / "images" / "test").iterdir())
            res["cpu_latency_ms"] = latency_ms(ROOT / res["weights"], res["model"].startswith("rtdetr"), imgs)
            res["latency_machine"] = f"{platform.platform()} / {platform.processor()}"
            out.write_text(json.dumps(res, indent=1))
            print(tag, res["cpu_latency_ms"], "ms")
        return
    runs = sorted((RESULTS / "train").glob("*.json"))
    for run_file in runs:
        tag = run_file.stem
        if args.tags and tag not in args.tags:
            continue
        out = RESULTS / "eval" / f"{tag}.json"
        if out.exists() and not args.force:
            continue
        run = json.loads(run_file.read_text())
        cat, task = run["category"], run["task"]
        weights = ROOT / run["weights"]
        is_rtdetr = run["model"].startswith("rtdetr")
        model = (RTDETR if is_rtdetr else YOLO)(str(weights))

        strata = None
        if cat in ("pothole", "pothole_india"):
            spec = json.loads((SPLITS / f"{cat}.json").read_text())
            strata = {link_name(it["file"]): it["stratum"] for it in spec["splits"]["test"]}
        result = {"tag": tag, "category": cat, "model": run["model"], "seed": run["seed"], "task": task,
                  "weights": run["weights"], "bootstrap_resamples": BOOT,
                  "machine": f"{platform.platform()} / {platform.processor()}", "sets": {}}
        result["sets"]["test"] = evaluate_set(model, DATA / cat / "data.yaml", task, args.device, strata)
        for ext in sorted((SPLITS / "external").glob("*.json")):
            ext_cat = json.loads(ext.read_text())["category"]
            # The India-trained pothole model is tested on the Roboflow set only: India is in-domain for it.
            if ext_cat != cat and not (cat == "pothole_india" and ext.stem == "pothole_roboflow"):
                continue
            if not (DATA / "external" / ext.stem / "data.yaml").exists():
                print(f"{ext.stem}: not built on this machine, skipped")
                continue
            result["sets"][ext.stem] = evaluate_set(model, DATA / "external" / ext.stem / "data.yaml",
                                                    task, args.device, None)
        test_imgs = sorted((DATA / cat / "images" / "test").iterdir())
        result["cpu_latency_ms"] = latency_ms(weights, is_rtdetr, test_imgs)
        result["weights_mb"] = round(weights.stat().st_size / 1e6, 1)
        out.write_text(json.dumps(result, indent=1))
        t = result["sets"]["test"]["box"]
        print(tag, "test box mAP50", t["mAP50"], "latency", result["cpu_latency_ms"], "ms")


if __name__ == "__main__":
    main()
