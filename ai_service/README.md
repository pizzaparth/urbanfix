# UrbanFix vision service

FastAPI wrapper around the four per-category YOLOv8n models in `ai_model/weights/`.
The backend calls it after a complaint is filed (`backend/services/aiClient.js`) and
stores the answer as `aiAnalysis`. The result is advisory: it never changes a
complaint's stage or urgency. If the service is down or slow, the complaint is still
filed and is flagged for review.

## Run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Then set `AI_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`.

## API

`GET /health` lists the loaded models, their versions (file hash) and τ per category.

`POST /predict/{category}` with 1 to 3 images in the multipart field `files`.
`category` is one of `pothole_road_damage`, `garbage_litter`, `open_manhole`,
`graffiti`. The response has:

| Field | Meaning |
|---|---|
| `s_star` | Highest confidence of any detection with s ≥ τ, over all photos (Eq. 3). 0 when none. |
| `delta` | Largest masked share of one photo (Eq. 4). Segmentation models only, `null` for box models. Evidence only. |
| `needs_review` | `s_star < tau` (Eq. 5). |
| `tau` | Threshold for this category, from `thresholds.json`. |
| `images[]` | Per photo: detections (box, confidence, class), mask share, annotated JPEG (base64). |
| `model_version` | Model name and the first 12 hex digits of the weights file's SHA-256. |

## Thresholds

`thresholds.json` holds τ per category. All four are 0.25, the value in the submitted
paper, until the τ sweep (feedback/action.md, A4) picks per-category values.
`TAU_<CATEGORY>` environment variables override single values.

## Tests

```bash
.venv/bin/python -m pytest -q tests
```

The tests use the real weights. `tests/fixtures/pothole.jpg` is a CC BY 4.0 image
(see `tests/fixtures/README.md`).
