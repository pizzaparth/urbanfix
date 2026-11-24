"""UrbanFix vision service.

Runs the per-category YOLOv8n model on the photos of one complaint and returns the
evidence of Eqs. (3) to (5) in the paper:

    s*    highest confidence of any detection with s >= tau_k, over all photos (Eq. 3)
    delta largest masked share of one photo, segmentation models only (Eq. 4)
    r     needs_review = s* < tau_k (Eq. 5)

The result is advisory. It never changes a complaint's stage or urgency; the backend
stores it for the supervisor (backend/services/aiClient.js).

Run:  uvicorn main:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
WEIGHTS_DIR = Path(os.getenv("WEIGHTS_DIR", ROOT.parent / "ai_model" / "weights"))
THRESHOLDS_FILE = Path(os.getenv("THRESHOLDS_FILE", ROOT / "thresholds.json"))
DEVICE = os.getenv("DEVICE", "cpu")

MAX_FILES = 3
MAX_FILE_BYTES = 5 * 1024 * 1024
ANNOTATED_MAX_SIDE = 1024

MODELS = {
    "pothole_road_damage": "pothole_road_damage_model.pt",
    "garbage_litter": "garbage_litter_model.pt",
    "open_manhole": "open_manhole_model.pt",
    "graffiti": "graffiti_model.pt",
}


def load_thresholds() -> dict[str, float]:
    """Per-category tau_k. The file holds the values chosen by the tau sweep
    (action A4); an environment variable TAU_<CATEGORY> overrides one value."""
    values = json.loads(THRESHOLDS_FILE.read_text())["tau"]
    for name in MODELS:
        override = os.getenv(f"TAU_{name.upper()}")
        if override:
            values[name] = float(override)
    return {name: float(values[name]) for name in MODELS}


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


class Loaded:
    def __init__(self, name: str, path: Path):
        self.name = name
        self.model = YOLO(str(path))
        self.task = self.model.task
        self.version = f"{name}@{file_digest(path)}"
        # Ultralytics models are not thread-safe; one inference per model at a time.
        self.lock = threading.Lock()


state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    state["tau"] = load_thresholds()
    state["models"] = {name: Loaded(name, WEIGHTS_DIR / file) for name, file in MODELS.items()}
    yield
    state.clear()


app = FastAPI(title="UrbanFix vision service", version="1.0.0", lifespan=lifespan)


def decode(data: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(data))
        image = ImageOps.exif_transpose(image)
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as err:
        raise HTTPException(status_code=400, detail="A file is not a readable image.") from err


def to_jpeg_base64(bgr: np.ndarray) -> str:
    image = Image.fromarray(bgr[..., ::-1])
    image.thumbnail((ANNOTATED_MAX_SIDE, ANNOTATED_MAX_SIDE))
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def analyse(loaded: Loaded, tau: float, images: list[Image.Image]) -> dict:
    per_image = []
    s_star = 0.0
    delta = 0.0 if loaded.task == "segment" else None

    for index, image in enumerate(images):
        with loaded.lock:
            result = loaded.model.predict(
                image, conf=tau, device=DEVICE, retina_masks=True, verbose=False
            )[0]

        detections = []
        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for xyxy, conf in zip(boxes.xyxy.tolist(), boxes.conf.tolist()):
                if conf < tau:
                    continue
                detections.append(
                    {
                        "box": [round(v, 1) for v in xyxy],
                        "confidence": round(float(conf), 4),
                        "class_name": loaded.model.names[0],
                    }
                )
                s_star = max(s_star, float(conf))

        mask_share = None
        if loaded.task == "segment":
            mask_share = 0.0
            if result.masks is not None and len(result.masks) > 0:
                keep = (result.boxes.conf >= tau).cpu()
                masks = result.masks.data.cpu()[keep]
                if len(masks) > 0:
                    mask_share = float(masks.bool().any(dim=0).float().mean())
            delta = max(delta, mask_share)

        per_image.append(
            {
                "index": index,
                "width": image.width,
                "height": image.height,
                "detections": detections,
                "mask_share": None if mask_share is None else round(mask_share, 4),
                "annotated_jpeg_base64": to_jpeg_base64(result.plot()),
            }
        )

    return {
        "s_star": round(s_star, 4),
        "delta": None if delta is None else round(delta, 4),
        "needs_review": s_star < tau,
        "images": per_image,
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "device": DEVICE,
        "tau": state["tau"],
        "models": {name: {"task": m.task, "version": m.version} for name, m in state["models"].items()},
    }


@app.post("/predict/{category}")
def predict(category: str, files: list[UploadFile] = File(...)) -> dict:
    loaded = state["models"].get(category)
    if loaded is None:
        raise HTTPException(status_code=404, detail=f"No model for category '{category}'.")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"At most {MAX_FILES} photos per complaint.")

    images = []
    for upload in files:
        data = upload.file.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="A photo is larger than 5 MB.")
        images.append(decode(data))

    tau = state["tau"][category]
    started = time.perf_counter()
    out = analyse(loaded, tau, images)
    return {
        "category": category,
        "model_version": loaded.version,
        "task": loaded.task,
        "tau": tau,
        "inference_ms": round((time.perf_counter() - started) * 1000, 1),
        **out,
    }
