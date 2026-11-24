# Datasets: provenance, licences and decisions

This file answers Reviewer 2 (iv) and records actions D1 to D3 of `feedback/action.md`.
Every dataset below was checked on 2026-11-24 against its publisher page or API.
A dataset may train a model only if it meets all five criteria of Eq. (1):
public, localised labels, street-level images, documented provenance (a named
collector and a stated way the images were taken), and a licence that allows
research use.

## D1. Provenance and licence of every dataset

| Category | Dataset | Collector and how images were taken | Licence | Where (version, access date) | Source photos vs copies | Redistribution | Role |
|---|---|---|---|---|---|---|---|
| Pothole | **RDD2022**, class D40 (Arya et al., Geoscience Data Journal, 2024) | Named research team (University of Tokyo and partners). Smartphone and dashboard cameras on public roads in Japan, India, Czech Republic, Norway, United States and China. | CC BY 4.0 (figshare record) | doi:10.6084/m9.figshare.21431547.v1, accessed 2026-11-24 | Original frames, no augmentation | Yes, with attribution | **Training** (Japan, Czech, United States, China motorbike); **external test** (India) |
| Pothole | Roboflow "Pothole_Segmentation_YOLOv8" v1 [16] | "Provided by a Roboflow user"; image sources not stated | CC BY 4.0 | universe.roboflow.com/farzad/pothole_segmentation_yolov8, export of 2023-10-20 | 300 source photos; training folder holds 3 Roboflow augmentations of each of 240 | Yes, with attribution | **External test only** (provenance not documented) |
| Litter | **TACO**, official annotations [17] (Proença and Simões, 2020) | Named authors; photos taken by the authors and volunteers in woods, roads and beaches, hosted by the project | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.3587843; annotation file from github.com/pedropro/TACO | 1,500 photos (1,428 still downloadable) | Yes, with attribution | **Training** |
| Litter | TACO unofficial annotations | Public submissions through tacodataset.org, not reviewed by the TACO authors | Image licence field "CC" for the 2,399 TACO-hosted images used; 1,432 OpenLitterMap images (ODbL) left out | `data/annotations_unofficial.json` at commit 3844bcd (2026-10-20) | Original photos | Yes, with attribution | **External test only** (different photographers; labels unreviewed) |
| Open manhole | **Synthetic Urban Manhole Cover Dataset** (Strakos, Zurkova and Topic, 2026) | Named authors; rendered street scenes from 12 virtual cameras (dashboard, sidewalk and pedestrian views), open and closed covers about 50:50 | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.21291309, published 2026-07-10 | 1,184 rendered frames; camera-disjoint splits published by the authors | Yes, with attribution | **Training** (replaces [18]) |
| Open manhole | Kaggle "potholes, cracks and openmanholes (Road Hazards)" [18], v2 | Uploader named (Sabid Rahman); no statement of who took the images or where. The dataset's cover image has an Adobe Stock preview file name, which suggests some images come from stock-photo sites. 2,700 images, most of them augmented copies. | CC BY-NC-SA 4.0 as stated by the uploader | kaggle.com/datasets/sabidrahman/pothole-cracks-and-openmanhole, updated 2025-02-23 | 172 distinct source photos in the old validation set, 61 also in training (F1) | Not by us: the uploader may not hold the rights to all images | **Evaluation only**, as a real-photo stress test; results labelled "indicative" |
| Graffiti | **STORM graffiti/tagging** [19] (University of West Attica, 2019) | Named authors; smartphone photos taken in Athens through the STORM crowdsensing app | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.3238357, published 2019-06-04 | 1,022 original photos, official 813/209 train/test split | Yes, with attribution | **Training**; official test split kept as the test set |
| All | COCO 2017 validation (Lin et al., 2014) | Named authors, Flickr photos | Annotations CC BY 4.0; images under their Flickr licences | cocodataset.org | n/a | Links only | **Negatives for A5** (phase 3) |

Correction to the plan: the RDD2022 figshare record states **CC BY 4.0**, not CC BY-SA 4.0.

## D2. Pothole: switch to RDD2022

The Roboflow set has a licence but no documented provenance, so by Eq. (1) it cannot train a model.
The pothole model is therefore retrained on RDD2022 class D40 (pothole). RDD2022 has boxes only,
so the pothole model becomes a box detector (YOLOv8n). This fits A10, which removes the mask-based
δ-to-urgency rule.

Design of the RDD2022 use:

- **India is held out completely.** The model never sees an Indian image during training or model
  selection. India is the external test set for A3 and the main number for the fairness analysis
  (A11): it measures what happens to complaints from roads unlike the training data.
- In-domain pool: Japan, Czech Republic, United States and China (motorbike). Each country is split
  70/15/15 by source group, so every country has its own in-domain test set for A11.
- Norway is left out: its archive is 10.6 GB of very wide dashboard images, larger than the other
  countries together, and adds no new road type for this use.
- China (drone) is left out: aerial images are not what residents photograph.
- Every image with at least one D40 box is used, plus a seeded sample of images without D40
  (other damage or none) equal to 25 % of the positives, as background images.
- The Roboflow set (one copy per source photo) becomes a second external test set: close-up,
  handheld-style pothole photos.

## D3. Open manhole: Kaggle set replaced by the synthetic set

Checked by hand on 2026-11-24 through the Kaggle API: the licence is CC BY-NC-SA 4.0, the collector of the
images is not named, and no source is given. The dataset therefore fails the "documented provenance"
criterion, and its licence statement cannot be trusted for images the uploader may not own.

Decision: **replace** it with the Synthetic Urban Manhole Cover Dataset (CC BY 4.0, named authors,
DOI). The paper must say plainly that the open manhole model is trained only on rendered images.
To measure the gap to real photos, the Kaggle images are kept as an evaluation-only test set
(non-commercial research use, nothing redistributed, one copy per source photo). If that gap is large,
the honest result is that open manholes should be dropped from the supported categories until a
documented real dataset exists; the screening rule then works as designed.

The split list `splits/open_manhole.json` is built from the publisher's manifest (cameras 1 to 8
train, 9 and 10 val, 11 and 12 test). The images are not downloaded locally, because Zenodo served
only 80 to 160 KB/s to our network; they are fetched on the Kaggle or Colab machine in phase 3, and
`make_splits.py` is rerun there so the near-duplicate check covers all 1,184 frames (it covered 7 at
the time of writing). The split itself cannot change: every camera belongs to one split.

The synthetic set also contains **closed** manhole covers. These are ideal hard negatives for A5:
a closed cover filed as "open manhole" should be flagged.

## D4. Eq. (1)

`main.tex` Eq. (1) now lists all five criteria. Fig. 4 still needs a fifth column (licence), and its
open-manhole row must change (phase 6, P4): the Kaggle set has no documented source, and the
replacement has 1,184 synthetic images.

## Splits (A1)

`scripts/make_splits.py` builds the splits and writes `splits/<category>.json` and
`splits/external/<name>.json` (file names, group ids, labels' source paths; no images).
`scripts/build_yolo_sets.py` turns them into YOLO folders under `data/v2/`.
Download scripts: `scripts/fetch_rdd2022.py`, `scripts/fetch_taco_unofficial.py`,
`scripts/fetch_synthetic_manhole.py`; the older sets come from `notebooks/00_download_datasets.ipynb`.

Measured numbers are in `results/split_audit_old.json` (old splits) and `results/split_report.json`
(new splits); see the summary in `feedback/action.md`, section 10a.
