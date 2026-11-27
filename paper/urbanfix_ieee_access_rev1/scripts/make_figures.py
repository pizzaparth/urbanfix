"""Draw the revised paper's result figures from the committed result files.

    ai_service/.venv/bin/python paper/urbanfix_ieee_access_rev1/scripts/make_figures.py [--examples]

Run build_paper_data.py first (it writes latex/generated/sweep.json and geography.json).

Writes latex/figs/:
  fig_tau.pdf      validation sweep of tau per category, with the chosen tau (A4)
  fig_geo.pdf      share of valid pothole complaints flagged per country, with and
                   without Indian training photos (A11)
  fig_curves.pdf   validation mAP50 per epoch of the deployed models (from
                   ai_model/results/train/curves/*.csv)
  fig_errors.jpg   the error-analysis sheets of the deployed models (A6), stacked
  fig05.pdf        every reachable questionnaire score per weight profile, read from
                   backend/constants/questionnaires.js and backend/utils/urgency.js (needs Node.js)
  fig10.jpg        (only with --examples) one detection per category on a test
                   photo, next to three app screens of the submitted Fig. 10. Needs the datasets in
                   ai_model/data/ and the weights in ai_model/weights/. The photo
                   is chosen by rule, not by eye: among the category's valid test
                   photos that pass its tau, the one whose s* is the median.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
AI = REPO / "ai_model"
LATEX = Path(__file__).resolve().parents[1] / "latex"
GEN = LATEX / "generated"
FIGS = LATEX / "figs"
OLD_FIG10 = REPO / "paper" / "urbanfix_ieee_access" / "latex" / "figs" / "fig10.jpg"

DEPLOYED = {"pothole": "pothole_india__yolov8n__s0", "litter": "garbage_litter__yolov8n__s0",
            "graffiti": "graffiti__yolov8n__s0"}
TITLE = {"pothole": "Pothole", "litter": "Litter", "graffiti": "Graffiti"}
INK, RED, GOLD, GREY = "#1F3A5F", "#B23A48", "#C98B12", "#8A94A6"

plt.rcParams.update({"font.family": "serif", "font.serif": ["Times New Roman", "Times", "DejaVu Serif"],
                     "font.size": 8, "axes.spines.top": False, "axes.spines.right": False,
                     "pdf.fonttype": 42, "axes.linewidth": 0.6})


def fig_tau() -> None:
    data = json.loads((GEN / "sweep.json").read_text())
    fig, axes = plt.subplots(1, 3, figsize=(7.16, 2.0), sharey=True)
    for ax, (cat, d) in zip(axes, data.items()):
        sw = d["sweep"]
        t = [r["tau"] for r in sw]
        ax.plot(t, [100 * r["false_flag"]["rate"] for r in sw], color=INK, lw=1.2, label="valid complaints flagged")
        ax.plot(t, [100 * r["false_pass_wrong"]["rate"] for r in sw], color=RED, lw=1.2, ls="--",
                label="wrong-category complaints passed")
        ax.plot(t, [100 * r["false_pass_unrelated"]["rate"] for r in sw], color=GOLD, lw=1.2, ls=":",
                label="unrelated complaints passed")
        ax.axhline(20, color=GREY, lw=0.6)
        ax.axvline(d["tau"], color=INK, lw=0.6, ls="-.")
        ax.text(d["tau"] - 0.02, 96, f"$\\tau_k$={d['tau']:.2f}", ha="right", va="top", fontsize=7)
        ax.set_title(TITLE[cat], fontsize=8)
        ax.set_xlabel(r"$\tau$")
        ax.set_xlim(0, 0.92)
        ax.set_ylim(0, 100)
    axes[0].set_ylabel("% of validation complaints")
    axes[0].legend(loc="center left", fontsize=6.5, frameon=False, bbox_to_anchor=(0.0, 0.42))
    fig.tight_layout(pad=0.4)
    fig.savefig(FIGS / "fig_tau.pdf")
    plt.close(fig)


def fig_geo() -> None:
    d = json.loads((GEN / "geography.json").read_text())
    label = {"Japan": "Japan", "Czech": "Czech Rep.", "China_MotorBike": "China\n(motorbike)", "India": "India"}
    fig, ax = plt.subplots(figsize=(3.5, 2.1))
    w = 0.38
    for i, c in enumerate(d["countries"]):
        for j, (key, col, lab) in enumerate((("no_india", GREY, "trained without India"),
                                            ("with_india", INK, "trained with India (deployed)"))):
            r = d[key][c]
            x = i + (j - 0.5) * w
            ax.bar(x, 100 * r["rate"], w * 0.92, color=col, label=lab if i == 0 else None)
            ax.errorbar(x, 100 * r["rate"], yerr=[[100 * (r["rate"] - r["ci95"][0])], [100 * (r["ci95"][1] - r["rate"])]],
                        color="black", lw=0.6, capsize=1.5)
    ax.set_xticks(range(len(d["countries"])),
                  [f"{label[c]}\nn = {d['with_india'][c]['n']}" for c in d["countries"]], fontsize=6.5)
    ax.set_ylabel("Valid complaints flagged (%)")
    ax.set_ylim(0, 100)
    ax.legend(fontsize=6.5, frameon=False, loc="upper left")
    fig.tight_layout(pad=0.4)
    fig.savefig(FIGS / "fig_geo.pdf")
    plt.close(fig)


def fig_curves() -> None:
    fig, ax = plt.subplots(figsize=(3.5, 1.9))
    for (cat, tag), col in zip(DEPLOYED.items(), (INK, GOLD, RED)):
        rows = list(csv.DictReader((AI / "results" / "train" / "curves" / f"{tag}.csv").open()))
        best = json.loads((AI / "results" / "train" / f"{tag}.json").read_text())["best_epoch"]
        e = [int(r["epoch"]) for r in rows]
        v = [float(r["metrics/mAP50(B)"]) for r in rows]
        ax.plot(e, v, color=col, lw=1.1, label=TITLE[cat])
        ax.plot(best, v[e.index(best)], "o", color=col, ms=3)
    ax.set_xlabel("Epoch (cap: 40)")
    ax.set_ylabel("Validation box mAP50")
    ax.set_ylim(0, 0.8)
    ax.legend(fontsize=6.5, frameon=False, loc="lower right")
    fig.tight_layout(pad=0.4)
    fig.savefig(FIGS / "fig_curves.pdf")
    plt.close(fig)


def fig_scores() -> None:
    import itertools
    import subprocess

    js = (
        "const q=await import('./constants/questionnaires.js');const c=await import('./constants/categories.js');"
        "const u=await import('./utils/urgency.js');"
        "console.log(JSON.stringify({cats:c.CATEGORIES,w:Object.fromEntries(c.CATEGORIES.map(k=>[k,"
        "q.CATEGORY_QUESTIONNAIRES[k].map(x=>x.weight)])),hi:u.HIGH_THRESHOLD,mid:u.MEDIUM_THRESHOLD}))"
    )
    d = json.loads(subprocess.run(["node", "--input-type=module", "-e", js], cwd=REPO / "backend",
                                  capture_output=True, text=True, check=True).stdout)
    short = {"Pothole / Road Damage": "pothole", "Garbage / Litter": "litter", "Graffiti": "graffiti"}
    profiles: dict[tuple, list[str]] = {}
    for cat in d["cats"]:
        profiles.setdefault(tuple(d["w"][cat]), []).append(short.get(cat, cat))
    fig, ax = plt.subplots(figsize=(3.5, 1.25))
    ax.axvspan(0, d["mid"], color="#E3F1EA")
    ax.axvspan(d["mid"], d["hi"], color="#F3EBDD")
    ax.axvspan(d["hi"], 1, color="#F6E3E6")
    for x, lab in ((d["mid"] / 2, "Standard"), ((d["mid"] + d["hi"]) / 2, "Medium"), ((d["hi"] + 1) / 2, "High")):
        ax.text(x, len(profiles) + 0.15, lab, ha="center", fontsize=7, weight="bold")
    for i, (w, cats) in enumerate(sorted(profiles.items(), reverse=True)):
        y = len(profiles) - 1 - i + 0.5
        scores = sorted({sum(wi * yi for wi, yi in zip(w, ys)) / sum(w) for ys in itertools.product((0, 1), repeat=len(w))})
        ax.plot(scores, [y] * len(scores), "o", color=(INK, "#13747D")[i % 2], ms=3.5)
        ax.text(-0.02, y, f"{', '.join(cats)}\nw = ({', '.join(map(str, w))})", ha="right", va="center", fontsize=6.5)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(profiles) + 0.5)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.set_xlabel("Questionnaire score $U$ (Eq. 2)")
    fig.tight_layout(pad=0.3)
    fig.savefig(FIGS / "fig05.pdf")
    plt.close(fig)


def fig_errors() -> None:
    from PIL import Image, ImageDraw, ImageFont

    sheets = [("pothole_india", "Pothole"), ("garbage_litter", "Litter"), ("graffiti", "Graffiti")]
    ims = [Image.open(AI / "results" / "figures" / f"errors_{f}.jpg").convert("RGB") for f, _ in sheets]
    pad = 44
    out = Image.new("RGB", (ims[0].width + pad, sum(i.height for i in ims) + 8 * (len(ims) - 1)), "white")
    y = 0
    font = None
    for p in ("/System/Library/Fonts/Supplemental/Times New Roman.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"):
        if Path(p).exists():
            font = ImageFont.truetype(p, 30)
            break
    for im, (_, lab) in zip(ims, sheets):
        out.paste(im, (pad, y))
        txt = Image.new("RGB", (im.height, pad), "white")
        ImageDraw.Draw(txt).text((im.height // 2, pad // 2), lab, fill="black", font=font, anchor="mm")
        out.paste(txt.rotate(90, expand=True), (0, y))
        y += im.height + 8
    out.save(FIGS / "fig_errors.jpg", quality=90)


def fig_examples() -> None:
    import statistics

    from PIL import Image, ImageDraw, ImageFont
    from ultralytics import YOLO

    weights = {"pothole": "pothole_road_damage_model.pt", "litter": "garbage_litter_model.pt",
               "graffiti": "graffiti_model.pt"}
    tiles = []
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    H = 470
    record = {}
    for cat, tag in DEPLOYED.items():
        scores = json.loads((AI / "results" / "scores" / f"{tag}.json").read_text())
        tau = json.loads((AI / "results" / "complaints" / f"{tag}.json").read_text())["tau"]
        passing = sorted([r for r in scores["sets"]["test"] if r["positive"] and r["max_conf"] >= tau],
                         key=lambda r: (r["max_conf"], r["file"]))
        med = statistics.median_low([r["max_conf"] for r in passing])
        pick = next(r for r in passing if r["max_conf"] == med)
        res = YOLO(str(AI / "weights" / weights[cat])).predict(str(AI / pick["file"]), conf=tau, imgsz=640,
                                                               device="cpu", verbose=False)[0]
        im = Image.open(AI / pick["file"]).convert("RGB")
        over = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(over)
        lw = max(4, im.size[0] // 160)
        if res.masks is not None:
            for poly in res.masks.xy:
                if len(poly) > 2:
                    d.polygon([tuple(p) for p in poly], fill=(178, 58, 72, 110))
        for box, conf in zip(res.boxes.xyxy.tolist(), res.boxes.conf.tolist()):
            d.rectangle(box, outline=(201, 139, 18, 255), width=lw)
            d.text((box[0] + lw, box[1] + lw), f"{conf:.2f}", fill=(201, 139, 18, 255),
                   font=ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", max(28, im.size[0] // 22)))
        im = Image.alpha_composite(im.convert("RGBA"), over).convert("RGB")
        im = im.resize((round(im.width * H / im.height), H))
        tiles.append(im)
        record[cat] = {"file": pick["file"], "s_star": pick["max_conf"], "tau": tau}
    old = Image.open(OLD_FIG10).convert("RGB")
    # Screens (e)-(g) of the submitted Fig. 10. The submitted research-profile screen is
    # left out: its wording ("anonymised") predates the revision.
    left = round(old.width * 0.6175)
    screens = old.crop((left, 0, left + round((old.width - left) * 0.75), round(old.height * 0.86)))
    screens = screens.resize((round(screens.width * H / screens.height), H))
    gap = 14
    width = sum(t.width for t in tiles) + screens.width + gap * len(tiles)
    sheet = Image.new("RGB", (width, H + 60), "white")
    x = 0
    labels = [f"({chr(97 + i)}) {TITLE[c]} {record[c]['s_star']:.2f}" for i, c in enumerate(DEPLOYED)]
    draw = ImageDraw.Draw(sheet)
    for t, lab in zip(tiles, labels):
        sheet.paste(t, (x, 0))
        draw.text((x + t.width // 2, H + 30), lab, fill="black", font=font, anchor="mm")
        x += t.width + gap
    sheet.paste(screens, (x, 0))
    sw = screens.width / 3
    for i, lab in enumerate(("Report", "Registry", "Triage")):
        draw.text((x + sw * (i + 0.5), H + 30), f"({chr(100 + i)}) {lab}", fill="black", font=font, anchor="mm")
    sheet.save(FIGS / "fig10.jpg", quality=92)
    (GEN / "fig10_sources.json").write_text(json.dumps(record, indent=1))


def fig_graphical_abstract() -> None:
    """Graphical abstract: report, AI screening, triage, publish, plus test mAP50 with CIs.

    Built from fig10.jpg (run with --examples first) and the eval result files.
    """
    from PIL import Image

    sheet = Image.open(FIGS / "fig10.jpg").convert("RGB")
    H = 470  # panel height used by fig_examples
    src = json.loads((GEN / "fig10_sources.json").read_text())
    # Panel widths: the three detection tiles, then three screens of equal width.
    widths = []
    for cat in DEPLOYED:
        im = Image.open(AI / src[cat]["file"])
        widths.append(round(im.width * H / im.height))
    x0 = sum(widths) + 14 * 3
    sw = (sheet.width - x0) / 3
    report = sheet.crop((round(x0), 0, round(x0 + sw), H))
    triage = sheet.crop((round(x0 + 2 * sw), 0, round(x0 + 3 * sw), H))
    registry = sheet.crop((round(x0 + sw), 0, round(x0 + 2 * sw), H))
    gx = widths[0] + widths[1] + 28  # the graffiti panel: its boxes are visible at this size
    ai = sheet.crop((gx, 0, gx + widths[2], H))
    fig = plt.figure(figsize=(6.6, 2.95), dpi=200)
    fig.text(0.02, 0.93, "UrbanFix: from a citizen's photo to a verified public record", fontsize=10.5,
             family="DejaVu Sans", weight="bold", color=INK)
    steps = [(report, "1 Report"), (ai, "2 AI screening"), (triage, "3 Triage"), (registry, "4 Publish")]
    x = 0.02
    for im, lab in steps:
        w = 0.135 * im.width / im.height * (2.95 / 6.6) * 2.25
        w = min(max(w, 0.10), 0.17)
        ax = fig.add_axes([x, 0.2, w, 0.66])
        ax.imshow(im)
        ax.set_axis_off()
        fig.text(x + w / 2, 0.13, lab, ha="center", fontsize=8, family="DejaVu Sans")
        x += w + 0.018
    ax = fig.add_axes([0.72, 0.3, 0.26, 0.5])
    cats = list(DEPLOYED)
    vals, lo, hi = [], [], []
    for cat in cats:
        mp = json.loads((AI / "results" / "eval" / f"{DEPLOYED[cat]}.json").read_text())["sets"]["test"]["box"]["mAP50"]
        vals.append(mp["value"]); lo.append(mp["value"] - mp["ci95"][0]); hi.append(mp["ci95"][1] - mp["value"])
    y = list(range(len(cats)))[::-1]
    ax.barh(y, vals, xerr=[lo, hi], color=INK, height=0.55, error_kw={"lw": 0.7, "capsize": 2})
    for yi, v in zip(y, vals):
        ax.text(1.0, yi, f"{v:.3f}", va="center", ha="right", fontsize=7.5, family="DejaVu Sans")
    ax.set_yticks(y, [TITLE[c] for c in cats], fontsize=7.5, family="DejaVu Sans")
    ax.set_xlim(0, 1)
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.set_title("Test box mAP50 (95% CI)", fontsize=8, family="DejaVu Sans", loc="left")
    fig.text(0.72, 0.2, "Flags for review, never rejects", fontsize=7, family="DejaVu Sans")
    fig.text(0.02, 0.03, "Server-enforced workflow, photo proof of repair, pseudonymised research data (k = 5)",
             fontsize=8, family="DejaVu Sans", color="#333333")
    out = LATEX.parent / "graphical_abstract"
    out.mkdir(exist_ok=True)
    fig.savefig(out / "gagraphic.png", dpi=200)
    fig.savefig(out / "gagraphic.jpg", dpi=100, pil_kwargs={"quality": 92})
    plt.close(fig)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--examples", action="store_true", help="also redraw fig10 (needs datasets and weights)")
    args = ap.parse_args()
    fig_tau()
    fig_geo()
    fig_curves()
    fig_errors()
    fig_scores()
    if args.examples:
        fig_examples()
    if (GEN / "fig10_sources.json").exists():
        fig_graphical_abstract()
    print("figures written to", FIGS)


if __name__ == "__main__":
    main()
