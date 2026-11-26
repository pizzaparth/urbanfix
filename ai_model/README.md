# UrbanFix AI models

This folder holds everything behind the three category models that UrbanFix uses to check complaint photos: the notebooks that download data, train and evaluate the models, the trained weights, and the metrics quoted in the project report.

## Layout

```
ai_model/
├── notebooks/
│   ├── 00_download_datasets.ipynb     download TACO, STORM and the Road Hazards dataset
│   ├── 01_pothole_road_damage.ipynb   train the pothole segmentation model
│   ├── 02_garbage_litter.ipynb        convert TACO to one "Litter" class, train segmentation
│   ├── 04_graffiti.ipynb              convert STORM CSV boxes to YOLO, train detection
│   ├── 05_evaluate_models.ipynb       metrics, PR curves, confusion counts, latency -> results/
│   └── 06_report_figures.ipynb        Figures 5.5 to 5.10 of the report
├── weights/                           trained models used by the AI service
│   ├── pothole_road_damage_model.pt
│   ├── garbage_litter_model.pt
│   └── graffiti_model.pt
├── results/
│   ├── eval.json                      every number in the report's model results
│   └── garbage_split.json             how many TACO images were usable, and the split
├── scripts/
│   ├── make_splits.py                 grouped, leak-free train/val/test splits (A1) -> splits/
│   ├── build_yolo_sets.py             YOLO folders under data/v2/ from the split lists
│   ├── fig_dataset_screening.py       Fig. 4 of the paper (category screening against Eq. 1)
│   ├── fetch_rdd2022.py               RDD2022 country archives (pothole training and India test)
│   ├── fetch_taco_unofficial.py       TACO unofficial annotations (external litter test)
│   └── remote_zip.py                  read members of a large remote zip with range requests
├── splits/                            split lists: file names, group ids, label sources (no images)
│   └── external/                      external test sets for cross-dataset evaluation (A3)
├── DATASETS.md                        provenance, licences and the dataset decisions (D1 to D3)
├── road_damage.ipynb                  original pothole exploration, including damaged-area estimate
├── Pothole_Segmentation_YOLOv8.v1i.yolov8/   pothole dataset (Roboflow, CC BY 4.0; git-ignored, download it)
├── data/                              downloaded and converted datasets (git-ignored)
└── runs/                              Ultralytics training logs and plots (git-ignored)
```

## New splits and datasets (2026 revision)

The results table below comes from the **old** splits, which leak: 262 of the 480 open manhole
validation images shared a source photo with a training image, and the graffiti "validation" set is
the official STORM test split. These numbers will be replaced by test-set numbers on the new splits.

Open manholes are no longer a category: the Kaggle dataset names no photographer or source, so it
fails Eq. (1) (see `DATASETS.md`). Its weights and notebook were removed; its old row stays in the
table below only as a record of the submitted paper.

```bash
python scripts/fetch_rdd2022.py            # about 2.5 GB
python scripts/fetch_taco_unofficial.py    # about 2,400 small images
python scripts/make_splits.py --audit      # leakage in the old splits -> results/split_audit_old.json
python scripts/make_splits.py              # new splits -> splits/, results/split_report.json
python scripts/build_yolo_sets.py          # YOLO folders -> data/v2/
```

The pothole model moves to RDD2022 (boxes); see `DATASETS.md` for why.

## Results (old splits, superseded)

The four models of the submitted paper are YOLOv8 nano, fine-tuned from COCO weights at 640 px, batch 16, with early stopping after 15 epochs without improvement. They were trained on an Apple M5 laptop with the MPS backend.

| Model | Task | Train / val images | Epochs | Precision | Recall | mAP50 | CPU ms per image |
|---|---|---|---|---|---|---|---|
| Pothole / Road Damage | segmentation (mask) | 720 / 60 | 60 | 0.725 | 0.711 | 0.724 | 33 |
| Garbage / Litter | segmentation (mask) | 1,214 / 214 | 45 | 0.757 | 0.434 | 0.502 | 24 |
| Open Manhole | detection (box) | 1,123 / 480 | 42 (early stop) | 0.890 | 0.874 | 0.908 | 19 |
| Graffiti | detection (box) | 813 / 209 | 50 | 0.836 | 0.604 | 0.729 | 20 |

Notes:
- Only 1,428 of TACO's 1,500 images could still be downloaded from their original links.
- The Road Hazards dataset includes augmented copies of some photos, so the open manhole score may be optimistic.
- A low recall does not reject complaints. The AI service flags unsure results for a supervisor to review.

## Running the notebooks

```bash
cd ai_model
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab notebooks/
```

Run `00` once to fetch the data, then `01`, `02` or `04` to train a model (these reproduce the submitted paper on the old splits). Each training notebook copies its best checkpoint into `weights/` and prints the validation numbers. Run `05` with nothing else using the GPU, then `06` to redraw the report figures. Data preparation cells skip work that is already done.

Training times on the M5: 29 to 52 minutes per model.

## Datasets and licences

| Category | Dataset | Licence |
|---|---|---|
| Pothole / Road Damage | RDD2022, Arya et al., doi:10.6084/m9.figshare.21431547 (training and India test) | CC BY 4.0 |
| Pothole / Road Damage | Roboflow Pothole Segmentation YOLOv8, v1 (old model; now external test only) | CC BY 4.0 |
| Garbage / Litter | TACO, Proença and Simões, doi:10.5281/zenodo.3587843 | CC BY 4.0 |
| Graffiti | STORM graffiti/tagging dataset, University of West Attica, doi:10.5281/zenodo.3238357 | CC BY 4.0 |

Full provenance: `DATASETS.md`.
