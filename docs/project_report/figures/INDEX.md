# UrbanFix report figures

Every chart and diagram is saved as a 300 dpi PNG and as an SVG with live text. The app screens are in `screens/`, each as an SVG phone mockup and a framed PNG. The report number is the figure's number in `report.docx`.

| File | Report | What it shows | Source |
|---|---|---|---|
| fig01_pothole_accidents_india | Fig. 1.1 | Pothole-related road accidents (2020 to 2024) and deaths (2018 to 2022) | MoRTH, Lok Sabha reply 12 Feb 2026; Road Accidents in India 2018 to 2022 |
| fig02_cpgrams_received_disposed | Fig. 1.2 | CPGRAMS grievances received, disposed and brought forward, 2019 to 2024 | PIB Parliament replies, 16 Mar 2022 and 2 Apr 2025 |
| fig03_grievance_disposal_time | Fig. 1.3 | Average disposal time, central ministries against State/UT governments | PIB Rajya Sabha reply, 5 Feb 2026 |
| fig04_feature_coverage_matrix | Fig. 2.1 | Twelve capabilities across the seven reviewed systems and UrbanFix | Literature survey |
| fig05_capability_gaps | Fig. 2.2 | How many reviewed systems lack each capability | Derived from Fig. 2.1 |
| fig06_text_classification_accuracy | Fig. 2.3 | Reported text classification accuracy with baselines | Papers [2], [4], [6], [7] |
| fig07_dataset_availability | Fig. 3.1 | Largest public dataset per candidate category and the selection criteria | RDD2022, TACO, Road Hazards, STORM, Hugging Face, Roboflow, arXiv |
| fig08_governance_loop | Fig. 4.1 | The six-link governance loop | System design |
| fig12_use_case_diagram | Fig. 4.2 | Use cases by role | System design |
| fig10_complaint_lifecycle | Fig. 4.3 | Stages, public statuses and transitions | backend/utils/complaintStage.js |
| fig14_urgency_score_bands | Fig. 4.4 | Question weights and every reachable urgency score | mobile/src/constants/categories.js, utils/urgency.js |
| fig09_system_architecture | Fig. 4.5 | Three-tier architecture with the AI service | System design |
| fig11_submission_sequence | Fig. 4.6 | Submission, OTP and AI validation sequence | System design |
| fig13_er_diagram | Fig. 4.7 | Database entities and relationships | backend/models |
| fig23_screens_citizen | Fig. 5.1 | Citizen screens | Running app, demo database |
| fig24_screens_track_supervisor | Fig. 5.2 | Tracker and supervisor screens | Running app, demo database |
| fig25_screens_field | Fig. 5.3 | Field worker screens | Running app, demo database |
| fig26_screens_admin_research | Fig. 5.4 | Admin and researcher screens | Running app, demo database |
| fig15_training_curves | Fig. 5.5 | Loss and validation mAP50 per epoch | Our training runs |
| fig16_precision_recall | Fig. 5.6 | Precision-recall curves | Our validation runs |
| fig17_confusion_matrices | Fig. 5.7 | Normalised confusion matrices | Our validation runs |
| fig18_model_comparison | Fig. 5.8 | Precision, recall, mAP50, mAP50-95 per model | Our validation runs |
| fig20_sample_detections | Fig. 5.9 | Model output on validation images | Our trained models |
| fig19_inference_latency | Fig. 5.10 | Time per image on CPU and Apple MPS | Our benchmark |
| fig21_complaint_funnel_demo | Fig. 6.1 | Complaints reaching each stage | Demo dataset (seeded) |
| fig22_resolution_time_demo | Fig. 6.2 | Days from filing to closure by category | Demo dataset (seeded) |
| fig27_screens_extra | Fig. A.1 | Extra screens | Running app, demo database |
