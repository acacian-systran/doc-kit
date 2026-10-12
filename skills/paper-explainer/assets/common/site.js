/* paper-explainer — 모든 페이지가 공유하는 동작.
 *
 * sections.js 의 window.PAPER 하나만 보고 다음을 만든다.
 *   - 미니맵: Overview 흐름의 축소판. 현재 단계·섹션 강조, 지나온 곳 구분, 읽은 만큼 막대
 *   - 이전/다음 링크와 ← → 키
 *   - Overview 의 흐름도 (#flow)
 *   - 단계 풀이(.stepper), 기호 표 연동(.symbols), 스크롤 등장(.reveal)
 *
 * 페이지 HTML 은 <body data-section="3.2"> 로 자기 위치만 밝힌다.
 * 목차를 페이지마다 손으로 쓰지 않는다 — 한 곳이 바뀌면 나머지가 어긋난다.
 */
(function () {
  'use strict';
  var P = window.PAPER;
  if (!P) { console.error('[paper-explainer] sections.js 가 로드되지 않았다'); return; }

  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 데이터 정리 ────────────────────────────────────────
  var secs = P.sections.map(function (s, i) {
    var parts = String(s.id).split('.');
    return Object.assign({}, s, {
      order: i,
      depth: s.depth || parts.length,
      parent: s.parent || (parts.length > 1 ? parts.slice(0, -1).join('.') : null)
    });
  });
  var byId = {};
  secs.forEach(function (s) { byId[s.id] = s; });
  var stageIndex = {};
  P.stages.forEach(function (st, i) { stageIndex[st.id] = i; });

  secs.forEach(function (s) {
    if (!(s.stage in stageIndex)) console.error('[paper-explainer] 섹션 ' + s.id + ' 의 stage "' + s.stage + '" 가 stages 에 없다');
  });

  var here = document.body.dataset.section || 'overview';
  var cur = byId[here] || null;
  if (here !== 'overview' && !cur) console.error('[paper-explainer] data-section="' + here + '" 가 sections 에 없다');
  var curStage = cur ? stageIndex[cur.stage] : -1;

  var ancestors = {};
  for (var a = cur && cur.parent; a; a = byId[a] && byId[a].parent) ancestors[a] = true;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function store(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
  }
  var homeHref = P.home || 'index.html';

  // ── 미니맵 ─────────────────────────────────────────────
  var mm = document.getElementById('minimap');
  var curLink = null;
  if (mm) {
    mm.setAttribute('aria-label', mm.getAttribute('aria-label') || '논문 흐름에서 현재 위치');

    var flow = el('ol', { class: 'mm-flow' });
    P.stages.forEach(function (st, i) {
      var list = secs.filter(function (s) { return s.stage === st.id; });
      var state = curStage < 0 ? '' : i < curStage ? ' is-done' : i === curStage ? ' is-current' : ' is-next';
      var first = list[0];
      var head = el('a', { href: first ? first.file : homeHref }, [
        el('span', { class: 'mm-stage-label', text: st.label }),
        el('span', { class: 'mm-stage-count', text: list.length + '개 섹션' })
      ]);
      var ul = el('ol', { class: 'mm-secs' });
      list.forEach(function (s) {
        var cls = 'mm-sec depth-' + s.depth;
        if (cur && s.id === cur.id) cls += ' is-current';
        else if (ancestors[s.id]) cls += ' is-ancestor';
        else if (cur && s.order < cur.order) cls += ' is-done';
        var link = el('a', { href: s.file }, [el('span', { class: 'mm-num', text: s.id }), s.title]);
        if (cur && s.id === cur.id) { link.setAttribute('aria-current', 'page'); curLink = link; }
        ul.appendChild(el('li', { class: cls }, [link]));
      });
      var li = el('li', { class: 'mm-stage' + state, style: '--i:' + i }, [head, ul]);
      // 현재 단계가 아닌 단계도 머리에 마우스를 올리거나 포커스하면 펼친다
      li.addEventListener('mouseenter', function () { li.classList.add('is-open'); });
      li.addEventListener('mouseleave', function () { li.classList.remove('is-open'); });
      li.addEventListener('focusin', function () { li.classList.add('is-open'); });
      li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) li.classList.remove('is-open'); });
      flow.appendChild(li);
    });

    var home = el('a', { class: 'mm-home', href: homeHref }, [P.short || P.title, el('small', { text: 'Overview 로 돌아가기' })]);

    var pos = cur ? (cur.order + 1) + ' / ' + secs.length : 'Overview';
    var barTitle = cur ? P.stages[curStage].label + ' › ' + cur.id + ' ' + cur.title : (P.short || P.title);
    var bar = el('button', { class: 'mm-bar', type: 'button', 'aria-expanded': 'false' }, [
      el('span', { class: 'mm-bar-pos', text: pos }),
      el('span', { class: 'mm-bar-title', text: barTitle }),
      el('span', { class: 'mm-bar-caret', 'aria-hidden': 'true', text: '▾' }),
      el('span', { class: 'mm-bar-progress', 'aria-hidden': 'true' })
    ]);
    bar.addEventListener('click', function () {
      var open = mm.classList.toggle('is-open');
      bar.setAttribute('aria-expanded', String(open));
    });

    mm.textContent = '';
    mm.appendChild(home);
    mm.appendChild(bar);
    mm.appendChild(el('div', { class: 'mm-panel' }, [flow]));

    // 레일을 현재 단계의 점까지 채운다. 이전 페이지에서 채워 둔 높이에서 출발해
    // 앞으로 왔는지 되돌아왔는지가 움직임으로 보인다.
    var KEY = 'pe:' + (P.citekey || P.title) + ':fill';
    var target = 0;
    if (curStage >= 0) {
      var dot = flow.children[curStage];
      target = dot.offsetTop + 17;
    }
    var from = parseFloat(store(KEY)) || 0;
    if (reduce || curStage < 0) {
      flow.style.setProperty('--fill', target + 'px');
    } else {
      flow.style.transition = 'none';
      flow.style.setProperty('--fill', from + 'px');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          flow.style.transition = '';
          flow.style.setProperty('--fill', target + 'px');
        });
      });
    }
    store(KEY, String(target));

    // 데스크톱에서 현재 섹션이 미니맵 밖에 있으면 보이게 굴린다
    if (curLink && mm.scrollHeight > mm.clientHeight) {
      mm.scrollTop = Math.max(0, curLink.offsetTop - mm.clientHeight / 3);
    }
  }

  // ── 읽은 만큼 막대 ────────────────────────────────────
  var main = document.querySelector('main') || document.body;
  function progress() {
    var r = main.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total));
    if (curLink) curLink.parentNode.style.setProperty('--p', p.toFixed(3));
    if (mm && cur) mm.style.setProperty('--total', ((cur.order + p) / secs.length).toFixed(3));
  }
  if (cur) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; progress(); });
    }, { passive: true });
    window.addEventListener('resize', progress);
    progress();
  }

  // ── 위치 표시줄 (crumb) ──────────────────────────────
  var crumb = document.querySelector('[data-auto="crumb"]');
  if (crumb && cur) {
    crumb.textContent = '';
    crumb.appendChild(el('a', { href: homeHref, text: 'Overview' }));
    crumb.appendChild(document.createTextNode(' › ' + P.stages[curStage].label));
    var chain = [];
    for (var c = cur.parent; c; c = byId[c] && byId[c].parent) if (byId[c]) chain.unshift(byId[c]);
    chain.forEach(function (s) {
      crumb.appendChild(document.createTextNode(' › '));
      crumb.appendChild(el('a', { href: s.file, text: s.id + ' ' + s.title }));
    });
  }

  // ── 이전 / 다음 ──────────────────────────────────────
  var order = [{ id: 'overview', title: 'Overview', file: homeHref }].concat(secs);
  var at = cur ? cur.order + 1 : 0;
  var prev = order[at - 1], next = order[at + 1];
  var pager = document.getElementById('pager');
  if (pager) {
    pager.textContent = '';
    if (prev) pager.appendChild(el('a', { class: 'prev', href: prev.file, rel: 'prev' }, [
      el('small', {}, [el('kbd', { text: '←' }), ' 이전']), (prev.id === 'overview' ? '' : prev.id + ' ') + prev.title]));
    if (next) pager.appendChild(el('a', { class: 'next', href: next.file, rel: 'next' }, [
      el('small', {}, ['다음 ', el('kbd', { text: '→' })]), next.id + ' ' + next.title]));
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'ArrowLeft' && prev) location.href = prev.file;
    if (e.key === 'ArrowRight' && next) location.href = next.file;
  });

  // ── Overview 흐름도 ──────────────────────────────────
  var flowBox = document.getElementById('flow');
  if (flowBox) {
    flowBox.classList.add('flow');
    flowBox.textContent = '';
    P.stages.forEach(function (st, i) {
      var ul = el('ul');
      secs.filter(function (s) { return s.stage === st.id; }).forEach(function (s) {
        ul.appendChild(el('li', { class: 'depth-' + s.depth }, [el('a', { href: s.file, text: s.id + ' ' + s.title })]));
      });
      flowBox.appendChild(el('li', { class: 'flow-stage', style: '--i:' + i }, [
        el('h3', { text: st.label }),
        st.summary ? el('p', { text: st.summary }) : null,
        ul
      ]));
    });
    // 카드가 여러 줄로 접히면 줄 끝 카드의 화살표는 아무것도 가리키지 않는다 — 숨긴다
    var markRowEnds = function () {
      var items = Array.prototype.slice.call(flowBox.children);
      var cols = items.filter(function (n) { return n.offsetTop === items[0].offsetTop; }).length;
      items.forEach(function (n, i) {
        var nx = items[i + 1];
        n.classList.toggle('row-end', cols > 1 && !!nx && nx.offsetTop > n.offsetTop);
      });
    };
    markRowEnds();
    window.addEventListener('resize', markRowEnds);
  }

  // ── 단계 풀이 ────────────────────────────────────────
  // <figure class="stepper"> 안의 .step-view 에 data-step="n" 요소를 두고,
  // .step-notes 의 n 번째 <li> 에 그 단계 설명을 쓴다. data-step-only 는 그 단계에만 보인다.
  document.querySelectorAll('.stepper').forEach(function (box) {
    var view = box.querySelector('.step-view');
    var notes = box.querySelectorAll('.step-notes > li');
    var parts = view ? view.querySelectorAll('[data-step]') : [];
    var n = notes.length;
    parts.forEach(function (p) { n = Math.max(n, parseInt(p.dataset.step, 10) || 0); });
    if (!n) return;
    var k = 1;
    var bPrev = el('button', { type: 'button', text: '이전' });
    var bNext = el('button', { type: 'button', text: '다음' });
    var bReset = el('button', { type: 'button', text: '처음부터' });
    var dots = el('span', { class: 'step-dots', 'aria-hidden': 'true' });
    for (var d = 0; d < n; d++) dots.appendChild(el('span'));
    var posTxt = el('span', { class: 'step-pos', 'aria-live': 'polite' });
    box.appendChild(el('div', { class: 'step-ctl' }, [bPrev, bNext, bReset, dots, posTxt]));
    box.tabIndex = 0;

    function render() {
      parts.forEach(function (p) {
        var s = parseInt(p.dataset.step, 10);
        var only = p.hasAttribute('data-step-only');
        p.classList.toggle('is-future', s > k || (only && s < k));
        p.classList.toggle('is-past', !only && s < k);
        p.classList.toggle('is-active', s === k);
      });
      notes.forEach(function (li, i) { li.classList.toggle('is-active', i === k - 1); });
      Array.prototype.forEach.call(dots.children, function (dt, i) { dt.classList.toggle('on', i < k); });
      posTxt.textContent = k + ' / ' + n;
      bPrev.disabled = k === 1;
      bNext.disabled = k === n;
    }
    function go(to) { k = Math.min(n, Math.max(1, to)); render(); }
    bPrev.addEventListener('click', function () { go(k - 1); });
    bNext.addEventListener('click', function () { go(k + 1); });
    bReset.addEventListener('click', function () { go(1); });
    // 단계 풀이에 포커스가 있으면 ← → 는 페이지 대신 단계를 넘긴다
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(k + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(k - 1); e.preventDefault(); }
    });
    render();
  });

  // ── 기호 표 연동 ─────────────────────────────────────
  // <dl class="symbols"> 의 dt/dd 와 본문의 [data-sym="q"] 가 서로를 밝힌다.
  document.querySelectorAll('[data-sym]').forEach(function (n) {
    var key = n.dataset.sym;
    function set(on) {
      document.querySelectorAll('[data-sym="' + key + '"]').forEach(function (m) {
        m.classList.toggle('is-hot', on);
        if (m.tagName === 'DT' && m.nextElementSibling) m.nextElementSibling.classList.toggle('is-hot', on);
      });
    }
    n.addEventListener('mouseenter', function () { set(true); });
    n.addEventListener('mouseleave', function () { set(false); });
  });

  // ── 스크롤 등장 ──────────────────────────────────────
  var rv = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (n) { n.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (n) { io.observe(n); });
  }

  // ── 수식 (KaTeX, MathML 출력) ────────────────────────
  // KaTeX 스크립트가 있으면 $...$ / $$...$$ 를 MathML 로 바꾼다. CSS·폰트가 필요 없다.
  function math() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(main, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      output: 'mathml',
      throwOnError: false
    });
  }
  if (window.renderMathInElement) math();
  else window.addEventListener('load', math);
})();
