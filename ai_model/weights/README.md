# Model weights

| File | Run | Task | Trained on | Licence of the training data |
|---|---|---|---|---|
| `pothole_road_damage_model.pt` | `pothole_india__yolov8n__s0` | box detection | RDD2022 class D40: Japan, Czech Republic, China (motorbike), India | CC BY 4.0 |
| `garbage_litter_model.pt` | `garbage_litter__yolov8n__s0` | segmentation | TACO, official annotations | CC BY 4.0 |
| `graffiti_model.pt` | `graffiti__yolov8n__s0` | box detection | STORM graffiti/tagging, official train split | CC BY 4.0 |

Each threshold τ is in `ai_service/thresholds.json`. The test results are in
`ai_model/results/phase3_summary.md`, and the training settings are in
`ai_model/results/train/<run>.json`.

## Licence

All three models are YOLOv8n models, fine-tuned with the Ultralytics library from
Ultralytics' COCO-pretrained `yolov8n.pt` / `yolov8n-seg.pt`. Ultralytics releases
the library and those pretrained weights under **AGPL-3.0**, so these fine-tuned
weights are released under **AGPL-3.0** as well, not under the MIT licence of the
UrbanFix source code.

The training data is CC BY 4.0, which requires attribution:

- RDD2022: D. Arya, H. Maeda, S. K. Ghosh, D. Toshniwal and Y. Sekimoto, "RDD2022: A
  multi-national image dataset for automatic road damage detection", Geoscience Data
  Journal, 2024. doi:10.6084/m9.figshare.21431547. The United States subset (Google
  Street View images) was not used.
- TACO: P. F. Proença and P. Simões, "TACO: Trash Annotations in Context for Litter
  Detection", arXiv:2003.06975, 2020. doi:10.5281/zenodo.3587843.
- STORM: C. Patrikakis, P. Kasnesis, L. Toumanidis and A. Tzitamidis, "STORM graffiti/tagging
  detection dataset", University of West Attica, Zenodo, 2019.
  doi:10.5281/zenodo.3238357.

## Not tracked

`v2/` holds the weights of every phase 3 run (12 runs, about 320 MB). It is
git-ignored because of its size. Rebuild it from the split lists with
`scripts/train.py`, as described in `feedback/action.md`, phase 3.
