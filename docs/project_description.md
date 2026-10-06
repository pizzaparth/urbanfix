# UrbanFix: Smart Digital Complaint Management and Public Transparency System
## Comprehensive Project Documentation & System Description

---

### 1. Project Overview

#### 1.1 System Explanation
**UrbanFix** (the Smart Digital Complaint Management and Public Transparency System) is a mobile civic-engagement platform. It connects citizens with the municipal staff who fix public infrastructure.

Citizens report issues from their phone without creating an account. Issues fall into a fixed 10-category taxonomy: potholes/road damage, garbage/litter, water leakage, faulty streetlights, illegal parking, open manholes, fallen trees, damaged road signs, graffiti, and damaged electrical poles/wires. Citizens verify each report with an email OTP and track its progress by Tracking ID.

Staff work the complaint through a ward-based workflow. A supervisor triages and assigns it, a field worker fixes it and uploads proof, and the supervisor closes it. Every complaint and its full status history is published in a public registry. Approved researchers can also query and export anonymised data.

The system has three parts:

| Part | Description |
|---|---|
| `mobile/` | Expo (React Native) app. The only client. Runs on Android and iOS through Expo Go, and in the browser for development. |
| `backend/` | Express + MongoDB REST API. Handles auth, complaints, the staff workflow, attendance and leave, email, PDF receipts, and research access. |
| `ai_model/` | YOLOv8 pothole segmentation notebook and dataset (see Sections 8 and 9). |

#### 1.2 Core Objectives
* **Public Accessibility:** Account-less complaint filing, verified by a one-time email code.
* **Accountable Workflow:** A role-based staff pipeline (triage, assignment, field work, proof review) with server-enforced transitions.
* **Absolute Transparency:** Every filed complaint and its status counters are public, with citizen details redacted.
* **Audit Trails:** Every transition records the stage, the acting user, a timestamp, and remarks.
* **Privacy-Safe Research:** Time-limited researcher access to aggregate or anonymised data, with every access logged.

---

### 2. User Roles

| Role | How they get access | What they do |
|---|---|---|
| **Citizen** | No account needed. A `User` record is created automatically on their first verified complaint. Optional registration with password gives a "My complaints" dashboard. | File complaints, track them, download receipts, browse the registry. |
| **Supervisor** | Invited by an admin. | Triage new complaints, assign field workers in their ward, review proof, close or send back for rework, approve field staff leave. Records own attendance and requests leave. |
| **Field worker** | Invited by an admin. Belongs to one ward. | See assigned tasks, start work, upload proof photos and a completion note. Check in/out and request leave. |
| **Admin** | Invited by an admin, or seeded. | Dashboard and analytics, status overrides on any complaint, staff account management, supervisor leave approvals, research application approvals, research audit log. |
| **Researcher** | Applies publicly; an admin approves and sets duration (max 180 days) and dataset scope. | View insights, run grouped queries, export CSV/JSON. Access stops automatically at expiry. |

Staff and researchers are onboarded through an **invite flow**. The admin creates the account, and the user receives an email link to set their own password. Only the SHA-256 hash of the invite token is stored, and it expires after 72 hours. Login is blocked until the password is set. Staff accounts are soft-deleted (`isActive: false`), never hard-deleted, because the audit trail references them.

---

### 3. Core Functional Modules

#### 3.1 Citizen Complaint Filing & Email Verification
Filing is a 6-step wizard on the **Report** tab:
1. **Category:** pick one of the 10 categories.
2. **Questions:** answer that category's 5 yes/no questions on swipeable cards (e.g. "Are live wires exposed or hanging at a low, reachable height?"). Each question has a severity weight (2 = safety-critical, 1 = standard context). The urgency is the share of weighted "Yes" answers: **High Urgency** at 60% or more, **Medium Urgency** at 30% or more, otherwise **Standard Urgency**. The citizen sees the result live.
3. **Details:** Subject, Description, Location, and **Ward** (Ward 1–10, required).
4. **Upload:** up to 3 photos (camera or gallery).
5. **Contact:** Name, Email, optional Phone.
6. **Review:** confirm and submit. This requests a 6-digit OTP to the email.

After the citizen enters a valid OTP (valid for 5 minutes):
* The backend finds or creates the citizen's `User` record by email.
* A Tracking ID is generated in the form `COMP-YYYYMMDD-XXXXX`.
* The complaint is saved as `Pending` / stage `submitted` and is public immediately.
* A confirmation email with the Tracking ID is sent.

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
                                                              ├── Nodemailer (SMTP)
                                                              ├── PDFKit
                                                              └── uploads/ (photos)
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
* `category` (String, Required, Indexed)
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
The Smart Digital Complaint Management and Public Transparency System incorporates an AI-powered computer vision layer to automatically analyze complaint images before they are published to the public registry.

Each complaint category has its own independently trained object detection model. When a citizen submits a complaint and selects a category, the system sends the uploaded image to the corresponding AI model.

The AI model attempts to:

1. Detect the reported issue in the image.
2. Identify the location of the issue using bounding boxes.
3. Draw a rectangle around the detected problem area.
4. Generate an annotated/highlighted version of the original image.
5. Return the detection confidence and bounding box metadata to the backend.

The AI system acts as an automated validation and localization layer. It does not automatically reject complaints. Complaints for which the AI cannot confidently detect the selected issue are routed to an administrative review queue.

#### 8.2 AI Models and Category Mapping
The system uses separate AI object detection models for each complaint category.

| Complaint Category | AI Model |
|---|---|
| Pothole / Road Damage | `pothole_road_damage_model.pt` |
| Garbage / Litter | `garbage_litter_model.pt` |
| Water Leakage | `water_leakage_model.pt` |
| Faulty Streetlight | `faulty_streetlight_model.pt` |
| Illegal Parking | `illegal_parking_model.pt` |
| Open Manhole | `open_manhole_model.pt` |
| Fallen Tree | `fallen_tree_model.pt` |
| Damaged Road Signs | `damaged_road_sign_model.pt` |
| Graffiti | `graffiti_model.pt` |
| Damaged Electrical Poles / Wires | `electrical_damage_model.pt` |

The `.pt` files are trained PyTorch model files containing the learned parameters and weights of the corresponding AI model.

The initial implementation uses YOLO-based object detection models fine-tuned independently for each complaint category.

#### 8.3 AI Model Training Strategy
Each complaint category is trained independently using a category-specific dataset:

```text
Pothole / Road Damage Dataset
            │
            ▼
      YOLO Training
            │
            ▼
pothole_road_damage_model.pt
```

The resulting per-category models are served by a dedicated AI inference service, called by the backend as part of complaint submission:

```text
                                       ┌────────────────────────┐
                                       │     AI Model Storage    │
                                       │                         │
                                       │ pothole_model.pt        │
                                       │ garbage_model.pt        │
                                       │ water_model.pt          │
                                       │ manhole_model.pt        │
                                       │ tree_model.pt           │
                                       │ graffiti_model.pt       │
                                       │ etc.                    │
                                       └────────────┬────────────┘
                                                     │
                                                     ▼
┌───────────────────┐        REST API        ┌────────────────────────┐
│                    │  ─────────────────────►│                        │
│   React Frontend   │                        │   Express / Node.js    │
│                    │  ◄─────────────────────│                        │
└───────────────────┘                        │                        │
                                               │ Complaint Management   │
                                               │ OTP Verification       │
                                               │ Admin Authentication   │
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
                      │ Complaints         │         │ YOLO Inference     │         │ Annotated Images  │
                      │ Status History     │         │ Bounding Boxes     │         │                    │
                      │ AI Metadata        │         │ Image Annotation   │         │                    │
                      └──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

### 9. AI Implementation Status
Section 8 is the target design. What exists today:

* **Built:** `ai_model/road_damage.ipynb` fine-tunes **YOLOv8n-seg** (Ultralytics) to segment potholes. It trains on the Roboflow dataset in `ai_model/Pothole_Segmentation_YOLOv8.v1i.yolov8/` (720 training and 60 validation images). A previous run reached a mask mAP50 of **0.72** (precision 0.71, recall 0.66) on the validation set. The notebook also estimates the damaged share of the road from mask area.
* **Not in the repository:** the trained weights. Re-run the notebook's training cell (a GPU is recommended) to produce `runs/segment/train/weights/best.pt`.
* **Not built yet:** the FastAPI inference service, the backend integration, AI metadata on complaints, annotated images, and models for the other nine categories.

**Planned first integration:**
1. Run a small Python inference service with the pothole model.
2. The backend calls it in the background for Pothole / Road Damage complaints with photos.
3. It stores the pothole count, confidence, and damage percentage on the complaint.
4. Supervisors see this as a suggested urgency during triage.

The model detects only potholes, so it never auto-rejects a complaint.
