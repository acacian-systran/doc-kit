#!/usr/bin/env python3
"""icon-flow-figure: spec JSON → 단일 HTML 페이지.

    python3 build.py fig.json            # → fig.html (같은 폴더)
    python3 build.py fig.json -o out.html

spec 형식은 references/spec.md. 좌표는 모두 SVG 사용자 단위(viewBox 기준)이고,
타일은 왼쪽 위 (x, y) · 기본 60×60, 판단 마름모는 중심 (cx, cy) · 반지름 (rx, ry).
간선은 from/to 만 주면 마주 보는 변 사이를 곧게 · 또는 L 자로 잇고, path 를 주면 그대로 쓴다.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROLES = ["in", "rule", "search", "llm", "merge", "out", "frag"]
ROLE_LABEL = {"in": "Input", "rule": "Rule-based", "search": "Retrieval", "llm": "LLM",
              "merge": "Integrate", "out": "Output", "frag": "Fragment"}
EDGE_CLS = {"flow": "ar", "read": "ar2", "write": "arw"}
EDGE_MARK = {"flow": "ah", "read": "ahm", "write": "ahw"}
EDGE_LEGEND = {"flow": "flow", "read": "read · fallback", "write": "write"}
END_GAP = 2  # 화살촉이 상자에 닿기 전에 남기는 틈


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def md(s: str) -> str:
    """본문 칸의 아주 작은 마크다운: `code`, **굵게**. 나머지는 이스케이프."""
    out = esc(s)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    return out


def num(v: float) -> str:
    return f"{v:g}"


# ---------------------------------------------------------------- 도형
class Shape:
    def __init__(self, d: dict):
        self.d = d
        self.id = d["id"]
        self.kind = d.get("kind", "tile")
        if self.kind == "decision":
            cx, cy = d["cx"], d["cy"]
            rx, ry = d.get("rx", 45), d.get("ry", 26)
            self.box = (cx - rx, cy - ry, cx + rx, cy + ry)
        else:
            w = d.get("w", 60)
            h = d.get("h", 60 if self.kind == "tile" else 52)
            self.box = (d["x"], d["y"], d["x"] + w, d["y"] + h)

    @property
    def cx(self):
        return (self.box[0] + self.box[2]) / 2

    @property
    def cy(self):
        return (self.box[1] + self.box[3]) / 2


def point_shape(p) -> Shape:
    s = Shape.__new__(Shape)
    s.d, s.id, s.kind, s.box = {}, f"pt{p}", "point", (p[0], p[1], p[0], p[1])
    return s


def route(e: dict, shapes: dict) -> list:
    if "path" in e:
        return [tuple(p) for p in e["path"]]

    def get(ref):
        return point_shape(ref) if isinstance(ref, list) else shapes[ref]

    a, b = get(e["from"]), get(e["to"])
    ax0, ay0, ax1, ay1 = a.box
    bx0, by0, bx1, by1 = b.box
    sg = 0
    eg = END_GAP if b.kind != "point" else 0
    via = e.get("via")

    def vertical(x):
        if b.cy < a.cy:
            return [(x, ay0 - sg), (x, by1 + eg)]
        return [(x, ay1 + sg), (x, by0 - eg)]

    def horizontal(y):
        if b.cx < a.cx:
            return [(ax0 - sg, y), (bx1 + eg, y)]
        return [(ax1 + sg, y), (bx0 - eg, y)]

    if via is None:
        if "x" in e:
            return vertical(e["x"])
        if "y" in e:
            return horizontal(e["y"])
        if bx0 <= a.cx <= bx1 and (by0 >= ay1 or by1 <= ay0):
            return vertical(a.cx)
        if ax0 <= b.cx <= ax1 and (by0 >= ay1 or by1 <= ay0):
            return vertical(b.cx)
        if by0 <= a.cy <= by1:
            return horizontal(a.cy)
        if ay0 <= b.cy <= ay1:
            return horizontal(b.cy)
        via = "hv"
    if via == "hv":  # 가로로 나가서 세로로 들어감
        x0 = ax1 if b.cx > a.cx else ax0
        y1 = by0 - eg if b.cy > a.cy else by1 + eg
        return [(x0, a.cy), (b.cx, a.cy), (b.cx, y1)]
    if via == "vh":  # 세로로 나가서 가로로 들어감
        y0 = ay1 if b.cy > a.cy else ay0
        x1 = bx0 - eg if b.cx > a.cx else bx1 + eg
        return [(a.cx, y0), (a.cx, b.cy), (x1, b.cy)]
    raise SystemExit(f"edge {e}: via 는 hv · vh 중 하나")


def path_d(pts) -> str:
    out = []
    for i, (x, y) in enumerate(pts):
        if i == 0:
            out.append(f"M{num(x)},{num(y)}")
        elif x == pts[i - 1][0]:
            out.append(f"V{num(y)}")
        elif y == pts[i - 1][1]:
            out.append(f"H{num(x)}")
        else:
            out.append(f"L{num(x)},{num(y)}")
    return " ".join(out)


# ---------------------------------------------------------------- SVG 조각
def text_el(x, y, s, cls="s", anchor=None, style=None) -> str:
    a = f' text-anchor="{anchor}"' if anchor and anchor != "start" else ""
    st = f' style="{style}"' if style else ""
    return f'<text class="{cls}" x="{num(x)}" y="{num(y)}"{a}{st}>{esc(s)}</text>'


def tile_labels(n: dict, box) -> list:
    lab = n.get("label")
    if not lab:
        return []
    lines = lab if isinstance(lab, list) else [lab]
    pos = n.get("pos", "below")
    fs = n.get("fs")
    style = f"font-size:{fs}px" if fs else None
    lh = 15 if not fs or fs >= 13 else 14
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2
    out = []
    if pos == "below":
        for i, s in enumerate(lines):
            out.append(text_el(cx, y1 + 20 + i * lh, s, "t", "middle", style))
    elif pos == "above":
        base = y0 - 12 - (len(lines) - 1) * lh
        for i, s in enumerate(lines):
            out.append(text_el(cx, base + i * lh, s, "t", "middle", style))
    elif pos in ("right", "left"):
        cy = (y0 + y1) / 2 + 5 - (len(lines) - 1) * lh / 2
        x = x1 + 8 if pos == "right" else x0 - 8
        anchor = "start" if pos == "right" else "end"
        for i, s in enumerate(lines):
            out.append(text_el(x, cy + i * lh, s, "t", anchor, style))
    else:
        raise SystemExit(f"node {n['id']}: pos 는 below · above · right · left")
    if "label_dy" in n:  # 미세 조정
        out = [re.sub(r'y="([\d.]+)"', lambda m: f'y="{num(float(m.group(1)) + n["label_dy"])}"', t, count=1) for t in out]
    return out


def node_svg(s: Shape) -> str:
    n = s.d
    tip = f"<title>{esc(n['tip'])}</title>" if n.get("tip") else ""
    role = n.get("role", "rule")
    x0, y0, x1, y1 = s.box
    xd = f' has-data" role="button" data-x="n-{esc(s.id)}' if n.get("data") else ""
    parts = [f'<g class="node{xd}" tabindex="0" data-id="{esc(s.id)}">{tip}']
    if s.kind == "decision":
        cx, cy = s.cx, s.cy
        parts.append(f'<path class="dec" d="M{num(x0)},{num(cy)} L{num(cx)},{num(y0)} L{num(x1)},{num(cy)} L{num(cx)},{num(y1)} Z"/>')
        lab = n.get("label", "")
        parts.append(text_el(cx, cy + 4, lab, "t", "middle", f"font-size:{n.get('fs', 11)}px"))
    elif s.kind == "band":
        w, h = x1 - x0, y1 - y0
        parts.append(f'<rect class="tile r-{role}" x="{num(x0)}" y="{num(y0)}" width="{num(w)}" height="{num(h)}" rx="8"/>')
        if n.get("icon"):
            isz = h - 16
            parts.append(f'<use href="#i-{n["icon"]}" class="glyph" x="{num(x0 + 12)}" y="{num(y0 + 8)}" width="{num(isz)}" height="{num(isz)}"/>')
        parts.append(text_el((x0 + x1) / 2, (y0 + y1) / 2 + 5, n.get("label", ""), "t bandtxt", "middle"))
    else:
        w, h = x1 - x0, y1 - y0
        parts.append(f'<rect class="tile r-{role}" x="{num(x0)}" y="{num(y0)}" width="{num(w)}" height="{num(h)}" rx="8"/>')
        if n.get("icon"):
            isz = min(w, h) * 0.6
            parts.append(f'<use href="#i-{n["icon"]}" class="glyph" x="{num(x0 + (w - isz) / 2)}" y="{num(y0 + (h - isz) / 2)}" width="{num(isz)}" height="{num(isz)}"/>')
        parts.extend(tile_labels(n, s.box))
    parts.append("</g>")
    return "".join(parts)


def badge_svg(s: Shape) -> str:
    b = s.d.get("badge")
    if not b:
        return ""
    if s.kind == "decision":
        x, y = s.cx, s.box[1]
    else:
        x, y = s.box[0], s.box[1]
    return (f'<g class="badge"><circle cx="{num(x)}" cy="{num(y)}" r="12"/>'
            f'<text x="{num(x)}" y="{num(y + 4.5)}" text-anchor="middle">{esc(b)}</text></g>')


def edge_svg(e: dict, shapes: dict, i: int = 0) -> str:
    kind = e.get("kind", "flow")
    pts = route(e, shapes)
    cls = EDGE_CLS[kind] + (" loop" if e.get("loop") else "")
    mark = "" if e.get("arrow") is False else f' marker-end="url(#{EDGE_MARK[kind]})"'
    out = [f'<path class="{cls}" d="{path_d(pts)}"{mark}/>']
    if e.get("data"):  # 주고받는 데이터: 굵은 투명 선으로 누르기 쉽게, 그룹으로 묶어 Tab 으로도
        out.insert(0, f'<path class="hit" d="{path_d(pts)}"/>')
        name = e["data"].get("title", "")
        out.insert(0, f'<g class="edge has-data" tabindex="0" role="button" data-x="e{i}" aria-label="{esc(name)}">')
    close = "</g>" if e.get("data") else ""  # 선 라벨도 그룹 안 — 라벨을 눌러도 열린다
    if e.get("label"):
        if "at" in e:
            lx, ly = e["at"]
        else:
            (x0, y0), (x1, y1) = pts[0], pts[1]
            lx, ly = ((x0 + x1) / 2, y0 - 8) if y0 == y1 else (x0 + 8, (y0 + y1) / 2)
        anchor = e.get("anchor", "middle" if "at" not in e and pts[0][1] == pts[1][1] else "start")
        out.append(text_el(lx, ly, e["label"], e.get("lcls", "hlt" if kind == "write" else "s"), anchor))
    return "".join(out) + close


def legend_svg(lg: dict, roles_used: list) -> str:
    x0, y0 = lg.get("x", 700), lg.get("y", 46)
    cols = lg.get("cols", 3)
    cw = lg.get("col_w", 92)
    labels = {**ROLE_LABEL, **lg.get("roles", {})}
    order = [r for r in ROLES if r in roles_used and r not in lg.get("hide", [])]
    out = ['<g aria-label="legend">']
    for i, r in enumerate(order):
        x, y = x0 + (i % cols) * cw, y0 + (i // cols) * 24
        out.append(f'<rect class="tile r-{r}" x="{num(x)}" y="{num(y)}" width="14" height="14" rx="3"/>')
        out.append(text_el(x + 20, y + 12, labels[r]))
    rows = (len(order) + cols - 1) // cols
    ly = y0 + rows * 24 + 9
    lines = lg.get("lines", {})
    for i, k in enumerate(lines):
        x = x0 + i * cw
        out.append(f'<path class="{EDGE_CLS[k]}" d="M{num(x)},{num(ly)} H{num(x + 22)}" marker-end="url(#{EDGE_MARK[k]})"/>')
        out.append(text_el(x + 28, ly + 4, lines[k] or EDGE_LEGEND[k]))
    out.append("</g>")
    return "".join(out)


def frame_svg(f: dict) -> str:
    x, y, w, h = f["x"], f["y"], f["w"], f["h"]
    cls = "frame" if f.get("kind", "loop") == "loop" else "frame-solid"
    out = [f'<rect class="{cls}" x="{num(x)}" y="{num(y)}" width="{num(w)}" height="{num(h)}" rx="8"/>']
    if f.get("label"):
        lx, ly = f.get("at") or ((x + 10, y + 19) if cls == "frame" else (x + 8, y + h - 7))
        out.append(text_el(lx, ly, f["label"], "m"))
    return "".join(out)


def defs_svg(icons_used: set) -> str:
    src = (HERE / "icons.svg").read_text(encoding="utf-8")
    syms = {m.group(2): m.group(1) for m in re.finditer(r'(<symbol id="i-([\w-]+)".*?</symbol>)', src, re.S)}
    missing = icons_used - set(syms)
    if missing:
        raise SystemExit(f"icons.svg 에 없는 아이콘: {sorted(missing)} — 있는 것: {sorted(syms)}")
    marks = "".join(
        f'<marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="{w}" markerHeight="{w}" '
        f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>'
        for mid, w in (("ah", 7), ("ahm", 7), ("ahw", 6)))
    return ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
            + marks + "".join(syms[i] for i in sorted(icons_used)) + "</defs></svg>")


def figure_svg(fig: dict) -> tuple[str, set]:
    shapes = {}
    for n in fig.get("nodes", []):
        s = Shape(n)
        if s.id in shapes:
            raise SystemExit(f"node id 중복: {s.id}")
        shapes[s.id] = s
    vw, vh = fig.get("viewBox", [1000, 700])
    roles_used = {s.d.get("role", "rule") for s in shapes.values() if s.kind != "decision"}
    icons = {s.d["icon"] for s in shapes.values() if s.d.get("icon")}
    body = [f'<svg viewBox="0 0 {vw} {vh}" role="img" aria-labelledby="fig-t">',
            f'<title id="fig-t">{esc(fig.get("desc", ""))}</title>']
    if fig.get("legend") is not False:
        body.append(legend_svg(fig.get("legend") or {}, list(roles_used)))
    body += [frame_svg(f) for f in fig.get("frames", [])]
    # 간선을 먼저 그리고 타일을 위에 올린다 — 선 끝이 타일 밑으로 숨는다
    body += [edge_svg(e, shapes, i) for i, e in enumerate(fig.get("edges", []))]
    body += [text_el(t["x"], t["y"], t["text"], t.get("cls", "s"), t.get("anchor"), t.get("style"))
             for t in fig.get("texts", [])]
    body += [node_svg(s) for s in shapes.values()]
    body += [badge_svg(s) for s in shapes.values()]
    body.append("</svg>")
    return "\n".join(b for b in body if b), icons


# ---------------------------------------------------------------- 페이지 구역
def matrix_html(m: dict) -> str:
    cols = m["cols"]
    head = "".join(f'<th scope="col"><span class="mk">{esc(k)}</span>{esc(n)}</th>' for k, n in cols)
    sym = {"full": "●", "part": "◐", "none": ""}
    rows = []
    for r in m["rows"]:
        if len(r["cells"]) != len(cols):
            raise SystemExit(f"matrix 행 {r['name']}: 칸 {len(r['cells'])}개, 열 {len(cols)}개")
        tds = []
        for c in r["cells"]:
            v, tip = (c, None) if isinstance(c, str) else (c["v"], c.get("tip"))
            t = f' title="{esc(tip)}" tabindex="0"' if tip else ""
            tds.append(f'<td class="{v}"{t}>{sym[v]}</td>')
        rows.append(f'<tr><th scope="row">{esc(r["name"])}</th>{"".join(tds)}</tr>')
    note = m.get("note", "● 그대로 · ◐ 일부만(칸에 마우스를 올리면 설명) · 빈칸 안 씀")
    return (f'<h3>{esc(m.get("heading", "방법마다 사용되는 단계"))}</h3><p class="lede">{md(note)}</p>'
            f'<div class="tw"><table class="mt"><thead><tr><th></th>{head}</tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table></div>')


def steps_html(st: dict) -> str:
    items = "".join(f'<li><span class="num">{esc(s["k"])}</span><span>{md(s["text"])}</span></li>' for s in st["items"])
    return f'<section><h2>{esc(st.get("heading", "처리 단계"))}</h2><ol class="steps">{items}</ol></section>'


def notes_html(nt: dict) -> str:
    items = []
    for it in nt["items"]:
        ref = f'<span class="ref">{md(it["ref"])}</span>' if it.get("ref") else ""
        title = f'<strong>{esc(it["title"])}</strong> · ' if it.get("title") else ""
        items.append(f'<li><span class="dot"></span><span>{title}{md(it["text"])}</span>{ref}</li>')
    lede = f'<p class="lede">{md(nt["lede"])}</p>' if nt.get("lede") else ""
    return f'<section><h2>{esc(nt.get("heading", "코드 기준 보충"))}</h2>{lede}<ol class="steps notes">{"".join(items)}</ol></section>'


def diff_html(df: dict) -> str:
    head = "".join(f"<th>{esc(c)}</th>" for c in df["cols"])
    rows = "".join("<tr>" + "".join(f"<td>{md(c)}</td>" for c in r) + "</tr>" for r in df["rows"])
    return (f'<section><h2>{esc(df.get("heading", "이전 그림과 다른 점"))}</h2><div class="tw"><table class="diff">'
            f"<thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div></section>")


JS = """
(function(){
  var root=document.getElementById('root'), bc=document.getElementById('m-color'), bb=document.getElementById('m-bw');
  if(!bc) return;
  var key='iff-mode-'+document.title;
  function set(m){
    root.classList.toggle('mode-color',m==='color'); root.classList.toggle('mode-bw',m==='bw');
    bc.setAttribute('aria-pressed',m==='color'); bb.setAttribute('aria-pressed',m==='bw');
    try{localStorage.setItem(key,m)}catch(e){}
  }
  bc.addEventListener('click',function(){set('color')}); bb.addEventListener('click',function(){set('bw')});
  var q=(location.hash.match(/mode=(bw|color)/)||[])[1], saved=null;
  try{saved=localStorage.getItem(key)}catch(e){}
  set(q||saved||'color');
})();
"""

# 노드 · 간선 data: 마우스를 올리면 미리 보고, 누르면(Enter · Space) 고정. Esc · 닫기로 닫음.
XJS = """
(function(){
  var src=document.getElementById('xdata'); if(!src) return;
  var X=JSON.parse(src.textContent), P=document.getElementById('xpanel'), B=document.getElementById('xbody'),
      T=document.getElementById('xtitle'), K=document.getElementById('xkind'), pinned=null, cur=null;
  function el(t,c,s){var e=document.createElement(t); if(c) e.className=c; if(s!=null) e.textContent=s; return e}
  function show(g){
    var d=X[g.dataset.x]; if(!d) return;
    if(cur) cur.classList.remove('on'); cur=g; g.classList.add('on');
    K.textContent=d.kind||(g.classList.contains('edge')?'주고받는 데이터':'저장된 형태');
    T.textContent=d.title||''; B.textContent='';
    if(d.href){ var a=el('a','xgo',(d.href_label||'이 단계 그림으로 들어가기')+' →'); a.href=d.href; B.appendChild(a); }
    if(d.lede) B.appendChild(el('p','xlede',d.lede));
    (d.items||[]).forEach(function(it){
      var s=el('section','xit'); if(it.h) s.appendChild(el('h4',null,it.h));
      if(it.src) s.appendChild(el('div','xsrc',it.src));
      if(it.body!=null) s.appendChild(el('pre',null,it.body));
      if(it.note) s.appendChild(el('p','xnote',it.note));
      B.appendChild(s);
    });
    P.hidden=false; P.classList.toggle('pinned',!!pinned);
  }
  function hide(){ if(cur) cur.classList.remove('on'); cur=null; pinned=null; P.hidden=true }
  document.querySelectorAll('.has-data').forEach(function(g){
    g.addEventListener('mouseenter',function(){ if(!pinned) show(g) });
    g.addEventListener('mouseleave',function(){ if(!pinned) hide() });
    g.addEventListener('focus',function(){ if(!pinned) show(g) });
    // 같은 타일을 다시 눌러도 닫지 않음 — 두 번 누르기(들어가기)가 누르기 두 번을 먼저 일으키기 때문. 닫기는 × · Esc · 빈 곳.
    function pin(ev){ ev.preventDefault(); ev.stopPropagation(); pinned=g; show(g); }
    g.addEventListener('click',pin);
    g.addEventListener('dblclick',function(){ var d=X[g.dataset.x]; if(d&&d.href) location.href=d.href });
    if(X[g.dataset.x]&&X[g.dataset.x].href) g.classList.add('drill');
    g.addEventListener('keydown',function(ev){ if(ev.key==='Enter'||ev.key===' ') pin(ev) });
  });
  document.getElementById('xclose').addEventListener('click',hide);
  document.addEventListener('click',function(ev){ if(pinned&&!P.contains(ev.target)&&!ev.target.closest('.has-data')) hide() });
  document.addEventListener('keydown',function(ev){ if(ev.key==='Escape') hide() });
})();
"""


def xdata(fig: dict) -> dict:
    out = {}
    for n in fig.get("nodes", []):
        if n.get("data"):
            out[f"n-{n['id']}"] = n["data"]
    for i, e in enumerate(fig.get("edges", [])):
        if e.get("data"):
            out[f"e{i}"] = e["data"]
    return out


def build(spec: dict) -> str:
    page = spec.get("page", {})
    fig = spec["figure"]
    svg, icons = figure_svg(fig)
    css = (HERE / "page.css").read_text(encoding="utf-8")
    title = page.get("title", "그림")
    parts = ['<!doctype html><html lang="ko"><head><meta charset="utf-8">',
             '<meta name="viewport" content="width=device-width,initial-scale=1">',
             f"<title>{esc(title)}</title>",
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap">',
             f"<style>{css}</style></head><body>", defs_svg(icons),
             '<div class="wrap mode-color" id="root"><header>']
    if page.get("eyebrow"):
        parts.append(f'<div class="eyebrow">{esc(page["eyebrow"])}</div>')
    parts.append(f"<h1>{esc(title)}</h1>")
    if page.get("lede"):
        parts.append(f'<p class="lede">{md(page["lede"])}</p>')
    if page.get("modes", True):
        parts.append('<div class="toggle" role="group" aria-label="표시 방식">'
                     f'<button type="button" id="m-color" aria-pressed="true">{esc(page.get("color_label", "덱용 색"))}</button>'
                     f'<button type="button" id="m-bw" aria-pressed="false">{esc(page.get("bw_label", "논문용 흑백"))}</button></div>')
    parts.append("</header>")
    if spec.get("verdict"):
        v = spec["verdict"]
        parts.append(f'<div class="verdict"><strong>{md(v["head"])}</strong><p>{md(v.get("body", ""))}</p></div>')
    parts.append("<section>")
    if fig.get("eyebrow"):
        parts.append(f'<div class="eyebrow">{esc(fig["eyebrow"])}</div>')
    if fig.get("heading"):
        parts.append(f"<h2>{esc(fig['heading'])}</h2>")
    parts.append(f'<div class="fig">{svg}</div>')
    xd = xdata(fig)
    if xd:
        parts.append('<p class="lede xhint">타일을 누르면 저장된 형태, 선(또는 선 라벨)을 누르면 주고받는 데이터가 오른쪽에 나옴. '
                     '마우스를 올리면 미리 보기, 누르면 고정, Esc로 닫기.</p>')
    if fig.get("caption"):
        parts.append(f'<p class="lede">{md(fig["caption"])}</p>')
    if spec.get("matrix"):
        parts.append(matrix_html(spec["matrix"]))
    parts.append("</section>")
    if spec.get("steps"):
        parts.append(steps_html(spec["steps"]))
    if spec.get("notes"):
        parts.append(notes_html(spec["notes"]))
    if spec.get("diff"):
        parts.append(diff_html(spec["diff"]))
    parts.append("</div>")
    if xd:
        blob = json.dumps(xd, ensure_ascii=False).replace("</", "<\\/")
        parts.append('<aside class="xpanel" id="xpanel" hidden aria-live="polite"><div class="xhead">'
                     '<div><div class="eyebrow" id="xkind"></div><h3 id="xtitle"></h3></div>'
                     '<button type="button" id="xclose" aria-label="닫기">×</button></div><div id="xbody"></div></aside>'
                     f'<script type="application/json" id="xdata">{blob}</script><script>{XJS}</script>')
    parts.append(f"<script>{JS}</script></body></html>")
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    src = Path(a.spec)
    spec = json.loads(src.read_text(encoding="utf-8"))
    out = Path(a.out) if a.out else src.with_suffix(".html")
    out.write_text(build(spec), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    sys.exit(main())
