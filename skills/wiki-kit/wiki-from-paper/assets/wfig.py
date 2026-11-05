"""Paper-wiki figures: screen SVG (light and dark theme via CSS inside the SVG) + PNG (rsvg-convert x2) + step figures.

Ported from rdb2ontology paper/evidence/figures/wiki/wfig.py; the source check reads the paper's pages.

Use (make_w_<name>.py, in <wiki root>/그림/):
    from wfig import WFig
    f = WFig(__file__, "w-attention", width=760, height=420)
    f.part(1); f.t("s1.t", 20, 60, "a", 13.5, 700); f.raw('<rect .../>') ...
    f.build(steps={1: {1, 9}, 2: {2, 9}}, titles={0: "...", 1: "...", 2: "..."})

- Wording: '<name>-labels.md' table '| 자리 | 위치 | 문구 |'. Change only 문구, then rerun.
- Source check: same file, under '## 원문 확인', rows '| p.N | exact words |'. Each must be on page N of
  the paper text (wiki.config.md `sources`, default ../study/paper.txt) or the build stops.
- Shape classes: t (text) m (dim text) a (accent text) okt · badt (right · wrong text) box hl okb badb (dashed)
  grid panel note ln lnbad; markers url(#arr) url(#arrbad)
"""
import re
import shutil
import subprocess
import sys
import unicodedata
from html import escape
from pathlib import Path

STYLE = """
.bg{fill:#ffffff}.t{fill:#1d2329}.m{fill:#5d6873}.a{fill:#1f5f7a}.okt{fill:#2f7a4a}.badt{fill:#b23b2e}
.box{fill:#ffffff;stroke:#1d2329;stroke-width:1.4}.hl{fill:#e2eef3;stroke:#1f5f7a;stroke-width:2}
.okb{fill:#e3f1e7;stroke:#2f7a4a;stroke-width:1.6}.badb{fill:#f8e6e3;stroke:#b23b2e;stroke-width:1.6;stroke-dasharray:6 4}
.grid{stroke:#d5dbe1;stroke-width:1;fill:none}.note{fill:#eef0f2;stroke:#d5dbe1;stroke-width:1}.panel{fill:none;stroke:#d5dbe1;stroke-width:1}
.ln{stroke:#1d2329;stroke-width:1.6;fill:none}.lnbad{stroke:#b23b2e;stroke-width:1.8;fill:none}
@media (prefers-color-scheme: dark){
.bg{fill:#1c2227}.t{fill:#e4e9ee}.m{fill:#9aa6b1}.a{fill:#7cc0dc}.okt{fill:#7fcf98}.badt{fill:#f0907f}
.box{fill:#1c2227;stroke:#e4e9ee}.hl{fill:#1d3440;stroke:#7cc0dc}.okb{fill:#1c3325;stroke:#7fcf98}
.badb{fill:#3d2320;stroke:#f0907f}.grid,.panel{stroke:#343e47}.note{fill:#262d33;stroke:#343e47}.ln{stroke:#e4e9ee}.lnbad{stroke:#f0907f}}
text{font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","Nanum Gothic",sans-serif}
"""
DEFS = """<defs>
<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="t"/></marker>
<marker id="arrbad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="badt"/></marker>
</defs>"""


def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)
    s = s.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    s = s.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    return re.sub(r"\s+", " ", s).strip().lower()


def paper_path(here):
    cfg = (here.parent / "wiki.config.md").read_text(encoding="utf-8")
    m = re.search(r"^sources:\s*(.+)$", cfg, re.M)
    return (here.parent / (m.group(1).strip() if m else "../study/paper.txt")).resolve()


class WFig:
    def __init__(self, here, name, width=760, height=480):
        self.here, self.name, self.w, self.h = Path(here).resolve().parent, name, width, height
        md = (self.here / f"{name}-labels.md").read_text(encoding="utf-8")
        head, _, tail = md.partition("## 원문 확인")
        self.L = {m.group(1): m.group(2) for m in
                  re.finditer(r"^\|\s*([a-z0-9.]+)\s*\|[^|]*\|\s*(.*?)\s*\|\s*$", head, re.M)}
        parts = re.split(r"\[\[p\.(\d+)\]\]", paper_path(self.here).read_text(encoding="utf-8"))
        pages = {int(parts[i]): norm(parts[i + 1]) for i in range(1, len(parts) - 1, 2)}
        self.checks = re.findall(r"^\|\s*p\.(\d+(?:[–-]\d+)?)\s*\|\s*(.+?)\s*\|\s*$", tail, re.M)
        miss = []
        for spec, q in self.checks:
            nums = [int(n) for n in re.split(r"[–-]", spec)]
            hay = " ".join(pages.get(p, "") for p in range(nums[0], nums[-1] + 1))
            if norm(q) not in hay:
                miss.append(f"p.{spec}: {q}")
        if miss or not self.checks:
            sys.exit("원문에 없음: " + "; ".join(miss or ["원문 확인 표가 비었음"]))
        self.parts, self.cur, self.used = {}, None, set()

    def part(self, n):
        self.cur = n
        self.parts.setdefault(n, [])

    def raw(self, el):
        self.parts[self.cur].append(el)

    def t(self, key, x, y, cls="t", size=13, weight=400, anchor="start"):
        self.used.add(key)
        self.raw(f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" font-weight="{weight}" '
                 f'text-anchor="{anchor}">{escape(self.L[key])}</text>')

    def build(self, steps, titles):
        """steps: {step: set of parts drawn at full strength}. Step 0 (whole figure) shows every part."""
        made, png = [], shutil.which("rsvg-convert")
        for step, on in {0: set(self.parts), **steps}.items():
            groups = "\n".join(f'<g opacity="{1 if n in on else 0.13}">\n' + "\n".join(els) + "\n</g>"
                               for n, els in self.parts.items())
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" '
                   f'height="{self.h}" role="img">\n<title>{escape(titles[step])}</title>\n<style>{STYLE}</style>\n'
                   f'{DEFS}\n<rect x="0" y="0" width="{self.w}" height="{self.h}" class="bg"/>\n{groups}\n</svg>\n')
            out = self.name if step == 0 else f"{self.name}-step{step}"
            (self.here / f"{out}.svg").write_text(svg, encoding="utf-8")
            if png:
                subprocess.run([png, "-z", "2", "-o", str(self.here / f"{out}.png"),
                                str(self.here / f"{out}.svg")], check=True)
            made.append(out)
        print(f"만듦: {', '.join(made)} (.svg{' · .png' if png else ''}, 원문 확인 {len(self.checks)}개 통과)")
        for k in sorted(set(self.L) - self.used):
            print("경고 · 그림에 안 쓰인 자리:", k, file=sys.stderr)
