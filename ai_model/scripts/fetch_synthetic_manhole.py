"""Download the Synthetic Urban Manhole Cover Dataset images and boxes (replacement for [18], see D3).

Source: Strakos, Zurkova and Topic, "Synthetic Urban Manhole Cover Dataset",
Zenodo, 2026, doi:10.5281/zenodo.21291309, licence CC BY 4.0.

Each camera folder is a 1 GB zip of 1920x1080 PNG renders plus masks. Only the
rendered images (Imgs) and the box files (Bboxes) are fetched, member by member,
with HTTP range requests. Images are stored as 1280-px JPEG (quality 92) to save
disk; box coordinates stay in the original 1920x1080 pixel frame and are
normalised when the YOLO labels are written.

Output: data/raw/synthetic_manhole/{manifest.csv, README.md, jpg/camXX/ImgNNNN.jpg, camXX/Bboxes/*.txt}
"""
from __future__ import annotations

import concurrent.futures as cf
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from remote_zip import HttpRangeFile  # noqa: E402

RECORD = "https://zenodo.org/api/records/21291309/files"
OUT = Path(__file__).resolve().parents[1] / "data" / "raw" / "synthetic_manhole"
# Test cameras first, then validation, then training, so a partial download is still usable.
# Zenodo served only 80 to 160 KB/s to our home network in November 2026 (the full set would take
# about a day), so run this script on the Kaggle or Colab machine that trains the model.
# It resumes where it stopped.
CAMERAS = ["cam11", "cam12", "cam09", "cam10"] + [f"cam{i:02d}" for i in range(1, 9)]
THREADS = 8
STRIDE = 5


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "urbanfix-research"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def fetch_members(url: str, names: list[str]) -> int:
    done = 0
    with zipfile.ZipFile(HttpRangeFile(url)) as z:
        for name in names:
            p = Path(name)
            if p.parent.name == "Imgs":
                dest = OUT / "jpg" / p.parts[0] / f"{p.stem}.jpg"
                if dest.exists():
                    done += 1
                    continue
                im = Image.open(io.BytesIO(z.read(name))).convert("RGB")
                s = 1280 / max(im.size)
                im = im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS)
                dest.parent.mkdir(parents=True, exist_ok=True)
                im.save(dest, quality=92)
            else:
                dest = OUT / name
                if dest.exists():
                    done += 1
                    continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(z.read(name))
            done += 1
    return done


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for f in ("manifest.csv", "README.md", "ANNOTATION_SCHEMA.md"):
        if not (OUT / f).exists():
            (OUT / f).write_bytes(get(f"{RECORD}/{f}/content"))
    for cam in CAMERAS:
        url = f"{RECORD}/{cam}.zip/content"
        with zipfile.ZipFile(HttpRangeFile(url)) as z:
            names = [i.filename for i in z.infolist()
                     if Path(i.filename).parent.name in ("Imgs", "Bboxes") and not i.is_dir()]
        # Box files first (tiny), then frames interleaved with a stride, so that an
        # interrupted download still covers the whole drive of each camera.
        def order(n: str) -> tuple:
            frame = int("".join(ch for ch in Path(n).stem if ch.isdigit()) or 0)
            return (Path(n).parent.name != "Bboxes", frame % STRIDE, frame)
        names.sort(key=order)
        chunks = [names[k::THREADS] for k in range(THREADS)]
        with cf.ThreadPoolExecutor(THREADS) as ex:
            n = sum(ex.map(lambda c: fetch_members(url, c), chunks))
        print(f"{cam}: {n} files", flush=True)


if __name__ == "__main__":
    main()
