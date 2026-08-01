# Project Status & Comprehensive Codebase Documentation

**System Title:** Smart Digital Complaint Management and Public Transparency System (UrbanFix Portal)  
**Date:** July 25, 2026  
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
                                |  Hand-rolled CSS design system +  |
                                |   Chart.js + Axios + React Router |
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
| **Frontend Framework** | React 19 + Vite 8 | Fast HMR development setup with client-side React Router v6 |
| **Frontend Styling** | Hand-rolled CSS (no framework) | No Bootstrap/Tailwind — a bespoke dark, monochrome + one-accent design system (`frontend/src/styles/{tokens,base,layout,components,fonts}.css`); see §7 |
| **Charts** | Chart.js v4 + `react-chartjs-2` v5 | Doughnut, Line, stacked-Doughnut-as-rings (admin dashboard), and native Radar (`StatsCounterCard`, both Home & AdminDashboard); see §6 |
| **Icons** | `lucide-react` | Sole icon library across the app, fixed stroke width (`ICON_STROKE`) |
| **Fonts** | `geist` npm package (self-hosted `.woff2`) | Geist Sans (UI text) + Geist Mono (metadata/IDs/timestamps) — no external font CDN |
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
* `category` (String, Required, Indexed) - Category classification (`Road Damage`, `Water Leakage`, `Garbage`, `Street Light`, `Administrative`, `Other`) - single source of truth is `frontend/src/constants/categories.js`, shared by every category picker/filter in the app.
* `location` (String, Required, Indexed) - Ward/area location description.
* `images` (Array of Strings, Max 3) - Relative file paths to uploaded attachments (`/uploads/...`).
* `status` (String, Enum: `['Pending', 'In Progress', 'Resolved', 'Rejected']`, Default: `'Pending'`, Indexed).
* `isPublic` (Boolean, Default: `false`, Indexed) - Gates visibility on the public registry (`GET /api/public/complaints` filters on `isPublic: true`). Set to `true` automatically on every submission (`complaintController.submitComplaint`) since there is no manual admin toggle; pre-existing records were backfilled via `backend/scripts/backfillIsPublic.js`.
* `remarks` (String) - Admin resolution or status remarks.
* `pdfReceiptUrl` (String) - Endpoint URL to download generated resolution receipt.
* `statusHistory` (Array of Embedded Objects):
  * `status` (String, Enum) - State after transition.
  * `changedBy` (ObjectId, Ref: `User`) - Admin or user who performed the transition.
  * `remarks` (String) - Mandatory remark associated with transition.
  * `changedAt` (Date, Default: `Date.now`) — this is the authoritative "status changed on this date" timestamp (not `updatedAt`); the admin activity heatmap's resolved-count aggregation reads it directly.

Indexes: `citizenId`, `status`, `category`, `location`, `isPublic`, and `createdAt` (added to support the admin activity heatmap's 365-day range scan — see §5.3 and §6).

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
* `POST /api/complaints`: Accepts `multipart/form-data` with fields (`name`, `email`, `phone`, `otp`, `title`, `description`, `category`, `location`, `urgencyLevel`) and up to 3 image files. Verifies OTP, registers user/ticket, dispatches confirmation. Complaints are created with `isPublic: true`.
* `GET /api/complaints/track/:trackingId`: Retrieves tracking details and status history (citizen details redacted).
* `GET /api/complaints/download-receipt/:trackingId`: Streams dynamically generated PDF resolution receipt for resolved complaints.
* `GET /api/public/stats`: Returns status breakdown counts (`total`, `Pending`, `In Progress`, `Resolved`, `Rejected`) and category distribution for public dashboards. Status-breakdown aggregation is shared with `/api/admin/stats` via `backend/utils/statsHelpers.js`.
* `GET /api/public/complaints`: Returns public registry of complaints, filtered to `isPublic: true` (supports `location`, `category`, `status`, `page`, `limit` queries; PII redacted).

### 5.2 Authentication Endpoints (`/api/auth`)
* `POST /api/auth/register`: Citizen registration endpoint (triggers OTP).
* `POST /api/auth/verify-otp`: Validates OTP and issues JWT token.
* `POST /api/auth/resend-otp`: Resends verification OTP code.
* `POST /api/auth/login`: Authenticates credentials (admin or citizen) and returns JWT bearer token.

### 5.3 Admin Endpoints (`/api/admin`) *(Requires Bearer Token + Admin Role)*
* `GET /api/admin/stats`: Retrieves administrative analytics summary (status breakdown, category distribution, urgency distribution, timeline trend). Note: the `timelineTrend` aggregation has a known pre-existing bug — it groups over the entire collection with no date filter and a flat `$limit: 14`, so it returns the *earliest* 14 days with data rather than the last 14. Not yet fixed.
* `GET /api/admin/activity-heatmap?days=365`: Returns a continuous, zero-filled daily series (`{ date, filedCount, resolvedCount, count }[]`, plus `maxCount`) merging complaints **filed** (`createdAt`) and complaints **resolved** (`statusHistory` entries where `status === 'Resolved'`, keyed by `changedAt`) for the last N days (default/max 365). Powers the `/admin/action` contribution-style heatmap (§6). Built via a single `$facet` aggregation in `backend/utils/statsHelpers.js` (`getActivityByDay`), all computed in UTC.
* `GET /api/admin/complaints`: Retrieves paginated, filterable complaints grid populated with full citizen contact details (`name`, `email`, `phone`).
* `PATCH /api/admin/complaints/:id/status`: Updates complaint status and remarks (enforcing the state-machine transition constraints below) and triggers email/PDF side-effects. There is no manual public-visibility toggle on this endpoint - see `isPublic` in §3.3.

---

## 6. Frontend Components & User Interface Architecture

```
src/
├── App.jsx                   # Central Router & ProtectedRoute guard wrappers
├── main.jsx                  # React application entry point
├── index.css                 # Imports the styles/ modules below, in cascade order
├── styles/
│   ├── tokens.css             # Design tokens: gray scale, the one accent color, spacing, radii, type — source of truth for /color_palatte.md
│   ├── base.css                # Resets, html/body, global element defaults
│   ├── layout.css              # .container, .grid-12/.col-span-*, .filter-bar (responsive search/filter row), flex utilities
│   ├── components.css          # Every component class: .navbar, .btn, .panel, .stats-grid, .donut-*, .ring-*, .heatmap-*, .session-pill, etc.
│   └── fonts.css               # @font-face declarations for self-hosted Geist Sans/Mono
├── constants/
│   ├── categories.js          # Canonical CATEGORIES list & CATEGORY_QUESTIONNAIRES map (single source of truth)
│   └── icons.js                # ICON_STROKE — the one stroke-width constant every lucide-react icon uses
├── config/
│   └── chartTheme.js          # Chart.js color tokens (CHART_COLORS — incl. statusPending/statusProgress/statusResolved/statusRejected), the category-donut identity palette (CHART_CATEGORY_COLORS/getCategoryColor), and the heatmap's sequential ramp (HEATMAP_LEVEL_COLORS/getHeatmapLevel)
├── contexts/
│   └── AuthContext.jsx        # Context Provider managing auth state & localStorage tokens
├── hooks/
│   └── useAuth.js              # Consumes AuthContext
├── services/
│   └── api.js                  # Axios instance (VITE_API_URL, Auth Interceptors) & getUploadsBaseUrl() helper
├── utils/
│   ├── urgency.js               # calculateUrgency(answers) - derives urgency rating from questionnaire responses
│   └── downloadReceipt.js       # Shared blob-fetch-and-save-as PDF receipt download helper
├── components/
│   ├── NavBar.jsx               # Single shared navbar used by both MainLayout and AdminLayout (see below) — brand, items, actions all passed as props
│   ├── StatusBadge.jsx          # Shared status pill (Pending/In Progress/Resolved/Rejected)
│   ├── StatsCounterCard.jsx     # Shared status radar chart (used on Home & AdminDashboard) — see below, no longer a tile grid
│   ├── StatusTimeline.jsx       # Shared status-history audit log stepper (used on Tracker & ComplaintDetail)
│   ├── TutorialSection.jsx      # Parameterized "how to use the portal" tutorial block (used 3x on Home), each with a supporting screenshot below its steps
│   ├── RegistryFilters.jsx      # Search/filter card for the Public Registry
│   ├── ComplaintCard.jsx        # Registry listing card (used on Registry)
│   ├── ActivityHeatmap.jsx      # GitHub-style contribution heatmap, plain CSS grid (no charting lib) — see below
│   └── Modal.jsx                # Generic modal shell
├── layouts/
│   ├── MainLayout.jsx           # Public NavBar + footer wrapper
│   └── AdminLayout.jsx          # Admin NavBar wrapper (no sidebar — top nav only, same NavBar component as public)
└── pages/
    ├── public/
    │   ├── Home.jsx              # Public Dashboard with Top Statistics Overview & Feature Navigation
    │   ├── Registry.jsx          # Searchable Complaints Registry with filters & PDF receipt download
    │   ├── FileComplaint/        # Multi-step complaint submission form with dynamic questionnaire & OTP
    │   │   ├── index.jsx           # Owns wizard state/handlers; composes the steps & modals below
    │   │   ├── CategoryStep.jsx      # Step 1: category grid + dynamic questionnaire
    │   │   ├── DetailsStep.jsx       # Step 2: location/description/image upload
    │   │   ├── VerifyStep.jsx        # Step 3: contact info + review summary
    │   │   ├── OtpModal.jsx          # Email OTP verification modal
    │   │   └── SuccessModal.jsx      # Post-submission tracking ID modal
    │   └── Tracker.jsx           # Tracking ID search and audit timeline viewer
    ├── citizen/
    │   ├── Login.jsx             # Unified Login view (Admin & Citizen access)
    │   ├── Register.jsx          # Secondary registration view
    │   ├── VerifyOtp.jsx         # OTP verification screen
    │   └── Dashboard.jsx         # Citizen personal complaints list
    └── admin/
        ├── AdminDashboard.jsx     # KPI tiles + 3 Chart.js visualizations (donut, line, ring — see below)
        ├── AdminAction.jsx        # Activity heatmap + responsive search/filter bar + paginated complaints table
        └── ComplaintDetail.jsx    # Status transition form, remarks editor, & audit logs
```

### Key UI Features

1. **Design language — dark monochrome "Swiss Tech" (superseded the earlier light-mode glassmorphism system entirely):** Near-black surfaces (`--gray-950` … `--gray-50` scale), exactly **one accent color** (`--accent #3B82F6`) used everywhere identity/emphasis is needed, sharp/minimal radii (2–6px) on nearly every static component, Geist Sans for UI text and Geist Mono for metadata (tracking IDs, timestamps, counts). No gradients, no Bootstrap, no glassmorphism blur-everywhere aesthetic — full spec in `color_palatte.md` and `Instructions/DESIGN_INSTRUCTION.md`. The one deliberate exception is the navbar (#4 below), which is an explicitly-requested departure into a floating glass pill.

2. **Public Home Dashboard (`Home.jsx`):** Centered stats overview (shared `StatsCounterCard`), feature quick-navigation cards, and 3 tutorial sections (submit / registry / track), all restyled to the dark token system — no more Poppins/light-theme/SVG-asset styling from the earlier era.

3. **Public Complaints Registry (`Registry.jsx`):** Search/filter card (`RegistryFilters`), status/category filters, sort toggle, semantic status badges, monospace tracking IDs, PDF receipt downloads — restyled to the dark system, no remaining Bootstrap grid classes.

4. **Floating pill navbar, shared across both layouts (`components/NavBar.jsx` + `.navbar*` in `components.css`):**
   * One `NavBar` component renders for both `MainLayout` (public) and `AdminLayout` (admin) — brand target, nav items, and the right-side actions cluster (login/logout, portal-switch buttons, session pill) are all passed in as props, so there is a single source of truth for the header instead of two parallel implementations.
   * **Shape/position:** `position: fixed`, centered, inset from the viewport edges, narrower `max-width` than the page's own content width so it reads as a discrete floating element. Fully pill-shaped (`border-radius: 9999px`) when collapsed to a single row; relaxes to a 24px rounded rectangle (via `:has(.navbar-collapse.open)`) when the mobile dropdown is open, since a true pill looks wrong once the box gets tall.
   * **Surface:** translucent blurred background (`rgba(17,17,17,0.45)` + `backdrop-filter: blur(20px) saturate(140%)` — tuned twice, starting more opaque/less blurred before being loosened for more visible page content through it), a visible accent-tinted border, and a layered glow/shadow (`box-shadow`) for depth — the one place in the app that intentionally breaks from flat/no-blur, per explicit request.
   * `position: sticky` was tried first and doesn't actually work in this codebase: `html, body { overflow-x: hidden }` (base.css, pre-existing) turns `body` into a scroll-container ancestor, which is a well-known way to silently break sticky positioning in most browsers (the element just scrolls away like `relative`). Switching to `fixed` sidesteps it entirely; `main.flex-1` carries compensating `padding-top` (in `layout.css`) since the fixed bar no longer occupies flow space.
   * **Responsive/collapsible:** below 860px, links + actions collapse behind a hamburger toggle into a dropdown panel (`.navbar-collapse.open`), auto-closing on route change; above that, everything sits in one row with generous, deliberately-spaced gaps between brand / links / actions.
   * A second real bug was found and fixed here: the pill↔rounded-rectangle radius change was originally CSS-transitioned, but the dropdown's height change itself is an instant `display:none`↔`flex` toggle with no transition — so for several frames a still-huge (mid-interpolation, e.g. thousands of px) radius landed on the already-tall expanded box. Browsers clamp `border-radius` to at most half the box's height, so during that window it rendered as a bulging/warped pill on a tall rectangle instead of clean rounded corners. Fix: removed the `transition: border-radius` entirely so the shape snaps in sync with the equally-instant height change.
5. **Frictionless Submission (`pages/public/FileComplaint/`):** 3-step filing wizard (category+questionnaire → details → verify+OTP) unchanged in flow from earlier, restyled to the dark token system; urgency computed via `calculateUrgency()`.
6. **`StatsCounterCard` — a status Radar chart, not a tile grid anymore** (`components/StatsCounterCard.jsx`, rendered on both `Home.jsx` and `AdminDashboard.jsx`, positioned below the homepage's hero heading/paragraph):
   * Went through an intermediate 4-column-grid-with-a-2-wide-Resolved-tile layout before being replaced entirely by a Chart.js **native `radar` chart type** (`RadarController`/`RadialLinearScale`, registered independently in this file since `Home.jsx` can mount before any admin-only module has registered them globally) — of the four `@bklitui`-referenced chart styles adapted in this project (donut, line, ring, heatmap, radar), this was the only one with a first-class Chart.js equivalent, so no custom canvas/CSS build was needed.
   * **4 axes only — Pending / In Progress / Resolved / Rejected — deliberately excluding Total**, since Total is the sum of the other four and would always be the largest point, dominating the polygon's shape (a real radar-chart anti-pattern). Total is shown as a separate `text-mono-label`/`text-mono` pair above the chart instead.
   * **Per-axis identity color** on each vertex (`POINT_COLORS`: gold/accent-blue/green/red, matching `StatusBadge` elsewhere), while the connecting polygon itself is a single accent-blue outline (`borderColor`) with **no fill** (`backgroundColor: 'transparent'`) — went through an iteration where both fill and border were removed per a literal reading of "remove the greyish background and border," leaving only points, then the border was restored once clarified that only the fill should be gone.
   * Point labels are solid white (`#FFFFFF`, not the usual muted `--text-secondary`), grid/angle lines use `--border`, radial tick numbers are hidden (`ticks.display:false`) with `ticks.count` tuned for wider ring spacing.
   * `.stats-radar-panel` overrides the shared `.panel` background/border to fully transparent for this one instance only (the global `.panel` rule is untouched — every other card in the app keeps its normal surface/border).
   * Two more real bugs found and fixed: (1) the total count wasn't actually centered under its label — the wrapping `<div>` lacked `text-align:center`, so the number sat left-aligned within a box sized by the wider label text; (2) the polygon's true center sat ~7px off from the chart's geometric center because Chart.js's radar layout reserves asymmetric side padding for the longer "In Progress" axis label — measured directly from rendered canvas pixel data (not eyeballed) and compensated with a fixed `transform: translateX(7px)` on `.radar-canvas-wrap`, stable since this label set never changes.
   * **Mobile-specific sizing fix:** on phones, both the page container's and the panel's padding stacked to leave Chart.js very little width to draw in (it scales the diamond to whichever of width/height is smaller — so just enlarging height alone, tried first, only added empty space without growing the visible shape). Fix: at `≤640px`, `.stats-radar-panel` gets a negative `margin-inline` that cancels the container's own padding (pulling just this card edge-to-edge with the viewport) plus a smaller internal padding, genuinely growing the available width (measured 279px → 351px, +26%) rather than padding out empty space.
7. **Admin Dashboard (`/admin/dashboard`) — 3 Chart.js visualizations, none of them plain bar/line charts anymore:**
   * **Category Volume Breakdown:** a `Doughnut` (not a bar chart) with a center label that shows the total by default and swaps to the hovered category's name+count on hover; always-visible legend (swatch/label/count/%) since the slice palette (`CHART_CATEGORY_COLORS`) is intentionally restrained/monochrome-plus-accent, so color alone isn't a reliable identity signal.
   * **Complaint Inflow & Resolution Timeline Trend:** a `Line` chart with a custom crosshair plugin, `interaction: {mode:'index', intersect:false}` (hovering anywhere reveals all 3 series at that date), and hover-reveal-only point markers.
   * **Calculated Priority & Urgency Impact Breakdown:** three concentric `Doughnut` rings (not a bar chart) — High/Medium/Standard urgency as nested progress rings, each ring's sweep = that level's share of total complaints, center label swaps to the hovered ring's name+count, legend rows include a per-item progress bar.
   * All three chart `data`/`options` objects are wrapped in `useMemo` — a real bug was found and fixed where hover-driven re-renders handed Chart.js new object references every time, causing it to replay its full entrance animation mid-hover (rings/lines flashing blank while being hovered).
8. **Admin Action Panel (`/admin/action`):**
   * **Complaint Activity heatmap** (new): a GitHub-style contribution calendar (`ActivityHeatmap.jsx`) rendered above the "Administrative Action Panel" heading, showing daily filed+resolved activity for the last 365 days. Built as a plain CSS grid (no charting library — Chart.js has no matrix/heatmap chart type, and this app has no Tailwind/visx to use a registry-style heatmap component either), fed by `GET /api/admin/activity-heatmap` (see §5.3). Includes month labels, a hover tooltip (count/date/filed-resolved breakdown), and a "Less→More" legend using a sequential single-hue ramp derived from the one accent color (`HEATMAP_LEVEL_COLORS`).
   * **Responsive search/filter bar** (`.filter-bar`): a flexible `2fr 1fr 1fr auto` row on desktop (search grows, Reset sizes to its own content) that collapses to a 2-column tablet layout at ≤900px and a single stacked column at ≤520px — replaced the old blanket `grid-12`/`col-span-*` utility (which only had one all-or-nothing 768px breakpoint) with a layout tuned specifically for these 4 fields.
   * Paginated complaints table with citizen contact details, unchanged in behavior from earlier.
9. **Detail Inspection (`/admin/complaints/:id`):** Interactive status update form enforcing allowed transitions and mandatory remarks; no manual public-visibility toggle exists.
10. **Homepage tutorial screenshots (`Home.jsx` + `TutorialSection.jsx`):** each of the 3 tutorial cards now renders a supporting product screenshot below its numbered steps (`/TutorialComplaint.png`, `/TutorialRegistry.png`, `/TutorialTrack.png` in `frontend/public/`) via a new optional `image` prop, fluid `width:100%; height:auto` so it scales smoothly at any viewport with no fixed breakpoints. One of the three source files had an accidental leading space in its actual filename (`" TutorialComplaint.png"`) that was renamed before wiring it up, since a literal-space filename is a fragile thing to reference in a URL.
11. **Homepage vertical rhythm tightened** (`Home.jsx`, `TutorialSection.jsx`, `.tutorial-image-wrap` in `components.css`): hero bottom padding, the feature-card grid's top/bottom margins, the "How to Use" heading margin, each `TutorialSection`'s header/step gaps, and the image wrapper's top spacing were all reduced a step or two down the `--space-*` scale — several rounds of "a bit more" — for a less padded-out first screen.

---

## 7. Design System & UI Specifications

The interface is a **dark monochrome, one-accent-color "Swiss Tech" system** (full spec in `/color_palatte.md`, governing rules in `Instructions/DESIGN_INSTRUCTION.md`) — restrained, flat, sharp-radii, no gradients, no glassmorphism. The one deliberate departure is the navbar, an explicitly-requested floating glass pill (§6).

| Visual Token | Hex / RGBA Code | Applied Component / Context |
| :--- | :--- | :--- |
| **Page Background** | `#0A0A0A` (Gray 950) | Base surface everywhere |
| **Surface / Raised Surface** | `#111111` / `#161616` (Gray 900 / 850) | Cards, panels, tables / modal panels |
| **Border (default / strong)** | `#1F1F1F` / `#272727` (Gray 800 / 750) | Card & input borders |
| **Text (primary / secondary / muted)** | `#FAFAFA` / `#ADADAD` / `#6E6E6E` (Gray 50 / 300 / 500) | Headings / body / placeholders |
| **The one accent color** | `#3B82F6` (hover `#60A5FA`) | Primary buttons, active nav, links, focus rings, "In Progress" status, the one chart accent series |
| **Status: Pending** | `#C9A227` (icon/border/text only, never a filled bg) | Badges & metrics |
| **Status: In Progress** | `#3B82F6` (= accent) | Badges & metrics |
| **Status: Resolved** | `#22C55E` | Badges & metrics |
| **Status: Rejected** | `#EF5A5A` | Badges & metrics |
| **Category donut identity palette** | 6-step: accent → gray-100 → gray-500 → accent-hover → gray-300 → gray-400 | `CHART_CATEGORY_COLORS` in `chartTheme.js` — deliberately restrained, so every consumer must pair it with an always-visible label (never color alone) |
| **Heatmap sequential ramp** | `#1F1F1F` (empty) → `#213659` → `#2A5191` → `#336AC5` → `#3B82F6` (max) | `HEATMAP_LEVEL_COLORS` — one hue, monotone lightness, derived from the accent + `--surface-raised`, not an imported palette |
| **Status radar identity colors** | gold / accent-blue / green / red (same 4 hex values as the status rows above) | `POINT_COLORS` in `StatsCounterCard.jsx` — reuses the existing status tokens per-vertex rather than a new palette; polygon line/fill stays a single accent tone |
| **Navbar (exception to "no blur")** | `rgba(17,17,17,0.45)` + `backdrop-filter: blur(20px)` + accent-tinted glow border | Floating fixed pill — see §6. Loosened from an initial `rgba(...,0.72)` + `blur(16px)` for more visible page content through it |
| **Radii** | 2px / 4px / 6px (`--radius-sm/md/lg`) | Sharp/minimal everywhere *except* the navbar, which is intentionally pill-shaped (9999px collapsed / 24px expanded) |
| **Fonts** | Geist Sans (UI) / Geist Mono (metadata) | Self-hosted via the `geist` npm package, no CDN |

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

### 8.3 Dummy Complaint Data (`backend/scripts/seedComplaints.js`)
For populating the status radar, category donut, urgency ring, activity heatmap, and public
registry with realistic data during development/demos:
```bash
cd backend
npm run seed:complaints                        # 60 complaints over the last 365 days
node scripts/seedComplaints.js --count=100 --days=180
node scripts/seedComplaints.js --fresh          # wipe previously seeded data, then re-seed
```
* Writes directly through the Mongoose models (bypasses OTP verification, file upload, and
  admin transition rules) so it can construct backdated, terminal-status records the HTTP
  API alone couldn't produce. Requires an admin user to already exist (`node seedAdmin.js`).
* Seeded citizens use an `@example.com` email marker, so `--fresh` only deletes what this
  script created — real complaints/users are never touched.
* Seeded complaints always carry `images: []` — no files are written to `backend/uploads/`.

---

## 9. Current Operational State & Verification Checklist

| Module / Feature | Status | Verification Detail |
| :--- | :--- | :--- |
| **Backend Express Server** | ✅ Fully Functional | Health check at `/health`, error middleware, CORS enabled |
| **MongoDB Mongoose Models** | ✅ Fully Functional | Indexes applied (incl. new `createdAt` index), TTL on OTPs, sub-documents for audit trail |
| **On-the-fly OTP Flow** | ✅ Fully Functional | Transient OTP creation, email delivery with console fallback |
| **Dynamic Category Questionnaire**| ✅ Fully Functional | Dynamic Yes/No questionnaire & calculated urgency badges per category |
| **Multi-Step Submission Wizard**| ✅ Fully Functional | 3-step filing wizard on `/file-complaint` with preview & OTP modal |
| **Floating pill navbar** | ✅ Fully Functional | Fixed position, centered inset pill, accent glow border, `rgba(17,17,17,0.45)` + `blur(20px)` background (page content clearly visible through it), verified in-browser: stays visible while scrolling, correctly relaxes radius when the mobile dropdown is open with no border glitch (transition removed — see §6) |
| **Collapsible/responsive navbar** | ✅ Fully Functional | Hamburger toggle below 860px, auto-closes on route change, verified on both `MainLayout` and `AdminLayout` (shared `NavBar.jsx`) |
| **Dark monochrome "Swiss Tech" design system** | ✅ Fully Functional | `tokens.css`/`base.css`/`layout.css`/`components.css`, no Bootstrap, no glassmorphism, one accent color throughout |
| **Admin dashboard charts (donut / crosshair line / ring)** | ✅ Fully Functional | Chart.js `Doughnut`/`Line` with custom crosshair plugin; hover-flicker bug (stale object identity replaying entrance animation) found and fixed via `useMemo` |
| **Status radar chart (`StatsCounterCard`)** | ✅ Fully Functional | Chart.js native `radar` type on Home + AdminDashboard; 4 axes (Total excluded, shown as a separate label), per-status point colors, outline-only polygon, verified: label/number centering, chart-vs-text center alignment (~7px Chart.js label-padding asymmetry, measured and compensated), and mobile width (279px→351px after the edge-to-edge fix) |
| **Admin activity heatmap** | ✅ Fully Functional | `GET /api/admin/activity-heatmap`, 365 cells rendered, hover tooltip verified (a real clipping bug from `overflow-x:auto` implicitly computing `overflow-y:auto` was found and fixed), centered layout, horizontal scroll on narrow viewports |
| **Responsive admin filter bar** | ✅ Fully Functional | `.filter-bar` — verified at desktop / ≤900px / ≤520px tiers |
| **Homepage tutorial screenshots** | ✅ Fully Functional | 3 images wired to their matching tutorial card, fluid scaling verified at desktop and ≤375px; one source file's accidental leading-space filename was fixed before use |
| **Dedicated Public Registry Page**| ✅ Fully Functional | `/registry` page with location regex search, category & status filters |
| **Complaint Submission** | ✅ Fully Functional | Multer multi-file upload, tracking ID generation (`COMP-XXXXX-X`) |
| **State Machine Constraints** | ✅ Fully Functional | Enforces `Pending` -> `In Progress` -> `Resolved`/`Rejected` flow |
| **PDF Receipt Engine** | ✅ Fully Functional | PDFKit streaming and email attachment upon ticket resolution |
| **Public Transparency Portal**| ✅ Fully Functional | Redacts PII (`citizenId`), search by location, category, status; registry query filters strictly on `isPublic: true` |
| **Admin Console & Auth** | ✅ Fully Functional | JWT bearer auth, protected routes, stats breakdown |
| **Shared Component Library** | ✅ Fully Functional | `NavBar`, `StatusBadge`, `StatsCounterCard`, `StatusTimeline`, `TutorialSection`, `RegistryFilters`, `ComplaintCard`, `ActivityHeatmap` (`frontend/src/components/`) — one navbar implementation for both public and admin layouts, eliminating what used to be two parallel headers |
| **Backend Migration Scripts** | ✅ Fully Functional | One-off, manually-run scripts (`backend/scripts/backfillUrgencyLevels.js`, `backend/scripts/backfillIsPublic.js`) backfill legacy records without running on every request |
| **Known issue (not yet fixed)** | ⚠️ Latent bug | `GET /api/admin/stats`'s `timelineTrend` aggregation has no date filter and a flat `$limit: 14`, so it returns the earliest 14 days with data rather than the last 14 — out of scope for recent work, still present |


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
