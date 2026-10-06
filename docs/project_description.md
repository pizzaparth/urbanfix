# UrbanFix: AI-Powered End-to-End Governance System
## Comprehensive Project Documentation & System Description

---

### 1. Project Overview

#### 1.1 System Explanation
**UrbanFix** is an AI-powered, end-to-end governance system for urban infrastructure. It is more than a complaint box: it covers the full cycle from a citizen's photo to a verified, publicly audited repair, and then feeds the resulting data back to researchers and administrators.

The cycle has six links, all handled inside one system:

1. **Report:** citizens report issues from their phone without creating an account, and verify each report with an email OTP.
2. **Validate:** a category-specific computer vision model checks every photo, draws a bounding box or mask around the problem, and returns a confidence score.
3. **Prioritise:** a weighted severity questionnaire and the AI's own damage estimate combine into an urgency level.
4. **Act:** a ward-based staff workflow routes the complaint. A supervisor triages and assigns it, a field worker fixes it and uploads photo proof, and the supervisor closes it.
5. **Prove:** closing generates a PDF resolution receipt. Every complaint, with its full status history, is published in a public registry.
6. **Learn:** approved researchers query and export anonymised data, and administrators track performance by category, ward, and urgency.

Complaints fall into four categories. Each one is backed by a public, annotated image dataset that its detection model is trained on: **Pothole / Road Damage**, **Garbage / Litter**, **Open Manhole**, and **Graffiti**. Categories without a proper public dataset are not offered, so every report the app accepts can be checked by AI.

The system has three parts:

| Part | Description |
|---|---|
| `mobile/` | Expo (React Native) app. The only client. Runs on Android and iOS through Expo Go, and in the browser for development. |
| `backend/` | Express + MongoDB REST API. Handles auth, complaints, the staff workflow, attendance and leave, email, PDF receipts, and research access. |
| `ai_model/` | Per-category YOLOv8 training notebooks and datasets, and the FastAPI inference service (see Section 8). |

#### 1.2 Core Objectives
* **Public Accessibility:** Account-less complaint filing, verified by a one-time email code.
* **AI Validation:** Every complaint photo is checked by a model trained for that category, and the detected problem is highlighted for staff.
* **Evidence-Based Prioritisation:** Urgency combines the citizen's weighted answers with the AI's confidence and damage estimate.
* **Accountable Workflow:** A role-based staff pipeline (triage, assignment, field work, proof review) with server-enforced transitions.
* **Absolute Transparency:** Every filed complaint and its status counters are public, with citizen details redacted.
* **Audit Trails:** Every transition records the stage, the acting user, a timestamp, and remarks.
* **Privacy-Safe Research:** Time-limited researcher access to aggregate or anonymised data, with every access logged.

---

### 2. User Roles

| Role | How they get access | What they do |
|---|---|---|
| **Citizen** | No account needed. A `User` record is created automatically on their first verified complaint. Optional registration with password gives a "My complaints" dashboard. | File complaints, track them, download receipts, browse the registry. |
| **Supervisor** | Invited by an admin. | Triage new complaints using the AI validation result and annotated photos, assign field workers in their ward, review proof, close or send back for rework, approve field staff leave. Records own attendance and requests leave. |
| **Field worker** | Invited by an admin. Belongs to one ward. | See assigned tasks, start work, upload proof photos and a completion note. Check in/out and request leave. |
| **Admin** | Invited by an admin, or seeded. | Dashboard and analytics, status overrides on any complaint, staff account management, supervisor leave approvals, research application approvals, research audit log. |
| **Researcher** | Applies publicly; an admin approves and sets duration (max 180 days) and dataset scope. | View insights, run grouped queries, export CSV/JSON. Access stops automatically at expiry. |

Staff and researchers are onboarded through an **invite flow**. The admin creates the account, and the user receives an email link to set their own password. Only the SHA-256 hash of the invite token is stored, and it expires after 72 hours. Login is blocked until the password is set. Staff accounts are soft-deleted (`isActive: false`), never hard-deleted, because the audit trail references them.

---

### 3. Core Functional Modules

#### 3.1 Citizen Complaint Filing & Email Verification
Filing is a 6-step wizard on the **Report** tab:
1. **Category:** pick one of the 4 categories.
2. **Questions:** answer that category's 5 yes/no questions on swipeable cards (e.g. "Is the manhole completely uncovered, posing a fall hazard?"). Each question has a severity weight (2 = safety-critical, 1 = standard context). The urgency is the share of weighted "Yes" answers: **High Urgency** at 60% or more, **Medium Urgency** at 30% or more, otherwise **Standard Urgency**. The citizen sees the result live.
3. **Details:** Subject, Description, Location, and **Ward** (Ward 1–10, required).
4. **Upload:** up to 3 photos (camera or gallery).
5. **Contact:** Name, Email, optional Phone.
6. **Review:** confirm and submit. This requests a 6-digit OTP to the email.

After the citizen enters a valid OTP (valid for 5 minutes):
* The backend finds or creates the citizen's `User` record by email.
* A Tracking ID is generated in the form `COMP-YYYYMMDD-XXXXX`.
* The complaint is saved as `Pending` / stage `submitted` and is public immediately.
* A confirmation email with the Tracking ID is sent.
* The photos are sent to the category's AI model in the background (Section 8). The result is stored on the complaint as `aiAnalysis`. Submission never waits for the AI or fails because of it.

#### 3.2 Public Transparency (Home, Registry, Track)
* **Home:** headline counters (Filed, Resolved, Open) and a "Top issues this month" category chart.
* **Registry:** every public complaint, newest first, with filters for category, status, ward, and a location text search. Citizen details and staff identities are removed.
* **Track:** look up any complaint by Tracking ID to see its status timeline with staff remarks. The citizen who filed it is shown only as "Citizen". Resolved complaints offer a downloadable PDF receipt.
* **Deep links:** the app handles `dsn://` links (`dsn://track`, `dsn://registry`, `dsn://file-complaint`, `dsn://set-password`, `dsn://research-apply`, and more).

#### 3.3 Staff Workflow
Staff work with a detailed internal `stage`. Citizens and the registry see a simpler `status` derived from it (`backend/utils/complaintStage.js`):

```
submitted ──► accepted ──► assigned ──► work_in_progress ──► proof_submitted ──► closed
   │            └──────────── In Progress ───────────────────────────┘           Resolved
   └──► triage_rejected (Rejected)                      ▲          │
Pending                                                 └─ rework ─┘
```

| Action | From | To | Who | Remarks required |
|---|---|---|---|---|
| `accept` | `submitted` | `accepted` | supervisor, admin | yes |
| `reject` | `submitted` | `triage_rejected` | supervisor, admin | yes |
| `assign` | `accepted`, `assigned` | `assigned` | supervisor, admin | no |
| `start` | `assigned` | `work_in_progress` | assigned field worker only | no |
| `proof` | `work_in_progress` | `proof_submitted` | assigned field worker only | completion note + up to 3 photos |
| `close` | `proof_submitted` | `closed` | supervisor, admin | yes |
| `rework` | `proof_submitted` | `assigned` | supervisor, admin | yes |

**AI-assisted triage:** the supervisor's queue shows each complaint's AI result next to the citizen's photos: whether the issue was detected, the confidence, the annotated image with the problem boxed or masked, and the AI-suggested urgency. Complaints the model cannot confirm are flagged `needsReview` and kept in the queue for a human decision. The AI never rejects a complaint on its own.

Rules enforced by the server (`backend/services/complaintWorkflow.js`):
* Remarks must be at least 10 characters.
* A supervisor can assign only a field worker from the complaint's ward. An admin can override this.
* A field worker who is deactivated or on approved leave today cannot be assigned.
* `closed` and `triage_rejected` are terminal.
* **Closing** generates a PDF receipt, emails it to the citizen, stores the receipt URL, and sets `closedAt`.
* Status changes email the citizen.

**Admin override:** an admin can also set the public status directly (`Pending`, `In Progress`, `Resolved`, `Rejected`). The stage follows the status. Terminal complaints cannot be changed, and `Pending` cannot jump directly to `Resolved`.

#### 3.4 Attendance & Leave
* Field workers and supervisors check in and out once per day (`AttendanceRecord`, unique per employee per date).
* They request leave with a date range and reason.
* Supervisors decide field worker leave. Admins decide supervisor leave and any leave without a supervisor.
* Approved leave blocks assignment on those days.

#### 3.5 Research Access
* **Apply (public):** full name, email, institute, title, purpose (at least 100 characters), requested scope, and days (1–180).
* **Approval (admin):** the admin sets the duration (capped at 180 days) and scope:
  * `aggregate_only`: grouped counts only.
  * `anonymised_records`: row-level records as well.
* **Insights:** status, category, ward, urgency, and monthly breakdowns, with average resolution time.
* **Query:** group by category, ward, status, urgency, or month, with filters for category, ward, status, and date range.
* **Export:** CSV or JSON. Limited to 5 exports per day and 5,000 rows per export.
* **Privacy rules:** every research response goes through one projection (`backend/utils/researchProjection.js`). It removes citizen identity, description, street-level location, tracking ID, images, and staff identities. Location is coarsened to ward, and dates to day precision. Each record gets an opaque HMAC-based `recordId`. CSV cells are protected against formula injection.
* **Audit:** every dashboard view, query, and export writes a `ResearchAccessLog` row. Admins see this as the research audit log.
* **Expiry:** access is a hard stop at `accessExpiresAt`, enforced on every request. A background job emails the researcher 3 days before expiry. Set `DISABLE_JOBS=true` to turn the job off.

#### 3.6 App Navigation

The app shows a different bottom tab set for each role. The server's role, not the login screen, decides which set appears.

| Role | Tabs |
|---|---|
| Public / Citizen | Home · Registry · Report · Track · Account (login, register, my complaints, research application) |
| Supervisor | Queue (triage, assign) · Field Staff · Track · Profile |
| Field worker | My Tasks · Completed · Profile |
| Admin | Stats · Complaints · People (staff, leave approvals, research applications, research audit) |
| Researcher | Insights (and Export) · Registry · Track · Profile |

---

### 4. Architecture & Tech Stack

```
   [ Expo app (React Native) ] <--- REST APIs ---> [ Express Backend (Node.js) ] <---> [ MongoDB ]
                                                              │
                                                              ├── Python FastAPI AI service (YOLOv8)
                                                              ├── Nodemailer (SMTP)
                                                              ├── PDFKit
                                                              └── uploads/ (original + annotated photos)
```

#### 4.1 Backend
* **Core Runtime:** Node.js & Express 4.
* **Database Driver:** Mongoose 8 (MongoDB ODM).
* **Auth:** JWT (default 7-day expiry), bcrypt password hashing, role checks per route.
* **Validation Engine:** Zod.
* **Media Parsing:** Multer (up to 3 images per complaint and per proof). Files are served from `/uploads`.
* **Email Service:** Nodemailer. If SMTP is not configured, it falls back to an Ethereal test inbox.
* **Document Engine:** PDFKit (resolution receipts).
* **Background Job:** a researcher expiry notice runs every 6 hours.

#### 4.2 Mobile App
* **Framework:** Expo SDK 57, React Native 0.86, React 19. Runs in Expo Go, so it uses no dev-build-only native libraries.
* **Navigation:** React Navigation 7 (bottom tabs + native stacks) with a custom glass tab bar (`expo-blur`).
* **Animation & Lists:** Reanimated 4, Moti, FlashList, Gesture Handler (swipe question cards).
* **Charts & Icons:** hand-built charts and icons with `react-native-svg`.
* **Device Features:** `expo-image-picker` (photos), `expo-secure-store` (auth token), `expo-file-system` + `expo-sharing` (PDF receipts, exports), `expo-haptics`, `expo-clipboard`.
* **HTTP Client:** Axios, which attaches the JWT automatically. The app reaches the backend on port 5001 of the machine that serves Metro, so no API URL is needed in development. `EXPO_PUBLIC_API_URL` overrides this.

#### 4.3 AI Service
* **Runtime:** Python with FastAPI.
* **Models:** Ultralytics YOLOv8, one fine-tuned model per category (segmentation where the dataset has masks, detection where it has boxes).
* **Training:** one Jupyter notebook per category in `ai_model/notebooks/` (`01_pothole_road_damage.ipynb` to `04_graffiti.ipynb`), with download and evaluation notebooks alongside.
* **Output:** detections, confidence, annotated images, and, for segmentation models, the damaged share of the surface.

---

### 5. Database Design (MongoDB Schemas)

#### 5.1 Users Collection (`User.js`)
* `name` (String, Required)
* `email` (String, Required, Unique, Lowercase)
* `password` (String, Required, min 8, bcrypt-hashed, not selected by default). Random for auto-created citizens and for invited users until they set one.
* `phone` (String, Optional)
* `role` (Enum: `citizen`, `researcher`, `field`, `supervisor`, `admin`; Default: `citizen`)
* `isVerified` (Boolean, Default: `false`)
* `isActive` (Boolean, Default: `true`). Soft delete.
* `createdBy` (ObjectId → `User`), `lastLoginAt` (Date)
* `researcher` (researchers only): `institute`, `title`, `accessGrantedAt`, `accessExpiresAt`, `datasetScope` (`aggregate_only` | `anonymised_records`), `applicationId`, `expiryNoticeSentAt`
* `employee` (field workers and supervisors only): `employeeCode` (unique, sparse), `ward`, `supervisorId`, `phone`
* `inviteToken` (SHA-256 hash), `inviteTokenExpires`, `mustSetPassword`
* Timestamps

#### 5.2 OTPs Collection (`Otp.js`)
* `email` (String, Required, Indexed)
* `otp` (String, Required)
* `expiresAt` (Date, TTL index). Set 5 minutes ahead; MongoDB deletes it automatically.

#### 5.3 Complaints Collection (`Complaint.js`)
* `trackingId` (String, Required, Unique), format `COMP-YYYYMMDD-XXXXX`
* `citizenId` (ObjectId → `User`, Required, Indexed)
* `title` (String, Required, 5–100 characters)
* `description` (String, Required, at least 15 characters)
* `category` (String, Required, Indexed). New complaints must use one of the 4 categories: `Pothole / Road Damage`, `Garbage / Litter`, `Open Manhole`, `Graffiti`.
* `location` (String, Required, Indexed)
* `ward` (Enum: `Ward 1` … `Ward 10`, Indexed). Required on new complaints; `null` only on legacy records.
* `images` (Array of file paths, max 3)
* `status` (Enum: `Pending`, `In Progress`, `Resolved`, `Rejected`; Indexed). Derived from `stage`.
* `stage` (Enum: `submitted`, `triage_rejected`, `accepted`, `assigned`, `work_in_progress`, `proof_submitted`, `closed`; Default: `submitted`; Indexed)
* `assignedTo`, `assignedBy` (ObjectId → `User`), `assignedAt` (Date)
* `completionImages` (Array, max 3), `completionNote` (String)
* `closedAt` (Date)
* `isPublic` (Boolean). Set to `true` on every new complaint; there is no manual toggle.
* `remarks` (String)
* `pdfReceiptUrl` (String). Set to the download endpoint path on close.
* `urgencyLevel` (Enum: `High Urgency`, `Medium Urgency`, `Standard Urgency`; Default: `Standard Urgency`)
* `statusHistory` (Array of sub-documents):
  * `status` (String, Required)
  * `stage` (String, Optional; absent on pre-stage history)
  * `changedBy` (ObjectId → `User`, Required)
  * `remarks` (String, Required)
  * `changedAt` (Date, Default: `Date.now`)
* `aiAnalysis` (sub-document, written by the AI service):
  * `model` (String): model file that ran, e.g. `pothole_road_damage_model.pt`
  * `detected` (Boolean): whether the selected issue was found in any photo
  * `confidence` (Number, 0–1): highest detection confidence
  * `detections` (Array): `image`, `label`, `confidence`, `box` (`[x1, y1, x2, y2]`)
  * `annotatedImages` (Array of file paths): photos with the problem boxed or masked
  * `damagePercent` (Number): damaged share of the surface, from segmentation masks
  * `suggestedUrgency` (Enum, same values as `urgencyLevel`)
  * `needsReview` (Boolean): `true` when the issue was not detected with enough confidence
  * `analysedAt` (Date)
* Timestamps

#### 5.4 Other Collections
* **`LeaveRequest`:** `employeeId`, `fromDate`, `toDate`, `reason`, `status` (`pending` | `approved` | `rejected`), `decidedBy`, `decidedAt`, `decisionNote`.
* **`AttendanceRecord`:** `employeeId`, `date` (`YYYY-MM-DD`), `checkInAt`, `checkOutAt`, `status` (`present` | `absent` | `on_leave`). Unique per employee and date.
* **`ResearchApplication`:** `fullName`, `email`, `institute`, `title`, `purpose`, `datasetScope`, `requestedDays`, `status`, `reviewedBy`, `reviewedAt`, `reviewNote`, `createdUserId`.
* **`ResearchAccessLog`:** `researcherId`, `action` (`view_dashboard` | `query` | `export`), `recordCount`, `filters`, `exportFormat`, `ipAddress`, `createdAt`.

---

### 6. Core REST API Design

All routes are under `/api`. Photos are served from `/uploads`. `GET /health` is a health check.

#### 6.1 Auth (`/api/auth`)
* `POST /register`: citizen registration; sends an OTP.
* `POST /verify-otp`, `POST /resend-otp`: verify a registered citizen.
* `POST /login`: returns a JWT and the user. Returns `403 MUST_SET_PASSWORD` for unredeemed invites.
* `POST /set-password`: redeem an invite token.
* `GET /me`: current user (authenticated).

#### 6.2 Complaints (`/api/complaints`)
* `POST /request-otp`: `{ "email" }`. Sends a 6-digit OTP.
* `POST /`: multipart (`name`, `email`, `phone`, `otp`, `title`, `description`, `category`, `location`, `ward`, `urgencyLevel`, `images`). Verifies the OTP, creates the user and complaint, and returns the Tracking ID.
* `GET /track/:trackingId`: complaint with timeline (citizen and staff IDs redacted).
* `GET /download-receipt/:trackingId`: PDF receipt (resolved complaints only).
* `GET /my-complaints`: the logged-in citizen's complaints.

#### 6.3 Public (`/api/public`)
* `GET /complaints`: query params `category`, `status`, `ward`, `location`, `page`, `limit`. Redacted registry.
* `GET /stats`: status breakdown and category distribution.

#### 6.4 Supervisor (`/api/supervisor`, supervisor or admin)
* `GET /queue`, `GET /complaints/:id`, `GET /stats`, `GET /field-staff`
* `PATCH /complaints/:id/accept | reject | assign | close | rework`
* `GET /leave`, `PATCH /leave/:id`: field worker leave decisions.
* Supervisor only: `GET|POST /my-leave`, `GET /attendance`, `POST /attendance/check-in`, `POST /attendance/check-out`.

#### 6.5 Field Worker (`/api/field`)
* `GET /tasks`, `GET /tasks/:id`, `GET /stats`
* `PATCH /tasks/:id/start`
* `POST /tasks/:id/proof`: multipart (`completionNote`, up to 3 `images`).
* `GET|POST /leave`, `GET /attendance`, `POST /attendance/check-in`, `POST /attendance/check-out`

#### 6.6 Admin (`/api/admin`)
* `GET /stats`, `GET /activity-heatmap`
* `GET /complaints`: query params `status`, `stage`, `category`, `ward` (`none` for unassigned), `search`, `page`, `limit`.
* `PATCH /complaints/:id/status`: `{ "status", "remarks" }`. Status override.
* `GET|POST /users`, `PATCH /users/:id`, `PATCH /users/:id/deactivate`, `PATCH /users/:id/reactivate`
* `GET /research-applications`, `PATCH /research-applications/:id`: approve or reject, with `days` and `grantRecordAccess`.
* `GET /audit/research`: research access log.
* `GET /leave`, `PATCH /leave/:id`: leave with no supervisor to decide it (mainly supervisors' own).

#### 6.7 Research (`/api/research`)
* `POST /apply`: public application.
* `GET /me`: researcher profile, usage stats, and exports remaining today.
* `GET /dashboard`, `GET /query`, `GET /export?format=csv|json` (researcher or admin).

#### 6.8 AI Inference Service (FastAPI, internal)
Called by the backend only; it is not exposed to the app.
* `POST /predict/{category}`: multipart photos. Returns `detected`, `confidence`, `detections`, `damagePercent` (segmentation models), and the annotated images.
* `GET /models`: the loaded model for each category.
* `GET /health`: service health check.

---

### 7. Design System & Development Accounts

#### 7.1 Design System
The app uses a **light theme** defined in `mobile/src/theme.js`:
* **Background:** `#FFFFFF` · **Surface:** `#F7F2F5` · **Raised surface:** `#FBEDF3` · **Borders:** `#E8DFE4` / `#DDD1D9`
* **Text:** `#000000` (primary), `#3A2F38` (body), `#5C505A` (secondary), `#776B75` (muted)
* **Accent:** pink `#FF5FA2` (hover `#E84D8F`)
* **Status colors:** *Pending* `#C2700F` · *In Progress* `#8B4FD8` · *Resolved* `#16935A` · *Rejected* `#E0234E`
* **Urgency colors:** *High* `#E0234E` · *Medium* `#C2700F` · *Standard* `#16935A`
* **Typography:** Space Grotesk (display headings) and Plus Jakarta Sans (body and UI), loaded through `@expo-google-fonts`.
* **Shape:** large rounded corners (8–28 px radius, pill buttons) and a floating glass bottom tab bar.

#### 7.2 Development Accounts
Created by `npm run seed:roles` in `backend/`. The script is idempotent and refuses to run when `NODE_ENV=production`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Passw0rd!123` |
| Supervisor | `supervisor@example.com` | `Passw0rd!123` |
| Field worker (Ward 1) | `field1@example.com` | `Passw0rd!123` |
| Field worker (Ward 2) | `field2@example.com` | `Passw0rd!123` |
| Researcher (aggregate only) | `researcher@example.com` | `Passw0rd!123` |
| Researcher (anonymised records) | `researcher-records@example.com` | `Passw0rd!123` |

`npm run seed:admin` also creates the original admin, `admin@complaintsystem.gov` / `admin_password_123`. Citizens have no seeded account.

---

### 8. AI-Powered Image Detection and Complaint Validation System

#### 8.1 Overview
UrbanFix has a computer vision layer that analyses complaint images automatically. The results reach supervisors at triage, before any staff time is spent on the complaint.

Each complaint category has its own independently trained object detection or segmentation model. When a citizen submits a complaint, the backend sends the uploaded images to the model for the selected category.

The AI model:

1. Detects the reported issue in the image.
2. Locates the issue with bounding boxes, or with pixel masks for segmentation models.
3. Draws a rectangle or mask around the detected problem area.
4. Generates an annotated version of the original image.
5. Returns the detection confidence, the bounding box metadata and, for segmentation models, the damaged share of the surface to the backend.

The AI system is an automated validation and localisation layer. It does not reject complaints on its own. When the AI cannot confidently detect the selected issue, the complaint is flagged `needsReview` and stays in the supervisor's triage queue for a human decision.

**Category policy:** a category is offered in the app only when a public, documented, annotated image dataset exists for it. Without real training data, a model cannot validate the photos, so the category list is limited to the four below. The list lives in `backend/constants/categories.js` (enforced by the API) and `mobile/src/constants/categories.js` (shown in the app).

#### 8.2 AI Models, Datasets and Category Mapping

| Complaint Category | AI Model | Task | Training Dataset |
|---|---|---|---|
| Pothole / Road Damage | `pothole_road_damage_model.pt` | Segmentation | Roboflow **Pothole Segmentation (YOLOv8)**, 780 images (720 train, 60 validation) with polygon masks, CC BY 4.0, included in `ai_model/`. A second public source, **RDD2022**, adds 47,420 road images from six countries, including India, with more than 55,000 boxed damage instances (cracks and potholes). |
| Garbage / Litter | `garbage_litter_model.pt` | Segmentation | **TACO** (Trash Annotations in Context): 1,500 images and 4,784 litter annotations, with COCO-format masks, taken on roads, in woods and on beaches. |
| Open Manhole | `open_manhole_model.pt` | Detection | **Road Hazards Dataset**: 2.7k road images with YOLO-format boxes for potholes, cracks and open manholes. |
| Graffiti | `graffiti_model.pt` | Detection | **STORM graffiti/tagging detection dataset** (University of West Attica, CC BY 4.0): 1,022 smartphone images with bounding boxes, collected through a crowdsensing app. |

The `.pt` files are trained PyTorch model files that hold each model's learned weights. All four models are YOLOv8 models fine-tuned independently for their category. Segmentation is used where the dataset has masks, and detection where it has boxes.

**Dataset sources:**
* RDD2022: [figshare](https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547), [paper](https://arxiv.org/abs/2209.08538)
* TACO: [tacodataset.org](http://tacodataset.org), [paper](https://arxiv.org/abs/2003.06975)
* Road Hazards Dataset: [dataset page](https://hyper.ai/en/datasets/38237)
* STORM graffiti dataset: [Zenodo](https://zenodo.org/records/3238357)

**Categories not offered:** water leakage, faulty streetlights, illegal parking, fallen trees, damaged road signs, and damaged electrical poles/wires. For these, only small hobby datasets, image-level labels, synthetic images, or undocumented collections were found. None of them can train a reliable street-level detector.

#### 8.3 AI Model Training Strategy
Each complaint category is trained independently on its own dataset, in its own notebook in `ai_model/`:

```text
Category Dataset (e.g. Pothole Segmentation YOLOv8)
            │
            ▼
   YOLOv8 fine-tuning (seg or detect)
            │
            ▼
 Validation: mAP50, precision, recall
            │
            ▼
pothole_road_damage_model.pt
```

The trained weights are produced by each notebook's training cell and copied into `ai_model/weights/` (`pothole_road_damage_model.pt`, `garbage_litter_model.pt`, `open_manhole_model.pt`, `graffiti_model.pt`), the model storage the AI service loads.

**Reference result:** the Pothole / Road Damage segmentation model reaches a mask mAP50 of **0.72** (precision 0.71, recall 0.66) on its 60-image validation split.

#### 8.4 Inference Architecture
The per-category models are served by a dedicated AI inference service. The backend calls it as part of complaint submission:

```text
                                       ┌────────────────────────┐
                                       │     AI Model Storage    │
                                       │                         │
                                       │ pothole_road_damage.pt  │
                                       │ garbage_litter.pt       │
                                       │ open_manhole.pt         │
                                       │ graffiti.pt             │
                                       └────────────┬────────────┘
                                                     │
                                                     ▼
┌───────────────────┐        REST API        ┌────────────────────────┐
│                    │  ─────────────────────►│                        │
│     Expo App       │                        │   Express / Node.js    │
│  (React Native)    │  ◄─────────────────────│                        │
└───────────────────┘                        │                        │
                                               │ Complaint Management   │
                                               │ OTP Verification       │
                                               │ Staff Workflow         │
                                               │ AI Integration         │
                                               └────────────┬────────────┘
                                                             │
                                ┌────────────────────────────┼────────────────────────────┐
                                │                             │                             │
                                ▼                             ▼                             ▼
                      ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
                      │      MongoDB      │         │  Python FastAPI   │         │  Image Storage    │
                      │                    │         │    AI Service      │         │                    │
                      │ Users              │         │                    │         │ Original Images   │
                      │ Complaints         │         │ YOLOv8 Inference   │         │ Annotated Images  │
                      │ Status History     │         │ Boxes and Masks    │         │                    │
                      │ AI Metadata        │         │ Image Annotation   │         │                    │
                      └──────────────────┘         └──────────────────┘         └──────────────────┘
```

**Request flow:**
1. The citizen submits a verified complaint with photos. The backend saves it immediately and returns the Tracking ID.
2. In the background, the backend sends the photos to `POST /predict/{category}` on the AI service.
3. The service runs the category's model and returns detections, confidence, the damaged share (segmentation models) and the annotated images.
4. The backend stores the annotated images next to the originals and writes the result to the complaint's `aiAnalysis`.
5. If the issue was not detected with enough confidence, `needsReview` is set to `true`.
6. The supervisor sees the AI result, the annotated photos and the suggested urgency in the triage queue.

#### 8.5 AI-Assisted Prioritisation
Urgency draws on two independent signals:
* **Citizen questionnaire:** five weighted yes/no questions per category give the urgency the citizen sees while filing (Section 3.1).
* **AI evidence:** the model's confidence and, for segmentation models, the damaged share of the surface give an `aiAnalysis.suggestedUrgency`. A large damaged area raises the suggestion, and a low-confidence result marks the complaint for review instead.

The supervisor sees both side by side and makes the final call. The AI informs the decision; it never accepts or rejects a complaint by itself.
