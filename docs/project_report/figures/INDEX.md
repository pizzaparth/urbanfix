# UrbanFix report figures

Every chart and diagram is saved as a 300 dpi PNG and as an SVG with live text. The report number is the figure's number in `report.docx`.

Figures shared with the IEEE paper are stored once, in [`paper/figures/`](../../../paper/figures/README.md). The File column links to that copy. Only the report-specific figures (fig09, fig13, the fig23 to fig28 screen collages and the university logo) live in this folder.

| File | Report | What it shows | Source |
|---|---|---|---|
| [fig01_pothole_accidents_india](../../../paper/figures/01_motivation/F01_pothole_accidents_india.png) | Fig. 1.1 | Pothole-related road accidents (2020 to 2024) and deaths (2018 to 2022) in India | MoRTH, Lok Sabha reply 12 Feb 2026; Road Accidents in India 2018 to 2022 |
| [fig02_cpgrams_received_disposed](../../../paper/figures/01_motivation/F02_cpgrams_received_disposed.png) | Fig. 1.2 | Grievances received and disposed on CPGRAMS, with the backlog at the start of each year (2019 to 2024) | PIB Parliament replies, 16 Mar 2022 and 2 Apr 2025 |
| [fig03_grievance_disposal_time](../../../paper/figures/01_motivation/F03_grievance_disposal_time.png) | Fig. 1.3 | Average grievance disposal time on CPGRAMS: central ministries against State and UT governments | PIB Rajya Sabha reply, 5 Feb 2026 |
| [fig04_feature_coverage_matrix](../../../paper/figures/02_related_work/F04_feature_coverage_matrix.png) | Fig. 2.1 | Feature coverage of the reviewed systems [1] to [7] compared with UrbanFix | Literature survey |
| [fig05_capability_gaps](../../../paper/figures/02_related_work/F05_capability_gaps.png) | Fig. 2.2 | Number of reviewed systems lacking each capability | Derived from Fig. 2.1 |
| [fig06_text_classification_accuracy](../../../paper/figures/02_related_work/F06_text_classification_accuracy.png) | Fig. 2.3 | Reported complaint-text classification accuracy in the literature, with baselines and the manual officer reference | Papers [2], [4], [6], [7] |
| [fig07_dataset_availability](../../../paper/figures/05_ai_models/F18_dataset_availability.png) | Fig. 3.1 | Largest public dataset found for each candidate complaint category and the selection criteria it meets | RDD2022, TACO, Road Hazards, STORM, Hugging Face, Roboflow, arXiv |
| [fig08_governance_loop](../../../paper/figures/03_architecture_and_design/F07_governance_loop.png) | Fig. 4.1 | The UrbanFix governance loop: Report, Validate, Prioritise, Act, Prove and Learn | System design |
| [fig12_use_case_diagram](../../../paper/figures/03_architecture_and_design/F09_use_case_diagram.png) | Fig. 4.2 | Use-case diagram of UrbanFix by role | System design |
| [fig10_complaint_lifecycle](../../../paper/figures/03_architecture_and_design/F11_complaint_lifecycle.png) | Fig. 4.3 | Complaint lifecycle: internal stages, public statuses and allowed transitions | backend/utils/complaintStage.js |
| [fig14_urgency_score_bands](../../../paper/figures/03_architecture_and_design/F14_urgency_score_bands.png) | Fig. 4.4 | Urgency scoring: question weights per category and all reachable scores | mobile/src/constants/categories.js, utils/urgency.js |
| [fig09_system_architecture](fig09_system_architecture.png) | Fig. 4.5 | System architecture of UrbanFix | System design |
| [fig11_submission_sequence](../../../paper/figures/03_architecture_and_design/F12_submission_sequence.png) | Fig. 4.6 | Sequence of complaint submission, OTP verification and AI validation | System design |
| [fig13_er_diagram](fig13_er_diagram.png) | Fig. 4.7 | Entity-relationship diagram of the UrbanFix database | backend/models |
| [fig23_screens_citizen](fig23_screens_citizen.png) | Fig. 5.1 | Citizen screens: home, public registry and category selection | Running app, demo database |
| [fig24_screens_citizen_track](fig24_screens_citizen_track.png) | Fig. 5.2 | Citizen screens: swipe questionnaire, complaint tracker and account entry | Running app, demo database |
| [fig25_screens_supervisor](fig25_screens_supervisor.png) | Fig. 5.3 | Supervisor screens: triage queue, complaint detail and field staff roster | Running app, demo database |
| [fig26_screens_field](fig26_screens_field.png) | Fig. 5.4 | Field worker screens: task list, task detail, attendance and leave | Running app, demo database |
| [fig27_screens_admin](fig27_screens_admin.png) | Fig. 5.5 | Admin screens: console, category and urgency analytics, people management | Running app, demo database |
| [fig28_screens_research](fig28_screens_research.png) | Fig. 5.6 | Supervisor city counters and researcher screens: insights, access and usage | Running app, demo database |
| [fig15_training_curves](../../../paper/figures/05_ai_models/F27_training_curves.png) | Fig. 5.7 | Training and validation loss with validation mAP50 for the four category models | Our training runs |
| [fig16_precision_recall](../../../paper/figures/05_ai_models/F28_precision_recall.png) | Fig. 5.8 | Precision-recall curves on the validation sets | Our validation runs |
| [fig17_confusion_matrices](../../../paper/figures/05_ai_models/F29_confusion_matrices.png) | Fig. 5.9 | Normalised confusion matrices on the validation sets | Our validation runs |
| [fig18_model_comparison](../../../paper/figures/05_ai_models/F30_model_comparison.png) | Fig. 5.10 | Precision, recall and mAP50 of the four models side by side | Our validation runs |
| [fig20_sample_detections](../../../paper/figures/05_ai_models/F32_sample_detections.png) | Fig. 5.11 | Sample validation images with model output for each category | Our trained models |
| [fig19_inference_latency](../../../paper/figures/05_ai_models/F31_inference_latency.png) | Fig. 5.12 | Inference time per image on CPU and on the Apple MPS GPU backend | Our benchmark |
| [fig21_complaint_funnel_demo](../../../paper/figures/07_results/F52_complaint_funnel_demo.png) | Fig. 6.1 | Complaints reaching each workflow stage (demonstration dataset) | Demo dataset (seeded) |
| [fig22_resolution_time_demo](../../../paper/figures/07_results/F53_resolution_time_demo.png) | Fig. 6.2 | Days from filing to closure by category (demonstration dataset) | Demo dataset (seeded) |

## App screens

The single-screen mockups used to build fig23 to fig28 are kept with the paper figures.

| Screen | Paper copy |
|---|---|
| s01_home | [`paper/figures/06_app_screens/F33_public_home`](../../../paper/figures/06_app_screens/F33_public_home.png) |
| s02_registry | [`paper/figures/06_app_screens/F34_public_registry`](../../../paper/figures/06_app_screens/F34_public_registry.png) |
| s03_report_category | [`paper/figures/06_app_screens/F35_report_category`](../../../paper/figures/06_app_screens/F35_report_category.png) |
| s04_report_question | [`paper/figures/06_app_screens/F36_report_questionnaire`](../../../paper/figures/06_app_screens/F36_report_questionnaire.png) |
| s05_track_timeline | [`paper/figures/06_app_screens/F37_public_tracker`](../../../paper/figures/06_app_screens/F37_public_tracker.png) |
| s06_account | [`paper/figures/06_app_screens/F38_account_entry`](../../../paper/figures/06_app_screens/F38_account_entry.png) |
| s07_supervisor_queue | [`paper/figures/06_app_screens/F39_supervisor_queue`](../../../paper/figures/06_app_screens/F39_supervisor_queue.png) |
| s08_supervisor_triage | [`paper/figures/06_app_screens/F40_supervisor_triage`](../../../paper/figures/06_app_screens/F40_supervisor_triage.png) |
| s09_supervisor_field_staff | [`paper/figures/06_app_screens/F41_supervisor_field_staff`](../../../paper/figures/06_app_screens/F41_supervisor_field_staff.png) |
| s10_supervisor_profile | [`paper/figures/06_app_screens/F42_supervisor_profile`](../../../paper/figures/06_app_screens/F42_supervisor_profile.png) |
| s11_field_tasks | [`paper/figures/06_app_screens/F43_field_tasks`](../../../paper/figures/06_app_screens/F43_field_tasks.png) |
| s12_field_task_detail | [`paper/figures/06_app_screens/F44_field_task_detail`](../../../paper/figures/06_app_screens/F44_field_task_detail.png) |
| s13_field_profile | [`paper/figures/06_app_screens/F45_field_profile`](../../../paper/figures/06_app_screens/F45_field_profile.png) |
| s14_admin_console | [`paper/figures/06_app_screens/F46_admin_console`](../../../paper/figures/06_app_screens/F46_admin_console.png) |
| s15_admin_analytics | [`paper/figures/06_app_screens/F47_admin_analytics`](../../../paper/figures/06_app_screens/F47_admin_analytics.png) |
| s16_admin_people | [`paper/figures/06_app_screens/F49_admin_people`](../../../paper/figures/06_app_screens/F49_admin_people.png) |
| s17_research_insights | [`paper/figures/06_app_screens/F50_research_insights`](../../../paper/figures/06_app_screens/F50_research_insights.png) |
| s18_research_profile | [`paper/figures/06_app_screens/F51_research_profile`](../../../paper/figures/06_app_screens/F51_research_profile.png) |
| s19_admin_complaints | [`paper/figures/06_app_screens/F48_admin_complaints`](../../../paper/figures/06_app_screens/F48_admin_complaints.png) |
