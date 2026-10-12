# -*- coding: utf-8 -*-
"""
check.py — 해설 사이트 전체를 브라우저로 열어 구조를 검사한다.

    python3 <스킬경로>/assets/check.py papers/<citekey>/site [--shot shots/]

검사 항목
  - sections.js: stage 마다 섹션이 있나, 같은 stage 의 섹션이 붙어 있나, stage 순서가 뒤로 가지 않나
  - 페이지마다: 파일이 있나, data-section 이 맞나, 미니맵·이전/다음이 그려졌나,
    현재 섹션이 강조됐나, 남은 치환 토큰(__X__), 콘솔 오류, 수식 렌더 실패, 깨진 내부 링크
  - sections.js 에 없는 .html 파일 (목차에서 빠진 페이지)
  - 가로 스크롤 (데스크톱 1280px · 모바일 390px)
--shot 을 주면 페이지마다 데스크톱·모바일 스크린숏을 남긴다. 실패하면 exit 1.
"""
import argparse
import pathlib
import re
import sys
from urllib.parse import urlparse, unquote

from playwright.sync_api import sync_playwright

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

PAGE_JS = """() => {
  const q = s => document.querySelector(s);
  const main = q('main');
  const text = main ? main.innerText : '';
  return {
    section: document.body.dataset.section || null,
    stages: document.querySelectorAll('#minimap .mm-stage').length,
    current: document.querySelectorAll('#minimap .mm-sec.is-current').length,
    pager: document.querySelectorAll('#pager a').length,
    question: (q('.question') || {}).innerText || '',
    tokens: (document.documentElement.outerHTML.match(/__[A-Z][A-Z_]+__/g) || []),
    rawMath: (text.match(/\\$\\$|\\\\(frac|sum|mathrm|text)\\b/g) || []).length,
    mathErr: document.querySelectorAll('.katex-error, merror').length,
    math: document.querySelectorAll('math').length,
    links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
    hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site")
    ap.add_argument("--shot")
    args = ap.parse_args()

    site = pathlib.Path(args.site).resolve()
    errors, warns = [], []
    if not (site / "index.html").exists():
        sys.exit(f"index.html 이 없다: {site}")

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 860})
        pg = ctx.new_page()
        console = []
        pg.on("console", lambda m: console.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: console.append(str(e)))

        pg.goto((site / "index.html").as_uri())
        pg.wait_for_load_state("networkidle")
        paper = pg.evaluate("() => window.PAPER || null")
        if not paper:
            sys.exit("window.PAPER 가 없다 — common/sections.js 를 확인")

        stages = [s["id"] for s in paper["stages"]]
        secs = paper["sections"]

        # ── 목차 구조 ──
        seen_ids = set()
        for s in secs:
            if s["id"] in seen_ids:
                errors.append(f"섹션 id 중복: {s['id']}")
            seen_ids.add(s["id"])
            if s.get("stage") not in stages:
                errors.append(f"{s['id']}: stage '{s.get('stage')}' 가 stages 에 없다")
            if not s.get("anchor"):
                errors.append(f"{s['id']}: anchor(원문 위치) 가 없다")
        for st in stages:
            if not any(s.get("stage") == st for s in secs):
                errors.append(f"stage '{st}' 에 섹션이 없다")
        order = [stages.index(s["stage"]) for s in secs if s.get("stage") in stages]
        if any(b2 < a2 for a2, b2 in zip(order, order[1:])):
            errors.append("섹션 순서를 따라가면 stage 가 뒤로 돌아간다 — 미니맵 레일이 거꾸로 움직인다")
        for s in secs:
            parts = s["id"].split(".")
            if len(parts) > 1 and ".".join(parts[:-1]) not in seen_ids and not s.get("parent"):
                warns.append(f"{s['id']}: 상위 챕터 {'.'.join(parts[:-1])} 페이지가 없다")

        listed = {"index.html"} | {s["file"] for s in secs}
        for f in site.glob("*.html"):
            if f.name not in listed:
                warns.append(f"sections.js 에 없는 페이지: {f.name}")

        # ── 페이지별 ──
        pages = [("overview", "index.html")] + [(s["id"], s["file"]) for s in secs]
        shot = pathlib.Path(args.shot) if args.shot else None
        if shot:
            shot.mkdir(parents=True, exist_ok=True)
        total_math = 0
        for sid, fname in pages:
            f = site / fname
            if not f.exists():
                errors.append(f"{sid}: 파일이 없다 — {fname}")
                continue
            console.clear()
            pg.set_viewport_size({"width": 1280, "height": 860})
            pg.goto(f.as_uri())
            pg.wait_for_load_state("networkidle")
            pg.wait_for_timeout(300)
            r = pg.evaluate(PAGE_JS)
            tag = f"{fname}"
            if r["section"] != sid:
                errors.append(f"{tag}: data-section='{r['section']}' — sections.js 는 '{sid}'")
            if r["stages"] != len(stages):
                errors.append(f"{tag}: 미니맵 단계 {r['stages']}개 (기대 {len(stages)})")
            if sid != "overview" and r["current"] != 1:
                errors.append(f"{tag}: 미니맵에서 현재 섹션 강조가 {r['current']}개")
            if sid != "overview" and not r["question"].strip():
                errors.append(f"{tag}: '이 섹션이 답하는 질문' 이 비었다")
            if r["pager"] == 0:
                errors.append(f"{tag}: 이전/다음 링크가 없다")
            if r["tokens"]:
                errors.append(f"{tag}: 치환되지 않은 토큰 {sorted(set(r['tokens']))}")
            if r["rawMath"]:
                warns.append(f"{tag}: 렌더되지 않은 TeX 가 {r['rawMath']}곳 (KaTeX 로드 실패이거나 구분자 오류)")
            if r["mathErr"]:
                errors.append(f"{tag}: 수식 오류 {r['mathErr']}곳")
            if r["hscroll"] > 1:
                errors.append(f"{tag}: 데스크톱 가로 스크롤 {r['hscroll']}px")
            total_math += r["math"]
            for href in r["links"]:
                u = urlparse(href)
                if u.scheme or href.startswith("#"):
                    continue
                target = (f.parent / unquote(u.path)).resolve()
                if not target.exists():
                    errors.append(f"{tag}: 깨진 링크 {href}")
            for c in console:
                errors.append(f"{tag}: 콘솔 오류 — {c}")
            if shot:
                pg.screenshot(path=str(shot / f"{f.stem}.desktop.png"), full_page=False)
            pg.set_viewport_size({"width": 390, "height": 844})
            pg.wait_for_timeout(150)
            hs = pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if hs > 1:
                errors.append(f"{tag}: 모바일 가로 스크롤 {hs}px")
            if shot:
                pg.screenshot(path=str(shot / f"{f.stem}.mobile.png"), full_page=False)
        b.close()

    print(f"페이지 {len(pages)}개 · 단계 {len(stages)}개 · 수식 {total_math}개")
    for w in warns:
        print("경고:", w)
    for e in errors:
        print("오류:", e)
    if errors:
        sys.exit(1)
    print("통과")


if __name__ == "__main__":
    main()
