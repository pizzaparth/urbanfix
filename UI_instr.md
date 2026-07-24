# UI & UX Guidelines, Design Rules, and Explicit Instructions

**Project:** Smart Digital Complaint Management and Public Transparency System (UrbanFix Portal)
**Document Purpose:** Defines mandatory UI/UX design standards, layout rules, typography guidelines, and explicit Do's and Don'ts for the entire project interface.

**Design language:** Swiss Tech / Vercel + Linear inspired — dark monochrome interface, editorial
typography, a structural 12-column grid, ultra-minimal flat components, Geist typography, Geist
Mono metadata, Lucide icons, technical-dashboard tone, subtle borders, industrial precision,
generous whitespace. See `Instructions/DESIGN_INSTRUCTION.md` for the full governing rule set —
this document restates it with UrbanFix's specific token names.

---

## 1. Core Color System & Palette Rules

### Mandatory Color Directives
* **Restrained dark monochrome foundation with exactly one accent color** (`#3B82F6`)
* **Don't use gradients** as a primary visual element
* **Don't use glassmorphism, glow, or blur effects**
* Status/priority meaning is communicated through color used sparingly (icon/border/text
  only) — never as a filled pastel chip background

### Defined Color Tokens (`color_palatte.md`)

| Color Token | Hex Code | Role & Applied UI Context |
| :--- | :--- | :--- |
| **Page Background** | `#0A0A0A` | Whole portal viewport background |
| **Surface** | `#111111` | Cards, panels, table backgrounds |
| **Raised Surface** | `#161616` | Modal panels |
| **Border** | `#1F1F1F` | Default dividers, card borders, input borders |
| **Border Strong** | `#272727` | Hover/emphasis borders, button borders |
| **Accent** | `#3B82F6` | Primary buttons, active nav, links, focus rings, "in progress" status |
| **Accent Hover** | `#60A5FA` | Hover state for accent elements |
| **Accent Wash** | `rgba(59,130,246,0.12)` | Active nav background, focus ring |
| **Text Primary** | `#FAFAFA` | Headings |
| **Text Body** | `#E4E4E4` | Primary body text |
| **Text Secondary** | `#8C8C8C` | Secondary text, chart ticks |
| **Text Muted** | `#6E6E6E` | Placeholder / de-emphasized text |
| **Status — Pending** | `#C9A227` | Icon/border/text on pending status pills |
| **Status — In Progress** | `#3B82F6` (accent) | Icon/border/text on in-progress status pills |
| **Status — Resolved** | `#22C55E` | Icon/border/text on resolved status pills |
| **Status — Rejected** | `#EF5A5A` | Icon/border/text on rejected status pills |

---

## 2. Explicit UI/UX Do's and Don'ts

### Color & Styling

| DO | DONT |
| :--- | :--- |
| ✅ Use the dark monochrome scale for all surfaces/backgrounds/borders. | ❌ Don't use gradient backgrounds, linear color fades, or radial fills anywhere. |
| ✅ Use flat surfaces (`#111111`) with 1px solid borders (`#1F1F1F`). | ❌ Don't use drop shadows, glow effects, or `backdrop-filter`/blur. |
| ✅ Maintain high contrast text (`#FAFAFA`/`#E4E4E4` on `#0A0A0A`/`#111111`). | ❌ Don't introduce a second accent color — exactly one accent (`#3B82F6`) exists. |
| ✅ Use status tokens as icon/border/text color only. | ❌ Don't fill a status pill or card with a solid pastel background. |

---

### Typography & Hierarchy

| DO | DONT |
| :--- | :--- |
| ✅ Use **Geist Sans** for all headings, body text, labels, and buttons. | ❌ Don't mix in a second UI typeface — Geist Sans covers both headings and body via size/weight. |
| ✅ Use **Geist Mono** for metadata only: tracking IDs, timestamps, counts, status text. | ❌ Don't use Geist Mono for headings, body copy, or button labels. |
| ✅ Pair large editorial headings with small supporting text. | ❌ Don't make every heading the same size, or use oversized body text. |
| ✅ Keep line-height comfortable (1.5–1.6) for paragraph text. | ❌ Don't overcrowd text lines without adequate line-height. |

---

### Layout & Responsiveness

| DO | DONT |
| :--- | :--- |
| ✅ Build layouts on the real 12-column CSS Grid (`.grid-12` / `.col-span-*`). | ❌ Don't use ad hoc pixel widths or Bootstrap's `.row`/`.col-*` grid (removed from the project). |
| ✅ Use a sticky, flat, 1px-bordered top navbar (no blur, no fixed-offset hacks). | ❌ Don't use frosted-glass/backdrop-blur navigation. |
| ✅ Use the 4/8px spacing scale (`--space-1` … `--space-9`) consistently. | ❌ Don't hardcode arbitrary padding/margin values. |

---

### Component Design & Micro-Interactions

| DO | DONT |
| :--- | :--- |
| ✅ Limit buttons to four styles: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`. | ❌ Don't invent a new button style per page, or use `rounded-pill` buttons. |
| ✅ Keep exactly one `.btn-primary` visible per screen. | ❌ Don't use multiple primary buttons in one viewport. |
| ✅ Use the shared `Modal` component (focus trap, Escape-to-close, backdrop click) for all dialogs. | ❌ Don't reintroduce Bootstrap's modal JS or `data-bs-toggle` attributes. |
| ✅ Use Lucide icons only, one consistent stroke weight (`ICON_STROKE = 1.75`). | ❌ Don't mix icon libraries (no `bootstrap-icons`, no raw `<img>` icon files). |

---

## 3. Page-Specific Design Guidelines

### 3.1 Homepage (`Home.jsx`)
* Top statistics strip is a flat metadata row (Geist Mono numerals) — no glassmorphism, no
  per-tile accent colors.
* Feature cards (Registry / File Complaint / Track) sit on the 12-column grid, one accent
  icon tile each, single `.btn-secondary` CTA.
* Tutorial sections below feature cards use flat numbered steps (no colored circles per
  section — the one-accent rule applies here too).

### 3.2 Complaint Filing Portal (`FileComplaint/`)
* 3-step filing wizard: category + urgency questionnaire → location/description/photos →
  contact + OTP verification, unchanged in flow.
* Urgency and status are communicated via flat `.status-pill` tokens, not filled pastel
  badges.
* OTP and success dialogs use the shared `Modal` component.

### 3.3 Public Complaints Registry (`Registry.jsx`)
* Complaints remain a card-per-item list (not a table) — flattened to the monochrome/thin-
  border style, PII strictly redacted.
* Filters: real-time location search with inline clear, category/status selects, removable
  active-filter tags, 1-click Reset All, dynamic sorting (Newest/Oldest).
* Resolved complaints expose a PDF receipt download action.
