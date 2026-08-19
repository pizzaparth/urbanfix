# Smart Digital Complaint Management and Public Transparency System
## Comprehensive Project Documentation & System Description

---

### 1. Project Overview

#### 1.1 System Explanation
The **Smart Digital Complaint Management and Public Transparency System** is a web-based citizen-engagement and public administration portal. It serves as a digital bridge between community members and municipal administrators, allowing citizens to log public infrastructure issues (across a fixed 10-category taxonomy — potholes/road damage, garbage/litter, water leakage, faulty streetlights, illegal parking, open manholes, fallen trees, damaged road signs, graffiti, and damaged electrical poles/wires), verify their contact details on-the-fly, track complaint statuses in real-time, and audit official resolutions.

#### 1.2 Core Objectives
* **Public Accessibility:** Enable account-less, friction-free complaint logging with robust email verification.
* **Administrative Optimization:** Streamline internal workflows with an admin panel that allows status updates and PDF receipt compilation.
* **Absolute Transparency:** Expose all filed complaints and status counters on a public registry (with citizen details redacted) to promote accountability.
* **Audit Trails:** Record every status transition, the acting user, timestamps, and comments in a tamper-evident timeline.

---

### 2. Core Functional Modules

#### 2.1 Citizen Submission & Email Verification
To eliminate the barrier of account creation while preventing spam, the portal uses an **On-the-fly OTP Verification Flow**:
1. The citizen picks an issue **Category**, then answers that category's dynamic **yes/no context questionnaire** (5 tailored questions per category, e.g. "Are live wires exposed or hanging at a low, reachable height?" for electrical hazards). Each question carries a severity weight (2 = safety-critical, 1 = standard context); a **live Priority Score** (Standard / Medium / High Urgency) is calculated as the proportion of weighted "Yes" answers and shown to the citizen as they answer.
2. The citizen provides Subject, Location, Description, and up to 3 supporting photographs, then their Name, Email, and optional Phone number.
3. The user submits, which requests a 6-digit OTP sent to their email.
4. An OTP modal prompts the citizen for the code. Upon successful verification:
   * The backend finds or creates a `User` record linked to the email.
   * A unique, high-entropy Tracking ID is generated (e.g. `COMP-XXXXX-X`).
   * The complaint is saved in MongoDB.
   * An email confirmation with the Tracking ID is sent to the citizen.

#### 2.2 Public Transparency & Search Repository
The homepage serves as the public dashboard:
* **Metrics Counters (Top):** A status radar chart (4 axes — Pending, In Progress, Resolved,
  Rejected) with the total issue count shown as a separate label alongside it.
* **Searchable Registry (Center):** A full-width list of all filed complaints where visitor search criteria include:
  * *Search by Location* (regex search on ward/area)
  * *Filter by Category / Type* (Pothole/Road Damage, Garbage/Litter, Water Leakage, Faulty Streetlight, and 6 more)
  * *Filter by Status* (Pending, In Progress, Resolved, Rejected)
* **Progress Tracking:** Clicking on a complaint links to its tracking timeline, showing history logs with official comments.
* **PDF Receipt Downloads:** Publicly downloadable resolution receipts are compiled dynamically for *Resolved* complaints.

#### 2.3 Administrative Console
* **Admin Login (`/admin/login`):** A secure login page dedicated strictly to system administrators.
* **Admin Dashboard:** Displays KPI metrics, issue volumes, and complaint categories.
* **Complaints Management Grid:** A detailed list of all complaints with full citizen contact info (`name`, `email`, `phone`).
* **Status Action Page:** Administrators review complaints, assign teams, log remarks, and change statuses. There is no manual public-visibility toggle — every submitted complaint is public by default.
  * **Status Transitions Allowed:** 
    * `Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` OR `Rejected`.
    * Moving directly from `Pending` to `Resolved` is blocked.
  * **Dynamic PDF Compilation:** Resolving a complaint compiles a PDF receipt showing descriptions, remarks, dates, and a digital signature placeholder, which is emailed directly to the citizen.

---

### 3. Architecture & Tech Stack

```
   [ React Frontend (Vite) ] <--- REST APIs ---> [ Express Backend (NodeJS) ] <---> [ MongoDB ]
```

#### 3.1 Backend
* **Core Runtime:** Node.js & Express.
* **Database Driver:** Mongoose (MongoDB ODM).
* **Validation Engine:** Zod (Type-safe request validations).
* **Media Parsing:** Multer (multipart form-data handling for supporting image uploads).
* **Email Service:** Nodemailer (SMTP transport for OTP codes, transitions, and PDF attachments).
* **Document Engine:** PDFKit (dynamic generation of resolution receipts).

#### 3.2 Frontend
* **Core Framework:** React (Vite environment).
* **Styling Framework:** Hand-rolled CSS design-token system (`src/styles/`) — no component framework. A dark monochrome Swiss-Tech/Vercel-Linear aesthetic: CSS custom properties for color/spacing/type, a real 12-column CSS Grid, and flat 1px-bordered components (no shadows, no glassmorphism, no gradients).
* **Typography:** Geist Sans (UI text, headings) and Geist Mono (metadata — tracking IDs, timestamps, counts, status), self-hosted via the `geist` npm package's raw variable `.woff2` files (no external font CDN).
* **Icons:** Lucide (`lucide-react`) exclusively, one consistent stroke weight across the app.
* **HTTP Client:** Axios (API communication layer with JWT automatic attachment interceptors).

---

### 4. Database Design (MongoDB Schemas)

#### 4.1 Users Collection (`User.js`)
Stores administrator accounts and auto-generated citizen profiles.
* `name` (String, Required)
* `email` (String, Required, Unique, Lowercase, Indexed)
* `password` (String, Required, Hashed) - *Optional/Generated on-the-fly for citizens*
* `phone` (String, Optional)
* `role` (String, Enum: `['citizen', 'admin']`, Default: `citizen`)
* `isVerified` (Boolean, Default: `false`)
* Timestamps (`createdAt`, `updatedAt`)

#### 4.2 OTPs Collection (`Otp.js`)
Temporary storage for email verification.
* `email` (String, Required, Indexed)
* `otp` (String, Required)
* `expiresAt` (Date, MongoDB TTL Indexed, automatic deletion after 5 minutes)

#### 4.3 Complaints Collection (`Complaint.js`)
Main ticket repository.
* `trackingId` (String, Required, Unique, Indexed)
* `citizenId` (ObjectId referencing `User`, Required, Indexed)
* `title` (String, Required, max 100 characters)
* `description` (String, Required)
* `category` (String, Required, Indexed)
* `location` (String, Required, Indexed)
* `images` (Array of Strings containing filepaths, max 3)
* `status` (String, Enum: `['Pending', 'In Progress', 'Resolved', 'Rejected']`, Default: `Pending`, Indexed)
* `isPublic` (Boolean, Default: `false`, Indexed)
* `remarks` (String, Default: `""`)
* `pdfReceiptUrl` (String, Default: `""`) — set to the download endpoint path when a complaint transitions to `Resolved`
* `urgencyLevel` (String, Enum: `['High Urgency', 'Medium Urgency', 'Standard Urgency']`, Default: `Standard Urgency`) — calculated client-side from the category questionnaire's weighted "Yes" answers
* `statusHistory` (Array of sub-documents):
  * `status` (String, Required)
  * `changedBy` (ObjectId referencing `User`, Required)
  * `remarks` (String, Required)
  * `changedAt` (Date, Default: `Date.now`)
* Timestamps (`createdAt`, `updatedAt`)

---

### 5. Core REST API Design

#### 5.1 Public & Submission Endpoints
* **`POST /api/complaints/request-otp`**
  * *Payload:* `{ "email": "citizen@email.com" }`
  * *Action:* Generates 6-digit OTP and dispatches email verification.
* **`POST /api/complaints`**
  * *Payload:* Multipart Form Data (`name`, `email`, `phone`, `otp`, `title`, `description`, `category`, `location`, `urgencyLevel`, `images`)
  * *Action:* Verifies OTP, registers user/complaint, generates Tracking ID, and triggers nodemailer alerts.
* **`GET /api/complaints/track/:trackingId`**
  * *Action:* Returns tracking log details (PII Redacted).
* **`GET /api/complaints/download-receipt/:trackingId`**
  * *Action:* Generates and streams PDF resolution receipt to browser.
* **`GET /api/public/complaints`**
  * *Query Params:* `location`, `category`, `status`, `page`, `limit`
  * *Action:* Returns redacted repository listings.
* **`GET /api/public/stats`**
  * *Action:* Returns status breakdown summaries for dashboard.

#### 5.2 Admin Endpoints
* **`POST /api/auth/login`**
  * *Payload:* `{ "email": "admin@email.com", "password": "password" }`
  * *Action:* Verifies credentials and returns access JWT.
* **`GET /api/admin/complaints`**
  * *Query Params:* `status`, `category`, `search`, `page`, `limit`
  * *Action:* Returns complaints list populated with citizen contact details.
* **`PATCH /api/admin/complaints/:id/status`**
  * *Payload:* `{ "status": "In Progress", "remarks": "Assigned to Ward 4 team." }` — no manual public-visibility toggle; every submitted complaint is public by default
  * *Action:* Triggers transition audit logs and nodemailer alerts.

---

### 6. Dark Monochrome Design System & Color Palette
The interface uses a restrained dark monochrome foundation with exactly one accent color — a
Swiss-Tech/Vercel-Linear aesthetic ("civic operating system"). No gradients, no glassmorphism,
no glow/blur effects. Status and priority meaning is communicated through color used sparingly
(icon/border/text only, never a filled pastel chip). See `color_palatte.md` for the full token
table and `Instructions/DESIGN_INSTRUCTION.md` for the governing design rules.
* **Page Background:** `#0A0A0A` · **Surface:** `#111111` · **Raised Surface (modals):** `#161616`
* **Borders:** `#1F1F1F` (default), `#272727` (strong)
* **Text:** `#FAFAFA` (headings) → `#E4E4E4` (body) → `#8C8C8C` (secondary) → `#6E6E6E` (muted)
* **The one accent color:** `#3B82F6` (hover `#60A5FA`) — used only for primary actions, active
  nav, links, focus rings, and the "in progress" status.
* **Status tokens** (icon/border/text color only, the default badge style): *Pending* `#C9A227` ·
  *In Progress* (accent) `#3B82F6` · *Resolved* `#22C55E` · *Rejected* `#EF5A5A`
* **Typography:** Geist Sans (headings/UI) and Geist Mono (tracking IDs, timestamps, counts,
  status text).

**Documented exceptions** (each scoped and deliberate, not a drift from the system above):
the navbar is a floating glass pill (`backdrop-filter: blur`) — the one place blur is used;
the Public Registry and Admin Action Panel use a second, solid-fill status badge variant
(fully rounded, dark green/yellow/orange/red background, white text) so status reads at a
glance across a list; the admin dashboard's category donut uses a validated multi-hue
categorical palette (not monochrome) since 10 simultaneous categories were not
distinguishable on a single-hue ramp.

---

### 7. Seeded Credentials for Testing
To test the administration dashboard, utilize the seeded administrator account below:

* **Admin Portal Login Route:** `/admin/login` or `/login`
* **Admin Email:** `admin@complaintsystem.gov`
* **Admin Password:** `admin_password_123`
