---
name: wiki-from-paper
description: Turn one academic paper (PDF, arXiv link) into a wiki-kit wiki in one run — extracts page-anchored text with paper-tutor's pdftext.py, sets up papers/<citekey>/wiki/ with a paper preset config, plans the node list (개념 · 기법 · 결과 · 한계, in reading order) and a glossary for the user to approve, then runs a workflow that drafts each node in parallel, has an independent agent verify every quote and number against the paper pages, optionally draws figures (by default a Mermaid summary diagram plus per-step detail diagrams and a valued wfig example figure per method node; diagram-only, example-only or none can be chosen per run), and links index, first appearances, glossary and log. Every quote is checked by a script against the page it names. Use when the user says 논문 위키로 · 논문을 위키화 · 이 논문 위키 만들어줘 · 논문 노드로 쪼개줘 · paper to wiki · wikify this paper, or hands over a paper and asks for wiki nodes. To add a single node later use wiki-add; to answer from the wiki use wiki-ask. Part of wiki-kit; needs paper-tutor installed.
---

# 논문 → 위키

논문 한 편을 노드 위키로 만든다. 사람이 정하는 곳은 **plan 승인** 한 번, 나머지는 workflow가 한다.

```
PDF/arXiv ─► 0 입력 · 옵션 ─► 1 텍스트 추출 ─► 2 위키 뼈대 ─► 3 plan + 용어표 ─► [사용자 승인]
          ─► 4 workflow: 노드 쓰기 ∥ → 독립 검증 → 그림(옵션) ─► 연결 ─► 5 검사 · 커밋 · 보고
```

경로:
- `SKILL_DIR` = 이 스킬의 실제 경로(`realpath`로 링크를 푼 것). `WIKI_KIT` = 그 상위. `PDFTEXT` = `<paper-tutor 스킬>/assets/pdftext.py`. `MERMAID` = `<mermaid-diagram 스킬>` 실제 경로(`figures`가 `all` · `diagram`일 때).

## 0. 입력 · 옵션

사용자가 말한 것만 쓰고, 빠진 것은 기본값으로 정해 한 줄로 알린다. 묻지 않는다.

| 옵션 | 기본값 | 다른 값 |
|---|---|---|
| 위치 | `papers/<citekey>/wiki/` (작업 디렉터리 기준, paper-tutor와 같은 `papers/` 규칙) | 사용자가 준 경로 |
| `figures` | `all` (기법: 요약 다이어그램 + 단계 펼침 다이어그램 + 예시 그림, 결과: 예시 그림) | `diagram` · `svg` · `none` (references/figures.md) |
| 노드 수 | 20–35 | 사용자 지정 |
| `ending` | 명사형 | 한다체 · 합니다체 |
| 커밋 | 위키가 git 안이면 `ask`, 밖이면 `never` | `auto` |

citekey = 제1저자성-연도-제목첫단어(`vaswani-2017-attention`).

## 1. 텍스트 추출

paper-tutor 2절 규칙 그대로. `papers/<citekey>/study/`에:

```bash
python3 $PDFTEXT paper.pdf --info     # 쪽수 · 스캔 여부
python3 $PDFTEXT paper.pdf            # paper.txt
```

- arXiv는 `https://arxiv.org/pdf/<id>`를 `study/paper.pdf`로 받는다.
- `paper.txt`가 이미 있으면 다시 뽑지 않는다(앵커가 어긋남).
- 표가 있는 쪽은 `--pages N --layout`으로 따로. 본문 15쪽 넘고 부록이 길면 본문만 — 읽은 범위를 config에 적는다.
- 스캔본(`--info`가 글자 거의 없음)이면 멈추고 알린다. 인용 검사가 성립하지 않는다.

## 2. 위키 뼈대

`wiki-init`의 2-B 대신 프리셋을 쓴다(질문 없음).

1. `<위키>/wiki.config.md` ← `assets/wiki.config.paper.md`의 `{{…}}`를 채움. `{{SKILL_DIR}}`는 절대 경로.
2. `<위키>/index.md` ← `$WIKI_KIT/wiki-init/assets/index.template.md`, 노드 종류는 개념 · 기법 · 결과 · 한계 · 헷갈린-점.
3. `<위키>/log.md` ← `# <제목> 위키 변경 기록` + 오늘 날짜 한 줄.
4. `figures`가 `all` · `svg`면 `assets/wfig.py`를 `<위키>/그림/wfig.py`로, `all` · `diagram`이면 `$MERMAID/assets/_palette.mmd`를 `<위키>/그림/_palette.mmd`로 복사.

## 3. plan · 용어표 (메인 세션이 직접)

논문을 초록 → 결론 → 그림 · 표 → 방법 → 서론 순으로 읽는다(paper-tutor read 1단계). 그다음 두 파일을 쓴다.

**`<위키>/plan.md`** — 노드 목록. 한 행이 노드 하나.

```markdown
| # | type | file | title | aliases | anchors | brief | figure |
|---|---|---|---|---|---|---|---|
| 1 | 개념 | self-attention | self-attention | 셀프 어텐션; intra-attention | p.2 §3.2, p.4 식 1 | 정의 · Q/K/V · 식 1 기호 · 예 | n |
```

- 종류 배분: 개념(paper-tutor prep의 prerequisite + introduced, 이 논문을 따라가는 데 필요한 것만) · 기법(제안 방법과 구성 요소, 하나씩) · 결과(표 · 그림 하나가 답하는 질문 하나) · 한계(저자가 밝힌 것 + 보고하지 않은 사실).
- 헷갈린-점은 만들지 않는다. 사용자가 읽다가 헷갈린 질문만 나중에 `wiki-add`로.
- **순서**: 앞 노드를 알아야 뒤 노드를 읽을 수 있는 순서(paper-tutor prep 2절).
- `anchors`는 paper.txt에서 grep으로 확인한 쪽 · 절 · 표. `brief`는 노드가 반드시 담을 것 한 줄.
- `figure: y`는 `figures`가 `none`이 아닐 때, 단계가 있는 기법과 값이 든 예로 보여 줄 수 있는 결과에만(보통 3–8개). 기법은 다이어그램 + 예시 그림, 결과는 예시 그림만.
- 표제어가 원문에 있는지 `grep -i`로 확인.

**`<위키>/용어.md`** — `| 용어(영어) | 번역어 | 한 줄 뜻 | 쪽 | 메모 |`. plan의 모든 title + 노드 본문에 반복해 나올 용어. 노드끼리 같은 말을 쓰게 하는 표다.

그다음 **사용자에게 보여 주고 멈춘다**: 종류별 개수, plan 표, 그림 대상, 예상 agent 수(노드 × 2 + 그림 노드 + 1). 고치라는 것을 반영하고 승인을 받는다.

## 4. workflow 실행

승인되면 plan 표를 JSON으로 바꿔 Workflow 도구를 부른다(이 스킬 호출이 workflow 실행 동의다).

```
Workflow({ scriptPath: "<SKILL_DIR>/assets/paper-wiki.workflow.js", args: {
  wiki_root, paper_txt, skill_dir: SKILL_DIR, wiki_kit_dir: WIKI_KIT, pdftext: PDFTEXT, mermaid_dir: MERMAID,
  ending, figures, nodes: [{type, file, title, aliases: [...], anchors, brief, figure: true|false}, ...] } })
```

모두 절대 경로. 단계(스크립트가 함):

| 단계 | agent | 쓰는 파일 |
|---|---|---|
| Draft | 노드마다 하나, 동시에 | 자기 노드 파일만 |
| Verify | 노드마다 하나, 쓴 agent와 다름. 문장마다 원문 대조 · 고침 | 자기 노드 파일만 |
| Figure | `figure: y` 노드만. 다이어그램(① · ②) → 예시 그림(③) 순서로 한 agent | 자기 노드 + `그림/*<file>*` |
| Link | 하나 | index · 노드 링크 · 용어표 메모 · log · `그림/README.md` |

부분 재실행: `only: [file, ...]`(그 노드만), `stages: [...]`(예: 그림만 나중에 `["figure", "link"]`). 실패하면 `resumeFromRunId`로 이어서.

## 5. 검사 · 커밋 · 보고

1. 메인 세션이 직접 다시 돌린다(workflow 보고를 믿지 않고):
   ```bash
   cd <위키> && python3 $SKILL_DIR/scripts/check_quotes.py .
   python3 $WIKI_KIT/wiki-lint/scripts/wiki_lint.py <위키>
   ```
2. 노드 2–3개를 골라 직접 읽고 원문과 대조한다(특히 Verify가 `unresolved`를 남긴 것, 결과 노드 하나).
3. 커밋은 config `commit`. `auto`면 wiki-add 6단계 규칙(이번에 만든 파일만 경로로 add, staged 목록 확인). push 안 함.
4. 보고: 위키 경로, 종류별 노드 수, 검사 결과(인용 수 · 실패), Verify가 고친 수 · 못 고친 것, 그림 결과, `gaps`(plan이 요구했지만 논문에 없던 것), 커밋 해시. 노드 본문은 붙이지 않는다.
5. 다이어그램(`d-*.mmd`)을 그렸고 `그림/README.md` 에 읽는 법 링크가 없으면, 보고 끝에 한 줄로 제안한다: 기호를 처음 보는 사람을 위한 읽는 법 페이지를 만들 수 있고, 예시로 쓸 그림은 사용자가 고른다. 그림이 세 장 이상이면 그림 뷰어(`그림/뷰어.html`)도 함께 제안한다. 만드는 법은 mermaid-diagram SKILL.md 7절 · 8절.

## 이후

- 읽다가 헷갈린 것 → `wiki-add`(헷갈린-점). config가 이 위키를 가리키므로 그대로 동작.
- 위키에 묻기 → `wiki-ask`. 점검 → `wiki-lint`.
- 그림만 나중에 → 4단계를 `figures: "all", only: [...], stages: ["figure", "link"]`로. plan의 `figure`를 y로 바꾼 뒤. 이미 예시 그림이 있는 위키에 다이어그램만 더하려면 `figures: "diagram"`.
