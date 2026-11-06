#!/usr/bin/env python3
"""그림 디렉터리 하나를 웹에서 둘러보는 뷰어(HTML 한 장)를 만든다.

    diagram_viewer.py <그림 디렉터리> -o 그림-뷰어.html [--title 제목] [--palette _palette.mmd]

디렉터리의 .mmd 를 모두 읽고, 옆에 렌더된 .svg 를 넣는다(.svg 가 없는 그림은 건너뛰고
알린다 — render.sh 로 먼저 그린다). 뷰어는:

- 왼쪽: 그림 목록. 요약 그림 아래에 그 상자를 펼친 그림이 달린다.
- 가운데: 그림. 휠로 확대 · 끌어서 이동. 상자를 누르면 정보, 두 번 누르면 펼친 그림으로 들어간다.
- 오른쪽: 누른 요소의 정보(모양 · 색의 뜻 · 들어갈 그림 · 같은 라벨이 나오는 다른 그림)와
  이 그림의 범례(항목에 올리면 쓰인 곳만 켜진다).
- 위: 그림 제목 · 질문 · 요소 라벨 검색, 기호 전체 보기.

그림 사이의 연결은 .mmd 에서 뽑는다:
- `click <id> href "<경로>"` — 경로의 파일 이름이 다른 그림과 같으면(`X` 또는 `d-X`) 그 그림으로 들어간다.
- `%% 요약 그림 d-X 의 ② 상자를 펼친 것` — d-X 의 ② 로 시작하는 상자에서 이 그림으로 들어간다.
- 파일 이름 `d-X-stepK` — 주석이 없으면 d-X 아래에 단다.

용어 설명: 그림에 `%% 용어: frontier, R, r′=r′ (FK triple)` 줄을 두면 용어집(`--glossary`, 기본은
그림 디렉터리나 그 위의 `용어.md` · `glossary.md`)의 그 행 뜻을 뷰어에 싣는다. `글자=용어집 키` 는
그림에 적힌 글자와 용어집 행 이름이 다를 때(같은 기호가 두 뜻일 때) 쓴다. 뜻은 그림 위에 붙이지 않고
상자를 눌렀을 때 정보 칸 · 정보 칸의 "용어" 탭 · 제목과 질문의 점선 밑줄 tooltip 에만 나온다.
`%% 설명 <상자 id>: 글` 은 그 상자를 눌렀을 때 정보 칸 맨 위에만 나오는 부연이다(모델 · 개수 · 검사 목록처럼
상자에 쓰면 덕지덕지해지는 것).

디렉터리에 `_elements.md`(공유 요소 목록, elements_lint.py 참고)가 있으면 그 id 의 요소는
"이 요소가 나오는 그림"을 모두 보여 주고, 목록 아래에 공유 요소 목록이 붙는다. 없으면 라벨
글자가 같은 요소만 이어 준다.
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import legend_page as lp  # noqa: E402
import elements_lint as el  # noqa: E402

MARKS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"


def route_key(stem, i, used):
    k = stem if re.fullmatch(r"[A-Za-z0-9-]+", stem) and stem not in ("vocab",) else f"v{i}"
    while k in used:
        k += "-x"
    used.add(k)
    return k


def read_diagram(mmd, vocab, palette_boxes):
    text = mmd.read_text(encoding="utf-8")
    title_m = re.search(r"^title:\s*(.+)$", text, re.M)
    title = title_m.group(1).strip() if title_m else mmd.stem
    q = re.search(r"%%\s*답하는 질문:\s*(.+)$", text, re.M)
    d = {"stem": mmd.stem, "file": mmd.name, "title": title, "question": q.group(1).strip() if q else "",
         "nodes": {}, "rows": {}, "unused": [], "flow": False, "io": []}
    try:
        _, _, nodes, edges, _ = lp.parse_mmd(mmd)
        # 입출력 라벨: 마름모에서 나가지 않는 선의 라벨 (마름모에서 나가면 갈래 라벨)
        d["io"] = [e[4] for e in edges if e[3] and nodes.get(e[0], {}).get("shape") != "diam"]
        d["elabels"] = [[e[4], re.sub(r"<br\s*/?>", " ", e[3])] for e in edges if e[3]]
        ex, _, _, _ = lp.build_example(mmd, vocab, None, palette_boxes)
        d["rows"], d["unused"], d["flow"] = ex["rows"], ex["unused"], True
        cls_of = {c["cls"]: c for c in vocab["classes"]}
        shape_of = {s["key"]: s for s in vocab["shapes"]}
        for nid, n in nodes.items():
            c = cls_of.get(n["cls"]) if n["cls"] else None
            s = shape_of.get(n["shape"])
            d["nodes"][nid] = {
                "label": n["label"],
                "shape": s["name"] if s else n["shape"], "shapeMeaning": s["meaning"] if s else "",
                "cls": c["name"] if c else (n["cls"] or ""), "clsLook": c["look"] if c else "",
                "clsMeaning": c["meaning"] if c else "", "note": bool(n["cls"] in ("note", "warn")),
            }
    except SystemExit as e:  # flowchart 가 아닌 그림: 보기만 한다
        d["skip_reason"] = str(e)
    # 상자 설명: 그림에는 안 싣고, 상자를 눌렀을 때 정보 칸에만
    for nid, more in re.findall(r"^%%\s*설명\s+(\S+?):\s*(.+)$", text, re.M):
        if nid in d["nodes"]:
            d["nodes"][nid]["more"] = more.strip()
        else:
            print(f"! 설명의 상자 id 없음: {mmd.name} · {nid}", file=sys.stderr)
    d["clicks"] = re.findall(r'^\s*click\s+(\w+)\s+href\s+"([^"]+)"', text, re.M)
    sm = re.search(r"%%\s*요약 그림\s+(\S+)\s+의\s+(.+?)\s*상자를 펼친 것", text)
    d["step_of"] = (sm.group(1), sm.group(2)) if sm else None
    if not d["step_of"]:
        fm = re.match(r"(.+)-step\d+$", mmd.stem)
        if fm:
            d["step_of"] = (fm.group(1), "")
    return d


GLOSSARY_NAMES = ("용어.md", "glossary.md")


def find_glossary(d):
    for p in (d, d.parent, d.parent.parent):
        for n in GLOSSARY_NAMES:
            if (p / n).exists():
                return p / n
    return None


def read_glossary(path):
    """Markdown 표의 행을 {키: {name, tr, def, page}} 로 읽는다. 첫 열이 키, 머리글에 '뜻' · '정의' 가 든 열이 뜻."""
    out, head = {}, None
    split = lambda line: [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", line.strip().strip("|"))]
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.lstrip().startswith("|"):
            head = None
            continue
        cells = split(line)
        if head is None:
            head = cells
            continue
        if all(re.fullmatch(r":?-+:?", c) for c in cells if c):
            continue
        col = lambda *ws: next((i for i, h in enumerate(head) if any(w in h for w in ws)), None)
        di, ti, pi = col("뜻", "정의", "Definition", "meaning"), col("번역"), col("쪽", "page")
        if di is None or di >= len(cells):
            continue
        # 키 열: 머리글이 '용어' · '말' · '기호' 인 열, 없으면 첫 열. 링크 · 백틱은 벗긴다
        ki = next((i for i, h in enumerate(head) if h in ("용어", "말", "기호", "term", "Term")), 0)
        if ki >= len(cells) or ki == di:
            continue
        key = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cells[ki]).replace("`", "").strip()
        if not key:
            continue
        row = {"name": key, "tr": cells[ti].replace("`", "") if ti is not None and ti < len(cells) and cells[ti] != key else "",
               "def": re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cells[di]).replace("`", ""), "page": cells[pi] if pi is not None and pi < len(cells) else ""}
        out.setdefault(key, row)
        m = re.fullmatch(r"(.+?) \(([A-Z]{2,6})\)", key)  # foreign key (FK) → foreign key, FK
        if m:
            for alias in m.groups():
                out.setdefault(alias, row)
    return out


BOUND = r"A-Za-z0-9_^′'−-"


def attach_terms(d, text, glossary, warn):
    m = re.search(r"^%%\s*용어:\s*(.+)$", text, re.M)
    if not m:
        return
    terms = {}
    for item in [x.strip() for x in m.group(1).split(",") if x.strip()]:
        shown, _, key = item.partition("=")
        shown, key = shown.strip(), (key or shown).strip()
        row = glossary.get(key)
        if not row:
            warn(f"용어집에 없음: {d['file']} · {key}")
            continue
        t = terms.setdefault(row["name"], {**row, "match": [], "nodes": [], "edges": [], "head": False})
        t["match"].append(shown)
        pat = re.compile(rf"(?<![{BOUND}]){re.escape(shown)}(?![{BOUND}])")
        for nid, n in d["nodes"].items():
            if (pat.search(n["label"]) or pat.search(n.get("more", ""))) and nid not in t["nodes"]:
                t["nodes"].append(nid)
        for eid, lab in d.get("elabels", []):
            if pat.search(lab) and eid not in t["edges"]:
                t["edges"].append(eid)
        if pat.search(d["title"] + " " + d["question"]):
            t["head"] = True
        if not t["nodes"] and not t["edges"] and not t["head"]:
            warn(f"그림에 안 나옴: {d['file']} · {shown}")
    d["terms"] = list(terms.values())


def link(diagrams):
    by_stem = {d["stem"]: d for d in diagrams}
    for d in diagrams:
        d["drill"], d["outside"] = {}, {}
    # click → 다른 그림
    for d in diagrams:
        for nid, href in d["clicks"]:
            stem = Path(href).stem
            t = by_stem.get(stem) or by_stem.get("d-" + stem)
            if t and t is not d:
                d["drill"].setdefault(nid, []).append(t["key"])
            else:
                d["outside"][nid] = href
    # 펼침 주석 → 요약 그림의 상자
    for d in diagrams:
        if not d["step_of"]:
            continue
        pstem, marks = d["step_of"]
        p = by_stem.get(pstem)
        if not p:
            continue
        d["step_parent"] = p["key"]
        wanted = [m for m in marks if m in MARKS]
        for nid, n in p["nodes"].items():
            if any(n["label"].startswith(m) for m in wanted):
                p["drill"].setdefault(nid, []).append(d["key"])
                d.setdefault("parent_nodes", []).append(nid)
    # 나무: 펼침은 요약 아래, 나머지는 click 이 많은 그림부터 너비 우선으로 처음 닿은 곳 아래
    keyed = {d["key"]: d for d in diagrams}
    parent = {d["key"]: d.get("step_parent") for d in diagrams}
    outs = {d["key"]: [t for ts in d["drill"].values() for t in ts if not keyed[t].get("step_parent")] for d in diagrams}
    seen = {k for k, v in parent.items() if v}
    expanded = set()
    # 요약 그림(펼침 부모가 없는 것)부터, 이미 자리가 있는 펼침 그림도 그 click 을 따라간다.
    # 펼침 그림은 요약 그림보다 늘 뒤다: 요약 그림이 되돌아가는 링크(예: 하위 → 맨 위)로 target 이 되어도
    # 펼침 그림이 먼저 출발점이 되면 요약 그림을 자기 아래로 잡아 부모 고리가 생긴다.
    targets = {t for ts in outs.values() for t in ts}
    order = sorted(diagrams, key=lambda d: (bool(parent[d["key"]]), d["key"] in targets, -len(outs[d["key"]]), d["stem"]))

    def is_ancestor(a, k):
        """a 가 k 자신이거나 k 의 위 그림 사슬에 있으면 True."""
        walked = set()
        while k and k not in walked:
            if k == a:
                return True
            walked.add(k)
            k = parent[k]
        return False

    for root in order:
        if root["key"] in expanded:
            continue
        seen.add(root["key"])
        queue = [root["key"]]
        while queue:
            k = queue.pop(0)
            if k in expanded:
                continue
            expanded.add(k)
            for t in outs[k]:
                if t not in seen and not is_ancestor(t, k):
                    seen.add(t)
                    parent[t] = k
                    queue.append(t)
    for d in diagrams:
        d["parent"] = parent[d["key"]]
        for k in ("clicks", "step_of", "elabels"):
            d.pop(k, None)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", type=Path)
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--title", help="기본: 디렉터리 이름 (그림 · wiki · docs 같은 이름이면 위로 올라간 이름)")
    ap.add_argument("--palette", type=Path, help="기본: 디렉터리의 _palette.mmd, 없으면 스킬의 것")
    ap.add_argument("--glossary", type=Path, help="용어 설명을 가져올 Markdown 표. 기본: 그림 디렉터리나 그 위의 용어.md · glossary.md")
    ap.add_argument("--grammar", type=Path, default=HERE.parent / "references" / "grammar.md")
    a = ap.parse_args()

    palette = a.palette or (a.dir / "_palette.mmd" if (a.dir / "_palette.mmd").exists() else HERE / "_palette.mmd")
    vocab = lp.build_vocab(a.grammar, palette)
    _, palette_boxes = lp.read_palette(palette)

    gpath = a.glossary or find_glossary(a.dir.resolve())
    glossary = read_glossary(gpath) if gpath and gpath.exists() else {}
    term_warns = []

    diagrams, used = [], set()
    for i, mmd in enumerate(sorted(p for p in a.dir.rglob("*.mmd") if not p.name.startswith("_"))):
        svg = mmd.with_suffix(".svg")
        if not svg.exists():
            print(f"! svg 없음, 건너뜀: {mmd.relative_to(a.dir)}  (render.sh 로 먼저 그린다)", file=sys.stderr)
            continue
        d = read_diagram(mmd, vocab, palette_boxes)
        attach_terms(d, mmd.read_text(encoding="utf-8"), glossary, term_warns.append)
        d["key"] = route_key(mmd.stem, i, used)
        d["svg"] = re.sub(r"<\?xml[^>]*\?>", "", svg.read_text(encoding="utf-8"))
        if "skip_reason" in d:
            print(f"· 범례 없이 넣음 (flowchart 아님): {mmd.name}", file=sys.stderr)
            d.pop("skip_reason")
        diagrams.append(d)
    for w in term_warns:
        print(f"! {w}", file=sys.stderr)
    if not diagrams:
        sys.exit(f"{a.dir}: 렌더된 그림(.mmd + .svg)이 없다")
    link(diagrams)

    # 공유 요소 (_elements.md): 요소마다 나오는 그림, 그리고 검사 결과
    reg, reg_problems = el.parse_registry(a.dir / "_elements.md")
    elements = {}
    for eid, e in reg.items():
        # [그림 key, 그 그림의 노드 id]. <id>_prev(앞 차례 상태)도 같은 요소다
        uses = [[d["key"], n] for d in diagrams for n in (eid, eid + "_prev") if n in d["nodes"]]
        elements[eid] = {**e, "uses": uses}
    lint_msgs = []
    if reg:
        classes, _ = lp.read_palette(palette)
        errors, warns, _ = el.lint(a.dir, reg, el.collect(a.dir), classes)
        lint_msgs = reg_problems + errors + warns
        for m in reg_problems + errors:
            print(f"✗ {m}", file=sys.stderr)

    # 제목: "그림" · "wiki" · "docs" 같은 이름은 건너뛰고 위로 올라간다
    generic = {"그림", "wiki", "docs", "doc", "diagrams", "diagram", "figures", "위키"}
    p = a.dir.resolve()
    while p.name.lower() in generic and p.parent != p:
        p = p.parent
    title = a.title or p.name
    data = {"title": title, "terms": lp.TERMS, "vocab": vocab, "diagrams": diagrams,
            "elements": elements, "lint": lint_msgs}
    tpl = lp.inline_shared((HERE / "viewer.template.html").read_text(encoding="utf-8"))
    js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    out = tpl.replace("/*DATA*/", js, 1).replace("{{TITLE}}", title.replace("<", ""), 1)
    Path(a.out).write_text(out, encoding="utf-8")
    roots = sum(1 for d in diagrams if not d["parent"])
    drills = sum(len(d["drill"]) for d in diagrams)
    nterm = sum(len(d.get("terms", [])) for d in diagrams)
    gl = f" · 용어 {nterm}개 ({gpath.name})" if glossary else ""
    print(f"→ {a.out}  (그림 {len(diagrams)}장 · 맨 위 {roots}장 · 들어가는 상자 {drills}개 · 공유 요소 {len(elements)}개{gl})")


if __name__ == "__main__":
    main()
