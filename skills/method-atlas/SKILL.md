---
name: method-atlas
description: Build a Korean interactive comparison page for one problem and the methods that address it (e.g. Text2SPARQL hallucination reduction → schema retrieval, entity linking, placeholder queries, validation loops). One shared example question runs through every method. For each method the page shows a mechanism diagram (C4-style SVG with numbered steps and the build-time boundary), a step-by-step input → output strip, a worked example with with/without results, pros and cons of using vs not using it, its limit, classification chips on shared axes (structure + operations), and relations to other methods (prerequisite · follow-up · complement · alternative · conflict · shared resource). Around that sit a filter board (OR within an axis, AND across axes), a side-by-side compare tab that marks identical rows, a summary matrix, a sources tab (per paper or system: problem, core parts, claim, methods it uses, limits) and a searchable glossary. Use whenever the user asks to 기법 비교 페이지 · 방법론 비교 · 해결 방법들 정리 · 이 문제 푸는 방법 비교 · 환각 줄이는 기법 정리 · 접근법 지도 · 논문 여러 편의 기법을 한 축으로 비교 · Text2SPARQL 기법 비교처럼, or hands over several papers/systems that attack the same problem and wants them laid out side by side. For one paper explained chapter by chapter use paper-explainer; for a single tool use tool-study-deck.
---

# 기법 비교 지도 (method-atlas)

해결하려는 문제 하나(a)와, a 를 푸는 기법 여러 개를 **같은 예시 질문 · 같은 분류 축**으로 놓고 비교하는
한 장짜리 인터랙티브 페이지를 만든다. 기준 예시는 `examples/text2sparql.data.js`
(Text2SPARQL 환각 감소, 기법 T1–T10, 논문 3편)다. 처음 만들 때는 이 파일을 열어 형식과 문장 수준을 맞춘다.
근거가 논문이 아니라 공식 문서 · 패턴 카탈로그이고 LLM 이 없는 주제라면 `examples/spring-consistency.data.js`
(Spring 서비스 간 데이터 일관성 — outbox · saga · 멱등 소비자 등)를 본다. 개입 지점 축, 구조도 범례 이름, 근거 탭 이름을 주제에 맞게 바꾼 예다.

페이지는 **데이터 파일 하나**(`window.PAGE = {...}`)만 새로 쓰고, 엔진(`assets/engine.js` · `engine.css`)은
고치지 않는다. 빌드하면 단일 HTML 이 나와 Artifact 로 게시하거나 file:// 로 연다.

| 단계 | 산출 | 형식은 |
|---|---|---|
| 1. 문제 · 근거 | 문제 정의 한 줄, 근거 목록(논문 · 문서 · 시스템), 공통 예시 질문 | §2 |
| 2. 기법 목록 · 축 | 기법 id(T1…) · 이름, 분류 축 두 묶음, 개입 시점 판정 기준 | `references/axes.md` |
| 3. 기법별 기록 | 기법마다 아홉 칸(아래 표) | `references/anatomy.md`, `references/data.md` |
| 4. 관계 · 용어집 | `rel`, `glossary` | `references/axes.md` §관계 |
| 5. 빌드 · 검사 · 게시 | `<key>.html`, 검사 통과, Artifact | §5 |

산출 위치: 논문 기반이면 `papers/<key>/atlas/`(`<key>` 는 주제 slug, 예 `text2sparql-halluc`), 아니면 사용자가 정한 곳.
`<key>.data.js` 와 빌드된 `<key>.html` 을 둔다.

---

## 1. 페이지 구조 (요약 — 자세히는 `references/anatomy.md`)

```
머리     제목 · 한 줄 설명(필터 규칙 포함) · 공통 예시 질문 · 색 범례 · 보기 스위치(흐름 지도 · 조합 · 간략 상세)
흐름 지도  문제를 쪼갠 축 × 개입 시점 격자에 기법 배치, 올리면 한계 「→」 로 이어진 기법 강조 (map)
필터 보드  구조 분류 축 | 운영 요건 축 — 칩마다 해당 개수, 같은 축 OR · 축 사이 AND, 판정 기준 각주
작업 영역  왼쪽: 기법 카드 목록(한 줄 요약, 비교 체크) · 오른쪽: 탭
  상세     ① 머리: id · 개입 시점 · 이름 · 근거 배지 · 한 줄 요약 · 원문 정의(출처)
           ② 작동 방식: 구조도(SVG, 번호 간선, 「사전 구축」 점선 경계) + 번호 단계 설명 + 사전 구축 한 줄
           ③ 단계별 입출력 (접힘): 검색 키 → 처리 → 출처 → 조회 결과 → 반영 위치, 실제 값이 든 상자
           ④ 예시 (접힘): 예시 데이터 → ①②③ 소단계 → 「없음 / 있음 / 있지만 실패」 결과 비교표 → 막지 못하는 것
           ⑤ 장단점 · 한계: 사용/미사용 × 장점/단점 2×2 표 (근거 괄호) + 한계 한 줄 (→ 그 한계를 푸는 기법)
           ⑥ 분류 · 운영 요건: 축별 칩 + 이 기법에 대한 설명
           ⑦ 연관 기법: 선행 · 후속 · 보완 · 대체 · 충돌 · 자원 공유 (누르면 이동)
  비교     체크한 기법을 열로, 값이 모두 같은 행에 「같음」 표시 → 표시 없는 행이 차이
  요약 행렬  모든 기법 × 구조 축, 필터 미해당 행은 흐리게
  조합     함께 쓰는 묶음마다 축 값별 막힘 / 남음 자동 표 + 남는 위험 · 드는 것 (combos)
  논문     근거별 비교표 + 카드(문제 · 핵심 구조 · 주장 · 쓰는 기법 ●/○ · 기법별 적용 · 한계)
  용어집   묶음별 표(용어 · 뜻 · 출처), 검색
바닥     근거 링크 · 분류가 누구의 판정인지 · 표기(‡ 추론, * 작명) · 예시 어휘가 가상이라는 고지
```

## 2. 문제 · 근거 · 공통 예시

- **문제 a 는 한 문장**으로, 실패 모양이 보이게 쓴다 (「LLM 이 KG 에 없는 IRI · property 를 지어내 쿼리가 빈 결과를 낸다」).
- 근거는 1차 자료만: 논문(원문 PDF · arXiv), 공식 문서, 저장소. 사용자가 노트(ClickUp 등)를 주면 그것이 1차 정리이고,
  수치 · 용어는 원문으로 한 번 더 확인한다. 논문을 읽어야 하면 paper-tutor 의 `pdftext.py` 로 page 앵커를 붙여 뽑는다.
- **공통 예시 질문 하나**를 정해 모든 기법의 구조도 · 입출력 · 예시가 같은 질문을 따라가게 한다. 고르는 기준:
  여러 기법의 실패가 다 드러나는 질문(개체 연결 + 관계 방향 + 속성 이름이 다 걸리는 「서울에 있는 대학의 설립 연도는?」).
  예시 데이터는 작은 가상 어휘(`ex:`)로 만들고 바닥에 가상이라고 적는다.
- 기법 이름은 원문 용어를 쓰고, 원문에 없는 작명은 이름 뒤에 `*`, 원문에서 확인하지 않은 판정은 `‡` 를 붙인다.

## 3. 기법별 기록 — 아홉 칸

| 칸 | 데이터 키 | 답하는 질문 |
|---|---|---|
| 한 줄 요약 | `one` | 무엇을 어디에 넣는가 (목록 카드 · 비교표 첫 행) |
| 원문 정의 | `def` | 원문은 어떻게 부르고 정의하나 (식이 있으면 `formula`) |
| 작동 방식 | `diagram` | 무엇이 무엇을 부르고, 무엇이 미리 만들어져 있나 |
| 단계별 입출력 | `flow` | 각 단계에 실제로 들어가고 나오는 값은 |
| 예시 | `ex` | 공통 질문에서 쓰면 / 안 쓰면 쿼리 · 결과가 어떻게 다른가 |
| 장단점 | `pc` | 쓸 때와 안 쓸 때 각각 얻고 잃는 것 (근거 수치 괄호) |
| 한계 | `limit` | 이 기법이 막지 못하는 것, 그것을 맡는 기법 (→ Tn) |
| 분류 · 운영 | `v`, `notes`, `badges` | 축 위에서 어디에 있나, 도입 · 운영 비용 |
| 관계 | `rel` | 무엇이 먼저 있어야 하고, 무엇과 겹치거나 부딪히나 |

작성 규칙 (전체는 `references/anatomy.md`):

- **같은 기법의 구조도 · 입출력 · 예시는 같은 값**을 쓴다. 구조도 노드 설명의 `?u ex:locatedIn ex:Seoul` 이 예시 표에도 그대로 나온다.
- 예시의 결과 비교표에는 「있음, 그런데 실패」 행을 넣을 수 있으면 넣는다. 기법의 약점이 가장 잘 보이는 자리다.
- 장단점 · 한계의 수치는 출처를 괄호로 단다 (`(PGMR: 75.42% → 8.71%)`). 출처 없는 수치는 쓰지 않는다.
- 한계 문장은 다른 기법으로 이어지게 끝낸다 (`… 보장은 없다 (→ T5).`). 이 화살표들이 기법 사이의 흐름이 된다.
- 문장은 korean-report-style 의 보고체(「~한다」 평서 종결, 도입 예고 · 맺음 훈계 없음)를 따른다.
- 처음 보는 사람이 모를 용어는 용어집에 넣고, 본문에서는 처음 나올 때 tooltip(`<span class="tt" tabindex="0" data-tip="뜻">용어</span>`)을 단다 (`ex.html` 안).

- 예시를 실제로 돌릴 수 있으면(라이브러리 · 프레임워크 기법) 돌린 출력을 넣고 `.run` 블록으로 구별한다 (`references/data.md` §실제 실행 출력). 한 기법씩 넓힌다.

## 4. 축 · 관계

`references/axes.md` 를 따른다. 요점:

- 축은 두 묶음이다 — **구조 분류**(기법이 무엇을 · 어디서 · 어떻게 · 언제: 사전 구축 · 출처 · 조회 대상 · 처리 방식 · 개입 시점)와
  **운영 요건**(도입하는 사람이 묻는 것: 에이전트 필요 여부 · 관리자 부담 · 데이터 변경 시 · 근거).
- 축마다 옵션 3~6개, 한 기법이 여러 값을 가질 수 있다. 「없음」 옵션을 둬 빈칸을 없앤다.
- 핵심 축 하나(보통 **개입 시점** Pre · Mid · Post)가 색을 정한다. 그 기준을 필터 보드 각주(`criterion`)에 문장으로 적는다.
- 관계는 한쪽에만 적으면 엔진이 반대쪽을 채운다 (선행 → 후속, 보완 · 대체 · 충돌 · 자원 공유는 양쪽).

## 5. 빌드 · 검사 · 게시

```bash
python3 <스킬경로>/assets/build.py papers/<key>/atlas/<key>.data.js        # → <key>.html
python3 <스킬경로>/assets/check.py papers/<key>/atlas/<key>.html --shot papers/<key>/atlas/shots
```

- `check.py` 는 데이터(축 값 범위, 빈 칸, 관계 · 근거 · 구조도 노드 참조, 구조도 번호 수 = 단계 설명 수)와 화면(기법마다 상세가
  그려지나, 탭, 필터, 콘솔 오류, 1280 · 390px 가로 스크롤)을 본다. 실패가 0 이 될 때까지 고친다.
- 스크린숏을 열어 구조도의 간선이 상자를 가로지르지 않는지 본다. 가로지르면 노드 `c` · `r` 이나 간선 `route` 를 바꾼다.
- 게시는 Artifact(`file_path` = 빌드된 html). 기존 페이지를 고치는 것이면 그 URL 로 다시 게시한다.
- 새로 쓴 화면 문구는 게시 전에 용어집 표기와 대조한다.

## 6. 사용자에게 먼저 물을 것 (맡긴다고 하면 기본값)

| 항목 | 기본값 |
|---|---|
| 기법 단위 | 근거에서 「다른 기법과 따로 켜고 끌 수 있는 단위」. 논문 하나가 여러 기법을 쓰면 나눈다 |
| 기법 수 | 6~12. 넘으면 같은 축 값을 가진 것끼리 합친다 |
| 공통 예시 | §2 기준으로 골라 한 줄로 제안 |
| 근거 탭 이름 | 근거가 논문이면 「논문」, 시스템 · 제품이면 `labels.source` 를 「시스템」 등으로 |
