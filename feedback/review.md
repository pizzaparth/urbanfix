# This was the part which was written in the mail.

Reviewers' Comments to Author:

Reviewer: 1

Comments:
1. Test the AI on a separate set of photos like those residents would submit. Keep edited copies of the same photo together so they cannot appear in both training and testing.
2. Report how often the AI flags valid complaints or lets unrelated photos through. Compare staff decisions with and without AI assistance.
3. Explain what personal details are removed from public photos, descriptions, and locations. Check whether the data shared with researchers could still identify someone.

Additional Questions:
Please confirm that you have reviewed all relevant files, including supplementary files and any author response files, which can be found in the "View Author's Response" link above (author responses will only appear for resubmissions): Yes, all files have been reviewed

1) Does the paper contribute to the body of knowledge?: Yes. It shows how AI photo checks, staff review, and repair tracking can work together in one system.

2) Is the paper technically sound?: No. The study needs a separate test set and should measure how well the AI checks whole complaints.

3) Is the subject matter presented in a comprehensive manner?: Yes, They are relevant.

4) Are the references provided applicable and sufficient?: No.

5) Are there references that are not appropriate for the topic being discussed?: No

5a) If yes, then please indicate which references should be removed.:


Reviewer: 2

Comments:
The paper presents a thoughtfully integrated civic platform and is clearly written, but the following issues must be addressed before resubmission: (i) evaluate all four detectors on an independent held-out test set (or by cross-validation), report confidence intervals, add at least one baseline detector and an ablation justifying YOLOv8n, and state and justify θδ and τ; (ii) reconcile Eq. (4), which assumes masks, with the box-based manhole and graffiti models, and justify or remove the δ-to-urgency rule; (iii) rewrite the privacy section as a real analysis — define the adversary, address key management and linkage risk from deterministic IDs, day and ward, replace or substantiate the k-anonymity citation [37], discuss PII in free text and photos, and reference applicable privacy law; (iv) document the provenance and licence of datasets [16] and [18] or replace them, to satisfy your own Eq. (1); (v) expand system validation beyond the 16 API tests with load, concurrency, OTP brute-force and audit-log integrity tests, and release code, tests and dataset splits for reproducibility; (vi) harmonise the reported number of workflow stages across the Abstract, Introduction, Section III and Section IV-D; (vii) add coverage of fairness implications using the bias literature you already cite, and cite a standard mAP/AP reference; and (viii) temper the "AI-validated" and "accountable" claims to match the evidence — notably the 0.434 litter recall and the fact that all workflow numbers come from seeded demonstration data.

Additional Questions:
Please confirm that you have reviewed all relevant files, including supplementary files and any author response files, which can be found in the "View Author's Response" link above (author responses will only appear for resubmissions): Yes, all files have been reviewed

1) Does the paper contribute to the body of knowledge?: Yes, but only at the systems-integration level, and the contribution is modest. UrbanFix assembles six components — account-free OTP filing, per-category YOLOv8n photo checks, a weighted five-question urgency score, a guarded finite-state workflow, a public registry, and a scoped research gateway — into one implementation, and Table II argues that no prior system covers all these capabilities. The dataset-screening rule of Eq. (1) is a reasonable design idea and the four fine-tuned civic-defect detectors are a useful artefact. However, none of the constituent techniques is new: YOLOv8n fine-tuning, a weighted sum, a state machine, HMAC pseudonymisation and role-based gating are all standard. No new model, method, theory or empirical insight is offered; "closed loop" and "accountability" are architectural labels, and the end-to-end behaviour is demonstrated only on 80 seeded records, not in any real municipality. The paper contributes a system design, not a substantive advance in knowledge.

2) Is the paper technically sound?: Partially — the architecture is coherently described, but the evidence does not support several central claims:

1. Detection evaluation:​ the "best checkpoint" is selected and reported on the same validation split; there is no independent test set, no cross-validation and no confidence intervals (validation sets contain only 60–480 images). The authors themselves admit the manhole mAP50 of 0.908 may be inflated by augmented copies.
2. Missing justification and ablation:​ no baseline detector comparison, no rationale for YOLOv8n, no justification of τ = 0.25, and θδ is never assigned a numerical value — so uAI is not reproducible.
Definition gap:​ Eq. (4) defines δ from masks M_j, yet manhole and graffiti use box models with no masks; the box-based δ is undefined.
3. Unvalidated assumption:​ δ (fraction of image covered) is used to raise urgency, with no evidence that defect size in a photo correlates with real severity.
4. Overstated "AI validation":​ litter recall is 0.434 and graffiti recall 0.604, so roughly a third of instances are missed. Graceful fallback to human review is good design but should be presented as such, not as validated automation.
5. Privacy:​ HMAC-SHA256 with a server secret is pseudonymisation, not anonymisation; no threat model, key management or re-identification analysis is given (deterministic ID + day + ward can single out individuals in small wards). Sweeney's k-anonymity [37] is cited but never implemented or measured. Free text and photos are published in the registry with no described PII redaction or consent mechanism.
6. System validation:​ 16 hand-written API tests and seeded dashboards only; no load, concurrency, OTP brute-force or audit-integrity testing.
Internal inconsistencies:​ "six steps" (Introduction), "seven-stage workflow" (Abstract), "five transitions" (Sect. IV-D), "seven gateway stages" (Sect. III).

3) Is the subject matter presented in a comprehensive manner?: Broad in scope, uneven in depth. The paper covers motivation with national statistics, 28 related works in five strands (Table I), a capability matrix (Table II), layered architecture, formalised category selection, urgency, vision evidence, workflow and disclosure (Eqs. 1–9), data model, implementation, results figures, limitations and future work — comprehensive topical coverage. What is missing is comprehensive treatment: no requirements analysis, no threat/privacy model, no cost or deployment study, no field pilot or user study, no fairness analysis despite citing [12]–[14], no legal/regulatory discussion (India's DPDP Act, GDPR), no reproducibility artefacts (code, tests, dataset splits), and no measurement of the governance outcomes the system claims to improve. The formal notation often describes trivial operations while the substantive claims remain informal.

4) Are the references provided applicable and sufficient?: Applicable: largely yes. Sufficient: no. The 39 references are current and cover complaint systems, 311/VGI bias, civic-defect datasets, open data, AI in government, human-in-the-loop learning and privacy basics; the government-statistics and dataset sources are appropriate. Important gaps: no citation defining mAP/AP (COCO or PASCAL VOC) although mAP50 and mAP50–95 are reported; no modern privacy-preserving data-sharing literature (differential privacy, l-diversity, re-identification attacks, pseudonymisation standards, RBAC/ABAC, secure audit logs); no privacy-law references; no workflow-verification or software-architecture references for a heavily architectural paper; no detection benchmarks beyond the cited application papers. A single 2002 k-anonymity paper cannot substantiate the "privacy-preserving" claim.

5) Are there references that are not appropriate for the topic being discussed?: Yes

5a) If yes, then please indicate which references should be removed.: Reference [37] (Sweeney, k-anonymity) is presented as the privacy basis, yet the system implements HMAC pseudonymisation with fixed projections — no k, no equivalence classes, no k-anonymity analysis — so it should be removed unless k-anonymity is actually implemented and evaluated. References [16] (Roboflow community dataset) and [18] (Kaggle "Road Hazards") are load-bearing for two of the four models but appear not to satisfy the paper's own Eq. (1) criterion of documented provenance and a usable licence; they should be replaced or their provenance and licensing documented. The remaining references are contextual but legitimate and need not be removed.