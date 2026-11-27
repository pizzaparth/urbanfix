"""Download the Chicago 311 requests used by the linkage analysis (B5).

    python3 analysis/privacy/scripts/fetch_chicago311.py

Source: City of Chicago Data Portal, "311 Service Requests" (dataset v6vf-nfxy),
public SODA API, no key needed. Terms: https://www.chicago.gov/city/en/narr/foia/data_disclaimer.html

Rows: requests created in 2024 of the three types that match the UrbanFix categories
(pothole, litter, graffiti). Only the fields the analysis needs are kept; street
address and coordinates are not downloaded. Output: analysis/privacy/data/chicago311_2024.csv
(git-ignored) and a manifest with the query, row count and SHA-256.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://data.cityofchicago.org/resource/v6vf-nfxy.csv"
TYPES = {"Pothole in Street Complaint": "pothole",
         "Fly Dumping Complaint": "garbage_litter",
         "Graffiti Removal Request": "graffiti"}
FIELDS = ["sr_number", "sr_type", "status", "created_date", "closed_date", "ward", "duplicate", "legacy_record"]
PERIOD = ("2024-01-01T00:00:00", "2024-12-31T23:59:59")
PAGE = 50000  # rows per request; one type and month never comes close
OUT = Path(__file__).resolve().parents[1] / "data"


def where(sr_type: str, month: int) -> str:
    end = f"2024-{month + 1:02d}-01T00:00:00" if month < 12 else "2025-01-01T00:00:00"
    return f"sr_type = '{sr_type}' and created_date >= '2024-{month:02d}-01T00:00:00' and created_date < '{end}'"


def fetch(sr_type: str, month: int) -> list[dict]:
    """One request per type and month: small queries return in seconds, one large sorted query stalls."""
    q = urllib.parse.urlencode({"$select": ",".join(FIELDS), "$where": where(sr_type, month), "$limit": PAGE})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(f"{BASE}?{q}", timeout=120) as r:
                rows = list(csv.DictReader(io.StringIO(r.read().decode("utf-8"))))
            if len(rows) >= PAGE:
                raise SystemExit(f"{sr_type} {month}: {len(rows)} rows, raise PAGE")
            return rows
        except (OSError, ValueError) as e:  # network hiccup: wait and retry
            print("retry", sr_type, month, attempt, e, flush=True)
            time.sleep(10 * (attempt + 1))
    raise SystemExit("download failed")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for sr_type in TYPES:
        for month in range(1, 13):
            rows += fetch(sr_type, month)
            print(f"{sr_type} 2024-{month:02d}: {len(rows)} rows", flush=True)
    rows.sort(key=lambda r: r["sr_number"])
    path = OUT / "chicago311_2024.csv"
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    (OUT / "chicago311_2024.manifest.json").write_text(json.dumps({
        "source": "City of Chicago Data Portal, 311 Service Requests (v6vf-nfxy)", "endpoint": BASE,
        "select": FIELDS, "types": list(TYPES), "created": PERIOD, "downloaded_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "rows": len(rows), "sha256": sha}, indent=1))
    print("wrote", path, len(rows), sha)


if __name__ == "__main__":
    main()
