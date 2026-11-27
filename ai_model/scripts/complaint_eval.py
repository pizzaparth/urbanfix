"""Complaint-level screening: choose tau_k (A4), measure flags and passes (A5), workload (A7), fairness (A11).

    python scripts/complaint_eval.py --tag pothole__yolov8n__s0

Definitions (paper Eqs. 3 and 5): a complaint holds 1 to 3 photos; s* is the
highest confidence over its photos; the complaint is flagged for review when
s* < tau_k.

Synthetic complaints are built from single photos of one set: photos are
shuffled (seed 0) and cut into complaints of 1, 2 or 3 photos (uniform, seed 0),
each photo used once.

- Valid complaints: photos that show the defect.
- Wrong-category complaints: photos from the other categories' splits.
- Unrelated complaints: COCO 2017 val photos (for litter, photos with a bottle,
  cup or wine glass are left out).
- Pothole only: road photos from RDD2022 without a pothole (other damage or none).

Rule for tau_k (A4), applied on validation data only (k's val split, the other
categories' val splits, half of the COCO photos): the largest tau on a 0.05 grid
from 0.05 to 0.90 whose false-flag rate on valid complaints is at most 20 %.
A false flag costs a supervisor one look; a false pass hides nothing, because
supervisors see every complaint, but it lets a wrong photo through unmarked.

All rates come with Wilson 95 % intervals. Output: results/complaints/<tag>.json
"""
from __future__ import annotations

import argparse
import json
import math
import random
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
GRID = [round(0.05 * k, 2) for k in range(1, 19)]
MAX_FALSE_FLAG = 0.20
SEED = 0


def wilson(k: int, n: int, z: float = 1.96) -> dict:
    if n == 0:
        return {"rate": None, "k": 0, "n": 0, "ci95": [None, None]}
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return {"rate": round(p, 4), "k": k, "n": n, "ci95": [round(max(0, c - h), 4), round(min(1, c + h), 4)]}


def complaints(rows: list[dict], seed: int = SEED) -> list[float]:
    """Group photos into complaints of 1 to 3 and return s* (max confidence) per complaint."""
    rng = random.Random(seed)
    rows = sorted(rows, key=lambda r: r["file"])
    rng.shuffle(rows)
    out, i = [], 0
    while i < len(rows):
        size = rng.randint(1, 3)
        out.append(max(r["max_conf"] for r in rows[i:i + size]))
        i += size
    return out


def flagged(s: list[float], tau: float) -> int:
    return sum(1 for x in s if x < tau)


def passed(s: list[float], tau: float) -> int:
    return sum(1 for x in s if x >= tau)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", required=True)
    args = ap.parse_args()
    sc = json.loads((RESULTS / "scores" / f"{args.tag}.json").read_text())
    cat, sets = sc["category"], sc["sets"]

    def pos(name):
        return [r for r in sets[name] if r["positive"]]

    def coco(name):
        return [r for r in sets[name] if not (cat.startswith("garbage_litter") and r.get("litter_like"))]

    others = sorted(k.split(":", 1)[1] for k in sets if k.startswith("other:"))
    val = {"valid": complaints(pos("val")),
           "wrong": complaints(sum((sets[f"other_val:{o}"] for o in others), [])),
           "unrelated": complaints(coco("coco_val"))}
    test = {"valid": complaints(pos("test")),
            "wrong": complaints(sum((sets[f"other:{o}"] for o in others), [])),
            "unrelated": complaints(coco("coco"))}
    if cat.startswith("pothole"):
        test["road_without_pothole"] = complaints([r for r in sets["test"] if not r["positive"]])

    sweep = []
    for tau in GRID:
        sweep.append({"tau": tau,
                      "false_flag": wilson(flagged(val["valid"], tau), len(val["valid"])),
                      "false_pass_wrong": wilson(passed(val["wrong"], tau), len(val["wrong"])),
                      "false_pass_unrelated": wilson(passed(val["unrelated"], tau), len(val["unrelated"]))})
    ok = [r["tau"] for r in sweep if r["false_flag"]["rate"] is not None and r["false_flag"]["rate"] <= MAX_FALSE_FLAG]
    tau = max(ok) if ok else GRID[0]

    def report(groups: dict, t: float) -> dict:
        out = {"valid_false_flag": wilson(flagged(groups["valid"], t), len(groups["valid"]))}
        for k, s in groups.items():
            if k != "valid":
                out[f"{k}_false_pass"] = wilson(passed(s, t), len(s))
        return out

    result = {"tag": args.tag, "category": cat, "rule": f"largest tau on {GRID[0]}..{GRID[-1]} (step 0.05) with "
              f"validation false-flag rate <= {MAX_FALSE_FLAG:.0%}", "tau": tau, "sweep_on_validation": sweep,
              "test": report(test, tau), "test_at_tau_0.25": report(test, 0.25),
              "image_level_test": {
                  "recall": wilson(sum(r["max_conf"] >= tau for r in pos("test")), len(pos("test"))),
                  "unrelated_pass": wilson(sum(r["max_conf"] >= tau for r in coco("coco")), len(coco("coco")))}}

    # External sets: valid complaints from photos of a different source (A3).
    result["external"] = {}
    for name in sets:
        if name in ("val", "test", "coco", "coco_val") or name.startswith("other"):
            continue
        s = complaints(pos(name))
        result["external"][name] = {"valid_false_flag": wilson(flagged(s, tau), len(s)),
                                    "image_recall": wilson(sum(r["max_conf"] >= tau for r in pos(name)), len(pos(name)))}

    # Fairness (A11): per country for potholes, India from the external set.
    if cat.startswith("pothole"):
        by = defaultdict(list)
        for r in pos("test"):
            by[r["stratum"]].append(r)
        india = [r for r in sets.get("pothole_rdd2022_india", []) if r["positive"]]
        if india:
            by["India (external, all)"] = india
        india_split = [r for r in sets.get("pothole_india_test_split", []) if r["positive"]]
        if india_split:
            by["India (test split of pothole_india)"] = india_split
        result["fairness_by_country"] = {
            c: {"image_recall": wilson(sum(r["max_conf"] >= tau for r in rows), len(rows)),
                "complaint_false_flag": wilson(flagged(complaints(rows), tau), len(complaints(rows)))}
            for c, rows in sorted(by.items())}

    # Workload (A7): per 100 complaints, for an assumed share of invalid complaints.
    ff = result["test"]["valid_false_flag"]["rate"] or 0.0
    fp_w = result["test"]["wrong_false_pass"]["rate"] or 0.0
    fp_u = result["test"]["unrelated_false_pass"]["rate"] or 0.0
    work = []
    for invalid in (0.05, 0.10, 0.20):
        valid_n, wrong_n, unrel_n = 100 * (1 - invalid), 100 * invalid / 2, 100 * invalid / 2
        flagged_n = valid_n * ff + wrong_n * (1 - fp_w) + unrel_n * (1 - fp_u)
        work.append({"assumed_invalid_share": invalid,
                     "flagged_per_100": round(flagged_n, 1),
                     "valid_among_flagged_per_100": round(valid_n * ff, 1),
                     "invalid_passed_unflagged_per_100": round(wrong_n * fp_w + unrel_n * fp_u, 1),
                     "complaints_needing_close_look_without_ai": 100})
    result["workload_simulation"] = {"note": "Simulation of supervisor workload, not a measure of staff decisions. "
                                             "Invalid complaints split evenly between wrong-category and unrelated.",
                                     "rows": work}

    (RESULTS / "complaints").mkdir(parents=True, exist_ok=True)
    (RESULTS / "complaints" / f"{args.tag}.json").write_text(json.dumps(result, indent=1))
    t = result["test"]
    print(args.tag, "tau", tau, "| false flag", t["valid_false_flag"]["rate"],
          "| wrong pass", t["wrong_false_pass"]["rate"], "| unrelated pass", t["unrelated_false_pass"]["rate"])


if __name__ == "__main__":
    main()
