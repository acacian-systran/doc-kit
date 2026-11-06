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
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import legend_page as lp  # noqa: E402

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
         "nodes": {}, "rows": {}, "unused": [], "flow": False}
    try:
        _, _, nodes, _, _ = lp.parse_mmd(mmd)
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
    d["clicks"] = re.findall(r'^\s*click\s+(\w+)\s+href\s+"([^"]+)"', text, re.M)
    sm = re.search(r"%%\s*요약 그림\s+(\S+)\s+의\s+(.+?)\s*상자를 펼친 것", text)
    d["step_of"] = (sm.group(1), sm.group(2)) if sm else None
    if not d["step_of"]:
        fm = re.match(r"(.+)-step\d+$", mmd.stem)
        if fm:
            d["step_of"] = (fm.group(1), "")
    return d


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
    order = sorted(diagrams, key=lambda d: (-len(outs[d["key"]]), d["stem"]))
    for root in order:
        if root["key"] in seen:
            continue
        seen.add(root["key"])
        queue = [root["key"]]
        while queue:
            k = queue.pop(0)
            for t in outs[k]:
                if t not in seen:
                    seen.add(t)
                    parent[t] = k
                    queue.append(t)
    for d in diagrams:
        d["parent"] = parent[d["key"]]
        for k in ("clicks", "step_of"):
            d.pop(k, None)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", type=Path)
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--title", help="기본: 디렉터리 이름 (그림 · wiki · docs 같은 이름이면 위로 올라간 이름)")
    ap.add_argument("--palette", type=Path, help="기본: 디렉터리의 _palette.mmd, 없으면 스킬의 것")
    ap.add_argument("--grammar", type=Path, default=HERE.parent / "references" / "grammar.md")
    a = ap.parse_args()

    palette = a.palette or (a.dir / "_palette.mmd" if (a.dir / "_palette.mmd").exists() else HERE / "_palette.mmd")
    vocab = lp.build_vocab(a.grammar, palette)
    _, palette_boxes = lp.read_palette(palette)

    diagrams, used = [], set()
    for i, mmd in enumerate(sorted(p for p in a.dir.rglob("*.mmd") if not p.name.startswith("_"))):
        svg = mmd.with_suffix(".svg")
        if not svg.exists():
            print(f"! svg 없음, 건너뜀: {mmd.relative_to(a.dir)}  (render.sh 로 먼저 그린다)", file=sys.stderr)
            continue
        d = read_diagram(mmd, vocab, palette_boxes)
        d["key"] = route_key(mmd.stem, i, used)
        d["svg"] = re.sub(r"<\?xml[^>]*\?>", "", svg.read_text(encoding="utf-8"))
        if "skip_reason" in d:
            print(f"· 범례 없이 넣음 (flowchart 아님): {mmd.name}", file=sys.stderr)
            d.pop("skip_reason")
        diagrams.append(d)
    if not diagrams:
        sys.exit(f"{a.dir}: 렌더된 그림(.mmd + .svg)이 없다")
    link(diagrams)

    # 제목: "그림" · "wiki" · "docs" 같은 이름은 건너뛰고 위로 올라간다
    generic = {"그림", "wiki", "docs", "doc", "diagrams", "diagram", "figures", "위키"}
    p = a.dir.resolve()
    while p.name.lower() in generic and p.parent != p:
        p = p.parent
    title = a.title or p.name
    data = {"title": title, "terms": lp.TERMS, "vocab": vocab, "diagrams": diagrams}
    tpl = lp.inline_shared((HERE / "viewer.template.html").read_text(encoding="utf-8"))
    js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    out = tpl.replace("/*DATA*/", js, 1).replace("{{TITLE}}", title.replace("<", ""), 1)
    Path(a.out).write_text(out, encoding="utf-8")
    roots = sum(1 for d in diagrams if not d["parent"])
    drills = sum(len(d["drill"]) for d in diagrams)
    print(f"→ {a.out}  (그림 {len(diagrams)}장 · 맨 위 {roots}장 · 들어가는 상자 {drills}개)")


if __name__ == "__main__":
    main()
