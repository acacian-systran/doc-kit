#!/usr/bin/env python3
"""icon-flow-figure 검사.

    python3 check.py fig.json                 # spec 검사만
    python3 check.py fig.json --render        # + 빌드된 fig.html 을 브라우저로 열어 겹침 · 넘침 검사
    python3 check.py fig.json --render --shot shots/   # + 색 · 흑백 · 다크 스크린숏

spec 검사
  - 타일 · 띠 · 마름모가 서로 겹치지 않음
  - 글자 원(badge)이 a, b, c … 처럼 빠짐없이 이어지고, steps 항목과 1:1
  - 모든 node 에 tip(마우스 설명)이 있음
  - 간선 끝점이 viewBox 안
  - matrix 열 수 = 각 행 칸 수
  - 타일 제목 첫 글자가 대문자(영문일 때) — 경고만
렌더 검사 (playwright)
  - 글자 상자끼리 · 글자와 타일이 겹침
  - viewBox 밖으로 나간 글자
  - 콘솔 오류, 390px 폭 가로 스크롤
실패가 있으면 종료 코드 1.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import Shape, route  # noqa: E402

FAIL, WARN = [], []


def overlap(a, b, pad=0.0):
    return a[0] < b[2] - pad and b[0] < a[2] - pad and a[1] < b[3] - pad and b[1] < a[3] - pad


def check_spec(spec: dict):
    fig = spec["figure"]
    vw, vh = fig.get("viewBox", [1000, 700])
    shapes = {}
    for n in fig.get("nodes", []):
        s = Shape(n)
        if s.id in shapes:
            FAIL.append(f"node id 중복: {s.id}")
        shapes[s.id] = s
        if not n.get("tip"):
            FAIL.append(f"node {s.id}: tip 없음 — 코드에서 하는 일을 한두 문장으로")
        x0, y0, x1, y1 = s.box
        if x0 < 0 or y0 < 0 or x1 > vw or y1 > vh:
            FAIL.append(f"node {s.id}: viewBox 밖 {s.box}")
        lab = n.get("label")
        first = (lab[0] if isinstance(lab, list) else lab or "")[:1]
        if first.isascii() and first.isalpha() and first.islower():
            WARN.append(f"node {s.id}: 제목 첫 글자 소문자 '{lab}'")
    ids = list(shapes)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            if overlap(shapes[a].box, shapes[b].box):
                FAIL.append(f"node {a} · {b} 겹침")
    for e in fig.get("edges", []):
        for ref in ("from", "to"):
            if isinstance(e.get(ref), str) and e[ref] not in shapes:
                FAIL.append(f"edge {e}: {ref} '{e[ref]}' 없는 node")
        try:
            pts = route(e, shapes)
        except (KeyError, SystemExit) as ex:
            FAIL.append(f"edge {e}: 경로 못 만듦 ({ex})")
            continue
        for x, y in pts:
            if not (0 <= x <= vw and 0 <= y <= vh):
                FAIL.append(f"edge {e.get('from')}→{e.get('to')}: 점 ({x},{y}) viewBox 밖")
        if e.get("kind", "flow") not in ("flow", "read", "write"):
            FAIL.append(f"edge {e}: kind 는 flow · read · write")

    badges = [n["badge"] for n in fig.get("nodes", []) if n.get("badge")]
    if badges:
        want = [chr(ord("a") + i) for i in range(len(badges))] if badges[0].isalpha() else [str(i + 1) for i in range(len(badges))]
        if sorted(badges) != sorted(want):
            FAIL.append(f"badge 가 이어지지 않음: {sorted(badges)} (기대 {want})")
        if len(set(badges)) != len(badges):
            FAIL.append(f"badge 중복: {badges}")
    steps = [s["k"] for s in spec.get("steps", {}).get("items", [])]
    if steps and badges and sorted(steps) != sorted(badges):
        FAIL.append(f"steps 와 badge 불일치 — steps 에만: {sorted(set(steps) - set(badges))}, 그림에만: {sorted(set(badges) - set(steps))}")
    if badges and not steps:
        WARN.append("badge 가 있는데 steps 가 없음")

    m = spec.get("matrix")
    if m:
        for r in m["rows"]:
            if len(r["cells"]) != len(m["cols"]):
                FAIL.append(f"matrix 행 {r['name']}: 칸 {len(r['cells'])} ≠ 열 {len(m['cols'])}")


RENDER_JS = """
() => {
  const svg = document.querySelector('.fig svg');
  const vb = svg.viewBox.baseVal;
  const m = svg.getScreenCTM().inverse();
  const toUser = r => {
    const p1 = new DOMPoint(r.left, r.top).matrixTransform(m), p2 = new DOMPoint(r.right, r.bottom).matrixTransform(m);
    return [p1.x, p1.y, p2.x, p2.y];
  };
  const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('.badge') && !t.closest('title'))
    .map(t => ({s: t.textContent, g: t.closest('.node') ? t.closest('.node').dataset.id : null, band: t.classList.contains('bandtxt'), dec: !!t.closest('.node') && !!t.closest('.node').querySelector('.dec'), b: toUser(t.getBoundingClientRect())}));
  const tiles = [...svg.querySelectorAll('.node .tile, .node .dec')].map(r => ({id: r.closest('.node').dataset.id, band: r.closest('.node').querySelector('.bandtxt') !== null, b: toUser(r.getBoundingClientRect())}));
  // 선 · 틀의 축 정렬 선분 (사용자 좌표 그대로)
  const segs = [];
  svg.querySelectorAll('path.ar, path.ar2, path.arw').forEach(p => {
    if (p.closest('[aria-label=legend]')) return;
    let x = 0, y = 0; const d = p.getAttribute('d');
    (d.match(/[MHVL][^MHVL]*/g) || []).forEach(c => {
      const k = c[0], v = c.slice(1).trim().split(/[ ,]+/).map(Number);
      let nx = x, ny = y;
      if (k === 'M') { x = v[0]; y = v[1]; return; }
      if (k === 'H') nx = v[0]; else if (k === 'V') ny = v[0]; else { nx = v[0]; ny = v[1]; }
      segs.push({what: 'line', s: [x, y, nx, ny]}); x = nx; y = ny;
    });
  });
  svg.querySelectorAll('rect.frame, rect.frame-solid').forEach(r => {
    const x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), h = +r.getAttribute('height');
    [[x, y, x + w, y], [x, y + h, x + w, y + h], [x, y, x, y + h], [x + w, y, x + w, y + h]].forEach(s => segs.push({what: 'frame', s}));
  });
  return {vb: [vb.width, vb.height], texts, tiles, segs,
          hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1};
}
"""


def check_render(html: Path, shot: Path | None):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        WARN.append("playwright 없음 — 렌더 검사 건너뜀 (pip install playwright && playwright install chromium)")
        return
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(html.resolve().as_uri())
        pg.wait_for_timeout(600)
        r = pg.evaluate(RENDER_JS)
        vw, vh = r["vb"]
        T = r["texts"]
        for t in T:
            x0, y0, x1, y1 = t["b"]
            if x0 < -1 or y0 < -1 or x1 > vw + 1 or y1 > vh + 1:
                FAIL.append(f"글자 viewBox 밖: '{t['s']}'")
        for i, a in enumerate(T):
            for b in T[i + 1:]:
                if a["g"] and a["g"] == b["g"]:
                    continue  # 한 타일 제목의 여러 줄
                if overlap(a["b"], b["b"], pad=1.5):
                    FAIL.append(f"글자 겹침: '{a['s']}' · '{b['s']}'")
        for t in T:
            if t["band"] or t["dec"]:
                continue
            for tl in r["tiles"]:
                if overlap(t["b"], tl["b"], pad=1.0):
                    FAIL.append(f"글자가 타일 {tl['id']} 를 덮음: '{t['s']}'")
        for t in T:
            x0, y0, x1, y1 = t["b"]
            for sg in r["segs"]:
                sx0, sy0, sx1, sy1 = sg["s"]
                # 선분(두께 0)이 글자 상자(가로 1 · 세로 2 줄인 것)를 지나는가
                if min(sx0, sx1) < x1 - 1 and max(sx0, sx1) > x0 + 1 and min(sy0, sy1) < y1 - 2 and max(sy0, sy1) > y0 + 2:
                    FAIL.append(f"글자가 {'선' if sg['what'] == 'line' else '틀'}을 가로지름: '{t['s']}' @ {[round(v) for v in sg['s']]}")
                    break
        for tl in r["tiles"]:
            x0, y0, x1, y1 = tl["b"]
            for sg in r["segs"]:
                if sg["what"] != "line":
                    continue
                sx0, sy0, sx1, sy1 = sg["s"]
                # 선이 타일 안쪽(3 줄인 상자)을 지나면 가로지름. 타일 변에서 시작 · 끝나는 선은 안쪽에 닿지 않는다
                if min(sx0, sx1) < x1 - 3 and max(sx0, sx1) > x0 + 3 and min(sy0, sy1) < y1 - 3 and max(sy0, sy1) > y0 + 3:
                    FAIL.append(f"선이 타일 {tl['id']} 를 가로지름 @ {[round(v) for v in sg['s']]}")
        for e in errs:
            FAIL.append(f"콘솔 오류: {e}")
        if shot:
            shot.mkdir(parents=True, exist_ok=True)
            el = pg.locator(".fig svg")
            el.screenshot(path=str(shot / "color.png"))
            pg.click("#m-bw")
            el.screenshot(path=str(shot / "bw.png"))
            pg.click("#m-color")
            pg.emulate_media(color_scheme="dark")
            el.screenshot(path=str(shot / "dark.png"))
            pg.emulate_media(color_scheme="light")
        pg.set_viewport_size({"width": 390, "height": 800})
        pg.wait_for_timeout(200)
        if pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"):
            FAIL.append("390px 폭에서 페이지 가로 스크롤 (그림 칸 안의 스크롤은 괜찮음)")
        br.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("--render", action="store_true", help="빌드된 html 을 열어 겹침 검사")
    ap.add_argument("--html", help="html 경로 (기본: spec 옆 같은 이름)")
    ap.add_argument("--shot", help="스크린숏 폴더")
    a = ap.parse_args()
    spec_p = Path(a.spec)
    spec = json.loads(spec_p.read_text(encoding="utf-8"))
    check_spec(spec)
    if a.render or a.shot:
        html = Path(a.html) if a.html else spec_p.with_suffix(".html")
        if not html.exists():
            FAIL.append(f"{html} 없음 — build.py 먼저")
        else:
            check_render(html, Path(a.shot) if a.shot else None)
    for w in WARN:
        print("경고", w)
    for f in FAIL:
        print("실패", f)
    print(f"실패 {len(FAIL)} · 경고 {len(WARN)}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
