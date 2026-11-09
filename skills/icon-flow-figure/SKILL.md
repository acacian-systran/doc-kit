---
name: icon-flow-figure
description: Draw a hand-placed process figure in the AWS-architecture style — rounded icon tiles whose colour is the step's role (input · rule-based · retrieval · LLM · integrate · output), lettered circles (a)–(n) in execution order, a dashed loop frame for the repeated part, a band in the middle for state that accumulates across iterations with thick write arrows into it and dashed read arrows out, a decision diamond, and retry lines under the bottom row — grounded in the code the figure describes, not in memory or an earlier figure. Every tile carries a hover/focus tip saying what the code does there with file:line. The page around the figure adds a colour-for-slides / black-and-white-for-paper toggle (LLM steps are the only grey fill), a method × step matrix (● · ◐ · blank), the step list, code notes, a "differs from the earlier figure" table and, when asked to check something, a verdict box. Tiles and lines can carry the real data of a run — a tile shows its stored form, a line the data passed along it, in a side panel on hover or click, filled by a script from the run's own files (never copied by hand) — and a tile can lead into the figure one level down on double-click, so a set of pages reads L0 whole run → L1 one iteration → L2 one step with a level list on every page. Built from one spec JSON by a script; a checker catches tiles that overlap, labels that collide with lines, frames or other labels, lines that cut through tiles, and letters that skip or disagree with the step list; an exporter writes PNG and standalone SVG for decks and papers. Use whenever the user asks for 이런 그림 · 아이콘 그림 · 아이콘 타일 그림 · AWS 아키텍처 그림처럼 · 코드 기준 그림 · 코드대로 그림 다시 · 처리 흐름 그림 · 파이프라인 그림 덱용 · 논문용 흑백 그림 · 그림 A처럼, or shows such a figure (or an Artifact of one) and asks for another, or asks whether a figure matches the code, or asks 노드 누르면 데이터 · 실제로 오가는 데이터 보여줘 · 저장된 형태 · 주고받는 데이터 · 추상적이지 않게 · 두 번 누르면 들어가게 · 레벨별로 L0부터 · 단계 그림 묶음. Deciding question: if the figure lives as source inside docs (GitHub, Notion) and is edited often with automatic layout — architecture, sequence, state, ER, or a viewer or playback over a diagram directory — use mermaid-diagram; if it is a quick picture inside a chat answer, use explain-ladder; use this skill when the figure is shown once as a finished page or image and its layout is placed by hand.
---

# 아이콘 흐름 그림 (icon-flow-figure)

손으로 자리를 잡은 처리 흐름 그림 한 장과, 그 그림이 코드와 맞는지 보여 주는 페이지를 만든다.
기준 그림은 rdb2ontology 의 「그림 A 코드 기준판」(RIGOR 생성 흐름, 단계 (a)–(n))이고, 저장소 안 예시는
가상 코드로 같은 형식을 따른 `examples/support-bot.json` 이다.

| 파일 | 무엇 |
|---|---|
| `references/grounding.md` | 코드에서 단계 표를 뽑는 순서, 무엇을 tip · 단계 · 보충 · 행렬 · 다른 점에 적나. **그리기 전에 읽는다** |
| `references/layout.md` | 어휘(역할 색 · 아이콘 · 선 · 틀 · 글자 원), 배치 규칙 8개, 좌표 기준, 문구 규칙 |
| `references/spec.md` | spec JSON 형식, 간선 자동 경로 규칙, 노드 · 간선 `data` · `href` |
| `references/data.md` | 데이터 칸에 무엇을 어떻게 채우나(실행 파일에서 스크립트로, 다시 돌려 assert), 레벨 페이지, 조작, 검사 |
| `assets/build.py` | spec → 단일 HTML (CSS · 아이콘 · 토글 인라인, 외부는 Google Fonts 뿐) |
| `assets/check.py` | spec 검사 + `--render` 로 브라우저에서 겹침 검사, `--shot` 으로 색 · 흑백 · 다크 스크린숏 |
| `assets/site.py` | 여러 장을 레벨 목록으로 묶어 빌드 + href · data 빠짐 검사 |
| `assets/export.py` | 그림만 PNG(기본 4배) · 단독 SVG 로 |
| `assets/icons.svg` · `page.css` | 아이콘 묶음 · 페이지 스타일 |
| `examples/support-bot.json` | 예시(가상 답변 봇, 데이터 칸 포함). 처음 만들 때 이것을 복사 |
| `examples/site.json` · `support-bot-draft.json` | 두 장 묶음 예시: L0 → (f) Draft-LLM 두 번 누르기 → L1 |

이웃 스킬과 나누는 기준(README 「그림 스킬 고르기」와 같음):

| 그림 | 스킬 |
|---|---|
| 문서 안에 소스로 두고 자동 배치로 자주 고침(구조도 · 순서도 · 상태도 · ERD, 뷰어 · 재생) | `mermaid-diagram` |
| 채팅 답 안에서 바로 보여 주는 검토용 | `explain-ladder` |
| 덱 · 논문 · 리뷰에 한 장으로 내놓고 자리를 손으로 잡음, 코드와 대조 | 이 스킬 |

---

## 1. 브리프

먼저 정한다(맡기면 괄호 안 기본값).

- **어느 함수의 한 번 실행인가** — 진입 함수 하나, 기준 커밋. (사용자가 가리킨 파일의 최상위 실행 함수)
- **답하는 질문 한 문장** — 그림 머리 `heading` 이 된다(`table 하나마다: DM 먼저 병합 → 검색 → …`).
- **비교 대상** — 이전 그림 · 기억 · 논문 그림이 있으면 `diff` 를 만든다. 사용자가 "맞나 확인"을 물었으면 `verdict`.
- **용도** — 덱(색판 PNG) · 논문(흑백판) · 리뷰(페이지 그대로). (셋 다 되게 만든다)
- **용어표** — 프로젝트에 용어표가 있으면 타일 제목은 거기서만 고른다.

## 2. 코드 읽기 → 단계 표

`references/grounding.md` §1 순서로 읽고, 글자 · `file:line` · 하는 일 · 읽는 것 · 쓰는 것 · 실패하면 표를 만든다.
글자는 실행 순서대로 a, b, c … — 반복 끝 판단에도 글자를 준다. 이 표를 사용자에게 먼저 보이고 순서가 맞는지 확인받는다
(그림을 그린 뒤 순서를 고치면 배치를 다 다시 잡아야 한다).

## 3. spec 쓰기

`examples/support-bot.json` 을 복사해서 고친다. 배치는 `references/layout.md` §4 를 따른다 — 요점:

- 반복 단계만 시계방향 사각 고리(윗줄 → 오른쪽 아래 → 아랫줄 ← → 왼쪽 위). 입력은 모두 위, 출력은 모두 아래.
- 누적 상태는 두 줄 사이 띠. 쓰기는 굵은 주황, 읽기는 점선.
- 판단은 아랫줄 왼쪽 끝 — no 는 왼쪽 변 위로, yes 는 바로 아래 출력 줄로.
- retry 는 아랫줄 밑 가로선 하나로 모음. 세로로 늘리지 않는다.
- 타일 제목은 영문 첫 글자 대문자, 설명 줄 없음. 설명은 tip 으로.

## 4. 빌드 · 검사

```bash
S=<스킬경로>/assets
python3 $S/build.py fig.json                       # → fig.html
python3 $S/check.py fig.json --render --shot shots # 실패 0 이 될 때까지
```

`check.py` 가 잡는 것: 타일끼리 겹침, 글자 원이 이어지지 않거나 `steps` 와 다름, tip 없는 타일, viewBox 밖,
글자 ↔ 글자 · 타일 · 선 · 틀 겹침, 선이 타일을 가로지름, 콘솔 오류, 390px 폭 가로 스크롤.
실패를 고친 뒤에도 `shots/color.png` · `bw.png` · `dark.png` 를 직접 열어 본다 — 검사는 겹침만 보고, 읽히는지는 보지 않는다.

## 5. 게시 · 내보내기

- 페이지는 Artifact 로 게시한다(`file_path` = 빌드된 html, icon `chart`). 같은 그림을 고치면 같은 경로로 다시 게시해 URL 을 유지한다.
  다른 세션에서 만든 그림을 고치면 Artifact `read` 로 받아 시작한다 — spec 이 없으면 HTML 에서 spec 을 다시 만든다.
- 덱 · 논문용 이미지:

  ```bash
  python3 $S/export.py fig.html            # fig-color.png · fig-bw.png (4배)
  python3 $S/export.py fig.html --svg      # + 스타일을 굳힌 단독 SVG
  ```

- 외부에 내는 그림이면 코드 경로가 타일 · 라벨에 없어야 한다(tip · 보충에만). `references/grounding.md` §4.

## 6. 데이터 칸 · 레벨 페이지 (필요할 때)

그림을 보는 사람이 "실제로 무슨 값이 오가나"를 확인해야 하면 붙인다. 자세한 것은 `references/data.md`.

- 타일 `data` = 그 자리에 저장된 형태, 선 `data` = 그 선으로 넘어가는 값. 칸마다 파일 경로 · 행 범위를 적는다.
- 값은 실행 기록 파일에서 `*_data.py` 스크립트로 뽑는다. 파일로 남지 않는 중간값은 코드 함수 원문을 다시 돌려 만들고,
  실행 기록과 맞는지 assert 한다. 끝내 볼 수 없는 값은 지어내지 않고 "파일로 남지 않음"이라고 적는다.
- 큰 단계는 아래 레벨 그림으로: 타일 `data.href` + `assets/site.py site.json`. 조작은 올리기 = 미리 보기, 누르기 = 고정,
  두 번 누르기 = 들어가기, × · Esc · 빈 곳 = 닫기. 칸은 누른 타일 반대쪽에 열린다.

```bash
python3 $S/site.py site.json                       # → site/*.html, 실패 0 이어야 함(href)
python3 $S/check.py site/x.json --render --html site/x.html --shot shots   # 장마다 겹침 검사
```

## 7. 고칠 때

- 사용자가 배치를 지적하면(예: "세로로 늘리지 말 것") 그 그림만 고치지 말고 `references/layout.md` §4 에 규칙으로 더할지 묻는다.
- 단계 문구를 사용자가 직접 썼으면 글자 그대로 옮긴다. 고칠 곳이 보이면 보고만 한다.
- 문제 있는 경로를 그림에서 빼지 않는다(`references/grounding.md` §3).
