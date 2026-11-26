"""Draw Fig. 4 of the paper: screening of candidate categories against Eq. (1).

    python scripts/fig_dataset_screening.py

Writes paper/urbanfix_ieee_access/latex/figs/fig04.jpg and a PDF next to it.

Each bar is the size of the largest public dataset found for a category. The
circles show each criterion: 2 = met, 1 = partly met, 0 = not met, None = not
assessed. Licences were only checked for datasets that pass every other
criterion, because a dataset that fails one is excluded anyway.
The values for the six rejected categories come from the screening in the
submitted paper; the open manhole row was corrected in November 2026
(ai_model/DATASETS.md, finding F18).
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Wedge  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "paper" / "urbanfix_ieee_access" / "latex" / "figs" / "fig04"

CRITERIA = ["localised labels", "documented source", "street-level", "usable licence", r"$\geq$1,000 images"]
# name, images, kept, localised, documented, street-level, licence, >=1000
ROWS = [
    ("Pothole / road damage", 47420, True, 2, 2, 2, 2, 2),    # RDD2022, CC BY 4.0
    ("Electrical poles", 25426, False, 1, 0, 2, None, 2),
    ("Water leakage", 2935, False, 2, 0, 0, None, 2),
    ("Open manhole", 2700, False, 2, 0, 2, 1, 2),             # Kaggle Road Hazards: CC BY-NC-SA, source unknown
    ("Garbage / litter", 1500, True, 2, 2, 2, 2, 2),          # TACO, CC BY 4.0
    ("Illegal parking", 1081, False, 1, 0, 2, None, 2),
    ("Graffiti", 1022, True, 2, 2, 2, 2, 2),                  # STORM, CC BY 4.0
    ("Faulty streetlight", 800, False, 0, 2, 2, None, 0),
    ("Damaged road sign", 503, False, 2, 0, 2, None, 0),
    ("Fallen tree", 379, False, 2, 0, 2, None, 0),
]
NAVY = "#1f3a5f"
GREY = "#c9ced8"
LINE = "#8a93a3"


def main() -> None:
    plt.rcParams.update({"font.family": "serif", "font.serif": ["Times New Roman", "STIXGeneral", "DejaVu Serif"],
                         "mathtext.fontset": "stix", "font.size": 8})
    fig = plt.figure(figsize=(5.6, 3.6), dpi=300)
    ax = fig.add_axes([0.24, 0.13, 0.40, 0.62])
    n = len(ROWS)
    ys = list(range(n))[::-1]
    for y, row in zip(ys, ROWS):
        name, size, kept = row[:3]
        ax.barh(y, size, height=0.62, color=NAVY if kept else GREY, left=1)
        ax.text(size * 1.18, y, f"{size:,}", va="center", fontsize=7.5)
        ax.text(-0.02, y, name, va="center", ha="right", transform=ax.get_yaxis_transform(),
                fontsize=8, fontweight="bold" if kept else "normal")
    ax.set_xscale("log")
    ax.set_xlim(100, 1e5)
    ax.set_ylim(-0.6, n - 0.4)
    ax.set_yticks([])
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(LINE)
    ax.tick_params(axis="x", colors="#333333", labelsize=7.5)
    ax.set_xlabel("images in largest public dataset (log)", fontsize=8)

    cx = fig.add_axes([0.68, 0.13, 0.27, 0.62])
    cx.set_xlim(-0.6, len(CRITERIA) - 0.4)
    cx.set_ylim(-0.6, n - 0.4)
    cx.set_aspect("equal", adjustable="datalim")
    cx.axis("off")
    r = 0.30
    for y, row in zip(ys, ROWS):
        for k, v in enumerate(row[3:]):
            if v is None:
                cx.plot([k - r * 0.7, k + r * 0.7], [y, y], color=LINE, lw=0.8)
                continue
            cx.add_patch(plt.Circle((k, y), r, fill=False, ec=NAVY if v else LINE, lw=0.7))
            if v == 2:
                cx.add_patch(plt.Circle((k, y), r, color=NAVY))
            elif v == 1:
                cx.add_patch(Wedge((k, y), r, 90, 270, color=NAVY))
    for k, label in enumerate(CRITERIA):
        cx.text(k - 0.15, n - 0.25, label, rotation=55, ha="left", va="bottom", fontsize=7.5)
    fig.text(0.815, 0.055, "filled: met, half: partly met,\nopen: not met, dash: not assessed",
             fontsize=6.5, color="#333333", ha="center", va="center")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT.with_suffix(".jpg"), dpi=300, pil_kwargs={"quality": 92})
    fig.savefig(OUT.with_suffix(".pdf"))
    print("wrote", OUT.with_suffix(".jpg"))


if __name__ == "__main__":
    main()
