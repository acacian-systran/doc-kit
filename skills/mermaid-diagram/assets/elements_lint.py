#!/usr/bin/env python3
"""그림 사이에 공유되는 요소가 서로 어긋나지 않는지 검사한다 (읽기 전용).

    elements_lint.py <그림 디렉터리>            # _elements.md 기준으로 검사, 오류가 있으면 exit 1
    elements_lint.py <그림 디렉터리> --suggest  # 등록 후보만 보여 준다 (_elements.md 가 없어도 된다)

`_elements.md` 는 그림 디렉터리에 두는 공유 요소 목록이다. 둘 이상의 그림에 나오는 것만
적는다. 그림 안에서만 쓰는 상자는 적지 않고 id 도 자유롭게 둔다.

    | id | 이름 | 모양 | 색 | 설명 |
    |---|---|---|---|---|
    | core_O | core ontology O_t | 실린더 | canon | table 마다 결과가 쌓이는 곳 |
    | gen_llm | Gen-LLM | 단계 | nondet | 프롬프트로 ΔO_r 를 만든다 |

- id: 모든 그림에서 이 요소는 이 id 로 쓴다. ASCII 단어(`[A-Za-z0-9_]`).
- 모양: 저장소면 `실린더` · `문서`(그림마다 같아야 한다). 하는 일이면 `단계` — 그 그림에서의
  역할에 따라 사각형 · 서브루틴 · 마름모 · 스타디움 중 무엇이어도 된다(자기 그림에서는 사각형,
  남의 그림에서는 서브루틴인 것이 보통이다).
- 색: 팔레트 클래스 이름. 그림마다 같아야 한다.

검사:
  ✗ 등록된 id 의 색이 다르다 · 저장소 모양이 다르다
  ! 등록된 id 가 어느 그림에도 없다 · 한 그림에만 있다
  ? 등록되지 않은 id 들이 같은 라벨로 둘 이상의 그림에 나온다 (등록 후보)
"""
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import legend_page as lp  # noqa: E402

STORAGE = {"실린더": "cyl", "문서": "doc"}
KINDS = set(STORAGE) | {"단계"}


def parse_registry(path):
    """_elements.md → {id: {name, shape, cls, desc}}. 없으면 빈 dict."""
    if not path.exists():
        return {}, []
    reg, problems = {}, []
    for no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = lp.split_row(s)
        if len(cells) < 4 or cells[0] in ("id", "") or set(cells[0]) <= set("-: "):
            continue
        eid = cells[0].strip("`")
        name, shape, cls = cells[1], cells[2], cells[3].strip("`")
        desc = cells[4] if len(cells) > 4 else ""
        if not re.fullmatch(r"[A-Za-z0-9_]+", eid):
            problems.append(f"{path.name}:{no}: id '{eid}' 는 ASCII 단어가 아니다")
            continue
        if shape not in KINDS:
            problems.append(f"{path.name}:{no}: 모양 '{shape}' — 실린더 · 문서 · 단계 중 하나")
        if eid in reg:
            problems.append(f"{path.name}:{no}: id '{eid}' 가 두 번 있다")
        reg[eid] = {"name": name, "shape": shape, "cls": cls, "desc": desc}
    return reg, problems


def collect(dirpath):
    """그림마다 노드 {id: {label, shape, cls}}. flowchart 가 아닌 그림은 건너뛴다."""
    out = {}
    for p in sorted(x for x in dirpath.rglob("*.mmd") if not x.name.startswith("_")):
        try:
            _, _, nodes, _, _ = lp.parse_mmd(p)
        except SystemExit:
            continue
        out[p.stem] = {i: n for i, n in nodes.items() if n["cls"] not in ("note", "warn")}
    return out


def lint(dirpath, reg, diagrams, classes):
    errors, warns, hints = [], [], []
    where = defaultdict(list)
    for stem, nodes in diagrams.items():
        for nid, n in nodes.items():
            # <id>_prev 는 같은 저장소의 앞 차례 상태 (grammar.md "입출력")
            base = nid[:-5] if nid.endswith("_prev") and nid[:-5] in reg else nid
            where[base].append((stem, n))
    for eid, e in reg.items():
        if e["cls"] not in classes:
            errors.append(f"_elements.md: {eid} 의 색 '{e['cls']}' 가 팔레트에 없다")
        uses = where.get(eid, [])
        if not uses:
            warns.append(f"{eid} ({e['name']}): 어느 그림에도 없다")
        elif len({s for s, _ in uses}) == 1:
            warns.append(f"{eid} ({e['name']}): {uses[0][0]} 한 장에만 있다 — 공유 요소가 아니면 목록에서 뺀다")
        for stem, n in uses:
            if n["cls"] != e["cls"]:
                errors.append(f"{stem}.mmd: {eid} 의 색이 '{n['cls']}' — 목록은 '{e['cls']}'  (라벨: {n['label'][:40]})")
            want = STORAGE.get(e["shape"])
            if want and n["shape"] != want:
                errors.append(f"{stem}.mmd: {eid} 의 모양이 저장소 '{e['shape']}' 가 아니다  (라벨: {n['label'][:40]})")
            if not want and e["shape"] == "단계" and n["shape"] in ("cyl", "doc"):
                errors.append(f"{stem}.mmd: {eid} 는 단계인데 저장소 모양으로 그렸다  (라벨: {n['label'][:40]})")
    # 등록 후보: 같은 라벨이 다른 그림에 다른(또는 같은) 미등록 id 로
    by_label = defaultdict(set)
    for stem, nodes in diagrams.items():
        for nid, n in nodes.items():
            if nid in reg or (nid.endswith("_prev") and nid[:-5] in reg):
                continue
            key = re.sub(r"\s+", " ", n["label"].lower()).strip()
            by_label[key].add((stem, nid))
    for label, uses in sorted(by_label.items()):
        stems = {s for s, _ in uses}
        if len(stems) >= 2:
            ids = sorted({i for _, i in uses})
            hints.append(f"'{label[:40]}' — {len(stems)}장에 id {', '.join(ids)} 로 나온다: {', '.join(sorted(stems))}")
    return errors, warns, hints


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", type=Path)
    ap.add_argument("--suggest", action="store_true", help="등록 후보(?)만 보여 준다")
    ap.add_argument("--palette", type=Path)
    a = ap.parse_args()
    palette = a.palette or (a.dir / "_palette.mmd" if (a.dir / "_palette.mmd").exists() else HERE / "_palette.mmd")
    classes, _ = lp.read_palette(palette)
    reg, problems = parse_registry(a.dir / "_elements.md")
    diagrams = collect(a.dir)
    errors, warns, hints = lint(a.dir, reg, diagrams, classes)
    if a.suggest:
        for h in hints:
            print("? " + h)
        print(f"= 등록 후보 {len(hints)}개")
        return
    if not reg and not problems:
        print(f"! {a.dir}/_elements.md 가 없다. --suggest 로 후보를 보고 만든다")
    for m in problems + errors:
        print("✗ " + m)
    for m in warns:
        print("! " + m)
    for m in hints:
        print("? " + m)
    print(f"= 그림 {len(diagrams)}장 · 공유 요소 {len(reg)}개 · 오류 {len(problems) + len(errors)} · 경고 {len(warns)} · 후보 {len(hints)}")
    if problems or errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
