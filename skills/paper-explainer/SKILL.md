---
name: paper-explainer
description: Turn an academic paper into a multi-page Korean explainer site — an Overview page that draws the paper's argument as a flow (problem → method → experiments → conclusion), then one page per chapter and per subchapter, each carrying a sticky minimap of that flow with the current stage and section highlighted, sections already passed marked, a reading-progress bar, prev/next links and arrow keys. Pages move a little where motion shows position, order or cause — the minimap rail fills from the previous page's position, the overview flow draws in sequence, and mechanism walk-throughs step one stage at a time. Use whenever the user asks for 논문 해설 페이지 · 해설 사이트 · 논문 설명 웹페이지 · 챕터별 페이지 · 섹션별 해설 · 논문을 페이지로 · explainer site for this paper. For a study note, glossary, Q&A or quiz, use paper-tutor instead. Provides the shared minimap/stepper script and stylesheet, page templates, the section-splitting rules, and a browser check for the whole site.
---

# 논문 해설 사이트

논문 한 편을 여러 페이지짜리 해설 사이트로 만든다. 어느 페이지를 보든 그 내용이
**논문 전체 흐름의 어디에 해당하는지** 화면 한쪽에 늘 보인다.

```
Overview (흐름도)  ──▶  챕터 페이지  ──▶  하위 챕터 페이지 …
       ▲                    │ 미니맵: Overview 흐름의 축소판, 현재 위치 강조
       └────────────────────┘ 이전/다음 · ← →
```

규칙은 `paper-tutor` 와 같다 — **원문에 있는 것만 원문이라고 말한다.** 해설 사이트는
설명을 덧붙이는 게 일이므로, 덧붙인 것에는 `논문 외` 표시를 단다.

## 1. 파일 배치

```
papers/<citekey>/
  study/paper.txt         # paper-tutor 의 추출본. 있으면 재사용, 없으면 여기에 만든다
  site/
    index.html            # Overview
    s1.html  s3.html  s3-1.html …   # 섹션 페이지. 점은 하이픈으로
    common/
      sections.js         # 목차 — 유일한 원본
      site.css  site.js   # 스킬의 assets/common 에서 복사. 페이지별로 고치지 않는다
```

사용자가 경로를 말하지 않으면 이 규칙으로 쓰고 경로를 알린다.
`site.css` · `site.js` 를 고쳐야 하면 스킬 쪽 원본을 고치고 다시 복사한다.

## 2. 절차

### 2.1 원문 확보

`paper-tutor` §2 를 따른다. `pdftext.py` 로 `[[p.N]]` 앵커가 붙은 `paper.txt` 를 만들고,
그림·수식이 많은 쪽은 Read 로 PDF 를 직접 본다. 앵커는 여기서만 가져온다.

```bash
python3 ~/.claude/skills/paper-tutor/assets/pdftext.py paper.pdf --info
python3 ~/.claude/skills/paper-tutor/assets/pdftext.py paper.pdf
```

### 2.2 목차와 흐름 초안 → 확인받기

`references/structure.md` 를 읽고 섹션 목록과 흐름 단계(4~7개)를 정한다.
**대화에 초안을 보여 주고 확인을 받은 뒤** 파일을 만든다. 구조가 틀리면 모든 페이지를
다시 만들어야 하므로 이 확인은 건너뛰지 않는다. 사용자가 "확인 없이 끝까지" 라고 했으면
초안을 보여 주기만 하고 바로 진행한다.

### 2.3 뼈대

```bash
S=~/.claude/skills/paper-explainer/assets
mkdir -p site/common
cp $S/common/site.css $S/common/site.js site/common/
cp $S/templates/sections.js site/common/sections.js     # 내용을 바꿔 채운다
```

`sections.js` 를 채우고, `templates/index.html` · `templates/section.html` 로 페이지를
만든다. `__X__` 토큰을 모두 바꾼다. 미니맵·흐름도·이전/다음·위치 표시줄은 `site.js` 가
`sections.js` 로 그린다 — **페이지에 목차를 손으로 쓰지 않는다.**

### 2.4 본문 채우기

`references/page.md` 의 구성과 규칙, `references/motion.md` 의 부품으로 쓴다.
Overview → 섹션 순서대로. 메커니즘 섹션(대개 방법 절)이 본체이고 분량 제한이 없다.

### 2.5 검사

```bash
python3 $S/check.py site --shot site/.shots
```

목차 구조(단계 순서·누락), 페이지마다 미니맵·현재 위치 강조·이전/다음, 남은 토큰,
수식 오류, 깨진 링크, 콘솔 오류, 데스크톱·모바일 가로 스크롤을 본다. **exit 0 이 될 때까지
고친다.** 스크린숏은 Overview·메커니즘 섹션 하나·모바일 하나를 눈으로 확인한다.
`.shots` 는 배포하지 않는다.

### 2.6 공유 (요청이 있을 때)

Artifact 로 올리려면 먼저 `artifact-design` 스킬을 로드한다. `index.html` 을 `file_path` 로,
나머지 페이지와 `common/*` 를 `files` 로 한 번에 올린다. 공용 파일은 이미 Artifact 규약
(색 토큰·다크 모드·cdnjs 의 KaTeX 만 외부 로드)을 지킨다.

## 3. 공통 규약

- **앵커**: 수치·표·그림·인용마다 `<span class="src">Table 2, p.8</span>`. 섹션 페이지
  머리의 `원문:` 과 `sections.js` 의 `anchor` 는 같은 값이다.
- **논문 외 설명**: 배경 지식·비유·장난감 예시에는 `논문 외` 표시. 표시 없는 문장은
  모두 원문에서 앵커를 찾을 수 있어야 한다.
- **측정과 주장**: 결과 섹션에서 `측정` / `저자 주장` 태그로 가른다.
- **수식**: `$...$` · `$$...$$`. KaTeX 가 MathML 로 렌더한다. 수식마다 기호 표.
- **용어**: 영어 원문. 정착 번역어만 첫 등장에 괄호 병기.
- **문체**: `korean-report-style` 의 -다체 설명문.
- **움직임**: 위치·순서·인과를 보여 줄 때만. `prefers-reduced-motion` 에서 꺼져도 내용은
  다 보여야 한다.

## 4. 쓰고 나서 확인

- [ ] `check.py` 통과
- [ ] 앵커 없는 수치 — 페이지마다 `grep -oE '[0-9]+\.[0-9]+' ` 로 훑고 `.src` 가 붙었나
- [ ] 논문에 없는 고유명사 — 데이터셋·모델 이름을 `grep -i` 로 `paper.txt` 에서
- [ ] 합치거나 뺀 섹션이 Overview `읽는 법` 에 적혔나
- [ ] 모든 수식에 기호 표가 있나. 단계 풀이의 단계 수 = 설명 수인가
- [ ] 앞에서/다음에서가 실제 앞뒤 페이지와 맞나 (섹션을 합친 뒤 특히)

## 5. 다른 스킬과의 관계

- `paper-tutor` — 원문 추출과 앵커 규약. 노트·용어집·퀴즈는 그쪽. 용어집이 있으면
  해설 페이지에서 처음 나오는 용어를 그 항목과 같은 뜻으로 쓴다.
- `korean-report-style` — 문체.
- `mermaid-diagram` — 아키텍처가 복잡해 HTML/SVG 로 손수 그리기 어려울 때 SVG 로 렌더해
  페이지에 넣는다. 단계 풀이가 필요하면 손수 그린 SVG 가 낫다.

## 6. 참고 파일

- `references/structure.md` — 섹션 나누기 · 흐름 단계 정하기 · 확인받을 초안 형식
- `references/page.md` — Overview · 챕터 · 섹션 페이지 구성과 본문 규칙
- `references/motion.md` — 자동 움직임 목록 · 단계 풀이 · 기호 연동 · 쓰지 않는 것
- `assets/common/site.css` · `site.js` — 공용 스타일과 동작
- `assets/templates/` — `sections.js` · `index.html` · `section.html`
- `assets/check.py` — 사이트 전체 브라우저 검사
