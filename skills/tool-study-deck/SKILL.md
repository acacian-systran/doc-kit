---
name: tool-study-deck
description: Make a Korean study deck about a software tool (a reasoner, validator, linter, library, CLI — e.g. HermiT, OOPS!, SHACL, Protégé) whose every on-screen result comes from actually running the tool in an isolated environment, not from the model's memory. Four steps — sources (primary papers and docs with a short fact table), lab (one running domain example such as an airport ontology, 4–8 small scenes each run and logged), storyboard (a fixed 12–16 slide skeleton — what it is → before/after → what it answers → error signals → reading results → surprises → how it works → comparison → roles next to sibling tools → workflow → Common Language), deck (a Slides artifact with shape-first slides and read-aloud speaker notes). Use whenever the user asks to 도구 학습 슬라이드 · 스터디 발표 자료 · 이 도구 설명 덱 · OOPS 슬라이드처럼 · 추론기 소개 발표 · 툴 소개 슬라이드 · 예시로 보여주는 발표 · make study slides about this tool, or pastes another person's tool-explainer slides and asks how to make one like it. For a paper or book chapter as the subject, use paper-explainer or paper-tutor instead.
---

# 도구 학습 덱

소프트웨어 도구 하나를 처음 보는 사람(개발 회사의 비개발자 포함)에게 소개하는 발표 덱을 만든다.
규칙은 하나다 — **화면에 나오는 결과는 모두 실제로 돌려서 얻은 것이다.** 도구 덱이 틀리는
가장 흔한 방식은 모델이 그럴듯한 출력을 지어내는 것이고, 이미지 생성 모델로 만든 덱은 여기에
더해 그림 속 글자를 고칠 수 없다.

| 단계 | 산출 (`papers/<key>/` 아래) | 형식은 |
|---|---|---|
| 1. sources | `deck/sources.md` | §2 |
| 2. lab | `lab/` (격리 환경, `examples/*.py`, `examples/*.out`) | `references/lab.md` |
| 3. storyboard | `deck/glossary.md`, 슬라이드 목록 | `references/storyboard.md` |
| 4. deck | `deck/style.md`, Slides 아티팩트 + `deck/project/` | `references/deck.md` |

`<key>` 는 대표 논문이 있으면 그 citekey(`glimm-2014-hermit`), 없으면 도구 이름(`oops`).
paper-tutor · paper-lab 과 같은 루트를 쓰므로 논문 공부가 이미 있으면 그 폴더에 `lab/` · `deck/`
를 더한다.

---

## 1. 시작 전에 정할 것

사용자가 "맡긴다"고 했으면 아래 기본값으로 진행하고 끝에 한 줄로 알린다.

| 항목 | 기본값 |
|---|---|
| 청중 | 개발자 + 개발 회사의 비개발자 |
| 분량 | 12~16장, 장당 대본 약 1분 |
| 예시 영역 | 짝이 되는 덱이 있으면 그 영역(OOPS 덱이 항공이면 항공), 없으면 일상적인 영역 하나 |
| 형식 | Slides 아티팩트(도형·글자는 HTML). 이미지 생성은 쓰지 않는다 — API 비용이 들고 한글이 깨진다 |
| 디자인 | 덱마다 새로 정한다 — 예시 영역의 시각 언어(`references/deck.md` 디자인 방향). 다른 시리즈의 색·서체를 가져오지 않는다. 사용자가 기본 디자인 시스템을 지정해 두었으면 그것 |

사용자가 남의 덱 사진을 보여 주면 먼저 그 덱의 **뼈대(장별 역할)와 고정 요소(예시 영역, 반복
배치)**를 표로 뽑아 보여 주고, 사실이 부정확한 곳이 있으면 한 줄로 짚는다. 질문형 제목처럼
사용자가 거절해 온 형식은 따라 하지 않는다.

## 2. sources — 근거부터

- 1차 자료만: 도구의 대표 논문, 공식 문서, 배포물 안의 README·MANIFEST(버전).
  웹 검색은 사실 확인용이고, 찾은 사실은 출처 URL과 함께 표 한 줄로 적는다.
- `deck/sources.md` 는 세 칸이다: **1차 자료**(키 · 자료 · 쓴 곳), **실행 결과**(lab 장면별 한 줄),
  **일반 지식으로 쓴 것**(출처 확인 권장). 세 번째 칸에 들어간 문장은 대본에서 단정하지 않는다.
- 비교 대상 도구(경쟁 도구, 짝 도구)의 사실도 여기서 확인한다. 수치(속도, 규모)는 출처가 있는 것만.

## 3. lab — 돌려 보고 적는다

`references/lab.md` 를 따른다. 요점:

- 도구는 프로젝트 안 격리 환경(`lab/.venv`, 필요하면 Java·Node)에 설치하고 버전을 적는다.
- 예시 영역 하나로 4~8개 장면을 만든다. 장면마다 **적은 것 → 실행 → 관찰한 것**을 출력한다.
- 장면은 세 종류를 섞는다: 도구가 잘하는 것(정상 동작), 오류 신호(도구가 잡는 실수),
  **처음 쓰는 사람이 놀라는 결과**(기본 가정 때문에 생기는 의외의 동작). 세 번째가 덱의 가치다.
- 예상과 다른 출력이 나오면 덱을 예상에 맞추지 말고 출력에 맞춘다. 확인이 애매하면 CLI의
  다른 경로(함의 검사 등)로 한 번 더 확인한다.
- 화면에 넣을 코드 조각은 실제로 한 번 돌려 본다.

## 4. storyboard

`references/storyboard.md` 의 뼈대에 lab 장면을 배치하고 `deck/glossary.md` 를 만든다.
용어는 `English (한글 풀이)` — 한글은 **뜻**을 쓴다. 발음 표기(태블로, 트레이스)는 쓰지 않는다.
사용자가 확인 없이 진행하라고 하지 않았으면 슬라이드 목록(제목 + 한 줄)을 먼저 보여 준다.

## 5. deck

`references/deck.md` 의 공통 마크업·색 의미·대본 규칙으로 Slides 아티팩트를 만든다.
Slides 타입 지침이 우선이다(파일 경로, 게시 순서, 세 장씩 게시). 원본 파일은
`papers/<key>/deck/project/` 에 두고 그 폴더를 `root` 로 게시한다.

게시 전 점검:

1. 화면의 모든 결과가 `sources.md` 실행 결과 표나 1차 자료 표에 있다.
2. 내가 만든 예시·그림은 노트 줄 끝에 `[발표자 예시: …]`, 실행하지 않은 것은 그렇다고 적었다.
3. 제목은 명사구, 질문형 없음. 대본에 발음 표기 없음, "왼쪽/오른쪽" 없음.
4. 같은 종류의 칸은 크기·내부 구조가 같다. 글자는 24px 이상.

## 6. 끝맺음

덱 링크, 장 목록 한 줄씩, `[발표자 예시]` 로 표시한 곳, 실행하지 않고 일반 지식으로 쓴 사실을
보고한다. 아티팩트는 비공개이므로 다른 사람이 보려면 Share 메뉴에서 공유해야 한다고 알린다.
