# Smart Digital Complaint Management and Public Transparency System
## Comprehensive Project Documentation & System Description

---

### 1. Project Overview

#### 1.1 System Explanation
The **Smart Digital Complaint Management and Public Transparency System** is a web-based citizen-engagement and public administration portal. It serves as a digital bridge between community members and municipal administrators, allowing citizens to log public issues (such as road damage, sanitation issues, water shortages, electricity failures, or administrative misconduct), verify their contact details on-the-fly, track complaint statuses in real-time, and audit official resolutions.

#### 1.2 Core Objectives
* **Public Accessibility:** Enable account-less, friction-free complaint logging with robust email verification.
* **Administrative Optimization:** Streamline internal workflows with an admin panel that allows status updates, public toggling, and PDF receipt compilation.
* **Absolute Transparency:** Expose all filed complaints and status counters on a public registry (with citizen details redacted) to promote accountability.
* **Audit Trails:** Record every status transition, the acting user, timestamps, and comments in a tamper-evident timeline.

---

### 2. Core Functional Modules

#### 2.1 Citizen Submission & Email Verification
To eliminate the barrier of account creation while preventing spam, the portal uses an **On-the-fly OTP Verification Flow**:
1. The citizen fills out the **File a Complaint** form (Name, Email, optional Phone, Subject, Category, Location, Description, and up to 3 Images).
2. The user clicks **Verify Email & Submit**, which requests a 6-digit OTP sent to their email.
3. An OTP modal prompts the citizen for the code. Upon successful verification:
   * The backend finds or creates a `User` record linked to the email.
   * A unique, high-entropy Tracking ID is generated (e.g. `COMP-XXXXX-X`).
   * The complaint is saved in MongoDB.
   * An email confirmation with the Tracking ID is sent to the citizen.

#### 2.2 Public Transparency & Search Repository
The homepage serves as the public dashboard:
* **Metrics Counters (Top):** Solid-colored dashboard panels displaying counts for:
  * *Total Issues Filed*
  * *Pending Complaints*
  * *In Progress Complaints*
  * *Resolved Complaints*
  * *Rejected Complaints*
* **Searchable Registry (Center):** A full-width list of all filed complaints where visitor search criteria include:
  * *Search by Location* (regex search on ward/area)
  * *Filter by Category / Type* (Sanitation, Roads, Water, Electricity, etc.)
  * *Filter by Status* (Pending, In Progress, Resolved, Rejected)
* **Progress Tracking:** Clicking on a complaint links to its tracking timeline, showing history logs with official comments.
* **PDF Receipt Downloads:** Publicly downloadable resolution receipts are compiled dynamically for *Resolved* complaints.

#### 2.3 Administrative Console
* **Admin Login (`/admin/login`):** A secure login page dedicated strictly to system administrators.
* **Admin Dashboard:** Displays KPI metrics, issue volumes, and complaint categories.
* **Complaints Management Grid:** A detailed list of all complaints with full citizen contact info (`name`, `email`, `phone`).
* **Status Action Page:** Administrators review complaints, assign teams, log remarks, change statuses, and toggle public visibility.
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
* **Styling Framework:** Bootstrap 5 (Responsive utilities) & Bootstrap Icons.
* **Layout Design:** Custom Vanilla CSS properties (strictly solid colors from design system).
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
* `pdfReceiptUrl` (String, Default: `""`)
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
  * *Payload:* Multipart Form Data (`name`, `email`, `phone`, `otp`, `title`, `description`, `category`, `location`, `images`)
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
  * *Payload:* `{ "status": "In Progress", "remarks": "Assigned to Ward 4 team.", "isPublic": true }`
  * *Action:* Triggers transition audit logs and nodemailer alerts.

---

### 6. Solid-Color Design System & Color Palette
The interface uses a strict solid-color layout with no gradients to present a clean, high-contrast, premium look.
* **Primary Blue:** `#2563EB` (Hover: `#1D4ED8`)
* **Success Green:** `#10B981` (Hover: `#059669`)
* **Warning Amber:** `#F59E0B`
* **Navy Backgrounds:** `#0F172A` (Sidebar/Navbar)
* **Light Background:** `#F8FAFC`
* **Surface Cards:** `#FFFFFF`
* **Border Light:** `#E2E8F0`
* **Status Badges:**
  * *Pending:* `#FEF3C7` background, `#B45309` text
  * *In Progress (WIP):* `#CFFAFE` background, `#0891B2` text
  * *Resolved:* `#DCFCE7` background, `#15803D` text
  * *Rejected:* `#FEE2E2` background, `#B91C1C` text

---

### 7. Seeded Credentials for Testing
To test the administration dashboard, utilize the seeded administrator account below:

* **Admin Portal Login Route:** `/admin/login` or `/login`
* **Admin Email:** `admin@complaintsystem.gov`
* **Admin Password:** `admin_password_123`
