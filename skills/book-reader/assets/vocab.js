// Word saver: select text in the book → save it with its sentence → export for Quizlet / Anki,
// or hand the picks to the reading-vocab skill, which writes their in-text meaning into its decks.
(function () {
  var data = document.body.dataset;
  var KEY = (data.store || "reader") + "-words";
  var FILE = data.book || data.store || "book";   // exported file names start with the book key
  var article = document.querySelector("article");
  var words = load();

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(words)); } catch (e) { toast("Couldn't save — browser storage is blocked"); } updateCount(); }
  function find(term) { var k = term.toLowerCase(); for (var i = 0; i < words.length; i++) if (words[i].term.toLowerCase() === k) return words[i]; return null; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  // ---------- context of a selection ----------
  function blockText(block) {
    var c = block.cloneNode(true);
    c.querySelectorAll("ul, ol, .ko-h, sup, .footnote-ref, .katex-mathml, .tools").forEach(function (n) { n.remove(); });
    return clean(c.textContent);
  }
  function sentenceAround(text, term) {
    var i = text.toLowerCase().indexOf(term.toLowerCase());
    if (i < 0) return text.slice(0, 300);
    var start = 0, end = text.length, m, re = /[.!?。](?=\s|$)/g;
    while ((m = re.exec(text))) {
      if (m.index < i) start = m.index + 1;
      else if (m.index >= i + term.length) { end = m.index + 1; break; }
    }
    return clean(text.slice(start, end));
  }
  function koreanTwin(block) {
    if (block.matches("li")) {
      var tr = block.querySelector(":scope > .tr");
      return tr ? clean(tr.textContent) : "";
    }
    var n = block.nextElementSibling;
    return n && n.classList.contains("ko") && n.tagName === "P" ? blockText(n) : "";
  }
  // the Korean twin sentence: same position when both paragraphs have the same number of sentences
  function koreanSentence(text, term, ko) {
    if (!ko) return "";
    var split = function (t) { return t.split(/(?<=[.!?。])\s+/).filter(Boolean); };
    var en = split(text), kr = split(ko), i = -1, lc = term.toLowerCase();
    for (var j = 0; j < en.length; j++) if (en[j].toLowerCase().indexOf(lc) >= 0) { i = j; break; }
    if (i >= 0 && en.length === kr.length) return kr[i];
    return ko.length > 220 ? ko.slice(0, 220) + "…" : ko;
  }
  function sectionOf(node) {
    var heads = article.querySelectorAll("h2[id], h3[id]"), sec = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) sec = heads[i]; else break;
    }
    if (!sec) return { id: "", title: "" };
    var c = sec.cloneNode(true); c.querySelectorAll("small").forEach(function (n) { n.remove(); });
    return { id: sec.id, title: clean(c.textContent) };
  }
  function chapterLabel() {
    var k = document.querySelector(".kicker"), h = document.querySelector("article h1");
    return (k ? k.textContent.split("·")[0].trim() + " — " : "") + (h ? h.textContent : "");
  }

  // ---------- selection popup ----------
  var pop = el("div", "vocab-pop");
  pop.hidden = true;
  pop.innerHTML =
    '<div class="vp-term"></div>' +
    '<input class="vp-meaning" type="text" placeholder="Meaning (optional) — Enter to save" aria-label="Meaning">' +
    '<div class="vp-row"><span class="vp-hint"></span><button class="vp-save">Save word</button></div>';
  document.body.appendChild(pop);
  var current = null;

  function showPop(range, term) {
    var block = range.startContainer.parentElement.closest("p, li, td, th, figcaption, h1, h2, h3, h4, aside, pre, blockquote") || article;
    var existing = find(term);
    current = { term: term, block: block, node: range.startContainer };
    pop.querySelector(".vp-term").textContent = term;
    pop.querySelector(".vp-meaning").value = existing ? existing.meaning || "" : "";
    pop.querySelector(".vp-hint").textContent = existing ? "Already saved — update it" : "";
    pop.querySelector(".vp-save").textContent = existing ? "Update" : "Save word";
    pop.hidden = false;
    var r = range.getBoundingClientRect();
    var w = pop.offsetWidth, vw = document.documentElement.clientWidth;
    pop.style.left = Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - w / 2)) + scrollX + "px";
    var below = r.bottom + 10, above = r.top - pop.offsetHeight - 10;
    pop.style.top = (above > 60 ? above : below) + scrollY + "px";
  }
  function hidePop() { pop.hidden = true; current = null; }

  function saveCurrent() {
    if (!current) return;
    var term = current.term;
    var block = current.block;
    var text = blockText(block);
    var sec = sectionOf(current.node);
    var meaning = clean(pop.querySelector(".vp-meaning").value);
    var w = find(term);
    if (w) {
      if (meaning) w.meaning = meaning;
    } else {
      w = {
        term: term,
        meaning: meaning,
        sentence: sentenceAround(text, term),
        ko: koreanSentence(text, term, koreanTwin(block)),
        chapter: chapterLabel(),
        section: sec.title,
        unit: data.page.replace(/\.html$/, ""),
        href: "../" + data.dir + "/" + data.page + (sec.id ? "#" + sec.id : ""),
        added: new Date().toISOString().slice(0, 10),
      };
      words.unshift(w);
    }
    save();
    hidePop();
    var s = getSelection(); if (s) s.removeAllRanges();
    highlight();
    toast("Saved “" + term + "” · " + words.length + " words");
  }

  pop.querySelector(".vp-save").addEventListener("click", saveCurrent);
  pop.querySelector(".vp-meaning").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); saveCurrent(); }
    if (e.key === "Escape") hidePop();
    e.stopPropagation();
  });

  function checkSelection() {
    if (!article) return;
    var s = getSelection();
    if (!s || s.isCollapsed || !s.rangeCount) return;
    var range = s.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) return;
    var term = clean(s.toString()).replace(/^[\s"'“‘(\[]+|[\s"'”’)\].,;:!?]+$/g, "");
    if (!term || term.length > 80 || term.split(" ").length > 8) return;
    showPop(range, term);
  }
  document.addEventListener("mouseup", function (e) {
    if (pop.contains(e.target)) return;
    setTimeout(function () {
      var s = getSelection();
      if (!s || s.isCollapsed) { if (!pop.contains(document.activeElement)) hidePop(); return; }
      checkSelection();
    }, 10);
  });
  // touch screens: selection handles don't fire mouseup reliably
  var selTimer;
  document.addEventListener("selectionchange", function () {
    if (!matchMedia("(hover: none)").matches) return;
    clearTimeout(selTimer);
    selTimer = setTimeout(checkSelection, 500);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { hidePop(); closeDrawer(); }
    if (/input|textarea/i.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === "s" || e.key === "S") && !pop.hidden) { e.preventDefault(); saveCurrent(); }
    if (e.key === "w" || e.key === "W") toggleDrawer();
  });

  // ---------- mark saved words in the text ----------
  function highlight() {
    if (!article) return;
    article.querySelectorAll("mark.vocab").forEach(function (m) { m.replaceWith(document.createTextNode(m.textContent)); });
    article.normalize();
    var terms = words.map(function (w) { return w.term; }).filter(function (t) { return t.length > 1; });
    if (!terms.length) return;
    terms.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp("(^|[^\\w])(" + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")(?![\\w])", "gi");
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentElement.closest("pre, code, .katex, mark, .ko, .ko-h, a, figcaption, h1") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue, last = 0, m, frag = null;
      re.lastIndex = 0;
      while ((m = re.exec(t))) {
        frag = frag || document.createDocumentFragment();
        var start = m.index + m[1].length;
        frag.appendChild(document.createTextNode(t.slice(last, start)));
        var mk = el("mark", "vocab", m[2]);
        var w = find(m[2]);
        if (w && w.meaning) mk.title = w.meaning;
        frag.appendChild(mk);
        last = start + m[2].length;
      }
      if (frag) { frag.appendChild(document.createTextNode(t.slice(last))); n.replaceWith(frag); }
    });
  }

  // ---------- word list drawer ----------
  var drawer = el("aside", "vocab-drawer");
  drawer.setAttribute("aria-label", "Saved words");
  drawer.hidden = true;
  drawer.innerHTML =
    '<header><h2>Saved words <span class="vd-count"></span></h2><button class="vd-close" aria-label="Close">✕</button></header>' +
    '<div class="vd-export">' +
    '  <label><input type="checkbox" class="vd-sent" checked> Add example sentence to definition</label>' +
    '  <div class="vd-btns">' +
    '    <button data-x="quizlet" class="primary">Copy for Quizlet</button>' +
    '    <button data-x="txt">Download .txt</button>' +
    '    <button data-x="csv">Anki .csv</button>' +
    '    <button data-x="picked" title="Claude fills in the meaning the book uses and adds them to its decks">For reading-vocab</button>' +
    '  </div>' +
    '  <details><summary>How to import into Quizlet</summary><ol>' +
    '    <li>Quizlet → Create → Flashcard set → <b>Import</b>.</li>' +
    '    <li>Paste. Between term and definition: <b>Tab</b>. Between cards: <b>New line</b>.</li>' +
    '    <li>Words without a meaning get the example sentence as the definition, so you can fill it in on Quizlet.</li>' +
    '  </ol></details>' +
    '  <details><summary>How to use “For reading-vocab”</summary><ol>' +
    '    <li>Download the .csv and give it to Claude: “이 단어들 reading-vocab 덱에 넣어줘”.</li>' +
    '    <li>Claude writes the meaning each word has in this book, adds the cards to that chapter’s deck and marks them as hard words.</li>' +
    '  </ol></details>' +
    '</div>' +
    '<ol class="vd-list"></ol>' +
    '<footer><button data-x="backup">Backup .json</button><button data-x="restore">Restore</button><button data-x="clear" class="danger">Clear all</button>' +
    '<input type="file" accept=".json,application/json" hidden class="vd-file"></footer>';
  document.body.appendChild(drawer);

  function renderList() {
    var ol = drawer.querySelector(".vd-list");
    ol.innerHTML = "";
    drawer.querySelector(".vd-count").textContent = words.length ? "(" + words.length + ")" : "";
    if (!words.length) {
      ol.appendChild(el("li", "vd-empty", "Nothing yet. Drag over a word or phrase in the book, then press Save."));
      return;
    }
    words.forEach(function (w, i) {
      var li = el("li");
      var top = el("div", "vd-top");
      top.appendChild(el("b", "vd-term", w.term));
      var del = el("button", "vd-del", "Delete");
      del.onclick = function () { words.splice(i, 1); save(); renderList(); highlight(); };
      top.appendChild(del);
      li.appendChild(top);
      var inp = el("input", "vd-meaning");
      inp.placeholder = "Add a meaning…";
      inp.value = w.meaning || "";
      inp.onchange = function () { w.meaning = clean(inp.value); save(); highlight(); };
      inp.onkeydown = function (e) { e.stopPropagation(); if (e.key === "Enter") inp.blur(); };
      li.appendChild(inp);
      if (w.sentence) li.appendChild(el("p", "vd-sent", w.sentence));
      if (w.ko) li.appendChild(el("p", "vd-ko", w.ko));
      var src = el("a", "vd-src", (w.chapter || "") + (w.section ? " · " + w.section : ""));
      src.href = w.href || "#";
      li.appendChild(src);
      ol.appendChild(li);
    });
  }

  function definition(w, withSentence) {
    var d = w.meaning || "";
    if (withSentence && w.sentence) d = d ? d + " — e.g. " + w.sentence : w.sentence;
    return clean(d.replace(/\t/g, " "));
  }
  function quizletText() {
    var ws = drawer.querySelector(".vd-sent").checked;
    return words.slice().reverse().map(function (w) { return clean(w.term) + "\t" + definition(w, ws); }).join("\n");
  }
  function csv() {
    var q = function (s) { return '"' + String(s || "").replace(/"/g, '""') + '"'; };
    return words.slice().reverse().map(function (w) {
      return [w.term, w.meaning, w.sentence, w.ko, w.chapter + (w.section ? " · " + w.section : "")].map(q).join(",");
    }).join("\n");
  }
  // reading-vocab "picked" input: one row per word, anchor in its "chNN §Section" form
  function pickedCsv() {
    var q = function (s) { s = String(s || ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var rows = words.slice().reverse().map(function (w) {
      var unit = w.unit || (w.href || "").replace(/^.*\//, "").replace(/\.html.*$/, "");
      return [FILE, w.term, w.meaning, w.sentence, w.ko, unit + (w.section ? " §" + w.section : ""), w.added].map(q).join(",");
    });
    return ["book,term,meaning,sentence,ko,anchor,added"].concat(rows).join("\n") + "\n";
  }
  function download(name, text, type) {
    var a = el("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  var stamp = function () { return new Date().toISOString().slice(0, 10); };

  drawer.addEventListener("click", function (e) {
    var b = e.target.closest("[data-x]");
    if (!b) return;
    var x = b.dataset.x;
    if (x !== "restore" && x !== "clear" && !words.length) return toast("No words saved yet");
    if (x === "quizlet") {
      var t = quizletText();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
        function () { toast("Copied " + words.length + " cards — paste into Quizlet → Import"); },
        function () { download(FILE + "-words-quizlet-" + stamp() + ".txt", t, "text/plain"); toast("Clipboard blocked — downloaded a .txt instead"); });
    }
    if (x === "txt") download(FILE + "-words-quizlet-" + stamp() + ".txt", quizletText(), "text/plain");
    if (x === "csv") download(FILE + "-words-anki-" + stamp() + ".csv", "﻿" + csv(), "text/csv");
    if (x === "picked") download(FILE + "-picked-" + stamp() + ".csv", pickedCsv(), "text/csv");
    if (x === "backup") download(FILE + "-words-backup-" + stamp() + ".json", JSON.stringify(words, null, 2), "application/json");
    if (x === "restore") drawer.querySelector(".vd-file").click();
    if (x === "clear" && confirm("Delete all " + words.length + " saved words? Download a backup first if you might want them back.")) {
      words = []; save(); renderList(); highlight();
    }
  });
  drawer.querySelector(".vd-file").addEventListener("change", function (e) {
    var f = e.target.files[0];
    if (!f) return;
    f.text().then(function (txt) {
      var incoming = JSON.parse(txt), added = 0;
      if (!Array.isArray(incoming)) throw new Error("not a list");
      incoming.forEach(function (w) { if (w && w.term && !find(w.term)) { words.push(w); added++; } });
      save(); renderList(); highlight();
      toast("Restored " + added + " words");
    }).catch(function () { toast("That file isn't a word backup"); });
    e.target.value = "";
  });
  drawer.querySelector(".vd-close").onclick = closeDrawer;

  function openDrawer() { renderList(); drawer.hidden = false; document.body.classList.add("vocab-open"); }
  function closeDrawer() { drawer.hidden = true; document.body.classList.remove("vocab-open"); }
  function toggleDrawer() { drawer.hidden ? openDrawer() : closeDrawer(); }
  document.addEventListener("click", function (e) { if (e.target.closest('[data-act="words"]')) toggleDrawer(); });

  function updateCount() {
    document.querySelectorAll(".words-count").forEach(function (n) { n.textContent = words.length || ""; });
  }

  var toastEl = el("div", "vocab-toast");
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  // another tab saved a word
  addEventListener("storage", function (e) { if (e.key === KEY) { words = load(); updateCount(); highlight(); if (!drawer.hidden) renderList(); } });

  updateCount();
  highlight();
})();
