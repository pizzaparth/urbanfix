# Project Status & Comprehensive Codebase Documentation

**System Title:** Smart Digital Complaint Management and Public Transparency System (UrbanFix Portal)  
**Date:** July 20, 2026  
**Repository Location:** `/Users/parth/University/Classes/3rd semester/DSN`  

---

## 1. Executive Summary & Project Identity

The **Smart Digital Complaint Management and Public Transparency System** is an enterprise-grade citizen engagement and public administration portal built to bridge the gap between municipal administrators and community members. It empowers citizens to log public infrastructure and administration issues (such as road damage, water supply failures, sanitation issues, electricity outages, and administrative misconduct) without forced account registration, while enforcing complete public transparency and auditability.

### Key Value Propositions
* **Account-Less Citizen Logging:** Citizens register complaints friction-free via on-the-fly email One-Time Password (OTP) verification.
* **Tamper-Evident Audit Trails:** Every complaint maintains an immutable `statusHistory` array detailing every status transition, acting user, timestamp, and official remarks.
* **Public Transparency Registry:** A publicly accessible dashboard showcases all filed issues and macro-level KPIs while redacting citizen Personally Identifiable Information (PII).
* **Automated PDF & Email Notifications:** Automated status update emails and dynamically compiled PDF resolution receipts (via PDFKit) dispatched upon ticket resolution.

---

## 2. Technical Stack & Architecture

```
                                +-----------------------------------+
                                |   React 19 Frontend (Vite App)    |
                                | Bootstrap 5 + Axios + React Router|
                                +-----------------+-----------------+
                                                  |
                                            REST APIs (JSON / FormData)
                                                  |
                                +-----------------v-----------------+
                                |    Express.js Backend Server      |
                                |  (Node.js ES Modules / Morgan)    |
                                +----+----------+---------+---------+
                                     |          |         |
           +-------------------------+          |         +-------------------------+
           |                                    |                                   |
+----------v----------+              +----------v----------+              +---------v---------+
|   MongoDB Database  |              | Nodemailer Service  |              | PDFKit Receipt    |
| (Mongoose ORM / TTL)|              | (SMTP / Ethereal)   |              | Generator Engine  |
+---------------------+              +---------------------+              +-------------------+
```

| Layer | Technology / Library | Description & Version |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Fast HMR development setup with client-side React Router v7 |
| **Frontend Styling** | Bootstrap 5.3 + Custom CSS | Responsive layout utilities & strict solid-color design system |
| **HTTP Client** | Axios | Configured with automatic JWT bearer token interceptors |
| **Backend Runtime** | Node.js (v18+) | ES Module (`"type": "module"`) Express application |
| **Database** | MongoDB + Mongoose v8 | Schematized data layer with TTL indexes and reference population |
| **Validation Layer** | Zod v3.22 | Strict type checking and input sanitization schemas |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | JWT bearer token sessions for authenticated users / admins |
| **File Handling** | Multer v1.4 | Multipart form-data middleware supporting up to 3 image uploads |
| **Mail Engine** | Nodemailer v6.9 | SMTP mail transport with dynamic Ethereal test account fallback |
| **Document Generation** | PDFKit v0.15 | Programmatic A4 PDF receipt renderer |

---

## 3. Database Design & Data Models

The MongoDB database consists of three primary collections modeled via Mongoose in `/backend/models`:

### 3.1 `User` Model (`/backend/models/User.js`)
Stores system administrators and automatically created citizen profiles.
* `name` (String, Required) - Full name of the user.
* `email` (String, Required, Unique, Lowercase, Indexed) - Primary email identifier.
* `password` (String, Required, Min 8 chars, Hashed) - Bcrypt hashed password (`select: false` by default).
* `phone` (String, Optional) - Contact phone number.
* `role` (String, Enum: `['citizen', 'admin']`, Default: `'citizen'`) - Access authorization level.
* `isVerified` (Boolean, Default: `false`) - Verified status following OTP execution.
* *Hooks & Methods:* `pre('save')` automatic password hashing hook; `comparePassword()` instance method.

### 3.2 `Otp` Model (`/backend/models/Otp.js`)
Transient storage for email verification OTPs with auto-expiration.
* `email` (String, Required, Indexed) - Target verification email.
* `otp` (String, Required) - 6-digit numeric OTP code.
* `expiresAt` (Date, Required, TTL Indexed) - Expiration timestamp with `expireAfterSeconds: 0`.

### 3.3 `Complaint` Model (`/backend/models/Complaint.js`)
Core ticket schema tracking complaint details, status lifecycle, and history.
* `trackingId` (String, Unique, Required, Indexed) - High-entropy identifier (`COMP-XXXXX-X`).
* `citizenId` (ObjectId, Ref: `User`, Required, Indexed) - Foreign key referencing the submitter.
* `title` (String, Required, Max 100 chars) - Summary title of the issue.
* `description` (String, Required) - Detailed explanation.
* `category` (String, Required, Indexed) - Category classification (`Sanitation`, `Roads`, `Water Supply`, `Electricity`, `Administrative`, `Other`).
* `location` (String, Required, Indexed) - Ward/area location description.
* `images` (Array of Strings, Max 3) - Relative file paths to uploaded attachments (`/uploads/...`).
* `status` (String, Enum: `['Pending', 'In Progress', 'Resolved', 'Rejected']`, Default: `'Pending'`, Indexed).
* `isPublic` (Boolean, Default: `false`, Indexed) - Visibility toggle for transparency listing.
* `remarks` (String) - Admin resolution or status remarks.
* `pdfReceiptUrl` (String) - Endpoint URL to download generated resolution receipt.
* `statusHistory` (Array of Embedded Objects):
  * `status` (String, Enum) - State after transition.
  * `changedBy` (ObjectId, Ref: `User`) - Admin or user who performed the transition.
  * `remarks` (String) - Mandatory remark associated with transition.
  * `changedAt` (Date, Default: `Date.now`).

---

## 4. Complaint State Machine & Business Rules

```
                      +-------------------+
                      |      Pending      | (Initial State on Submission)
                      +---------+---------+
                                |
                                | (Admin Action: Status Update)
                                v
                      +-------------------+
                      |    In Progress    |
                      +----+---------+----+
                           |         |
       +-------------------+         +-------------------+
       | (Admin Action)                                  | (Admin Action)
       v                                                 v
+--------------+                                  +--------------+
|   Resolved   | (Terminal State)                 |   Rejected   | (Terminal State)
+--------------+                                  +--------------+
```

### Transition Constraints Enforced (`/backend/controllers/adminController.js`)
1. **Initial State:** All newly submitted complaints start strictly in `Pending` status.
2. **Sequential Progress Constraint:** Direct transition from `Pending` to `Resolved` is **blocked**. Tickets must move through `In Progress` first.
3. **Terminal States:** Once a complaint reaches `Resolved` or `Rejected`, it enters a terminal state and **cannot be further updated or altered**.
4. **Mandatory Remarks:** Every status transition requires non-empty remarks explaining the administrative rationale.
5. **Resolution Side-Effects:** Transitioning a ticket to `Resolved` triggers automatic PDF receipt compilation and dispatches an email to the citizen with the PDF receipt attached.

---

## 5. Backend API Endpoints & Routes Overview

Base URL: `http://localhost:5001/api`

### 5.1 Public & Complaint Endpoints (`/api/complaints` & `/api/public`)
* `POST /api/complaints/request-otp`: Accepts `{ email }`, generates 6-digit OTP code, saves in DB, sends email.
* `POST /api/complaints`: Accepts `multipart/form-data` with fields (`name`, `email`, `phone`, `otp`, `title`, `description`, `category`, `location`) and up to 3 image files. Verifies OTP, registers user/ticket, dispatches confirmation.
* `GET /api/complaints/track/:trackingId`: Retrieves tracking details and status history (citizen details redacted).
* `GET /api/complaints/download-receipt/:trackingId`: Streams dynamically generated PDF resolution receipt for resolved complaints.
* `GET /api/public/stats`: Returns status breakdown counts (`total`, `Pending`, `In Progress`, `Resolved`, `Rejected`) and category distribution for public dashboards.
* `GET /api/public/complaints`: Returns public registry of complaints (supports `location`, `category`, `status`, `page`, `limit` queries; PII redacted).

### 5.2 Authentication Endpoints (`/api/auth`)
* `POST /api/auth/register`: Citizen registration endpoint (triggers OTP).
* `POST /api/auth/verify-otp`: Validates OTP and issues JWT token.
* `POST /api/auth/resend-otp`: Resends verification OTP code.
* `POST /api/auth/login`: Authenticates credentials (admin or citizen) and returns JWT bearer token.

### 5.3 Admin Endpoints (`/api/admin`) *(Requires Bearer Token + Admin Role)*
* `GET /api/admin/stats`: Retrieves administrative analytics summary.
* `GET /api/admin/complaints`: Retrieves paginated, filterable complaints grid populated with full citizen contact details (`name`, `email`, `phone`).
* `PATCH /api/admin/complaints/:id/status`: Updates complaint status, remarks, public toggle, and triggers email/PDF side-effects.

---

## 6. Frontend Components & User Interface Architecture

```
src/
├── App.jsx                   # Central Router & ProtectedRoute guard wrappers
├── main.jsx                  # React application entry point
├── index.css                 # Custom CSS Design System (Solid Colors, Badges, Cards)
├── contexts/
│   └── AuthContext.jsx       # Context Provider managing auth state & localStorage tokens
├── services/
│   └── api.js                # Axios instance with VITE_API_URL & Auth Interceptors
├── layouts/
│   ├── MainLayout.jsx        # Public Navbar & Footer wrapper
│   └── AdminLayout.jsx       # Dark sidebar layout for administrative pages
└── pages/
    ├── public/
    │   ├── Home.jsx          # Public Dashboard with Top Statistics Overview & Feature Navigation
    │   ├── Registry.jsx      # Searchable Complaints Registry with filters & PDF receipt download
    │   ├── FileComplaint.jsx # Multi-step complaint submission form with dynamic questionnaire & OTP
    │   └── Tracker.jsx       # Tracking ID search and audit timeline viewer
    ├── citizen/
    │   ├── Login.jsx         # Unified Login view (Admin & Citizen access)
    │   ├── Register.jsx      # Secondary registration view
    │   ├── VerifyOtp.jsx     # OTP verification screen
    │   └── Dashboard.jsx     # Citizen personal complaints list
    └── admin/
        ├── AdminDashboard.jsx # KPI Cards, Search/Filters, & Complaints Data Table
        └── ComplaintDetail.jsx# Status transition form, remarks editor, & audit logs
```

### Key UI Features
1. **Public Home Dashboard (`Home.jsx`):**
   * Centered statistics overview section with title placed directly on top of number in solid black Poppins font (`#000000`).
   * Mobile-responsive vertical stacking layout (`col-12 col-md`) for smaller device viewports.
   * Feature quick-navigation cards and tutorial headers utilizing SVG icon assets (`notebook-test.svg`, `circle-plus.svg`, `search.svg`) from `/frontend/public/`.
   * User Guide & Tutorial Sections: 3 full-width vertical tutorial sections (*Tutorial 1: Submit Complaint*, *Tutorial 2: Public Registry*, *Tutorial 3: Track Status*) featuring vertical step layouts with numbered badges and uniform hover action buttons.
2. **Public Complaints Registry (`Registry.jsx`):**
   * Dedicated page accessible via Navbar ("Public Registry").
   * Adheres to universal design system: Poppins typography (`#000000` / `#0F172A`), high-contrast body & small font text (`#1E293B` / `#0F172A`), dedicated section heading ("Registered Public Complaints"), semantic solid pill badges (`Pending`, `In Progress`, `Resolved`, `Rejected`), monospace tracking IDs (`COMP-XXXXX-X`), non-collapsible vertical stacked search/filter layout, separated icon boxes with horizontal gap (`gap-2`), inline clear (`✕`), removable active filter summary chips, 1-click "Reset All" button with hover fill (`#EF4444`), sorting toggle (`Newest` vs `Oldest`), and PDF receipt downloads.
3. **Frictionless Submission (`FileComplaint.jsx`):**
   * 3-step filing wizard with category-specific questionnaires (`Road Damage`, `Water Leakage`, `Garbage`, `Street Light`, `Administrative`, `Other`).
   * Fully mobile-responsive layout: flexible step bar indicators, responsive category grid (`col-12 col-sm-6 col-md-4`), full-width mobile Yes/No questionnaire toggles, responsive action buttons (`flex-column-reverse flex-sm-row`), responsive review grid (`col-12 col-sm-6`), padding-safe OTP and Success modal overlays, real-time urgency badge calculation (`High Urgency`, `Medium Urgency`, `Standard Urgency`), and email OTP verification.
4. **Frosted Glass Responsive Navbar (`MainLayout.jsx`):**
   * Sticky top header with frosted glass blur effect (`backdrop-filter: blur(12px)`).
   * Active route pill highlights (`#60A5FA`), prominent primary call-to-action button for "File a Complaint", touch-friendly mobile drawer menu, and user session pill.
5. **Admin Control Console (`AdminDashboard.jsx` & `ComplaintDetail.jsx`):**
   * Full data table listing complaints with citizen contact details.
   * Interactive status update form enforcing allowed transitions, mandatory remarks, and public visibility toggle.

---

## 7. Design System & UI Specifications

The interface adheres strictly to a **Solid-Color Design System** (no background gradients) based on `/color_palatte.md`:

| Visual Token | Hex Code | Applied Component / Context |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563EB` | Main buttons, navigation active states, links |
| **Primary Hover** | `#1D4ED8` | Button hover states |
| **Success Green** | `#10B981` | Secondary buttons, resolved badge accents |
| **Warning Amber** | `#F59E0B` | Pending status badges, warning callouts |
| **Dark Navy** | `#0F172A` | Navbar, Admin sidebar background |
| **Page Background** | `#F8FAFC` | Main viewport body background |
| **Surface Card** | `#FFFFFF` | Cards, tables, forms, modals |
| **Status: Pending** | `#FEF3C7` (BG) / `#B45309` (Text) | Badges & metrics cards |
| **Status: In Progress** | `#CFFAFE` (BG) / `#0891B2` (Text) | Badges & metrics cards |
| **Status: Resolved** | `#DCFCE7` (BG) / `#15803D` (Text) | Badges & metrics cards |
| **Status: Rejected** | `#FEE2E2` (BG) / `#B91C1C` (Text) | Badges & metrics cards |

---

## 8. Environment Configuration & Seed Credentials

### 8.1 Environment File (`/backend/.env`)
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/complaint_system
JWT_SECRET=super_secret_jwt_key_complaint_system_2024
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM=noreply@complaintsystem.gov
```
*Note:* If SMTP credentials are left as placeholders, the email service automatically creates an **Ethereal Test SMTP Account** or logs the OTP directly to the terminal console as a fail-safe.

### 8.2 Default Admin Credentials
Seeded via `node backend/seedAdmin.js`:
* **Admin Login Route:** `/admin/login` or `/login`
* **Email:** `admin@complaintsystem.gov`
* **Password:** `admin_password_123`

---

## 9. Current Operational State & Verification Checklist

| Module / Feature | Status | Verification Detail |
| :--- | :--- | :--- |
| **Backend Express Server** | ✅ Fully Functional | Health check at `/health`, error middleware, CORS enabled |
| **MongoDB Mongoose Models** | ✅ Fully Functional | Indexes applied, TTL on OTPs, sub-documents for audit trail |
| **On-the-fly OTP Flow** | ✅ Fully Functional | Transient OTP creation, email delivery with console fallback |
| **Dynamic Category Questionnaire**| ✅ Fully Functional | Dynamic Yes/No questionnaire & calculated urgency badges per category |
| **Multi-Step Submission Wizard**| ✅ Fully Functional | 3-step filing wizard on `/file-complaint` with preview & OTP modal |
| **Frosted Glass Responsive Navbar**| ✅ Fully Functional | Sticky header with blur, active route pills, CTA button & touch drawer |
| **Homepage Centered Statistics** | ✅ Fully Functional | Title on top of number in solid black Poppins; mobile vertical stacking |
| **Dedicated Public Registry Page**| ✅ Fully Functional | `/registry` page with location regex search, category & status filters |
| **Complaint Submission** | ✅ Fully Functional | Multer multi-file upload, tracking ID generation (`COMP-XXXXX-X`) |
| **State Machine Constraints** | ✅ Fully Functional | Enforces `Pending` -> `In Progress` -> `Resolved`/`Rejected` flow |
| **PDF Receipt Engine** | ✅ Fully Functional | PDFKit streaming and email attachment upon ticket resolution |
| **Public Transparency Portal**| ✅ Fully Functional | Redacts PII (`citizenId`), search by location, category, status |
| **Admin Console & Auth** | ✅ Fully Functional | JWT bearer auth, protected routes, stats breakdown |
| **Solid-Color Styling System**| ✅ Fully Functional | Custom CSS matching `#2563EB`, `#0F172A`, `#F8FAFC` palette |


---

## 10. How to Run the Application

### Backend Setup & Execution
```bash
cd backend
npm install
node seedAdmin.js   # Seed initial administrator account
npm run dev         # Starts server on http://localhost:5001
```

### Frontend Setup & Execution
```bash
cd frontend
npm install
npm run dev         # Starts Vite server on http://localhost:5173
```
