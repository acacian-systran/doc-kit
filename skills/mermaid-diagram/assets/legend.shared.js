/* 그림 읽는 법 페이지와 그림 뷰어가 함께 쓰는 그리기 도구. legend_page.py · diagram_viewer.py 가 인라인한다. */
let LG_TERMS = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 뜻 글에 tooltip 을 붙인다 (첫 등장만)
function tipify(text) {
  let out = esc(text);
  for (const [w, tip] of Object.entries(LG_TERMS)) {
    const i = out.indexOf(w);
    if (i < 0) continue;
    out = out.slice(0, i) + `<span class="term" tabindex="0" data-tip="${esc(tip)}">${w}</span>` + out.slice(i + w.length);
  }
  return out;
}
const attrs = st => {
  let a = `fill="${st.fill || '#FFFFFF'}" stroke="${st.stroke || '#5A6672'}" stroke-width="${st.width || 1.4}"`;
  if (st.dash) a += ` stroke-dasharray="${st.dash}"`;
  return a;
};
const PLAIN = { fill: '#FFFFFF', stroke: '#5A6672' };
const SH = {
  rect: a => `<rect x="15" y="12" width="120" height="40" rx="2" ${a}/>`,
  cyl: a => `<path d="M25 16 v32 a50 8 0 0 0 100 0 v-32" ${a}/><ellipse cx="75" cy="16" rx="50" ry="8" ${a}/>`,
  doc: a => `<path d="M20 8 H130 V46 C110 38 95 40 75 48 C55 56 38 56 20 48 Z" ${a}/>`,
  hex: a => `<polygon points="35,12 115,12 132,32 115,52 35,52 18,32" ${a}/>`,
  diam: a => `<polygon points="75,2 112,32 75,62 38,32" ${a}/>`,
  sub: (a, st) => `<rect x="15" y="12" width="120" height="40" ${a}/><line x1="23" y1="12" x2="23" y2="52" stroke="${st.stroke || '#5A6672'}" stroke-width="1.2"/><line x1="127" y1="12" x2="127" y2="52" stroke="${st.stroke || '#5A6672'}" stroke-width="1.2"/>`,
  stad: a => `<rect x="15" y="12" width="120" height="40" rx="20" ${a}/>`
};
const shapeSvg = (key, st) => (st.text !== undefined)
  ? `<text x="75" y="38" text-anchor="middle" font-size="13" fill="${st.color}">${esc(st.text)}</text>`
  : (SH[key] || SH.rect)(attrs(st), st);
const L = (extra, mk = 'marker-end="url(#lg-ar)"') => `<line x1="10" y1="32" x2="138" y2="32" stroke="#8A94A0" ${extra} ${mk}/>`;
const LN = {
  thick: L('stroke-width="3.5"'),
  thin: L('stroke-width="1.4"'),
  dot: L('stroke-width="1.4" stroke-dasharray="3 3"'),
  cross: L('stroke-width="1.4"', 'marker-end="url(#lg-xx)"'),
  both: L('stroke-width="1.4"', 'marker-start="url(#lg-ar)" marker-end="url(#lg-ar)"') + `<text x="75" y="24" text-anchor="middle" font-size="11" fill="#5A6672">요청 · 응답</text>`,
  label: L('stroke-width="1.4"') + `<rect x="58" y="23" width="34" height="18" fill="#FFFFFF"/><text x="75" y="36" text-anchor="middle" font-size="12" fill="#2E3A46">아니오</text>`
};
const boxSvg = (b) => `<rect x="8" y="6" width="134" height="52" rx="4" ${attrs({...b.style, width: b.style.width || 1.2})}/><text x="16" y="20" font-size="10" fill="#5A6672">${esc(b.tag)}</text><rect x="40" y="26" width="70" height="22" fill="#FFFFFF" stroke="#2E5C8A"/>`;
const svg = (inner) => `<svg viewBox="0 0 150 64" aria-hidden="true">${inner}</svg>`;
const card = (tile, name, tag, desc) => `<div class="card"><div class="tile">${tile}</div><div class="name"><h3>${esc(name)}</h3>${tag}</div><p class="desc">${desc}</p></div>`;


// 전체 기호 탭: root 요소 안에 모양 · 색 · 선 · 묶음 카드를 그린다
function renderVocab(root, V, terms) {
  LG_TERMS = terms || LG_TERMS;
  root.innerHTML = `<div>
      <div class="sec-head"><h2 id="h-shapes"></h2><p>모양은 그것이 무엇인지를 말한다. 특히 무엇을 보관하는 곳인지를 가른다.</p></div>
      <div class="grid" id="shapes"></div>
    </div>
    <div>
      <div class="sec-head"><h2 id="h-colors"></h2><p>색은 역할을 말한다. 일부 색은 짝이 되는 모양이 정해져 있다. 견본은 짝 모양으로 그렸다.</p></div>
      <div class="grid" id="colors"></div>
      <div id="callouts"></div>
    </div>
    <div>
      <div class="sec-head"><h2 id="h-lines"></h2><p>선은 굵기와 무늬로 뜻을 가른다. 선 색은 모두 같은 회색이다.</p></div>
      <div class="grid" id="lines"></div>
    </div>
    <div>
      <div class="sec-head"><h2 id="h-boxes"></h2><p>여러 상자를 테두리 하나로 묶을 때 쓴다. 점선과 실선은 뜻이 다르다.</p></div>
      <div class="grid" id="boxes"></div>
      <p class="callout">"같이 묶여 있나"와 "같이 죽나"는 다른 질문이다. 점선 묶음은 앞의 질문에, 굵은 실선 묶음은 뒤의 질문에 답한다.</p>
    </div>
    <div>
      <div class="sec-head"><h2>그 밖의 약속</h2></div>
      <ul class="rules">
        <li><strong>조건은 마름모로 그린다.</strong> 라벨 안의 괄호는 조건이 아니라 부연이다.</li>
        <li><strong>구현 여부는 그리지 않는다.</strong> 붉은 점선(미확정)은 "아직 안 만들었다"가 아니라 "설계가 아직 정하지 않았다"는 뜻이다.</li>
        <li><strong>단계 번호는 실행 순서를 묻는 그림에만 붙인다.</strong></li>
        <li><strong>범례는 상자가 20개를 넘을 때만 그림 안에 둔다.</strong> 그보다 작은 그림은 이 페이지를 범례로 쓴다.</li>
        <li><strong>그림 하나는 질문 하나에 답한다.</strong> 그림 파일 맨 위의 <code>%% 답하는 질문:</code> 주석에 그 질문이 있다.</li>
      </ul>
    </div>`;
  const $ = id => root.querySelector('#' + id);
  $('h-shapes').textContent = `모양 ${V.shapes.length}가지`;
  $('h-colors').textContent = `색 ${V.classes.length}가지`;
  $('h-lines').textContent = `선 ${V.lines.length}가지`;
  $('h-boxes').textContent = `묶음 ${V.boxes.length}가지`;
  $('shapes').innerHTML = V.shapes.map(s => card(svg(shapeSvg(s.key, PLAIN)), s.name, `<code>${esc(s.syntax)}</code>`, tipify(s.meaning))).join('');
  $('colors').innerHTML = V.classes.map(c => card(svg(shapeSvg(c.pair, c.style)), c.name, `<span class="hint">${esc(c.look)}</span>`, tipify(c.meaning) + `<br><code>${esc(c.cls)}</code>`)).join('');
  $('callouts').innerHTML = V.callouts.map(t => `<p class="callout">${t}</p>`).join('');
  $('lines').innerHTML = V.lines.map(l => card(svg(LN[l.key]), l.name, `<code>${esc(l.syntax)}</code>`, tipify(l.meaning))).join('');
  $('boxes').innerHTML = V.boxes.map(b => card(svg(boxSvg(b)), b.name, '', tipify(b.meaning))).join('');
}

// mermaid svg 안의 노드 · subgraph 를 .mmd 의 id 로 찾는 표
function nodeMapOf(fig) {
  const nodeEl = {};
  if (!fig) return nodeEl;
  fig.querySelectorAll('g.node[id]').forEach(g => {
    const m = g.id.match(/-flowchart-(.+)-\d+$/);
    if (m) nodeEl[m[1]] = g;
  });
  fig.querySelectorAll('g.cluster[id]').forEach(g => {
    nodeEl[g.id] = g;
    if (fig.id && g.id.startsWith(fig.id + '-')) nodeEl[g.id.slice(fig.id.length + 1)] = g;
  });
  return nodeEl;
}
// 항목(row)이 가리키는 노드 · 선 요소
function elsFor(fig, nodeEl, r) {
  const out = [];
  (r.nodes || []).forEach(n => { if (nodeEl[n]) out.push(nodeEl[n]); });
  (r.edges || []).forEach(e => fig.querySelectorAll(`[data-id="${e}"]`).forEach(el => out.push(el.closest('.edgeLabel') || el)));
  return out;
}
// 링크를 끊고 배경을 비운다. <a> 는 위치(transform)를 들고 있어 남긴다.
function tameSvg(fig) {
  if (!fig) return;
  fig.style.backgroundColor = 'transparent';
  fig.querySelectorAll('a').forEach(a => { a.removeAttribute('href'); a.removeAttributeNS('http://www.w3.org/1999/xlink', 'href'); a.style.cursor = 'default'; });
}
// 예시 항목 한 줄
function rowHTML(kind, r, key) {
  const tile = kind === 'line' ? LN[r.key] : kind === 'box' ? boxSvg(r) : shapeSvg(r.shape, r.style || PLAIN);
  return `<button class="row" type="button" data-k="${key}" aria-pressed="false"><span class="tile">${svg(tile)}</span><span><b>${esc(r.name)}</b><span class="where">${tipify(r.where)}</span></span></button>`;
}
const LG_KINDS = [['shape', '모양'], ['class', '색'], ['line', '선'], ['box', '묶음']];
