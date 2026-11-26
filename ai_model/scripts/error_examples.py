"""Error analysis figure (A6): valid photos the model flags and unrelated photos it passes.

    python scripts/error_examples.py --tag pothole__yolov8n__s0

Top row: the 4 test photos that show the defect but get the lowest confidence
(they would be flagged at tau_k). Bottom row: the 4 wrong-category or unrelated
test photos with the highest confidence (they would pass at tau_k), with the
detection that made them pass drawn in red. tau_k comes from complaint_eval.py.

Output: results/figures/errors_<category>.jpg
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

    tiles = [tile(ROOT / r["file"], f"valid, s*={r['max_conf']:.2f} < tau={tau}") for r in valid]
    for r in passed:
        res = model.predict(str(ROOT / r["file"]), conf=0.001, imgsz=640, device="cpu", verbose=False)[0]
        box = None
        if res.boxes is not None and len(res.boxes):
            box = [round(v) for v in res.boxes.xyxy[int(res.boxes.conf.argmax())].tolist()]
        tiles.append(tile(ROOT / r["file"], f"{r['kind']}, s*={r['max_conf']:.2f}", box))
    sheet = Image.new("RGB", (TILE * 4, TILE * 2), "white")
    for k, t in enumerate(tiles):
        sheet.paste(t, ((k % 4) * TILE, (k // 4) * TILE))
    out = RESULTS / "figures" / f"errors_{sc['category']}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=90)
    (out.with_suffix(".json")).write_text(json.dumps({
        "tag": args.tag, "tau": tau, "flagged_valid": [{"file": r["file"], "s_star": r["max_conf"]} for r in valid],
        "passed_negative": [{"file": r["file"], "kind": r["kind"], "s_star": r["max_conf"]} for r in passed]}, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    main()
