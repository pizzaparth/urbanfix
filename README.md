# UrbanFix: Smart Digital Complaint Management and Public Transparency System

UrbanFix is a civic issue reporting platform. Citizens report problems such as potholes, garbage and broken streetlights from their phone without creating an account. Municipal staff triage, assign and resolve those complaints. Every complaint and its full status history is published in a public registry.

The project has three parts:

| Part | What it is |
|------|------------|
| [`mobile/`](./mobile) | Expo (React Native) app. The only client. Runs on Android, iOS and, for development, the browser. |
| [`backend/`](./backend) | Express + MongoDB REST API. Handles auth, complaints, workflow, email, PDF receipts and research exports. |
| [`ai_model/`](./ai_model) | YOLOv8 pothole segmentation notebook and dataset, for validating photos on road-damage complaints. Not yet wired into the app. |

## Features

**Citizens (no account needed)**
- File a complaint in a guided wizard: category, swipe yes/no questions, details, location, ward and photos.
- Verify with a one-time code sent by email. The tracking ID comes back immediately.
- Track any complaint by ID and download a PDF receipt.
- Browse the public registry and live statistics.

**Staff roles**
- **Supervisor:** triages new complaints (accept or reject) and assigns them to field workers. Reviews the proof photos, then closes the complaint or sends it back for rework. Approves field staff leave.
- **Field worker:** sees assigned tasks, marks work in progress and uploads proof photos. Checks in and out for attendance and requests leave.
- **Admin:** dashboard, activity heatmap and analytics; status overrides on any complaint; staff accounts; leave approvals; research access approvals and the research audit log.
- **Researcher:** applies for time-limited dataset access, then views insights and exports aggregate or anonymised data.

**Complaint categories (10):** Pothole / Road Damage, Garbage / Litter, Water Leakage, Faulty Streetlight, Illegal Parking, Open Manhole, Fallen Tree, Damaged Road Signs, Graffiti, Damaged Electrical Poles / Wires.

### Complaint lifecycle

Staff work with a detailed `stage`. Citizens and the registry see a simpler `status` derived from it. See `backend/utils/complaintStage.js`.

```
submitted ──► accepted ──► assigned ──► work_in_progress ──► proof_submitted ──► closed
   │            └──────────── In Progress ───────────────────────────┘           Resolved
   └──► triage_rejected (Rejected)
Pending
```

Every transition is appended to the complaint's `statusHistory`: who acted, when, and their remarks.

## Tech stack

| Layer | Stack |
|-------|-------|
| Mobile | Expo SDK 57, React Native 0.86, React 19, React Navigation 7, Reanimated 4, FlashList, react-native-svg |
| Backend | Node.js, Express 4, Mongoose 8 (MongoDB), JWT auth, Zod validation, Multer uploads, Nodemailer, PDFKit |
| AI | Ultralytics YOLOv8n-seg, trained on a Roboflow pothole segmentation dataset |

## Repository structure

```
.
├── README.md
├── mobile/                     Expo app
│   ├── App.js                  root: fonts, safe area, keyboard handling, navigation
│   ├── app.json                Expo config (name, scheme `dsn://`, permissions)
│   └── src/
│       ├── theme.js            design tokens (light theme)
│       ├── navigation/         RootNavigator: role-based tabs and stacks, deep links
│       ├── screens/            public/ citizen/ supervisor/ field/ admin/ research/
│       ├── components/         shared UI (uikit.jsx, GlassTabBar, charts, cards…)
│       ├── services/           api.js (axios + auth token), tokenStore.js
│       ├── hooks/ contexts/ constants/ utils/ config/
├── backend/                    Express API
│   ├── server.js               app entry; mounts /api/* routes
│   ├── routes/ controllers/    auth, complaints, public, admin, supervisor, field, research
│   ├── models/                 User, Complaint, Otp, LeaveRequest, AttendanceRecord, Research*
│   ├── services/               complaint workflow, email, PDF receipts, expiry job
│   ├── middleware/ validators/ utils/ constants/ config/
│   ├── scripts/                seed and backfill scripts (see below)
│   └── uploads/                complaint photos (git-ignored)
├── ai_model/
│   ├── road_damage.ipynb       training and evaluation notebook
│   └── Pothole_Segmentation_YOLOv8.v1i.yolov8/   dataset (720 train / 60 val images)
└── docs/
    ├── project_description.md  full system description: modules, schemas, API, AI plan
    ├── presentation/           Presentation.pdf, slide outline, SVG figures
    ├── reports/                project description and exhibition review PDFs
    └── sample-images/          photos for testing complaint submissions
```

## Getting started

### Prerequisites

- Node.js 20 or newer, and npm
- MongoDB running locally (default `mongodb://localhost:27017/complaint_system`)
- On your phone, the **Expo Go** app with SDK 57 support (update it from the Play Store or App Store)
- Phone and computer on the same Wi-Fi network

### 1. Backend

```bash
cd backend
cp .env.example .env        # then fill in JWT_SECRET and the SMTP settings
npm install
npm run seed:roles          # one dev account per role (see below)
npm run seed:complaints     # optional: about 60 sample complaints
npm run dev                 # http://localhost:5001, check with GET /health
```

OTP and status emails go through the SMTP server set in `.env`. If SMTP is not configured, the backend creates an Ethereal test inbox and prints its login in the console.

### 2. Mobile app

```bash
cd mobile
npm install
npx expo start --go -c
```

- **Phone:** scan the QR code with Expo Go.
- **Browser:** press `w`.
- **Android emulator:** press `a`.

You don't need to configure an API URL. The app reaches the backend on the same machine that serves Metro, on port 5001, so it keeps working when your IP changes. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` only to use a different backend, for example a deployed server or `expo start --tunnel`. See [`mobile/README.md`](./mobile/README.md) for details.

### Development accounts

Created by `npm run seed:roles`. It is idempotent and refuses to run when `NODE_ENV=production`.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Passw0rd!123` |
| Supervisor | `supervisor@example.com` | `Passw0rd!123` |
| Field worker (Ward 1) | `field1@example.com` | `Passw0rd!123` |
| Field worker (Ward 2) | `field2@example.com` | `Passw0rd!123` |
| Researcher (aggregate only) | `researcher@example.com` | `Passw0rd!123` |
| Researcher (anonymised records) | `researcher-records@example.com` | `Passw0rd!123` |

`npm run seed:admin` also creates the original admin, `admin@complaintsystem.gov` / `admin_password_123`. Citizens have no seeded account; they verify each complaint by email OTP.

### Backend scripts

Run these from `backend/`.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API without nodemon |
| `npm run seed:admin` | Create the original admin account |
| `npm run seed:roles` | Create one account per role |
| `npm run seed:complaints` | Insert sample complaints spread over the last 12 months |
| `npm run backfill:stage-ward` | Fill `stage` and `ward` on old complaints |
| `npm run backfill:public` | Mark old complaints public |
| `npm run backfill:urgency` | Normalise old urgency values |

Set `DISABLE_JOBS=true` to skip the background job that emails researchers before their access expires.

## API overview

All routes are under `/api`. Photos are served from `/uploads`.

| Prefix | Who | Examples |
|--------|-----|----------|
| `/api/auth` | everyone | register, verify/resend OTP, login, set password, current user |
| `/api/complaints` | citizens | request OTP, submit (multipart photos), track, PDF receipt, my complaints |
| `/api/public` | anyone | registry, statistics |
| `/api/supervisor` | supervisor | triage queue, accept/reject, assign, close/rework, field staff, leave, attendance |
| `/api/field` | field worker | tasks, progress, proof upload, attendance, leave |
| `/api/admin` | admin | stats, activity heatmap, complaint overrides, users, leave, research applications, research audit |
| `/api/research` | researcher | apply, dashboard, query, export |

## AI model status

`ai_model/road_damage.ipynb` fine-tunes YOLOv8n-seg to segment potholes. A previous training run reached a mask mAP50 of **0.72** (precision 0.71, recall 0.66) on the 60-image validation set. It also estimates the damaged share of the road from mask area.

The trained weights (`best.pt`) are **not in the repository**. Re-run the notebook's training cell (a GPU is recommended) to produce `runs/segment/train/weights/best.pt`.

**Planned integration:**
1. Run a small Python inference service.
2. The backend calls it in the background for Pothole / Road Damage complaints with photos.
3. It stores the pothole count, confidence and damage percentage on the complaint.
4. Supervisors see this as a suggested urgency during triage.

The model only detects potholes, so it should never auto-reject a complaint. Section 8 of [`docs/project_description.md`](./docs/project_description.md) has the wider AI plan.

## Documentation

- [`docs/project_description.md`](./docs/project_description.md): full system description (modules, schemas, API, AI validation plan)
- [`docs/presentation/`](./docs/presentation): presentation PDF, slide outline and SVG figures
- [`docs/reports/`](./docs/reports): submitted project description and exhibition review documents
- [`mobile/README.md`](./mobile/README.md): running the app, phone vs browser differences, app structure
