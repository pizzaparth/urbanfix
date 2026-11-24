"""Build grouped, leak-free train/val/test splits for the four UrbanFix categories (action A1).

Rules
-----
1. Images are grouped by source photo. Two images are in one group when
   (a) their file-name stems match after removing augmentation suffixes
       (``_aug_*``, ``_augmented``, Roboflow ``_jpg.rf.<hash>``), or
   (b) they are near-duplicates: their 64-bit difference hashes (dHash), or
       the dHash of one and of the other's mirror image, differ in at most
       ``HAMMING`` bits (candidate stage), and their 256-bit dHashes differ in
       at most ``CONFIRM`` bits (confirmation stage). The second stage removes
       false matches between low-texture photos such as plain walls; on the old
       splits true duplicates differed in at most 11 of 256 bits and false
       candidates in at least 43.
   Groups are closed under both rules (union-find).
2. Groups, not images, are split 70/15/15 with a fixed seed, separately
   inside each stratum (for RDD2022 the stratum is the country).
3. Fixed splits published by the dataset authors are kept: the STORM graffiti
   test split and the camera-disjoint splits of the synthetic manhole set.
   A training image that is a near-duplicate of a fixed test image is dropped.
4. In val, test and the external sets only one image per group is kept (the
   un-augmented copy when there is one), so a photo is never counted twice.
5. External test sets (A3) are deduplicated against every in-domain image of
   the same category; near-duplicates are dropped and counted.

The script writes ``splits/<category>.json`` and ``splits/external/<name>.json``
(file lists and group ids only, no images) and ``results/split_report.json``.
It ends with an assertion that no group and no near-duplicate pair crosses a
split. ``--audit`` measures the overlap in the old splits under ``data/<category>``.

Usage:
    python scripts/make_splits.py --audit       # leakage in the old splits
    python scripts/make_splits.py               # new splits and checks
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
SPLITS = ROOT / "splits"
RESULTS = ROOT / "results"
CACHE = DATA / "dhash_cache.json"

SEED = 0
RATIOS = (0.70, 0.15, 0.15)
HAMMING = 10
BANDS = HAMMING + 1  # pigeonhole: distance <= 10 means at least one of 11 bands is identical
CONFIRM = 24  # of 256 bits
IMG_EXT = {".jpg", ".jpeg", ".png"}

# --------------------------------------------------------------------------- hashing

_cache: dict[str, list] = {}


def load_cache() -> None:
    if CACHE.exists():
        _cache.update(json.loads(CACHE.read_text()))


def save_cache() -> None:
    CACHE.write_text(json.dumps(_cache))


def _dhash_array(gray: np.ndarray) -> int:
    diff = gray[:, 1:] > gray[:, :-1]
    return int("".join("1" if b else "0" for b in diff.flatten()), 2)


def _hashes(rel: str) -> list:
    """[64-bit dHash, its mirror, 256-bit dHash, its mirror], cached by relative path."""
    if rel not in _cache or len(_cache[rel]) != 4:
        with Image.open(ROOT / rel) as im:
            gray = im.convert("L")
            g8 = np.asarray(gray.resize((9, 8), Image.LANCZOS), dtype=np.int16)
            g16 = np.asarray(gray.resize((17, 16), Image.LANCZOS), dtype=np.int16)
        _cache[rel] = [_dhash_array(g8), _dhash_array(g8[:, ::-1]),
                       _dhash_array(g16), _dhash_array(g16[:, ::-1])]
    return _cache[rel]


def dhash_pair(rel: str) -> tuple[int, int, int, int]:
    return tuple(_hashes(rel))


def near_duplicate_pairs(hashes: list[tuple[int, int, int, int]]) -> list[tuple[int, int]]:
    """All index pairs (i, j) that pass both the 64-bit and the 256-bit hash test."""
    n = len(hashes)
    plain = [h[0] for h in hashes]
    keys = plain + [h[1] for h in hashes]  # index i + n is the mirror of image i
    width = 64 // BANDS + 1
    candidates: set[tuple[int, int]] = set()
    for b in range(BANDS):
        shift = b * width
        buckets: dict[int, list[int]] = defaultdict(list)
        for idx, k in enumerate(keys):
            buckets[(k >> shift) & ((1 << width) - 1)].append(idx)
        for members in buckets.values():
            if len(members) < 2:
                continue
            for x in range(len(members)):
                for y in range(x + 1, len(members)):
                    i, j = members[x] % n, members[y] % n
                    if i != j:
                        candidates.add((min(i, j), max(i, j)))
    pairs = []
    for i, j in candidates:
        d64 = min(bin(plain[i] ^ plain[j]).count("1"), bin(plain[i] ^ hashes[j][1]).count("1"))
        if d64 > HAMMING:
            continue
        d256 = min(bin(hashes[i][2] ^ hashes[j][2]).count("1"), bin(hashes[i][2] ^ hashes[j][3]).count("1"))
        if d256 <= CONFIRM:
            pairs.append((i, j))
    return pairs


# --------------------------------------------------------------------------- grouping

_AUG = re.compile(r"(_jpg|_jpeg|_png)?\.rf\.[0-9a-f]+$|_aug_[a-z_]+$|_augmented$", re.I)


def stem_key(name: str) -> str:
    stem = Path(name).stem
    while True:
        new = _AUG.sub("", stem)
        if new == stem:
            return stem.lower()
        stem = new


def is_augmented(name: str) -> bool:
    return stem_key(name) != Path(name).stem.lower()


class UnionFind:
    def __init__(self, n: int):
        self.p = list(range(n))

    def find(self, x: int) -> int:
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[max(ra, rb)] = min(ra, rb)


def pairs_on_disk(items: list[dict]) -> list[tuple[int, int]]:
    """Near-duplicate pairs among the items whose image is on disk (indices into items).

    Only the synthetic manhole set can be partly on disk (its download is slow);
    its split is fixed by the publisher, so missing images cannot move between splits.
    """
    idx = [k for k, it in enumerate(items) if (ROOT / it["file"]).exists()]
    hashes = [dhash_pair(items[k]["file"]) for k in idx]
    return [(idx[i], idx[j]) for i, j in near_duplicate_pairs(hashes)]


def group_items(items: list[dict]) -> list[int]:
    """Return a group index per item, using stem keys and near-duplicate hashes."""
    uf = UnionFind(len(items))
    by_stem: dict[tuple, int] = {}
    for i, it in enumerate(items):
        key = (it.get("namespace", ""), stem_key(it["file"]))
        if key in by_stem:
            uf.union(i, by_stem[key])
        else:
            by_stem[key] = i
    for i, j in pairs_on_disk(items):
        uf.union(i, j)
    roots = [uf.find(i) for i in range(len(items))]
    ids = {r: k for k, r in enumerate(sorted(set(roots)))}
    return [ids[r] for r in roots]


# --------------------------------------------------------------------------- pools


def listdir(rel_dir: str) -> list[str]:
    d = ROOT / rel_dir
    if not d.exists():
        return []
    return sorted(f"{rel_dir}/{p.name}" for p in d.iterdir() if p.suffix.lower() in IMG_EXT)


def rdd_objects(xml_path: Path) -> list[str]:
    root = ET.parse(xml_path).getroot()
    return [o.findtext("name", "").strip() for o in root.iter("object")]


def rdd_pool(country: str, neg_ratio: float) -> list[dict]:
    """RDD2022 training images of one country: every image with a pothole (D40), plus a
    seeded sample of images without one (other damage or none) as background images."""
    base = RAW / "rdd2022" / country / "train"
    pos, neg = [], []
    for img in sorted((base / "images").glob("*.jpg")):
        xml = base / "annotations" / "xmls" / f"{img.stem}.xml"
        if not xml.exists():
            continue
        names = rdd_objects(xml)
        item = {"file": str(img.relative_to(ROOT)), "stratum": country, "namespace": country,
                "label": str(xml.relative_to(ROOT)), "positive": "D40" in names}
        (pos if item["positive"] else neg).append(item)
    rng = random.Random(f"{SEED}-{country}")
    rng.shuffle(neg)
    return pos + neg[: round(len(pos) * neg_ratio)]


def yolo_label(img_rel: str) -> str:
    p = Path(img_rel)
    return str(p.parent.parent.parent / "labels" / p.parent.name / f"{p.stem}.txt")


def yolo_positive(label_rel: str) -> bool:
    f = ROOT / label_rel
    return f.exists() and f.read_text().strip() != ""


def local_pool(rel_dirs: list[str], namespace: str = "", fixed: str | None = None) -> list[dict]:
    items = []
    for d in rel_dirs:
        for f in listdir(d):
            lab = yolo_label(f)
            items.append({"file": f, "label": lab, "positive": yolo_positive(lab),
                          "namespace": namespace, "stratum": "all", "fixed": fixed})
    return items


def synthetic_manhole_pool() -> list[dict]:
    base = RAW / "synthetic_manhole"
    manifest = base / "manifest.csv"
    if not manifest.exists():
        return []
    import csv
    items = []
    for row in csv.DictReader(open(manifest)):
        img = base / "jpg" / row["camera"] / f"Img{row['frame_id']}.jpg"
        items.append({"file": str(img.relative_to(ROOT)), "namespace": row["camera"], "stratum": "all",
                      "label": str((base / row["bbox_path"]).relative_to(ROOT)),
                      "positive": int(row["open_manhole_bbox_count"]) > 0,
                      "fixed": row["split"]})
    return items


def roboflow_pothole_pool() -> list[dict]:
    rf = "Pothole_Segmentation_YOLOv8.v1i.yolov8"
    items = []
    for split in ("train", "valid"):
        for f in listdir(f"{rf}/{split}/images"):
            lab = f"{rf}/{split}/labels/{Path(f).stem}.txt"
            items.append({"file": f, "label": lab, "positive": yolo_positive(lab), "stratum": "all"})
    return items


def taco_unofficial_pool() -> list[dict]:
    base = RAW / "taco_unofficial"
    ann = base / "annotations_unofficial.json"
    if not ann.exists():
        return []
    coco = json.loads(ann.read_text())
    with_ann = {a["image_id"] for a in coco["annotations"]}
    items = []
    for im in coco["images"]:
        f = base / "images" / f"{im['id']:06d}.jpg"
        if not (im.get("license") == "CC" and im.get("flickr_640_url") and f.exists()):
            continue
        with Image.open(f) as pic:
            w, h = pic.size
        if w != h and (w > h) != (im["width"] > im["height"]):
            continue  # thumbnail rotated relative to the annotation; labels would not line up
        items.append({"file": str(f.relative_to(ROOT)), "label": f"{ann.relative_to(ROOT)}#{im['id']}",
                      "positive": im["id"] in with_ann, "stratum": "all"})
    return items


# Category definitions: in-domain pool, plus external test pools (A3).
def categories() -> dict:
    return {
        "pothole": {
            "source": "RDD2022 (Arya et al., 2024), doi:10.6084/m9.figshare.21431547, CC BY 4.0, class D40",
            "pool": lambda: sum((rdd_pool(c, 0.25) for c in ("Japan", "Czech", "United_States", "China_MotorBike")), []),
            "external": {
                "pothole_rdd2022_india": lambda: rdd_pool("India", 0.25),
                "pothole_roboflow": roboflow_pothole_pool,
            },
        },
        "garbage_litter": {
            "source": "TACO official annotations (Proenca and Simoes, 2020), doi:10.5281/zenodo.3587843, CC BY 4.0",
            "pool": lambda: local_pool(["data/garbage_litter/images/train", "data/garbage_litter/images/val"]),
            "external": {"garbage_litter_taco_unofficial": taco_unofficial_pool},
        },
        "graffiti": {
            "source": "STORM graffiti/tagging (University of West Attica, 2019), doi:10.5281/zenodo.3238357, CC BY 4.0",
            "pool": lambda: local_pool(["data/graffiti/images/train"])
            + local_pool(["data/graffiti/images/val"], fixed="test"),
            "external": {},
        },
        "open_manhole": {
            "source": "Synthetic Urban Manhole Cover Dataset (Strakos et al., 2026), doi:10.5281/zenodo.21291309, CC BY 4.0",
            "pool": synthetic_manhole_pool,
            "external": {
                # Real photos from the Kaggle Road Hazards set: evaluation only (see D3).
                "open_manhole_kaggle_real": lambda: local_pool(
                    ["data/open_manhole/images/train", "data/open_manhole/images/val"]),
            },
        },
    }


# --------------------------------------------------------------------------- splitting


def canonical(members: list[dict]) -> dict:
    """The copy kept in val and test: un-augmented first, then by name."""
    return sorted(members, key=lambda it: (is_augmented(it["file"]), it["file"]))[0]


def one_per_group(items: list[dict]) -> list[dict]:
    by_group: dict[int, list[dict]] = defaultdict(list)
    for it in items:
        by_group[it["group"]].append(it)
    return [canonical(m) for m in by_group.values()]


def assign(items: list[dict], gids: list[int]) -> tuple[dict[str, list[dict]], dict]:
    groups: dict[int, list[dict]] = defaultdict(list)
    for it, g in zip(items, gids):
        it["group"] = g
        groups[g].append(it)

    split_of: dict[int, str] = {}
    dropped_train = 0
    free_by_stratum: dict[str, list[int]] = defaultdict(list)
    for g, members in groups.items():
        fixed = {m.get("fixed") for m in members} - {None}
        if not fixed:
            free_by_stratum[members[0]["stratum"]].append(g)
        elif len(fixed) == 1:
            split_of[g] = fixed.pop()
        else:
            # A published split puts near-duplicates on both sides: keep the most held-out side
            # and drop the members on the other sides.
            keep = "test" if "test" in fixed else "val"
            split_of[g] = keep
            before = len(members)
            groups[g] = [m for m in members if m.get("fixed") == keep]
            dropped_train += before - len(groups[g])

    # With a published test split, free groups only fill train and val (same 70:15 ratio).
    has_fixed_test = "test" in split_of.values()
    rng = random.Random(SEED)
    for stratum in sorted(free_by_stratum):
        gs = sorted(free_by_stratum[stratum])
        rng.shuffle(gs)
        n = len(gs)
        if has_fixed_test:
            n_val = round(n * RATIOS[1] / (RATIOS[0] + RATIOS[1]))
            n_train = n - n_val
        else:
            n_train = round(n * RATIOS[0])
            n_val = round(n * RATIOS[1])
        for k, g in enumerate(gs):
            split_of[g] = "train" if k < n_train else ("val" if k < n_train + n_val else "test")

    out: dict[str, list[dict]] = {"train": [], "val": [], "test": []}
    for g, members in groups.items():
        s = split_of[g]
        out[s].extend(members if s == "train" else one_per_group(members))
    for s in out:
        out[s].sort(key=lambda it: it["file"])
    return out, {"dropped_cross_fixed_split": dropped_train}


def summarise(split_items: list[dict]) -> dict:
    return {
        "images": len(split_items),
        "source_groups": len({it["group"] for it in split_items}),
        "with_defect": sum(1 for it in split_items if it["positive"]),
        "by_stratum": dict(Counter(it["stratum"] for it in split_items)),
    }


def verify(splits: dict[str, list[dict]]) -> dict:
    """Recompute grouping from scratch on the final lists and count cross-split leaks."""
    flat = [(s, it) for s, its in splits.items() for it in its]
    groups_by_split = defaultdict(set)
    for s, it in flat:
        groups_by_split[s].add(it["group"])
    shared_groups = sum(len(groups_by_split[a] & groups_by_split[b])
                        for a, b in (("train", "val"), ("train", "test"), ("val", "test")))
    cross_pairs = sum(1 for i, j in pairs_on_disk([it for _, it in flat]) if flat[i][0] != flat[j][0])
    missing = sum(1 for _, it in flat if not (ROOT / it["file"]).exists())
    stems = defaultdict(set)
    for s, it in flat:
        stems[(it.get("namespace", ""), stem_key(it["file"]))].add(s)
    cross_stems = sum(1 for v in stems.values() if len(v) > 1)
    return {"shared_groups": shared_groups, "cross_split_near_duplicate_pairs": cross_pairs,
            "cross_split_stems": cross_stems, "images_checked_on_disk": len(flat) - missing,
            "images_not_yet_downloaded": missing}


def item_out(it: dict) -> dict:
    return {"file": it["file"], "label": it["label"], "group": it["group"],
            "positive": it["positive"], "stratum": it["stratum"]}


def dedupe_external(ext: list[dict], domain: list[dict]) -> tuple[list[dict], int]:
    """Drop external images that are near-duplicates of any in-domain image."""
    combined = domain + ext
    n = len(domain)
    bad = set()
    for i, j in pairs_on_disk(combined):
        if (i < n) != (j < n):
            bad.add(max(i, j))
    kept = [it for k, it in enumerate(ext) if k + n not in bad]
    return kept, len(ext) - len(kept)


def build(only: list[str] | None) -> dict:
    report = {"seed": SEED, "ratios": RATIOS, "hamming_64": HAMMING, "hamming_256": CONFIRM,
              "categories": {}, "external": {}}
    SPLITS.mkdir(exist_ok=True)
    (SPLITS / "external").mkdir(exist_ok=True)
    for name, cfg in categories().items():
        if only and name not in only:
            continue
        pool = cfg["pool"]()
        if not pool:
            print(f"{name}: no data on disk, skipped", file=sys.stderr)
            continue
        gids = group_items(pool)
        splits, extra = assign(pool, gids)
        check = verify(splits)
        assert check["shared_groups"] == 0 and check["cross_split_near_duplicate_pairs"] == 0 \
            and check["cross_split_stems"] == 0, (name, check)
        summary = {s: summarise(v) for s, v in splits.items()}
        report["categories"][name] = {"source": cfg["source"], "pool_images": len(pool),
                                      "pool_groups": len(set(gids)), **extra, "splits": summary, "check": check}
        (SPLITS / f"{name}.json").write_text(json.dumps({
            "category": name, "source": cfg["source"], "seed": SEED, "ratios": RATIOS,
            "hamming_64": HAMMING, "hamming_256": CONFIRM, "check": check, "splits": {s: [item_out(it) for it in v] for s, v in splits.items()},
        }, indent=1))
        print(name, json.dumps(summary), check)

        domain = [it for v in splits.values() for it in v]
        for ext_name, fn in cfg["external"].items():
            ext = fn()
            if not ext:
                print(f"{ext_name}: no data on disk, skipped", file=sys.stderr)
                continue
            for it in ext:
                it["namespace"] = "ext:" + it.get("namespace", "")
            ext_gids = group_items(ext)
            for it, g in zip(ext, ext_gids):
                it["group"] = g
            ext = one_per_group(ext)
            kept, dropped = dedupe_external(ext, domain)
            report["external"][ext_name] = {"category": name, "images": len(kept),
                                            "dropped_near_duplicates_of_training_pool": dropped,
                                            **{k: v for k, v in summarise(kept).items() if k != "images"}}
            (SPLITS / "external" / f"{ext_name}.json").write_text(json.dumps({
                "name": ext_name, "category": name, "dropped_near_duplicates": dropped,
                "test": [item_out(it) for it in sorted(kept, key=lambda it: it["file"])],
            }, indent=1))
            print(ext_name, len(kept), "kept,", dropped, "dropped")
        save_cache()
    return report


# --------------------------------------------------------------------------- audit of the old splits


def audit() -> dict:
    """Measure group overlap between the old train and val folders (findings F1 to F3)."""
    old = {
        "pothole_roboflow": {"train": "Pothole_Segmentation_YOLOv8.v1i.yolov8/train/images",
                             "val": "Pothole_Segmentation_YOLOv8.v1i.yolov8/valid/images"},
        "garbage_litter": {"train": "data/garbage_litter/images/train", "val": "data/garbage_litter/images/val"},
        "open_manhole_kaggle": {"train": "data/open_manhole/images/train", "val": "data/open_manhole/images/val"},
        "graffiti_storm": {"train": "data/graffiti/images/train", "val": "data/graffiti/images/val"},
    }
    out = {}
    for name, dirs in old.items():
        items = [{"file": f, "split": s} for s, d in dirs.items() for f in listdir(d)]
        if not items:
            continue
        gids = group_items(items)
        train_g = {g for it, g in zip(items, gids) if it["split"] == "train"}
        val = [(it, g) for it, g in zip(items, gids) if it["split"] == "val"]
        stem_train = {stem_key(it["file"]) for it in items if it["split"] == "train"}
        out[name] = {
            "train_images": sum(1 for it in items if it["split"] == "train"),
            "train_source_groups": len(train_g),
            "val_images": len(val),
            "val_source_groups": len({g for _, g in val}),
            "val_images_sharing_group_with_train": sum(1 for _, g in val if g in train_g),
            "val_groups_shared_with_train": len({g for _, g in val if g in train_g}),
            "val_images_sharing_stem_with_train": sum(1 for it, _ in val if stem_key(it["file"]) in stem_train),
            "val_images_augmented_copies": sum(1 for it, _ in val if is_augmented(it["file"])),
        }
        print(name, out[name])
    save_cache()
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audit", action="store_true", help="measure leakage in the old splits only")
    ap.add_argument("--only", nargs="*", help="categories to build")
    args = ap.parse_args()
    load_cache()
    RESULTS.mkdir(exist_ok=True)
    if args.audit:
        (RESULTS / "split_audit_old.json").write_text(json.dumps(audit(), indent=1))
        return
    report = build(args.only)
    path = RESULTS / "split_report.json"
    if args.only and path.exists():
        prev = json.loads(path.read_text())
        prev["categories"].update(report["categories"])
        prev["external"].update(report["external"])
        report = prev
    path.write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
