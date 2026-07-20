# UI & UX Guidelines, Design Rules, and Explicit Instructions

**Project:** Smart Digital Complaint Management and Public Transparency System (UrbanFix Portal)  
**Document Purpose:** Defines mandatory UI/UX design standards, layout rules, typography guidelines, and explicit Do's and Don'ts for the entire project interface.

---

## 1. Core Color System & Palette Rules

### Mandatory Color Directives
* **Dont use gradient**
* **Always use solid colors**

### Defined Color Tokens (`color_palatte.md`)

| Color Token | Hex Code | Role & Applied UI Context |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563EB` | Primary buttons, active navigation indicators, key icons |
| **Primary Hover** | `#1D4ED8` | Hover state for primary interactive elements |
| **Primary Light** | `#DBEAFE` | Soft badge backgrounds, icon containers, subtle highlights |
| **Success Green** | `#10B981` / `#22C55E` | Secondary success CTA buttons, resolved status badges |
| **Success Hover** | `#059669` | Hover state for success actions |
| **Success Light** | `#DCFCE7` | Resolution alerts, verified OTP pills |
| **Warning Amber** | `#F59E0B` | Pending status badges, warning callouts |
| **Warning Light** | `#FEF3C7` | Pending alert backgrounds |
| **Danger / Error Red** | `#EF4444` | Danger buttons, rejected status badges, error alerts |
| **Danger Light** | `#FEE2E2` | Error alert backgrounds, rejected badges |
| **Dark Navy** | `#0F172A` | Navbar background, main dark headings |
| **Surface Secondary** | `#F1F5F9` | Secondary cards, table headers |
| **Page Background** | `#F8FAFC` | Whole portal viewport background |
| **Surface Card** | `#FFFFFF` | Cards, forms, modals, search containers |
| **Border Light** | `#E2E8F0` | Dividers, card borders, input borders |
| **Border Medium** | `#CBD5E1` | Input focus borders, card hover outlines |

---

## 2. Explicit UI/UX Do's and Don'ts

### Color & Styling

| DO | DONT |
| :--- | :--- |
| ✅ **Always use solid colors** for backgrounds, buttons, and badges. | ❌ **Dont use gradient** backgrounds, linear color fades, or radial fills anywhere in the interface. |
| ✅ Use flat, clean background cards (`#FFFFFF`) with subtle solid borders (`#E2E8F0`). | ❌ Don't use heavy drop-shadows or multi-colored glow effects. |
| ✅ Maintain high contrast ratios for text (`#1E293B` or `#0F172A` on `#FFFFFF` / `#F8FAFC`). | ❌ Don't use light gray text (`#94A3B8` / `text-secondary`) for body paragraphs or card text. |
| ✅ Use semantic badge background colors (`#DBEAFE`, `#FEF3C7`, `#DCFCE7`, `#FEE2E2`). | ❌ Don't mix random hex values outside the defined color palette. |

---

### Typography & Hierarchy

| DO | DONT |
| :--- | :--- |
| ✅ Use **Poppins** (`fontFamily: 'Poppins, sans-serif'`) for all main titles and section headings (`H1`–`H4`). | ❌ Don't use default browser serif or generic fonts for section headers. |
| ✅ Use **Inter** for body paragraphs, input fields, labels, and table content. | ❌ Don't use small, low-contrast text for critical user instructions or wizard steps. |
| ✅ Render section headers in solid dark navy (`#0F172A`) or solid black (`#000000`). | ❌ Don't use light muted gray text for long paragraphs or hero text. |
| ✅ Keep text alignment clean (left-aligned for forms/guides, centered for heroes/counters). | ❌ Don't overcrowd text lines without adequate line-height (`1.5` to `1.6`). |

---

### Layout & Responsiveness

| DO | DONT |
| :--- | :--- |
| ✅ Ensure statistics and cards stack vertically (`col-12 col-md`) on mobile viewports (`<768px`). | ❌ Don't force multi-column horizontal cards on small mobile screens. |
| ✅ Maintain sticky frosted-glass navigation (`sticky-top`) with dark background (`rgba(15, 23, 42, 0.95)`). | ❌ Don't block screen content with static non-responsive headers. |
| ✅ Use responsive Bootstrap containers (`container`) with proper padding (`py-4`, `px-3`). | ❌ Don't hardcode fixed pixel widths on container elements. |

---

### Component Design & Micro-Interactions

| DO | DONT |
| :--- | :--- |
| ✅ Provide clear hover states (`:hover`, `:focus`) on buttons and interactive cards. | ❌ Don't leave interactive buttons without hover feedback or active state indicators. |
| ✅ Use clear, high-visibility Call-To-Action (CTA) buttons with explicit labels and rounded pills (`border-radius: 8px` / `rounded-pill`). | ❌ Don't rely solely on plain unstyled text links for critical user actions like filing a complaint. |
| ✅ Include step indicators (1, 2, 3) for multi-step workflows like `/file-complaint`. | ❌ Don't present long single-page form scrolling without logical step separation. |
| ✅ Provide touch-friendly tap targets (minimum 44px height) for mobile navigation items. | ❌ Don't place tiny text links closely together on touch interfaces. |

---

## 3. Page-Specific Design Guidelines

### 3.1 Homepage (`Home.jsx`)
* Top statistics metrics must be centered horizontally and vertically, with title stacked directly on top of the number.
* Statistics titles must use solid black (`#000000`) Poppins font.
* On mobile screens (`<768px`), statistics must stack vertically one below another (`col-12 col-md`).
* Main feature cards must link directly to primary public destinations (`/registry`, `/file-complaint`, `/track`).
* User guides and tutorials must be presented below feature cards in 3 full-width vertical sections (*Submit Complaint*, *Public Registry*, *Track Complaint*) using vertical step layouts and uniform hover buttons.

### 3.2 Complaint Filing Portal (`FileComplaint.jsx`)
* Follow a 3-step filing wizard:
  * **Step 1:** Category selection & dynamic Yes/No context questions + real-time urgency badge calculation.
  * **Step 2:** Location, detailed text description & drag-and-drop photo attachments.
  * **Step 3:** Contact details & email OTP verification modal.
* Provide copyable Tracking ID upon successful registration.

### 3.3 Public Complaints Registry (`Registry.jsx`)
* Display all public complaints with citizen PII (Name, Email, Phone) strictly redacted.
* Provide real-time location search with inline clear (`✕`), category & status dropdowns with input icons, removable active filter chips, 1-click Reset All button, and dynamic sorting (Newest/Oldest).
* Include direct download action buttons for PDF resolution receipts on `Resolved` complaints.
