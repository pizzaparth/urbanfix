"""Turn the split lists in splits/ into Ultralytics YOLO folders under data/v2/.

    python scripts/build_yolo_sets.py            # all categories and external test sets
    python scripts/build_yolo_sets.py pothole    # one category (and its external sets)

Images are linked, not copied. Labels are written fresh from each source's own
annotation format, with the defect as class 0:

- RDD2022 Pascal VOC XML: class D40 (pothole), boxes.
- TACO unofficial COCO JSON: every litter polygon, as a segmentation label.
- Existing YOLO label files (TACO official, STORM, Roboflow
  potholes): copied; polygons are reduced to boxes for box-only models.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import xml.etree.ElementTree as ET
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPLITS = ROOT / "splits"
OUT = ROOT / "data" / "v2"

TASK = {"pothole": "detect", "pothole_india": "detect", "garbage_litter": "segment", "graffiti": "detect"}
NAMES = {"pothole": "Pothole", "pothole_india": "Pothole", "garbage_litter": "Litter", "graffiti": "Graffiti"}


def poly_to_box(vals: list[float]) -> list[float]:
    xs, ys = vals[0::2], vals[1::2]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0]


def from_yolo(label_rel: str, task: str) -> list[str]:
    f = ROOT / label_rel
    if not f.exists():
        return []
    out = []
    for line in f.read_text().splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        vals = [float(v) for v in parts[1:]]
        if task == "detect" and len(vals) > 4:
            vals = poly_to_box(vals)
        out.append("0 " + " ".join(f"{v:.6f}" for v in vals))
    return out


def from_rdd(label_rel: str) -> list[str]:
    root = ET.parse(ROOT / label_rel).getroot()
    W = float(root.findtext("size/width"))
    H = float(root.findtext("size/height"))
    out = []
    for o in root.iter("object"):
        if o.findtext("name", "").strip() != "D40":
            continue
        b = o.find("bndbox")
        x0, y0, x1, y1 = (float(b.findtext(k)) for k in ("xmin", "ymin", "xmax", "ymax"))
        x0, x1 = max(0, min(x0, x1)), min(W, max(x0, x1))
        y0, y1 = max(0, min(y0, y1)), min(H, max(y0, y1))
        if x1 - x0 < 1 or y1 - y0 < 1:
            continue
        out.append(f"0 {(x0 + x1) / 2 / W:.6f} {(y0 + y1) / 2 / H:.6f} {(x1 - x0) / W:.6f} {(y1 - y0) / H:.6f}")
    return out


@lru_cache(maxsize=2)
def _coco(path: str) -> tuple[dict, dict]:
    coco = json.loads((ROOT / path).read_text())
    images = {im["id"]: im for im in coco["images"]}
    anns: dict[int, list] = {}
    for a in coco["annotations"]:
        anns.setdefault(a["image_id"], []).append(a)
    return images, anns


def from_coco(label_ref: str, task: str) -> list[str]:
    path, image_id = label_ref.split("#")
    images, anns = _coco(path)
    im = images[int(image_id)]
    W, H = im["width"], im["height"]
    out = []
    for a in anns.get(int(image_id), []):
        seg = a.get("segmentation")
        polys = seg if isinstance(seg, list) else []
        for poly in polys:
            if len(poly) < 6:
                continue
            vals = [v / (W if k % 2 == 0 else H) for k, v in enumerate(poly)]
            vals = [min(max(v, 0.0), 1.0) for v in vals]
            if task == "detect":
                vals = poly_to_box(vals)
            out.append("0 " + " ".join(f"{v:.6f}" for v in vals))
    return out


def labels_for(item: dict, task: str) -> list[str]:
    ref = item["label"]
    if ref.endswith(".xml"):
        return from_rdd(ref)
    if "#" in ref:
        return from_coco(ref, task)
    return from_yolo(ref, task)


def link_name(rel: str) -> str:
    p = Path(rel)
    return f"{p.parent.parent.name}__{p.parent.name}__{p.name}".replace(" ", "_")


def write_split(items: list[dict], img_dir: Path, lab_dir: Path, task: str) -> dict:
    img_dir.mkdir(parents=True, exist_ok=True)
    lab_dir.mkdir(parents=True, exist_ok=True)
    n_obj = n_pos = missing = 0
    for it in items:
        if not (ROOT / it["file"]).exists():
            # A source that could not be downloaded on this machine (for example the Roboflow
            # set without an account, or TACO photos removed from Flickr). Counted, not hidden.
            missing += 1
            continue
        name = link_name(it["file"])
        dest = img_dir / name
        if not dest.exists():
            os.symlink(ROOT / it["file"], dest)
        lines = labels_for(it, task)
        n_obj += len(lines)
        n_pos += bool(lines)
        (lab_dir / f"{Path(name).stem}.txt").write_text("".join(l + "\n" for l in lines))
    out = {"images": len(items) - missing, "images_with_defect": n_pos, "objects": n_obj}
    if missing:
        out["missing_on_this_machine"] = missing
    return out


def build_category(cat: str) -> dict:
    spec = json.loads((SPLITS / f"{cat}.json").read_text())
    task = TASK[cat]
    base = OUT / cat
    if base.exists():
        shutil.rmtree(base)
    stats = {}
    for split, items in spec["splits"].items():
        stats[split] = write_split(items, base / "images" / split, base / "labels" / split, task)
    (base / "data.yaml").write_text(
        f"path: {base}\ntrain: images/train\nval: images/val\ntest: images/test\nnames: ['{NAMES[cat]}']\n")
    return stats


def build_external(path: Path) -> dict | None:
    spec = json.loads(path.read_text())
    cat = spec["category"]
    base = OUT / "external" / spec["name"]
    if base.exists():
        shutil.rmtree(base)
    if not any((ROOT / it["file"]).exists() for it in spec["test"]):
        print(f"{spec['name']}: not on this machine, skipped")
        return None
    stats = write_split(spec["test"], base / "images" / "test", base / "labels" / "test", TASK[cat])
    (base / "data.yaml").write_text(
        f"path: {base}\ntrain: images/test\nval: images/test\ntest: images/test\nnames: ['{NAMES[cat]}']\n")
    return stats


def main() -> None:
    only = set(sys.argv[1:])
    summary_path = ROOT / "results" / "yolo_sets.json"
    summary = json.loads(summary_path.read_text()) if summary_path.exists() else {}
    for f in sorted(SPLITS.glob("*.json")):
        cat = f.stem
        if only and cat not in only:
            continue
        summary[cat] = build_category(cat)
        print(cat, summary[cat])
    for f in sorted((SPLITS / "external").glob("*.json")):
        spec_cat = json.loads(f.read_text())["category"]
        if only and spec_cat not in only:
            continue
        built = build_external(f)
        if built is not None:
            summary[f"external/{f.stem}"] = built
            print(f.stem, built)
    summary_path.write_text(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
