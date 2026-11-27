"""Re-identification risk of the research record projection, measured on Chicago 311 (B5).

    python3 analysis/privacy/scripts/fetch_chicago311.py     # once
    python3 analysis/privacy/scripts/linkage_analysis.py

Data: Chicago 311 requests created in 2024 of three types (pothole, fly dumping, graffiti),
duplicates and legacy records removed, ward known. Chicago has no urgency field; every
variant is also measured with a simulated three-level urgency (uniform, seed 0), which
splits classes the most and so is the worst case for UrbanFix's three urgency levels.

Projection variants (quasi-identifiers; every variant also has category, ward and status):
  A  submitted Eq. (7): day filed, day closed, exact resolution time
  B  submitted without the exact resolution time: day filed, day closed
  C  phase-1 code (B4): ISO week filed, resolution in whole days
  D  week filed, resolution band
  E  month filed, resolution band
  F  month filed, no resolution
  G  quarter filed, resolution band
  H  quarter filed, no resolution
Resolution bands: open, 0-1, 2-7, 8-30, over 30 whole days.

Populations:
  city   all of Chicago (50 wards)
  small  a system the size of one Indian municipal zone: 10 wards drawn at random, then
         1,000 requests drawn at random from them (one year). 200 draws (seed 0); median
         and 5th to 95th percentile reported.
  medium the same with 10,000 requests a year (context only; the rule below uses small).

Measures:
  - Equivalence classes on all quasi-identifiers: share of records with k = 1, k < 5, k < 10.
    At k = 5 suppression the share with k < 5 is the share withheld.
  - Adversary (P7): knows the category, ward and day filed of one target request (a
    neighbour who saw it reported). Candidates are the released records consistent with
    that knowledge. "Singled out": exactly one candidate. "Learns outcome": all candidates
    share one status and one resolution value (homogeneity, the l-diversity failure).
    Measured on the raw projection and after k = 5 suppression (a suppressed target is
    not found).
  - Aggregate cells: share of non-empty ward x category x month cells with a count of 1 to 4.

Rule for the code (fixed before the results were seen): use the finest of C to H whose
median withheld share at k = 5 in the small system, with simulated urgency, is at most 10 %.
If none meets it, use the variant with the smallest median withheld share.

Output: analysis/privacy/results/linkage_chicago311.json and linkage_chicago311.md
"""
from __future__ import annotations

import csv
import json
import random
import statistics
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "chicago311_2024.csv"
OUT = ROOT / "results"
K = 5
DRAWS = 200
SMALL_WARDS = 10
SIZES = {"small": 1000, "medium": 10000}
MAX_WITHHELD = 0.10
SEED = 0
CATEGORY = {"Pothole in Street Complaint": "pothole", "Fly Dumping Complaint": "garbage_litter",
            "Graffiti Removal Request": "graffiti"}
STATUS = {"Completed": "Resolved", "Canceled": "Rejected", "Open": "Pending"}
URGENCY = ["High Urgency", "Medium Urgency", "Standard Urgency"]


def band(days):
    if days is None:
        return "open"
    if days <= 1:
        return "0-1"
    if days <= 7:
        return "2-7"
    if days <= 30:
        return "8-30"
    return ">30"


def load() -> tuple[list[dict], dict]:
    raw = list(csv.DictReader(DATA.open()))
    kept, drop = [], Counter()
    for r in raw:
        if r["duplicate"].lower() == "true":
            drop["duplicate"] += 1
            continue
        if r["legacy_record"].lower() == "true":
            drop["legacy"] += 1
            continue
        if not r["ward"]:
            drop["no ward"] += 1
            continue
        f = datetime.fromisoformat(r["created_date"])
        c = datetime.fromisoformat(r["closed_date"]) if r["closed_date"] else None
        if c is not None and c < f:
            drop["closed before filed"] += 1
            continue
        secs = (c - f).total_seconds() if c else None
        whole = int(secs // 86400) if c else None
        iso = f.isocalendar()
        kept.append({"category": CATEGORY[r["sr_type"]], "ward": r["ward"], "status": STATUS[r["status"]],
                     "day": f.date().isoformat(), "closed_day": c.date().isoformat() if c else None,
                     "secs": secs, "res_days": round(secs / 86400) if c else None, "res_band": band(whole),
                     "week": f"{iso[0]}-W{iso[1]:02d}", "month": f.strftime("%Y-%m"),
                     "quarter": f"{f.year}-Q{(f.month - 1) // 3 + 1}"})
    rng = random.Random(SEED)
    for r in kept:
        r["urgency"] = rng.choice(URGENCY)
    return kept, {"rows_downloaded": len(raw), "rows_used": len(kept), "removed": dict(drop)}


# Each variant: time field the adversary's day falls into, extra quasi-identifiers, outcome fields.
VARIANTS = {
    "A": ("submitted Eq. (7): day filed, day closed, exact resolution time", "day", ["closed_day", "secs"]),
    "B": ("submitted without exact resolution time: day filed, day closed", "day", ["closed_day"]),
    "C": ("phase-1 code: ISO week filed, resolution in whole days", "week", ["res_days"]),
    "D": ("week filed, resolution band", "week", ["res_band"]),
    "E": ("month filed, resolution band", "month", ["res_band"]),
    "F": ("month filed, no resolution", "month", []),
    "G": ("quarter filed, resolution band", "quarter", ["res_band"]),
    "H": ("quarter filed, no resolution", "quarter", []),
}
CANDIDATES = ["C", "D", "E", "F", "G", "H"]  # order from finest to coarsest, for the rule


def measure(rows: list[dict], v: str, urgency: bool) -> dict:
    _, time_f, extra = VARIANTS[v]
    known = lambda r: (r["category"], r["ward"], r[time_f])
    outcome = lambda r: (r["status"],) + tuple(r[x] for x in extra)
    qi = lambda r: known(r) + outcome(r) + ((r["urgency"],) if urgency else ())
    size = Counter(qi(r) for r in rows)
    n = len(rows)
    ks = [size[qi(r)] for r in rows]
    released = [r for r, k in zip(rows, ks) if k >= K]

    def adversary(pool: list[dict]) -> dict:
        by = defaultdict(list)
        for r in pool:
            by[known(r)].append(outcome(r))
        pool_ids = {id(r) for r in pool}
        single = learns = 0
        for r in rows:  # every request is a possible target
            if id(r) not in pool_ids:
                continue  # suppressed: the adversary does not find it
            cand = by[known(r)]
            single += len(cand) == 1
            learns += len(set(cand)) == 1
        return {"singled_out": round(single / n, 4), "learns_outcome": round(learns / n, 4)}

    return {"n": n, "k1": round(sum(k == 1 for k in ks) / n, 4), "k_lt5": round(sum(k < 5 for k in ks) / n, 4),
            "k_lt10": round(sum(k < 10 for k in ks) / n, 4), "withheld_at_k5": round(1 - len(released) / n, 4),
            "adversary_raw": adversary(rows), "adversary_after_k5": adversary(released)}


def small_cells(rows: list[dict]) -> float:
    cells = Counter((r["ward"], r["category"], r["month"]) for r in rows)
    return round(sum(1 <= c < K for c in cells.values()) / len(cells), 4)


def summarise(values: list[float]) -> dict:
    s = sorted(values)
    q = lambda p: s[min(len(s) - 1, int(round(p * (len(s) - 1))))]
    return {"median": round(statistics.median(s), 4), "p5": round(q(0.05), 4), "p95": round(q(0.95), 4),
            "max": round(s[-1], 4)}


def flat(m: dict) -> dict:
    out = {}
    for k, v in m.items():
        if isinstance(v, dict):
            out.update({f"{k}.{kk}": vv for kk, vv in v.items()})
        elif k != "n":
            out[k] = v
    return out


def main() -> None:
    rows, info = load()
    wards = sorted({r["ward"] for r in rows}, key=int)
    by_ward = defaultdict(list)
    for r in rows:
        by_ward[r["ward"]].append(r)
    info["wards"] = len(wards)
    info["requests_per_ward"] = summarise([len(by_ward[w]) for w in wards])
    info["by_category"] = dict(Counter(r["category"] for r in rows))
    info["by_status"] = dict(Counter(r["status"] for r in rows))

    result = {"source": json.loads((ROOT / "data" / "chicago311_2024.manifest.json").read_text()),
              "data": info, "k": K, "variants": {v: d[0] for v, d in VARIANTS.items()},
              "subsamples": {"wards": SMALL_WARDS, "requests": SIZES, "draws": DRAWS, "seed": SEED},
              "city": {}}
    for urg in (False, True):
        tag = "with_urgency" if urg else "without_urgency"
        result["city"][tag] = {v: measure(rows, v, urg) for v in VARIANTS}

    result["aggregate_cells_1_to_4"] = {"city": small_cells(rows)}
    for pop, size in SIZES.items():
        rng = random.Random(SEED)
        draws = defaultdict(lambda: defaultdict(list))
        cells = []
        for _ in range(DRAWS):
            ws = rng.sample(wards, SMALL_WARDS)
            pool = sum((by_ward[w] for w in ws), [])
            sample = rng.sample(pool, min(size, len(pool)))
            cells.append(small_cells(sample))
            for urg in (False, True):
                tag = "with_urgency" if urg else "without_urgency"
                for v in VARIANTS:
                    for key, val in flat(measure(sample, v, urg)).items():
                        draws[tag][f"{v}|{key}"].append(val)
        result[pop] = {}
        for tag, d in draws.items():
            out = defaultdict(dict)
            for key, vals in d.items():
                v, m = key.split("|")
                out[v][m] = summarise(vals)
            result[pop][tag] = dict(out)
        result["aggregate_cells_1_to_4"][pop] = summarise(cells)

    ok = [v for v in CANDIDATES if result["small"]["with_urgency"][v]["withheld_at_k5"]["median"] <= MAX_WITHHELD]
    chosen = ok[0] if ok else min(CANDIDATES, key=lambda v: result["small"]["with_urgency"][v]["withheld_at_k5"]["median"])
    result["rule"] = (f"finest of {', '.join(CANDIDATES)} whose median withheld share at k = {K} in the small system "
                      f"with simulated urgency is at most {MAX_WITHHELD:.0%}; otherwise the smallest median")
    result["chosen"] = {"variant": chosen, "meets_rule": bool(ok), "description": VARIANTS[chosen][0]}

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "linkage_chicago311.json").write_text(json.dumps(result, indent=1))
    (OUT / "linkage_chicago311.md").write_text(report(result))
    print(report(result))


def pct(x) -> str:
    return f"{100 * x:.1f}"


def max_after_k5(r: dict) -> float:
    vals = [m["adversary_after_k5"]["singled_out"] for t in r["city"].values() for m in t.values()]
    vals += [m["adversary_after_k5.singled_out"]["max"] for p in SIZES for t in r[p].values() for m in t.values()]
    return max(vals)


def report(r: dict) -> str:
    d, sub = r["data"], r["subsamples"]
    lines = [
        "# Linkage risk of the research projection, Chicago 311 (2024)",
        "",
        "Written by `analysis/privacy/scripts/linkage_analysis.py`. Do not edit by hand.",
        "",
        f"Data: {d['rows_used']:,} requests ({', '.join(f'{k} {v:,}' for k, v in d['by_category'].items())}) "
        f"in {d['wards']} wards, median {d['requests_per_ward']['median']:,.0f} per ward. "
        f"Removed: {', '.join(f'{k} {v:,}' for k, v in d['removed'].items())}. "
        f"Downloaded {r['source']['downloaded_utc']}, SHA-256 {r['source']['sha256'][:12]}.",
        "",
        f"Subsamples: {sub['wards']} wards drawn at random, then {sub['requests']['small']:,} (small) or "
        f"{sub['requests']['medium']:,} (medium) requests from them, {sub['draws']} draws; median "
        f"(5th to 95th percentile). All numbers are percentages of requests.",
        "",
        "Columns: k = equivalence-class size on all released fields; k < 5 is the share withheld by k = 5 "
        "suppression. The adversary knows the category, ward and day filed of one request; *singles out* = "
        "exactly one released record matches; *learns outcome* = all matching records share one status and "
        "one resolution value (status only where no resolution is released).",
        "",
    ]
    for tag, title in (("without_urgency", "Chicago fields only"), ("with_urgency", "With simulated urgency (3 levels)")):
        lines += [f"## {title}", "",
                  "| Variant | City k = 1 | City k < 5 | Small k = 1 | Small k < 5 | Medium k < 5 | "
                  "Small: singles out | Small: learns outcome | Small after k = 5: learns outcome |",
                  "|---|---|---|---|---|---|---|---|---|"]
        for v, desc in r["variants"].items():
            c = r["city"][tag][v]
            m = lambda pop, key: (f"{pct(r[pop][tag][v][key]['median'])} "
                                  f"({pct(r[pop][tag][v][key]['p5'])}-{pct(r[pop][tag][v][key]['p95'])})")
            lines.append(f"| {v}: {desc} | {pct(c['k1'])} | {pct(c['k_lt5'])} | {m('small', 'k1')} | "
                         f"{m('small', 'k_lt5')} | {m('medium', 'k_lt5')} | {m('small', 'adversary_raw.singled_out')} | "
                         f"{m('small', 'adversary_raw.learns_outcome')} | {m('small', 'adversary_after_k5.learns_outcome')} |")
        lines.append("")
    a = r["aggregate_cells_1_to_4"]
    lines += [f"Aggregate cells (ward x category x month) with a count of 1 to 4, share of non-empty cells: city "
              f"{pct(a['city'])} %, medium {pct(a['medium']['median'])} %, small {pct(a['small']['median'])} % "
              f"({pct(a['small']['p5'])}-{pct(a['small']['p95'])}).", "",
              f"Largest share singled out after k = 5 suppression, over all variants, populations and draws: "
              f"{pct(max_after_k5(r))} %.", "",
              "The public registry shows each complaint's category, ward and exact filing time, so the same "
              "adversary singles out a registry entry at least as often as in variant A, before suppression "
              "(the registry also shows the street location).", "",
              f"Rule: {r['rule']}.", "",
              f"Chosen: {r['chosen']['variant']} ({r['chosen']['description']}); meets the rule: "
              f"{'yes' if r['chosen']['meets_rule'] else 'no'}.", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    main()
