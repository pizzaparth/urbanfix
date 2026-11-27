# Datasets: provenance, licences and decisions

This file answers Reviewer 2 (iv) and records actions D1 to D4 of `feedback/action.md`.
Every dataset below was checked on 2026-11-24 to 26 against its publisher page or API.
A dataset may train a model only if it meets all five criteria of Eq. (1):
public, localised labels, street-level images, documented provenance (a named
collector and a stated way the images were taken), and a licence that allows
research use.

## D1. Provenance and licence of every dataset

| Category | Dataset | Collector and how images were taken | Licence | Where (version, access date) | Source photos vs copies | Redistribution | Role |
|---|---|---|---|---|---|---|---|
| Pothole | **RDD2022**, class D40 (Arya et al., Geoscience Data Journal, 2024) | Named research team (University of Tokyo and partners). Vehicle-mounted smartphones (Japan, India, Czech Republic), high-resolution vehicle cameras (Norway), motorbike and drone cameras (China); the **United States images are Google Street View captures** (RDD2022 paper, data collection section). | CC BY 4.0 (figshare record); the paper says nothing about the licence of the Street View images, which belong to Google | doi:10.6084/m9.figshare.21431547.v1, accessed 2026-11-24 | Original frames, no augmentation | Yes, with attribution, **except the United States subset** | **Training** (Japan, Czech, China motorbike, and India in the deployed model); **external test** (India, for the model trained without it). **United States excluded** (F25) |
| Pothole | Roboflow "Pothole_Segmentation_YOLOv8" v1 [16] | "Provided by a Roboflow user"; image sources not stated | CC BY 4.0 | universe.roboflow.com/farzad/pothole_segmentation_yolov8, export of 2023-10-20 | 300 source photos; training folder holds 3 Roboflow augmentations of each of 240 | Yes, with attribution | **External test only** (provenance not documented) |
| Litter | **TACO**, official annotations [17] (Proença and Simões, 2020) | Named authors; photos taken by the authors and volunteers in woods, roads and beaches, hosted by the project | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.3587843; annotation file from github.com/pedropro/TACO | 1,500 photos (1,428 still downloadable) | Yes, with attribution | **Training** |
| Litter | TACO unofficial annotations | Public submissions through tacodataset.org, not reviewed by the TACO authors | Image licence field "CC" for the 2,399 TACO-hosted images used; 1,432 OpenLitterMap images (ODbL) left out | `data/annotations_unofficial.json` at commit 3844bcd (2026-10-20) | Original photos | Yes, with attribution | **External test only** (different photographers; labels unreviewed) |
| Open manhole | Kaggle "potholes, cracks and openmanholes (Road Hazards)", v2 | Uploader named (Sabid Rahman); no statement of who took the images or where. The dataset's cover image has an Adobe Stock preview file name, which suggests some images come from stock-photo sites. 2,700 images, most of them augmented copies. | CC BY-NC-SA 4.0 as stated by the uploader | kaggle.com/datasets/sabidrahman/pothole-cracks-and-openmanhole, updated 2025-02-23 | 172 distinct source photos in the old validation set, 61 also in training (F1) | Not by us: the uploader may not hold the rights to all images | **Not used.** Fails Eq. (1); the category was withdrawn (D3) |
| Litter | PlastOPol (Córdova et al., Sensors, 2022) | Named authors; images from the Marine Debris Tracker app, labelled by the authors; 2,418 images, 5,300 litter boxes | CC BY 4.0 (Zenodo record; images CC BY from Marine Debris Tracker) | doi:10.5281/zenodo.5829156 | Original photos | Yes, with attribution | **Optional external test** (7.7 GB on Zenodo; fetch on Colab if used in phase 3) |
| Graffiti | **STORM graffiti/tagging** [19] (University of West Attica, 2019) | Named authors; smartphone photos taken in Athens through the STORM crowdsensing app | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.3238357, published 2019-06-04 | 1,022 original photos, official 813/209 train/test split | Yes, with attribution | **Training**; official test split kept as the test set |
| Graffiti | City Risks (FORMAS Research Group, 2022) | Group named, but no statement of who took the images or where; 9,738 images with 8 classes (spray, graffiti, gun, fire, smoke, knife, puddle, mud) | CC BY 4.0 (Zenodo record) | doi:10.5281/zenodo.6636723 | Unknown | Yes, with attribution | **Not used.** Provenance not documented |
| Graffiti | 17K-Graffiti (Lavi and Poco, 2022) | Named authors; street-view images of São Paulo | Restricted: academic use on request | doi:10.5281/zenodo.5899631 | n/a | No | **Not used.** Not openly downloadable |
| All | COCO 2017 validation (Lin et al., 2014) | Named authors, Flickr photos | Annotations CC BY 4.0; images under their Flickr licences | cocodataset.org | n/a | Links only | **Negatives for A5** (phase 3) |

Correction to the plan: the RDD2022 figshare record states **CC BY 4.0**, not CC BY-SA 4.0.

A second graffiti set was searched for on Zenodo, figshare and Mendeley on 2026-11-26. None was both
open and documented (City Risks, 17K-Graffiti above; the Lisbon graffiti set of Applied Sciences 13(4)
2249 is available on request only). Graffiti therefore has no external test set; its untouched
official STORM test split is the only test.

## D2. Pothole: switch to RDD2022

The Roboflow set has a licence but no documented provenance, so by Eq. (1) it cannot train a model.
The pothole model is therefore retrained on RDD2022 class D40 (pothole). RDD2022 has boxes only,
so the pothole model becomes a box detector (YOLOv8n). This fits A10, which removes the mask-based
δ-to-urgency rule.

Design of the RDD2022 use:

- **India is held out completely.** The model never sees an Indian image during training or model
  selection. India is the external test set for A3 and the main number for the fairness analysis
  (A11): it measures what happens to complaints from roads unlike the training data.
- In-domain pool: Japan, Czech Republic and China (motorbike). Each country is split 70/15/15 by
  source group, so every country has its own in-domain test set for A11.
- **United States is left out** (decided 2026-11-27, F25): the RDD2022 paper states that those images
  are Google Street View captures. Google holds their copyright, so the dataset's CC BY 4.0 licence
  cannot cover them, and they fail the licence criterion of Eq. (1). Removing them left the Japan,
  Czech and China splits unchanged (checked file by file).
- **India was added in a second split** (`splits/pothole_india.json`, decided 2026-11-26) after the
  model trained without India performed far worse on Indian roads; that model is the one deployed.
  Its India test images also serve as an external set for the model trained without India, so the
  two are compared on identical photos.
- Norway is left out: its archive is 10.6 GB of very wide dashboard images, larger than the other
  countries together, and adds no new road type for this use.
- China (drone) is left out: aerial images are not what residents photograph.
- Every image with at least one D40 box is used, plus a seeded sample of images without D40
  (other damage or none) equal to 25 % of the positives, as background images.
- The Roboflow set (one copy per source photo) becomes a second external test set: close-up,
  handheld-style pothole photos.

## D3. Open manhole: category withdrawn

Checked on 2026-11-24 through the Kaggle API: the licence is CC BY-NC-SA 4.0 as stated by the uploader,
the person who took the images is not named, and no source is given. The dataset's cover image has an
Adobe Stock preview file name. The dataset therefore fails the "documented provenance" criterion of
Eq. (1), and its licence statement cannot be relied on for images the uploader may not own.

A rendered replacement exists (Synthetic Urban Manhole Cover Dataset, Zenodo doi:10.5281/zenodo.21291309,
CC BY 4.0), but it contains no real photos. On 2026-11-26 the authors decided to **withdraw the open
manhole category** rather than train on rendered images: the screening rule of Eq. (1) then works as
designed, and the paper reports the withdrawal as a result of the rule.

Consequences in the code: the API no longer accepts the category (`backend/constants/categories.js`),
the app no longer offers it, the vision service no longer loads a manhole model, and its weights and
training notebook were removed. Complaints filed under the category earlier keep it, and their
questionnaire stays in `backend/constants/questionnaires.js` so their published urgency can still be
recomputed. The leakage audit of the old manhole split stays in `results/split_audit_old.json`,
because the submitted paper reported a score on it.

## D4. Eq. (1)

`main.tex` Eq. (1) now lists all five criteria. Fig. 4 is redrawn by `scripts/fig_dataset_screening.py`
with a fifth column (usable licence) and the corrected open manhole row; licences are assessed only for
datasets that pass every other criterion. Table IV lists collector, licence, DOI, splits and external
test sets for the three categories.

## Splits (A1)

`scripts/make_splits.py` builds the splits and writes `splits/<category>.json` and
`splits/external/<name>.json` (file names, group ids, labels' source paths; no images).
`scripts/build_yolo_sets.py` turns them into YOLO folders under `data/v2/`.
Download scripts: `scripts/fetch_rdd2022.py` and `scripts/fetch_taco_unofficial.py`; TACO official
and STORM come from `notebooks/00_download_datasets.ipynb`.

Measured numbers are in `results/split_audit_old.json` (old splits) and `results/split_report.json`
(new splits); see the summary in `feedback/action.md`, section 10a.
