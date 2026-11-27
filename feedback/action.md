# UrbanFix: Action Plan for the IEEE Access Reviews

This plan answers every point in `feedback/review.md`. Each point gets one or more actions: a code change, a paper change, a test, an experiment, or a written justification for the response letter.

Two constraints apply to every action:

1. **No money.** Only free tools and free compute: the M5 laptop, Kaggle Notebooks (free GPU quota each week), Google Colab free tier, GitHub, Zenodo, and open-source libraries.
2. **Only free online data.** No new photo collection, no surveys, no municipal records, no user studies. Where a reviewer asks for something that needs real people or private data, the plan gives a justification and the closest free proxy.

Priority levels:

- **P0:** must be done before resubmission. A reviewer will reject again without it.
- **P1:** strongly recommended. It removes a clear weakness for little cost.
- **P2:** optional. Do it if time allows, or mention it as future work.

---

## 0. What the audit of the repository found

I checked the paper (`paper/urbanfix_ieee_access/latex/main.tex`) against the code before planning. Some findings make the reviewers' points stronger, and two are problems the reviewers did not see. Fix these first, because a reviewer who opens the released code will find them.

| # | Finding | Evidence | Effect on the review |
|---|---|---|---|
| F1 | **Train/validation leakage in the open manhole data.** 255 of the 480 validation images share a source photo with a training image (for example `10.jpg` in train and `10_aug_flip.jpg` in val). Only 172 distinct source photos are in validation, and 61 of them also appear in training. | Filename stems in `ai_model/data/open_manhole/images/{train,val}`, split logic in `notebooks/03_open_manhole.ipynb` (it uses the dataset's own train/valid folders, which already mix augmented copies). | Confirms Reviewer 1 (point 1) and Reviewer 2 (2.1). The 0.908 mAP50 is inflated. |
| F2 | **Graffiti "validation" set is the official STORM test split**, and the best checkpoint was chosen on it. | `notebooks/04_graffiti.ipynb` maps `test_labels.csv` to `val`. | No untouched test set exists for any model. |
| F3 | **Pothole validation set has only 60 images.** Training images are three Roboflow augmentations of 240 source photos (no stem overlap with validation). | `Pothole_Segmentation_YOLOv8.v1i.yolov8/README.dataset.txt`, stem check. | Confidence intervals will be wide. A larger external test set is needed. |
| F4 | **The AI service is not in the repository, and the backend never calls a model.** There is no FastAPI service, no `aiAnalysis` field, no `needsReview` flag, and no AI display on the supervisor screen. The paper (Fig. 3, Fig. 6, Eqs. 3 to 5) and `docs/project_description.md` describe them as implemented. | `grep` over `backend/` and `mobile/src` finds no `aiAnalysis` or `needsReview`. `models/Complaint.js` has no AI fields. The git history never contained a `.py` service. | Serious. The paper must not describe an integration that does not exist. Either build it (plan below, all free) or rewrite the paper to say the models are evaluated offline only. |
| F5 | **Urgency is supplied by the client and not recomputed on the server.** The app sends `urgencyLevel` as a string. The questionnaire answers are only appended as text to the description. | `mobile/src/screens/public/FileComplaintScreen.jsx:248`, `backend/validators/complaintValidator.js` (`urgencyLevel: z.string().optional()`). | The "traceable urgency anyone can recompute" claim is weak. A modified client can file any urgency. |
| F6 | **The research HMAC key is `JWT_SECRET`, with a hard-coded fallback `'research'`.** | `backend/utils/researchProjection.js:18`. | Key reuse and an insecure default. Reviewer 2 asks about key management. |
| F7 | **No limit on OTP attempts and no rate limit on OTP requests.** A 6-digit code with unlimited guesses in 5 minutes can be brute-forced. The request endpoint can also be used to flood any email address. | `backend/controllers/complaintController.js` (`requestComplaintOtp`, `submitComplaint`), no rate limiter in `server.js` or `package.json`. | Reviewer 2 asks for an OTP brute-force test. The test would currently fail. |
| F8 | **Uploaded photos keep their EXIF metadata** (GPS position, device, time) and are served publicly from `/uploads`. | `backend/middleware/uploadMiddleware.js` writes the original file. `server.js` serves `uploads/` statically. | Personal data leak in the public registry. Reviewer 1 (point 3) and Reviewer 2 (iii). |
| F9 | **The public registry uses a deny-list projection** (`select('-citizenId -assignedTo ...')`). Any new field added to `Complaint` becomes public automatically. Free-text title and description are published unfiltered. | `backend/controllers/publicController.js`. | Same privacy points. |
| F10 | **The research export quota can be exceeded with parallel requests.** The count and the log write are separate operations. | `backend/controllers/researchController.js` (`exportData`). | A concurrency test would expose it. |
| F11 | **The "16 API tests" are not in the repository.** There is no test folder and no `test` script. | `backend/package.json`. | Reviewer 2 asks for released tests. |
| F12 | **The registry `location` filter passes user input straight into a regular expression.** | `publicController.js` (`$regex: location`). | Minor. Regex injection and slow-regex risk. |
| F13 | Eq. (1) in the paper lists only *public, localised, street-level*, but the text also requires *documented provenance and a usable licence*. | `main.tex` lines 196 to 201. | Reviewer 2 (iv) uses this gap against the paper. |
| F14 | Licences. The Roboflow pothole set is CC BY 4.0 (stated in the local `README.dataset.txt`), but the collector and image sources are not documented ("Provided by a Roboflow user"). The Kaggle Road Hazards page does not show a licence to automated readers, so it must be checked by hand. TACO's GitHub repository has an MIT licence for code only, and states no licence for images or annotations on GitHub. RDD2022 is CC BY 4.0 on its figshare record (corrected in phase 2, F19) and includes India. | Local files and the dataset pages. | Reviewer 2 (iv). |

---

## 1. Map from reviewer points to actions

| Reviewer point | Actions |
|---|---|
| R1.1: separate test set of resident-like photos, keep edited copies together | A1, A2, A3, J2 |
| R1.2a: how often the AI flags valid complaints or lets unrelated photos through | A5, A6 |
| R1.2b: staff decisions with and without AI | J1, A7 (proxy) |
| R1.3: personal details removed, re-identification check | B1 to B7, P7 |
| R1 Q2: separate test set, complaint-level evaluation | A1 to A6 |
| R1 Q4: references not sufficient | P10 |
| R2 (i): held-out test or CV, CIs, baseline, ablation, justify YOLOv8n, state τ and θδ | A1 to A4, A8, A9, P5, P6 |
| R2 (ii): Eq. (4) masks vs boxes, δ-to-urgency rule | A10, P5, J5 |
| R2 (iii): privacy as real analysis (adversary, keys, linkage, k-anonymity [37], free-text and photo PII, law) | B1 to B7, P7, P10 |
| R2 (iv): provenance and licence of [16] and [18] | D1 to D3, P4 |
| R2 (v): load, concurrency, OTP brute force, audit integrity tests; release code, tests, splits | C1 to C9, E1 to E3, P8 |
| R2 (vi): harmonise stage counts | P3, J4 |
| R2 (vii): fairness discussion, standard mAP reference | A11, P9, P10 |
| R2 (viii): temper "AI-validated" and "accountable" | P1, P2, P11 |
| R2 Q1: contribution is only system integration | P11, J6 |
| R2 Q2.5 / Q5: remove [37] unless k-anonymity is implemented | B4, B5, J10 |
| R2 Q3: no requirements analysis, threat model, cost study, pilot, user study, legal discussion | P7, P12, P13, J1, J3 |
| Repository findings F4 to F12 (not raised by reviewers) | G1 to G3, B2, B3, B6, C2, C6 |

---

## 2. Model evaluation (code, experiments, tests)

### A1. Build grouped, leak-free splits (P0)

**Why:** R1.1, R2 (i), findings F1 to F3.

**Steps:**

1. Add `ai_model/scripts/make_splits.py`. For each dataset:
   - Group images by **source photo**. Use the filename stem first (strip `_aug_*`, `_augmented`, and Roboflow `.rf.<hash>`).
   - Then merge groups whose perceptual hash (dHash, 64-bit, Hamming distance ≤ 6) matches. This catches renamed duplicates such as `01059.jpg`. Use `imagehash` or a 20-line PIL implementation, both free.
   - Split **groups**, not images, into train / val / test at 70 / 15 / 15 with a fixed seed. Never put two members of one group in different splits.
2. Write the split lists to `ai_model/splits/<category>.json` (file names and group IDs only, no images). Commit these files.
3. Graffiti: keep the official STORM test split as the **test** set and never use it during training. Carve the validation set out of STORM train with the grouping above.
4. Pothole: merge the 240 training source photos and 60 validation photos, then regroup and split. All three augmented copies of one photo must land in the same split. Keep only one copy in val and test (the un-augmented or first copy), because augmented copies in a test set count one photo three times.
5. Open manhole: regroup the whole Kaggle set. Drop the augmented copies from val and test.
6. Add a check cell that asserts zero group overlap between splits and prints, for each split, the number of images and of distinct source photos. Put the printed table in the paper's supplementary material.

**Acceptance:** `make_splits.py` reports 0 shared groups and 0 near-duplicate pairs across splits for all four categories.

### A2. Retrain on the new splits and evaluate once on the test set (P0)

**Steps:**

1. Retrain the YOLOv8n models (three since D3) on the new train sets. Select the checkpoint on the new val sets only. Use the free GPU on Kaggle Notebooks or Colab if the laptop is too slow. The current settings stay the same (640 px, batch 16, 60 epochs, patience 15).
2. Add `ai_model/notebooks/07_test_evaluation.ipynb`. It runs each final model **once** on its test set and writes `results/test_eval.json`.
3. Train each model with **3 seeds** (0, 1, 2). Report the mean and the range across seeds.
4. **Confidence intervals:** bootstrap over test images (1,000 resamples, resample images with replacement, recompute P, R, mAP50, mAP50-95). Report 95 % percentile intervals. Ultralytics returns per-image statistics, so this costs only CPU time.
5. Optional (P2): 5-fold grouped cross-validation for the two smallest sets (pothole, graffiti) if Kaggle GPU time allows. Reviewer 2 accepts "held-out test set **or** cross-validation", so A2 alone satisfies the request.

**Acceptance:** a new Table V with test-set P, R, mAP50, mAP50-95, each with a 95 % CI, plus the old validation numbers in a separate column marked "validation (used for model selection)".

### A3. Cross-dataset test on photos like residents take (P0 for pothole, P1 for others)

**Why:** R1.1 asks for "photos like those residents would submit". The current models have never seen Indian streets (paper limitation).

**Free test sets:**

| Category | External test set | Licence | Notes |
|---|---|---|---|
| Pothole | **RDD2022, India subset** (`RDD2022_India.zip`, Arya et al., Geoscience Data Journal, 2024) | CC BY 4.0 | Smartphone photos of Indian roads, boxes in Pascal VOC. Use class D40 (pothole). Evaluate the box metrics of the pothole model only. Faces and plates are already blurred by the dataset authors. |
| Pothole (extra) | RDD2022 Japan and Czech subsets | CC BY 4.0 | Used for the fairness gap in A11. |
| Litter | TACO **unofficial** annotations (`data/annotations_unofficial.json`), after removing any image that also appears in the official set | Check tacodataset.org | Different photographers, same task. |
| Litter (extra) | PlastOPol (Córdova et al. [b32]) | Verify licence before use | Already cited in the paper. |
| Open manhole | One manhole dataset from Roboflow Universe with a stated CC BY 4.0 licence and a different source | CC BY 4.0 | Record the dataset URL, version and licence in Table IV. |
| Graffiti | Untouched STORM test split (A1). If a second free graffiti set with a stated licence exists on Roboflow Universe, add it. | CC BY 4.0 | |

Convert each set to YOLO format with a script in `ai_model/scripts/`, deduplicate it against the training data with the dHash check from A1, and evaluate with the same code as A2.

**Acceptance:** a "cross-dataset" column in the results table, and one sentence per category that states the drop from in-domain to cross-dataset performance.

### A4. Choose and justify τ (P0)

**Why:** R2 (i) says τ = 0.25 is not justified.

**Steps:**

1. On the **validation** set, sweep τ from 0.05 to 0.90 in steps of 0.05.
2. At each τ, compute the complaint-level rates from A5: the false-flag rate (valid complaints sent to review) and the false-pass rate (unrelated photos that pass).
3. Pick a per-category τ_k with a stated rule. Suggested rule: the largest τ_k that keeps the false-flag rate on valid complaints at or below 20 %, because a false flag only costs a supervisor a look, while a wrong pass hides nothing (the supervisor still sees every complaint). State the rule in the paper.
4. Report the chosen τ_k and the resulting rates on the **test** set (A5).
5. Plot both rates against τ (one small figure, four lines per rate).

### A5. Complaint-level evaluation: flagged valid complaints and passed unrelated photos (P0)

**Why:** R1.2a and R1 Q2 ("measure how well the AI checks whole complaints").

**Definition:** a complaint has 1 to 3 photos. The service computes s* = max confidence over all photos (Eq. 3). The complaint is flagged for review when s* < τ_k (Eq. 5).

**Test complaints, built only from free data:**

- **Valid complaints:** group 1 to 3 test images of category k into synthetic complaints (sample the number of photos uniformly, fixed seed).
- **Wrong-category complaints:** photos from the other three categories' test sets filed as category k. Example: a graffiti photo filed as a pothole.
- **Unrelated complaints:** random photos from the COCO 2017 validation set (free, 5,000 images) with no object of the defect type. Optionally add Places365 validation street scenes.

**Metrics per category, with Wilson 95 % confidence intervals:**

- False-flag rate = valid complaints flagged / valid complaints.
- False-pass rate = wrong-category or unrelated complaints that pass / such complaints. Report the two negative types separately.
- Image-level precision and recall for "the photo contains the defect".

**Files:** `ai_model/notebooks/08_complaint_level_eval.ipynb`, output `results/complaint_eval.json`.

**Acceptance:** a new table "Complaint-level screening on the test sets" that answers R1.2a in one place.

### A6. Error analysis of flagged and passed cases (P1)

Show 8 example images per category: valid complaints the model flagged, and unrelated photos it passed. Explain the patterns in 3 to 4 sentences (for example faint tags for graffiti, small items for litter). Use the existing figure style.

### A7. Proxy for "staff decisions with and without AI": triage workload simulation (P1)

A real comparison of staff decisions needs municipal staff and real complaints (see J1). The free proxy is a workload simulation on the test complaints from A5:

- **Without AI:** a supervisor must inspect every photo of every complaint.
- **With AI:** the supervisor checks flagged complaints closely and spot-checks a fraction of passed ones.

Report the share of complaints flagged, the expected number of wrong passes per 100 complaints at τ_k, and the expected number of photos a supervisor must inspect closely. State clearly in the paper that this is a simulation of workload, **not** a measure of staff decisions, and that the human study is future work.

### A8. Baseline detectors and ablation to justify YOLOv8n (P0)

**Why:** R2 (i).

**Steps (all free, same splits, same image size):**

| Model | Role | Where to train |
|---|---|---|
| YOLOv8n (current) | proposed | laptop or Kaggle |
| YOLOv8s | larger model of the same family | Kaggle GPU |
| YOLO11n | newer nano model | Kaggle GPU |
| One non-YOLO detector: RT-DETR-l (Ultralytics) **or** Faster R-CNN MobileNetV3-Large FPN (torchvision) | different family, as Reviewer 2 asks for "at least one baseline detector" | Kaggle GPU |

For each model, report test mAP50, mAP50-95 (with CIs), CPU latency per image, model size in MB, and the complaint-level false-flag rate at its own τ_k.

**Justification to write:** choose YOLOv8n if the larger models gain only a few points of mAP50 at 2 to 4 times the CPU latency. The deployment target is a CPU-only municipal server (no GPU budget). If YOLO11n wins on both accuracy and latency, switch to it and say so; the paper does not depend on one detector.

**Ablations (P1):** (a) COCO pretraining vs training from scratch for one category, and (b) for litter, one merged class vs TACO's 28 super-categories mapped to one class at inference. Keep the ablation table small.

### A9. Fix the validation-set inflation statement (P0)

Remove the sentence "augmented copies in that dataset may inflate it" and replace it with the measured fact from F1 and the new leak-free numbers. Reviewers prefer a measured correction to a hedge.

### A10. Resolve Eq. (4) and the δ-to-urgency rule (P0)

**Why:** R2 (ii). δ is defined from masks, but the manhole and graffiti models produce boxes. θδ has no value. No evidence links image coverage to real severity, and no free dataset can supply that evidence (J5).

**Recommended action:** **remove the δ-to-urgency rule.**

- Delete u_AI as "u_Q raised one band when δ > θδ". The AI no longer changes any urgency value.
- Keep δ only as **descriptive evidence** shown to the supervisor, and only for the two segmentation models. Define it as written for masks. For box models, do not report δ (or report the union of box areas labelled "box coverage, approximate" and never use it in a decision).
- Remove θδ from the paper and from the limitations section.
- The supervisor's decision then rests on u_Q (traceable), the flag r, and the evidence images. This also makes the "traceable urgency" claim cleaner.

Alternative, if the authors want to keep the rule: define δ_box = |∪ b_j| / (H·W), state θδ = a number, run a sensitivity table over θδ, and call the rule a heuristic with no severity validation. This is weaker and invites another round of comments.

### A11. Fairness of the models across places (P1)

Evaluate the pothole model on the RDD2022 India, Japan and Czech subsets (A3) and report recall and false-flag rate per country with CIs. A drop for India is a measured fairness issue: complaints from places unlike the training data get flagged more often, so their filers wait longer for a human decision. Use this number in P9.

---

## 3. Privacy (code, tests, analysis)

### B1. Write down what personal data exists and where it goes (P0)

Make a table for the paper and for `docs/` (replaces and extends Table III):

| Data item | Collected | Stored | Public registry | Tracker | Staff | Research records | Research aggregates |
|---|---|---|---|---|---|---|---|
| Name, email, phone | yes | User | no | no | no | no | no |
| Free-text title and description | yes | Complaint | yes, after redaction (B3) | yes, after redaction | yes | no | no |
| Photos | yes | uploads/ | yes, after EXIF removal (B2) and optional blur | yes | yes | no | no |
| EXIF GPS, device, time in photos | yes (inside file) | **removed at upload** (B2) | no | no | no | no | no |
| Street location (free text) | yes | Complaint | yes | yes | yes | no (ward only) | no |
| Ward | yes | Complaint | yes | yes | yes | yes | yes, with minimum cell size (B5) |
| Filing and closing time | auto | Complaint | yes | yes | yes | generalised (B4) | month |
| Staff names in history | auto | Complaint | no | role only | yes | no | no |
| IP address of researcher | auto | access log | no | no | admin | no | no |

### B2. Strip photo metadata at upload (P0, code)

- Add `sharp` (free, MIT) to `backend/package.json`.
- In `uploadMiddleware.js`, after Multer writes a file, re-encode it with `sharp(file).rotate().jpeg({ quality: 85 })`. `rotate()` applies the EXIF orientation, and sharp drops all metadata by default. Overwrite the original. Apply this to complaint photos and to field proof photos.
- Test: upload a JPEG that contains EXIF GPS tags, then fetch it from `/uploads/...` and assert no EXIF block is present (`exifr` or `sharp().metadata()` in the test).

### B3. Redact personal data in free text before publication (P0, code)

- Add `backend/utils/redactText.js` with patterns for: email addresses, Indian mobile numbers (`(\+91[\-\s]?)?[6-9]\d{9}`), Aadhaar-like 12-digit numbers (with or without spaces), PAN (`[A-Z]{5}\d{4}[A-Z]`), and Indian vehicle registration numbers (`[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}`). Replace matches with `[removed]`.
- Apply it when saving a complaint, and store the original only in an admin-only field if the admin needs it. Simpler and safer: store only the redacted text.
- Names of people in free text cannot be found reliably with regular expressions. State this as a residual risk, and add a line in the filing screen: "Do not write names or phone numbers. Your description and photos will be public."
- Test: submit descriptions with each pattern and assert the registry response contains none of them.

### B4. Separate key for research IDs, key management, and linkage control (P0, code)

- Add `RESEARCH_HMAC_KEY` to `.env.example`. Refuse to start the server when it is missing or shorter than 32 bytes. Remove the `'research'` fallback and stop reusing `JWT_SECRET`.
- **Per-grant keys against cross-researcher linkage:** derive the key per research grant: `k_grant = HMAC(RESEARCH_HMAC_KEY, researcherId)`. Two researchers then get different IDs for the same complaint, so they cannot join their exports, while one researcher's exports still join with each other (the property the paper wants).
- Rotation: document that rotating `RESEARCH_HMAC_KEY` breaks joins with earlier exports, and that the key lives only in the server environment, never in the database or the repository.
- Generalise the quasi-identifiers in record exports: report the **ISO week** filed instead of the day, drop `closedOn`, and keep `resolutionDays` rounded to whole days. Measure the effect in B5 before fixing the final choice.

### B5. Measure re-identification risk and enforce k-anonymity (P0, analysis plus code)

This turns the [37] citation into something the system actually does (see J10).

**Analysis with free real data.** Seeded data cannot show real risk, so use public 311 data that has the same fields:

- **Chicago 311 Service Requests** (City of Chicago Data Portal, free). It has request type, created date, closed date, status, and a **ward** column (verify the column on download). This is the closest free match to UrbanFix's projection (category, ward, day filed, day closed, status, urgency).
- Optionally NYC 311 (community district) or Boston 311 (ward) as a second city.

**Steps (`analysis/privacy/linkage_analysis.ipynb`):**

1. Map four request types to the four UrbanFix categories (for example pothole, graffiti removal, sanitation or debris, and an open-hole or sewer type).
2. Take the quasi-identifier set of the current projection Eq. (7): (category, ward, day filed, day closed, status).
3. Compute the equivalence-class size distribution: share of records with k = 1 (unique), k < 5, and k < 10. Do it for the full city and for a subsample the size of one Indian municipal zone (for example 10 wards and 1,000 complaints a year), because small systems are where uniqueness is high.
4. Repeat for the generalised projection (week filed, no closing day; then month filed).
5. Report a table: projection variant vs share of unique records. Expect the day-level projection to leave many unique records in small wards; this is the reviewer's point, and the table proves the fix.
6. Model the adversary concretely (P7): a neighbour who knows that someone reported a pothole in ward 7 on a given day can find that record if k = 1, and then learn its status and resolution time. The registry already shows the street location and description, so the research projection matters most for linking a known person to the **registry entry** through the research ID. Discuss this.

**Code (`backend/utils/researchProjection.js`):**

- Before returning records or an export, group rows by the quasi-identifiers and **suppress rows in classes smaller than k = 5** (count them and report the number suppressed in the response).
- For aggregates, suppress any cell with a count below 5 (standard minimum cell size used by statistics offices).
- Tests: build fixtures with known class sizes and assert suppression.

**Paper:** keep [37], now as the basis of an implemented and measured rule, and add l-diversity and re-identification literature (P10).

### B6. Registry projection as an allow-list (P0, code)

Replace `select('-citizenId ...')` in `publicController.js` and in the tracker with an explicit allow-list: `trackingId title description category location ward status stage urgencyLevel images completionImages createdAt closedAt statusHistory.status statusHistory.stage statusHistory.changedAt statusHistory.remarks`. New fields then stay private by default. Add a test that fails if any key outside the allow-list appears in the registry response.

### B7. Consent notice and optional face and plate blurring (P1 consent, P2 blurring)

- **Consent (P1):** add a required checkbox in `FileComplaintScreen.jsx`: "I understand my photos, description and street location will be published without my name or contact details." Store the consent time on the complaint. This supports notice and consent under the DPDP Act, 2023.
- **Blurring (P2):** blur faces and number plates in public copies with a free detector (for example the OpenCV DNN face detector, or an open-weights YOLO face or plate model). Keep the unblurred photo for staff only. If this is not built, state photos as a residual risk and say that staff can hide a photo from the registry.

---

## 4. System validation and security tests (code, tests)

### C1. Put the test suite in the repository (P0)

- Add `backend/tests/` using `node:test` (built in), `supertest` and `mongodb-memory-server` (all free). Add `"test": "node --test tests/"` to `package.json`.
- Port the 16 tests from Fig. 15 first, unchanged, so the paper's claim is reproducible.
- Add a free GitHub Actions workflow (`.github/workflows/test.yml`) that runs the suite on every push. Free for public repositories.

### C2. OTP hardening and brute-force test (P0)

**Code:**

- Store the OTP as a SHA-256 hash, not in plain text.
- Add an `attempts` counter to `Otp`. After 5 wrong codes, delete the OTP and require a new request.
- Look up by email only, then compare with `crypto.timingSafeEqual`.
- Add `express-rate-limit` (free): at most 3 OTP requests per email per 15 minutes and 20 per IP per hour, and a limit on submissions per IP.

**Tests:**

- Brute force: 6 wrong codes in a row; assert the 6th returns 429 or 400 with "request a new code", and the correct code no longer works.
- Request flood: 4 OTP requests for one email in a minute; assert the 4th returns 429.
- Report in the paper: with 5 attempts per code and 3 codes per 15 minutes, the chance of guessing is 15 / 10^6 per 15 minutes per email.

### C3. Concurrency tests (P0)

- **Export quota race:** fire 10 export requests in parallel with `Promise.all`; assert at most 5 succeed. This fails today (F10). Fix with an atomic counter: one document per researcher per UTC day, updated with `findOneAndUpdate({ $inc: { n: 1 } }, { upsert: true })` and rejected when the new value exceeds 5. Or use a sliding window with the same atomic pattern.
- **Double transition:** two supervisors accept, or assign, the same complaint at the same time. Assert exactly one succeeds and the history has one entry. If it fails, make transitions conditional updates (`findOneAndUpdate({ _id, stage: from }, ...)`) in `services/complaintWorkflow.js`.
- **Proof and rework race:** a worker submits proof while the supervisor sends rework. Assert the final stage is one of the legal results and the history is consistent.

### C4. Tamper-evident audit log and integrity test (P0)

**Code:**

- Add `prevHash` and `hash` to `ResearchAccessLog` (and optionally to each `statusHistory` entry). `hash = SHA-256(prevHash || canonical JSON of the row)`.
- Write log rows through one function that reads the latest hash and inserts the new row inside a MongoDB transaction, or with a per-chain sequence number and a unique index so two writers cannot fork the chain.
- Add Mongoose `pre('updateOne' | 'findOneAndUpdate' | 'deleteOne' | 'deleteMany')` hooks that throw on the log model, so the application cannot edit it.
- Add `scripts/verifyAuditLog.js` and an admin endpoint that recomputes the chain and reports the first broken row.

**Tests:**

- Write 50 log rows, change one row directly in the database, run the verifier, and assert it reports that row.
- Delete one row; assert the verifier reports the gap.
- State the limit in the paper: a hash chain detects edits by anyone who cannot recompute the chain; it does not stop a database administrator who rewrites the whole chain. Periodically publishing the latest hash (for example in the public registry footer) closes most of this gap for free. Cite Schneier and Kelsey, and Crosby and Wallach (P10).

### C5. Load test (P0)

- Use `autocannon` (free, npm) or `k6` (free). Add `backend/tests/load/`.
- Scenarios on the laptop, with a seeded database of 10,000 complaints (extend `seedComplaints.js` with a count argument):
  1. Public registry list, 50 and 200 concurrent connections, 60 s.
  2. Tracker lookup by tracking ID.
  3. Research query (records, paged).
  4. Complaint submission with a mocked OTP and a 300 KB image (lower concurrency, 20 connections).
- Report requests per second, p50, p95 and p99 latency, and error rate. State the hardware. Do not claim city-scale capacity; claim measured capacity on one laptop.

### C6. Privacy regression tests (P0)

- Registry and tracker responses contain no email, phone, citizen name, citizen ID, or staff ID (extends the two existing privacy tests).
- Uploaded photos served from `/uploads` contain no EXIF (B2).
- Redaction patterns removed (B3).
- Research record export contains no class smaller than k (B5).
- Two researchers get different `recordId` values for the same complaint (B4).
- Server refuses to start without `RESEARCH_HMAC_KEY` (B4).

### C7. Fix regex injection in the registry filter (P1)

Escape user input before building the regular expression in `publicController.js` (or use a text index). Add a test with `location=(a+)+$`.

### C8. Server-side urgency (P0, code)

- Move the questionnaires and weights to `backend/constants/questionnaires.js` (the mobile copy stays in sync, as with categories).
- Accept `answers` (question ID to yes/no) from the client, validate them with Zod against the category's question list, compute U and u_Q on the server with Eq. (2), and store both `answers` and the score on the complaint. Ignore any client `urgencyLevel`.
- Publish `answers` in the registry so anyone can recompute the score, which is what the paper claims.
- Tests: tampered client urgency is ignored; each reachable score maps to the right band (all combinations of 5 answers for both weight profiles, 64 cases).

### C9. Requirements traceability (P1)

Add a table to `docs/` and to the paper's supplementary material that lists each functional and security requirement (for example "a complaint cannot close without proof photos") and the test that checks it. This answers the "no requirements analysis" remark in R2 Q3 at almost no cost.

---

## 5. Datasets: provenance and licences (R2 iv)

### D1. Record provenance and licence for every dataset (P0)

Add columns to Table IV: source and collector, licence, URL with version or access date, number of source photos versus augmented copies, and whether the licence allows redistribution.

### D2. Pothole [16]: replace with RDD2022 or document (P0)

- The Roboflow set is CC BY 4.0 (stated in the export's `README.dataset.txt`), so the **licence** criterion holds. The **provenance** criterion does not: the uploader is anonymous and the image sources are unknown.
- **Recommended:** train the pothole model on **RDD2022** (CC BY 4.0, journal-published, documented collection, includes India). RDD2022 has boxes only. That is fine once A10 removes the mask-based urgency rule. Keep the Roboflow segmentation model only as an optional evidence overlay, or drop it.
- Cite RDD2022 by its journal version (Arya et al., Geoscience Data Journal, 2024) rather than the arXiv preprint.

### D3. Open manhole [18]: verify by hand, then keep, replace or drop (P0)

**Outcome (2026-11-26):** dropped. See section 10a.

1. Open the Kaggle page in a browser and record the licence shown in its "License" field, and any source statement.
2. If the licence is CC0, CC BY or another usable licence and the collector is named: keep it, document it, and use the leak-free split from A1.
3. If the licence is "Unknown", "Other" without terms, or missing: by the paper's own Eq. (1) the category does not qualify. Either replace it with a Roboflow Universe manhole dataset that states CC BY 4.0 and a source, or drop open manholes from the supported categories and say so. Dropping a category is acceptable; the screening rule then works as designed, and it is an honest result.
4. TACO [17]: check tacodataset.org for the image and annotation licence and record it. If no licence is stated there, say so in Table IV and add a sentence on it.

### D4. Make Eq. (1) match the text (P0, paper)

Write Eq. (1) with all five criteria: public ∧ localised ∧ street-level ∧ documented provenance ∧ usable licence. Update Fig. 4 so the circles show all five, and re-run the screening.

---

## 6. Build what the paper describes, or describe what was built (G)

### G1. Build the AI service and connect it (P0, unless G3 is chosen)

All parts are free.

1. `ai_service/main.py` with FastAPI and Ultralytics. Endpoint `POST /predict/{category}` takes up to 3 images and returns per-photo detections (box, confidence, mask area for segmentation models), s*, `needsReview`, the model version, τ_k, and annotated images (base64 or saved file paths).
2. `ai_service/requirements.txt` and a short README. Load all four models at start-up.
3. Backend: add an `aiAnalysis` sub-document to `Complaint` (`modelVersion`, `tau`, `sStar`, `needsReview`, `detections`, `annotatedImages`, `analysedAt`, `error`). After the response with the tracking ID is sent, call the service with a timeout and two retries. On failure, store `error` and set `needsReview = true`. This matches the paper's claim that a failed model call never blocks filing.
4. Supervisor triage endpoint returns `aiAnalysis`. Mobile `TriageDetailScreen.jsx` shows the flag, s*, and the annotated photo.
5. Tests: service down gives `needsReview = true` and a saved complaint; a test photo with a known defect gives `needsReview = false`.
6. Measure end-to-end latency (filing response time with and without the service running) and add it to the paper; this also supports the "never blocks filing" claim.

### G2. Make the README and docs honest (P0)

- `README.md`: "anonymised data" becomes "pseudonymised data with k-anonymity suppression".
- `docs/project_description.md` Section 8 and the README architecture must match the code after G1.

### G3. Alternative if G1 is not built (not recommended)

Rewrite Sections III and IV-C to say the models are evaluated offline and the integration is designed but not implemented. Remove Fig. 6's live path, and the AI parts of Fig. 3 and Fig. 10(g). This is honest but weakens the paper a lot, and G1 costs only a few days.

---

## 7. Reproducibility release (R2 v)

### E1. Public repository and archive (P0)

- Make the repository public on GitHub (free) with an open licence for the code (MIT or Apache-2.0).
- Before publishing: confirm that no `.env`, secrets, real email addresses, or personal photos are tracked. Remove author photos and bios from the code repository if they are not needed there.
- Archive a tagged release on **Zenodo** (free) to get a DOI. Cite the DOI in the paper's Data Availability statement.

### E2. What to release (P0)

- Code: `backend/`, `mobile/`, `ai_service/`, `ai_model/` notebooks and scripts.
- Tests: `backend/tests/`, load test scripts, and the privacy analysis notebook.
- **Split lists** (`ai_model/splits/*.json`) and download scripts. Do **not** redistribute dataset images whose licence does not allow it; release the scripts that download them from their source instead.
- Weights for the final models, if the dataset licences allow it (CC BY and CC BY-SA allow it with attribution; CC BY-SA weights should note the share-alike condition).
- `results/*.json` with every number in the paper, and a script that regenerates each table and figure.

### E3. Data availability statement in the paper (P0)

One paragraph: the DOI, what is included, what must be downloaded from source, and that no real complaint data exists because there was no deployment.

---

## 8. Paper changes

### P1. Title and claims (P0)

- Replace "AI-Validated" with "AI-Assisted" everywhere. Replace "accountable" with "auditable" where it describes the software; keep "accountability" only for the goal.
- Suggested title: **"UrbanFix: A Closed-Loop Civic Complaint Platform with AI-Assisted Photo Triage, an Auditable Public Registry and Pseudonymised Research Access."**
- Replace "privacy-preserving" in the keywords with "pseudonymisation" and "k-anonymity" once B4 and B5 are done.

### P2. Abstract (P0)

- Report **test** results with CIs, and the complaint-level false-flag and false-pass rates.
- Say the model flags and never rejects, and give the false-flag rate.
- Say the workflow figures come from seeded data and the privacy risk was measured on public 311 data.
- Use the stage terms from P3.

### P3. One glossary for stage counts (P0)

Use these terms everywhere and add them to a short table in Section III:

| Term | Count | What it is |
|---|---|---|
| Governance loop | 6 steps | Report, AI check, triage, field work, receipt, registry and research (Fig. 2) |
| Workflow states | 7 states | sub, acc, asg, wip, prf, cls, rej (Eq. 6, Fig. 8) |
| Main path | 5 forward transitions | accept, assign, start, proof, close; plus reject and rework |
| Request pipeline | 7 checks | the middleware chain every API call passes (Fig. 3) |

Fix the Abstract ("seven-stage workflow" is correct for states; say "seven-state"), the Introduction ("six steps" of the loop), Section III ("seven request checks", not "gateway stages"), and Section IV-D. See J4.

### P4. Datasets section (P0)

Eq. (1) with five criteria (D4), Table IV with provenance and licence (D1), the RDD2022 change (D2), and the manhole decision (D3). Add the split procedure from A1 with the table of source-photo counts.

### P5. Method changes (P0)

- Section IV-C: per-category τ_k with the selection rule (A4). Remove the δ urgency rule and θδ (A10). Keep δ as descriptive evidence for segmentation models only, with a sentence that it is not a severity measure.
- Eq. (2): say urgency is computed on the server from stored answers (C8).

### P6. Results section (P0)

- Table V: test-set metrics with 95 % CIs, mean over 3 seeds; validation numbers in a separate column.
- New table: complaint-level screening (A5).
- New table: baselines and ablation (A8), with latency and size.
- Cross-dataset results, including RDD2022 India (A3).
- τ sweep figure (A4).
- Keep the training curves, labelled as validation and training only.
- Error-analysis figure (A6) and workload simulation (A7), labelled as a simulation.
- Add the standard mAP definition with citations to PASCAL VOC and COCO.

### P7. Rewrite Section IV-E as a privacy analysis (P0)

Structure:

1. **Assets:** citizen identity and contact data, photos and their metadata, free text, location and time of filing.
2. **Adversaries:** (a) any member of the public using the registry and tracker; (b) an approved researcher; (c) two or more researchers who combine exports; (d) an insider with admin rights; (e) an outside attacker who obtains a database copy.
3. **Controls per adversary:** registry allow-list, EXIF removal, text redaction, consent notice (a); projection, generalisation, k-suppression, quotas, expiry, logging (b); per-grant HMAC keys (c); hash-chained audit log, deactivate-only accounts (d); secrets kept out of the database, hashed OTPs and passwords (e).
4. **Pseudonymisation versus anonymisation:** HMAC IDs are pseudonyms; the exported data is pseudonymised personal data under GDPR Art. 4(5) and Recital 26 and must be handled as such. Remove every use of "anonymised" for the record export.
5. **Key management:** B4.
6. **Measured linkage risk:** the table from B5 on Chicago 311, before and after generalisation and suppression.
7. **Residual risks:** names in free text, faces and plates in photos (unless B7 blurring is built), street location in the registry, very small wards, and an adversary who already knows the street location (who learns nothing new from the research data, but can learn the status from the registry anyway, since the registry is public by design).
8. **Law:** India's Digital Personal Data Protection Act, 2023 (notice and consent, purpose limitation, security safeguards, the research and statistics exemption) and the DPDP Rules, 2025 (verify the notification details before citing); GDPR for comparison. One paragraph each, with no legal claims beyond what the text of the law says.

### P8. System validation section (P0)

Replace the "16 API tests" paragraph with a table of test groups (functional, workflow guards, privacy, OTP brute force, concurrency, audit integrity), the number of tests and the pass count, the load test table (C5), and the repository DOI. Keep Fig. 15 or replace it with the table.

### P9. Fairness subsection (P0)

Use the papers already cited [12] to [14] and the measurements from A11.

- **Who reports:** 311 studies show lower reporting in poorer and minority areas; counts are a biased guide to need. UrbanFix does not rank wards by complaint counts, and the paper should say that counts must not be used to allocate resources without correction.
- **Access:** filing needs a smartphone, an email address and literacy in the app's language. Account-free filing lowers one barrier but not these.
- **Category selection:** Eq. (1) lets data availability decide which problems citizens can report. Water leakage and streetlights are excluded for lack of data, not lack of need.
- **Model bias by place:** measured gap between RDD2022 India and other countries (A11). Flagged complaints wait for a person, so a model that flags Indian photos more often delays Indian complainants; the human-review design limits the harm but does not remove it.
- **Monitoring:** the admin dashboard can report median resolution time and flag rate per ward, so disparities become visible. Add these two charts if they are not already present (P1 code task in the admin analytics controller).

### P10. References to add (P0)

Detection metrics and models:

- M. Everingham et al., "The PASCAL Visual Object Classes (VOC) Challenge," *IJCV*, 2010.
- T.-Y. Lin et al., "Microsoft COCO: Common Objects in Context," *ECCV*, 2014.
- D. Arya et al., "RDD2022: A multi-national image dataset for automatic road damage detection," *Geoscience Data Journal*, 2024 (replaces the arXiv version).
- Y. Zhao et al., "DETRs Beat YOLOs on Real-time Object Detection" (RT-DETR), *CVPR*, 2024, or the torchvision Faster R-CNN reference (S. Ren et al., *NeurIPS*, 2015), whichever baseline is used.
- B. Efron and R. Tibshirani, *An Introduction to the Bootstrap*, 1993 (for the CIs).

Privacy and re-identification:

- A. Machanavajjhala et al., "l-diversity: Privacy beyond k-anonymity," *ACM TKDD*, 2007.
- C. Dwork, "Differential privacy," *ICALP*, 2006, or C. Dwork and A. Roth, *The Algorithmic Foundations of Differential Privacy*, 2014.
- A. Narayanan and V. Shmatikov, "Robust de-anonymization of large sparse datasets," *IEEE S&P*, 2008.
- Y.-A. de Montjoye et al., "Unique in the crowd: The privacy bounds of human mobility," *Scientific Reports*, 2013 (location and time uniqueness, directly relevant to ward plus day).
- L. Rocher, J. M. Hendrickx and Y.-A. de Montjoye, "Estimating the success of re-identifications in incomplete datasets using generative models," *Nature Communications*, 2019.
- ENISA, "Pseudonymisation techniques and best practices," 2019.
- Regulation (EU) 2016/679 (GDPR).
- The Digital Personal Data Protection Act, 2023 (India), and the DPDP Rules, 2025.

Access control, audit logs and workflows:

- R. S. Sandhu et al., "Role-based access control models," *IEEE Computer*, 1996.
- B. Schneier and J. Kelsey, "Secure audit logs to support computer forensics," *ACM TISSEC*, 1999.
- S. A. Crosby and D. S. Wallach, "Efficient data structures for tamper-evident logging," *USENIX Security*, 2009.
- W. M. P. van der Aalst, "The application of Petri nets to workflow management," *J. Circuits, Systems and Computers*, 1998, or D. Harel, "Statecharts," 1987.

Fairness:

- N. Mehrabi et al., "A survey on bias and fairness in machine learning," *ACM Computing Surveys*, 2021.

Check every reference's exact volume, pages and DOI against the publisher page before adding it.

### P11. Contribution and limitations (P0)

- Introduction: state plainly that the contribution is a **system design and an open, tested implementation**, together with an evaluation protocol (leak-free splits, complaint-level screening rates, measured linkage risk). Do not claim a new model or method.
- Limitations: no deployment, no real complaints, no staff or citizen study, models trained on non-Indian data except RDD2022, residual privacy risks from P7, and the fairness limits from P9.
- Future work: the ward-level pilot, the staff study with and without AI (J1), and fitting weights to real closed complaints.

### P12. Deployment cost paragraph (P1)

A short, free, calculated estimate: CPU inference time per photo (measured), photos per complaint, and the complaints per day one CPU core can check. Compare with daily complaint volumes from the public CPGRAMS figures already cited. This answers "no cost or deployment study" with numbers, without claiming a field deployment.

### P13. Response letter (P0)

Write `feedback/response_to_reviewers.md`: quote each comment, give the answer, list the changes with section, table and figure numbers, and use the justifications in Section 9 where an item was not done. Thank the reviewers once at the top, not in every answer.

---

## 9. Justifications: points that are wrong, impractical, or only partly doable

Use these in the response letter. Each one says what was done instead.

### J1. Staff decisions with and without AI assistance (R1.2b): not possible under the constraints

A fair comparison needs real municipal supervisors, real complaints, a controlled study design, and ethics approval. None of these is free online data, and the platform has no deployment. **Instead:** the complaint-level false-flag and false-pass rates (A5) and the workload simulation (A7) quantify what a supervisor would face. The paper names the staff study as the first step of the planned pilot and describes its design (a within-subject study where the same supervisors triage the same complaints with and without the AI panel, measuring decision accuracy and time). The app already logs who decided what and when, so a pilot can measure this without code changes.

### J2. "Photos like those residents would submit" (R1.1): partly doable

Real citizen-submitted civic photos from Indian cities are not available as free public data. **Instead:** the closest free proxy is RDD2022 India, whose images are smartphone photos of Indian roads, plus cross-dataset tests for the other categories (A3). The reviewer's second request, keeping edited copies of one photo together, is fully done (A1) and revealed real leakage in the manhole data (F1), which we report.

### J3. Field pilot, governance outcomes, and a full deployment study (R2 Q1, Q3): not possible

Measuring governance outcomes needs a municipality, real complaints over months, and money. **Instead:** the paper narrows its claims to what is measured (P1, P11), adds the calculated deployment estimate (P12), and adds load tests (C5).

### J4. "Seven gateway stages" counted as a workflow inconsistency (R2 vi): partly a misreading

"Seven gateway stages" in Section III describes the middleware checks every API call passes, not the complaint workflow. "Six steps" is the governance loop, "seven stages" the workflow states, and "five transitions" the main path. These are four different things, and the numbers are each correct. However, the paper used similar words for different things, so the confusion is the paper's fault. **Done:** one glossary (P3) and consistent terms across all sections.

### J5. Evidence that defect size in a photo predicts severity (R2 2.3): no free data can show this

Image coverage depends on camera distance and angle. Proving a link to physical severity needs field measurements (depth, area) that no free dataset provides. **Done instead:** the δ-to-urgency rule is removed (A10). δ remains only as visual evidence for the supervisor, labelled as such. This also removes the unassigned θδ.

### J6. "No new model, method or theory" (R2 Q1): accepted, with framing

The reviewer is right that each component is standard, and also confirms the paper contributes at the systems level. IEEE Access publishes systems papers. **Done:** the paper states the contribution as an integrated, open, tested system plus a reproducible evaluation protocol (P11), and removes wording that suggests methodological novelty. No new method is invented to satisfy the comment.

### J7. Differential privacy (R2 Q4 mentions it among missing literature)

The reviewer asks for the literature, not an implementation. **Done:** DP is cited and discussed as an alternative. It is not implemented, because record-level exports of categorical fields lose most of their usefulness under DP noise at the sizes of one municipality, while k-suppression and minimum cell sizes are standard in official statistics and are measured here (B5). Optional future work: Laplace noise on aggregate counts.

### J8. Cross-validation for every model

Reviewer 2 asks for a held-out test set **or** cross-validation. A held-out, leak-free test set with bootstrap CIs and three seeds (A2) satisfies the request at a fraction of the compute. Grouped 5-fold CV is offered for the two smallest sets if free GPU time allows.

### J9. Low litter recall (R2 2.4)

Free data will not raise litter recall to the level of the other categories; TACO is small and its objects are small. **Done:** the paper presents litter screening as a weak signal with a high flag rate, reports the measured complaint-level rates, and relies on the human review path. It no longer calls the check "validation". The class-merging ablation (A8) shows whether a different label scheme helps.

### J10. Remove reference [37] (R2 Q5): disagree conditionally

The reviewer is right that the submitted system did not implement k-anonymity. **Done:** the system now enforces k ≥ 5 suppression on record exports and minimum cell sizes on aggregates, and the paper measures equivalence-class sizes on public 311 data (B5). [37] is now the basis of an implemented and evaluated rule, so it stays. If B5 is not completed, remove [37] as the reviewer asks.

### J11. References [16] and [18] (R2 iv, Q5): agreed

The reviewer is right. The pothole set has a licence but no documented provenance; the manhole set's licence could not be confirmed. **Done:** pothole moves to RDD2022 (D2); the manhole set fails the provenance criterion, so the open manhole category was withdrawn (D3, F18); Eq. (1) now lists all five criteria and Fig. 4 shows them (D4).

### J12. Points where the reviewers are fully right and no defence is offered

Validation-set reporting (F1, F2), the missing τ and θδ justification, the Eq. (4) gap, pseudonymisation called anonymisation, missing security tests, missing mAP citations, and overstated claims. The response letter should simply agree and point to the changes.

---

## 10. Order of work

Work in this order. Each phase depends on the one before.

1. **Code honesty and security (about 1 week):** G1, C8, B2, B3, B4, B6, C2, C3, C4, C7, then C1 and C6 tests, C5 load test. Fix F4 to F12 before anything is released.
2. **Data and splits (2 to 3 days):** D1 to D4 decisions, A1 splits, external test sets for A3.
3. **Training and evaluation (about 1 week, mostly waiting for free GPU):** A2 with 3 seeds, A8 baselines, A4 τ sweep, A5 complaint-level, A3 cross-dataset, A11 fairness, A6 error analysis, A7 simulation.
4. **Privacy analysis (2 to 3 days):** B5 on Chicago 311, then fix k and the generalisation in code.
5. **Release, split on 2026-11-27 (user decision):**
   - **5a, before the paper:** E1 and E2 without the archive. Licences, third-party notices, image audit, weights licence, `reproduce.sh`, citation file.
   - **5b, last, before submission:** tag, Zenodo archive and DOI, E3 paragraph in the paper. A Zenodo version cannot change once published, so it must hold the final paper's scripts and figures.
6. **Paper (about 1 week):** P1 to P12, regenerate all tables and figures from `results/*.json`.
7. **Response letter (1 day):** P13, using Section 9.
8. **5b:** see above.

## 10a. Progress log

### Phase 1, code honesty and security: done on 2026-11-24

| Action | Status | Where |
|---|---|---|
| G1 AI service | Done. FastAPI service, backend client with timeout and 2 retries, `aiAnalysis` on the complaint, supervisor panel with flag, s*, δ and annotated photos. δ is evidence only; the AI never changes stage or urgency (A10). τ = 0.25 for all four until A4. | `ai_service/`, `backend/services/aiClient.js`, `mobile/src/screens/supervisor/TriageDetailScreen.jsx` |
| C8 Server-side urgency | Done. Answers validated and scored on the server; client urgency ignored; answers and score published. | `backend/constants/questionnaires.js`, `backend/utils/urgency.js` |
| B2 EXIF removal | Done for complaint and proof photos. Files that do not decode as images are refused. | `backend/middleware/uploadMiddleware.js` |
| B3 Text redaction | Done for title, description, location, staff remarks and proof notes. Filing screen asks for no names or phone numbers. | `backend/utils/redactText.js` |
| B4 Research key | Done. `RESEARCH_HMAC_KEY` required (≥ 32 bytes, not equal to `JWT_SECRET`), per-researcher keys, ISO week instead of day, no closing date, whole-day resolution time. | `backend/config/env.js`, `backend/utils/researchProjection.js` |
| B6 Allow-list | Done for registry and tracker. The tracker shows actors as role labels only (no staff names), as in the B1 table. | `backend/utils/publicView.js` |
| C2 OTP | Done. Hashed codes, 5 attempts per code (atomic), single use, CSPRNG codes, 3 requests per email per 15 min, 20 per IP per hour, limits on login and filing. | `backend/utils/otp.js`, `backend/middleware/rateLimits.js` |
| C3 Concurrency | Done. Atomic daily export counter (UTC day); optimistic concurrency on complaints (loser gets 409); citizen emails sent only after a successful save. Removing the fix makes the 3 race tests fail (checked). | `backend/models/ExportQuota.js`, `backend/models/Complaint.js`, `backend/services/complaintWorkflow.js` |
| C4 Audit log | Done. Hash chain with unique sequence numbers, append-only hooks, `npm run audit:verify`, admin endpoint, head hash published in `GET /api/public/stats`. | `backend/utils/auditLog.js` |
| C7 Regex injection | Done for registry, supervisor, admin and user searches; operator injection and page size also fixed. | `backend/utils/escapeRegex.js` |
| C1 Test suite | Done. 61 backend tests (16 from Fig. 15 plus 45 new) and 9 service tests; GitHub Actions workflow with an end-to-end job. | `backend/tests/`, `ai_service/tests/`, `.github/workflows/test.yml` |
| C6 Privacy tests | Done; the k-anonymity tests were added in phase 4. | `backend/tests/privacy.test.js` |
| C5 Load test | Done on the M5 laptop, 10,000 seeded complaints, 60 s per scenario. At 50 connections, with no errors: registry list 1,792 req/s (p50 28 ms, p99 38 ms), tracker 6,840 req/s (p50 7 ms, p99 10 ms), research records with audit logging 1,237 req/s (p50 40 ms, p99 45 ms). At 200 connections, 2 % to 7 % socket errors; macOS caps the listen backlog at 128 (`kern.ipc.somaxconn`), and the load generator runs on the same machine. Filing with a 263 KB photo at 20 connections: 4 req/s, p50 4.3 s, with or without the vision service (F15). | `backend/tests/load/run.js`, `backend/tests/load/results/` |

**Still open from phase 1 scope:** k ≥ 5 suppression (B5, phase 4 by design); B7 consent checkbox (not in phase 1); G2 docs beyond the README setup sections.

**New findings during phase 1:**

- **F15. Filing is CPU-bound on password hashing.** Each first-time citizen gets an account whose random password is hashed with `bcryptjs` at cost 12 (pure JavaScript, blocks the event loop for about 250 ms). The load test shows this caps filing at a few complaints per second on one process. Options: skip creating a password for citizens who never log in, or move to the native `bcrypt` package. Report it in the paper as a measured limit if not fixed.
- **F16. Quick look at the sample photos supports R1.2.** On `docs/sample-images/`, the litter model scores a street-light photo at 0.92 (an unrelated photo would pass) and an Indian garbage heap at 0.16 (a valid complaint would be flagged); the pothole model scores the garbage photo at 0.29, above τ = 0.25. Three photos prove nothing statistically, but they show why A5 (complaint-level false-flag and false-pass rates with negatives) is needed.
- **F17. Audit-log contention under load (fixed).** The first load run gave 570 errors (HTTP 500) out of about 30,000 research requests at 200 connections, because parallel appends raced for the next chain sequence number. Appends are now queued within one process; the unique index still protects the chain when several processes write. Afterwards there were no HTTP errors, and throughput at 50 connections went from 772 to 1,237 req/s.
- **The vision service does not slow filing:** p50 filing time is 4.27 s without the service and 4.30 s with it, because the model call runs after the response.
- Load test percentiles: `autocannon` reports p97.5, not p95. Report p97.5 or switch to k6 if the paper must show p95.

### Phase 2, data and splits: done on 2026-11-26

Details and sources: `ai_model/DATASETS.md`. Numbers: `ai_model/results/split_audit_old.json`, `split_report.json`, `yolo_sets.json`.

| Action | Status | Where |
|---|---|---|
| D1 Provenance and licences | Done. Every dataset checked against its publisher page or API on 2026-11-24, with collector, licence, DOI or URL, version, source photos versus copies, redistribution and role. | `ai_model/DATASETS.md` |
| D2 Pothole | Done. Moved to **RDD2022 class D40** (boxes, CC BY 4.0). India is held out completely as the external test set. Training pool: Japan, Czech Republic, China motorbike (United States removed on 2026-11-27, F25), split 70/15/15 by source group inside each country. Norway (10.6 GB) and China drone (aerial) are left out. The Roboflow set becomes an external test set. | `scripts/fetch_rdd2022.py` |
| D3 Open manhole | Done: **category withdrawn**. The Kaggle set fails Eq. (1) (F18). A synthetic CC BY replacement (Zenodo doi:10.5281/zenodo.21291309) was considered and rejected because it has no real photos. Removed from the API category list, the app, the vision service, the seed script, the load test, the notebooks and the weights. Earlier complaints keep the category; their questionnaire stays so their published urgency can be recomputed. A test checks that the API refuses the category. | `backend/constants/categories.js`, `ai_model/DATASETS.md` |
| D4 Eq. (1) | Done. Eq. (1) has five criteria. Fig. 4 redrawn from a script with a licence column and the corrected open manhole row; screening text says three of ten categories qualify and why open manholes were withdrawn. | `ai_model/scripts/fig_dataset_screening.py`, `paper/.../figs/fig04.jpg` |
| D1 in the paper | Done. Table IV lists dataset, licence, collector and capture, DOI, splits, external test sets and model for the three categories. References updated: RDD2022 journal version and data DOI, TACO data DOI, Kaggle set cited as the withdrawn dataset. | `paper/.../main.tex` |
| A1 Splits | Done. Groups from file stems plus near-duplicate hashes (64-bit dHash ≤ 10 bits as candidates, confirmed by 256-bit dHash ≤ 24 bits, mirror images included). 0 shared groups, 0 cross-split near-duplicate pairs and 0 cross-split stems in all three categories. Val, test and external sets keep one image per group. | `ai_model/scripts/make_splits.py`, `ai_model/splits/` |
| A3 External test sets | Done for pothole (India, Roboflow) and litter (TACO unofficial). Graffiti: a second set was searched for on 2026-11-26 and none is both open and documented (City Risks: provenance not stated; 17K-Graffiti: on request only; Lisbon: on request only), so the untouched STORM test split is the only test. PlastOPol (litter, CC BY 4.0, verified) is an optional extra test; it is 7.7 GB on Zenodo, so it would be fetched on Colab in phase 3. | `ai_model/splits/external/`, `ai_model/DATASETS.md` |
| CI | Fixed. The backend job had never run: Node 22 on GitHub does not accept a folder as `--test` argument (`Cannot find module .../tests`). The test script now uses the glob `tests/**/*.test.js`, and the end-to-end job waits for `/health` instead of a fixed 15 s. Backend, vision-service and end-to-end jobs all passed on GitHub (run 45847742015). | `backend/package.json`, `.github/workflows/test.yml` |

**Old splits, measured (A9):**

| Old set | Train images / source photos | Val images / source photos | Val images sharing a source photo with train |
|---|---|---|---|
| Open manhole (Kaggle; category now withdrawn) | 1,123 / 460 | 480 / 169 | **262** (65 source photos); 368 of the 480 are augmented copies |
| Pothole (Roboflow) | 720 / 238 | 60 / 60 | 1 (all 60 val images are Roboflow augmentations) |
| Litter (TACO) | 1,214 / 1,212 | 214 / 214 | 1 |
| Graffiti (STORM; "val" was the official test split) | 813 / 812 | 209 / 209 | 0 |

**New splits (images; source groups are equal to images in val and test):**

| Category | Source | Train | Val | Test | External test sets |
|---|---|---|---|---|---|
| Pothole | RDD2022 D40 (Japan 1,219 / Czech 135 / China 144 train images; US removed on 2026-11-27, F25) | 1,498 (1,199 with a pothole) | 319 (259) | 318 | RDD2022 India 1,911 (1,530 with a pothole); Roboflow 297 |
| Pothole with India (deployed, added 2026-11-26) | as above plus RDD2022 India 70/15/15 by group | 2,836 (2,266) | 606 (490) | 604 | Roboflow 297 |
| Litter | TACO official | 1,000 | 214 | 214 | TACO unofficial 2,308 (6 near-duplicates of TACO official dropped) |
| Graffiti | STORM | 670 | 143 | 209 (official test) | none |

**Still open from phase 2 scope:**

- Negatives for A5 (COCO 2017 val) are fetched in phase 3.
- The abstract, the results section (Table V, Figs. 10 to 14), the graphical abstract caption and Fig. 5 still show the old four-category numbers, including open manholes. They are regenerated from the new results in phase 6.
- Downloads from Zenodo ran at 80 to 160 KB/s from the home network. Large Zenodo files (PlastOPol, COCO if needed) go to a Colab VM disk, not to personal cloud storage (4 GB limit).

**New findings during phase 2:**

- **F18. The Kaggle open manhole set fails Eq. (1).** Its licence is CC BY-NC-SA 4.0. The uploader is named, but nobody is named as having taken the images, and no source is given. The dataset's cover image has an Adobe Stock preview file name. The paper's own rule therefore excludes it. Under the old Fig. 4 it had the "documented source" circle filled, which was wrong.
- **F19. The RDD2022 licence is CC BY 4.0** on the figshare record, not CC BY-SA 4.0 as this plan said. The P10 reference and Table IV should say CC BY 4.0.
- **F20. TACO unofficial annotations mix licences.** 1,432 of 3,831 images are OpenLitterMap photos under the ODbL (a database licence). Only the 2,399 TACO-hosted "CC" images are used; 2,328 could still be downloaded, and 2,308 remain after removing rotated thumbnails and duplicates.
- **F21. A 64-bit dHash alone gives false duplicates on plain walls.** On STORM it matched 5 unrelated graffiti pairs. The 256-bit confirmation step separates the two cases cleanly: true duplicates differ in at most 11 of 256 bits, false matches in at least 43. The old Roboflow pothole split contains one true near-duplicate pair (`pic-88` in val, `pic-142` in train), and so does the old TACO split (`taco_1081` and `taco_1110`).
- **F23. Open manhole category withdrawn.** The system now offers three categories. In the response letter this is the screening rule working as designed, not a loss: the paper's own Eq. (1) excludes the only real-photo dataset.
- **F24. CI never ran the backend tests** (see the CI row above). Both earlier pushes showed a failed run; only the vision-service job passed.
- **F25. RDD2022's United States subset is Google Street View imagery** (RDD2022 paper, data collection section: "the data for the United States comprises Google Street View Images"). Its CC BY 4.0 label cannot cover Google's images, so it fails the licence criterion of Eq. (1). Found on 2026-11-27 through a Google watermark in the A6 error figure; the subset was removed and the pothole models retrained.
- **F22. RDD2022 is box-only**, so the pothole model becomes a box detector. This removes the last mask-based model that δ in Eq. (4) relied on, apart from litter. A10 (drop the δ-to-urgency rule) is now required, not just recommended.

### Phase 3, training and evaluation: done (2026-11-26 to 2026-11-27)

**Rule for numbers:** every number about models comes from a JSON file written by a script
(`ai_model/results/{train,eval,scores,complaints}/<run>.json`). `ai_model/scripts/summarize.py`
turns them into `ai_model/results/phase3_summary.md`. The paper's tables are taken from that file
only. Numbers in this log are copied from it and name their source.

**Pipeline (all in `ai_model/scripts/`):** `train.py` (one run; checkpoint chosen on val only) →
`evaluate.py` (test and external sets once; bootstrap 95 % CIs over images, 1,000 resamples;
per-country for potholes; CPU latency) → `score_images.py` (highest confidence per image, as the
service computes s*) → `complaint_eval.py` (τ rule, complaint-level rates with Wilson CIs, fairness,
workload simulation) → `error_examples.py` (A6 figure) → `summarize.py`. Colab runs use
`notebooks/colab_train.ipynb`, which rebuilds the data from public sources with `prepare_sources.py`.

**Decisions and why:**

| Date | Decision | Why |
|---|---|---|
| 2026-11-26 | Training budget 40 epochs, early stopping after 10 (paper: 60 and 15) | The user limited the laptop queue to 4 hours. Every model in the comparison gets the same budget. Must be stated in the paper. |
| 2026-11-26 | Laptop runs YOLOv8n seed 0 and YOLO11n; Colab runs RT-DETR-l, YOLOv8s, pothole YOLO11n and seeds 1 and 2 | Laptop budget; RT-DETR-l is too heavy for the laptop. Seeds are optional: the reviewers asked for CIs, which the bootstrap gives. |
| 2026-11-26 | τ rule: largest τ on 0.05 to 0.90 (step 0.05) with validation false-flag rate ≤ 20 %; chosen on validation data only (k's val split, other categories' val splits, half of the COCO photos), reported on the test data | A4. Keeps τ selection away from the test set. |
| 2026-11-26 | Unrelated photos: 1,000 seeded COCO 2017 val photos (`scripts/fetch_coco_negatives.py`); for litter, the 124 with a bottle, cup or wine glass are left out | A5. COCO has no pothole or graffiti class; some COCO street scenes may still show one (checked in A6). |
| 2026-11-26 | **India gap found, India-trained pothole model added.** The pothole model trained without India scored far lower on Indian photos than on its own test set and flagged about two thirds of genuine Indian pothole complaints (source: `results/eval/pothole__yolov8n__s0.json`, `results/complaints/pothole__yolov8n__s0.json`). A second split `splits/pothole_india.json` keeps the other countries' splits unchanged and adds India 70/15/15 by group; its India test images are also an external set for the no-India model, so both are compared on identical photos. The India-trained model is the one to deploy; the paper reports both. | User decision after the measurement. It turns A11 from a limitation into a measured gap plus a measured fix. |
| 2026-11-27 | **RDD2022 United States subset removed; pothole models retrained (F25).** The A6 error figure showed a Google watermark on a US test photo; the RDD2022 paper confirms the US images are Google Street View captures. Both pothole splits were rebuilt without them (Japan, Czech and China splits unchanged, checked file by file). The three pothole runs trained with US images were moved to `ai_model/results/superseded/2026-11-27_with_US_streetview/` and may not be used in the paper. Retrained: pothole and pothole_india YOLOv8n on the laptop; pothole RT-DETR-l and YOLO11n on Colab. | User decision. Our own Eq. (1) requires a usable licence, and Reviewer 2 asked about licences. |
| 2026-11-27 | **A8 ablations added to phase 3** (user decision): (a) graffiti YOLOv8n trained from scratch vs COCO-pretrained; (b) litter YOLOv8n trained on TACO's 28 super-categories and scored as one class vs the merged-class model. Same splits and 40-epoch budget; laptop, after the pothole queue (`scripts/run_ablations.sh`). For (b), `scripts/build_litter_supercategories.py` writes the same images and polygons with super-category ids (object counts identical: 3,360 / 785 / 655), and `evaluate.py` scores it with Ultralytics `single_cls`; scoring the merged model this way reproduced its own test numbers exactly (box mAP50 0.4559, mask 0.4397), which checks the method. | Reviewer 2 (i) asks for an ablation justifying the model choice; it was the one experimental item not yet scheduled. |
| 2026-11-27 | **Deployed models:** `pothole_india__yolov8n__s0` (box detector), `garbage_litter__yolov8n__s0` (segmentation), `graffiti__yolov8n__s0` (box detector), copied to `ai_model/weights/` with τ from `results/complaints/<run>.json` in `ai_service/thresholds.json`. (The pothole weights installed on 2026-11-27 morning came from the run with US images; they were replaced at 17:40 by the retrained `pothole_india__yolov8n__s0`, whose τ is also 0.40.) Service and backend tests updated: the pothole model reports no δ (A10); the service fixture is now an RDD2022 India test photo (CC BY 4.0). Service 10 tests, backend 61 tests and the end-to-end test pass. | YOLOv8n per the A8 rule; see "Deployment choice" below for the final latency numbers. |
| 2026-11-27 | **YOLOv8s and seeds 1 and 2 not run** (user decision). Phase 3 ends with seed 0 for every model. | Not requested by the reviewers (checked in `review.md`): Reviewer 2 (i) asks for a held-out test set or cross-validation, confidence intervals, at least one baseline detector and an ablation justifying YOLOv8n. These are covered by the leak-free test split, the bootstrap 95 % CIs, RT-DETR-l and YOLO11n for all three categories, and the two A8 ablations. The paper must say that each number comes from one training run (seed 0) and that the CIs cover test-set sampling, not training variation. |
| 2026-11-26 | Pothole and litter YOLO11n moved from the laptop to Colab (litter at 23:10, on the user's instruction) | To fit the India model into the 4-hour laptop queue. Graffiti YOLO11n stays on the laptop. |
| 2026-11-26 | **Observation:** the laptop YOLOv8n runs for pothole, litter and graffiti all reached their best validation fitness at epoch 39 or 40 of 40 (`best_epoch` in `results/train/*__yolov8n__s0.json`), so they were still improving when the 40-epoch cap stopped them. | The cap may understate YOLOv8n against models that converge faster. Either state this in the paper or rerun the deployed models with 60 epochs on Colab if GPU time allows. |

**Result of the India decision (retrained without US images, 2026-11-27).** Sources: `results/eval/pothole__yolov8n__s0.json` set `pothole_india_test_split`; `results/eval/pothole_india__yolov8n__s0.json` set `test`, `by_stratum`; `fairness_by_country` in `results/complaints/pothole__yolov8n__s0.json` and `results/complaints/pothole_india__yolov8n__s0.json`. On the same 286 Indian test photos, box mAP50 rose from 0.113 (0.084–0.145) without Indian training data to 0.404 (0.357–0.454) with it. The share of genuine Indian pothole complaints flagged fell from 65.2 % (56.1–73.3 %, n = 115, τ 0.50) to 34.8 % (26.7–43.9 %, n = 115, τ 0.40). India stays below Japan (box mAP50 0.612 for the India-trained model; Japanese complaints flagged 17.7 %), so a smaller gap remains. RT-DETR-l and YOLO11n trained without India show the same gap (India test split box mAP50 0.124 and 0.096), so the gap comes from the training data, not from the detector. The earlier numbers from the runs with US images are in `results/superseded/` and are not used.

**Deployment choice (A8 rule, 2026-11-27).** Source: `results/phase3_summary.md`. YOLO11n does not beat YOLOv8n on the test set for any category (box mAP50: pothole 0.645 vs 0.659, litter 0.445 vs 0.456, graffiti 0.692 vs 0.708) at the same CPU latency, so YOLOv8n stays. RT-DETR-l scores higher (pothole 0.683, litter 0.512, graffiti 0.801) but takes 349 to 353 ms per image on the idle laptop CPU against 19.5 to 24.3 ms for YOLOv8n (about 14 to 18 times slower) and is 66.2 MB against 6.2 to 6.8 MB. This is far outside the "2 to 4 times the latency" range of the A8 rule, so YOLOv8n is deployed for all three categories. The graffiti gain (0.801, CI 0.754–0.853, vs 0.708, CI 0.654–0.771) is the largest and should be stated in the paper as the trade-off.

**Ablation results (A8, 2026-11-27).** Source: `results/phase3_summary.md`. (a) Graffiti YOLOv8n from scratch: test box mAP50 0.457 (0.394–0.532) against 0.708 (0.654–0.771) with COCO pretraining, and at its own τ (0.35) it passes 17.2 % of wrong-category and 22.9 % of unrelated complaints against 0.4 % and 1.6 %. (b) Litter YOLOv8n on 28 super-categories, scored as one class: test box mAP50 0.425 (0.365–0.489), mask 0.409, against 0.456 and 0.440 for the merged-class model; at its τ (0.5) it passes 32.1 % of wrong-category and 52.7 % of unrelated complaints against 15.7 % and 28.2 %. Both ablations support the submitted design (pretrained weights, one merged class).

**Run status (2026-11-27 18:30; all numbers in `ai_model/results/phase3_summary.md`).** Every run: seed 0, 40 epochs, patience 10, evaluated on the laptop, scored with the other categories' photos, CPU latency measured on the idle laptop (2026-11-27 17:36). Colab originals of every file the laptop replaced are in `ai_model/data/raw/colab/original_results/` (git-ignored).

| Run | Trained on | Best epoch | Complete |
|---|---|---|---|
| pothole yolov8n s0 | laptop | 39 | yes |
| pothole_india yolov8n s0 (deployed) | laptop | 39 | yes |
| pothole yolo11n s0 | Colab T4 | 34 | yes |
| pothole rtdetr-l s0 | Colab T4 | 40 | yes |
| garbage_litter yolov8n s0 (deployed) | laptop | 39 | yes |
| garbage_litter yolo11n s0 | Colab T4 | 40 | yes |
| garbage_litter rtdetr-l s0 | Colab T4 | 38 | yes |
| graffiti yolov8n s0 (deployed) | laptop | 40 | yes |
| graffiti yolo11n s0 | laptop | 37 | yes |
| graffiti rtdetr-l s0 | Colab T4 | 37 | yes |
| graffiti yolov8n-scratch s0 (ablation a) | laptop | 40 | yes |
| garbage_litter_super yolov8n s0 (ablation b) | laptop | 39 | yes |
| yolov8s, seeds 1 and 2 | — | — | not run (user decision, see above) |

Error figures (A6): `ai_model/results/figures/errors_{pothole,pothole_india,garbage_litter,graffiti}.jpg`, from the YOLOv8n models.

Tests with the deployed models (2026-11-27): vision service 10 passed; backend 61 passed, 1 skipped (the end-to-end test, which needs the vision service); end-to-end test against the running vision service passed. The service fixture `ai_service/tests/fixtures/pothole.jpg` now scores 0.814 with the deployed pothole model (`results/scores/pothole_india__yolov8n__s0.json`).

**Phase 3 is done.** Left for the paper (phase 6): 11 of the 12 runs reached their best validation fitness at epoch 37 to 40 of 40 (`best_epoch` in `results/train/*.json`), so they may still have been improving when the cap stopped them (see the observation above). This must be stated. Each number comes from one training run (seed 0). The CIs cover test-set sampling only.

### Phase 4, privacy analysis: done on 2026-11-27

All numbers below are copied from `analysis/privacy/results/linkage_chicago311.md` (written by `analysis/privacy/scripts/linkage_analysis.py`) and from `backend/tests/load/results/2026-11-27T12-55-33-084Z.json`.

**Data (free).** City of Chicago Data Portal, 311 Service Requests (v6vf-nfxy), public API, fetched by `analysis/privacy/scripts/fetch_chicago311.py` (one request per type and month; the data is git-ignored, the manifest keeps the query, row count and SHA-256). Requests created in 2024 of the three types that match UrbanFix's categories: Pothole in Street Complaint, Fly Dumping Complaint (litter), Graffiti Removal Request. 162,916 rows downloaded; duplicates (18,955) and rows without a ward (514) removed; 143,447 used in 50 wards. Street address and coordinates were not downloaded. Chicago has no urgency field, so every variant is also measured with a simulated three-level urgency (uniform, the worst case for splitting classes). Open manholes are no longer a category, so three request types are used, not the four in B5 step 1.

**Decisions and why:**

| Decision | Why |
|---|---|
| Every released field counts as a quasi-identifier (category, urgency, status, ward, time, resolution) | A neighbour can see whether a pothole was fixed and how dangerous it was. Treating status and resolution as known is the conservative choice. |
| Small system = 10 wards, 1,000 requests a year, 200 random draws; a 10,000-request size reported for context | B5 step 3. The rule below uses the small size only. |
| Rule for the code, written before the results were seen: the finest variant whose median withheld share at k = 5 in the small system with urgency is at most 10 %; if none, the variant with the smallest share | Utility (records kept) against detail; k = 5 itself guarantees the protection. |
| The number of withheld records is not returned to researchers (B5 asked to report it) | By narrowing the filters to one class, a researcher could read a withheld class's size from it, which is what suppression hides. |
| Date filters widen to whole quarters (records) or months (aggregates) | A day-level filter would split a quarter and undo the generalisation, and overlapping ranges could be differenced. |

**Results (small system, median with 5th to 95th percentile).**

- Submitted projection, Eq. (7) (day filed, day closed, exact resolution time): 95.6 % of requests are unique (91.9–97.7 %; Chicago fields only), and across the whole city 77.4 % are unique. An adversary who knows the category, ward and day filed singles out 71.0 % (67.2–75.4 %) of requests. This confirms R2's point.
- Phase-1 code (ISO week filed, resolution in whole days): k < 5 for 96.5 % of requests (91.7–99.0 %), and for 100.0 % with urgency. The adversary singles out 31.3 % (27.6–35.5 %).
- No variant meets the 10 % rule in the small system. With urgency, the withheld share is 54.0 % for quarter filed with a resolution band (G) and 35.8 % (30.9–42.0 %) for quarter filed with no resolution (H). Rule result: **H**.
- H in other sizes (with urgency): 2.0 % withheld in the 10,000-request system and 0.4 % across the city. Without urgency the small system withholds 11.8 %.
- After k = 5 suppression no adversary singles out a request in any variant, population or draw (largest share 0.0 %). The remaining risk is homogeneity: in H after suppression, 64.0 % of requests sit in a group that shares one status, so the adversary learns the status. Status is public in the registry and visible on the street, so this is reported, not treated (l-diversity, P10).
- Aggregates: in the small system 70.2 % (65.2–74.4 %) of non-empty ward × category × month cells hold 1 to 4 requests, against 3.0 % for the city. A minimum cell size of 5 hides these.

**Code (B5).**

- `backend/utils/researchProjection.js`: records are (recordId, category, urgency, status, ward, filedQuarter), with no closing date or resolution time. Classes are counted in MongoDB over every matching complaint, and classes under `K_ANONYMITY = 5` are withheld. Records are ordered by class, then by record ID, so the order says nothing about filing times within a class. Aggregate cells under `MIN_CELL = 5` show no numbers. The resolved count is hidden when the resolved or the unresolved part has 1 to 4 complaints, and the mean resolution time is hidden when it rests on fewer than 5 closed complaints. Researchers get resolution times only from these aggregates.
- `backend/controllers/researchController.js`: query, export and dashboard go through suppression. Responses carry a `privacy` note giving k, the minimum cell size and the date rule.
- `mobile/src/components/BarRows.jsx`: a suppressed cell is shown as "fewer than 5".
- Tests (`backend/tests/privacy.test.js`):
  - withheld classes of 4 and of 1, with no withheld count returned;
  - a day filter returns the whole quarter;
  - aggregate cells below 5 and small resolved parts are hidden;
  - record IDs per grant, with classes of 5.
  
  Backend: 65 tests, 64 passed, 1 skipped (end-to-end).
- Load: research records at 50 connections run at 353 req/s (p50 140 ms, p99 181 ms, no errors) against 1,237 req/s before. Each request now counts classes over all matching complaints. A first version that read every complaint in Node ran at 11 req/s and was replaced.

**For the paper (P7, phase 6), stated plainly:**

- The public registry shows every complaint's category, ward, street location and exact filing and closing times, with no filer identity, for accountability. Chicago's own open 311 data does the same.
- The research records therefore add nothing the registry does not already show. The k = 5 rule on research records is defence in depth. It keeps the research tier safe on its own if a municipality restricts or turns off the registry, and it covers bulk, machine-readable exports that leave the system.
- The real residual risks are in the registry content: free text (B3 removes patterns but not names) and photos (B7).
- Minimum cell sizes protect each table, not differences between tables from different filters.

### Phase 5a, release preparation: done on 2026-11-27

The repository was already public on GitHub. Phase 5 was split (see section 10): the tag and the Zenodo archive wait until the paper and the response letter are final.

**Licences**

| Part | Licence | Reason |
|---|---|---|
| Source code | MIT (`LICENSE`) | Plan E1 default. |
| Model weights (`ai_model/weights/*.pt`) | AGPL-3.0 (`ai_model/weights/README.md`) | They are fine-tuned from Ultralytics' pretrained `yolov8n.pt` and `yolov8n-seg.pt`, which are AGPL-3.0. The training data (RDD2022, TACO, STORM) is CC BY 4.0, which allows this with attribution. The plan's "CC BY-SA weights" case does not arise: RDD2022 is CC BY 4.0 (D1). |
| Ultralytics library | AGPL-3.0 | Imported by `ai_service/` and `ai_model/scripts/`; installed from PyPI, not shipped. Stated in `THIRD_PARTY_NOTICES.md`. |

**Image audit.** Every tracked image was checked for where it came from.

| Finding | Action |
|---|---|
| Error figures (A6) drew 9 COCO photos: 1 CC BY 2.0, 1 CC BY-SA 2.0, 7 NonCommercial (licence ids from `instances_val2017.json`). NonCommercial photos cannot appear in a paper published under CC BY (IEEE Access). | `error_examples.py` now draws a COCO photo only when it is CC BY, has no known copyright restriction, or is a US Government work. Other photos stay in the selection but appear as a grey tile naming the COCO id and licence. The selection was checked to be identical before and after. The four figures were regenerated, and each `.json` now lists every photo's dataset and licence. One COCO photo is drawn (id 80153, CC BY 2.0), credited in `THIRD_PARTY_NOTICES.md`. |
| The superseded pothole error figure (run with United States images) contained a Google Street View photo. | The `.jpg` was deleted; its `.json` stays (it names the photos only). |
| `docs/sample-images/` held 3 photos of unknown source. One file name has a stock-photo site's numbering. | Deleted. F16 (section 10a, phase 2) still describes what they showed. |
| `ai_service/tests/fixtures/pothole.jpg` | RDD2022 India, CC BY 4.0; already documented. |
| Author photos (`paper/.../latex/photos/`) and author e-mails in `main.tex` | Kept. They are the authors' own and appear in the published paper. |
| **Open:** submitted-paper figures that show dataset photos. `paper/figures/05_ai_models/F23`, `F32`, `paper/urbanfix_paper/figs/det_open_manhole.jpg` and `latex/figs/fig10.jpg` panel (c) contain Kaggle Road Hazards photos (checked by eye) (no stated source, D3). F19, F21 and F25 show Roboflow, TACO and STORM photos (CC BY 4.0). | Left in place as the record of the submitted version. Phase 6 replaces fig10. **Gate for 5b:** delete every figure with Kaggle photos before the tag. |

The git history still holds the deleted files. Removing them from history would need a force-push to main. This was not done.

**Reproduction**

- `reproduce.sh tables` reruns `summarize.py` on the committed result files and fails if `phase3_summary.md` changes. It runs in CI as a new `results` job.
- `reproduce.sh privacy` downloads the Chicago 311 extract if it is missing and reruns the linkage analysis. It then compares every result with the committed JSON, ignoring the download record. Run on 2026-11-27, every result matched.
- `reproduce.sh load` runs the load test; its numbers depend on the machine.
- README has a new "Reproducing the results" section, with a table from each result file to the script that writes it and that script's input.

**Other files.** `THIRD_PARTY_NOTICES.md` (datasets, weights, software, photos inside figures), `CITATION.cff` (five authors, MIT), README "Licence and citation" section.

**Checked and unchanged.**

- Split lists for every set are committed (`ai_model/splits/`, 2.9 MB).
- Download scripts:
  - `fetch_rdd2022.py`, `fetch_taco_unofficial.py`, `fetch_coco_negatives.py` and `fetch_chicago311.py`.
  - TACO official and STORM are fetched by `notebooks/00_download_datasets.ipynb` and `colab_train.ipynb`.
- No `.env` or key is tracked; only `.env.example`.
- The `complaintsystem.gov` addresses are placeholders in the seed script and e-mail defaults.

**Left for 5b (after phases 6 and 7)**

1. Delete the figures with Kaggle photos (gate above).
2. Decide whether the Chicago 311 extract (18 MB, 2.2 MB gzipped) goes into the Zenodo archive, after reading the City of Chicago Data Portal terms. If it is not archived, the linkage analysis depends on the City not changing its 2024 records. `reproduce.sh privacy` reports such a change.
3. Fill in the paper DOI and the version in `CITATION.cff`.
4. Tag the release, and archive it on Zenodo through the GitHub integration (the user's Zenodo login).
5. Replace the DOI placeholder (`\archiveDOI` in `paper/urbanfix_ieee_access_rev1/latex/main.tex`) in the paper's Code and Data Availability section, which phase 6 wrote. Cite the concept DOI, so a later version keeps the same citation.

### Phase 6, paper: done on 2026-11-27

**Where.** The revision is a new copy, `paper/urbanfix_ieee_access_rev1/` (user decision). The submitted copy `paper/urbanfix_ieee_access/latex/` was restored to its state at submission (commit 1370833). It had picked up the phase 2 edits to Table IV and Fig. 4. `fig_dataset_screening.py` now writes Fig. 4 into the revision.

**Rule for numbers, enforced.** `main.tex` contains no number from a result. Every number is a macro in `latex/generated/numbers.tex` (351 macros). Every results table body is a `latex/generated/tab_*.tex` file. Both are written by `scripts/build_paper_data.py` from the committed result files. `./reproduce.sh paper` rebuilds them and fails if they differ, and it runs in CI.

Numbers typed by hand that do not come from our results:
- Literature and CPGRAMS figures in the introduction.
- Dataset sizes in Fig. 4, from `fig_dataset_screening.py`.
- Code constants: 5 attempts, 72 h, 180 days, 5,000 rows, 5 exports a day.
- The seeded demonstration numbers of Fig. 16, unchanged from the submission.

**Code changes made for the paper.**

| Item | Change | Test |
|---|---|---|
| F15 | A citizen who only files, and an account waiting for its invite, get an unusable marker (`!unusable:` plus 32 random characters) instead of a bcrypt hash. `comparePassword` refuses anything that is not a bcrypt hash. The validators refuse chosen passwords with the prefix, so every real password is still hashed. Filing went from 4 to 40 requests per second (p50 4,274 to 437 ms). | Unusable marker stored and login refused; prefix refused at registration |
| B7 | Publication consent. The filing screen has a checkbox on the review step. The server refuses a complaint without `consent: true` before the code is used, and stores `publicationConsentAt`. | Refused without consent; the same code still works afterwards |
| P9 | Ward monitoring. `GET /api/admin/stats` returns `wardMonitoring`: per ward, the complaints filed, the model-checked share flagged, and the median days to closure. The admin dashboard shows them in a "By ward" table, with a note that counts reflect who reports. | Flag rate and median checked on seeded complaints |
| P7 wording | User-visible "anonymised" changed to "pseudonymised" in the app, emails, README and docs. The stored scope id `anonymised_records` is unchanged; renaming it would need a data migration. The docs say so. | none (text only) |

Backend: 69 tests, 68 passed, 1 skipped. Vision service: 10 passed. Both are recorded as JUnit reports (`*/tests/results/junit.xml`, written by `./reproduce.sh tests`, paths and host name stripped). The mobile changes were checked by parsing only. The app was not run on a device.

**New load test** (`backend/tests/load/results/2026-11-27T17-38-29-761Z.json`), all scenarios on the current code:
- At 50 connections:
  - Registry: 1,575 req/s.
  - Tracker: 6,552 req/s.
  - Research records: 337 req/s.
  - No errors in any scenario.
- At 200 connections, error rates were:
  - Registry 27.3 %.
  - Tracker 2.2 %.
  - Research records 2.5 %.
  - The cause is the macOS backlog of 128, as in phase 1. The paper reports it as a limit of the test machine.
- Filing at 20 connections: 40 req/s.

**Paper changes (P1 to P12)**

| Item | Done |
|---|---|
| P1 | Title as suggested. "AI-validated" became "AI-assisted" or "screening". "Accountable" became "auditable". Keywords now include pseudonymisation, k-anonymity and audit logs. |
| P2 | New abstract. It gives test mAP50 with a CI, complaint-level flag and pass rates, and the India result. It says the model never rejects, the workflow figures come from seeded data and there was no deployment, and the privacy risk was measured on Chicago 311. |
| P3 | Table III, "Counts used in this paper": loop 6, states 7, main path 5, request checks 7, roles 6. Fig. 3 now shows seven numbered request checks. |
| P4 | Table VII (datasets) uses generated split counts. The split procedure is described, with the measured leak in the old open manhole split (262 of 480 validation images). |
| P5 | τ_k per category (Eq. 11), with the rule. θδ and the δ urgency rule are removed. δ is litter-only descriptive evidence, with a sentence saying it is not a severity measure. Eq. 2 is computed on the server. Fig. 6 is redrawn in TikZ: the model can only set the flag. |
| P6 | Table VIII: test metrics with CIs and a validation column. Table IX: baselines and ablations with latency and size. Table X: complaint screening at τ_k and at 0.25. Table XI and Fig. 14: geography. Fig. 11: τ sweep. Fig. 10: training curves, labelled. Fig. 12: examples. Fig. 13: error analysis. The workload simulation is stated as a simulation. Eq. 10 cites VOC and COCO. Stated plainly: seed 0 only, CIs cover test sampling only, 40-epoch cap with all three models still improving. |
| P7 | Section IV-E rewritten in the planned structure: assets, adversaries (a) to (e), controls (Table V), pseudonymised versus anonymised, keys (Eq. 9, per-researcher HMAC), linkage measurement (Table VI, all eight variants), the registry framing, residual risks, and law (DPDP Act s. 17(2)(b), DPDP Rules 2025, GDPR). Eq. 7 is the new projection. Table IV (disclosure) is updated. |
| P8 | Table XII (tests by group, from the JUnit reports), Table XIII (load), and the F15 finding with its fix. Fig. 15 is removed. The archive DOI is a placeholder until 5b. |
| P9 | Fairness subsection: who reports, access, category selection, model bias by place (measured), and the monitoring now in the admin dashboard. |
| P10 | 20 references added, b41 to b60. Each was checked against Crossref by DOI or query, or against the official source: the PIB note for the DPDP Rules, USENIX for Crosby and Wallach, statute text for s. 17(2)(b). Corrections found: Mehrabi et al. is vol. 54, no. 6, 2022 (print); Dwork and Roth is pp. 211 to 487. |
| P11 | The introduction states the contribution as system design plus an open, tested implementation plus an evaluation protocol, with no new model. Limitations rewritten. |
| P12 | Deployment cost subsection: 3 photos × 24.3 ms gives about 1.2 million complaints a day on one core, against 7,178 a day for CPGRAMS (0.6 % of a core). The cost that matters is triage time. |

**Figures.**
- Removed:
  - fig11 to fig15 (old validation figures and the API test tiles).
  - fig03, fig06 and fig07 as JPGs, replaced by TikZ in `latex/tikz/`. They are rebuilt from the code: 3 models, 8 collections, the hash-chained log, the consent check.
- fig05 is redrawn from `backend/constants/questionnaires.js`. The old version was labelled "pothole, manhole".
- fig10 is redrawn:
  - One test photo per category, chosen by rule: the median s* among passing valid photos.
  - Three app screens from the submission.
  - The old research-profile screen was dropped because it said "anonymised".
  - The open manhole panel is gone.
- The graphical abstract is regenerated with test mAP50 and its CIs. The old one showed the Kaggle manhole photo and validation numbers. The caption is rewritten.

**Compiling.** The official class needs pdfLaTeX. Installing TinyTeX was blocked by the tool's permission check, so the manuscript was compiled with tectonic and a stand-in class that loads IEEEtran. That gave 19 pages, no undefined references, and no overfull box over 10 pt. The final layout must be checked with the official class on Overleaf (free) or with a local pdfLaTeX.

**Findings during phase 6**
- **F26.** The pothole model flags 27.1 % of valid test complaints, above the 20 % the τ rule allowed on validation. The rule's bound does not carry over exactly from validation to test. The paper says so.
- **F27.** For the Czech Republic (n = 11), training with India raised the flag rate from 54.5 % to 81.8 %. The intervals are too wide to rank, and the paper says that. A larger Czech test set would be needed to know whether adding India hurt there.
- **F28.** The supervisor cannot change a complaint's urgency in the code. The submitted paper said the supervisor "sets the priority". The revision says urgency stays u_Q and the supervisor decides acceptance.

## 11. Done checklist

- [x] No source photo appears in two splits (script output saved in `ai_model/results/split_report.json`).
- [x] Every number in the paper comes from a `results/*.json` file in the release (generated macros and tables, checked in CI; phase 6).
- [x] Test-set metrics with 95 % CIs (seed 0 only; seeds 1 and 2 dropped by user decision, 2026-11-27).
- [x] Complaint-level false-flag and false-pass rates per category.
- [x] τ_k chosen by a written rule; θδ and the δ urgency rule removed (code phase 1 and 3, paper phase 6).
- [x] At least one non-YOLO baseline and two YOLO variants compared (RT-DETR-l, YOLOv8n, YOLO11n).
- [x] RDD2022 India cross-dataset result.
- [x] AI service exists in the repository and the backend stores `aiAnalysis` and `needsReview`.
- [x] Urgency computed on the server from stored answers.
- [x] EXIF removed, text redacted, registry allow-list, consent checkbox (consent added in phase 6).
- [x] Separate research HMAC key, per-grant keys, k ≥ 5 suppression (phase 4, 2026-11-27).
- [x] Linkage analysis on Chicago 311 in the paper (Table VI, phase 6).
- [x] OTP attempt limit and rate limits, with tests.
- [x] Concurrency, audit-integrity, privacy and load tests in `backend/tests/`, run by CI (all three CI jobs passed on 2026-11-26, run 45847742015; the load test runs by hand with `npm run test:load`; k-anonymity tests added in phase 4).
- [x] Dataset provenance and licence documented; Eq. (1) has five criteria. (Fig. 4 redraw left for phase 6.)
- [x] One glossary for stage counts used everywhere (Table III, phase 6).
- [x] Fairness subsection with the measured geographic gap (phase 6).
- [x] All new references checked against Crossref or the official source (phase 6).
- [ ] Public repository with a Zenodo DOI and a data availability statement. (5a done 2026-11-27: licences, notices, image audit, `reproduce.sh`; DOI and statement in 5b.)
- [x] Title and claims say "AI-assisted", "auditable", "pseudonymised" (phase 6).
- [ ] Response letter answers every numbered comment.
