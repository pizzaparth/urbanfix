"""Class-merge ablation (A8b): litter labels with TACO's super-categories instead of one merged class.

    python scripts/build_litter_supercategories.py

Builds data/v2/garbage_litter_super/ with exactly the images and split of
splits/garbage_litter.json, but each polygon labelled with its TACO
super-category (28 classes, e.g. Bottle, Can, Plastic bag & wrapper). The model
trained on it is scored as one "litter" class (evaluate.py uses single_cls), so
it is compared with the merged-class model on identical images and polygons.

TACO annotations: github.com/pedropro/TACO data/annotations.json, pinned to the
commit below. Image files in data/garbage_litter were oriented and resized to
match the annotation's width and height when they were prepared, so polygons
are normalised by the annotation's width and height, as for the merged labels.
"""
from __future__ import annotations

import json
import os
import shutil
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "v2" / "garbage_litter_super"
ANN = ROOT / "data" / "raw" / "taco" / "annotations.json"
COMMIT = "3844bcd3535cd12ec0218494d1d79f1372f553cc"
URL = f"https://raw.githubusercontent.com/pedropro/TACO/{COMMIT}/data/annotations.json"


def link_name(rel: str) -> str:  # same rule as build_yolo_sets.py
    p = Path(rel)
    return f"{p.parent.parent.name}__{p.parent.name}__{p.name}".replace(" ", "_")


def main() -> None:
    if not ANN.exists():
        ANN.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(URL, headers={"User-Agent": "urbanfix-research"})
        ANN.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    coco = json.loads(ANN.read_text())
    supers = sorted({c["supercategory"] for c in coco["categories"]})
    super_of = {c["id"]: supers.index(c["supercategory"]) for c in coco["categories"]}
    images = {im["id"]: im for im in coco["images"]}
    anns = defaultdict(list)
    for a in coco["annotations"]:
        anns[a["image_id"]].append(a)

    spec = json.loads((ROOT / "splits" / "garbage_litter.json").read_text())
    if OUT.exists():
        shutil.rmtree(OUT)
    stats = {}
    for split, items in spec["splits"].items():
        (OUT / "images" / split).mkdir(parents=True)
        (OUT / "labels" / split).mkdir(parents=True)
        n_obj = 0
        for it in items:
            image_id = int(Path(it["file"]).stem.split("_")[1])
            im = images[image_id]
            W, H = im["width"], im["height"]
            name = link_name(it["file"])
            os.symlink(ROOT / it["file"], OUT / "images" / split / name)
            lines = []
            for a in anns.get(image_id, []):
                for poly in a["segmentation"] if isinstance(a["segmentation"], list) else []:
                    if len(poly) < 6:
                        continue
                    pts = " ".join(f"{min(max(poly[k] / W, 0), 1):.5f} {min(max(poly[k + 1] / H, 0), 1):.5f}"
                                   for k in range(0, len(poly) - 1, 2))
                    lines.append(f"{super_of[a['category_id']]} {pts}")
            n_obj += len(lines)
            (OUT / "labels" / split / f"{Path(name).stem}.txt").write_text("".join(l + "\n" for l in lines))
        stats[split] = {"images": len(items), "objects": n_obj}
    names = ", ".join(json.dumps(s) for s in supers)
    (OUT / "data.yaml").write_text(f"path: {OUT}\ntrain: images/train\nval: images/val\ntest: images/test\nnames: [{names}]\n")
    print(len(supers), "super-categories;", stats)


if __name__ == "__main__":
    main()
