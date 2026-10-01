---
name: paper-tutor
description: Study an academic paper in four modes — prep (a prerequisite glossary with English headwords, plain and standard explanations, and a self-check line per term), ask (Q&A answered only from the paper with page/section anchors, anything outside marked as such), read (a learner's note whose core is a walk-through of the mechanism, results kept apart from claims), and quiz (interactive, one question at a time, a hint before the answer, wrong answers logged for review). Use whenever the user hands over a paper as a PDF, an arXiv link, or pasted text and asks to 논문 공부 · 사전지식 · 용어 정리 · 이 논문 읽으려면 뭘 알아야 해 · 논문 질문 · 이 논문에서 X가 뭐야 · 논문 요약 · 논문 정리 · 논문 읽어줘 · 퀴즈 내 줘 · 내가 이해했나 확인 · explain this paper · quiz me on this paper. Replaces paper-review. Provides the page-anchored PDF extractor, the glossary/note/quiz/answer formats, and the extraction checklist by paper type.
---

# 논문 공부

논문 한 편을 네 모드로 공부한다. 어느 모드든 규칙은 하나다 —
**원문에 있는 것만 말하고, 없는 것은 없다고 말한다.** 설명이 논문보다 확신에 차는 것이
유일한 실패 방식이고, 그 확신은 앵커를 달 수 없는 문장에서 나온다.

| 모드 | 언제 | 산출 | 형식은 |
|---|---|---|---|
| `prep` | 읽기 전. 뭘 알아야 하나 | `glossary.md` | `references/prep.md` |
| `ask` | 읽는 중. 여기서 X 가 뭐야 | `qa.md` 에 누적 | `references/ask.md` |
| `read` | 읽은 뒤. 정리·요약·노트 | `note.md` | `references/read.md` |
| `quiz` | 읽은 뒤. 내가 이해했나 | 대화 + `quiz.md` 에 기록 | `references/quiz.md` |

권장 흐름은 prep → 읽기(+ask) → read → quiz → 오답 → glossary 재독이지만 강제하지
않는다. 퀴즈만 내 달라고 해도 된다.

---

## 1. 모드 고르기

사용자가 모드를 말하지 않으면 요청 문장으로 고른다.

| 요청에 있는 말 | 모드 |
|---|---|
| 뭘 알아야 · 용어 · 사전지식 · 배경 · 미리 | prep |
| 여기서 ~가 뭐야 · 저자들이 ~는 어떻게 · 이 표(그림·식)가 무슨 뜻 | ask |
| 정리 · 요약 · 읽어줘 · 노트 · 리뷰 | read |
| 퀴즈 · 확인 · 테스트 · 이해했나 · 물어봐 | quiz |
| 논문만 주고 아무 말 없음 | **한 줄로 묻는다.** 네 모드의 산출이 다르다 |

"이거 인용할 만해?" 처럼 판단을 물으면 모드 없이 대화로 3~5문장 답한다. 판단을
물었는데 노트가 오면 답이 어디 있는지 다시 찾아야 한다.

## 2. 원문 확보

### 2.1 파일 배치

```
papers/<citekey>/           # citekey = 제1저자성-연도-제목첫단어 (vaswani-2017-attention)
  study/                    # 이 스킬의 산출
    paper.pdf               # 있으면
    paper.txt               # pdftext.py 출력. [[p.N]] 앵커
    glossary.md · qa.md · note.md · quiz.md
  lab/                      # `paper-lab` 의 구현·실험. 이 스킬은 건드리지 않는다
  vocab/                    # `paper-vocab` 의 단어 카드. 이 스킬은 건드리지 않는다
```

사용자가 경로를 말하지 않으면 이 규칙으로 쓰고 경로를 알린다. 묻지 않는다.
`paper.txt` 가 이미 있으면 다시 뽑지 않는다 — 두 번 뽑으면 앵커가 어긋날 수 있다.

### 2.2 PDF

```bash
python3 <스킬경로>/assets/pdftext.py paper.pdf --info               # 먼저 진단
python3 <스킬경로>/assets/pdftext.py paper.pdf                      # paper.txt
python3 <스킬경로>/assets/pdftext.py paper.pdf --pages 8 --layout    # paper.p8.layout.txt
```

쪽마다 `[[p.N]]` 이 붙는다. 앵커는 여기서 가져온다 — 눈대중 쪽 번호는 검증할 수 없어
없느니만 못하다.

**표가 있는 쪽만 `--layout` 으로 따로 뽑는다.** 기본 추출은 표의 열을 무너뜨려 어느 값이
어느 행의 것인지 복원할 수 없는데, 읽으면 복원한 것 같은 착각이 든다. 반대로 2단 조판
산문에 `--layout` 을 쓰면 좌우 단이 한 줄에 붙는다. 산문은 기본값, 표 쪽만 `--layout`.

**그림·수식·스캔본은 Read 로 PDF 를 직접 본다.** `pdftotext` 는 그림 안 글자를 못 읽고
수식을 문자 나열로 뭉갠다(`√dk` 가 줄을 넘어 갈라진다). Read 의 `pages` 인자로 쪽을
지정한다. `--info` 가 "글자가 거의 없는 쪽" 으로 지목한 쪽이 대개 그 대상이다.

### 2.3 arXiv · 붙여넣은 텍스트

arXiv 는 `arxiv.org/pdf/<id>` 를 받는다. abs 는 초록 페이지다. HTML 판(ar5iv)이 있으면
표와 수식이 온전해 PDF 보다 낫다.

붙여넣은 텍스트는 쪽 번호가 없으므로 앵커를 절 제목으로 단다(`§3.2`). 없는 쪽 번호를
지어내지 않는다. 절 번호도 없으면 산출물 머리에 `앵커: 절 단위 불가` 를 적는다.

### 2.4 읽는 범위

본문 15쪽이 넘고 부록이 절반이면 본문만 읽는다. 대신 `읽은 범위: 본문 1-9쪽, 부록 미독`
을 적는다. 읽지 않은 것을 읽은 척하지 않는다.

## 3. 네 모드의 절차

형식·템플릿·채운 예시는 각 references 파일에 있다. **쓰기 전에 해당 파일을 읽는다.**
여기는 절차만.

### prep

1. 논문을 초록 → 방법 절 → 실험 절 순으로 훑어 용어를 모은다.
2. 두 부류로 가른다 — **prerequisite**(논문이 정의하지 않고 독자가 안다고 가정) /
   **introduced**(논문이 새로 정의하거나 자기 식으로 씀). prerequisite 가 본체다.
3. 10~20개로 자른다. 기준: "이걸 모르면 핵심 주장을 따라갈 수 없나".
4. **의존 순서**로 배열한다. 뒤 용어 설명이 앞 용어를 써도 되게. 알파벳 순 금지.
5. 항목마다 쉬운 설명 · 일반 설명 · 논문에서(앵커) · 한국어 · 점검 한 줄.
6. 표제어가 모두 원문에 있는지 `grep -i` 로 확인한다.

사용자가 배경을 말했으면("ML 은 알고 NLP 는 처음") 그 배경에서 당연한 용어는 뺀다.

### ask

1. `paper.txt` 에서 답의 근거를 찾는다. `grep -n -i` 가 빠르다.
2. 근거 절·표·쪽을 앵커로 달아 답한다. 원문 인용은 영어 그대로.
3. **논문에 없으면 "논문에 없다" 를 먼저 말한다.** 일반 지식으로 보충하면 `논문 밖:` 접두.
4. 논문이 모호하면 모호하다고 말한다. 저자가 안 한 결정을 대신 내리지 않는다.
5. glossary 가 있고 그 용어가 있으면 항목을 가리킨다.
6. 질문·답·앵커·날짜를 `qa.md` 에 덧붙인다.

### read

1. 초록 → 결론 → 그림과 표 → 방법 → 서론 순으로 읽는다. 서론은 저자의 프레이밍이라
   먼저 읽으면 결과를 저자가 보라는 대로 본다.
2. 수치는 산문이 아니라 표에서. 산문의 수치는 반올림되고 조건이 빠져 있다.
3. `references/read.md` 의 유형별 추출 항목을 확인하고 템플릿을 채운다.
4. **핵심 아이디어 절이 본체다.** 그림과 수식을 따라가며 입력이 어떻게 출력이 되는지
   설명한다. 분량 제한 없음. 나머지 절은 3~5문장.
5. 측정과 주장을 가른다. 결과 절에는 표에서 온 것만, 해석은 저자의 주장 절로.
6. 한계는 **저자가 밝힌 것** / **읽으며 든 의문** 으로 나눈다.

### quiz

1. 씨앗을 모은다 — glossary 의 `점검` 줄, note 의 `읽으며 든 의문`, 결과 표의 행.
2. 사실 · 이유 · 적용/비판 세 유형을 섞어 기본 5문제. 모든 문제에 정답과 앵커가
   있어야 한다. 원문으로 확인할 수 없는 문제는 내지 않는다.
3. **한 문제씩 낸다.** 사용자가 답하면 채점(맞음/부분/틀림). 부분은 무엇이 빠졌는지.
4. 틀리면 **정답 대신 힌트** — 다시 볼 절·표를 앵커로 준다. 두 번째도 틀리면 정답·해설·앵커.
5. 끝나면 오답이 몰린 개념을 짚고 glossary 의 어느 항목으로 돌아갈지 알린다.
6. 문제·정답·해설·앵커와 회차별 채점을 `quiz.md` 에 기록한다. 기록이 있으면 시작할 때
   "전에 틀린 것부터" 를 제안한다.

## 4. 공통 규약

- **앵커 없는 논문 주장을 쓰지 않는다.** `(Table 2, p.8)` · `(§3.2.1, p.4)` · `(Eq. 1, p.4)`.
  달 수 없으면 그 문장은 논문이 아니라 내가 만든 것이다.
- **논문에 없으면 없다고 쓴다.** `미보고` 가 빈칸이나 추정치보다 낫다. 추정은 `추정:` 접두.
- **측정과 주장을 가른다.** "EN-DE BLEU 28.4 (Table 2)" 는 측정, "구조가 단순해 병렬화가
  쉽다" 는 주장. 나란히 서면 독자는 둘 다 측정으로 읽는다.
- **수치를 다시 반올림하지 않는다.** 27.3 을 27 로 적으면 다른 논문과의 0.3 차이가 사라진다.
- **비교 조건이 다르면 그 사실이 결과의 일부다.** 같은 문장 안에 적는다.
- **고유명사(데이터셋·모델·지표)를 지어내지 않는다.** `grep -i '<이름>' paper.txt`.
- **용어는 영어 원문.** 표제어·본문·질문·답 모두 `scaled dot-product attention` 이다.
  정착된 한국어 번역어가 있으면 첫 등장에 괄호로 병기만 한다 — `attention(주의)`.
  억지 번역어는 검색을 막는다. `순전파망` 이 아니라 `feed-forward network`.
- **따옴표 안은 원문 그대로.** 번역했으면 따옴표를 떼고 `요지는 ~이다` 로 쓴다.
- **`pdftotext` 의 하이픈 오류.** `left-toright`, `pretraining` 같은 말이 나온다. 원문 그대로
  인용할 문장은 PDF 를 눈으로 확인한다.

문체는 `korean-report-style` — 파일에 남는 것은 -다체. 퀴즈·Q&A 의 **대화 자체**는
대화체로 하고 파일에 적을 때 문서체로 바꾼다.

## 5. 쓰고 나서 확인

- [ ] 앵커 없는 수치 — `grep -nE '[0-9]+([.,][0-9]+)?%?' <파일>` 로 한 줄씩
- [ ] 논문에 없는 고유명사·용어 — 표제어와 키워드를 `grep -i` 로 `paper.txt` 에서
- [ ] (read) 결과 절에 저자의 주장이 섞였나. 한계 절이 둘로 갈렸나
- [ ] (prep) prerequisite/introduced 가 갈렸나. 순서가 의존 순인가. 점검 줄이 있나
- [ ] (quiz) 유형 셋이 섞였나. 정답 앵커가 모두 있나
- [ ] (ask) 논문 밖 내용에 `논문 밖:` 이 붙었나
- [ ] 한국어 번역어가 표제어 자리를 차지했나
- [ ] 읽지 않은 범위를 적었나

## 6. 다른 스킬과의 관계

- **문체** — `korean-report-style`. 산출 파일은 보고 문서다.
- **HTML·PDF 산출** — `korean-report-doc`. 노트를 배포용으로 만들 때만. 파일 자체는
  마크다운으로 남긴다 — 나중에 grep 해서 다시 찾는다.
- **구조 그림** — `mermaid-diagram`. 아키텍처를 그려야 이해되는 논문일 때.

## 7. 참고 파일

- `references/prep.md` — 용어 선별 기준 · 항목 템플릿 · 채운 예시
- `references/ask.md` — 답변 형식 · "논문에 없다" 처리 · 로그 형식
- `references/read.md` — 노트 템플릿 · 채운 예시 · 유형별 추출 항목 · 의심할 자리
- `references/quiz.md` — 유형별 예시 문제 · 채점 규약 · 기록 형식
- `assets/pdftext.py` — `--info` · `--pages` · `--layout`
