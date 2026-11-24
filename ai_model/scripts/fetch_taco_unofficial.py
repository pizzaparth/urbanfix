"""Download the TACO unofficial annotations and their 640-px images (external litter test set, A3).

The unofficial annotations are submitted by the public through tacodataset.org and
are not reviewed by the TACO authors. They are used here only as a test set from
different photographers. The annotation file is pinned to one commit so that the
test set does not change when the file is updated weekly.

Only images hosted by TACO with the licence field "CC" are used (2,399 of 3,831).
The rest are full-size OpenLitterMap photos under the ODbL, a database licence,
and are left out to keep one clear image licence.

Output: data/raw/taco_unofficial/{annotations_unofficial.json, images/<id>.jpg}
"""
from __future__ import annotations

import concurrent.futures as cf
import json
import urllib.request
from pathlib import Path

COMMIT = "3844bcd3535cd12ec0218494d1d79f1372f553cc"  # last change to the file as of 2026-10-20
ANN_URL = f"https://raw.githubusercontent.com/pedropro/TACO/{COMMIT}/data/annotations_unofficial.json"
OUT = Path(__file__).resolve().parents[1] / "data" / "raw" / "taco_unofficial"


def get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "urbanfix-research"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def usable(im: dict) -> bool:
    return im.get("license") == "CC" and bool(im.get("flickr_640_url"))


def fetch_image(im: dict) -> int:
    dest = OUT / "images" / f"{im['id']:06d}.jpg"
    if dest.exists() and dest.stat().st_size > 1000:
        return 1
    for url in (im.get("flickr_640_url"),):
        if not url:
            continue
        try:
            data = get(url)
            if len(data) > 1000:
                dest.write_bytes(data)
                return 1
        except Exception:
            continue
    return 0


def main() -> None:
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    ann = OUT / "annotations_unofficial.json"
    if not ann.exists():
        ann.write_bytes(get(ANN_URL))
    coco = json.loads(ann.read_text())
    wanted = [im for im in coco["images"] if usable(im)]
    with cf.ThreadPoolExecutor(16) as ex:
        ok = sum(ex.map(fetch_image, wanted))
    print(f"{ok} of {len(wanted)} usable images on disk ({len(coco['images'])} in the file)")


if __name__ == "__main__":
    main()
