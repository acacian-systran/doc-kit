#!/usr/bin/env python3
"""cards.csv(원본) → quizlet.txt · anki.txt · cards.md

    python3 export.py papers/<citekey>/vocab/cards.csv [--no-example]

cards.csv 열: kind,term,pos,meaning,everyday,outside,example,anchor
  kind      A(전문 용어) · B(뜻이 바뀌는 학술 어휘) · C(학술 표현) · W(일반 어휘)
  everyday  B 종류의 일상 뜻. 없으면 빈칸
  outside   논문 밖 정의면 1, 아니면 빈칸
"""
import argparse, csv, html, sys
from pathlib import Path

COLUMNS = ["kind", "term", "pos", "meaning", "everyday", "outside", "example", "anchor"]
KIND_TAG = {"A": "term", "B": "shifted", "C": "phrase", "W": "general"}


def clean(s):
    return " ".join((s or "").split())  # 탭·줄바꿈 → 공백


def front(c):
    return f"{c['term']} ({c['pos']})" if c["pos"] else c["term"]


def meaning(c):
    m = c["meaning"]
    if c["everyday"]:
        m += f" (일상: {c['everyday']})"
    if c["outside"] == "1":
        m += " [논문 밖]"
    return m


def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    missing = set(COLUMNS) - set(rows[0].keys() if rows else COLUMNS)
    if missing:
        sys.exit(f"cards.csv 에 열이 없다: {sorted(missing)}")
    cards = [{k: clean(r.get(k)) for k in COLUMNS} for r in rows]
    for i, c in enumerate(cards, 2):
        if not c["term"] or not c["meaning"]:
            sys.exit(f"{path}:{i} term 또는 meaning 이 비었다")
        if c["kind"] not in KIND_TAG:
            sys.exit(f"{path}:{i} kind 는 A·B·C·W 중 하나여야 한다: {c['kind']!r}")
    return cards


def quizlet(cards, with_example):
    lines = []
    for c in cards:
        back = meaning(c)
        if with_example and c["example"]:
            back += f' ｜ "{c["example"]}" ｜ {c["anchor"]}'
        lines.append(f"{front(c)}\t{back}")
    return "\n".join(lines) + "\n"


def anki(cards, citekey, with_example):
    out = [
        "#separator:tab",
        "#html:true",
        "#notetype:Basic",
        f"#deck:Papers::{citekey}",
        "#tags column:3",
    ]
    e = html.escape
    for c in cards:
        back = e(meaning(c))
        if with_example and c["example"]:
            back += f'<br><br><i>{e(c["example"])}</i><br><small>{e(c["anchor"])}</small>'
        tags = f"{citekey} {KIND_TAG[c['kind']]}"
        out.append(f"{e(front(c))}\t{back}\t{tags}")
    return "\n".join(out) + "\n"


def markdown(cards):
    esc = lambda s: s.replace("|", "\\|")
    out = ["| # | 종류 | 앞면 | 뜻 | 예문 | 앵커 |", "|---|---|---|---|---|---|"]
    for i, c in enumerate(cards, 1):
        out.append(f"| {i} | {c['kind']} | {esc(front(c))} | {esc(meaning(c))} | {esc(c['example'])} | {c['anchor']} |")
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--no-example", action="store_true", help="뒷면에 뜻만 (쓰기 모드용)")
    a = ap.parse_args()
    src = Path(a.csv)
    citekey = src.resolve().parent.parent.name  # papers/<citekey>/vocab/cards.csv
    cards = load(src)
    ex = not a.no_example
    (src.parent / "quizlet.txt").write_text(quizlet(cards, ex), encoding="utf-8")
    (src.parent / "anki.txt").write_text(anki(cards, citekey, ex), encoding="utf-8")
    (src.parent / "cards.md").write_text(markdown(cards), encoding="utf-8")
    counts = {k: sum(c["kind"] == k for c in cards) for k in KIND_TAG}
    by_kind = " · ".join(f"{k} {n}" for k, n in counts.items())
    print(f"{len(cards)}장 ({by_kind}) → quizlet.txt · anki.txt · cards.md")


if __name__ == "__main__":
    main()
