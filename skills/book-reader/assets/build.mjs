// Build static web readers from a book kept as one Markdown file per chapter (O'Reilly clippings, Obsidian notes).
// Everything that differs between books lives in book.json — see ../SKILL.md §2.
// Usage: node build.mjs <book.json> [edition]   — no edition builds them all
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import hljs from "highlight.js";
import katex from "katex";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CONFIG = process.argv[2];
if (!CONFIG || !CONFIG.endsWith(".json")) {
  console.error("usage: node build.mjs <book.json> [edition]");
  process.exit(2);
}
const CONF_DIR = path.dirname(path.resolve(CONFIG));
const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
// paths in book.json: "~/…" is the home directory, anything else is relative to book.json
const resolve = (p) => (p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : path.resolve(CONF_DIR, p));
const EDITIONS = Object.fromEntries(Object.entries(cfg.editions).map(([k, e]) =>
  [k, { ...e, src: resolve(e.src), out: resolve(e.out), bilingual: !!e.bilingual }]));
const BOOK = cfg.title;
const AUTHORS = cfg.authors || "";
const KEY = cfg.key;                         // papers/<key> — names exported word files, so reading-vocab knows the book
const STORE = cfg.store || KEY;              // localStorage prefix; keep it fixed or saved words and progress are lost
const FRONT = cfg.front || "Preface";        // label of chapter 0
const SRC_URL = cfg.sourceUrl || "";         // links into the online edition (…/chNN.html, …/preface…) become local pages
const CHAPTER_RE = new RegExp(cfg.chapterFiles || "^(\\d+)\\..*\\.md$");
const TEX_FIXES = (cfg.texFixes || []).map(([re, to]) => [new RegExp(re, "g"), to]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const chPage = (c) => (c === "P" || c === "p" ? "ch00.html" : `ch${pad(+c)}.html`);
// a block is Korean when Hangul makes up a fair share of its letters (Korean prose keeps English terms inline)
const isKo = (s) => {
  const h = (s.match(/[가-힣]/g) || []).length;
  const l = (s.match(/[A-Za-z]/g) || []).length;
  return h >= 2 && h >= 0.15 * (h + l);
};

// ---------- math: pull it out before markdown sees it ----------
function protectMath(src, store) {
  // keep fenced code untouched
  return src.split(/(^```[\s\S]*?^```)/m).map((part, i) => {
    if (i % 2 === 1) return part;
    part = part.replace(/^\$\$\s*\n([\s\S]+?)\n\s*\$\$\s*$/gm, (_, tex) => {
      // per-book repairs of clipped TeX (book.json "texFixes")
      for (const [re, to] of TEX_FIXES) tex = tex.replace(re, to);
      if (tex.includes("\\\\")) tex = `\\begin{gathered}${tex}\\end{gathered}`;
      store.push(katex.renderToString(tex, { displayMode: true, throwOnError: false }));
      return `\n\nMATHBLOCK${store.length - 1}X\n\n`;
    });
    // inline: $x$ — opening not followed by space/digit, closing not preceded by space nor followed by a digit
    part = part.replace(/(`[^`\n]*`)|\$(?![\s\d$])([^$\n]+?)(?<!\s)\$(?!\d)/g, (m, code, tex) => {
      if (code) return code;
      store.push(katex.renderToString(tex, { throwOnError: false }));
      return `MATHINLINE${store.length - 1}X`;
    });
    return part;
  }).join("");
}

// ---------- markdown ----------
function makeMd(bilingual) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    highlight(code, lang) {
      try {
        if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
        const r = hljs.highlightAuto(code, ["python", "json", "bash", "yaml", "sql", "javascript", "typescript"]);
        if (r.relevance >= 10) return r.value;
      } catch {}
      return esc(code);
    },
  }).use(footnote);

  // Obsidian callouts: > [!summary] Title — in a bilingual edition they hold the translator's notes
  {
    md.core.ruler.push("callouts", (state) => {
      const t = state.tokens;
      const stack = [];
      for (let i = 0; i < t.length; i++) {
        if (t[i].type === "blockquote_open") {
          const inl = t[i + 2];
          const m = t[i + 1]?.type === "paragraph_open" && inl?.content.match(/^\[!(\w+)\][+-]?\s*(.*)/);
          if (!m) { stack.push(null); continue; }
          const [, type, title] = [m[0], m[1].toLowerCase(), m[2].split("\n")[0]];
          const brk = inl.children.findIndex((c) => c.type === "softbreak");
          if (brk >= 0) inl.children = inl.children.slice(brk + 1);
          else { inl.children = []; t[i + 1].hidden = t[i + 3].hidden = true; }
          const open = new state.Token("html_block", "", 0);
          open.content = `<aside class="callout c-${type}${bilingual ? ' ko" lang="ko' : ""}"><p class="callout-title">${esc(title || type)}</p>\n`;
          t[i] = open;
          stack.push(type);
        } else if (t[i].type === "blockquote_close") {
          if (stack.pop()) {
            const close = new state.Token("html_block", "", 0);
            close.content = "</aside>\n";
            t[i] = close;
          }
        } else if (t[i].type === "inline" && stack.some(Boolean)) {
          // Obsidian keeps single line breaks inside callouts
          for (const c of t[i].children) if (c.type === "softbreak") c.type = "hardbreak";
        }
      }
    });
  }

  if (bilingual) {
    // "## Heading" followed by "**한국어 제목**" → one heading carrying both
    md.core.ruler.push("heading_ko", (state) => {
      const t = state.tokens;
      for (let i = 0; i < t.length - 5; i++) {
        if (t[i].type !== "heading_open" || t[i + 3].type !== "paragraph_open") continue;
        const m = t[i + 4].content.match(/^\*\*([^*]+)\*\*$/);
        if (!m || !isKo(m[1])) continue;
        const small = new state.Token("html_inline", "", 0);
        small.content = `<small class="ko-h" lang="ko">${esc(m[1])}</small>`;
        t[i + 1].children.push(small);
        t.splice(i + 3, 3);
      }
    });

    // tag Korean blocks so they can be styled and hidden
    md.core.ruler.push("ko_blocks", (state) => {
      const t = state.tokens;
      const stack = [];
      const inlineAfter = (i) => { for (let j = i + 1; j < t.length && j < i + 4; j++) if (t[j].type === "inline") return t[j].content; return ""; };
      for (let i = 0; i < t.length; i++) {
        const tok = t[i];
        if (tok.type === "paragraph_open" && !tok.hidden && isKo(t[i + 1].content)) {
          tok.attrJoin("class", "ko"); tok.attrSet("lang", "ko");
        }
        if (tok.type === "list_item_open" && isKo(inlineAfter(i))) {
          tok.attrJoin("class", "ko"); tok.attrSet("lang", "ko");
        }
        if ((tok.type === "bullet_list_open" || tok.type === "ordered_list_open") && stack.at(-1) === "list_item_open") {
          // a nested list whose items are all Korean is the translation of its parent item
          let all = true, j = i + 1, depth = 0;
          for (; j < t.length; j++) {
            if (t[j].type === tok.type.replace("_open", "_close") && depth === 0) break;
            if (t[j].nesting === 1) depth++;
            if (t[j].nesting === -1) depth--;
            if (t[j].type === "list_item_open" && depth === 1 && !isKo(inlineAfter(j))) all = false;
          }
          if (all) tok.attrJoin("class", "tr");
        }
        if (tok.type === "table_open") {
          let txt = "";
          for (let j = i + 1; j < t.length && t[j].type !== "table_close"; j++) if (t[j].type === "inline") txt += t[j].content + " ";
          if (isKo(txt)) { tok.attrJoin("class", "ko"); tok.attrSet("lang", "ko"); }
        }
        if (tok.nesting === 1) stack.push(tok.type);
        if (tok.nesting === -1) stack.pop();
      }
    });
  }

  // headings get ids
  md.core.ruler.push("heading_ids", (state) => {
    const seen = {};
    const t = state.tokens;
    for (let i = 0; i < t.length; i++) {
      if (t[i].type !== "heading_open") continue;
      let id = slug(t[i + 1].content) || "section";
      seen[id] = (seen[id] || 0) + 1;
      if (seen[id] > 1) id += "-" + seen[id];
      t[i].attrSet("id", id);
    }
  });

  // a paragraph holding only an image becomes a numbered <figure>; the duplicate caption paragraph after it is dropped
  md.core.ruler.push("figures", (state) => {
    const t = state.tokens;
    const ch = state.env.chapter;
    let n = 0;
    for (let i = 0; i < t.length - 2; i++) {
      if (t[i].type !== "paragraph_open") continue;
      const inl = t[i + 1];
      const kids = (inl.children || []).filter((c) => !(c.type === "text" && !c.content.trim()) && c.type !== "softbreak");
      if (kids.length !== 1 || kids[0].type !== "image") continue;
      n++;
      const img = kids[0];
      const alt = img.children.map((c) => c.content).join("");
      const label = ch === 0 ? `Figure P-${n}` : `Figure ${ch}-${n}`;
      if (t[i + 3]?.type === "paragraph_open" && t[i + 4]?.content.trim() === alt.trim()) t.splice(i + 3, 3);
      const tok = new state.Token("html_block", "", 0);
      tok.content =
        `<figure id="${slug(label)}"><a href="${esc(img.attrGet("src"))}" target="_blank" rel="noopener" class="zoom">` +
        `<img src="${esc(img.attrGet("src"))}" alt="${esc(alt)}" loading="lazy"></a>` +
        `<figcaption><b>${label}.</b> ${esc(alt)}</figcaption></figure>\n`;
      t.splice(i, 3, tok);
    }
  });

  // links: map links into the online edition to local pages, open the rest in a new tab
  const pageFor = (name) => {
    const m = name.match(/^ch(\d+)\.html$/);
    if (m) return chPage(m[1]);
    if (/^preface/.test(name)) return "ch00.html";
    return null;
  };
  const defaultLink = md.renderer.rules.link_open || ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    const tok = tokens[idx];
    const href = tok.attrGet("href") || "";
    const local = SRC_URL && href.startsWith(SRC_URL) && pageFor(href.slice(SRC_URL.length).split("#")[0]);
    if (local) {
      const hash = href.split("#")[1];
      tok.attrSet("href", local + (hash ? "#" + hash : ""));
    } else if (/^https?:/.test(href)) {
      tok.attrSet("target", "_blank");
      tok.attrSet("rel", "noopener");
    }
    return defaultLink(tokens, idx, opts, env, self);
  };
  return md;
}

// "Figure 3-1" / "그림 3-1", "Table 5-1" / "표 5-1", and “Section Title” references
function resolveXref(text, page, here) {
  const at = (p, id) => `${p === here ? "" : p}#${id}`;
  let m = text.match(/^(?:Figure|그림)\s*(P|\d+)-(\d+)$/);
  if (m) return at(chPage(m[1]), `figure-${m[1].toLowerCase()}-${m[2]}`);
  m = text.match(/^(?:Table|표)\s*(P|\d+)-(\d+)$/);
  if (m) return at(chPage(m[1]), `table-${m[1].toLowerCase()}-${m[2]}`);
  m = text.match(/^“([^”<]+)”$/);
  if (m && !isKo(m[1])) return at(page || here, slug(m[1]));
  return null;
}

function render(ch, md, bilingual, pageOf) {
  let src = fs.readFileSync(ch.file, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  // the chapter's own title heading — "## Chapter 3. …" anywhere, or any H2 on the first line — becomes the page H1
  // (with its Korean line, if any). A chapter without one (a preface) keeps all its headings.
  let koTitle = "";
  const dropTitle = (_, ko) => { koTitle = ko || ""; return ""; };
  const titled = /^##\s+Chapter \d+\.\s*.+\n(?:\*\*([^*\n]+)\*\*\n)?/m;
  src = titled.test(src) ? src.replace(titled, dropTitle) : src.replace(/^\s*##\s+.+\n(?:\*\*([^*\n]+)\*\*\n)?/, dropTitle);
  // Obsidian wikilinks: [[…/5. Title#Heading|alias]] → local page when the note is one of the chapters
  src = src.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
    const [note, heading] = target.split("#");
    const page = pageOf[note.split("/").pop().replace(/\.md$/, "")];
    const text = alias || heading || note.split("/").pop();
    return page ? `[${text}](${page}${heading ? "#" + slug(heading) : ""})` : text;
  });
  if (bilingual) {
    // footnotes carry the Korean line right under the English one; make it its own paragraph
    src = src.replace(/^(\[\^\w+\]:.*)\n( {4}|\t)(?=\S)/gm, "$1\n\n$2");
  }
  // pandoc-style subscripts: p~obs~
  src = src.replace(/(?<![~\w])~([^~\s]+)~(?!~)/g, "<sub>$1</sub>");
  const store = [];
  src = protectMath(src, store);
  let html = md.render(src, { chapter: ch.num });
  html = html
    .replace(/&lt;(\/?)(sub|sup)&gt;/g, "<$1$2>")
    .replace(/<p( class="ko" lang="ko")?>MATHBLOCK(\d+)X<\/p>/g, (_, k, i) => `<div class="math">${store[i]}</div>`)
    .replace(/MATHBLOCK(\d+)X|MATHINLINE(\d+)X/g, (_, a, b) => store[a ?? b]);

  // tables are numbered in order, like figures (Korean duplicates of a table don't take a number)
  let tn = 0;
  const tc = ch.num === 0 ? "p" : ch.num;
  html = html.replace(/<table>/g, () => `<table id="table-${tc}-${++tn}">`);

  // cross references: resolve by link text; a Korean link reuses whatever its English twin resolved to
  const linkRe = /<a href="((ch\d\d\.html)?#[^"]*)"([^>]*)>([\s\S]*?)<\/a>/g;
  const resolved = {};
  for (const m of html.matchAll(linkRe)) {
    const r = resolveXref(m[4], m[2], ch.page);
    if (r) resolved[m[1]] = r;
  }
  html = html.replace(linkRe, (all, href, page, rest, text) => {
    if (/^#fn/.test(href) || rest.includes("footnote")) return all;
    const r = resolveXref(text, page, ch.page) || resolved[href];
    return r ? `<a href="${r}" data-xref>${text}</a>` : all;
  });
  // leftover in-page anchors from the epub (#ex-1-1, #sec_x) that we can't resolve: keep text, drop dead link
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  html = html.replace(/<a href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, id, text) =>
    ids.has(id) || id.startsWith("fn") ? m : `<span class="xref">${text}</span>`);

  const toc = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((m) => ({
    level: +m[1], id: m[2],
    text: m[3].replace(/<small[\s\S]*<\/small>/, "").replace(/<[^>]+>/g, ""),
    ko: (m[3].match(/<small class="ko-h"[^>]*>([\s\S]*?)<\/small>/) || [])[1] || "",
  }));
  // reading time from the English text only
  const plain = src.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n/).filter((b) => !isKo(b)).join(" ");
  return { html, toc, koTitle, minutes: Math.max(1, Math.round(plain.split(/\s+/).length / 230)) };
}

// ---------- page shell ----------
const FONTS = "family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500";
const head = (title, ed) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<script>try{var s=JSON.parse(localStorage.getItem("${STORE}-prefs")||"{}"),r=document.documentElement;if(s.theme)r.dataset.theme=s.theme;if(s.size)r.style.setProperty("--fs",s.size+"px");if(s.width)r.style.setProperty("--measure",s.width+"ch");if(s.ko===false)r.dataset.ko="off";}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${FONTS}${ed.bilingual ? "&family=Noto+Sans+KR:wght@400;500;700" : ""}&display=swap">
<link rel="stylesheet" href="assets/katex/katex.min.css">
<link rel="stylesheet" href="assets/reader.css">
</head>`;
const bodyData = (ed, page) =>
  `data-page="${page}" data-edition="${ed.key}" data-store="${esc(STORE)}" data-book="${esc(KEY)}" data-dir="${esc(path.basename(ed.out))}"`;

const controls = (ed, page) => `
<div class="controls" role="toolbar" aria-label="Reading settings">
  ${ed.bilingual ? `<button data-act="ko" title="Show or hide Korean (K)" aria-label="Show or hide Korean"><span class="ko-label">KO on</span></button>` : ""}
  <button data-act="words" title="Saved words (W)" aria-label="Saved words">Words <span class="words-count"></span></button>
  <button data-act="smaller" title="Smaller text" aria-label="Smaller text">A−</button>
  <button data-act="bigger" title="Larger text" aria-label="Larger text">A+</button>
  <button data-act="width" title="Line width" aria-label="Line width">↔</button>
  <button data-act="theme" title="Theme" aria-label="Theme"><span class="theme-label">Auto</span></button>
  ${Object.entries(EDITIONS).filter(([k]) => k !== ed.key).map(([, o]) =>
    `<a class="edition" href="${esc(path.relative(ed.out, o.out))}/${page}" title="Switch edition">${esc(o.label || (o.bilingual ? "EN + 한국어" : "English only"))}</a>`).join("")}
</div>`;

function chapterPage(ch, i, all, ed) {
  const prev = all[i - 1], next = all[i + 1];
  const nav = all.map((c) =>
    `<li${c === ch ? ' class="current"' : ""}><a href="${c.page}"><span class="n">${c.num || "P"}</span>${esc(c.title)}</a></li>`).join("");
  const toc = ch.toc.map((t) =>
    `<li class="l${t.level}"><a href="#${t.id}">${t.text}${t.ko ? `<small class="ko" lang="ko">${t.ko}</small>` : ""}</a></li>`).join("");
  const label = ch.num === 0 ? FRONT : `Chapter ${ch.num}`;
  return `${head(`${ch.num ? ch.num + ". " : ""}${ch.title} · ${BOOK}`, ed)}
<body ${bodyData(ed, ch.page)}>
<div id="progress"></div>
<header class="bar">
  <button class="menu" aria-label="Chapters" aria-expanded="false">☰</button>
  <a class="book" href="index.html">${BOOK}</a>
  <span class="where">${label}</span>
  ${controls(ed, ch.page)}
</header>
<aside class="side" id="side">
  <nav class="chapters"><h2>Chapters</h2><ol>${nav}</ol></nav>
  ${toc ? `<nav class="toc"><h2>In this chapter</h2><ol>${toc}</ol></nav>` : ""}
</aside>
<main>
  <article>
    <p class="kicker">${label} · ${ch.minutes} min read</p>
    <h1>${esc(ch.title)}</h1>
    ${ch.koTitle ? `<p class="ko-title ko" lang="ko">${esc(ch.koTitle)}</p>` : ""}
    ${ch.html}
  </article>
  <nav class="pager">
    ${prev ? `<a class="prev" href="${prev.page}"><small>← Previous</small>${esc(prev.title)}</a>` : "<span></span>"}
    ${next ? `<a class="next" href="${next.page}"><small>Next →</small>${esc(next.title)}</a>` : "<span></span>"}
  </nav>
</main>
<script src="assets/reader.js"></script>
<script src="assets/vocab.js"></script>
</body>
</html>`;
}

function indexPage(all, ed) {
  const total = all.reduce((s, c) => s + c.minutes, 0);
  const rows = all.map((c) => `
    <li><a href="${c.page}" data-page="${c.page}">
      <span class="n">${c.num || "P"}</span>
      <span class="t">${esc(c.title)}${c.koTitle ? `<em class="ko" lang="ko">${esc(c.koTitle)}</em>` : ""}<small>${c.toc.filter((t) => t.level === 2).slice(0, 4).map((t) => t.text).join(" · ")}</small></span>
      <span class="m">${c.minutes} min<i class="done"></i></span>
    </a></li>`).join("");
  return `${head(BOOK, ed)}
<body class="home" ${bodyData(ed, "index.html")}>
<header class="bar"><a class="book" href="index.html">${BOOK}</a><span class="where"></span>${controls(ed, "index.html")}</header>
<main>
  <section class="cover">
    ${cfg.kicker || ed.bilingual ? `<p class="kicker">${[cfg.kicker, ed.bilingual && "English + 한국어"].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
    <h1>${BOOK}</h1>
    ${AUTHORS ? `<p class="by">${esc(AUTHORS)}</p>` : ""}
    <p class="meta">${all.length} chapters · about ${Math.round(total / 60)} hours of reading</p>
    <a class="resume" id="resume" hidden></a>
  </section>
  <ol class="contents">${rows}</ol>
</main>
<script src="assets/reader.js"></script>
<script src="assets/vocab.js"></script>
</body>
</html>`;
}

// ---------- write ----------
function build(key) {
  const ed = { key, ...EDITIONS[key] };
  const md = makeMd(ed.bilingual);
  const chapters = fs.readdirSync(ed.src)
    .filter((f) => CHAPTER_RE.test(f))
    .map((f) => {
      const num = +f.match(CHAPTER_RE)[1];
      return { num, note: f.replace(/\.md$/, ""), title: f.replace(/\.md$/, "").replace(/^\d+\.\s*/, ""), file: path.join(ed.src, f), page: chPage(num) };
    })
    .sort((a, b) => a.num - b.num);

  fs.rmSync(ed.out, { recursive: true, force: true });
  fs.mkdirSync(path.join(ed.out, "assets"), { recursive: true });
  fs.cpSync(path.join(HERE, "node_modules/katex/dist"), path.join(ed.out, "assets/katex"), {
    recursive: true,
    filter: (p) => !/\.(js|mjs)$/.test(p) && !/contrib/.test(p),
  });
  fs.copyFileSync(path.join(HERE, "reader.css"), path.join(ed.out, "assets/reader.css"));
  fs.copyFileSync(path.join(HERE, "reader.js"), path.join(ed.out, "assets/reader.js"));
  fs.copyFileSync(path.join(HERE, "vocab.js"), path.join(ed.out, "assets/vocab.js"));

  if (!chapters.length) throw new Error(`no chapter files matching ${CHAPTER_RE} in ${ed.src}`);
  const pageOf = Object.fromEntries(chapters.map((c) => [c.note, c.page]));
  for (const ch of chapters) Object.assign(ch, render(ch, md, ed.bilingual, pageOf));
  // cross-chapter links: keep the hash only if the target page has that id
  const idsOf = Object.fromEntries(chapters.map((c) => [c.page, new Set([...c.html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))]));
  for (const ch of chapters) {
    ch.html = ch.html.replace(/href="(ch\d\d\.html)#([^"]*)"/g, (m, page, id) => (idsOf[page]?.has(id) ? m : `href="${page}"`));
  }
  chapters.forEach((ch, i) => fs.writeFileSync(path.join(ed.out, ch.page), chapterPage(ch, i, chapters, ed)));
  fs.writeFileSync(path.join(ed.out, "index.html"), indexPage(chapters, ed));
  console.log(`Built ${chapters.length} chapters → ${ed.out}`);
  highlightSyntax(ed.out);
}

// English syntax highlighting (esh, book.json "esh": its config). Optional: skipped when the esh CLI isn't installed.
function highlightSyntax(out) {
  if (!cfg.esh || process.env.ESH === "0") return;
  const config = resolve(cfg.esh);
  const bin = process.env.ESH_BIN || "esh";
  const r = spawnSync(bin, ["build", out, "--config", config], { stdio: ["ignore", "inherit", "pipe"], encoding: "utf8" });
  if (r.error?.code === "ENOENT") return console.log("esh not found — skipping syntax highlighting");
  if (r.status !== 0) { process.stderr.write(r.stderr.split("\n").filter((l) => !/Warning|warnings.warn/.test(l)).join("\n")); process.exit(r.status); }
}

const which = process.argv[3];
if (which && !EDITIONS[which]) { console.error(`no edition "${which}" in ${CONFIG}`); process.exit(2); }
for (const key of which ? [which] : Object.keys(EDITIONS)) build(key);
