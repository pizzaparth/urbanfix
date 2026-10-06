# UrbanFix report figures

Every chart and diagram is saved as a 300 dpi PNG and as an SVG with live text. The app screens are in `screens/`, each as an SVG phone mockup and a framed PNG. The report number is the figure's number in `report.docx`.

| File | Report | What it shows | Source |
|---|---|---|---|
| fig01_pothole_accidents_india | Fig. 1.1 | Pothole-related road accidents (2020 to 2024) and deaths (2018 to 2022) in India | MoRTH, Lok Sabha reply 12 Feb 2026; Road Accidents in India 2018 to 2022 |
| fig02_cpgrams_received_disposed | Fig. 1.2 | Grievances received and disposed on CPGRAMS, with the backlog at the start of each year (2019 to 2024) | PIB Parliament replies, 16 Mar 2022 and 2 Apr 2025 |
| fig03_grievance_disposal_time | Fig. 1.3 | Average grievance disposal time on CPGRAMS: central ministries against State and UT governments | PIB Rajya Sabha reply, 5 Feb 2026 |
| fig04_feature_coverage_matrix | Fig. 2.1 | Feature coverage of the reviewed systems [1] to [7] compared with UrbanFix | Literature survey |
| fig05_capability_gaps | Fig. 2.2 | Number of reviewed systems lacking each capability | Derived from Fig. 2.1 |
| fig06_text_classification_accuracy | Fig. 2.3 | Reported complaint-text classification accuracy in the literature, with baselines and the manual officer reference | Papers [2], [4], [6], [7] |
| fig07_dataset_availability | Fig. 3.1 | Largest public dataset found for each candidate complaint category and the selection criteria it meets | RDD2022, TACO, Road Hazards, STORM, Hugging Face, Roboflow, arXiv |
| fig08_governance_loop | Fig. 4.1 | The UrbanFix governance loop: Report, Validate, Prioritise, Act, Prove and Learn | System design |
| fig12_use_case_diagram | Fig. 4.2 | Use-case diagram of UrbanFix by role | System design |
| fig10_complaint_lifecycle | Fig. 4.3 | Complaint lifecycle: internal stages, public statuses and allowed transitions | backend/utils/complaintStage.js |
| fig14_urgency_score_bands | Fig. 4.4 | Urgency scoring: question weights per category and all reachable scores | mobile/src/constants/categories.js, utils/urgency.js |
| fig09_system_architecture | Fig. 4.5 | System architecture of UrbanFix | System design |
| fig11_submission_sequence | Fig. 4.6 | Sequence of complaint submission, OTP verification and AI validation | System design |
| fig13_er_diagram | Fig. 4.7 | Entity-relationship diagram of the UrbanFix database | backend/models |
| fig23_screens_citizen | Fig. 5.1 | Citizen screens: home, public registry and category selection | Running app, demo database |
| fig24_screens_citizen_track | Fig. 5.2 | Citizen screens: swipe questionnaire, complaint tracker and account entry | Running app, demo database |
| fig25_screens_supervisor | Fig. 5.3 | Supervisor screens: triage queue, complaint detail and field staff roster | Running app, demo database |
| fig26_screens_field | Fig. 5.4 | Field worker screens: task list, task detail, attendance and leave | Running app, demo database |
| fig27_screens_admin | Fig. 5.5 | Admin screens: console, category and urgency analytics, people management | Running app, demo database |
| fig28_screens_research | Fig. 5.6 | Supervisor city counters and researcher screens: insights, access and usage | Running app, demo database |
| fig15_training_curves | Fig. 5.7 | Training and validation loss with validation mAP50 for the four category models | Our training runs |
| fig16_precision_recall | Fig. 5.8 | Precision-recall curves on the validation sets | Our validation runs |
| fig17_confusion_matrices | Fig. 5.9 | Normalised confusion matrices on the validation sets | Our validation runs |
| fig18_model_comparison | Fig. 5.10 | Precision, recall and mAP50 of the four models side by side | Our validation runs |
| fig20_sample_detections | Fig. 5.11 | Sample validation images with model output for each category | Our trained models |
| fig19_inference_latency | Fig. 5.12 | Inference time per image on CPU and on the Apple MPS GPU backend | Our benchmark |
| fig21_complaint_funnel_demo | Fig. 6.1 | Complaints reaching each workflow stage (demonstration dataset) | Demo dataset (seeded) |
| fig22_resolution_time_demo | Fig. 6.2 | Days from filing to closure by category (demonstration dataset) | Demo dataset (seeded) |
