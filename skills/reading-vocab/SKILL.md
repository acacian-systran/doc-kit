---
name: reading-vocab
description: Turn an academic paper — or a technical book chapter in Markdown (O'Reilly · web clippings · Obsidian notes) — into a flashcard deck (Quizlet · Anki) whose meanings are the ones the source actually uses — technical terms kept as English headwords with a one-line definition, academic words whose in-text sense differs from the everyday sense, recurring academic phrases, and general words above the learner's level — each card carrying the source sentence and a page or section anchor. A book gets one deck per chapter, and a term already carded in another chapter is not repeated. Writes one source file (cards.csv) and exports it to Quizlet paste text, an Anki import file, and a review table. Keeps a shared known-word list that shrinks future decks, set by a one-time vocabulary level test and updated from pasted Quizlet results. Use whenever the user hands over a paper (PDF, arXiv link, or pasted text) or a book/chapter Markdown file or folder and asks for 단어장 · 단어 카드 · 퀴즐렛 · Quizlet · Anki · 논문 어휘 · 논문 단어 외우기 · 책 단어 · 원서 단어장 · 플래시카드 · flashcards, or asks for 어휘 수준 테스트 · 틀린 단어 반영 · 아는 단어 빼줘. For a prerequisite glossary or concept study, use paper-tutor instead.
---

# 논문 · 책 → 단어 카드 (Quizlet · Anki)

논문 한 편(또는 책 한 장)에서 **그 원문이 쓰는 뜻 하나**만 골라 카드로 만든다. 사전의 뜻을
나열하지 않는다. 뜻마다 원문 문장과 앵커(쪽 · 절)를 붙여, 카드의 뜻이 실제 쓰임과 맞는지
언제든 확인할 수 있게 한다.

아래에서 "논문"은 책의 한 장도 가리킨다. 책에만 해당하는 차이는 §2.1 에 모았다.

이 스킬이 실패하는 방식은 두 가지다.
1. 사전 첫 뜻을 그대로 적는다. (`novel` → 소설)
2. 이미 아는 단어로 카드를 채워 정작 막히는 단어가 묻힌다.

| 모드 | 언제 | 절 |
|---|---|---|
| `cards` | 논문을 주며 단어장·카드를 요청. 기본 모드 | §2 ~ §7 |
| `level` | 수준 테스트 요청, 또는 `papers/level.txt` 가 없는 채로 처음 `cards` 를 요청 | §8 |
| `result` | Quizlet 에서 틀린 단어를 붙여넣음 | §9 |

`level.txt` 가 없을 때 `cards` 를 요청받으면 "수준 테스트(25문제, 5분)를 먼저 할지, 기초
단어만 빼고 바로 만들지" 한 줄로 묻는다. 바로 만들기를 고르면 기본 기준(§3.3)으로 진행한다.

---

## 1. 입력과 기본값

| 항목 | 필수 | 없을 때 |
|---|---|---|
| 원문 — 논문 (PDF · arXiv 링크 · 붙여넣은 텍스트) 또는 책 (장별 Markdown 파일 · 그 폴더) | 예 | 요청한다 |
| 분야 | 아니오 | AI·머신러닝 (NLP·RAG 포함). 초록이 명백히 다른 분야면 그 분야로 하고 `cards.md` 머리에 적는다 |
| 카드 수 상한 | 아니오 | 없음. 기준에 걸리는 단어는 모두 넣는다 |
| 범위 (전체 · 특정 절 · 책이면 장) | 아니오 | 논문은 본문 전체, References · Appendix 는 뺀다. 책은 어느 장인지 묻는다. "전부"면 장 번호 순으로 한 장씩 만든다 |

카드는 **논문당 한 세트, 책은 장마다 한 세트**, 방향은 **영어 → 한국어**, 뒷면은 **뜻 + 예문 + 앵커(쪽 · 절)**이다.

## 2. 원문 확보

`paper-tutor` 와 같은 폴더와 추출기를 쓴다. 이미 `paper.txt` 가 있으면 다시 뽑지 않는다.

```
papers/
  level.txt · known.txt · hard.txt · stats.csv   # 모든 논문이 공유 (§8, §9)
  <citekey>/
    study/paper.pdf · paper.txt      # paper-tutor 와 공유
    vocab/
      cards.csv                      # 원본. 사람과 Claude 는 이 파일만 고친다
      quizlet.txt · anki.txt · cards.md   # export.py 가 만든다. 직접 고치지 않는다
```

추출기는 `paper-tutor` 의 것을 쓴다. 아래 경로에 파일이 없으면 `paper-tutor` 가 옮겨진 것이니
`~/.claude/skills` 에서 `pdftext.py` 를 찾아 쓰고 이 경로를 고치라고 사용자에게 알린다.

```bash
python3 ~/.claude/skills/paper-tutor/assets/pdftext.py paper.pdf --info
python3 ~/.claude/skills/paper-tutor/assets/pdftext.py paper.pdf      # [[p.N]] 앵커 포함
```

붙여넣은 텍스트에는 쪽 번호가 없으므로 앵커를 절 번호(`§3.2`)로 단다. 쪽 번호를 지어내지
않는다.

### 2.1 책 · Markdown 원문

장마다 Markdown 파일 하나인 책(O'Reilly 클리핑, Obsidian 노트 등)은 이 스킬의 `mdtext.py` 로
평문을 뽑는다. 쪽 번호가 없으므로 앵커는 **장 + 가장 가까운 제목**(`ch06 §Session Level`)이고,
추출기가 제목마다 `[[ch06 §...]]` 줄을 넣는다. 코드 블록 · 이미지 · 링크 주소 · frontmatter 는
지운다. 코드 안의 식별자는 카드로 만들지 않는다.

```bash
python3 <스킬경로>/assets/mdtext.py "<볼트>/6. Evaluating Multi-Turn Conversations.md" \
  > papers/<key>/study/ch06.txt
```

```
papers/<key>/                      # key = 제1저자성-연도-제목첫단어 (shankar-2026-evals)
  study/ch06.txt                   # mdtext.py 산출
  vocab/ch06/cards.csv             # 장마다 덱 하나. 내보내기 파일도 이 폴더에 생긴다
```

- **원문은 영어 단독 파일을 쓴다.** 같은 볼트에 번역을 섞은 사본이 있으면(본문 사이에 한국어
  문단) 영어 원본을 찾는다. 번역본은 뜻을 정할 근거가 아니다 — 대조용으로만 볼 수 있다.
- 파일 이름 앞 숫자가 장 번호가 된다(`6. ...md` → `ch06`). 숫자가 없으면 `--unit` 으로 준다.
- 장 사이 중복은 `filter --seen`(§3.3)으로 뺀다. 앞 장에서 이미 외운 카드를 다시 만들지 않는다.

## 3. 단어 고르기

### 3.1 네 종류

| 종류 | 무엇 | 예 | 카드 앞면 |
|---|---|---|---|
| **A. 전문 용어** | 분야 고유 개념 | embedding, ablation, perplexity | 영어 그대로 |
| **B. 뜻이 바뀌는 학술 어휘** | 일상 뜻과 논문 뜻이 다른 단어 | novel, robust, yield, marginal | 영어 + 품사 |
| **C. 학술 표현** | 단어보다 덩어리로 외울 구 | account for, be attributed to, to some extent | 구 전체 |
| **W. 일반 어휘** | 뜻은 그대로인데 사용자 수준보다 어려운 단어 | albeit, mitigate, plausible | 영어 + 품사 |

B 를 가장 공들여 찾는다. 아는 단어처럼 보여서 독자가 그냥 넘기다 해석을 틀리는 곳이다.

### 3.2 순서

상한이 없으므로 버리지 않고 **`cards.csv` 의 행 순서**로 우선순위를 나타낸다. 앞쪽부터
외우면 되게 한다.

1. `hard.txt` 에 있는 표제어
2. 논문의 핵심 주장·방법 설명에 나오는 단어 (초록 · 서론 마지막 문단 · 방법 절)
3. 논문 안에서 반복되는 단어 (`grep -oiw` 로 빈도를 센다)
4. 한 번만 나와도 그 문장을 오독하게 만드는 B 종류
5. 나머지

사용자가 상한을 말하면 5 → 4 → 3 → 2 순서로 버린다. 1 은 버리지 않는다.

### 3.3 빼는 것

후보를 한 줄에 하나씩 `cands.txt` 로 모아 판정을 받는다.

```bash
uv run -q --with wordfreq python <스킬경로>/assets/known.py --papers papers filter cands.txt
# 책이면 같은 책의 다른 장 덱과도 대조한다
uv run -q --with wordfreq python <스킬경로>/assets/known.py --papers papers filter cands.txt \
  --seen papers/<key>/vocab/ch06
```

| 판정 | 처리 |
|---|---|
| `keep(hard)` | 넣는다 |
| `drop(known)` | 뺀다 (종류 무관) |
| `drop(seen:ch02)` | 뺀다. 단, 이 장에서 **다른 뜻**으로 쓰이면 넣는다 (같은 표제어 · 다른 뜻은 §4 처럼 별개 카드) |
| `drop(level)` | **W 종류일 때만** 뺀다. A · B · C 는 빈도가 높아도 넣는다 — 논문 속 뜻이 다르기 때문이다 |
| `keep` | 넣는다 |

`level` 기준은 `papers/level.txt` 의 zipf 값이다. 없으면 5.0, 즉 가장 흔한 약 2천 단어만
아는 것으로 본다. `wordfreq` 는 `uv` 가 임시 환경에 받으므로 전역 설치가 필요 없다.

그 밖에 항상 빼는 것:
- 모델명 · 데이터셋명 · 저자명 · 기관명 같은 고유명사
- 수식 기호와 변수명
- 논문 안에서만 쓰는 약어 중 다시 안 나올 것 (단, 분야 표준 약어 BLEU · SOTA 등은 A 로 넣는다)

## 4. 뜻 정하기

- **해당 단어가 나오는 원문 문장을 먼저 찾고, 그 문장에서 성립하는 뜻을 적는다.** 사전
  뜻에서 출발하지 않는다.
- 뜻은 하나만 적는다. 같은 단어가 논문 안에서 두 가지로 쓰이면 카드 두 장으로 나눈다.
- A 종류는 한글 번역어보다 정의를 적는다. 번역어가 널리 쓰이면 괄호로 덧붙인다.
  예: `ablation` → 구성 요소를 하나씩 빼 보며 기여도를 재는 실험 (절제 실험)
- `study/glossary.md`(`paper-tutor` 의 prep 산출)가 있으면 A 종류의 뜻은 그 항목의
  `논문에서` 줄을 근거로 쓴다. 용어집과 카드의 뜻이 어긋나면 둘 중 하나는 틀린 것이다.
- 논문이 직접 정의한 용어는 논문의 정의를 따른다. 논문에 정의가 없어 분야 표준 정의를
  가져오면 뜻 끝에 `[논문 밖]` 을 붙인다.
- B 종류는 일상 뜻을 괄호로 함께 적어 대비시킨다.
  예: `novel (adj.)` → 새로운, 기존에 없던 (일상: 소설)

## 5. 카드 형식

### 5.1 원본 `cards.csv`

카드는 **`cards.csv` 하나에만 쓴다.** 앱별 파일은 모두 여기서 만들어지므로, 나중에 다른
앱으로 옮길 때 원본을 다시 만들 필요가 없다. 뜻 · 예문 · 앵커를 열로 나눠 두는 이유도 같다.
앱마다 뒷면을 조합하는 방식이 다르기 때문이다.

UTF-8, 첫 줄은 헤더, 쉼표가 든 값은 큰따옴표로 감싼다.

| 열 | 내용 |
|---|---|
| `kind` | `A` · `B` · `C` · `W` (§3.1) |
| `term` | 표제어. C 는 구 전체. 소문자 원형 |
| `pos` | 품사 (`adj.` 등). B · W 에만 채운다 |
| `meaning` | 논문 속 뜻 하나 |
| `everyday` | B 의 일상 뜻. 없으면 빈칸 |
| `outside` | 논문 밖 정의를 가져왔으면 `1` |
| `example` | 원문 예문, 30단어 이내 |
| `anchor` | `p.N` 또는 `§N.N` |

```csv
kind,term,pos,meaning,everyday,outside,example,anchor
B,novel,adj.,"새로운, 기존에 없던",소설,,"We propose a novel architecture based solely on attention.",p.1
A,ablation,,구성 요소를 하나씩 빼 보며 기여도를 재는 실험 (절제 실험),,1,"We perform an ablation over the number of heads.",p.8
C,account for,,(비율을) 차지하다,,,"Attention layers account for most of the compute.",p.6
```

### 5.2 내보내기

```bash
python3 <스킬경로>/assets/export.py papers/<citekey>/vocab/cards.csv              # 뜻 + 예문 + 앵커
python3 <스킬경로>/assets/export.py papers/<citekey>/vocab/cards.csv --no-example # 뜻만 (쓰기 모드용)
```

| 파일 | 용도 | 형식 |
|---|---|---|
| `quizlet.txt` | Quizlet 가져오기에 붙여넣기 | 앞뒤 구분 탭, 카드 구분 줄바꿈. 뒷면은 `뜻 ｜ "예문" ｜ 앵커` 한 줄 |
| `anki.txt` | Anki 파일 → 가져오기 | 헤더(`#separator:tab` · `#html:true` · `#notetype:Basic` · `#deck:Vocab::<citekey>` · `#tags column:3`) + 앞면 · HTML 뒷면 · 태그. 태그는 citekey 와 종류(`term`·`shifted`·`phrase`·`general`). 책은 덱이 `Vocab::<key>::ch06` 이고 태그에 장이 붙는다 |
| `cards.md` | 사람이 훑어보는 표 | 번호 · 종류 · 앞면 · 뜻 · 예문 · 앵커 |

스크립트가 탭과 줄바꿈을 공백으로 바꾸고, Anki 쪽은 HTML 이스케이프를 한다. 다른 앱이
필요해지면 `export.py` 에 함수 하나를 더한다. `cards.csv` 형식은 바꾸지 않는다.

## 6. 검수

산출 전에 아래를 확인하고, 실패한 카드는 고치거나 뺀다.

- [ ] 모든 카드에 앵커가 있고, 그 쪽(책은 그 제목 아래)에 예문이 실제로 있다 (`grep` 으로 대조)
- [ ] 뜻을 예문에 넣어 읽었을 때 문장이 성립한다
- [ ] 같은 표제어가 같은 뜻으로 두 번 나오지 않는다
- [ ] `drop(known)` 판정을 받은 표제어가 없고, `drop(level)` 을 받은 W 가 없다
- [ ] 책이면 `drop(seen:…)` 을 받고도 남긴 카드는 앞 장 카드와 뜻이 다르다
- [ ] `export.py` 가 오류 없이 끝났고, 출력한 장 수가 `cards.csv` 의 행 수와 같다
- [ ] `[논문 밖]` 표시가 필요한 카드에 빠짐없이 붙어 있다

## 7. 응답

채팅에는 카드 수(종류별), `vocab/` 경로, 가져오는 방법 두 줄만 적는다.
- Quizlet: 세트 만들기 → 가져오기 → `quizlet.txt` 내용 붙여넣기 (구분자: 탭 / 새 줄)
- Anki: 파일 → 가져오기 → `anki.txt` (덱·노트 유형·태그는 파일 헤더로 자동 지정)

카드 전체를 채팅에 다시 붙이지 않는다. 카드가 80장을 넘으면 "앞쪽부터 우선순위 순"이라고
한 줄 덧붙인다.

사용자가 "이건 알아", "이거 빼" 라고 하면 해당 표제어를 `papers/known.txt` 에 추가하고
`cards.csv` 에서 지운 뒤 `export.py` 를 다시 돌린다.

## 8. `level` — 수준 테스트

처음 한 번 W 종류의 기준을 정한다. A · B · C 에는 영향이 없다.

1. 빈도 구간별 후보를 뽑는다.
   ```bash
   uv run -q --with wordfreq python <스킬경로>/assets/known.py --papers papers sample
   ```
   구간은 zipf 5.0 이상 · 4.5 · 4.0 · 3.5 · 3.0 다섯 개이고, 구간마다 15개씩 나온다.
2. 구간마다 **5개**를 고른다. 속어(wanna) · 고어(hath) · 고유명사 · 굴절형만 다른 중복은
   피하고, 논문에 나올 법한 일반 어휘를 고른다.
3. 쉬운 구간부터 **한 문제씩** 낸다. 단어만 보여주고 한국어 뜻을 묻는다. 모르면 "모름"이라고
   답하라고 처음에 알린다. 힌트는 주지 않는다 — 기준이 부풀면 필요한 카드가 빠진다.
4. 채점: 핵심 뜻이 맞으면 정답, 품사만 다르거나 뜻이 넓으면 정답, 그 밖은 오답.
5. 기준: 위 구간부터 내려가며 **5개 중 4개 이상** 맞힌 마지막 구간의 하한. 5.0 구간부터
   4개 미만이면 `9.0`(아무것도 빼지 않음). 이전 구간에서 실패하면 그 아래는 보지 않고 멈춘다.
   ```bash
   python3 <스킬경로>/assets/known.py --papers papers level 4.0
   ```
6. 결과를 구간별 정답 수와 함께 한 줄로 알린다. 다시 테스트하면 `level.txt` 를 덮어쓴다.

## 9. `result` — Quizlet 결과 반영

Quizlet 은 학습 기록을 내보낼 수 없어서 사용자가 틀린 단어를 붙여넣는다.

1. 붙여넣은 내용에서 표제어만 추린다. Quizlet 결과는 앞면 · 뒷면이 섞여 오므로
   `cards.csv` 의 `term` 과 맞춰 본다. 어느 카드인지 모르겠는 줄은 사용자에게 묻는다.
2. 한 줄에 하나씩 `missed.txt` 로 쓰고 반영한다. 다 맞혔으면 빈 파일을 쓴다.
   ```bash
   python3 <스킬경로>/assets/known.py update papers/<citekey>/vocab/cards.csv missed.txt
   # 책: papers/<key>/vocab/ch06/cards.csv
   ```
3. 스크립트가 하는 일:
   - 틀린 표제어: 연속 정답 0 으로 되돌리고 `hard.txt` 에 넣는다. `known.txt` 에 있었으면 뺀다
   - 맞힌 표제어: 연속 정답 +1. **2회 연속**이면 `known.txt` 로 옮기고 `hard.txt` 에서 뺀다
4. 이 덱 자체는 다시 만들지 않는다. `known` 으로 옮겨진 단어는 다음 논문부터 빠진다.
   사용자가 이 덱에서도 빼 달라고 하면 `cards.csv` 에서 지우고 `export.py` 를 다시 돌린다.

---

## 추후 확장 (아직 구현하지 않음)

- **Anki 복습 기록 연동**: AnkiConnect 애드온(`localhost:8765`)으로 `deck:Vocab::*`
  카드의 복습 간격과 실패 횟수를 읽는다. 간격 21일 이상 → `known.txt`, 실패 3회 이상 →
  `hard.txt`. `known.py` 에 `anki` 하위 명령으로 넣는다.
- **세션 안 퀴즈**: 카드를 대화로 한 문제씩 내고 결과를 `stats.csv` 에 같은 규칙으로 쌓는다.
  `missed.txt` 를 만들어 `update` 를 그대로 쓰면 된다.
