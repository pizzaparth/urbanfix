# Project Presentation Content (10-Slide Version)

Condensed from `project_description.md` for a 10-slide PPT. One slide = one heading below.

---

## Slide 1 — Title

**Smart Digital Complaint Management and Public Transparency System**
*Account-less civic issue reporting, public audit trails, and AI-assisted photo validation*

* Web portal for citizens to report public infrastructure issues (potholes, garbage, water leakage, streetlights, and 6 more categories)
* No account required — email OTP verification only
* Public registry + admin console + proposed AI validation layer

**Visuals:**
![System Logo](./docs/presentation/svg/s1_logo.svg)
![Web Portal App Interface](./docs/presentation/svg/s1_portal_mock.svg)
![AI Validation](./docs/presentation/svg/s1_ai_icon.svg)

---

## Slide 2 — Problem Identification

* Civic issues are reported today via phone hotlines, in-person visits, or informal social posts
* No tracking ID, no public record, no category-specific urgency, no photo verification
* Result: lost/duplicate complaints, inconsistent triage, no public accountability

**Problem Statement:** Civic issue reporting is fragmented, untracked, and invisible to the public.

**Visuals:**
![Manual Reporting](./docs/presentation/svg/s2_manual_report.svg)
![Lost Data](./docs/presentation/svg/s2_loss_data.svg)
![No Tracking](./docs/presentation/svg/s2_no_tracking.svg)

---

## Slide 3 — Literature Survey & Research Gap

| Prior Approach | Strength | Limitation |
|---|---|---|
| Phone hotlines | Centralized entry point | No photo evidence, no public tracking |
| Crowdsourced issue maps | Public visibility | No identity check, no urgency scoring |
| Generic helpdesk ticketing | Mature status workflow | Not citizen-facing / not transparent |
| CV-based defect detection | Automated visual check | Needs category-specific training data |

**Visuals:**
![Phone Hotline Limitation](./docs/presentation/svg/s3_phone_limit.svg)
![Crowdsourced Limitation](./docs/presentation/svg/s3_crowd_limit.svg)
![Research Gap](./docs/presentation/svg/s3_research_gap.svg)

---

## Slide 4 — Objectives

**Primary Objective:** Design a transparent, account-less civic complaint platform with severity-aware triage and AI-assisted photo validation.

* Accessibility — OTP verification, no account
* Structured categorization — fixed 10-category taxonomy
* Intelligent prioritization — weighted questionnaire score
* Automated visual validation *(proposed)* — per-category AI detection

**Visuals:**
![Accountless Access](./docs/presentation/svg/s4_accountless.svg)
![Priority Scoring](./docs/presentation/svg/s4_priority.svg)
![Public Registry](./docs/presentation/svg/s4_registry.svg)

---

## Slide 5 — Scope

* **In Scope:** OTP submission, 10-category questionnaire, priority scoring, public registry, admin status workflow, PDF receipts
* **Out of Scope:** native apps, chat, payments, multi-language
* **Future Scope:** production AI validation service, auto-routing, analytics

**Visuals:**
![In Scope](./docs/presentation/svg/s5_in_scope.svg)
![Out of Scope](./docs/presentation/svg/s5_out_scope.svg)
![Future Scope](./docs/presentation/svg/s5_future.svg)

---

## Slide 6 — Methodology

1. Problem Identification & Requirement Analysis
2. System Design & Architecture
3. Development, Integration & Testing
4. Deployment & Demo

**Visuals:**
![Phase 1](./docs/presentation/svg/s6_meth_1.svg)
![Phase 2](./docs/presentation/svg/s6_meth_2.svg)
![Phase 3](./docs/presentation/svg/s6_meth_3.svg)

---

## Slide 7 — System Architecture

* **Frontend:** React (Vite) — citizen wizard, public registry, admin console
* **Backend:** Express.js / Node.js — REST API, OTP, status workflow
* **Database:** MongoDB — Users, Complaints, OTPs (TTL)

**Visuals:**
![Frontend Arch](./docs/presentation/svg/s7_frontend.svg)
![Backend Arch](./docs/presentation/svg/s7_backend.svg)
![Full Arch](./docs/presentation/svg/s7_full_arch.svg)

---

## Slide 8 — Proposed AI Validation Layer

* One YOLO-based object-detection model per category (e.g. `pothole_road_damage_model.pt`)
* Detects the issue, draws a bounding box, returns confidence + annotated image
* Low-confidence detections are routed to an admin review queue

**Visuals:**
![YOLO Box](./docs/presentation/svg/s8_yolo.svg)
![Admin Queue](./docs/presentation/svg/s8_admin_queue.svg)
![Confidence Branch](./docs/presentation/svg/s8_confidence.svg)

---

## Slide 9 — User Workflow

* Select Category & Questionnaire (Swiping Yes/No)
* Details + Photos + Contact Info
* Email OTP Verification
* Tracking ID Issued -> Public Tracking

**Visuals:**
![Swipe UI Mockup](./docs/presentation/svg/s9_swipe_ui.svg)
![OTP Verification Mockup](./docs/presentation/svg/s9_otp_ui.svg)
![Tracking ID Success](./docs/presentation/svg/s9_success_ui.svg)

---

## Slide 10 — Conclusion & Final Architecture

* Replaces fragmented, untracked civic reporting with one transparent, OTP-verified, auditable platform
* Weighted questionnaire delivers consistent, explainable priority triage
* Proposed AI layer adds automated visual validation

**Visuals:**
![Transparent Platform](./docs/presentation/svg/s10_transparent.svg)
![Triage Automations](./docs/presentation/svg/s10_triage.svg)
![Overview](./docs/presentation/svg/s10_overview.svg)
