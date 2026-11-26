"""Tests for the vision service. They use the real weights in ai_model/weights."""

import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app

FIXTURES = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def jpeg(color=(128, 128, 128), size=(320, 240)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="JPEG")
    return buf.getvalue()


def test_health_lists_three_models(client):
    body = client.get("/health").json()
    assert set(body["models"]) == {"pothole_road_damage", "garbage_litter", "graffiti"}
    assert body["models"]["pothole_road_damage"]["task"] == "segment"
    assert body["models"]["graffiti"]["task"] == "detect"
    assert all(0 < t < 1 for t in body["tau"].values())


def test_pothole_photo_is_confirmed(client):
    # An in-distribution pothole photo (fixtures/README.md): the model must clear tau.
    data = (FIXTURES / "pothole.jpg").read_bytes()
    body = client.post("/predict/pothole_road_damage", files=[("files", ("p.jpg", data, "image/jpeg"))]).json()
    assert body["needs_review"] is False
    assert body["s_star"] >= body["tau"]
    assert 0 < body["delta"] <= 1
    assert body["images"][0]["detections"]
    assert body["images"][0]["annotated_jpeg_base64"]


def test_blank_photo_needs_review(client):
    body = client.post("/predict/pothole_road_damage", files=[("files", ("blank.jpg", jpeg(), "image/jpeg"))]).json()
    assert body["needs_review"] is True
    assert body["s_star"] == 0
    assert body["delta"] == 0


def test_box_model_reports_no_delta(client):
    body = client.post("/predict/graffiti", files=[("files", ("blank.jpg", jpeg(), "image/jpeg"))]).json()
    assert body["delta"] is None
    assert body["images"][0]["mask_share"] is None


def test_s_star_is_max_over_photos(client):
    data = (FIXTURES / "pothole.jpg").read_bytes()
    files = [("files", ("blank.jpg", jpeg(), "image/jpeg")), ("files", ("p.jpg", data, "image/jpeg"))]
    body = client.post("/predict/pothole_road_damage", files=files).json()
    best = max((d["confidence"] for img in body["images"] for d in img["detections"]), default=0)
    assert body["s_star"] == best
    assert len(body["images"]) == 2
    assert body["needs_review"] is False


def test_unknown_category_is_404(client):
    r = client.post("/predict/water_leak", files=[("files", ("a.jpg", jpeg(), "image/jpeg"))])
    assert r.status_code == 404


def test_not_an_image_is_400(client):
    r = client.post("/predict/graffiti", files=[("files", ("a.jpg", b"not an image", "image/jpeg"))])
    assert r.status_code == 400


def test_more_than_three_photos_is_400(client):
    files = [("files", (f"{i}.jpg", jpeg(), "image/jpeg")) for i in range(4)]
    assert client.post("/predict/graffiti", files=files).status_code == 400


def test_no_files_is_422(client):
    assert client.post("/predict/graffiti").status_code == 422
