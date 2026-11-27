# Third-party material

The UrbanFix source code is MIT-licensed (`LICENSE`). This file lists what in the
repository is not ours, and what a user must download from its source.

## Datasets (not redistributed)

No dataset image is stored in this repository, except the photos listed under
"Photos inside figures" and the test fixture below. The split lists in
`ai_model/splits/` name files, group ids and label paths only. Download the data
with the scripts named in `ai_model/DATASETS.md`, which also records each
dataset's collector, licence, version and access date.

| Dataset | Licence | Use | Source |
|---|---|---|---|
| RDD2022 (Arya et al., 2024), class D40, without the United States subset | CC BY 4.0 | pothole training, India test | doi:10.6084/m9.figshare.21431547 |
| Roboflow "Pothole_Segmentation_YOLOv8" v1 | CC BY 4.0 | pothole external test | universe.roboflow.com/farzad/pothole_segmentation_yolov8 |
| TACO, official annotations (Proença and Simões, 2020) | CC BY 4.0 | litter training | doi:10.5281/zenodo.3587843 |
| TACO, unofficial annotations (TACO-hosted images marked CC) | CC | litter external test | github.com/pedropro/TACO |
| STORM graffiti/tagging (Patrikakis et al., 2019) | CC BY 4.0 | graffiti training and test | doi:10.5281/zenodo.3238357 |
| COCO 2017 val (Lin et al., 2014) | annotations CC BY 4.0; images under per-image Flickr licences | unrelated photos (negatives) | cocodataset.org |
| Chicago 311 Service Requests, 2024 | City of Chicago Data Portal terms of use | privacy linkage analysis | data.cityofchicago.org, dataset v6vf-nfxy |

The Chicago 311 extract is fetched by `analysis/privacy/scripts/fetch_chicago311.py`.
It is git-ignored; its SHA-256 is in `analysis/privacy/results/`.

## Model weights

`ai_model/weights/*.pt` are released under AGPL-3.0 because they are fine-tuned
from Ultralytics' AGPL-3.0 pretrained weights. See `ai_model/weights/README.md`
for the training data and its attribution.

## Software

- Ultralytics (YOLOv8, YOLO11, RT-DETR), AGPL-3.0. The vision service
  (`ai_service/`) and the training scripts (`ai_model/scripts/`) import it. It is
  installed from PyPI, not shipped here. Anyone who distributes or serves a
  modified vision service must meet the AGPL-3.0 terms for the combined work.
- Other dependencies are listed in `backend/package.json`, `mobile/package.json`,
  `ai_service/requirements.txt` and `ai_model/requirements.txt`, each under its own
  licence.

## Photos inside figures

| File | Photos | Licence |
|---|---|---|
| `ai_model/results/figures/errors_*.jpg` | RDD2022 (Japan, India), TACO and STORM photos | CC BY 4.0 (sources above) |
| `ai_model/results/figures/errors_graffiti.jpg` | COCO 2017 val id 80153, Flickr photo 5650798989 (https://www.flickr.com/photo.gne?id=5650798989) | CC BY 2.0 |

`ai_model/scripts/error_examples.py` draws a COCO photo only when its licence is
CC BY, "no known copyright restrictions" or US Government work. Other COCO photos
among the worst four are shown as a grey tile with their COCO id. Each figure's
`.json` file lists every photo with its dataset and licence.

## Test fixture

`ai_service/tests/fixtures/pothole.jpg` is RDD2022 `India/train/images/India_001247.jpg`,
CC BY 4.0. See `ai_service/tests/fixtures/README.md`.

## Paper and report figures

`paper/` and `docs/project_report/` hold the submitted paper and the course
reports. Some of their older figures contain dataset photos from sources that
this revision no longer uses. These figures are replaced or removed in the
revised paper (see `feedback/action.md`, phase 5a). Until then, use them only as
a record of the submitted version.
