export const meta = {
  name: 'paper-wiki',
  description: 'Write one wiki node per planned paper term/method/result/limit, verify each against the paper pages, optionally draw figures, then link index/glossary/log',
  whenToUse: 'Called by the wiki-from-paper skill after the user approved plan.md',
  phases: [
    { title: 'Draft', detail: 'one agent per node, writes only its own file' },
    { title: 'Verify', detail: 'independent check of every quote and number against paper.txt' },
    { title: 'Figure', detail: 'Mermaid summary + step diagrams for methods, wfig example figure; only nodes marked for a figure' },
    { title: 'Link', detail: 'one agent: index, first-appearance links, glossary, log, figure README, checks' },
  ],
}

// args: { wiki_root, paper_txt, skill_dir, wiki_kit_dir, pdftext, mermaid_dir, ending, figures: 'all'|'diagram'|'svg'|'none',
//         nodes: [{type, file, title, aliases, anchors, brief, figure}], only?: [file], stages?: ['draft','verify','figure','link'] }
const A = args
const STAGES = A.stages || ['draft', 'verify', 'figure', 'link']
const nodes = (A.only ? A.nodes.filter(n => A.only.includes(n.file)) : A.nodes)
const path = n => `${A.wiki_root}/${n.type}/${n.file}.md`
const CHECK = (f = '') => `python3 ${A.skill_dir}/scripts/check_quotes.py ${A.wiki_root}${f ? ' ' + f : ''}`
const COMMON = `
Wiki root: ${A.wiki_root}
Paper text (pages marked [[p.N]]): ${A.paper_txt}
Read first: ${A.wiki_root}/wiki.config.md, ${A.skill_dir}/references/paper-nodes.md, ${A.wiki_root}/용어.md (glossary — use its terms exactly), ${A.wiki_root}/plan.md (all planned nodes; you may link to them by relative path).
Sentence ending: ${A.ending}. Korean prose; paper terms in English as the paper writes them.
Every number and claim must come from the paper pages; quote them under '## 원문' as '- [p.N] "exact words"'.
For table numbers read the page with: python3 ${A.pdftext} <paper.pdf> --pages N --layout (paper.pdf is next to paper.txt; if a layout file already exists use it).
Length: 개념 ≤ 45 lines, 기법 · 결과 · 한계 ≤ 90 lines (figure block excluded). Quotes: one per claim that needs it, 8–20 per node; do not quote the same sentence twice.
Links: link a word only to the node whose title or alias IS that term (see plan.md). A term with no node of its own stays plain text — never link it to a nearby node. One link per target per node.
Do not edit any file other than the ones this task names. Other agents are writing sibling nodes at the same time.`

const DRAFT_SCHEMA = { type: 'object', properties: {
  path: { type: 'string' }, quotes: { type: 'number' }, gaps: { type: 'array', items: { type: 'string' } } },
  required: ['path', 'quotes', 'gaps'] }
const VERIFY_SCHEMA = { type: 'object', properties: {
  checked: { type: 'number' }, fixed: { type: 'array', items: { type: 'string' } },
  unresolved: { type: 'array', items: { type: 'string' } }, check_passed: { type: 'boolean' } },
  required: ['checked', 'fixed', 'unresolved', 'check_passed'] }
const FIG_SCHEMA = { type: 'object', properties: {
  files: { type: 'array', items: { type: 'string' } }, ok: { type: 'boolean' }, note: { type: 'string' } },
  required: ['files', 'ok', 'note'] }

const results = await pipeline(nodes,
  async (_, n) => {
    if (!STAGES.includes('draft')) return { path: path(n), quotes: -1, gaps: [] }
    return agent(`Write ONE wiki node for a paper.${COMMON}

Node: type=${n.type}, file=${path(n)}, title="${n.title}", aliases=${JSON.stringify(n.aliases)}
Where the paper covers it: ${n.anchors}
What it must cover: ${n.brief}

Steps: read those pages (and any page they point to) in the paper text, write the node in the '${n.type}' format from paper-nodes.md with frontmatter (type: ${n.type}, aliases), then run:
  ${CHECK(path(n))}
and fix quotes until it passes. Do not add a figure. Do not touch index.md, log.md, 용어.md.
Return path, number of quotes, and gaps (things the brief asked for that the paper does not contain).`,
      { label: `draft:${n.file}`, phase: 'Draft', schema: DRAFT_SCHEMA })
  },
  async (d, n) => {
    if (!d) return null
    const v = STAGES.includes('verify') ? await agent(`Independently verify one paper-wiki node. You did not write it; assume it contains errors until each sentence is checked.${COMMON}

Node: ${path(n)}

For every sentence that states a number, a definition, a step, or what the authors claim: find it in the paper text. Wrong → fix the sentence to what the paper says. Not in the paper → delete it, or mark it '논문 밖:' if it is a one-sentence standard definition. Author interpretation written as fact → rewrite with '저자:'. Check that numbers come with their condition (dataset, setting, table). Then run:
  ${CHECK(path(n))}
Edit only this node file. Return how many claims you checked, what you fixed, what you could not resolve, and whether the check passed.`,
      { label: `verify:${n.file}`, phase: 'Verify', schema: VERIFY_SCHEMA }) : null
    return { n, d, v }
  },
  async (r, n) => {
    if (!r) return null
    if (!STAGES.includes('figure') || A.figures === 'none' || !n.figure) return { ...r, f: null }
    const FIGS = A.figures || 'all'
    const isMethod = n.type === '기법'
    const wantDiagram = isMethod && (FIGS === 'all' || FIGS === 'diagram')
    const wantExample = FIGS === 'svg' || (FIGS === 'all')
    if (!wantDiagram && !wantExample) return { ...r, f: null }
    const parts = []
    if (wantDiagram) parts.push(`DIAGRAMS (① summary + ② step detail). Read ${A.skill_dir}/references/figures.md ("세 층", "다이어그램 기준") and ${A.mermaid_dir}/references/grammar.md first, and follow them exactly. For any element listed in ${A.wiki_root}/그림/_elements.md, use exactly that id, color class and storage shape; do not edit that file.
Write ${A.wiki_root}/그림/d-${n.file}.mmd (summary, 4–8 boxes, step numbers, no values) and one d-${n.file}-stepK.mmd per step worth expanding (each MUST add inputs, decisions as diamonds, branches, outputs and at least one value from the paper that the summary does not show — a re-highlighted copy of the summary is not a step diagram). If every step of this method is its own node in plan.md, draw only the summary with subroutine boxes and click links instead. Append the palette block from ${A.wiki_root}/그림/_palette.mmd (copy it there from ${A.mermaid_dir}/assets/_palette.mmd if missing). Write ${A.wiki_root}/그림/d-${n.file}-labels.md with its '## 원문 확인' table. Render each with '${A.mermaid_dir}/assets/render.sh <file>.mmd' and '... <file>.mmd <file>.png', open every PNG with Read, fix crossings / cut labels and rerender until clean. Run '${CHECK()} ${A.wiki_root}/그림/d-${n.file}-labels.md'.`)
    if (wantExample) parts.push(`EXAMPLE FIGURE (③). Make one svg with wfig per references/figures.md "예시 그림 기준" (one valued example from the paper, shapes for right/wrong, terse labels).${FIGS === 'svg' ? ' Add step figures with build(steps=...).' : ' No step figures: build(steps={}, titles={0: ...}).'}
Write ${A.wiki_root}/그림/make_w_${n.file}.py and ${A.wiki_root}/그림/w-${n.file}-labels.md (the '## 원문 확인' rows quote the paper page for each label that states a fact), run 'cd ${A.wiki_root}/그림 && python3 make_w_${n.file}.py', open the PNG with Read to check nothing overlaps or overflows, fix and rerun until clean.`)
    parts.push(`Insert into the node right after the '**한 줄로:**' (or '**답:**') line: ${wantDiagram ? "the '**다이어그램:**' block (summary, a one-line reading guide, step diagrams in <details>)" : ''}${wantDiagram && wantExample ? ', then ' : ''}${wantExample ? "the '**예시 그림:**' block" : ''}, in the format figures.md gives. If the node already has a figure block, keep it and put the new block in the right place rather than duplicating.`)
    const how = parts.join('\n\n')
    const f = await agent(`Add a figure to one paper-wiki node.${COMMON}

Node: ${path(n)}
${how}
Edit only the node file and files in ${A.wiki_root}/그림/ whose names contain '${n.file}'. Return files written, ok, and a one-line note.`,
      { label: `figure:${n.file}`, phase: 'Figure', schema: FIG_SCHEMA })
    return { ...r, f }
  },
)

const done = results.filter(Boolean)
const dropped = nodes.filter(n => !done.some(r => r.n.file === n.file)).map(n => n.file)
if (dropped.length) log(`no result for: ${dropped.join(', ')}`)

let link = null
if (STAGES.includes('link')) {
  phase('Link')
  link = await agent(`Connect the nodes of a paper wiki. You are the only agent writing now.${COMMON}

Nodes written this run: ${done.map(r => path(r.n)).join(', ')}
Problems the node agents could not fix because they touch shared files (fix the ones in 용어.md / index.md; list the rest in your report):
${done.flatMap(r => (r.v ? r.v.unresolved : []).map(u => `- ${r.n.file}: ${u}`)).join('\n') || '- none'}

1. index.md: under each type heading, list that type's nodes in plan.md order as '- [title](type/file.md) — one phrase'. Replace '(아직 없음)'. Keep existing entries.
2. First appearance: for every node in the wiki, link the first mention of each other node's title or alias (one link per target per node — skip a target the node already links anywhere; remove a link that points to a node whose title/alias is not the linked word; not inside code blocks, quotes, headings, or the '## 원문' list).
3. 용어.md: put a link to the node in the memo column of its row.
4. ${A.figures !== 'none' ? `그림/README.md: one table row per figure (그림 | 넣은 노드 | 근거 쪽 | 다시 만들기 명령), diagrams (d-*) and example figures (w-*) in separate tables. Create the file if missing.` : 'No figure README.'}
5. log.md: append one line '- <today from \`date +%F\`>: wiki-from-paper — <N> nodes (<counts by type>)${A.figures !== 'none' ? ', figures ' + A.figures : ''}'.
6. Run '${CHECK()}' (all nodes) and 'python3 ${A.wiki_kit_dir}/wiki-lint/scripts/wiki_lint.py ${A.wiki_root}'. Fix link/index problems you caused; report the rest.
Do not change node content beyond adding links. Do not commit.
Return a short report: files changed, check outputs (pass/fail lines), remaining problems.`,
    { label: 'link', phase: 'Link' })
}

return {
  nodes: done.map(r => ({ file: r.n.file, type: r.n.type, quotes: r.d.quotes, gaps: r.d.gaps,
    fixed: r.v ? r.v.fixed.length : null, unresolved: r.v ? r.v.unresolved : null,
    check: r.v ? r.v.check_passed : null, figure: r.f ? (r.f.ok ? 'ok' : 'failed: ' + r.f.note) : null })),
  dropped, link,
}
