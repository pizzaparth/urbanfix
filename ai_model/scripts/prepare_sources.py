"""Rebuild the TACO and STORM working folders from their public sources (for a fresh machine such as Colab).

    python scripts/prepare_sources.py            # TACO official + STORM
    python scripts/prepare_sources.py --only storm

The split lists in splits/ name files such as data/garbage_litter/images/train/taco_0001.jpg
and data/graffiti/images/val/IMG_1251.jpg. This script recreates exactly those files with the
conversion of notebooks 00, 02 and 04 of the submitted paper (TACO: 640-px Flickr copy when
available, else the original; orientation matched to the annotation; resized to at most
1280 px; JPEG quality 90; one "Litter" class from every polygon. STORM: images copied, boxes
from the CSV files). Each image goes to the folder the split lists record, so the lists stay
valid even if a different set of TACO photos can be downloaded today.

RDD2022, TACO unofficial and COCO have their own fetch_*.py scripts. The Roboflow pothole
set needs a Roboflow account and is skipped on machines without it.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import csv
import io
import json
import tarfile
import urllib.request
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SPLITS = ROOT / "splits"
TACO_ANN = "https://raw.githubusercontent.com/pedropro/TACO/master/data/annotations.json"
STORM = "https://zenodo.org/api/records/3238357/files/{}/content"


def get(url: str, timeout: int = 300) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "urbanfix-research"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def wanted_paths(category: str) -> dict[str, Path]:
    """Map file name -> path recorded in the split lists (in-domain splits only)."""
    spec = json.loads((SPLITS / f"{category}.json").read_text())
    return {Path(it["file"]).name: ROOT / it["file"] for items in spec["splits"].values() for it in items}


def prepare_taco() -> None:
    targets = wanted_paths("garbage_litter")
    coco = json.loads(get(TACO_ANN))
    anns = defaultdict(list)
    for a in coco["annotations"]:
        anns[a["image_id"]].append(a)
    todo = [im for im in coco["images"] if f"taco_{im['id']:04d}.jpg" in targets]

    def one(im: dict) -> int:
        dest = targets[f"taco_{im['id']:04d}.jpg"]
        lab = dest.parent.parent.parent / "labels" / dest.parent.name / f"{dest.stem}.txt"
        if dest.exists() and lab.exists():
            return 1
        data = None
        for url in (im.get("flickr_640_url"), im.get("flickr_url")):
            if not url:
                continue
            try:
                data = get(url)
                if len(data) > 1000:
                    break
            except Exception:
                data = None
        if not data:
            return 0
        raw = Image.open(io.BytesIO(data))
        raw.load()
        W, H = im["width"], im["height"]
        pic = min([raw, ImageOps.exif_transpose(raw)], key=lambda p: abs(p.size[0] / p.size[1] - W / H)).convert("RGB")
        s = 1280 / max(pic.size)
        if s < 1:
            pic = pic.resize((round(pic.size[0] * s), round(pic.size[1] * s)), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        lab.parent.mkdir(parents=True, exist_ok=True)
        pic.save(dest, quality=90)
        lines = []
        for a in anns.get(im["id"], []):
            for poly in a["segmentation"] if isinstance(a["segmentation"], list) else []:
                if len(poly) < 6:
                    continue
                lines.append("0 " + " ".join(f"{min(max(poly[k] / W, 0), 1):.5f} {min(max(poly[k + 1] / H, 0), 1):.5f}"
                                             for k in range(0, len(poly) - 1, 2)))
        lab.write_text("\n".join(lines) + ("\n" if lines else ""))
        return 1

    with cf.ThreadPoolExecutor(32) as ex:
        ok = sum(ex.map(one, todo))
    print(f"TACO: {ok} of {len(targets)} listed images prepared")


def prepare_storm() -> None:
    targets = wanted_paths("graffiti")
    raw = DATA / "raw" / "storm"
    raw.mkdir(parents=True, exist_ok=True)
    for name in ("images.tar.gz", "bounding_boxes.tar.gz"):
        if not (raw / name).exists():
            (raw / name).write_bytes(get(STORM.format(name), timeout=3600))
        with tarfile.open(raw / name) as t:
            t.extractall(raw)
    n = 0
    for csv_name, img_dir in (("train_labels.csv", "train"), ("test_labels.csv", "test")):
        rows = defaultdict(list)
        for r in csv.DictReader(open(raw / "Bounding_boxes" / csv_name)):
            rows[r["filename"]].append(r)
        for fn, boxes in rows.items():
            src = raw / "images" / img_dir / fn
            dest = targets.get(fn)
            if dest is None or not src.exists():
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src.read_bytes())
            lab = dest.parent.parent.parent / "labels" / dest.parent.name / f"{Path(fn).stem}.txt"
            lab.parent.mkdir(parents=True, exist_ok=True)
            lines = []
            for r in boxes:
                W, H = float(r["width"]), float(r["height"])
                x0, y0, x1, y1 = map(float, (r["xmin"], r["ymin"], r["xmax"], r["ymax"]))
                lines.append(f"0 {(x0 + x1) / 2 / W:.6f} {(y0 + y1) / 2 / H:.6f} {(x1 - x0) / W:.6f} {(y1 - y0) / H:.6f}")
            lab.write_text("\n".join(lines) + "\n")
            n += 1
    print(f"STORM: {n} of {len(targets)} listed images prepared")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["taco", "storm"])
    args = ap.parse_args()
    if args.only in (None, "taco"):
        prepare_taco()
    if args.only in (None, "storm"):
        prepare_storm()


if __name__ == "__main__":
    main()
