# Smart Digital Complaint Management System
## Complete UI Color Palette (Dark Monochrome / Swiss Tech)

These tokens mirror `frontend/src/styles/tokens.css` exactly — that file is the source of
truth; this document is the human-readable reference. See `Instructions/DESIGN_INSTRUCTION.md`
for the governing design rules this palette follows (restrained monochrome, one accent color,
no gradients, no glassmorphism).

---

# Monochrome Scale

| Token | Hex | Usage |
|-------|------|------|
| Gray 950 | `#0A0A0A` | Page background |
| Gray 900 | `#111111` | Surface — cards, panels, tables |
| Gray 850 | `#161616` | Raised surface — modal panels |
| Gray 800 | `#1F1F1F` | Border (default) |
| Gray 750 | `#272727` | Border (strong / hover) |
| Gray 600 | `#3F3F3F` | Disabled borders |
| Gray 500 | `#6E6E6E` | Muted text, placeholder |
| Gray 400 | `#8C8C8C` | Secondary text, chart ticks |
| Gray 300 | `#ADADAD` | Tertiary / de-emphasized labels |
| Gray 100 | `#E4E4E4` | Primary body text |
| Gray 50 | `#FAFAFA` | Headings, highest-contrast text |

---

# The One Accent Color

| Token | Hex | Usage |
|-------|------|------|
| Accent | `#3B82F6` | Primary buttons, active nav, links, focus rings, "in progress" status, chart accent series |
| Accent Hover | `#60A5FA` | Hover state |
| Accent Wash | `rgba(59,130,246,0.12)` | Active nav background, selected-row tint |
| Accent Border | `rgba(59,130,246,0.4)` | Focus ring border |

No other accent color exists anywhere in the interface — status tokens below are the only
exception, and even those are used as icon/border/text color, never as decoration.

---

# Status Tokens (icon / border / text only — never a filled background)

| Status | Hex |
|--------|------|
| Pending | `#C9A227` |
| In Progress | `#3B82F6` (accent) |
| Resolved | `#22C55E` |
| Rejected | `#EF5A5A` |

---

# Typography

| Token | Value | Usage |
|-------|-------|------|
| Font — Sans | Geist Sans | Headings, body text, labels, buttons, nav |
| Font — Mono | Geist Mono | Metadata only: tracking IDs, timestamps, counts, status text |
| Display | `clamp(2.5rem, 4vw + 1rem, 4.25rem)` | Hero heading |
| H1 | `clamp(1.75rem, 2vw + 1rem, 2.5rem)` | Page titles |
| H2 | `1.5rem` | Section titles |
| H3 | `1.125rem` | Card/panel titles |
| Body | `0.9375rem` | Paragraph text |
| Small | `0.8125rem` | Supporting text, labels |
| Mono (metadata) | `0.8125rem` / `0.75rem` | Tracking IDs, dates, table headers |

Both fonts are self-hosted via the `geist` npm package's raw variable `.woff2` files
(`frontend/public/fonts/geist-sans-variable.woff2`, `geist-mono-variable.woff2`) — no external
font CDN dependency.

---

# Spacing Scale (4px base)

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |
| `--space-9` | 96px |

---

# Radii (sharp / minimal — no pill radius anywhere)

| Token | Value | Usage |
|-------|-------|------|
| `--radius-sm` | 2px | Inputs, small tags, status pills |
| `--radius-md` | 4px | Buttons, cards, icon tiles |
| `--radius-lg` | 6px | Modal panels |

---

# Buttons (exactly four styles, clear hierarchy)

| Style | Background | Text | Border |
|-------|-----------|------|--------|
| Primary | Accent `#3B82F6` | `#0A0A0A` | none |
| Secondary | transparent | `#FAFAFA` | Gray 750 `#272727` |
| Ghost | transparent | Gray 300 `#ADADAD` | none |
| Danger | transparent | `#EF5A5A` | `#EF5A5A` |

Only one `.btn-primary` should be visible per screen.

---

# Inputs

Background: `#111111` (Gray 900)
Border: `#1F1F1F` (Gray 800)
Focus Border: Accent `#3B82F6`
Focus Ring: `rgba(59,130,246,0.12)`
Placeholder: `#6E6E6E` (Gray 500)
Text: `#FAFAFA` (Gray 50)

---

# Cards / Panels

Background: `#111111` (Gray 900)
Border: 1px solid `#1F1F1F` (Gray 800)
Radius: `--radius-md` (4px)
Shadow: none — flat only, per DESIGN_INSTRUCTION

---

# Navigation

Navbar Background: `#0A0A0A` (page background, flat — no blur)
Navbar Border: 1px solid `#1F1F1F`
Active Nav Item: Accent Wash background + `#FAFAFA` text
Nav Link (default): Gray 300 `#ADADAD`

---

# Tables

Header Background: transparent (flat)
Header Text: Geist Mono, uppercase, Gray 500
Row Border: `#1F1F1F`
Row Hover: `#111111` (Gray 900)

---

# Charts

Grid lines: `#1F1F1F` (near-invisible on dark surface)
Axis text: `#8C8C8C` (Gray 400), Geist Mono
Accent series: `#3B82F6`
Neutral series: `#8C8C8C` / `#6E6E6E`
Urgency (3-hue, restrained): High `#EF5A5A` · Medium `#C9A227` · Standard `#3B82F6`

---

# Icons

Library: Lucide (`lucide-react`) exclusively — no other icon library mixed in.
Stroke width: `1.75` everywhere (see `src/constants/icons.js` → `ICON_STROKE`).

---

# Miscellaneous

Selection Background: `rgba(59,130,246,0.12)`
Selection Text: `#FAFAFA`
Link: Accent `#3B82F6`
Link Hover: `#60A5FA`
