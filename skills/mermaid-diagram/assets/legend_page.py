#!/usr/bin/env python3
"""그림 기호 읽는 법 페이지(HTML 한 장)를 만든다.

    # 전체 기호만 — 스킬을 처음 보는 사람용
    legend_page.py -o legend.html

    # 전체 기호 + 예시 그림 탭 — 예시 그림은 쓰는 사람이 고른다
    legend_page.py --example d-이름.mmd [--svg d-이름.svg] [--notes notes.json] -o 읽는-법.html

    # 예시 그림에서 찾은 기호와 notes 키를 보여 주기만 한다 (notes 를 쓰기 전에)
    legend_page.py --example d-이름.mmd --list

전체 기호의 뜻과 색은 손으로 옮겨 적지 않는다. 모양 · 선 · 색의 표는
references/grammar.md, 색 값과 뜻은 _palette.mmd 에서 읽는다. 팔레트를 고쳤으면
이 스크립트를 다시 돌린다.

예시 탭은 .mmd 에서 쓰인 모양 · 색(classDef) · 선 · 묶음을 찾고, 렌더된 .svg 를 페이지에
넣어 항목을 누르면 해당 노드와 선만 진하게 보이게 한다. flowchart 만 받는다.

notes.json (선택, Claude 가 쓴다):
    {
      "question": "답하는 질문 (없으면 .mmd 의 '%% 답하는 질문:' 주석)",
      "reading": ["읽는 순서 1", "읽는 순서 2", ...],
      "items": {"shape:cyl": "이 그림에서 실린더가 뜻하는 것", "class:ext": "...",
                "line:thick": "...", "line:label": "...", "box:영역": "..."}
    }
items 에 없는 항목은 그 기호를 쓴 노드의 라벨을 나열한다. 키 목록은 --list 로 본다.
"""
import argparse
import html
import json
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

HERE = Path(__file__).resolve().parent

# grammar.md 어휘 표의 이름 → 견본 모양 키
SHAPE_KEY = {"사각형": "rect", "실린더": "cyl", "문서": "doc", "육각형": "hex",
             "마름모": "diam", "서브루틴": "sub", "스타디움": "stad"}
# grammar.md 선 표의 문법 → (견본 키, 이름)
LINE_KEY = OrderedDict([
    ("==>", ("thick", "굵은 실선")), ("-->", ("thin", "가는 실선")), ("-.->", ("dot", "점선")),
    ("--x", ("cross", "끝이 X 인 선")), ("<-->", ("both", "양쪽 화살표")),
    ('-->|"라벨"|', ("label", "선 위 글자")),
])
# 색 클래스와 짝인 모양 (grammar.md 의 "짝" · "실린더" 표기)
PAIR = {"trigger": "hex", "file": "doc", "table": "cyl", "canon": "cyl", "index": "cyl", "filter": "diam"}
# 팔레트 끝 주석의 컨테이너 style 세 벌
BOX_MEANING = {
    "영역": ("점선 묶음", "논리 그룹. 같은 일을 하는 것끼리 묶었다는 뜻이다."),
    "배포": ("굵은 실선 묶음", "배포 경계. 이 안의 것은 같이 올라가고 같이 내려간다."),
    "앱": ("파란 점선 묶음", "앱. 배포 경계 안에서 앱 하나에 속한 것을 묶는다."),
}
# 처음 보는 사람이 모를 만한 말 → tooltip
TERMS = OrderedDict([
    ("정본", "잃으면 복구가 어렵거나 비싼 원본 데이터. 다른 것은 여기서 다시 만들 수 있다."),
    ("트리거", "실행을 시작하게 하는 것. 예: 예약 실행(cron), 사람, HTTP 요청."),
    ("축", "그림의 중심 흐름. 레이아웃 엔진이 이 선들을 한 줄로 세운다."),
    ("배포 경계", "한 번에 올라가고 한 번에 내려가는 단위. 예: 서버 한 대, 컨테이너 하나."),
    ("LLM", "대형 언어 모델. 같은 입력에도 다른 출력을 낼 수 있다."),
    ("비동기", "보내 놓고 답을 기다리지 않는 흐름. 결과는 나중에 따로 받는다."),
])
SHAPE_EXTRA = {  # grammar.md 뜻에 덧붙이는 한 줄 (모양을 처음 보는 사람용)
    "sub": "양옆의 세로줄이 표시다.",
    "doc": "아래가 물결이다.",
}
LINE_EXTRA = {
    "thick": "이 선만 따라가면 전체가 읽힌다.",
    "dot": "이 선을 따라 아무것도 바뀌지 않는다.",
}


def md_table(text, heading):
    """heading 바로 아래 첫 마크다운 표의 행을 셀 목록으로."""
    i = text.find(heading)
    if i < 0:
        sys.exit(f"grammar.md 에 '{heading}' 절이 없다")
    rows = []
    for line in text[i:].splitlines()[1:]:
        s = line.strip()
        if s.startswith("|"):
            cells = split_row(s)
            if not all(set(c) <= set("-: ") for c in cells):
                rows.append(cells)
        elif rows:
            break
    return rows[1:]  # 머리행 제외


def split_row(s):
    """표 한 줄을 셀로. 백틱 안의 | 는 셀 경계가 아니다."""
    cells, cur, tick = [], "", False
    for ch in s.strip()[1:]:
        if ch == "`":
            tick = not tick
        if ch == "|" and not tick:
            cells.append(cur.strip())
            cur = ""
        else:
            cur += ch
    return cells


def strip_md(s):
    return re.sub(r"`([^`]*)`", r"\1", s).replace("**", "")


def sentence(s):
    s = s.strip().rstrip(".")
    return s + "." if s else s


def parse_style(spec):
    st = {}
    for part in spec.split(","):
        if ":" not in part:
            continue
        k, v = part.split(":", 1)
        k, v = k.strip(), v.strip()
        if k == "fill":
            st["fill"] = v
        elif k == "stroke":
            st["stroke"] = v
        elif k == "stroke-dasharray":
            st["dash"] = v
        elif k == "stroke-width":
            st["width"] = float(re.sub(r"[^\d.]", "", v) or 1)
        elif k == "color":
            st["color"] = v
    return st


def read_palette(path):
    text = path.read_text(encoding="utf-8")
    classes, boxes = OrderedDict(), []
    comment = None
    for line in text.splitlines():
        s = line.strip()
        m = re.match(r"%%\s+([a-z]+)\s+(\S+)\s+(.*)$", s)
        if m and "—" in m.group(3):
            comment = [m.group(1), m.group(2), m.group(3).split("—", 1)[1].strip()]
            continue
        if comment and re.match(r"%%\s{4,}\S", s) and not s.startswith("%%   style"):
            comment[2] += " " + s[2:].strip()
            continue
        m = re.match(r"classDef\s+(\w+)\s+(.*)$", s)
        if m:
            cls, spec = m.group(1), m.group(2)
            name, meaning = (comment[1], comment[2]) if comment and comment[0] == cls else (cls, "")
            meaning = re.sub(r"\s*—\s*grammar\.md.*$", "", meaning)
            # "육각형 {{ }} 과 짝" 같은 문법 메모는 뺀다 — 짝 모양은 견본이 보여 준다
            meaning = ". ".join(seg for seg in re.split(r"\.\s+", meaning) if "짝" not in seg).strip()
            classes[cls] = {"cls": cls, "name": name, "meaning": meaning, "style": parse_style(spec)}
            comment = None
            continue
        m = re.match(r"%%\s+style\s+「(\S+?)id」\s+(.*)$", s)
        if m:
            boxes.append((m.group(1), parse_style(m.group(2))))
    if not classes:
        sys.exit(f"{path}: classDef 가 없다")
    return classes, boxes


def border_word(st):
    if st.get("dash"):
        return "점선"
    if st.get("width", 1) >= 2:
        return "굵은 실선"
    return "실선"


def build_vocab(grammar_path, palette_path):
    g = grammar_path.read_text(encoding="utf-8")
    shapes = []
    for syntax, name, meaning in md_table(g, "### 모양")[:]:
        key = SHAPE_KEY.get(name)
        if not key:
            continue
        syn = strip_md(syntax).replace('"x"', "x")
        m = re.match(r"id(.*)$", syn)
        syn = m.group(1) if m else syn
        if key == "doc":
            syn = "shape: doc"
        text = sentence(strip_md(meaning))
        if key in SHAPE_EXTRA:
            text += " " + SHAPE_EXTRA[key]
        shapes.append({"key": key, "name": name, "syntax": syn, "meaning": text})

    looks = {strip_md(r[0]): strip_md(r[2]) for r in md_table(g, "### 색")}
    lines = []
    for syntax, meaning in md_table(g, "### 선"):
        syn = strip_md(syntax)
        if syn not in LINE_KEY:
            continue
        key, name = LINE_KEY[syn]
        text = sentence(strip_md(meaning))
        if key in LINE_EXTRA and LINE_EXTRA[key] not in text:
            text += " " + LINE_EXTRA[key]
        lines.append({"key": key, "name": name, "syntax": syn.replace('"라벨"', '"x"'), "meaning": text})

    classes, boxes = read_palette(palette_path)
    out_classes = []
    for c in classes.values():
        st = dict(c["style"])
        if c["cls"] in ("note", "warn"):
            st = {"text": "각주 글자" if c["cls"] == "note" else "경고각주 글자", "color": st.get("color", "#5A6672")}
        look = looks.get(c["cls"], "")
        if c["cls"] == "warn" and not look:
            look = "붉은 글자"
        out_classes.append({"cls": c["cls"], "name": c["name"], "meaning": sentence(c["meaning"]),
                            "look": look, "pair": PAIR.get(c["cls"], "rect"), "style": st})

    # 바탕색이 같은 클래스 묶음 → 무엇으로 가르나
    callouts = []
    by_fill = OrderedDict()
    for c in out_classes:
        f = c["style"].get("fill")
        if f and f.lower() not in ("transparent",):
            by_fill.setdefault(f.upper(), []).append(c)
    shape_name = {v: k for k, v in SHAPE_KEY.items()}
    for group in by_fill.values():
        if len(group) < 2:
            continue
        borders = {border_word(c["style"]) for c in group}
        if len(borders) == len(group):
            parts = ", ".join(f"{border_word(c['style'])}이면 {c['name']}" for c in group)
            callouts.append(f"<strong>바탕색이 같은 것이 {len(group)}개다.</strong> 테두리로 가른다. {parts}다.")
        else:
            parts = ", ".join(f"{shape_name[c['pair']]}이면 {c['name']}" for c in group)
            callouts.append(f"<strong>색이 같은 것이 {len(group)}개다.</strong> 모양으로 가른다. {parts}다.")

    out_boxes = []
    for tag, st in boxes:
        name, meaning = BOX_MEANING.get(tag, (f"{tag} 묶음", ""))
        out_boxes.append({"key": tag, "tag": tag, "name": name, "meaning": meaning, "style": st})
    return {"shapes": shapes, "classes": out_classes, "lines": lines, "boxes": out_boxes, "callouts": callouts}


# ---------------------------------------------------------------- 예시 그림

OPENERS = [  # (여는 기호, 모양 키) — 긴 것부터
    ("[(", "cyl"), ("[[", "sub"), ("([", "stad"), ("{{", "hex"), ("((", "rect"),
    ("{", "diam"), ("[", "rect"), ("(", "rect"), (">", "rect"),
]
AT_SHAPE = {"cyl": "cyl", "das": "cyl", "lin-cyl": "cyl", "h-cyl": "cyl", "database": "cyl", "db": "cyl",
            "doc": "doc", "docs": "doc", "document": "doc", "lin-doc": "doc", "tag-doc": "doc",
            "hex": "hex", "hexagon": "hex", "prepare": "hex", "diam": "diam", "diamond": "diam",
            "decision": "diam", "question": "diam", "subproc": "sub", "subroutine": "sub", "fr-rect": "sub",
            "stadium": "stad", "pill": "stad", "terminal": "stad"}
EDGE_RX = re.compile(r'\s*(<-->|==>|-\.->|-\.-|--x|-->|---)\s*(?:\|"?([^|"]*)"?\|)?\s*')
# "-.-" 는 각주를 대상에 붙이는 선이다. 선 항목이 아니라 각주 색 항목에 딸린다.
OP_KEY = {"==>": "thick", "-->": "thin", "-.->": "dot", "--x": "cross", "<-->": "both", "---": "thin", "-.-": "note"}
NOTE_CLS = ("note", "warn")


def clean_label(s):
    s = re.sub(r"<br\s*/?>", " ", s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(re.sub(r"\s+", " ", s)).strip().strip("`")


def parse_mmd(path):
    text = path.read_text(encoding="utf-8")
    title = ""
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    body = text
    if m:
        t = re.search(r"^title:\s*(.+)$", m.group(1), re.M)
        title = t.group(1).strip() if t else ""
        body = text[m.end():]
    if not re.search(r"^\s*(flowchart|graph)\b", body, re.M):
        sys.exit(f"{path}: flowchart 만 받는다 (예시 탭은 노드 · 선 하이라이트가 flowchart 기준이다)")
    q = re.search(r"%%\s*답하는 질문:\s*(.+)$", body, re.M)
    question = q.group(1).strip() if q else ""
    # 팔레트 블록은 빼고 읽는다
    body = re.sub(r"%% palette:begin.*?%% palette:end", "", body, flags=re.S)

    nodes = OrderedDict()   # id → {shape, label, cls}
    edges = []              # (from, to, op, label, edge_id)
    subgraphs = OrderedDict()  # id → {label, style}
    pair_count = Counter()

    def node(nid):
        return nodes.setdefault(nid, {"shape": "rect", "label": nid, "cls": None, "defined": False})

    for raw in body.splitlines():
        line = raw.strip()
        if not line or line.startswith("%%"):
            continue
        m = re.match(r"subgraph\s+(\w+)\s*(?:\[\"?([^\]\"]*)\"?\])?", line)
        if m:
            subgraphs[m.group(1)] = {"label": m.group(2) or m.group(1), "style": None}
            continue
        m = re.match(r"style\s+(\w+)\s+(.*)$", line)
        if m:
            if m.group(1) in subgraphs:
                subgraphs[m.group(1)]["style"] = parse_style(m.group(2))
            continue
        m = re.match(r"class\s+([\w,]+)\s+(\w+)", line)
        if m:
            for nid in m.group(1).split(","):
                node(nid)["cls"] = m.group(2)
            continue
        if re.match(r"(classDef|linkStyle|click|direction|flowchart|graph)\b", line) or line == "end":
            continue
        # @{ shape: x, label: "..." }
        for m in re.finditer(r"(\w+)@\{([^}]*)\}", line):
            n = node(m.group(1))
            sh = re.search(r"shape:\s*([\w-]+)", m.group(2))
            lb = re.search(r'label:\s*"([^"]*)"', m.group(2))
            n["shape"] = AT_SHAPE.get(sh.group(1), "rect") if sh else "rect"
            if lb:
                n["label"] = clean_label(lb.group(1))
            n["defined"] = True
        line_nolabel = re.sub(r"\w+@\{[^}]*\}", lambda mm: mm.group(0).split("@")[0], line)
        # 노드 정의 id["라벨"] 등
        for m in re.finditer(r"(\w+)\s*(\[\(|\[\[|\(\[|\{\{|\(\(|\{|\[|\(|>)\s*(\"[^\"]*\"|[^\]\)\}\"]*)", line_nolabel):
            nid, op, lab = m.group(1), m.group(2), m.group(3)
            if nid in ("subgraph", "click", "style", "classDef"):
                continue
            # 선 라벨 |"x"| 의 일부를 노드로 잡지 않게
            before = line_nolabel[:m.start()]
            if before.count("|") % 2 == 1:
                continue
            n = node(nid)
            n["shape"] = dict(OPENERS)[op]
            n["label"] = clean_label(lab.strip('"')) or nid
            n["defined"] = True
        # 선: 노드 정의 · 클래스 표기를 지운 뒤 자른다
        stripped = re.sub(r'"[^"]*"', '""', line_nolabel)
        stripped = re.sub(r"(\w+)\s*(\[\(|\[\[|\(\[|\{\{|\(\(|\{|\[|\(|>)[^\s]*?(\)\]|\]\]|\]\)|\}\}|\)\)|\}|\]|\))", r"\1", stripped)
        for m in re.finditer(r"(\w+):::(\w+)", stripped):
            node(m.group(1))["cls"] = m.group(2)
        stripped = re.sub(r":::\w+", "", stripped)
        # 라벨 자리는 원래 줄에서 다시 뽑는다
        labels = [mm.group(2) for mm in EDGE_RX.finditer(line_nolabel) if mm.group(1)]
        parts = EDGE_RX.split(stripped)
        if len(parts) < 4:
            continue
        ids = parts[0::3]
        ops = parts[1::3]
        for k, op in enumerate(ops):
            a = re.match(r"\s*(\w+)", ids[k] or "")
            b = re.match(r"\s*(\w+)", ids[k + 1] or "")
            if not a or not b or "&" in (ids[k] or "") + (ids[k + 1] or ""):
                continue
            a, b = a.group(1), b.group(1)
            node(a), node(b)
            eid = f"L_{a}_{b}_{pair_count[(a, b)]}"
            pair_count[(a, b)] += 1
            lab = labels[k] if k < len(labels) else None
            edges.append((a, b, op, (lab or "").strip() or None, eid))
    for sid in subgraphs:
        nodes.pop(sid, None)
    return title, question, nodes, edges, subgraphs


def short(label, n=28):
    return label if len(label) <= n else label[:n - 1] + "…"


def build_example(mmd, vocab, notes, palette_boxes):
    title, question, nodes, edges, subgraphs = parse_mmd(mmd)
    notes = notes or {}
    items = notes.get("items", {})
    shape_name = {s["key"]: s["name"] for s in vocab["shapes"]}
    cls_by = {c["cls"]: c for c in vocab["classes"]}
    line_by = {l["key"]: l for l in vocab["lines"]}
    rows = {"shape": [], "class": [], "line": [], "box": []}
    keys = []

    def names(ids):
        return " · ".join(short(nodes[i]["label"]) for i in ids)

    by_shape = OrderedDict()
    for nid, n in nodes.items():
        if n["cls"] in NOTE_CLS:  # 각주는 상자가 아니다
            continue
        by_shape.setdefault(n["shape"], []).append(nid)
    for key in [s["key"] for s in vocab["shapes"]]:
        if key not in by_shape:
            continue
        ids = by_shape[key]
        k = f"shape:{key}"
        keys.append((k, names(ids)))
        common = Counter(nodes[i]["cls"] for i in ids if nodes[i]["cls"]).most_common(1)
        st = cls_by[common[0][0]]["style"] if common and common[0][0] in cls_by else None
        rows["shape"].append({"key": key, "shape": key, "style": st, "name": shape_name[key],
                              "where": items.get(k, names(ids)), "nodes": ids})

    by_cls = OrderedDict()
    for nid, n in nodes.items():
        if n["cls"]:
            by_cls.setdefault(n["cls"], []).append(nid)
    for c in vocab["classes"]:
        ids = by_cls.get(c["cls"])
        if not ids:
            continue
        k = f"class:{c['cls']}"
        keys.append((k, names(ids)))
        shp = Counter(nodes[i]["shape"] for i in ids).most_common(1)[0][0]
        look = c["look"] or c["name"]
        att = [e[4] for e in edges if e[2] == "-.-" and (e[0] in ids or e[1] in ids)] if c["cls"] in NOTE_CLS else []
        rows["class"].append({"key": c["cls"], "shape": shp, "style": c["style"], "name": f"{c['name']} · {look}",
                              "where": items.get(k, names(ids)), "nodes": ids, "edges": att})
    unknown = [c for c in by_cls if c not in cls_by]

    def edesc(es):
        return " · ".join(f"{short(nodes[a]['label'], 16)} → {short(nodes[b]['label'], 16)}" for a, b, *_ in es)

    by_op = OrderedDict()
    for e in edges:
        by_op.setdefault(OP_KEY[e[2]], []).append(e)
    for l in vocab["lines"]:
        if l["key"] == "label":
            es = [e for e in edges if e[3]]
            desc = " · ".join(f'"{e[3]}"' for e in es)
        else:
            es = by_op.get(l["key"], [])
            desc = edesc(es)
        if not es:
            continue
        k = f"line:{l['key']}"
        keys.append((k, desc))
        rows["line"].append({"key": l["key"], "name": l["name"], "where": items.get(k, desc),
                             "nodes": [], "edges": [e[4] for e in es]})

    for sid, sg in subgraphs.items():
        st = sg["style"] or {}
        tag = next((t for t, pst in palette_boxes if pst == st), None)
        if not tag:
            tag = "배포" if st.get("width", 1) >= 2 else "영역"
        bx = next((b for b in vocab["boxes"] if b["tag"] == tag), None)
        k = f"box:{tag}"
        keys.append((k, sg["label"]))
        rows["box"].append({"key": tag, "tag": tag, "style": bx["style"] if bx else st,
                            "name": bx["name"] if bx else tag, "where": items.get(k, sg["label"]),
                            "nodes": [sid]})

    used = {("shape", r["key"]) for r in rows["shape"]} | {("class", r["key"]) for r in rows["class"]} \
        | {("line", r["key"]) for r in rows["line"]} | {("box", r["key"]) for r in rows["box"]}
    unused = [s["name"] for s in vocab["shapes"] if ("shape", s["key"]) not in used]
    unused += [f"{c['name']} {c['look']}".strip() for c in vocab["classes"] if ("class", c["cls"]) not in used]
    unused += [l["name"] for l in vocab["lines"] if ("line", l["key"]) not in used]
    if not rows["box"]:
        unused.append("묶음 테두리")
    stale = [k for k in items if k not in dict(keys)]
    return {
        "name": notes.get("name") or title or mmd.stem,
        "file": mmd.stem,
        "question": notes.get("question") or question,
        "reading": notes.get("reading", []),
        "rows": rows,
        "unused": unused,
    }, keys, unknown, stale


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-o", "--out")
    ap.add_argument("--example", type=Path, help="예시로 쓸 flowchart .mmd")
    ap.add_argument("--svg", type=Path, help="예시 그림의 렌더 결과 (기본: .mmd 옆 같은 이름 .svg)")
    ap.add_argument("--notes", type=Path, help="읽는 순서 · 항목별 설명 JSON")
    ap.add_argument("--palette", type=Path, help="기본: 예시 옆 _palette.mmd, 없으면 스킬의 것")
    ap.add_argument("--grammar", type=Path, default=HERE.parent / "references" / "grammar.md")
    ap.add_argument("--list", action="store_true", help="예시에서 찾은 기호와 notes 키만 출력")
    a = ap.parse_args()

    palette = a.palette
    if not palette:
        local = a.example.parent / "_palette.mmd" if a.example else None
        palette = local if local and local.exists() else HERE / "_palette.mmd"
    vocab = build_vocab(a.grammar, palette)
    _, palette_boxes = read_palette(palette)

    example, svg_text = None, ""
    if a.example:
        notes = json.loads(a.notes.read_text(encoding="utf-8")) if a.notes else None
        example, keys, unknown, stale = build_example(a.example, vocab, notes, palette_boxes)
        if a.list:
            print(f"# {example['name']}  —  질문: {example['question'] or '(없음)'}")
            for k, d in keys:
                print(f"{k:16} {d}")
            for c in unknown:
                print(f"! 팔레트에 없는 클래스: {c}")
            return
        for c in unknown:
            print(f"! 팔레트에 없는 클래스 (페이지에 안 나옴): {c}", file=sys.stderr)
        for k in stale:
            print(f"! notes 의 키가 그림에 없음: {k}", file=sys.stderr)
        svg_path = a.svg or a.example.with_suffix(".svg")
        if not svg_path.exists():
            sys.exit(f"{svg_path} 가 없다. 먼저 render.sh 로 그린다")
        svg_text = svg_path.read_text(encoding="utf-8")
        svg_text = re.sub(r"<\?xml[^>]*\?>", "", svg_text)
    elif a.list:
        sys.exit("--list 는 --example 과 함께 쓴다")
    if not a.out:
        sys.exit("-o 출력 경로가 필요하다")

    lede = ("이 그림들은 같은 기호 한 벌로 그린다. 라벨을 읽기 전에 모양 · 색 · 선만 보고 구조를 먼저 읽을 수 있게 "
            "하려는 것이다.")
    lede += (f" 첫 탭은 기호 전체, 둘째 탭은 {example['name']} 그림에 실제로 쓰인 기호만 다룬다."
             if example else " 이 페이지는 기호 전체를 다룬다.")
    data = {"lede": lede, "terms": TERMS, "vocab": vocab, "example": example}
    tpl = (HERE / "legend.template.html").read_text(encoding="utf-8")
    js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    out = tpl.replace("/*DATA*/", js, 1).replace("<!--SVG-->", svg_text, 1)
    Path(a.out).write_text(out, encoding="utf-8")
    print(f"→ {a.out}")


if __name__ == "__main__":
    main()
