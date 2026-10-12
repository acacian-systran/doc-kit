(function () {
  var root = document.documentElement;
  var page = document.body.dataset.page;
  var P = (document.body.dataset.store || "reader") + "-";  // localStorage prefix, one per book
  var ed = document.body.dataset.edition && document.body.dataset.edition !== "en" ? "-" + document.body.dataset.edition : "";
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---- reading settings ----
  var prefs = store.get(P + "prefs", {});
  var themes = [null, "light", "sepia", "dark"];
  var widths = [68, 80, 58];
  function applyPrefs() {
    if (prefs.theme) root.dataset.theme = prefs.theme; else delete root.dataset.theme;
    if (prefs.size) root.style.setProperty("--fs", prefs.size + "px");
    if (prefs.width) root.style.setProperty("--measure", prefs.width + "ch");
    if (prefs.ko === false) root.dataset.ko = "off"; else delete root.dataset.ko;
    document.querySelectorAll(".ko-label").forEach(function (el) { el.textContent = prefs.ko === false ? "KO off" : "KO on"; });
    document.querySelectorAll(".theme-label").forEach(function (el) {
      el.textContent = prefs.theme ? prefs.theme[0].toUpperCase() + prefs.theme.slice(1) : "Auto";
    });
    store.set(P + "prefs", prefs);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.dataset.act;
    var cur = prefs.size || parseFloat(getComputedStyle(root).getPropertyValue("--fs")) || 19;
    if (act === "smaller") prefs.size = Math.max(14, cur - 1);
    if (act === "bigger") prefs.size = Math.min(26, cur + 1);
    if (act === "width") prefs.width = widths[(widths.indexOf(prefs.width || 68) + 1) % widths.length];
    if (act === "ko") prefs.ko = prefs.ko === false;
    if (act === "theme") prefs.theme = themes[(themes.indexOf(prefs.theme || null) + 1) % themes.length];
    applyPrefs();
  });
  applyPrefs();

  // ---- home: resume link and per-chapter progress ----
  var progress = store.get(P + "progress" + ed, {});
  if (document.body.classList.contains("home")) {
    document.querySelectorAll(".contents a").forEach(function (a) {
      var p = progress[a.dataset.page];
      if (p) a.querySelector(".done").style.setProperty("--p", Math.round(p.max * 100) + "%");
    });
    var last = store.get(P + "last" + ed, null);
    var link = document.getElementById("resume");
    if (last && link) {
      var t = document.querySelector('.contents a[data-page="' + last + '"] .t');
      link.href = last;
      link.textContent = "Continue reading — " + (t ? t.firstChild.textContent : last);
      link.hidden = false;
    }
    return;
  }

  // ---- mark read chapters in sidebar ----
  document.querySelectorAll(".chapters a").forEach(function (a) {
    var p = progress[a.getAttribute("href")];
    if (p && p.max > 0.9) a.parentNode.classList.add("read");
  });

  // ---- mobile menu ----
  var menu = document.querySelector(".menu");
  if (menu) menu.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".side a").forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
  });

  // ---- tables scroll sideways on small screens ----
  document.querySelectorAll("article table").forEach(function (t) {
    var w = document.createElement("div");
    w.className = "table-wrap";
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });

  // ---- code block tools: copy + wrap ----
  document.querySelectorAll("article pre").forEach(function (pre) {
    var tools = document.createElement("div");
    tools.className = "tools";
    var wrap = document.createElement("button");
    wrap.textContent = "Wrap";
    wrap.onclick = function () { pre.classList.toggle("wrap"); };
    var copy = document.createElement("button");
    copy.textContent = "Copy";
    copy.onclick = function () {
      navigator.clipboard.writeText(pre.querySelector("code").innerText).then(function () {
        copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy"; }, 1200);
      });
    };
    tools.appendChild(wrap); tools.appendChild(copy);
    pre.appendChild(tools);
  });

  // ---- footnote popovers ----
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  document.querySelectorAll(".footnote-ref a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var note = document.querySelector(a.getAttribute("href"));
      if (!note) return;
      e.preventDefault();
      e.stopPropagation();
      closePop();
      pop = document.createElement("div");
      pop.className = "fn-pop";
      pop.innerHTML = note.innerHTML;
      document.body.appendChild(pop);
      var r = a.getBoundingClientRect();
      var left = Math.min(r.left + window.scrollX - 20, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 16);
      pop.style.left = Math.max(16, left) + "px";
      pop.style.top = r.bottom + window.scrollY + 8 + "px";
    });
  });
  document.addEventListener("click", function (e) { if (pop && !pop.contains(e.target)) closePop(); });

  // ---- progress bar, scroll memory, toc highlight ----
  var bar = document.getElementById("progress");
  var heads = Array.prototype.slice.call(document.querySelectorAll("article h2[id], article h3[id]"));
  var tocLinks = {};
  document.querySelectorAll(".toc a").forEach(function (a) { tocLinks[a.getAttribute("href").slice(1)] = a; });
  var activeId = null;
  var saveTimer = null;
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var frac = max > 0 ? Math.min(1, scrollY / max) : 1;
    bar.style.width = frac * 100 + "%";
    var id = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top < 120) id = heads[i].id; else break;
    }
    if (id !== activeId) {
      if (activeId && tocLinks[activeId]) tocLinks[activeId].classList.remove("active");
      if (id && tocLinks[id]) {
        tocLinks[id].classList.add("active");
        var side = document.getElementById("side");
        var lr = tocLinks[id].getBoundingClientRect();
        if (lr.top < 80 || lr.bottom > innerHeight - 20) tocLinks[id].scrollIntoView({ block: "center" });
        void side;
      }
      activeId = id;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var p = progress[page] || { max: 0 };
      p.y = scrollY; p.max = Math.max(p.max, frac);
      progress[page] = p;
      store.set(P + "progress" + ed, progress);
      store.set(P + "last" + ed, page);
    }, 250);
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  // restore position unless arriving at an anchor
  var saved = progress[page];
  if (!location.hash && saved && saved.y > 200) {
    addEventListener("load", function () { scrollTo(0, saved.y); onScroll(); });
  }
  onScroll();
  store.set(P + "last" + ed, page);

  // ---- keyboard: ← → for chapters, [ ] too ----
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
    var a = null;
    if (e.key === "ArrowLeft" || e.key === "[") a = document.querySelector(".pager .prev");
    if (e.key === "ArrowRight" || e.key === "]") a = document.querySelector(".pager .next");
    if ((e.key === "k" || e.key === "K") && document.querySelector('[data-act="ko"]')) {
      // keep the paragraph you're reading in place while Korean appears or disappears
      var anchor = document.elementFromPoint(innerWidth / 2, innerHeight / 3);
      var before = anchor && anchor.getBoundingClientRect().top;
      prefs.ko = prefs.ko === false; applyPrefs();
      if (anchor && anchor.isConnected && anchor.offsetParent) scrollBy(0, anchor.getBoundingClientRect().top - before);
    }
    if (e.key === "Escape") { closePop(); document.body.classList.remove("nav-open"); }
    if (a) location.href = a.href;
  });
})();
