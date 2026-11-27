"""Error analysis figure (A6): valid photos the model flags and unrelated photos it passes.

    python scripts/error_examples.py --tag pothole__yolov8n__s0

Top row: the 4 test photos that show the defect but get the lowest confidence
(they would be flagged at tau_k). Bottom row: the 4 wrong-category or unrelated
test photos with the highest confidence (they would pass at tau_k), with the
detection that made them pass drawn in red. tau_k comes from complaint_eval.py.

COCO photos keep their own Flickr licences. A COCO photo is drawn only when its
licence lets the figure be published under CC BY (Attribution, no known
copyright restriction, or US Government work); any other COCO photo among the
worst four is replaced by a grey tile that names its COCO id, so the selection
itself is unchanged and the reader can look the photo up. RDD2022, TACO and
STORM photos are CC BY 4.0 and are drawn.

Output: results/figures/errors_<category>.jpg (+ .json with sources and licences)
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from ultralytics import RTDETR, YOLO

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
TILE = 300
# COCO licence ids (instances_val2017.json "licenses"): 4 Attribution,
# 7 No known copyright restrictions, 8 United States Government Work.
COCO_REUSABLE = {4, 7, 8}
COCO_LICENCE = {1: "CC BY-NC-SA 2.0", 2: "CC BY-NC 2.0", 3: "CC BY-NC-ND 2.0", 4: "CC BY 2.0",
                5: "CC BY-SA 2.0", 6: "CC BY-ND 2.0", 7: "no known copyright restrictions",
                8: "US Government work"}


def font(size: int):
    for name in ("/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def tile(path: Path, caption: str, box=None) -> Image.Image:
    im = Image.open(path).convert("RGB")
    if box is not None:
        d = ImageDraw.Draw(im)
        d.rectangle(box, outline=(220, 30, 30), width=max(3, im.size[0] // 150))
    im.thumbnail((TILE, TILE - 30))
    t = Image.new("RGB", (TILE, TILE), "white")
    t.paste(im, ((TILE - im.size[0]) // 2, 0))
    ImageDraw.Draw(t).text((6, TILE - 26), caption, fill="black", font=font(15))
    return t


def withheld(caption: str, note: str) -> Image.Image:
    t = Image.new("RGB", (TILE, TILE), "white")
    d = ImageDraw.Draw(t)
    d.rectangle((25, 0, TILE - 26, TILE - 31), fill=(205, 205, 205))
    for k, line in enumerate(note.split("\n")):
        d.text((40, 100 + 24 * k), line, fill="black", font=font(16))
    d.text((6, TILE - 26), caption, fill="black", font=font(15))
    return t


def source(file: str, coco: dict) -> dict:
    """Dataset and licence of one photo, from its path."""
    if "coco_val2017" in file:
        c = coco[file]
        return {"dataset": "COCO 2017 val", "coco_id": c["coco_id"], "licence": COCO_LICENCE[c["license"]],
                "drawn": c["license"] in COCO_REUSABLE}
    name = "RDD2022" if "rdd2022" in file else "TACO" if "taco_" in file else "STORM graffiti" if "graffiti" in file else "unknown"
    return {"dataset": name, "licence": "CC BY 4.0" if name != "unknown" else "unknown", "drawn": name != "unknown"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", required=True)
    args = ap.parse_args()
    sc = json.loads((RESULTS / "scores" / f"{args.tag}.json").read_text())
    tau = json.loads((RESULTS / "complaints" / f"{args.tag}.json").read_text())["tau"]
    run = json.loads((RESULTS / "train" / f"{args.tag}.json").read_text())
    model = (RTDETR if run["model"].startswith("rtdetr") else YOLO)(str(ROOT / run["weights"]))

    valid = sorted([r for r in sc["sets"]["test"] if r["positive"]], key=lambda r: r["max_conf"])[:4]
    negs = [dict(r, kind="unrelated") for r in sc["sets"]["coco"]
            if not (sc["category"] == "garbage_litter" and r.get("litter_like"))]
    for k, rows in sc["sets"].items():
        if k.startswith("other:"):
            negs += [dict(r, kind=k.split(":")[1].replace("garbage_litter", "litter")) for r in rows]
    passed = sorted(negs, key=lambda r: -r["max_conf"])[:4]

    coco = {i["file"]: i for i in json.loads((ROOT / "splits" / "negatives" / "coco_val2017.json").read_text())["images"]}
    for r in valid + passed:
        r["source"] = source(r["file"], coco)

    tiles = [tile(ROOT / r["file"], f"valid, s*={r['max_conf']:.2f} < tau={tau}") for r in valid]
    for r in passed:
        cap = f"{r['kind']}, s*={r['max_conf']:.2f}"
        if not r["source"]["drawn"]:
            tiles.append(withheld(cap, f"COCO {r['source']['coco_id']}\n{r['source']['licence']}\nnot reproduced"))
            continue
        res = model.predict(str(ROOT / r["file"]), conf=0.001, imgsz=640, device="cpu", verbose=False)[0]
        box = None
        if res.boxes is not None and len(res.boxes):
            box = [round(v) for v in res.boxes.xyxy[int(res.boxes.conf.argmax())].tolist()]
        tiles.append(tile(ROOT / r["file"], cap, box))
    sheet = Image.new("RGB", (TILE * 4, TILE * 2), "white")
    for k, t in enumerate(tiles):
        sheet.paste(t, ((k % 4) * TILE, (k // 4) * TILE))
    out = RESULTS / "figures" / f"errors_{sc['category']}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=90)
    (out.with_suffix(".json")).write_text(json.dumps({
        "tag": args.tag, "tau": tau, "flagged_valid": [{"file": r["file"], "s_star": r["max_conf"], "source": r["source"]} for r in valid],
        "passed_negative": [{"file": r["file"], "kind": r["kind"], "s_star": r["max_conf"], "source": r["source"]}
                            for r in passed]}, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    main()
