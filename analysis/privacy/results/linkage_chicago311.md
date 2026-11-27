# Linkage risk of the research projection, Chicago 311 (2024)

Written by `analysis/privacy/scripts/linkage_analysis.py`. Do not edit by hand.

Data: 143,447 requests (pothole 36,489, graffiti 95,331, garbage_litter 11,627) in 50 wards, median 2,371 per ward. Removed: duplicate 18,955, no ward 514. Downloaded 2026-11-27T12:40:17+00:00, SHA-256 3f28ea5de884.

Subsamples: 10 wards drawn at random, then 1,000 (small) or 10,000 (medium) requests from them, 200 draws; median (5th to 95th percentile). All numbers are percentages of requests.

Columns: k = equivalence-class size on all released fields; k < 5 is the share withheld by k = 5 suppression. The adversary knows the category, ward and day filed of one request; *singles out* = exactly one released record matches; *learns outcome* = all matching records share one status and one resolution value (status only where no resolution is released).

## Chicago fields only

| Variant | City k = 1 | City k < 5 | Small k = 1 | Small k < 5 | Medium k < 5 | Small: singles out | Small: learns outcome | Small after k = 5: learns outcome |
|---|---|---|---|---|---|---|---|---|
| A: submitted Eq. (7): day filed, day closed, exact resolution time | 77.4 | 85.3 | 95.6 (91.9-97.7) | 100.0 (99.5-100.0) | 95.1 (89.9-97.2) | 71.0 (67.2-75.4) | 73.9 (70.1-78.1) | 0.0 (0.0-0.5) |
| B: submitted without exact resolution time: day filed, day closed | 21.3 | 49.1 | 81.8 (77.8-85.4) | 99.5 (97.2-100.0) | 77.2 (72.5-81.9) | 71.0 (67.2-75.4) | 86.4 (83.1-89.4) | 0.5 (0.0-2.8) |
| C: phase-1 code: ISO week filed, resolution in whole days | 14.1 | 30.9 | 63.4 (58.1-69.5) | 96.5 (91.7-99.0) | 50.8 (44.4-57.8) | 31.3 (27.6-35.5) | 43.7 (38.2-49.0) | 3.5 (1.0-8.3) |
| D: week filed, resolution band | 2.9 | 12.8 | 44.8 (40.2-50.8) | 88.4 (82.6-94.0) | 30.5 (27.3-33.8) | 31.3 (27.6-35.5) | 68.8 (64.2-73.8) | 11.6 (6.0-17.4) |
| E: month filed, resolution band | 0.6 | 2.7 | 19.7 (16.9-22.6) | 52.1 (44.5-61.2) | 9.6 (8.6-10.3) | 7.7 (6.3-9.0) | 30.1 (24.6-36.9) | 46.0 (36.2-53.7) |
| F: month filed, no resolution | 0.1 | 0.3 | 8.2 (6.8-9.5) | 34.8 (29.3-41.2) | 2.0 (1.5-2.6) | 7.7 (6.3-9.0) | 93.7 (83.6-99.2) | 64.8 (58.8-70.7) |
| G: quarter filed, resolution band | 0.1 | 0.7 | 8.2 (6.7-9.4) | 29.1 (25.0-33.9) | 2.7 (2.2-3.4) | 1.6 (1.0-2.2) | 8.2 (5.3-12.5) | 42.0 (31.4-53.2) |
| H: quarter filed, no resolution | 0.0 | 0.1 | 1.9 (1.1-2.6) | 11.8 (9.6-14.5) | 0.3 (0.2-0.5) | 1.6 (1.0-2.2) | 87.8 (74.9-98.0) | 87.4 (77.7-90.1) |

## With simulated urgency (3 levels)

| Variant | City k = 1 | City k < 5 | Small k = 1 | Small k < 5 | Medium k < 5 | Small: singles out | Small: learns outcome | Small after k = 5: learns outcome |
|---|---|---|---|---|---|---|---|---|
| A: submitted Eq. (7): day filed, day closed, exact resolution time | 82.2 | 94.2 | 98.2 (96.4-99.4) | 100.0 (100.0-100.0) | 99.4 (97.1-99.8) | 71.0 (67.2-75.4) | 73.9 (70.1-78.1) | 0.0 (0.0-0.0) |
| B: submitted without exact resolution time: day filed, day closed | 38.1 | 77.4 | 92.7 (89.5-94.6) | 100.0 (99.5-100.0) | 95.2 (90.4-97.2) | 71.0 (67.2-75.4) | 86.4 (83.1-89.4) | 0.0 (0.0-0.5) |
| C: phase-1 code: ISO week filed, resolution in whole days | 24.5 | 51.3 | 82.7 (77.8-86.8) | 100.0 (97.8-100.0) | 77.5 (71.0-84.9) | 31.3 (27.6-35.5) | 43.7 (38.2-49.0) | 0.0 (0.0-2.2) |
| D: week filed, resolution band | 9.2 | 31.4 | 69.6 (64.2-74.8) | 99.0 (97.0-100.0) | 57.3 (49.6-65.4) | 31.3 (27.6-35.5) | 68.8 (64.2-73.8) | 1.0 (0.0-3.0) |
| E: month filed, resolution band | 2.1 | 10.0 | 39.2 (34.3-45.0) | 82.1 (74.3-91.0) | 25.7 (23.3-28.4) | 7.7 (6.3-9.0) | 30.1 (24.6-36.9) | 17.6 (9.0-25.7) |
| F: month filed, no resolution | 0.3 | 2.3 | 24.6 (21.5-28.2) | 73.7 (65.4-83.7) | 10.3 (9.1-11.5) | 7.7 (6.3-9.0) | 93.7 (83.6-99.2) | 26.3 (16.3-34.6) |
| G: quarter filed, resolution band | 0.6 | 2.9 | 20.8 (18.1-23.9) | 54.0 (46.2-63.6) | 10.5 (9.4-11.2) | 1.6 (1.0-2.2) | 8.2 (5.3-12.5) | 42.1 (29.6-52.1) |
| H: quarter filed, no resolution | 0.1 | 0.4 | 8.2 (6.9-9.9) | 35.8 (30.9-42.0) | 2.0 (1.5-2.6) | 1.6 (1.0-2.2) | 87.8 (74.9-98.0) | 64.0 (57.6-69.1) |

Aggregate cells (ward x category x month) with a count of 1 to 4, share of non-empty cells: city 3.0 %, medium 17.9 %, small 70.2 % (65.2-74.4).

Largest share singled out after k = 5 suppression, over all variants, populations and draws: 0.0 %.

The public registry shows each complaint's category, ward and exact filing time, so the same adversary singles out a registry entry at least as often as in variant A, before suppression (the registry also shows the street location).

Rule: finest of C, D, E, F, G, H whose median withheld share at k = 5 in the small system with simulated urgency is at most 10%; otherwise the smallest median.

Chosen: H (quarter filed, no resolution); meets the rule: no.
