"""Unrelated photos for the complaint-level evaluation (action A5): a seeded sample of COCO 2017 val.

COCO (Lin et al., 2014): annotations CC BY 4.0, images under the Flickr licence
recorded per image. Only image ids are committed (splits/negatives/coco_val2017.json);
the images are downloaded again from cocodataset.org.

Only instances_val2017.json is read from the 253 MB annotation archive, with HTTP
range requests. COCO has no pothole or graffiti class, so any image may serve as
an unrelated photo for those two categories (a few street scenes may still show
one; the error analysis in A6 looks at what passes). For litter, images containing
a bottle, cup or wine glass are marked, so the evaluation can leave them out.

Output: data/raw/coco_val2017/<id>.jpg and splits/negatives/coco_val2017.json
"""
from __future__ import annotations

import concurrent.futures as cf
import json
import random
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from remote_zip import open_remote_zip  # noqa: E402

ANN_ZIP = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "coco_val2017"
SPLIT = ROOT / "splits" / "negatives" / "coco_val2017.json"
N = 1000
SEED = 0
LITTER_LIKE = {"bottle", "cup", "wine glass"}


def fetch(im: dict) -> int:
    dest = OUT / im["file_name"]
    if dest.exists() and dest.stat().st_size > 1000:
        return 1
    for attempt in range(3):
        try:
            req = urllib.request.Request(im["coco_url"], headers={"User-Agent": "urbanfix-research"})
            with urllib.request.urlopen(req, timeout=120) as r:
                dest.write_bytes(r.read())
            return 1
        except Exception:
            continue
    return 0


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ann_path = OUT / "instances_val2017.json"
    if not ann_path.exists():
        z = open_remote_zip(ANN_ZIP)
        ann_path.write_bytes(z.read("annotations/instances_val2017.json"))
    coco = json.loads(ann_path.read_text())
    names = {c["id"]: c["name"] for c in coco["categories"]}
    cats: dict[int, set] = {}
    for a in coco["annotations"]:
        cats.setdefault(a["image_id"], set()).add(names[a["category_id"]])
    images = sorted(coco["images"], key=lambda im: im["id"])
    sample = random.Random(SEED).sample(images, N)
    with cf.ThreadPoolExecutor(8) as ex:
        ok = sum(ex.map(fetch, sample))
    print(f"{ok} of {N} images on disk")
    SPLIT.parent.mkdir(parents=True, exist_ok=True)
    SPLIT.write_text(json.dumps({
        "name": "coco_val2017", "source": "COCO 2017 val (Lin et al., 2014); annotations CC BY 4.0, "
                                          "images under per-image Flickr licences", "seed": SEED,
        "images": [{"file": str((OUT / im["file_name"]).relative_to(ROOT)), "coco_id": im["id"],
                    "license": im["license"], "categories": sorted(cats.get(im["id"], [])),
                    "litter_like": bool(cats.get(im["id"], set()) & LITTER_LIKE)}
                   for im in sorted(sample, key=lambda im: im["id"]) if (OUT / im["file_name"]).exists()],
    }, indent=1))


if __name__ == "__main__":
    main()
