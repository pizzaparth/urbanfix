#!/usr/bin/env bash
# Build the revised manuscript PDF with the official IEEE Access class and pdfLaTeX.
#
#   paper/urbanfix_ieee_access_rev1/scripts/build_pdf.sh
#
# Needs: the template files from ACCESS_latex_template_20240429.zip (ieeeaccess.ieee.org)
# unpacked into paper/urbanfix_ieee_access_rev1/template/ (git-ignored), and pdflatex
# (for example TinyTeX in ~/Library/TinyTeX with the packages cite, booktabs, pgf, xcolor,
# revtex, url, courier, helvetic, psnfss). Writes UrbanFix_IEEE_Access_rev1.pdf next to latex/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
for d in "$HOME"/Library/TinyTeX/bin/*; do [ -d "$d" ] && PATH="$d:$PATH"; done
command -v pdflatex >/dev/null || { echo "pdflatex not found" >&2; exit 1; }
[ -f "$HERE/template/ieeeaccess.cls" ] || { echo "template/ieeeaccess.cls missing; see README.md" >&2; exit 1; }
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT
cp -R "$HERE/latex/." "$BUILD/"
cp "$HERE/template/"* "$BUILD/"
rm -f "$BUILD/access.tex"
cd "$BUILD"
for _ in 1 2 3; do pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null; done
if grep -E "Reference .* undefined|Citation .* undefined" main.log; then
  echo "undefined references or citations" >&2; exit 1
fi
cp main.pdf "$HERE/UrbanFix_IEEE_Access_rev1.pdf"
echo "wrote $HERE/UrbanFix_IEEE_Access_rev1.pdf ($(pdfinfo main.pdf 2>/dev/null | awk '/Pages/ {print $2}') pages)"
