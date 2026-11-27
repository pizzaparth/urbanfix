"""Count STORM graffiti photos whose lower part is black in the published files.

    python scripts/audit_storm_black.py

A photo counts when at least 95 % of the pixels in its bottom quarter are darker than
8 of 255. The check also confirms that each such file is a complete JPEG (ends with the
EOI marker and decodes without error), so the black area is in the dataset as published
on Zenodo (doi:10.5281/zenodo.3238357), not a download or copy fault:
scripts/prepare_sources.py copies STORM images byte for byte.

The working folders keep STORM's own split: images/train is the official train split
(our train and validation splits), images/val is the official test split (our test split).

Output: results/storm_black_regions.json
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
splits = json.loads((ROOT / "splits" / "graffiti.json").read_text())


def black_bottom(path: Path) -> bool:
    a = np.asarray(Image.open(path).convert("L"))
    return bool((a[a.shape[0] * 3 // 4:] < 8).mean() > 0.95)


def complete_jpeg(path: Path) -> bool:
    data = path.read_bytes().rstrip(b"\x00")
    try:
        Image.open(path).load()
    except Exception:  # noqa: BLE001
        return False
    return data.endswith(b"\xff\xd9")


def main() -> None:
    files = sorted((ROOT / "data" / "graffiti" / "images").glob("*/*"))
    by_split, black, incomplete = Counter(), Counter(), 0
    official = {"train": "official_train", "val": "official_test"}
    for f in files:
        split = official[f.parent.name]
        by_split[split] += 1
        if black_bottom(f):
            black[split] += 1
            incomplete += not complete_jpeg(f)
    out = {"dataset": "STORM graffiti/tagging, doi:10.5281/zenodo.3238357",
           "rule": "bottom quarter: >= 95 % of pixels below 8/255",
           "images": dict(by_split), "black_bottom": dict(black),
           "black_bottom_total": sum(black.values()), "images_total": sum(by_split.values()),
           "black_bottom_incomplete_jpeg": incomplete}
    (ROOT / "results" / "storm_black_regions.json").write_text(json.dumps(out, indent=1))
    print(out)


if __name__ == "__main__":
    main()
