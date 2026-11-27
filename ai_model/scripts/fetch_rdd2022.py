"""Download the RDD2022 country archives that UrbanFix uses, without the 10.6 GB Norway archive.

RDD2022 (Arya et al., 2024) is published on figshare as one 13 GB zip
(doi:10.6084/m9.figshare.21431547, licence CC BY 4.0) that stores one zip per
country without compression. Each inner zip is therefore a contiguous byte range
of the outer file, and this script fetches only the ranges it needs.

Usage:
    python scripts/fetch_rdd2022.py [--countries India Japan Czech China_MotorBike]

Output: data/raw/rdd2022/<Country>/train/{images,annotations/xmls}/...
"""
from __future__ import annotations

import argparse
import struct
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from remote_zip import HttpRangeFile, open_remote_zip  # noqa: E402

URL = "https://ndownloader.figshare.com/files/38030910"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "rdd2022"
# United_States is left out: the RDD2022 paper states those images are Google Street View
# captures, which the dataset's CC BY 4.0 licence cannot cover (ai_model/DATASETS.md, F25).
DEFAULT = ["India", "Japan", "Czech", "China_MotorBike"]
CHUNK = 16 << 20


def data_offset(raw: HttpRangeFile, info: zipfile.ZipInfo) -> int:
    raw.seek(info.header_offset)
    header = raw.read(30)
    name_len, extra_len = struct.unpack("<HH", header[26:30])
    return info.header_offset + 30 + name_len + extra_len


def download_range(url: str, start: int, length: int, dest: Path) -> None:
    done = dest.stat().st_size if dest.exists() else 0
    if done == length:
        print("exists:", dest.name)
        return
    with open(dest, "ab") as f:
        while done < length:
            end = min(start + done + CHUNK, start + length) - 1
            req = urllib.request.Request(url, headers={"Range": f"bytes={start + done}-{end}",
                                                       "User-Agent": "urbanfix-research"})
            for attempt in range(5):
                try:
                    with urllib.request.urlopen(req, timeout=300) as r:
                        data = r.read()
                    break
                except Exception:
                    if attempt == 4:
                        raise
                    time.sleep(2 ** attempt)
            f.write(data)
            done += len(data)
            print(f"\r{dest.name}: {done / 1e6:.0f} / {length / 1e6:.0f} MB", end="", flush=True)
    print()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--countries", nargs="+", default=DEFAULT)
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    outer = open_remote_zip(URL)
    raw = HttpRangeFile(URL)
    members = {Path(i.filename).stem: i for i in outer.infolist()}
    for country in args.countries:
        info = members[country]
        assert info.compress_type == zipfile.ZIP_STORED, "inner archives are expected to be stored"
        dest = OUT / f"{country}.zip"
        # The signed storage URL expires within seconds, so each chunk goes through figshare's stable URL.
        download_range(URL, data_offset(raw, info), info.file_size, dest)
        target = OUT / country
        if not target.exists():
            with zipfile.ZipFile(dest) as z:
                z.extractall(OUT)
        n_img = len(list((OUT / country / "train" / "images").glob("*.jpg")))
        print(f"{country}: {n_img} training images")


if __name__ == "__main__":
    main()
