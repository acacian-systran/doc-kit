# -*- coding: utf-8 -*-
"""
check.py — 빌드한 비교 페이지를 브라우저로 열어 데이터와 화면을 검사한다.

    python3 <스킬경로>/assets/check.py page.html [--shot shots/]

검사 항목
  - 데이터: 기법마다 모든 축 값 · 단계별 입출력 · 예시 · 장단점 4칸 · 한계가 있나,
    축 값 번호가 옵션 범위 안인가, 관계 대상 · 근거 key · 구조도 간선의 노드가 있나
  - 화면: 콘솔 오류, 기법마다 상세가 그려지나(구조도 SVG · 입출력 상자 · 예시 · 연관), 탭 다섯 개,
    필터 칩을 누르면 개수가 줄거나 같은가
  - 가로 스크롤 (데스크톱 1280px · 모바일 390px)
--shot 을 주면 첫 기법의 상세(입출력 · 예시 펼침)를 데스크톱 · 모바일로 남긴다. 실패하면 exit 1.
"""
import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

DATA_JS = """() => {
  const P = window.PAGE, out = [];
  const axes = [...P.axes.structure, ...(P.axes.ops||[])];
  const ids = new Set(P.methods.map(t=>t.id));
  const srcKeys = new Set((P.sources||[]).map(s=>s.key));
  const KINDS = ["선행","보완","대체","충돌","자원 공유"];
  if (ids.size !== P.methods.length) out.push("기법 id 중복");
  for (const t of P.methods) {
    const w = m => out.push(`${t.id}: ${m}`);
    for (const a of axes) {
      const v = (t.v||{})[a.key];
      if (!v || !v.length) w(`축 ${a.key} 값 없음`);
      else v.forEach(i => { if (!(i >= 0 && i < a.opts.length)) w(`축 ${a.key} 값 ${i} 범위 밖`); });
    }
    if (!["pre","mid","post"].includes(t.stage)) w(`stage ${t.stage} 는 pre · mid · post 중 하나여야 한다 (색 슬롯)`);
    if (!t.flow || t.flow.length < 3) w("단계별 입출력 3칸 미만");
    if (!t.ex || !t.ex.html) w("예시 없음");
    for (const k of ["usePro","useCon","skipPro","skipCon"]) if (!t.pc || !t.pc[k]) w(`장단점 ${k} 없음`);
    if (!t.limit) w("한계 없음");
    if (!t.diagram) w("작동 방식 구조도 없음");
    else {
      const n = new Set(t.diagram.nodes.map(x=>x.id));
      if (!t.diagram.nodes.some(x=>x.k==="tech")) w("구조도에 이 기법(k: tech) 노드 없음");
      t.diagram.edges.forEach(e => { if (!n.has(e.f) || !n.has(e.t)) w(`구조도 간선 ${e.f} → ${e.t} 노드 없음`); });
      t.diagram.nodes.forEach(x => { if (x.ref && !ids.has(x.ref)) w(`구조도 ref ${x.ref} 없음`); });
      const nums = t.diagram.edges.filter(e=>e.n).map(e=>e.n).sort((a,b)=>a-b);
      if (nums.length !== t.diagram.steps.length) w(`구조도 번호 ${nums.length}개 · 단계 설명 ${t.diagram.steps.length}개 불일치`);
    }
    (t.rel||[]).forEach(([k,id]) => { if (!KINDS.includes(k)) w(`관계 종류 ${k}`); if (!ids.has(id)) w(`관계 대상 ${id} 없음`); });
    Object.keys(t.sources||{}).forEach(k => { if (srcKeys.size && !srcKeys.has(k)) w(`근거 ${k} 가 sources 에 없음`); });
  }
  return out;
}"""

DETAIL_JS = """() => {
  const q = s => document.querySelector(s);
  return {
    svg: !!q('#body svg.dg'), flow: document.querySelectorAll('#body .fbox').length,
    ex: !!q('#ex-fold .ex'), pc: !!q('#body table.pc'), spec: !!q('#body table.spec'),
    rel: !!q('#body .relg') || /연관된/.test(q('#body').textContent),
  };
}"""


def overflow(page):
    return page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page")
    ap.add_argument("--shot")
    a = ap.parse_args()
    url = pathlib.Path(a.page).resolve().as_uri()
    fails, errors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1280, "height": 900})
        page.on("console", lambda m: m.type == "error" and errors.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.wait_for_selector(".card")
        fails += page.evaluate(DATA_JS)
        ids = page.evaluate("() => PAGE.methods.map(t=>t.id)")
        for i in ids:
            page.click(f'.card[data-sel="{i}"] .t')
            r = page.evaluate(DETAIL_JS)
            miss = [k for k, v in r.items() if not v]
            if miss:
                fails.append(f"{i}: 상세에 {', '.join(miss)} 없음")
        for tab in page.evaluate("() => [...document.querySelectorAll('.tab')].map(b=>b.dataset.tab)"):
            page.click(f'.tab[data-tab="{tab}"]')
            if not page.evaluate("() => document.querySelector('#body').textContent.trim().length"):
                fails.append(f"탭 {tab} 이 비었다")
        total = len(ids)
        page.click(".chip[data-ax]")
        n = int(page.text_content("#count"))
        if n > total:
            fails.append("필터 후 개수가 전체보다 많다")
        page.click("#reset")
        for w in (1280, 390):
            page.set_viewport_size({"width": w, "height": 900})
            page.click('.tab[data-tab="detail"]')
            page.click(f'.card[data-sel="{ids[0]}"] .t')
            page.evaluate("() => document.querySelectorAll('details.fold').forEach(d=>d.open=true)")
            if overflow(page) > 1:
                fails.append(f"{w}px 에서 가로 스크롤 {overflow(page)}px")
            if a.shot:
                d = pathlib.Path(a.shot)
                d.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(d / f"detail-{w}.png"), full_page=True)
        b.close()
    fails += [f"콘솔 오류: {e}" for e in errors]
    for f in fails:
        print("FAIL", f)
    print(f"{len(ids)}개 기법 검사 — {'통과' if not fails else f'{len(fails)}건 실패'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
