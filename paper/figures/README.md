# UrbanFix paper figures

All material for the IEEE paper, in the order the paper uses it. Each figure has one number (F01 to F53) that stays the same in every format.

**Formats.** New diagrams and AI figures come as a vector **PDF** (fonts embedded as TrueType, single page; use this in LaTeX with `\includegraphics`), an **SVG**, and a **300 dpi PNG** (for Word). Figures carried over from the project report come as PNG and SVG. App screens come as framed PNG and SVG.

**Sizing.** IEEE two-column layout: one column is 3.5 in (88.9 mm) wide and the full page is 7.16 in (181.9 mm). The diagrams marked *full width* below need `figure*` in LaTeX.

**Sources.** Diagrams were drawn from the code in `backend/` and `mobile/`. AI figures were produced by running the trained weights in `ai_model/weights/` on validation images, and from `ai_model/results/eval.json` and `ai_model/runs/*/results.csv`. Screens are from the running app with the seeded demo database, so the counts on them (80 filed, 19 resolved and so on) are demo values, not field data.

---

## 1. Motivation (`01_motivation/`)

| # | File | Caption |
|:--|:--|:--|
| F01 | `F01_pothole_accidents_india` | Pothole-related road accidents in India (2020 to 2024) and deaths (2018 to 2022). Source: MoRTH, Lok Sabha reply of 12 Feb 2026; *Road Accidents in India* 2018 to 2022. |
| F02 | `F02_cpgrams_received_disposed` | Grievances received and disposed on CPGRAMS with the backlog at the start of each year, 2019 to 2024. Source: PIB Parliament replies, 16 Mar 2022 and 2 Apr 2025. |
| F03 | `F03_grievance_disposal_time` | Average grievance disposal time on CPGRAMS for central ministries and State and UT governments. Source: PIB Rajya Sabha reply, 5 Feb 2026. |

## 2. Related work (`02_related_work/`)

| # | File | Caption |
|:--|:--|:--|
| F04 | `F04_feature_coverage_matrix` | Feature coverage of the reviewed systems compared with UrbanFix. |
| F05 | `F05_capability_gaps` | Number of reviewed systems lacking each capability, derived from F04. |
| F06 | `F06_text_classification_accuracy` | Reported complaint-text classification accuracy in prior work, with baselines and the manual officer reference. |

## 3. Architecture and design (`03_architecture_and_design/`)

| # | File | Caption |
|:--|:--|:--|
| F07 | `F07_governance_loop` | The UrbanFix governance loop: Report, Validate, Prioritise, Act, Prove and Learn. |
| F08 | `F08_system_architecture` **new, full width** | System architecture of UrbanFix. Six stakeholder roles reach a single Expo client with role-specific shells. Every request passes an Express gateway pipeline (transport, upload handling, JWT authentication, role guard, Zod validation, controllers, error boundary) into seven domain services. Complaint intake hands photos asynchronously to a FastAPI inference service that hosts one YOLOv8n model per category; the data tier holds seven MongoDB collections, object storage, SMTP, the PDF receipt engine and the expiry scheduler. Security, privacy, accountability and reliability controls are shown as cross-cutting concerns. |
| F09 | `F09_use_case_diagram` | Use-case diagram of UrbanFix by role. |
| F10 | `F10_access_control_matrix` **new** | Role-based access control matrix. Each capability is enforced on the server by JWT verification and a per-route role guard; half-filled cells mark capabilities limited by scope (own ward, assignee only, dataset scope). |
| F11 | `F11_complaint_lifecycle` | Complaint lifecycle: seven internal stages, the four public statuses derived from them, and the allowed transitions with the role that may perform each. |
| F12 | `F12_submission_sequence` | Sequence of complaint submission, OTP verification and background AI validation. |
| F13 | `F13_ai_validation_pipeline` **new, full width** | AI validation and prioritisation pipeline across four swim lanes. The citizen's weighted questionnaire score U = Σ wᵢyᵢ / Σ wᵢ and the model's evidence (detections, confidence, damaged area) are produced independently and shown side by side to a supervisor, who makes and records the decision. The filing completes before inference starts, and a low-confidence result sets `needsReview` instead of rejecting the report. |
| F14 | `F14_urgency_score_bands` | Urgency scoring: question weights per category and every reachable score with its band. |
| F15 | `F15_data_disclosure_model` **new, full width** | Tiered data disclosure model. Each audience receives a server-side projection of the same complaint record: administrators see the full record, staff see it without the filer's identity, the public registry and tracker remove identity fields, and researchers receive an eight-field anonymised projection with HMAC-SHA256 record IDs, ward-level location and day-level dates. The right column shows the seven-step research access control chain. |

## 4. Data model (`04_data_model/`)

| # | File | Caption |
|:--|:--|:--|
| F16 | `F16_er_conceptual` **new, full width** | Conceptual EER model. The single User entity is specialised (disjoint, total) into Citizen, Employee, Administrator and Researcher, and Employee into Field worker and Supervisor. Complaint is the aggregate root, with Status event and AI analysis as weak entities. Workforce (leave, attendance) and research (application, access log) sub-models hang off the corresponding roles. Crow's-foot cardinalities. |
| F17 | `F17_er_physical` **new, full width** | Physical data model of the seven MongoDB collections, taken from the Mongoose schemas. Each field shows its type and constraints; badges mark primary keys, references, unique, secondary and TTL indexes. Embedded documents (`statusHistory[]`, `aiAnalysis`, `researcher`, `employee`) are shaded inside their parent collection. Crow's-foot cardinalities; the Otp to User link is logical (matched on email). |

Use F16 when space is short; F17 is the detailed schema (good as a full-width figure or an appendix).

## 5. AI models (`05_ai_models/`)

| # | File | Caption |
|:--|:--|:--|
| F18 | `F18_dataset_availability` | Largest public dataset found for each candidate complaint category and the selection criteria it meets. Only categories meeting all criteria are offered in the app. |
| F19 | `F19_pothole_road_damage_ai_outputs` **new, full width** | Pothole / Road Damage model (YOLOv8n-seg) on validation images: citizen photo, ground-truth mask, and the stored AI output with predicted masks, boxes and confidence. The damaged area is the mask's share of the image. The last column is a missed detection, which sets `needsReview = true` and leaves the decision to a supervisor. |
| F20 | `F20_pothole_road_damage_evaluation` **new, full width** | Pothole / Road Damage model evaluation: (a) training and validation losses, (b) validation precision, recall, mAP50 and mAP50-95 per epoch (dotted line: best epoch), (c) precision-recall curves for boxes and masks, (d) true positives, false positives and missed instances at confidence 0.25. |
| F21 | `F21_garbage_litter_ai_outputs` **new, full width** | Garbage / Litter model (YOLOv8n-seg) on TACO validation images, laid out as in F19. |
| F22 | `F22_garbage_litter_evaluation` **new, full width** | Garbage / Litter model evaluation, panels as in F20. The high count of missed instances reflects the 60-to-1 class merge and the many small objects in TACO. |
| F23 | `F23_open_manhole_ai_outputs` **new, full width** | Open Manhole model (YOLOv8n detection) on Road Hazards validation images, laid out as in F19 with boxes only. |
| F24 | `F24_open_manhole_evaluation` **new, full width** | Open Manhole model evaluation, panels as in F20. |
| F25 | `F25_graffiti_ai_outputs` **new, full width** | Graffiti model (YOLOv8n detection) on STORM validation images, laid out as in F23. |
| F26 | `F26_graffiti_evaluation` **new, full width** | Graffiti model evaluation, panels as in F20. |
| F27 | `F27_training_curves` | Training and validation loss with validation mAP50 for all four models. |
| F28 | `F28_precision_recall` | Precision-recall curves of all four models on their validation sets. |
| F29 | `F29_confusion_matrices` | Normalised confusion matrices of all four models. |
| F30 | `F30_model_comparison` | Precision, recall and mAP50 of the four models side by side. |
| F31 | `F31_inference_latency` | Inference time per image on CPU and on the Apple MPS backend. |
| F32 | `F32_sample_detections` | One-figure summary: two sample detections per category. |

F19 to F26 are the per-category set. F27 to F32 are the same results combined, for when the page budget allows only one or two AI figures.

## 6. Application screens (`06_app_screens/`)

Each screen is a separate figure so it can sit next to the paragraph that describes it. At one column wide, two screens fit side by side with `subfigure`.

**Public and citizen**

| # | File | Caption |
|:--|:--|:--|
| F33 | `F33_public_home` | Public home screen. Live city counters (filed, resolved, open) from `/api/public/stats`, a bar chart of this month's top issue categories, and shortcuts to the registry and to reporting. No login is needed. |
| F34 | `F34_public_registry` | Public registry. Every complaint is listed from the moment it is filed, newest first, with status filters and a title or area search. Each card shows category, title, location, tracking ID and date and links to the tracker; the filer's identity and staff IDs are removed on the server. |
| F35 | `F35_report_category` | Reporting wizard, step 1 of 6. Only the four categories backed by a trained model can be chosen. |
| F36 | `F36_report_questionnaire` | Severity questionnaire. Five weighted yes/no questions per category are answered by swiping cards; the urgency band (here Standard) updates live from the weighted score. |
| F37 | `F37_public_tracker` | Tracker. Anyone with a tracking ID sees the complaint's status, the citizen's questionnaire answers and the full timeline with staff remarks; the filer appears only as "Citizen". Resolved complaints offer the PDF receipt. |
| F38 | `F38_account_entry` | Account entry. Citizens file and track with only an email address and a one-time code, with no password; employees sign in, and researchers apply for data access from the same screen. |

**Supervisor**

| # | File | Caption |
|:--|:--|:--|
| F39 | `F39_supervisor_queue` | Supervisor triage queue, filtered by stage ("Needs action", Submitted, Accepted and so on), with search by title or tracking ID. |
| F40 | `F40_supervisor_triage` | Complaint detail used for triage: stage, ward, category, filing date, location and the citizen's questionnaire answers, followed by the accept, reject and assign actions. |
| F41 | `F41_supervisor_field_staff` | Field staff roster filtered by ward, with each worker's active and completed tasks and today's attendance. It supports workload-aware assignment within the ward. |
| F42 | `F42_supervisor_profile` | Supervisor profile: city-wide work counters (to triage, to assign, to review, closed this week), daily check-in and leave requests. |

**Field worker**

| # | File | Caption |
|:--|:--|:--|
| F43 | `F43_field_tasks` | Field worker task list with counters for assigned, in-progress and in-review tasks; each card shows its current stage (here, proof submitted). |
| F44 | `F44_field_task_detail` | Task detail: stage, ward, location, the latest update ("Repair complete, photos uploaded") and the original questionnaire. The worker starts the task and uploads up to three proof photos from here. |
| F45 | `F45_field_profile` | Field worker profile: personal completion numbers, attendance check-in and leave requests. |

**Administrator**

| # | File | Caption |
|:--|:--|:--|
| F46 | `F46_admin_console` | Admin console: resolution rate, status counters and the entry point to complaint management. |
| F47 | `F47_admin_analytics` | Admin analytics: complaints by category and the distribution of urgency levels. |
| F48 | `F48_admin_complaints` | Admin complaint list across all wards, with search by title, area or ID and status filters; opening a complaint allows a status override with remarks. |
| F49 | `F49_admin_people` | People management: invite employees, and review research applications, leave requests and the research audit log; employee and researcher lists show account status. |

**Researcher**

| # | File | Caption |
|:--|:--|:--|
| F50 | `F50_research_insights` | Researcher insights on anonymised data: resolution rate, status counts and category shares, with no personal information. |
| F51 | `F51_research_profile` | Researcher profile: days of access remaining with the hard end date, the granted scope, usage (views, queries, exports, rows), today's export quota, and the notice that every access is logged and visible to administrators. |

## 7. Results (`07_results/`)

| # | File | Caption |
|:--|:--|:--|
| F52 | `F52_complaint_funnel_demo` | Complaints reaching each workflow stage (demonstration dataset). |
| F53 | `F53_resolution_time_demo` | Days from filing to closure by category (demonstration dataset). |

Label F52 and F53 as demonstration data in the paper, or replace them with pilot data before submission.

---

## Suggested set for a 6 to 8 page IEEE conference paper

1. F08 System architecture (full width)
2. F13 AI validation pipeline (full width) or F11 Complaint lifecycle (one column)
3. F15 Data disclosure model (full width)
4. F16 Conceptual EER (full width) or F17 Physical model
5. F19 Pothole AI outputs, plus F30 model comparison for all four models
6. Two or three screens side by side: F36, F40, F51
7. F52 or pilot results

## Values to check before submission

- **Confidence gate.** F13 and F19 to F26 use confidence 0.25 as the detection threshold and the rule "no detection at or above 0.25 sets `needsReview`". This matches the `conf=0.25` used in evaluation. If the inference service uses a different review threshold, update the caption text.
- **AI fields.** F08, F13 and F17 show the `aiAnalysis` sub-document and the `/predict/{category}` contract as described in `docs/project_description.md`.
