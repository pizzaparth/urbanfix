# Seed Dummy Complaint Data — Implementation Plan

> Written for a Sonnet 5 implementation pass. Everything needed is below; no further exploration should be required.

## Context

The local `complaint_system` database currently holds only **3 complaints** (2 In Progress, 1 Resolved) and 4 users. Almost every data-driven surface on the site therefore looks broken or empty:

- **Home** (`StatsCounterCard` radar) — three of four status spokes read 0.
- **Registry** — three cards, no meaningful category/status/location filtering.
- **Admin Dashboard** — category donut has 3 slices (one of them the legacy `Sanitation` category that isn't even in the filter dropdown), urgency ring is nearly empty, timeline trend falls back to hardcoded placeholder arrays.
- **Admin Action Panel** — the 365-day activity heatmap is blank.

The goal is a repeatable seed script that injects ~60 realistic complaints spread over the last 12 months so all of the above render with real data. **No photo uploads** — seeded complaints carry `images: []` and write nothing to `backend/uploads/`.

### Finding on "mandatory fields"

Photo upload is **already optional** and needs no change:
- `frontend/src/pages/public/FileComplaint/DetailsStep.jsx:79` — labelled "Supporting Photographs (Max 3)", no `*`, no `required`.
- `frontend/src/pages/public/FileComplaint/index.jsx:106` — step-2 validation only checks title/location/description.
- `backend/models/Complaint.js:58` — `images` has no `required`, only a max-3 validator.

The field that actually blocks programmatic injection is the **email OTP** (`complaintController.submitComplaint` lines 52-63), plus the multipart upload middleware, the zod validator, the status-transition rules in `adminController.updateComplaintStatus`, and nodemailer dispatch. All of these are skipped by writing straight to MongoDB through the Mongoose models rather than going through the HTTP API. **No production code is modified.**

---

## Step 1 — Create `backend/scripts/seedComplaints.js`

Follow the existing script pattern exactly (`backend/scripts/backfillIsPublic.js`, `backfillUrgencyLevels.js`): ESM, `dotenv.config()`, `connectDB()` from `../config/db.js`, log a summary, `await mongoose.connection.close()`, top-level `.catch` with `process.exit(1)`. Add a header comment noting it is run manually and is dev-only.

### CLI flags

| Flag | Default | Behaviour |
|---|---|---|
| `--count=N` | `60` | Number of complaints to generate |
| `--days=N` | `365` | Spread `createdAt` over the last N days |
| `--fresh` | off | Delete previously seeded complaints + seed users first, then re-seed |

Parse from `process.argv` — no new dependency.

### Seed citizens

Create/reuse **8 dummy citizens** with `@example.com` emails (e.g. `aarav.sharma@example.com`). This domain is the seed marker — it needs no schema change and guarantees the 3 real complaints and the real admin are never touched.

- Use `User.findOne({ email })` then `User.create({ ... })` so the `pre('save')` bcrypt hook in `models/User.js:44` runs. Fields: `name`, `email`, `phone` (10-digit), `password` (any ≥8 chars), `role: 'citizen'`, `isVerified: true`.
- Resolve the admin once via `User.findOne({ role: 'admin' })` — required for `statusHistory.changedBy` on admin transitions. If missing, abort with a message telling the user to run `node seedAdmin.js` first.

### Complaint generation

Reuse `generateTrackingId` from `backend/utils/trackingIdGenerator.js` as the format reference, but write a local variant that derives the date part from the complaint's own `createdAt` instead of `new Date()`, so the ID reads `COMP-<filingDate>-<5 chars>`. Track generated IDs in a `Set` and check against existing DB IDs to guarantee uniqueness (`trackingId` is a unique index).

Per complaint:

| Field | Value |
|---|---|
| `category` | Drawn from `CATEGORIES` in `frontend/src/constants/categories.js` — **hardcode the same six strings** in the script (`Road Damage`, `Water Leakage`, `Garbage`, `Street Light`, `Administrative`, `Other`); do not import across the frontend/backend boundary. Weight Road Damage/Garbage higher so the donut isn't flat. |
| `title` | Category-specific pool, 5–100 chars (e.g. "Deep pothole near Ward 7 bus stop"). |
| `location` | Ward/landmark strings that exercise the registry's case-insensitive regex search (`publicController.js:41`), e.g. `Ward 4, Main Market Road (Opposite City Hospital)`. Reuse ~10 locations across the set so location search returns multiple hits. |
| `description` | **Must match the exact shape the real form produces** (`FileComplaint/index.jsx:176-181`): `[CATEGORY QUESTIONNAIRE RESPONSES]\n• <question>: Yes/No\n...\n\n[CITIZEN DESCRIPTION]\n<free text>`. Hardcode the per-category question lists from `frontend/src/constants/categories.js` (`CATEGORY_QUESTIONNAIRES`). Free text ≥15 chars. |
| `urgencyLevel` | **Derived from the generated Yes-count**, mirroring `frontend/src/utils/urgency.js`: ≥3 Yes → `High Urgency`, ≥1 → `Medium Urgency`, else `Standard Urgency`. Generating urgency independently of the answers would make the tracker page self-contradictory. |
| `images` | `[]` — always. |
| `isPublic` | `true` (matches `complaintController.js:117`). |
| `citizenId` | Random seed citizen. |
| `createdAt` | Random timestamp within the last `--days`, biased toward recent months. |

### Status mix and `statusHistory`

Target roughly **Pending 30% / In Progress 25% / Resolved 35% / Rejected 10%**, so every radar spoke, donut segment, and registry status filter has data.

Build a coherent chain — the first entry always mirrors the real filing entry (`complaintController.js:118-124`):

```
Pending      → [Pending @ createdAt, changedBy: citizenId,
                remarks: 'Complaint filed successfully after email verification.']
In Progress  → + [In Progress @ createdAt + 1–7d, changedBy: admin._id]
Resolved     → + [In Progress @ +1–7d] + [Resolved @ +3–21d]   (both changedBy: admin._id)
Rejected     → + [Rejected @ createdAt + 2–10d, changedBy: admin._id]
```

Rules:
- Every `changedAt` must be ≤ now and strictly increasing within a complaint. The heatmap's resolved counts come from `statusHistory.changedAt` (`utils/statsHelpers.js:57-71`), not `updatedAt`.
- `remarks` on each transition: short, plausible municipal text ("Field inspection team assigned to ward.", "Repair completed and verified on site.", "Insufficient location detail to dispatch a team.").
- Set the **top-level `remarks`** to the latest transition's remark for non-Pending complaints — `adminController.js:148` does this, and `pdfService.js:100` prints it on the resolution receipt.
- Never route through `updateComplaintStatus`: it enforces Pending→In Progress→Resolved ordering *and* sends email/generates a PDF per call.

### Writing the documents

**Critical:** insert with timestamps disabled or Mongoose overwrites the backdated `createdAt`:

```js
await Complaint.insertMany(docs, { timestamps: false });
```

Set `updatedAt` explicitly on each doc to the last `changedAt` (or `createdAt` for Pending). Chunk inserts (e.g. 25 at a time) and log progress.

### `--fresh` cleanup

1. `const seedUsers = await User.find({ email: /@example\.com$/i, role: 'citizen' })`
2. `await Complaint.deleteMany({ citizenId: { $in: seedUserIds } })`
3. `await User.deleteMany({ _id: { $in: seedUserIds } })`
4. Log the deleted counts.

Guard hard: never `deleteMany({})`, never match `role: 'admin'`, never touch complaints whose `citizenId` is outside the seed set.

## Step 2 — Add an npm script

In `backend/package.json`, alongside `start` / `dev`:

```json
"seed:complaints": "node scripts/seedComplaints.js"
```

## Step 3 — Document it

Append a short subsection to `status.md` under **§8 Environment Configuration & Seed Credentials** (the existing seeding section, ~line 288) covering the command, the flags, the `@example.com` marker convention, and that seeded complaints carry no images.

---

## Known quirks to flag (do NOT fix — out of scope)

1. `adminController.getAdminStats` builds `timelineTrend` with `{ $sort: { _id: 1 } }` then `{ $limit: 14 }` (lines 50-51) — that returns the **14 oldest** days, not the most recent 14. With data spread over a year, the dashboard trend chart will show days from ~12 months ago. Mention this to the user after seeding; the fix is `$sort: { _id: -1 }, $limit: 14` plus a re-sort, but it is a behaviour change outside this task.
2. One pre-existing complaint uses category `Sanitation`, which is not in `CATEGORIES`, so it can't be reached from the registry dropdown. Seed data will not add to this; leave the legacy record alone.
3. `adminController.js:165` assigns `complaint.pdfReceiptUrl`, a field absent from the schema — strict mode silently drops it. Unrelated to seeding.

---

## Verification

Run from `backend/`:

```bash
node scripts/seedComplaints.js --fresh --count=60 --days=365
```

1. **DB sanity** —
   ```bash
   mongosh "mongodb://localhost:27017/complaint_system" --quiet --eval '
     JSON.stringify({
       total: db.complaints.countDocuments(),
       byStatus: db.complaints.aggregate([{$group:{_id:"$status",c:{$sum:1}}}]).toArray(),
       byUrgency: db.complaints.aggregate([{$group:{_id:"$urgencyLevel",c:{$sum:1}}}]).toArray(),
       withImages: db.complaints.countDocuments({"images.0":{$exists:true}}),
       oldest: db.complaints.find({}).sort({createdAt:1}).limit(1).toArray()[0].createdAt
     })'
   ```
   Expect ~63 total, all four statuses and all three urgency levels non-zero, `withImages` unchanged from before seeding (seeded docs add none), `oldest` ≈ 12 months back.
2. **Idempotency** — re-run with `--fresh`; total returns to the same number, and the 3 original complaints survive (`db.complaints.countDocuments({ citizenId: { $nin: seedUserIds } })` stays at 3).
3. **App** — `npm run dev` in `backend/`, `npm run dev` in `frontend/`, then check:
   - `/` — radar shows non-zero Pending / In Progress / Resolved / Rejected.
   - `/registry` — record count reflects the full seeded set; category dropdown, status dropdown, and a location search like `Ward 4` each narrow results.
   - `/track?id=<a seeded Resolved trackingId>` — timeline renders the full Pending → In Progress → Resolved chain with remarks; no image gallery appears; "Download PDF Receipt" produces a valid PDF.
   - `/admin` (login `admin@complaintsystem.gov` / `admin_password_123`) — category donut shows all six categories, urgency ring shows all three levels.
   - Admin action panel — the 365-day heatmap is populated with both filed and resolved density.
4. Confirm `backend/uploads/` still contains exactly the 4 pre-existing files.
