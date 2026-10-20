/* method-atlas engine — PAGE(데이터)를 받아 필터 보드 · 기법 목록 · 상세/비교/요약 행렬/근거/용어집 탭을 그린다.
   데이터 형식은 references/data.md. 이 파일은 문제마다 고치지 않는다. */
(() => {
const P = window.PAGE;
const L = Object.assign({
  method:"기법", source:"논문", detail:"상세", compare:"비교", matrix:"요약 행렬", glossary:"용어집",
  boundary:"배포 시 1회 구축", noBuild:"배포 시 구축 없음", stageAxis:"stage",
}, P.labels||{});

/* ---------- axes ---------- */
const FIG_AXES = P.axes.structure, OPS_AXES = P.axes.ops || [];
const ALL_AXES = [...FIG_AXES, ...OPS_AXES];
ALL_AXES.forEach(a=>{ a.cls = a.cls || []; });
const STAGE_AX = ALL_AXES.find(a=>a.key===L.stageAxis);
const SRC_L = /^근거/.test(L.source) ? L.source : `근거 ${L.source}`;
const T = P.methods;
const BY = Object.fromEntries(T.map(t=>[t.id,t]));
const SRC = P.sources || [];
const REL_ROWS = [["선행","먼저 있어야 한다"],["후속","이 기법의 결과를 받는다"],["보완","함께 쓰면 이득이다"],
  ["대체","같은 문제를 다른 방식으로 푼다"],["충돌","함께 쓰기 어렵다"],["자원 공유","같은 사전 자원을 쓴다"]];

/* ---------- relations ----------
   선행은 그대로, 후속은 다른 기법의 선행을 거꾸로, 보완은 양방향 합집합.
   대체 · 충돌 · 자원 공유는 대칭 관계라 양쪽에 모두 보인다. */
const addU = (arr,id,why) => { const f=arr.find(x=>x.id===id); if(f){ if(why && !f.why) f.why=why; } else arr.push({id,why}); };
const RELS = Object.fromEntries(T.map(t=>[t.id,{pre:[],post:[],comp:[]}]));
const SYM = Object.fromEntries(T.map(t=>[t.id,{"대체":[],"충돌":[],"자원 공유":[]}]));
T.forEach(t=>(t.rel||[]).forEach(([k,id,why])=>{
  if(!BY[id]){ console.error(`${t.id}: 관계 대상 ${id} 없음`); return; }
  if(k==="선행"){ addU(RELS[t.id].pre,id,why); addU(RELS[id].post,t.id); }
  else if(k==="보완"){ addU(RELS[t.id].comp,id,why); addU(RELS[id].comp,t.id,why); }
  else if(SYM[t.id][k]){ addU(SYM[t.id][k],id,why); addU(SYM[id][k],t.id,why); }
  else console.error(`${t.id}: 알 수 없는 관계 ${k}`);
}));
/* 서로를 선행으로 두는 쌍은 단계 순서로 한쪽에만 두고 「함께 필요」 로 적는다 */
const ORD = Object.fromEntries((P.stages||[]).map((s,i)=>[s.key,i]));
Object.entries(RELS).forEach(([id,r])=>{
  const both = r.pre.filter(x=>r.post.some(y=>y.id===x.id)).map(x=>x.id);
  both.forEach(o=>{ const later = (ORD[BY[o].stage]??0) > (ORD[BY[id].stage]??0);
    const from = later ? r.pre : r.post, to = later ? r.post : r.pre;
    from.splice(from.findIndex(x=>x.id===o),1); to.find(x=>x.id===o).why = "함께 필요"; });
});
Object.values(RELS).forEach(r=>{ const seen=new Set([...r.pre,...r.post].map(x=>x.id)); r.comp=r.comp.filter(x=>!seen.has(x.id)); });

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const br = s => esc(s).replace(/\n/g,"<br>");
const state = {exOpen:false, ioOpen:false, f:Object.fromEntries(ALL_AXES.map(a=>[a.key,new Set()])),
  sel:T[0].id, cmp:new Set(P.compareDefault || T.slice(0,3).map(t=>t.id)), tab:"detail", q:"",
  view:Object.assign({map:!!P.map, combos:!!(P.combos||[]).length, compact:false}, P.views||{})};
/* 보기 설정은 보는 사람 브라우저에만 남는다 (없어도 기본값으로 그린다) */
const VIEW_KEY = "method-atlas:view:" + P.title;
try{ Object.assign(state.view, JSON.parse(localStorage.getItem(VIEW_KEY)||"{}")); }catch(_){}
const saveView = () => { try{ localStorage.setItem(VIEW_KEY, JSON.stringify(state.view)); }catch(_){} };

/* 한계 문장 끝의 「(→ T3 · T5)」 에서 그 한계를 맡는 기법을 뽑는다 */
const HAND = Object.fromEntries(T.map(t=>{
  const ids = [...(t.limit||"").matchAll(/→\s*([^)]*)\)/g)].flatMap(m=>m[1].match(/[A-Za-z]+\d+/g)||[]);
  return [t.id, [...new Set(ids)].filter(id=>BY[id] && id!==t.id)];
}));

function match(t, skip){
  return ALL_AXES.every(a=>{
    if(a.key===skip) return true;
    const want = state.f[a.key]; if(!want.size) return true;
    return (t.v[a.key]||[]).some(i=>want.has(i));
  });
}
const matched = () => T.filter(t=>match(t));
const litOnly = (t,a) => (t.v[a.key]||[]).map(i=>`<span class="lit on${a.cls[i]?" c-"+a.cls[i]:""}">${esc(a.opts[i])}</span>`).join("");
const srcTxt = t => Object.entries(t.sources||{}).map(([k,v])=>`${k} ${v}`).join(" · ");
const stageShort = t => STAGE_AX ? (t.v[STAGE_AX.key]||[]).map(i=>(P.stages[i]||{}).short||STAGE_AX.opts[i]).join(" · ") : "";

/* ---------- static header ---------- */
function renderHead(){
  document.title = P.title;
  $("#h1").textContent = P.h1 || P.title;
  $("#lede").innerHTML = P.lede || "";
  $("#q").innerHTML = P.question ? `<span class="k">${esc(P.question.k)}</span><span class="v">${esc(P.question.v)}</span>` : "";
  $("#q").hidden = !P.question;
  $("#legend").innerHTML = (P.legend||[]).map(x=>`<span><span class="sw" style="background:var(--${x.cls});border-color:var(--${x.cls}B)"></span>${esc(x.label)}</span>`).join("");
  $("#crit").innerHTML = P.criterion || "";
  $("#crit").hidden = !P.criterion;
  $("#total").textContent = T.length;
  $("#foot").innerHTML = P.footer || "";
  renderViews();
  renderTabs();
}
function renderViews(){
  const V = [["map","흐름 지도",!!P.map],["combos","조합",!!(P.combos||[]).length],["compact","간략 상세",true]].filter(v=>v[2]);
  $("#views").innerHTML = P.viewToggles===false ? "" : `<span class="vk">보기</span>` + V.map(([k,n])=>`<button type="button" class="vbtn" data-view="${k}" aria-pressed="${!!state.view[k]}">${n}</button>`).join("");
}
function renderTabs(){
  if(state.tab==="combos" && !state.view.combos) state.tab = "detail";
  $("#tabs").innerHTML = [["detail",L.detail],["compare",L.compare,'<span class="n" id="cmpn"></span>'],["matrix",L.matrix],
    ...(state.view.combos && (P.combos||[]).length?[["combos",L.combos||"조합"]]:[]),
    ...(SRC.length?[["sources",L.source]]:[]),...((P.glossary||[]).length?[["glossary",L.glossary]]:[])]
    .map(([k,n,x])=>`<button class="tab" role="tab" data-tab="${k}" aria-selected="${k===state.tab}">${esc(n)}${x||""}</button>`).join("");
  const n = $("#cmpn"); if(n) n.textContent = state.cmp.size || "";
}

/* ---------- 흐름 지도 — 행 축 × 열 축 격자에 기법을 놓는다 ---------- */
function renderMap(){
  const box = $("#map");
  box.hidden = !(P.map && state.view.map);
  if(box.hidden){ box.innerHTML = ""; return; }
  const R = ALL_AXES.find(a=>a.key===P.map.rows), C = ALL_AXES.find(a=>a.key===P.map.cols);
  const m = new Set(matched().map(t=>t.id));
  const node = t => `<button type="button" class="mnode" data-sel="${t.id}" data-node="${t.id}"${m.has(t.id)?"":' style="opacity:.4"'}><span class="pill ${t.stage}">${t.id}</span>${esc(t.short)}</button>`;
  const colCls = i => C.key===L.stageAxis && P.stages && P.stages[i] ? " "+P.stages[i].key : "";
  const rows = R.opts.map((o,ri)=>{
    if(!T.some(t=>(t.v[R.key]||[]).includes(ri))) return "";
    return `<div class="mr">${esc(o)}</div>` + C.opts.map((co,ci)=>{
      const ts = T.filter(t=>(t.v[R.key]||[]).includes(ri) && (t.v[C.key]||[]).includes(ci));
      return `<div class="mc${ts.length?"":" empty"}" data-col="${esc(co)}">${ts.map(node).join("")}</div>`; }).join(""); }).join("");
  box.innerHTML = `<div class="board-head"><h2>흐름 지도 <span class="hint">· ${esc(P.map.title || `${R.name} × ${C.name}`)}</span></h2></div>
    ${P.map.lede?`<p class="hint">${P.map.lede}</p>`:""}
    <div class="mapg" style="grid-template-columns:minmax(120px,170px) repeat(${C.opts.length},minmax(0,1fr))"><div class="mh">${esc(R.name)} ＼ ${esc(C.name)}</div>${C.opts.map((o,i)=>`<div class="mh${colCls(i)}">${esc(o)}</div>`).join("")}${rows}</div>
    <div class="mkey"><span><i style="border-color:var(--ink)"></i>고른 ${esc(L.method)}</span><span><i style="border-color:var(--kgB)"></i>이 ${esc(L.method)}의 한계를 맡는 쪽</span><span><i style="border-color:var(--sub);border-style:dashed"></i>이 ${esc(L.method)}이 한계를 맡아 주는 쪽</span></div>
    <p class="mapnote" id="mapnote">${esc(L.method)}에 마우스를 올리거나 포커스하면 한계 문장의 「→」 로 이어진 ${esc(L.method)}이 강조된다. 누르면 상세로 간다.</p>`;
}
function mapHover(id){
  const box = $("#map"); if(box.hidden) return;
  box.classList.toggle("hov", !!id);
  box.querySelectorAll(".mnode").forEach(n=>{ const x=n.dataset.node;
    n.classList.toggle("me", x===id); n.classList.toggle("to", !!id && HAND[id].includes(x)); n.classList.toggle("from", !!id && HAND[x].includes(id)); });
  if(id){ const t = BY[id], to = HAND[id], from = T.filter(x=>HAND[x.id].includes(id)).map(x=>x.id);
    $("#mapnote").innerHTML = `<b>${id}</b> 한계 — ${esc(t.limit)}${from.length?` <span class="dim">· ${from.join(" · ")} 의 한계를 맡는다</span>`:""}`;
  }
}

/* ---------- filter board ---------- */
function renderBoard(){
  const g = (title, axes) => axes.length ? `<div class="group"><h3>${esc(title)}</h3>${axes.map(a=>`
    <div class="axis"><div class="name"${a.tip?` title="${esc(a.tip)}"`:""}>${esc(a.name)}</div><div class="chips">${a.opts.map((o,i)=>{
      const n = T.filter(t=>match(t,a.key) && (t.v[a.key]||[]).includes(i)).length;
      const on = state.f[a.key].has(i);
      return `<button type="button" class="chip${a.cls[i]?" c-"+a.cls[i]:""}${!n&&!on?" zero":""}" aria-pressed="${on}" data-ax="${a.key}" data-i="${i}">${esc(o)}<span class="n">${n}</span></button>`;
    }).join("")}</div></div>`).join("")}</div>` : "";
  $("#groups").innerHTML = g(P.axes.structureTitle||"구조 분류", FIG_AXES) + g(P.axes.opsTitle||"운영 요건", OPS_AXES);
  $("#count").textContent = matched().length;
  const act = ALL_AXES.flatMap(a=>[...state.f[a.key]].map(i=>a.opts[i]));
  $("#active").textContent = act.length ? "선택: " + act.join(" · ") : "선택한 조건 없음";
}

/* ---------- list ---------- */
function renderList(){
  const m = new Set(matched().map(t=>t.id));
  $("#list").innerHTML = T.map(t=>`
    <div class="card${state.sel===t.id?" sel":""}${m.has(t.id)?"":" off"}" role="button" tabindex="0" data-sel="${t.id}" aria-current="${state.sel===t.id}">
      <span class="pill">${t.id}</span>
      <span class="t">${esc(t.short)}</span>
      <label class="cmp" title="비교에 넣기"><input type="checkbox" data-cmp="${t.id}" ${state.cmp.has(t.id)?"checked":""} aria-label="${t.id} 비교에 넣기">비교</label>
      <span class="o">${esc(t.one)}</span>
    </div>`).join("") + (m.size ? "" : `<p class="empty">조건을 모두 만족하는 ${esc(L.method)}이 없다. 조건 일부를 해제한다.</p>`);
  const n = $("#cmpn"); if(n) n.textContent = state.cmp.size || "";
}

/* ---------- 단계별 입출력 ---------- */
function flowHTML(t){
  const box = f => `<div class="fcol"><div class="flab">${esc(f.l)}</div><div class="fbox ${f.c||""}"><b>${esc(f.t)}</b>${f.v?`<div class="v">${br(f.v)}</div>`:""}${f.m?`<div class="m">${esc(f.m)}</div>`:""}${f.s?`<div class="s">${esc(f.s)}</div>`:""}${f.tag?`<span class="tag">${esc(f.tag)}</span>`:""}</div></div>`;
  return `<div class="flow" style="grid-template-columns:repeat(${t.flow.length},minmax(0,1fr))">${t.flow.map(box).join("")}</div>`;
}

/* ---------- 작동 방식 (C4 식 구조도) ----------
   노드: c · r = 격자 열 · 행, k = tech · llm · store · kg · io · other · build, n 이름, ty [유형], d 설명 줄,
   ref 다른 기법 id(누르면 이동), off 「사전 구축」 경계 안. 간선: f → t, n 단계 번호, both 양방향,
   off 사전 구축 간선, route above · below(루프) · vh. */
function diagramHTML(t, compact){
  const D = t.diagram; if(!D) return "";
  const BW=140, BH=88, PW=180, RP=144, X0=16, Y0=40;
  const B = Object.fromEntries(D.nodes.map(n=>{ const x=X0+n.c*PW, y=Y0+n.r*RP; return [n.id,{...n,x,y,w:BW,h:BH,cx:x+BW/2,cy:y+BH/2}]; }));
  const pts = e => {
    const a=B[e.f], b=B[e.t];
    if(!a||!b){ console.error(`${t.id}: 간선 ${e.f} → ${e.t} 의 노드 없음`); return [[0,0],[0,0]]; }
    if(e.route==="above"||e.route==="below"){
      const s = e.route==="below"?1:-1, ya = s>0?a.y+a.h:a.y, yb = s>0?b.y+b.h:b.y;
      const yy = s>0 ? Math.max(ya,yb)+28 : Math.min(ya,yb)-28;
      return [[a.cx,ya],[a.cx,yy],[b.cx,yy],[b.cx,yb]];
    }
    if(a.r===b.r){ const d = b.cx>a.cx?1:-1; return [[a.cx+d*a.w/2,a.cy],[b.cx-d*b.w/2,b.cy]]; }
    if(a.c===b.c){ const d = b.cy>a.cy?1:-1; return [[a.cx,a.cy+d*a.h/2],[b.cx,b.cy-d*b.h/2]]; }
    const dx = b.cx>a.cx?1:-1, dy = b.cy>a.cy?1:-1;
    if(e.route==="vh") return [[a.cx,a.cy+dy*a.h/2],[a.cx,b.cy],[b.cx-dx*b.w/2,b.cy]];
    return [[a.cx+dx*a.w/2,a.cy],[b.cx,a.cy],[b.cx,b.cy-dy*b.h/2]];
  };
  const ys = [];
  const box = n => {
    const cyl = n.k==="store"||n.k==="kg", rx = n.k==="io"?18:8, o = cyl?5:0;
    const shape = cyl
      ? `<path class="bx" d="M${n.x} ${n.y+7}a${n.w/2} 7 0 0 0 ${n.w} 0V${n.y+n.h-7}a${n.w/2} 7 0 0 1 ${-n.w} 0Z"/><path class="bx" d="M${n.x} ${n.y+7}a${n.w/2} 7 0 0 1 ${n.w} 0" style="fill:none"/>`
      : `<rect class="bx" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}"/>`;
    const tx = (cls,y,s) => `<text class="${cls}" x="${n.cx}" y="${y}" text-anchor="middle">${esc(s)}</text>`;
    return `<g class="k-${n.k}${n.k==="tech"?" "+t.stage:""}${n.ref?" lnk":""}"${n.ref?` data-sel="${n.ref}"`:""}>${n.ref?`<title>${n.ref} 상세로 이동</title>`:""}${shape}${tx("nm",n.y+24+o,n.n)}${tx("ty",n.y+40+o,n.ty||"")}${(n.d||[]).map((s,i)=>tx("ds",n.y+59+o+i*15,s)).join("")}</g>`;
  };
  const edge = e => {
    const p = pts(e); p.forEach(q=>ys.push(q[1]));
    const d = "M"+p.map(q=>q.join(" ")).join("L");
    const mk = e.off ? "dg-ah-off" : "dg-ah";
    let num = "";
    if(e.n){
      let best=0, m=p[0];
      for(let i=1;i<p.length;i++){ const len=Math.abs(p[i][0]-p[i-1][0])+Math.abs(p[i][1]-p[i-1][1]); if(len>best){best=len; m=[(p[i][0]+p[i-1][0])/2,(p[i][1]+p[i-1][1])/2];} }
      num = `<g class="num"><circle cx="${m[0]}" cy="${m[1]}" r="9"/><text x="${m[0]}" y="${m[1]+4}" text-anchor="middle">${e.n}</text></g>`;
    }
    return `<path class="ed${e.off?" off":""}" d="${d}" marker-end="url(#${mk})"${e.both?` marker-start="url(#${mk})"`:""}/>${num}`;
  };
  const off = D.nodes.filter(n=>n.off).map(n=>B[n.id]);
  let bnd = "";
  if(off.length){
    const x1=Math.min(...off.map(n=>n.x))-10, x2=Math.max(...off.map(n=>n.x+n.w))+10, y1=Math.min(...off.map(n=>n.y))-26, y2=Math.max(...off.map(n=>n.y+n.h))+10;
    ys.push(y1,y2);
    bnd = `<rect class="bnd" x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" rx="12"/><text class="bndl" x="${x1+12}" y="${y1+16}">${esc(L.boundary)}</text>`;
  }
  D.nodes.forEach(n=>ys.push(B[n.id].y, B[n.id].y+BH));
  const edges = D.edges.map(edge).join("");
  const cols = Math.max(...D.nodes.map(n=>n.c));
  const W = X0*2 + Math.max(cols,4)*PW + BW, top = Math.min(...ys)-14, H = Math.max(...ys)+14-top;
  const ah = (id,cls) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0 0L10 5L0 10z"/></marker>`;
  const svg = `<svg class="dg" viewBox="0 ${top} ${W} ${H}" role="img" aria-label="${esc(t.id)} 구조도"><defs>${ah("dg-ah","ah")}${ah("dg-ah-off","ah-off")}</defs>${bnd}${edges}${D.nodes.map(n=>box(B[n.id])).join("")}</svg>`;
  const kinds = new Set(D.nodes.map(n=>n.k));
  const DL = Object.assign({tech:`이 ${L.method}`, llm:"LLM", store:"사전 인덱스", kg:"원천 데이터", other:`다른 ${L.method} (누르면 이동)`, io:"입력 · 출력"}, P.diagramLegend||{});
  const sw = {tech:`background:var(--${t.stage});border-color:var(--${t.stage}B)`, llm:"background:var(--surface);border-color:var(--ink)",
    store:"background:var(--idx);border-color:var(--idxB)", kg:"background:var(--kg);border-color:var(--kgB)", io:"background:var(--soft);border-color:var(--line)"};
  const leg = `<div class="dleg">${["tech","llm","store","kg","other","io"].filter(k=>kinds.has(k)).map(k=>
    `<span><span class="sw${k==="other"?" oth":""}"${sw[k]?` style="${sw[k]}"`:""}></span>${esc(DL[k])}</span>`).join("")}${off.length?`<span><span class="sw bndw"></span>${esc(L.boundary)}</span>`:""}</div>`;
  const steps = `<ol class="dsteps">${D.steps.map((s,i)=>`<li><span class="no">${i+1}</span><span>${esc(s)}</span></li>`).join("")}</ol>`;
  const offTxt = D.offNote ? `<p class="src"><b>${esc(L.boundary)}</b> — ${esc(D.offNote)}</p>` : D.offNone ? `<p class="src"><b>${esc(L.noBuild)}</b> — ${esc(D.offNone)}</p>` : "";
  return compact ? `<div class="dgw">${svg}</div>${leg}<details class="fold" id="steps-fold"${state.stepsOpen?" open":""}><summary><h3>단계 설명 ${D.steps.length}개</h3></summary><div class="foldin">${steps}${offTxt}</div></details>`
    : `<div class="dgw">${svg}</div>${leg}${steps}${offTxt}`;
}

/* ---------- 분류 · 운영 요건 표 — 축의 칩 + 그 축에 대한 이 기법의 설명(notes) ---------- */
function specHTML(t){
  const notes = t.notes || {};
  const row = a => `<tr><td>${esc(a.name)}</td><td><div class="chips">${litOnly(t,a)}</div></td><td>${notes[a.key]?esc(notes[a.key]):""}</td></tr>`;
  const extra = (t.badges||[]).filter(b=>b[2]).map(([k,v,d])=>`<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td><td>${esc(d)}</td></tr>`).join("");
  const grp = (h, rows) => rows ? `<tr class="grp"><th colspan="3">${esc(h)}</th></tr>${rows}` : "";
  return `<div class="tw"><table class="spec">
    ${grp(P.axes.structureTitle||"구조", FIG_AXES.map(row).join("") + extra)}
    ${grp(P.axes.opsTitle||"운영", OPS_AXES.map(row).join(""))}
  </table></div>`;
}

function relAllHTML(t){
  const r = RELS[t.id], y = SYM[t.id];
  const lists = {"선행":r.pre,"후속":r.post,"보완":r.comp,...y};
  const btn = x => `<button type="button" class="relb" data-sel="${x.id}"><span class="pill">${x.id}</span> ${esc(BY[x.id].short)}${x.why?` <span class="why">${esc(x.why)}</span>`:""}</button>`;
  const rows = REL_ROWS.filter(([k])=>lists[k].length);
  if(!rows.length) return `<p class="src">연관된 ${esc(L.method)} 없음</p>`;
  return `<div class="relg">${rows.map(([k,sub])=>`<div class="k">${k}<small>${sub}</small></div><div class="items">${lists[k].map(btn).join("")}</div>`).join("")}</div>`;
}

/* ---------- 상세 ---------- */
const fold = (id, title, inner, open) => `<details class="sec fold" id="${id}"${open?" open":""}><summary><h3>${esc(title)}</h3></summary><div class="foldin">${inner}</div></details>`;
function renderDetail(){
  const t = BY[state.sel];
  const C = state.view.compact;
  const fits = match(t);
  const srcLinks = Object.entries(t.sources||{}).map(([k,v])=>SRC.some(s=>s.key===k)
    ? `<button type="button" class="plink" data-source="${esc(k)}">${esc(k)} ${v}</button>` : `${esc(k)} ${v}`).join(" · ");
  const pc = t.pc;
  return `
  <div class="dh">
    <div class="meta"><span class="pill ${t.stage}">${t.id}</span>${STAGE_AX?`<span>${esc(STAGE_AX.name)} ${esc(stageShort(t))}</span>`:""}${fits?"":`<span class="badge">현재 조건 미해당</span>`}</div>
    <h2>${esc(t.id)}. ${esc(t.name)}</h2>
    <div class="meta">${srcLinks?`<span class="badge">${esc(SRC_L)} ${srcLinks}</span>`:""}${(t.badges||[]).map(([k,v])=>`<span class="badge">${esc(k)} <b>${esc(v)}</b></span>`).join("")}</div>
    <p class="one">${esc(t.one)}</p>
    ${t.def && !C?`<div class="def"><span class="k">원문 정의</span><p>${t.def.html||esc(t.def.text)}</p>${t.def.formula?`<pre>${esc(t.def.formula)}</pre>`:""}<p class="src">${esc(t.def.src||"")}${t.def.link?` · <a href="${esc(t.def.link)}" target="_blank" rel="noopener">원본</a>`:""}</p></div>`:""}
  </div>
  ${t.diagram?`<div class="sec"><h3>작동 방식</h3>${diagramHTML(t, C)}</div>`:""}
  <details class="sec fold" id="io-fold"${state.ioOpen?" open":""}><summary><h3>단계별 입출력</h3></summary><div class="foldin">${flowHTML(t)}</div></details>
  <details class="sec fold" id="ex-fold"${state.exOpen?" open":""}><summary><h3>예시</h3></summary><div class="ex">${t.ex.data?`<div class="exk">${esc(P.exampleDataLabel||"예시 데이터")}</div><pre>${esc(t.ex.data)}</pre>`:""}${t.ex.html}</div></details>
  <div class="sec"><h3>장단점 · 한계</h3><div class="tw"><table class="pc"><tr><th></th><th>장점</th><th>단점</th></tr>
    <tr><td>사용</td><td>${esc(pc.usePro)}</td><td>${esc(pc.useCon)}</td></tr>
    <tr><td>미사용</td><td>${esc(pc.skipPro)}</td><td>${esc(pc.skipCon)}</td></tr></table></div>
    <div class="note"><b>한계</b> — ${esc(t.limit)}</div>
    <p class="src">괄호 안에 근거를 명시하였다.</p></div>
  ${C ? fold("spec-fold","분류 · 운영 요건",specHTML(t),state.specOpen) : `<div class="sec"><h3>분류 · 운영 요건</h3>${specHTML(t)}</div>`}
  ${C ? fold("rel-fold",`연관 ${L.method}`,relAllHTML(t),state.relOpen) : `<div class="sec"><h3>연관 ${esc(L.method)}</h3>${relAllHTML(t)}</div>`}
  ${C && t.def ? fold("def-fold","원문 정의",`<div class="def"><p>${t.def.html||esc(t.def.text)}</p>${t.def.formula?`<pre>${esc(t.def.formula)}</pre>`:""}<p class="src">${esc(t.def.src||"")}${t.def.link?` · <a href="${esc(t.def.link)}" target="_blank" rel="noopener">원본</a>`:""}</p></div>`,state.defOpen) : ""}`;
}

/* ---------- 비교 — 고른 기법을 열로, 「같음」 이 없는 행이 차이 ---------- */
function renderCompare(){
  const ts = T.filter(t=>state.cmp.has(t.id));
  if(ts.length<2) return `<p>목록에서 「비교」를 2개 이상 선택하면 비교표가 표시된다. 현재 ${ts.length}개 선택.</p>`;
  const row = (name, f, diff=true) => {
    const vals = ts.map(f);
    const same = diff && vals.every(v=>v===vals[0]);
    return `<tr><th scope="row">${esc(name)}${same?' <span class="dim">· 같음</span>':""}</th>${vals.map(v=>`<td>${v}</td>`).join("")}</tr>`;
  };
  const ax = a => row(a.name, t=>`<div class="chips">${litOnly(t,a)}</div>`);
  const badgeKeys = [...new Set(T.flatMap(t=>(t.badges||[]).map(b=>b[0])))];
  const noteKeys = OPS_AXES.filter(a=>T.some(t=>t.notes&&t.notes[a.key]));
  return `<p class="src">「같음」 표시가 없는 행이 ${esc(L.method)} 간 차이가 있는 항목이다.</p>
  <div class="tw"><table><tr><th></th>${ts.map(t=>`<th><span class="pill">${t.id}</span> ${esc(t.short)}</th>`).join("")}</tr>
  ${row("요약", t=>esc(t.one), false)}
  ${FIG_AXES.map(ax).join("")}
  ${SRC.length?row(SRC_L, t=>esc(srcTxt(t))):""}
  ${badgeKeys.map(k=>row(k, t=>esc(((t.badges||[]).find(b=>b[0]===k)||[,"—"])[1]))).join("")}
  ${noteKeys.map(a=>row(a.name, t=>esc((t.notes||{})[a.key]||"—"))).join("")}
  ${row("한계", t=>esc(t.limit), false)}
  </table></div>`;
}

/* ---------- 조합 — 함께 쓰는 묶음이 축의 어느 값을 막고 무엇이 남는가 ---------- */
function renderCombos(){
  const A = ALL_AXES.find(a=>a.key===(P.combosAxis || (P.map||{}).rows)) || FIG_AXES[0];
  return `<p class="src">함께 쓰는 ${esc(L.method)} 묶음. 「${esc(A.name)}」 축의 값마다 묶음 안 누가 맡는지(●) 표시하고, 아무도 맡지 않은 값은 「남음」 이다.</p>` + P.combos.map(c=>{
    const ts = c.ids.map(id=>BY[id]).filter(Boolean);
    const rows = A.opts.map((o,i)=>{ if(A.cls[i]==="none") return "";
      const hit = ts.map(t=>(t.v[A.key]||[]).includes(i));
      const any = hit.some(Boolean);
      return `<tr><th scope="row">${esc(o)}</th>${hit.map(h=>`<td class="dot">${h?"●":""}</td>`).join("")}<td class="${any?"ok":"no"}">${any?"막힘":"남음"}</td></tr>`; }).join("");
    return `<section class="combo"><h3>${esc(c.name)}</h3>${c.when?`<p>${esc(c.when)}</p>`:""}
      <div class="rel">${ts.map(t=>`<button type="button" class="relb" data-sel="${t.id}"><span class="pill ${t.stage}">${t.id}</span>${esc(t.short)}</button>`).join("")}</div>
      <div class="tw"><table class="cov"><tr><th>${esc(A.name)}</th>${ts.map(t=>`<th>${t.id}</th>`).join("")}<th>결과</th></tr>${rows}</table></div>
      ${c.residual?`<div class="note"><b>남는 위험</b> — ${esc(c.residual)}</div>`:""}
      ${c.cost?`<p class="src"><b>드는 것</b> — ${esc(c.cost)}</p>`:""}</section>`;
  }).join("");
}

/* ---------- 요약 행렬 ---------- */
function renderMatrix(){
  const m = new Set(matched().map(t=>t.id));
  const badgeKeys = [...new Set(T.flatMap(t=>(t.badges||[]).map(b=>b[0])))];
  return `<p class="src">${esc(L.method)}별 분류 값. 흐리게 표시된 행은 현재 조건 미해당이며, 행을 선택하면 상세로 이동한다.</p>
  <div class="tw"><table class="mx"><tr><th>${esc(L.method)}</th>${FIG_AXES.map(a=>`<th>${esc(a.name)}</th>`).join("")}${badgeKeys.map(k=>`<th>${esc(k)}</th>`).join("")}${SRC.length?`<th>${esc(SRC_L)}</th>`:""}</tr>
  ${T.map(t=>`<tr class="${m.has(t.id)?"":"off"}" data-sel="${t.id}"><td><span class="pill">${t.id}</span> ${esc(t.short)}</td>${FIG_AXES.map(a=>`<td><div class="mini">${litOnly(t,a)}</div></td>`).join("")}${badgeKeys.map(k=>`<td>${esc(((t.badges||[]).find(b=>b[0]===k)||[,"—"])[1])}</td>`).join("")}${SRC.length?`<td>${esc(srcTxt(t))}</td>`:""}</tr>`).join("")}
  </table></div>`;
}

/* ---------- 근거 (논문 · 문서 · 시스템) ---------- */
function renderSources(){
  const techOf = key => T.filter(t=>(t.sources||{})[key]).map(t=>({t, mark:t.sources[key]})).sort((a,b)=>(a.mark==="●"?0:1)-(b.mark==="●"?0:1));
  const chipsOf = key => techOf(key).map(({t,mark})=>`<button type="button" class="relb" data-sel="${t.id}"><span class="pill">${t.id}</span>${esc(t.short)} <span class="why">${mark}</span></button>`).join("");
  const cols = P.sourceColumns || [];
  const table = `<div class="tw"><table><tr><th>${esc(L.source)}</th><th>해결하려는 문제</th>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}<th>핵심 ${esc(L.method)} ●</th></tr>
    ${SRC.map(s=>`<tr><td><button type="button" class="relb" data-source="${esc(s.key)}"><b>${esc(s.key)}</b></button></td><td>${esc(s.problemShort||s.problem.split(". ")[0].replace(/\.$/,""))}</td>${cols.map(c=>`<td>${esc(((s.meta||[]).find(m=>m[0]===c)||[,"—"])[1].split(" (")[0])}</td>`).join("")}<td>${techOf(s.key).filter(x=>x.mark==="●").map(x=>x.t.id).join(" · ")}</td></tr>`).join("")}</table></div>`;
  const card = s => {
    const apply = techOf(s.key).map(({t})=>{ const d=(t.bySource||{})[s.key]; return d?`<li><button type="button" class="relb" data-sel="${t.id}"><span class="pill">${t.id}</span>${esc(t.short)}</button> ${esc(d)}</li>`:""; }).join("");
    return `<article class="paper" id="source-${esc(s.key)}">
    <div class="dh"><h2>${esc(s.key)}</h2><p class="src">${esc(s.title)}${(s.links||[]).map(([n,u])=>` · <a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("")}</p>
    <div class="meta">${(s.meta||[]).map(([k,v])=>`<span class="badge">${esc(k)} <b>${esc(v)}</b></span>`).join("")}</div></div>
    <div class="sec"><h3>해결하려는 문제</h3><p>${esc(s.problem)}</p></div>
    <div class="sec"><h3>핵심 구조</h3><ul>${(s.core||[]).map(c=>{const [h,...r]=c.split(" — ");return `<li><b>${esc(h)}</b>${r.length?" — "+esc(r.join(" — ")):""}</li>`;}).join("")}</ul></div>
    ${s.claim?`<div class="sec"><h3>주장</h3><p>${esc(s.claim)}</p></div>`:""}
    <div class="sec"><h3>쓰는 ${esc(L.method)} <span class="dim">● 핵심 · ○ 부분 사용</span></h3><div class="rel">${chipsOf(s.key)}</div></div>
    ${apply?`<details class="sec fold"><summary><h3>${esc(L.method)}별 적용</h3></summary><div class="ex"><ul class="apply">${apply}</ul></div></details>`:""}
    <div class="sec"><h3>한계</h3><ul>${(s.limits||[]).map(l=>`<li>${esc(l)}</li>`).join("")}</ul></div>
    </article>`;
  };
  return `<div class="sec"><h3>${esc(L.source)} 비교</h3>${table}</div>${SRC.map(card).join("")}`;
}

/* ---------- 용어집 ---------- */
function renderGlossary(){
  const q = state.q.trim().toLowerCase();
  const sec = P.glossary.map(([h,rows])=>{
    const rs = rows.filter(r=>!q || r.join(" ").toLowerCase().includes(q));
    if(!rs.length) return "";
    return `<div class="sec"><h3>${esc(h)}</h3><div class="tw"><table><tr><th>용어</th><th>뜻</th><th>출처</th></tr>${rs.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td class="src">${esc(r[2]||"")}</td></tr>`).join("")}</table></div></div>`;
  }).join("");
  return `<div class="gl"><input id="gq" type="search" placeholder="용어 찾기" value="${esc(state.q)}" aria-label="용어 찾기">${sec||'<p>일치하는 용어 없음</p>'}</div>`;
}

function renderPane(){
  document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-selected", b.dataset.tab===state.tab));
  const f = {detail:renderDetail, compare:renderCompare, matrix:renderMatrix, combos:renderCombos, sources:renderSources, glossary:renderGlossary}[state.tab];
  $("#body").innerHTML = f();
  if(state.tab==="glossary"){ const i=$("#gq"); i.addEventListener("input",e=>{state.q=e.target.value; const pos=i.selectionStart; renderPane(); const n=$("#gq"); n.focus(); n.setSelectionRange(pos,pos);}); }
}
function renderAll(){ renderBoard(); renderMap(); renderList(); renderPane(); }

/* ---------- events ---------- */
document.addEventListener("click", e=>{
  const chip = e.target.closest(".chip[data-ax]");
  if(chip){ const s=state.f[chip.dataset.ax], i=+chip.dataset.i; s.has(i)?s.delete(i):s.add(i); const m=matched(); if(m.length && !m.some(t=>t.id===state.sel)) state.sel=m[0].id; renderAll(); return; }
  if(e.target.closest(".cmp")) return;
  const vb = e.target.closest("[data-view]");
  if(vb){ const k=vb.dataset.view; state.view[k]=!state.view[k]; saveView(); renderViews(); renderTabs(); renderMap(); renderPane(); return; }
  const sb = e.target.closest("[data-source]");
  if(sb){ state.tab="sources"; renderPane(); document.getElementById("source-"+sb.dataset.source)?.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  const tab = e.target.closest(".tab");
  if(tab){ state.tab = tab.dataset.tab; renderPane(); return; }
  const sel = e.target.closest("[data-sel]");
  if(sel) select(sel.dataset.sel, true);
});
const FOLDS = {"ex-fold":"exOpen","io-fold":"ioOpen","spec-fold":"specOpen","rel-fold":"relOpen","def-fold":"defOpen","steps-fold":"stepsOpen"};
document.addEventListener("toggle", e=>{ const k = FOLDS[e.target.id]; if(k) state[k] = e.target.open; }, true);
["mouseover","focusin"].forEach(ev=>document.addEventListener(ev, e=>{ const n=e.target.closest&&e.target.closest(".mnode"); if(n) mapHover(n.dataset.node); }));
["mouseout","focusout"].forEach(ev=>document.addEventListener(ev, e=>{ const n=e.target.closest&&e.target.closest(".mnode"); if(n && !(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest(".mnode"))) mapHover(null); }));
document.addEventListener("change", e=>{
  const c = e.target.closest("[data-cmp]");
  if(c){ c.checked ? state.cmp.add(c.dataset.cmp) : state.cmp.delete(c.dataset.cmp); renderList(); if(state.tab==="compare") renderPane(); }
});
document.addEventListener("keydown", e=>{
  const card = e.target.closest(".card[data-sel]");
  if(card && (e.key==="Enter"||e.key===" ") && !e.target.closest(".cmp")){ e.preventDefault(); select(card.dataset.sel, true); }
});
$("#reset").addEventListener("click", ()=>{ ALL_AXES.forEach(a=>state.f[a.key].clear()); renderAll(); });

function select(id, scroll){
  if(!BY[id]) return;
  state.sel = id; state.tab = "detail";
  try{ history.replaceState(null,"","#"+id); }catch(_){}
  renderList(); renderPane();
  document.querySelector(`.card[data-sel="${id}"]`)?.scrollIntoView({block:"nearest"});
  if(scroll) document.querySelector(".pane").scrollIntoView({behavior:"smooth",block:window.matchMedia("(max-width:1080px)").matches?"start":"nearest"});
}

const h = (location.hash||"").slice(1);
if(BY[h]) state.sel = h;
renderHead();
renderAll();
})();
