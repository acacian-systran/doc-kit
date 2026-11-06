---
name: mermaid-diagram
description: Draw architecture, pipeline, sequence, state, ER and schedule diagrams as Mermaid source (.mmd) that renders natively in GitHub · Notion · mermaid.ai and to SVG via mermaid-cli, using a fixed Korean visual vocabulary — shape means storage kind, color means role — so structure reads before labels. Starts from a brief (diagram type + question + key elements, the prompt structure Mermaid AI recommends) so a request can be turned into a template fill-in. Use whenever the user wants a system diagram, data-flow or pipeline diagram, module or runtime/infra diagram, call sequence, state machine, ER diagram, gantt/일정표, or asks to 아키텍처 그림·다이어그램·구조도·플로우·순서도·상태도·ERD·mermaid·머메이드 를 그려달라, and when revising or reviewing existing .mmd files or ```mermaid blocks, or setting up a docs/diagrams directory. Also builds a 그림 읽는 법 page for people new to the vocabulary — every shape, color, line and container with its meaning, plus an optional tab on one diagram the user picks where hovering an item lights up only the boxes and lines that use it — when someone asks 이 그림 어떻게 읽어 · 기호 뜻 · 범례 · 그림 읽는 법 · 읽는 법 페이지 · legend. Also builds a web viewer for a whole diagram directory (list tree, zoom and pan, double-click a box to open the diagram that expands it, element info, per-diagram legend highlight, search) when someone asks 그림 뷰어 · 다이어그램 뷰어 · 그림 웹으로 보기 · 그림들 한 번에 둘러보기 · Structurizr 처럼. Provides the palette, six templates, the grammar with its parser pitfalls, a render script, the legend-page generator, the diagram viewer generator, and the conventions for the diagram directory's README.
---

# Mermaid 다이어그램

시스템 그림을 `.mmd` 소스로 그린다. GitHub · Notion · mermaid.ai 는 소스를 그대로 그리고,
문서에 박을 때는 mermaid-cli 로 SVG 를 뽑는다. 어휘는 한 벌로 고정한다 — **모양이 저장소의
종류를, 색이 역할을 말한다.** 라벨을 읽기 전에 구조가 먼저 보이게 하려는 것이다.

자재는 이 스킬 디렉터리에 있다.

| 파일 | 무엇 |
|---|---|
| `references/brief.md` | 요청 → 브리프(유형 + 질문 + 핵심 요소) → 템플릿. **그리기 전에 채운다** |
| `references/grammar.md` | 어휘 표, 배치 규칙, 그림을 언제 나누나, 유형별 문법 요점, **파서 함정 표** |
| `references/diagrams-readme.md` | 그림 디렉터리 README 에 무엇을 적나 |
| `assets/_palette.mmd` | classDef 한 벌. 각 그림 끝에 마커 블록으로 들어간다 |
| `assets/_template-flow.mmd` | 단계의 사슬. 기본형 |
| `assets/_template-container.mmd` | 중첩 경계 + elk. 상자 20개 이상 · 배포 경계가 여럿일 때 |
| `assets/_template-sequence.mmd` | 한 요청이 누구를 어떤 순서로 부르나 |
| `assets/_template-state.mmd` | 한 대상의 상태 전이 |
| `assets/_template-er.mmd` | 무엇이 무엇을 몇 개 갖나 |
| `assets/_template-gantt.mmd` | 무엇이 언제 돌고 무엇을 기다리나 |
| `assets/render.sh` | `.mmd` → `.svg`/`.png`, 마크다운의 펜스도. npx 로 mermaid-cli 를 부른다 |
| `assets/sync_palette.py` | 팔레트를 고쳤을 때 모든 그림에 다시 뿌린다 |
| `assets/mermaid.config.json` | 렌더 기본 설정 — base 테마 · 한글 글꼴 · 간트 색 |
| `assets/legend.html` | 그림 기호 읽는 법 — 기호 전체. 미리 만들어 둔 것. 처음 보는 사람에게 그대로 준다 |
| `assets/legend_page.py` | 읽는 법 페이지 생성기. 뜻은 grammar.md · 팔레트에서 읽는다. `--example` 로 예시 그림 탭을 더한다 |
| `assets/legend.template.html` | 위 페이지의 틀 |
| `assets/diagram_viewer.py` | 그림 디렉터리 하나를 둘러보는 뷰어(HTML 한 장) 생성기 |
| `assets/viewer.template.html` | 뷰어의 틀 |
| `assets/legend.shared.css` · `legend.shared.js` | 읽는 법 페이지와 뷰어가 함께 쓰는 스타일 · 그리기 도구. 두 생성기가 인라인한다 |

템플릿마다 `.svg` 가 옆에 있다. 파일을 열지 않고도 뼈대가 어떻게 생겼는지 볼 수 있다.

---

## 1. 브리프 — 시작 전 결정

`references/brief.md` 의 서식을 채운다. Mermaid AI 가 프롬프트를 **유형 + 주제 + 핵심
요소**로 쓰라고 하는 것과 같은 구조다. 채워지지 않는 칸이 되묻는 질문이다.

**답하는 질문을 한 문장으로 쓴다.** 두 문장이 되면 그림이 둘이다. 이 문장은 파일 머리말과
README 표에 그대로 들어간다.

**목표 상태(To-Be)인가 현재 상태(As-Is)인가.** To-Be 면 그림이 설계이고 구현보다 앞선다 —
갱신 의무가 없다. As-Is 면 갱신 의무가 생기고, 지킬 수 없으면 그리지 않는 편이 낫다.
`references/diagrams-readme.md`.

**어느 유형인가.** 브리프의 표로 고른다. "한 대상이 지나가는 순서"(flowchart · state)와
"한 실행이 도는 순서"(sequence)가 다르면 그림이 둘이다.

## 2. 디렉터리 세우기

```
docs/diagrams/
  _palette.mmd       # assets/_palette.mmd 복사
  README.md          # references/diagrams-readme.md 를 보고 작성
  <관점>/
    <이름>.mmd
    <이름>.svg
```

**색상값을 그림 파일에 직접 적지 않는다.** 새 뜻이 필요하면 `_palette.mmd` 에 클래스를
더하고 `sync_palette.py` 로 뿌린다. Mermaid 에 import 가 없어 각 그림 끝에 팔레트 블록이
복사돼 들어가는데, 마커(`%% palette:begin/end`) 사이는 손대지 않고 스크립트가 맞춘다.

## 3. 그리기

템플릿을 복사해 이름을 바꾸고 채운다. 그대로 렌더해도 예시 그림이 나온다.

- 축은 `==>`, 부수 흐름은 `-->`, 읽기·비동기는 `-.->`. 굵은 선만 따라가면 전체가 읽히게.
- 조건은 마름모(`{ }`)에 `filter` 색. 라벨의 괄호로 묶지 않는다.
- 실린더는 DB, 문서 모양은 파일, 육각형은 실행을 부르는 것. 모양 문법은 grammar.md 어휘 표.
- 설계가 아직 정하지 않은 자리는 `tbd`(붉은 점선). **구현 여부는 그리지 않는다** — 진척은
  README 의 "그린 시점" 절에 적는다.
- 컨테이너는 `subgraph` + `style`. 점선 = 논리 그룹, 실선 = 배포 경계.
- 판단의 근거는 그리지 않고 `%%` 주석에 근거 문서의 파일명과 절 번호로 남긴다.
- 자리표시자와 라벨에 `<>` 를 쓰지 않는다 — HTML 태그로 먹힌다. 「」를 쓴다.

어휘 표와 배치 규칙, 유형별 문법 요점은 `references/grammar.md` 에 있다. **그리기 전에
읽는다.** 파서 오류가 나면 그 문서 끝의 함정 표부터 본다.

## 4. 렌더

```bash
<스킬 경로>/assets/render.sh docs/diagrams/<관점>/<이름>.mmd          # 옆에 .svg
<스킬 경로>/assets/render.sh docs/diagrams/<관점>/<이름>.mmd out.png  # 2배 스케일 PNG
<스킬 경로>/assets/render.sh README.md                                 # ```mermaid 펜스 → svg
```

`render.sh` 는 `npx -p @mermaid-js/mermaid-cli mmdc` 를 부르므로 Node 만 있으면 된다. 첫
실행은 패키지를 내려받아 느리다. 렌더된 `.svg` 를 함께 커밋한다 — GitHub 은 소스를 그리지만
`layout: elk` 는 지원하지 않고, PDF · 위키 · 메일에는 렌더러가 없다.

**mermaid-cli 를 쓸 수 없는 환경이면** `.mmd` 소스만 쓰고, mermaid.ai 나 GitHub 프리뷰에
붙여 확인하라고 말한다. 렌더하지 않은 그림을 렌더했다고 하지 않는다.

마크다운 문서에 바로 넣을 때는 ```` ```mermaid ```` 펜스에 소스를 그대로 붙인다. 이때도
팔레트 블록을 함께 넣는다 — 안 넣으면 기본 테마의 보라색 상자가 나온다.

## 5. 렌더 후 확인

파싱 성공은 그림이 읽힌다는 뜻이 아니다. SVG 를 연다 (PNG 로 뽑아 Read 로 봐도 된다).

- 선이 다른 상자를 **관통하는가**. 관통하면 대개 배치가 아니라 인과를 건너뛴 것이다.
- 굵은 축만 따라가서 전체가 읽히는가.
- 라벨이 잘렸는가 (`<` 가 태그로 먹힌 것). `%%` 라벨의 빈 상자가 생겼는가 (내용 없는 주석 줄).
- 라벨을 가리고 봤을 때 색만으로 무엇이 거르는 단계이고 무엇이 비결정인지 보이는가.
- 컨테이너형: 배포 경계가 실선이고 논리 그룹이 점선인가. 각주가 대상 subgraph 안에 있는가.
- title 에 `&lt;` 가 보이면 frontmatter title 의 `<>` 를 지운다.

## 6. 문서에 얹기

README 의 "답하는 질문" 표에 줄을 더하고, 축의 뜻이 기본형과 다르면 그 뜻과 이유를 적는다.
그린 시점(날짜 + 기준 리비전)을 남긴다. `references/diagrams-readme.md`.

## 기존 .mmd · ```mermaid 블록을 고칠 때

브리프를 역으로 뽑는다 — 이 그림이 답하는 질문이 무엇인지 한 문장으로 쓰고, 안 되면
그림이 둘 이상 섞인 것이다. 인라인 `style` · 색상값이 박혀 있으면 팔레트 클래스로 옮긴다.
`linkStyle` 순번은 선의 종류(`==>` · `-->` · `-.->`)로 바꾼다.

## 7. 그림 읽는 법 페이지

이 어휘를 모르는 사람은 실린더 · 주황 · 점선이 무슨 뜻인지 모른다. 읽는 법 페이지가 그
설명을 맡는다. HTML 한 장이고, 뜻과 색은 손으로 옮겨 적지 않고 `grammar.md` 의 어휘 표와
`_palette.mmd` 에서 읽는다.

**기호 전체 — 스킬을 처음 보는 사람이 설명을 원할 때.** "이 그림 어떻게 읽어", "기호 뜻이
뭐야" 같은 질문이 오면 `assets/legend.html` 을 그대로 준다(아티팩트로 올리거나 파일로).
모양 · 색 · 선 · 묶음 전부와, 헷갈리는 짝(같은 바탕색을 무엇으로 가르나)이 들어 있다.
프로젝트가 팔레트에 클래스를 더했으면 그 팔레트로 다시 만든다.

```bash
python3 <스킬 경로>/assets/legend_page.py --palette docs/diagrams/_palette.mmd -o 그림-읽는-법.html
```

**예시 탭 — 예시 그림은 쓰는 사람이 고른다.** 어느 그림을 예로 들지 사용자에게 묻는다.
지금 보고 있는 그림이 있으면 그것을 기본값으로 제안한다. flowchart 만 받는다.

1. `--list` 로 그 그림에 쓰인 기호와 notes 키를 본다.
   ```bash
   python3 <스킬 경로>/assets/legend_page.py --example <디렉터리>/<이름>.mmd --list
   ```
2. notes JSON 을 쓴다 — `reading`(읽는 순서 3–6줄, 굵은 선 → 마름모 → 점선 → 색 순)과
   `items`(키마다 "이 그림에서 무엇이 그 기호인가" 한두 문장). 쓰지 않은 키는 노드 라벨
   나열로 채워진다. 문장은 그림의 근거(`%%` 주석 · 근거 문서)에 있는 것만 쓴다.
3. 렌더된 `.svg` 가 있어야 한다(`render.sh`). 만든다.
   ```bash
   python3 <스킬 경로>/assets/legend_page.py --example <이름>.mmd --notes notes.json -o <이름>-읽는-법.html
   ```

예시 탭에서는 항목에 마우스를 올리거나 누르면 그 기호를 쓴 노드와 선만 진하게 남고 나머지는
흐려진다. 그림에 없는 기호는 칩으로 따로 보인다. 스크립트가 경고(`! 팔레트에 없는 클래스`,
`! notes 의 키가 그림에 없음`)를 내면 고친 뒤 다시 만든다.

**먼저 제안하는 때.** 다음 때 한 줄로 제안한다 — "이 기호를 처음 보는 사람을 위한 읽는 법
페이지를 만들 수 있다(예시 그림은 고를 수 있다)."
- 한 프로젝트에서 처음으로 그림을 그려 넘길 때
- 그림 디렉터리를 세우거나 다른 사람에게 넘길 때

그림 디렉터리 README 에 이미 읽는 법 링크가 있으면 제안하지 않는다. 사용자가 한 번 거절하면
그 프로젝트에서 다시 제안하지 않는다. 만들었으면 README 의 "읽는 법" 절에 링크를 단다
(`references/diagrams-readme.md`).

## 8. 그림 뷰어

그림 디렉터리 하나를 웹에서 둘러보는 HTML 한 장이다. 그림이 여러 장이고 서로 이어져
있을 때(요약 → 펼침, 기법 → 기법) 쓴다. 렌더된 `.svg` 가 있는 그림만 들어간다.

```bash
python3 <스킬 경로>/assets/diagram_viewer.py <그림 디렉터리> -o <그림 디렉터리>/뷰어.html
```

| 자리 | 하는 일 |
|---|---|
| 왼쪽 목록 | 그림 나무. 요약 그림 아래에 그 상자를 펼친 그림이 달린다 |
| 가운데 | 그림. 휠로 확대, 끌어서 이동. 상자를 누르면 정보, `+` 표시가 있는 상자를 두 번 누르면 그 그림으로 들어간다. 위에 지나온 길 |
| 오른쪽 · 요소 | 누른 상자의 모양 · 색의 뜻, 들어갈 그림, 연결된 문서, 같은 라벨이 나오는 다른 그림 |
| 오른쪽 · 범례 | 이 그림에 쓰인 기호. 항목에 올리면 쓰인 곳만 켜진다 (7절과 같은 것) |
| 위 | 그림 제목 · 질문 · 상자 라벨 찾기, 기호 전체 |

**그림 사이의 연결은 따로 적지 않는다.** `.mmd` 에 이미 있는 것에서 뽑는다.
- `click <id> href "<경로>"` — 경로의 파일 이름이 디렉터리의 다른 그림(`X` 또는 `d-X`)과
  같으면 그 상자에서 그 그림으로 들어간다. 같은 그림이 없으면 "연결된 문서"로만 보인다.
- `%% 요약 그림 d-X 의 ② 상자를 펼친 것` — d-X 에서 라벨이 ② 로 시작하는 상자에서 들어간다.
  번호(①–⑳)가 라벨 맨 앞에 있어야 잡힌다.
- 파일 이름이 `d-X-stepK` 이고 주석이 없으면 목록에서 d-X 아래에 달기만 한다.

**"같은 라벨이 나오는 다른 그림"은 라벨 글자가 같을 때만 잡는다.** 그림마다 id 가 달라
같은 요소인지 알 수 없기 때문이다. flowchart 가 아닌 그림은 보기만 되고 요소 정보와
범례가 없다.

`.mmd` 를 고치면 다시 렌더하고 뷰어도 다시 만든다. 만든 뷰어는 그림 디렉터리 README 에
링크한다. 읽는 법 페이지(7절)를 제안하는 때에, 그림이 세 장 이상이면 뷰어도 함께 제안한다.
