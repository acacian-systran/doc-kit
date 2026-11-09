#!/usr/bin/env python3
"""여러 장을 레벨 목록으로 묶어 빌드한다 — L0 전체 → L1 반복 하나 → L2 단계 … 처럼 위에서 아래로 들어가는 그림 묶음.

site.json:
    {"out": "site",                                  # 출력 폴더(site.json 기준)
     "pages": [{"file": "index.html", "spec": "run.json",   "name": "L0 실행 전체", "depth": 0},
               {"file": "table.html", "spec": "table.json", "name": "L1 table 하나", "depth": 1}]}

각 페이지 머리에 레벨 목록(nav)을 넣고, 아래를 검사한다.
  - data.href 가 묶음 안 페이지를 가리키나(없는 페이지면 실패)
  - 들어갈 아래 페이지가 있는데 아무 타일도 그리로 가지 않으면 경고(위에서 길이 없음)
  - data 없는 타일 · 선 수(경고). 화살촉 없는 합류선은 세지 않음

    python3 site.py site.json            # → <out>/*.html, <out>/*.json (data · href 를 채운 spec 사본)
"""
import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build import build  # noqa: E402


def nav_html(pages: list, cur: str) -> str:
    out = []
    for p in pages:
        d = p.get("depth", 0)
        pre = "└ " if d else ""
        sty = f"margin-left:{d * 14}px"
        if p["file"] == cur:
            out.append(f'<b style="{sty}" aria-current="page">{pre}{p["name"]}</b>')
        else:
            out.append(f'<a style="{sty}" href="{p["file"]}">{pre}{p["name"]}</a>')
    return ('<nav class="levels" aria-label="레벨">' + "".join(out) + "</nav>")


def audit(pages: list, specs: dict) -> tuple[list, list]:
    fails, warns = [], []
    files = {p["file"] for p in pages}
    linked = set()
    for f, spec in specs.items():
        fig = spec["figure"]
        no_n = [n["id"] for n in fig.get("nodes", []) if not n.get("data")]
        no_e = [i for i, e in enumerate(fig.get("edges", [])) if not e.get("data") and e.get("arrow") is not False]
        for n in fig.get("nodes", []):
            href = (n.get("data") or {}).get("href")
            if href:
                if href.split("#")[0] not in files:
                    fails.append(f"{f}: 타일 {n['id']} 의 href '{href}' 가 묶음에 없음")
                linked.add(href.split("#")[0])
        if no_n:
            warns.append(f"{f}: data 없는 타일 {len(no_n)}개 — {', '.join(no_n)}")
        if no_e:
            warns.append(f"{f}: data 없는 선 {len(no_e)}개 — 순서 번호 {', '.join(map(str, no_e))}")
    for p in pages[1:]:
        if p["file"] not in linked:
            warns.append(f"{p['file']}: 어느 타일도 이 페이지로 들어가지 않음(레벨 목록으로만 감)")
    return fails, warns


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("site")
    a = ap.parse_args()
    src = Path(a.site).resolve()
    cfg = json.loads(src.read_text(encoding="utf-8"))
    base = src.parent
    out = base / cfg.get("out", "site")
    out.mkdir(parents=True, exist_ok=True)
    pages = cfg["pages"]
    specs = {p["file"]: json.loads((base / p["spec"]).read_text(encoding="utf-8")) for p in pages}
    fails, warns = audit(pages, specs)
    for p in pages:
        f = p["file"]
        (out / f).write_text(build(specs[f], nav_html(pages, f)), encoding="utf-8")
        (out / Path(f).with_suffix(".json")).write_text(json.dumps(specs[f], ensure_ascii=False, indent=1), encoding="utf-8")
        print(out / f)
    for w in warns:
        print("경고", w)
    for x in fails:
        print("실패", x)
    print(f"실패 {len(fails)} · 경고 {len(warns)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
