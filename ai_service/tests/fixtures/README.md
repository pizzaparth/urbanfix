# Test fixtures

`pothole.jpg` is `India/train/images/India_001247.jpg` from RDD2022 (Arya et al., Geoscience Data
Journal, 2024; doi:10.6084/m9.figshare.21431547), licensed CC BY 4.0. It lies in the test split of
`ai_model/splits/pothole_india.json`, and the deployed pothole model gives it a confidence of 0.814
(`ai_model/results/scores/pothole_india__yolov8n__s0.json`). It is used only to check that the service
returns a confident detection for an in-distribution photo; it says nothing about model accuracy
(see feedback/action.md, A2 and A5).
