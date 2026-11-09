#!/usr/bin/env python3
"""빌드된 페이지에서 그림만 PNG · SVG 로 뽑는다 (덱 · 논문에 붙이는 용).

    python3 export.py fig.html                       # → fig-color.png, fig-bw.png (4배)
    python3 export.py fig.html --mode bw --scale 6   # 흑백만, 6배
    python3 export.py fig.html --svg                 # + 스타일을 속성으로 굳힌 단독 SVG

PNG 는 브라우저가 그린 그대로라 글꼴 · 색이 페이지와 같다. 1000 단위 폭 그림을 4배로 뽑으면
4000px — 슬라이드 한 장 폭에 충분하고, 논문 1단(8.5cm) 600dpi 는 약 2000px 이면 된다.
단독 SVG 는 웹 글꼴을 싣지 않으므로 받는 쪽에 IBM Plex Sans KR 이 없으면 대체 글꼴로 보인다.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

INLINE_JS = """
() => {
  const src = document.querySelector('.fig svg');
  const clone = src.cloneNode(true);
  const props = ['fill','stroke','stroke-width','stroke-dasharray','opacity','font-family','font-size','font-weight','color'];
  const a = [src, ...src.querySelectorAll('*')], b = [clone, ...clone.querySelectorAll('*')];
  a.forEach((el, i) => { const cs = getComputedStyle(el); props.forEach(p => { const v = cs.getPropertyValue(p); if (v) b[i].setAttribute(p, v); }); b[i].removeAttribute('class'); b[i].removeAttribute('tabindex'); });
  const used = new Set([...clone.querySelectorAll('use')].map(u => u.getAttribute('href')));
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  document.querySelectorAll('svg[aria-hidden] marker').forEach(m => defs.appendChild(m.cloneNode(true)));
  used.forEach(h => { const s = document.querySelector(h); if (s) defs.appendChild(s.cloneNode(true)); });
  // 마커는 context-stroke 를 못 쓰는 뷰어가 있어 선 색으로 굳힌 사본을 만든다
  clone.querySelectorAll('[marker-end]').forEach((p, i) => {
    const id = p.getAttribute('marker-end').slice(5, -1), m = defs.querySelector('#' + id);
    if (!m) return; const c = m.cloneNode(true); c.id = id + '-' + i;
    c.querySelector('path').setAttribute('fill', p.getAttribute('stroke')); defs.appendChild(c);
    p.setAttribute('marker-end', 'url(#' + c.id + ')');
  });
  clone.insertBefore(defs, clone.firstChild);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', src.viewBox.baseVal.width); clone.setAttribute('height', src.viewBox.baseVal.height);
  clone.removeAttribute('style');
  return new XMLSerializer().serializeToString(clone);
}
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("html")
    ap.add_argument("--mode", choices=["color", "bw", "both"], default="both")
    ap.add_argument("--scale", type=float, default=4)
    ap.add_argument("--svg", action="store_true")
    ap.add_argument("--out", help="출력 폴더 (기본: html 옆)")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright

    html = Path(a.html).resolve()
    out = Path(a.out) if a.out else html.parent
    out.mkdir(parents=True, exist_ok=True)
    modes = ["color", "bw"] if a.mode == "both" else [a.mode]
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=a.scale)
        pg.goto(html.as_uri())
        pg.wait_for_timeout(800)
        for m in modes:
            pg.click("#m-bw" if m == "bw" else "#m-color")
            pg.wait_for_timeout(100)
            # 그림 칸의 테두리 · 여백 없이 svg 만
            pg.evaluate("document.querySelector('.fig').style.cssText='border:0;padding:0;background:var(--sheet)'")
            png = out / f"{html.stem}-{m}.png"
            pg.locator(".fig svg").screenshot(path=str(png))
            print(png)
            if a.svg:
                svg = out / f"{html.stem}-{m}.svg"
                svg.write_text(pg.evaluate(INLINE_JS), encoding="utf-8")
                print(svg)
        br.close()


if __name__ == "__main__":
    sys.exit(main())
