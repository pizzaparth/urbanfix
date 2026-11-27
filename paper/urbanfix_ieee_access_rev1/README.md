# UrbanFix, IEEE Access manuscript: first revision

`latex/main.tex` is the revised manuscript. The submitted version is kept unchanged in
`../urbanfix_ieee_access/`.

## Where the numbers come from

No number from a result is typed into `main.tex`. They come from macros in
`latex/generated/numbers.tex` and from the table bodies `latex/generated/tab_*.tex`, which
`scripts/build_paper_data.py` writes from the committed result files:

| Paper part | Result files |
|---|---|
| Detection, baselines, ablations, screening, geography (Tables VII to XI, Figs. 10 to 14) | `ai_model/results/{train,eval,complaints}/*.json`, `split_report.json`, `yolo_sets.json`, `split_audit_old.json` |
| Linkage risk (Table VI and Section IV-E) | `analysis/privacy/results/linkage_chicago311.json` |
| Tests (Table XII) | `backend/tests/results/junit.xml`, `ai_service/tests/results/junit.xml` |
| Load test (Table XIII) | newest full run in `backend/tests/load/results/` |
| Deployment cost | CPU latency in `ai_model/results/eval/*.json` |

`scripts/make_figures.py` draws the result figures (`fig_tau.pdf`, `fig_geo.pdf`,
`fig_curves.pdf`, `fig_errors.jpg`, `fig05.pdf`) and, with `--examples`, `fig10.jpg` and the
graphical abstract. Figs. 3, 6 and 7 are TikZ (`latex/tikz/`). Fig. 4 is drawn by
`ai_model/scripts/fig_dataset_screening.py`.

```bash
python3 paper/urbanfix_ieee_access_rev1/scripts/build_paper_data.py         # numbers and tables
ai_service/.venv/bin/python paper/urbanfix_ieee_access_rev1/scripts/make_figures.py --examples
./reproduce.sh paper                                                         # checks generated files match
```

## Compiling

The official IEEE Access template (`ieeeaccess.cls`, `spotcolor.sty`, logos and fonts) is
needed and is not redistributed here. Download `ACCESS_latex_template_20240429.zip` from
ieeeaccess.ieee.org and unpack its files into `template/` (git-ignored). Then run
`scripts/build_pdf.sh`, which compiles with pdfLaTeX (TinyTeX works; it is free) and writes
`UrbanFix_IEEE_Access_rev1.pdf`. On Overleaf, upload `latex/` into the "IEEE Access LaTeX
Template" project. The class needs pdfLaTeX; XeTeX-based engines such as tectonic do not work
with it.

Two fixes in `main.tex` make the class work with TikZ: the class redefines the TeX primitive
`\year`, which TikZ needs while loading, and pgf drops the page resource that holds the class's
PANTONE spot colour, so `accessblue` is redefined with the same CMYK values.
