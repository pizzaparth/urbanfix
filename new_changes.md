# UrbanFix — Multi-Role Governance Platform

**Status:** implemented in the working tree (nothing committed) — see §13 for what
shipped, where it deviates from this plan, and how to run it.
**Audience:** the engineer (Sonnet 5) implementing this.
**Written:** 2026-09-20

---

## 0. How to read this document

Sections 1–3 are the **product spec** — what we are building and why. Sections
4–9 are the **implementation plan** — data model, API, app structure, phasing.
Section 10 lists **decisions I changed from the original draft**, with reasons.
Section 11 records **decisions that were open questions**, each with its
reasoning, so they can be revisited deliberately rather than rediscovered
halfway through. Nothing in this plan is blocked on an answer.

Work the phases in order. Each phase is independently demoable — that matters,
because this project has a review/exhibition deadline and a half-finished
workflow demos worse than a smaller complete one.

**Read §6.0 before writing a single screen.** The app's look is already settled
and every new screen is assembled from existing primitives and tokens. §6.0 is
the binding rule for that, not a suggestion.

---

## 1. Where the project is today

- One Expo React Native app (`mobile/`), one Express + MongoDB API (`backend/`).
- Two roles exist: `citizen` and `admin` (`models/User.js`, enum on `role`).
- A citizen files a complaint with **no account** — email OTP only — and gets a
  tracking ID. They can browse the public registry and track any complaint.
- An admin logs in, sees dashboards, and moves a complaint through
  `Pending → In Progress → Resolved/Rejected` with mandatory remarks.
- ~53 seeded complaints exist. Charts, the registry and the tracker all read the
  four-value `status` enum.

**The gap:** the admin is a single bottleneck who does everything. Real civic
resolution has a chain of custody — someone triages, someone else physically
fixes it, someone verifies and closes. And the registry is, as you put it, a
data mine: researchers should be able to study it under controlled access.

---

## 2. The three ends

| End | Roles | Auth model |
|---|---|---|
| **Citizen** | Citizen | No account at all — email OTP per complaint |
| **Employee** | Field Employee, Supervisor, Admin | Account provisioned by an Admin |
| **Research** | Researcher | Account issued on approval, time-limited |

Three ends, three login pills. **Admin stays nested under Employee**, as in your
draft — it is the top role of that end, not a separate end. Research is its own
end rather than sitting under Citizen because it is the only end with an
application-and-approval route in, and the only one whose access expires; giving
it its own pill is what makes "Apply for research access" discoverable.

### Permission matrix

| Capability | Citizen | Researcher | Field | Supervisor | Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| File complaint (OTP) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browse public registry | ✅ | ✅ | ✅ | ✅ | ✅ |
| Track by tracking ID | ✅ | ✅ | ✅ | ✅ | ✅ |
| Research dashboards | — | ✅ | — | — | ✅ |
| Export dataset | — | ✅ | — | — | ✅ |
| Accept / reject a complaint | — | — | — | ✅ | ✅ |
| Assign work to field staff | — | — | — | ✅ | ✅ |
| Submit completion proof | — | — | ✅ | — | — |
| Close a complaint | — | — | — | ✅ | ✅ |
| Manage field employees | — | — | — | ✅ | ✅ |
| Create / delete employees | — | — | — | — | ✅ |
| Approve researcher applications | — | — | — | — | ✅ |
| Apply for leave | — | — | ✅ | ✅ | — |
| Approve leave | — | — | — | ✅ | ✅ |

---

## 3. The complaint lifecycle

This is the spine of the whole feature. Today a complaint has one `status` with
four values. The new chain of custody needs more steps than that — **but the
citizen-facing vocabulary must not change**, because the public registry, the
tracker, the charts and 53 seeded records all depend on those four values.

**Decision: two fields, not one.**

- `status` — unchanged 4-value public enum: `Pending | In Progress | Resolved |
  Rejected`. This is what citizens, the registry, the tracker and every chart
  read. **Do not touch the enum.**
- `stage` — new internal enum, employee-facing only, carrying the detail.

```
stage                         derived public status
─────────────────────────────────────────────────────
submitted                  →  Pending
triage_rejected            →  Rejected
accepted                   →  In Progress
assigned                   →  In Progress
work_in_progress           →  In Progress
proof_submitted            →  In Progress
closed                     →  Resolved
```

`status` is computed from `stage` by a single pure helper
(`utils/complaintStage.js`) and persisted alongside it, so existing queries and
aggregations keep working untouched. **Migration is therefore trivial**: a
backfill script sets `stage` from the existing `status` for all 53 records
(`Pending → submitted`, `In Progress → accepted`, `Resolved → closed`,
`Rejected → triage_rejected`). No data loss, no chart rewrites.

### Transition rules (enforce server-side)

| From | To | Who | Requires |
|---|---|---|---|
| `submitted` | `accepted` | Supervisor, Admin | remarks ≥ 10 chars |
| `submitted` | `triage_rejected` | Supervisor, Admin | remarks ≥ 10 chars |
| `accepted` | `assigned` | Supervisor, Admin | a field employee id |
| `assigned` | `work_in_progress` | assigned Field employee | — |
| `work_in_progress` | `proof_submitted` | assigned Field employee | ≥ 1 completion image |
| `proof_submitted` | `closed` | Supervisor, Admin | remarks; triggers receipt email |
| `proof_submitted` | `assigned` | Supervisor, Admin | remarks (rework — proof rejected) |

Every transition appends to the existing `statusHistory[]` array, which already
records `{ status, changedBy, remarks, changedAt }`. Extend that subdocument
with `stage` so the audit trail keeps full fidelity. The tracker screen renders
this array already and will pick up the extra steps for free.

---

## 4. Data model

All in `backend/models/`.

### 4.1 `User.js` — extend

```
role: enum ['citizen','researcher','field','supervisor','admin']   // was ['citizen','admin']
isActive: Boolean (default true)          // soft delete; never hard-delete staff, audit trail references them
createdBy: ObjectId → User                // who provisioned this account
lastLoginAt: Date

// Researcher only
researcher: {
  institute: String,
  title: String,                          // e.g. "PhD candidate, Urban Planning"
  accessGrantedAt: Date,
  accessExpiresAt: Date,                  // hard stop, enforced server-side
  applicationId: ObjectId → ResearchApplication,
}

// Employee only (field + supervisor)
employee: {
  employeeCode: String (unique, sparse),
  ward: String,                           // area of responsibility
  supervisorId: ObjectId → User,          // field employees only
  phone: String,
}

// Invite flow (replaces emailing plaintext passwords — see §10.2)
inviteToken: String (select: false),
inviteTokenExpires: Date,
mustSetPassword: Boolean (default false),
```

Keep the existing `pre('save')` bcrypt hook and `comparePassword` method as-is.

### 4.2 `Complaint.js` — extend

```
stage: enum [...] (default 'submitted', index)
assignedTo: ObjectId → User (field employee, nullable, index)
assignedBy: ObjectId → User (supervisor/admin, nullable)
assignedAt: Date
completionImages: [String]   // proof uploaded by field employee, max 3, same pipeline as `images`
completionNote: String
closedAt: Date
statusHistory[].stage: String   // add to the existing subdocument
```

### 4.2b Ward — make it a real field

Assignment ("which field employee covers this?") and anonymisation ("coarsen
the address to an area") both need a ward. Today it is buried in a free-text
`location`. I checked the live data before deciding:

- **53 of 54** complaints (98%) start with `Ward <n>`, n ∈ 1…10.
- The one that does not is `"DPS Jaipur, Jaipur, Rajasthan"` — and that is the
  genuine citizen-submitted record. The structure in the other 53 comes from
  `scripts/seedComplaints.js`, not from users.

So parsing is reliable enough to migrate history, and not reliable enough to
depend on going forward. Do both:

```
// Complaint.js
ward: { type: String, enum: WARDS, index: true, default: null }   // null = unassigned
```

- `constants/wards.js` (shared shape, duplicated in `mobile/src/constants/`):
  `['Ward 1' … 'Ward 10']`. Ten is what the data already uses.
- **New complaints:** a required picker in the Report wizard's `details` step,
  next to the free-text location. Do not infer it from prose.
- **Existing records:** backfill script parses `/^\s*Ward\s+(\d+)\b/i`; the
  single unmatched row gets `null` and surfaces in an admin "Unassigned ward"
  filter for manual fixing.
- A field employee's `employee.ward` is matched against this for assignment.

### 4.3 `ResearchApplication.js` — new

```
fullName, email (indexed), institute, title,
purpose: String (what they intend to study, min 100 chars),
datasetScope: enum ['aggregate_only','anonymised_records'],
requestedDays: Number (max 180),
status: enum ['pending','approved','rejected'] default 'pending',
reviewedBy: ObjectId → User, reviewedAt: Date, reviewNote: String,
createdUserId: ObjectId → User    // set on approval
timestamps
```

### 4.4 `LeaveRequest.js` — new

```
employeeId → User, fromDate, toDate, reason,
status: enum ['pending','approved','rejected'] default 'pending',
decidedBy → User, decidedAt, decisionNote
```

### 4.5 `AttendanceRecord.js` — new (Phase 5, cuttable)

```
employeeId → User, date (YYYY-MM-DD, indexed),
checkInAt, checkOutAt, status: enum ['present','absent','on_leave']
compound unique index on { employeeId, date }
```

### 4.6 `ResearchAccessLog.js` — new

Doubles as the researcher's own "data viewed / downloaded" stats **and** as the
privacy audit trail. Do not skip this — it is the thing that makes granting
outside access defensible.

```
researcherId → User, action: enum ['view_dashboard','query','export'],
recordCount: Number, filters: Mixed, exportFormat: String,
ipAddress: String, createdAt (indexed)
```

---

## 5. API surface

Existing routes stay where they are. New route files in `backend/routes/`,
controllers in `backend/controllers/`, Zod schemas in `backend/validators/`.

### 5.1 Auth — extend `authRoutes.js`

```
POST  /api/auth/login                  existing; response now carries the richer role
POST  /api/auth/set-password           { inviteToken, password }  → first-login for invited accounts
POST  /api/auth/forgot-password        stretch goal
GET   /api/auth/me                     returns profile + role + accessExpiresAt
```

`middleware/authMiddleware.js` — `protect` must additionally:
1. reject if `user.isActive === false`;
2. reject if `role === 'researcher'` and `accessExpiresAt < now`, with a
   distinct error code (`RESEARCH_ACCESS_EXPIRED`) so the app can show the right
   screen rather than a generic 401;
3. reject if `mustSetPassword === true` for anything except `set-password`.

`restrictTo(...roles)` already exists and needs no change.

### 5.2 Supervisor — `routes/supervisorRoutes.js`, `restrictTo('supervisor','admin')`

```
GET   /api/supervisor/queue                  ?stage=&ward=&search=&page=
PATCH /api/supervisor/complaints/:id/accept  { remarks }
PATCH /api/supervisor/complaints/:id/reject  { remarks }
PATCH /api/supervisor/complaints/:id/assign  { fieldEmployeeId, note }
PATCH /api/supervisor/complaints/:id/close   { remarks }
PATCH /api/supervisor/complaints/:id/rework  { remarks }
GET   /api/supervisor/field-staff            roster + live workload counts
GET   /api/supervisor/stats
GET   /api/supervisor/leave                  pending requests from own staff
PATCH /api/supervisor/leave/:id              { decision, note }
```

### 5.3 Field employee — `routes/fieldRoutes.js`, `restrictTo('field')`

```
GET   /api/field/tasks                       ?state=active|completed
PATCH /api/field/tasks/:id/start
POST  /api/field/tasks/:id/proof             multipart, ≤3 images + completionNote
GET   /api/field/stats
POST  /api/field/leave                       { fromDate, toDate, reason }
GET   /api/field/leave
```

Authorization: every `:id` must be verified to be assigned to
`req.user._id`. Do not rely on the app only showing them their own tasks.

### 5.4 Researcher — `routes/researchRoutes.js`

```
POST  /api/research/apply                    PUBLIC — no auth
GET   /api/research/dashboard                restrictTo('researcher','admin')
GET   /api/research/query                    filtered aggregates
GET   /api/research/export                   CSV/JSON, anonymised, rate-limited
GET   /api/research/me                       profile + days remaining + own usage stats
```

Every one of the four authed routes writes a `ResearchAccessLog` row.

### 5.5 Admin — extend `adminRoutes.js`

```
GET    /api/admin/users                      ?role=&isActive=
POST   /api/admin/users                      create supervisor/field/admin → sends invite
PATCH  /api/admin/users/:id                  edit profile / ward / supervisor
PATCH  /api/admin/users/:id/deactivate       soft delete
GET    /api/admin/research-applications      ?status=
PATCH  /api/admin/research-applications/:id  { decision, days, note } → provisions user + emails
GET    /api/admin/audit/research             the access log
```

---

## 6. Mobile app structure

`mobile/src/navigation/RootNavigator.jsx` currently switches between two tab
sets on `user?.role === 'admin'`. That becomes a five-way switch. Keep the
existing `GlassTabBar` for all of them — it is driven by `state.routes`, so it
adapts to any tab count with no change.

| Role | Tabs |
|---|---|
| Citizen (incl. logged-out) | Home · Registry · Report · Track · Account |
| Researcher | Insights · Registry · Track · Profile |
| Field | My Tasks · Completed · Profile |
| Supervisor | Queue · Field Staff · Track · Profile |
| Admin | People · Stats · Complaints · Profile |

Route the landing tab per role in the existing `justSignedIn` effect in
`RootNavigator` (it already navigates to `Home` / `Dashboard`).

### 6.0 Non-negotiable: build from the existing UI, do not invent

Roughly a dozen new screens are specced below. Every one of them must be
assembled from the components already in `mobile/src/components/`, using the
tokens already in `mobile/src/theme.js`. **A new screen should introduce no new
colours, no new radii, no new font sizes and no new icon library.** If a screen
seems to need something that does not exist, add it to `uikit.jsx` so every
later screen inherits it — do not style it locally.

This is not a stylistic preference. The app was rebuilt to match a reference
design exactly; every drift from these primitives has to be found and undone by
hand later.

#### The source of truth

| Concern | Use this | Never |
|---|---|---|
| Colour | `colors` from `theme.js` (`accent`, `accentInk`, `surface`, `border`, `muted`, `dim`, `faint`, `body`, `placeholder`) | raw hex in a screen |
| Status colour | `statusColors[status]` | a local status→colour map |
| Urgency colour | `urgencyColors` / `chartUrgency` | — |
| Chart colour | `chartPalette` | UI accent colours for data |
| Type | `uf.display` (Space Grotesk), `uf.body` / `uf.bodyBold` (Plus Jakarta) | any other family |
| Radius | `ufRadius` (sm 14 · md 22 · lg 28 · xl 38 · pill) | the legacy `radius` export, which is a *different* scale |
| Icons | `components/Icon.jsx` — `home list plus plusBare search user grid chevronRight chevronLeft check close camera` | `lucide-react-native` in anything new |

`theme.js` still exports a legacy `color` / `radius` / `font` set used by a few
old files. **New code uses `colors` / `ufRadius` / `uf`.** Mixing the two is how
cards ended up rendering 6px under-rounded once already.

#### Primitives that already exist — use them

`uikit.jsx`: `Screen` `PageTitle` `Card` `Tappable` `PrimaryButton`
`GhostButton` `DangerButton` `Field` `FilterPill` `StatusDot` `ErrorNote`
`GrowBar`.

Composites: `ComplaintCard` · `StatusTimeline` · `RingChart` · `Skeleton`
(`SkeletonList` / `SkeletonBlock` / `SkeletonPanel`) · `AuthShell` ·
`GlassTabBar` · `SwipeQuestionCard` · `RefreshBar` · `FormattedDescription`.

Behaviour helpers: `hooks/useAutoRefresh.js` (focus-scoped polling + manual
refresh) · `utils/notify.js` (**always** — `Alert.alert` is a no-op stub on
web) · `utils/haptics.js` (already wired into `PrimaryButton`).

#### Copy these four screen shapes

1. **Scrolling content** → `TrackScreen.jsx`. `Screen` +
   `contentStyle={{ paddingTop: insets.top }}` + `PageTitle` + `Card`.
2. **List** → `RegistryScreen.jsx`. `FlashList`, header in
   `ListHeaderComponent`, rows wrapped in a `cardWrap` with
   `paddingHorizontal: 20`, `SkeletonList` while loading, a single centred
   `s.empty` line when empty, 12pt separators.
3. **Form** → `LoginScreen.jsx` / `RegisterScreen.jsx`. `AuthShell` + `Field`s
   in a 20pt-gap stack + `PrimaryButton` + `ErrorNote`. Validate client-side for
   anything the server enforces, so the user is not told by a 400.
4. **Detail + actions** → `admin/ComplaintDetailScreen.jsx`. Back
   `Tappable` + title + tracking id + `InfoTile` row + `Label` caps
   micro-headings + action grid where illegal actions render dimmed rather than
   disappearing.

#### Layout rules that are easy to miss

- **Every screen applies `insets.top`** via `useSafeAreaInsets()`. The Registry
  shipped without it and its title collided with the status bar — that bug is
  invisible on web, where the inset is 0. Check on a device.
- **Every scrollable ends with `paddingBottom: 130`** to clear the floating tab
  bar. `Screen` already does this; a raw `FlashList` does not.
- The tab bar handles its own bottom inset. Do not add another.

#### Motion policy — settled, do not reopen

- **No `entering` / `exiting` / `layout` animations on screen content or list
  rows.** These were all removed deliberately: bottom tabs mount lazily, so an
  `entering` animation fires on first tab open and reads as the whole page
  sliding in. Modals are the one exception (`FileComplaintScreen`'s OTP sheet
  and success dialog).
- Tabs swap instantly (`animation: 'none'`). Stack pushes slide
  (`slide_from_right`).
- The only persistent motion is the tab pill, on
  `{ damping: 26, stiffness: 420, mass: 0.5 }`. **Reuse that exact spring** for
  the login role selector and anything else that slides, so the app has one
  feel rather than five.
- Animate on the UI thread via Reanimated shared values. Never
  `useNativeDriver: false` on a layout property — the original tab bar did that
  across six simultaneous springs and it visibly stuttered.

#### Anti-patterns, each of which has already happened here

- Rendering mock/placeholder numbers as a fallback when an API returns nothing.
  Home once hard-coded `421 / 289 / 132`, which hid a real crash: the code
  treated `statusBreakdown` (an object) as an array. **Render an empty state,
  never fake data.**
- Reaching for `Alert.alert` — silently does nothing on web.
- A second icon set, a second button component, or a local `StyleSheet` copy of
  something `uikit.jsx` already exports.

#### Checklist before calling a screen done

- [ ] Only `colors` / `uf` / `ufRadius` tokens; no raw hex
- [ ] `insets.top` applied; content clears the tab bar
- [ ] Loading → `Skeleton`; empty → one centred line; error → `ErrorNote`
- [ ] No `entering` animation on content or rows
- [ ] `notify()` not `Alert.alert`
- [ ] Icons from `Icon.jsx`
- [ ] Checked on a **device**, not only in the browser

### 6.1 New screens

```
screens/citizen/     ResearchApplyScreen.jsx        the application form
screens/research/    InsightsScreen.jsx             charts over the public dataset
                     ResearchProfileScreen.jsx      institute, days left, usage stats
                     ExportScreen.jsx               scope picker + download
screens/field/       MyTasksScreen.jsx              assigned + in-progress
                     TaskDetailScreen.jsx           start work, capture proof, submit
                     CompletedTasksScreen.jsx
                     FieldProfileScreen.jsx         stats + leave
screens/supervisor/  QueueScreen.jsx                triage: accept / reject
                     AssignScreen.jsx               pick a field employee
                     FieldStaffScreen.jsx           roster, workload, leave approvals
                     SupervisorProfileScreen.jsx
screens/admin/       PeopleScreen.jsx               employees + researchers, create/deactivate
                     UserFormScreen.jsx
                     ResearchApplicationsScreen.jsx approve / reject queue
```

Reuse everywhere: `components/uikit.jsx` primitives, `ComplaintCard`,
`StatusTimeline`, `Skeleton`, `RingChart`, `Icon`. **Do not introduce a second
design system** — the UrbanFix theme in `theme.js` (`colors`, `uf`, `ufRadius`)
is the single source of truth.

### 6.2 Login screen with the role selector

`screens/citizen/LoginScreen.jsx` gains a segmented pill above the form:

```
┌─────────────────────────────────────────┐
│  [ Citizen ]  [ Employee ]  [ Research ] │   ← animated sliding pill
└─────────────────────────────────────────┘
```

- Reuse the exact mechanism from `GlassTabBar`: one `useSharedValue` driving
  `translateX` + width via `interpolate`, spring
  `{ damping: 26, stiffness: 420, mass: 0.5 }`. Do not hand-roll a second
  animation — match the bar so the app feels consistent.
- **Citizen** — copy explaining no account is needed, plus a "File a complaint"
  button. Citizens never log in.
- **Employee** — email + password.
- **Research** — email + password, plus a secondary "Apply for research access"
  link opening `ResearchApplyScreen`.

**The selector is presentation only.** After a successful login the *server's*
role decides the tab set. Rationale in §10.1 — do not gate on the client's
selection.

---

## 7. Email flows

`backend/services/emailService.js` already sends OTPs and receipts. Add:

| Trigger | To | Contains |
|---|---|---|
| Employee account created | employee | invite link, expires 72h |
| Research application received | applicant | acknowledgement + reference id |
| Research application approved | applicant | invite link, **days of access**, scope, terms |
| Research application rejected | applicant | reason from `reviewNote` |
| Access expiring | researcher | 3 days before `accessExpiresAt` (needs a scheduled job — cuttable) |
| Complaint closed | citizen | existing receipt flow, unchanged |

---

## 8. Privacy — non-negotiable

Granting outsiders access to citizen complaint data is the one part of this
plan that can cause real harm, so it gets hard rules rather than guidance.

1. **Researchers never receive PII.** Exports and query responses must omit
   `citizenId`, name, email, phone, and the raw `description` free-text (which
   contains citizen-written prose and may name people). Ship a single
   `toResearchRecord()` projection helper and route *every* research response
   through it. Never hand a raw Mongoose document to a research endpoint.
2. **Location is coarsened** to ward level for `anonymised_records` scope. Full
   addresses identify households.
3. **`aggregate_only` is the default scope.** Record-level access requires the
   admin to explicitly grant it on approval.
4. **Every access is logged** (`ResearchAccessLog`) with row counts.
5. **Exports are rate-limited** (suggest 5/day) and capped (suggest 5,000 rows).
6. **Expiry is enforced server-side** in `protect`. A client-side countdown is a
   display, not a control.

---

## 9. Phasing

Each phase ends in a demoable state. Do not start a phase before the one above
it is verified working.

### Phase 1 — Foundations (no visible feature)
- Extend `User` role enum; add `stage` and `ward` to `Complaint`; write
  `utils/complaintStage.js` and `constants/wards.js`.
- One backfill script covering both: `stage` from `status`, `ward` from the
  location prefix. Idempotent, re-runnable.
- Ward picker in the Report wizard's `details` step.
- `protect` hardening (isActive, expiry, mustSetPassword).
- `set-password` endpoint + invite token generation.
- `scripts/seedRoles.js` — supervisor, field employee, researcher, admin.
- **Verify:** existing citizen + admin flows still work end-to-end; all 54
  records have a sensible `stage`; 53 have a ward and the Jaipur one is `null`;
  charts unchanged; every seeded role can log in.

### Phase 2 — Employee workflow (the core value)
- Supervisor queue → accept/reject → assign.
- Field tasks → start → upload proof.
- Supervisor closes → existing receipt email fires.
- Admin can create supervisor/field accounts (minimal form).
- **Verify:** file a complaint as a citizen and drive it all the way to
  `closed` through three different accounts.

### Phase 3 — Admin management
- Full People screen: list, create, edit, deactivate, reassign field staff.
- Admin retains the existing override on any complaint.
- **Verify:** deactivated employee cannot log in; their history still renders.

### Phase 4 — Researcher
- Public application form → admin approval queue → provisioning + email.
- Insights dashboard, query, anonymised export, usage stats, expiry screen.
- **Verify:** approved researcher logs in, sees data, downloads an export with
  zero PII; after forcing `accessExpiresAt` into the past, access is refused.

### Phase 5 — Attendance & leave (cuttable)
- Leave request/approve. Attendance check-in/out.
- **Cut this first if the deadline tightens.** It is the least connected to the
  project's stated thesis (transparency + triage) and the easiest thing to
  describe as "future scope" in the report.

---

## 10. What I changed from your draft, and why

**10.1 The login role-pill does not decide your role.**
Your draft has the user pick Employee → Supervisor before logging in. If someone
picks the wrong one, they get a confusing failure for what is really a correct
password. The server already knows the role from the account. So: the pill
chooses which *form and copy* to show, and the tab set comes from the
authenticated role. Visually identical to what you described; far fewer support
problems. I also dropped the Supervisor/Field sub-choice for the same reason.

**10.2 Do not email login credentials.**
Your draft: "if accepted, the email should contain the login credentials". Do
not do this — it puts a working password in plaintext in an inbox and in mail
server logs forever, and you cannot rotate it. Send a **single-use invite link**
that expires in 72h and lets them set their own password. The email still states
the days of access and the scope, which is the part that matters to the user.
This is also the more defensible choice to present at a review.

**10.3 Two status fields instead of replacing the enum.**
Detailed in §3. Your draft implies the supervisor "dynamically updates the
status", which would mean expanding the public status enum and rewriting the
registry, tracker, all charts and the seed data. Splitting public `status` from
internal `stage` gets the whole chain of custody with near-zero migration and no
UI rewrites.

**10.4 Added things your draft did not mention but needs:**
- Soft delete (`isActive`) rather than hard delete — the audit trail references
  employees; deleting one would orphan the history of every complaint they
  touched.
- A rework path (`proof_submitted → assigned`). Your draft assumes the proof is
  always acceptable. Supervisors need to reject bad work.
- `ResearchAccessLog`, which is simultaneously the researcher's "data viewed /
  downloaded" stats *you asked for* and the privacy audit trail *you need*.
- The entire privacy section (§8).

**10.5 Deprioritised:** attendance and leave (Phase 5). They are a separate HR
product bolted onto a civic transparency system, and they are what I would cut
first under deadline pressure.

---

## 11. Decisions — these were open, they are now settled

Nothing here blocks. Each is decided with its reasoning, so it can be revisited
deliberately rather than rediscovered mid-implementation.

**11.1 Ward model → explicit field + fixed list of 10, backfilled by parsing.**
Settled against the live data (§4.2b): 98% of existing locations parse, but the
only real user-submitted one does not. Parsing is good enough for migration,
not good enough for new input — so new complaints get a required picker.

**11.2 Employee accounts are Admin-created only.** As your draft said. Creating
an account is identity provisioning: it grants system access and must be
attributable to one accountable party (`createdBy`). Supervisors get everything
short of that — assign work, reassign within their ward, approve leave, see
their roster's stats. If provisioning becomes a bottleneck later, the cheap fix
is letting a supervisor *nominate* a field employee that an admin one-click
approves, reusing the research-application machinery. Do not build that now.

**11.3 Researchers get anonymised record-level access, off by default.**
Aggregate-only is the default scope on every application. Record-level
(`anonymised_records`) exists, is implemented behind the `toResearchRecord()`
projection, and requires the admin to tick it when approving. Reasoning: you
explicitly want "data downloaded" statistics, which implies real exports —
aggregate-only would make that stat meaningless. The risk is controlled by the
projection, ward-level location, row caps and the access log, not by removing
the feature.

**11.4 Admin is nested under Employee.** Three ends: Citizen, Employee,
Research (§2). Matches your draft, keeps the login pill at three.

**11.5 Yes to `backend/scripts/seedRoles.js`.** Build it in **Phase 1**, not at
the end. Every phase after this one needs a supervisor, a field employee and a
researcher to test with, and hand-creating them through an unfinished admin UI
wastes time on every single run. It should be idempotent, use
`@example.com` addresses so it is trivially distinguishable from real accounts,
print the credentials it creates, and refuse to run when `NODE_ENV=production`.

---

## 12. Notes on the current working tree

- `mobile/src/navigation/RootNavigator.jsx` has `lazy: false` added to both
  `tabScreenOptions` and `stackScreenOptions`. **Keep it on the tabs** — it
  mounts every tab up front, which is what removes the first-open jank, and the
  cold-start cost is the right trade here. **Delete it from
  `stackScreenOptions`** in Phase 1: `lazy` is not a native-stack option, it is
  silently ignored, and leaving it there implies a behaviour that does not
  exist. Watch it as the role count grows — eagerly mounting five tabs that each
  fire a request on mount means five requests at launch. If cold start suffers,
  the fix is to keep `lazy: false` and make the data fetch lazy instead (fetch
  on first focus, not on mount), not to turn tab laziness back on.
- Nothing is committed. The presentation/docs rewrite is deliberately **not**
  started — it should happen *after* these phases land, so it describes the
  finished system rather than needing a second rewrite.

---

## 13. Implementation status (added after the build)

All five phases are implemented. Verified against a running API and the app in a
browser (Playwright, 390px viewport, both web and Android bundles compile):

- **API:** 125 assertions across the whole lifecycle, every role guard, invites,
  deactivation, leave/attendance, research privacy, export rate limit and expiry.
- **UI:** the full citizen → supervisor → field → supervisor → citizen-tracker
  journey driven through the real screens (including a photo upload), invite
  redemption by code and by deep link, every role's landing tab, researcher
  export download, expired-access screen, and the Report wizard's new ward step.
- **Not verified:** a physical device. Android/iOS-only paths — camera capture,
  `expo-file-system` export saving, real blur — are untested. §6.0's own checklist
  ends "checked on a device"; that box is still open.

### Running it

```
cd backend
node scripts/backfillStageAndWard.js     # idempotent: stage, ward, closedAt, history stages
node scripts/seedRoles.js                # dev only; prints credentials; refuses in production
npm run dev
```

`seedRoles.js` creates `supervisor@`, `field1@`, `field2@`, `researcher@` (aggregate
only), `researcher-records@` (record-level) and `admin@example.com`, all with the
password it prints. The pre-existing admin (`seedAdmin.js`) is unchanged.

### Where it deviates from this document

1. **Admin has no Profile tab.** §6's table lists `People · Stats · Complaints ·
   Profile`. An earlier build had an admin Profile tab and it was explicitly
   rejected as wrong, so admin is `Stats · Complaints · People`, and Sign out
   stays in the Stats header. Stats stays first so admins still land on the
   dashboard they know.
2. **Login pill animation.** §6.2 says to reuse the tab bar's spring. `GlassTabBar`
   now uses `withTiming({ duration: 200 })`, so `SegmentedPill` matches the bar as
   it actually is, not as this document described it.
3. **`assign` is also allowed from `assigned`**, so a supervisor can re-pick before
   work starts without a rework round trip.
4. **Citizens never log in** (§6.2), so the login screen no longer links to
   Register. The Register / VerifyOtp / citizen-dashboard screens still exist and
   an existing citizen account can sign in through any pill — the server's role
   decides the tabs.
5. **Extra screens the flows needed:** `SetPasswordScreen` (invite redemption),
   `ResearchExpiredScreen`, `TriageDetailScreen` (accept / reject / close / rework
   on one screen, also reachable from the admin's complaint), `LeaveApprovalsScreen`
   and `ResearchAuditScreen` (admin). New shared pieces went into `uikit.jsx` per
   §6.0: `Label`, `InfoTile`, `StatTile`, `EmptyLine`, `SuccessNote`, `BackHeader`,
   `ChoiceGroup`, `SegmentedPill`, `FieldLabel`.
6. **`/api/field/tasks/:id` (GET)** was added — the task detail screen needs it.
   Supervisors' own leave and attendance live at `/api/supervisor/my-leave` and
   `/api/supervisor/attendance/*`; their leave is decided by an admin at
   `/api/admin/leave`.
7. **Not built:** `POST /api/auth/forgot-password` (listed as a stretch goal).

### Bugs found while testing (fixed)

- **The public tracker leaked the filer's name.** A complaint's first history entry
  is written by the citizen, so populating `changedBy` put their real name in the
  timeline — for anyone with a tracking ID, and tracking IDs are listed in the
  public registry. Citizen actors are now shown as "Citizen" on the tracker and on
  every staff endpoint (`utils/redactHistory.js`). Staff names are kept: who handled
  a complaint is the point of the audit trail.
- **Photos never reached the server from the browser.** RN's `FormData` takes
  `{uri, name, type}`; the browser's stringifies that to `"[object Object]"`. The
  Report wizard had the same latent bug on web. `appendImage()` in
  `utils/imageFiles.js` fixes both.
- An invited user logging in before setting a password was told "Incorrect email or
  password"; they are now sent to the invite screen.

### Operational notes

- **Metro in this environment does not notice edits to existing files.** After
  changing mobile code, restart with `npx expo start --clear` — otherwise a browser
  test can silently run stale code (this cost time twice).
- Every dashboard view and query writes a `ResearchAccessLog` row, so
  `InsightsScreen` deliberately does **not** poll; only `/research/me` (unlogged)
  auto-refreshes.
- Tabs are still `lazy: false`. New screens fetch on focus (`useAutoRefresh`), not
  on mount, so four eagerly-mounted tabs do not mean four launch-time requests. The
  one exception is `InsightsScreen`, which loads on mount — it is the researcher's
  landing tab, so that request would happen at sign-in regardless.

