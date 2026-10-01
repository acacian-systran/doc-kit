# paper-vocab 스펙 (v0.1)

논문 한 편에서 **영어 단어**를 외우는 스킬. 개념 이해는 `paper-tutor` 가, 구현은
`paper-lab` 이 맡고, 이 스킬은 논문을 영어로 읽는 데 막히는 단어를 카드로 만든다.

상태: 구현 완료(2026-10-01). 동작의 기준은 `SKILL.md` 이고, 이 문서는 설계 근거 기록이다.

---

## 1. 한 문장 정의

논문을 받아 그 논문이 쓰는 뜻 하나만 담은 단어 카드를 만들고, Quizlet · Anki 로
내보내며, 아는 단어 목록을 학습 결과로 늘려 다음 논문의 덱을 줄인다.

## 2. 실패 방식과 중심 규약

| 실패 | 원인 | 막는 규약 |
|---|---|---|
| 논문과 다른 뜻을 외운다 (`novel` → 소설) | 사전 첫 뜻에서 출발 | 원문 문장을 먼저 찾고 그 문장에서 성립하는 뜻 하나만. 예문과 앵커를 카드에 붙여 대조 가능하게 |
| 아는 단어가 덱을 채운다 | 사용자 수준을 모름 | 수준 테스트로 W 기준을 정하고, 학습 결과로 `known.txt` 를 늘린다 |
| 앱을 바꾸면 덱을 다시 만든다 | 앱 형식으로 바로 씀 | 원본은 `cards.csv` 하나. 앱 파일은 스크립트가 만든다 |

## 3. 형태

**`paper-tutor` 와 별도 스킬.** 목적(개념 이해 대 영어 독해)과 산출(용어집 대 카드)이
다르고, 겹치는 것은 A 종류뿐이다. 합치면 "용어 정리"가 어느 쪽인지 갈리지 않고,
`paper-tutor` 가 더 커진다. 대신 `papers/<citekey>/` 루트와 `pdftext.py` 를 공유하고,
`study/glossary.md` 가 있으면 A 의 뜻을 거기에 맞춘다. `paper-lab` 과 같은 관계다.

## 4. 결정 사항 (확정)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 이름 | `paper-vocab`. 처음 이름은 `paper-quizlet` 이었으나 Anki 를 지원하며 바꿈 |
| 2 | 단어 종류 | A 전문 용어 · B 뜻이 바뀌는 학술 어휘 · C 학술 표현 · W 일반 어휘 |
| 3 | 카드 방향 | 영어 → 한국어 |
| 4 | 뒷면 | 뜻 + 예문 + 앵커. `--no-example` 로 뜻만 (Quizlet 쓰기 모드용) |
| 5 | 카드 수 | 상한 없음. 행 순서가 우선순위 |
| 6 | 세트 단위 | 논문당 한 세트 |
| 7 | 기본 분야 | AI·머신러닝 (NLP·RAG 포함) |
| 8 | 수준 기준 | 수준 테스트(zipf 5구간 × 5문제, 4/5 이상 통과). 없으면 zipf 5.0. **W 에만 적용** |
| 9 | 학습 결과 반영 | Quizlet 틀린 단어 붙여넣기. 2회 연속 정답 → known, 오답 → hard |
| 10 | 원본 형식 | `cards.csv` (열 분리). 앱 파일은 `export.py` 산출 |

## 5. 세 모드

- `cards` — 논문 → `cards.csv` → `quizlet.txt` · `anki.txt` · `cards.md`
- `level` — 처음 한 번. `known.py sample` 후보에서 구간당 5개를 골라 한 문제씩, 힌트 없음
- `result` — 붙여넣은 틀린 단어를 `missed.txt` 로 정리해 `known.py update`

수준 기준을 W 에만 적용하는 이유: A · B · C 는 빈도가 높아도(`attention`, `novel`,
`account for`) 논문 속 뜻이 일상 뜻과 달라 빼면 안 된다. 빈도는 뜻이 같을 때만 아는지를
예측한다.

빈도는 `wordfreq` 의 zipf 값을 쓴다. 로컬 라이브러리라 API 호출이 없고, `uv run --with`
로 임시 환경에서 받아 전역 설치가 없다.

## 6. 파일 배치

```
papers/
  level.txt · known.txt · hard.txt · stats.csv   # 모든 논문 공유
  <citekey>/
    study/                       # paper-tutor
    lab/                         # paper-lab
    vocab/                       # 이 스킬
      cards.csv                  # 원본
      quizlet.txt · anki.txt · cards.md
```

## 7. 범위 밖 (추후 확장)

- Anki 복습 기록 연동 (AnkiConnect. 간격 21일 이상 → known, 실패 3회 이상 → hard)
- 세션 안 대화형 퀴즈 (`stats.csv` 같은 규칙)
- 분야별 누적 덱, 양방향 카드, `.apkg` 직접 생성

## 8. 만들 파일

| 파일 | 내용 |
|---|---|
| `SKILL.md` | 세 모드의 절차와 형식 |
| `assets/export.py` | `cards.csv` → 앱 파일 세 개 |
| `assets/known.py` | `sample` · `filter` · `update` · `level` |

## 9. 완성 확인

- [x] `export.py` 가 A · B · C · W 샘플로 세 파일을 만들고, `quizlet.txt` 각 줄에 탭이 하나
- [x] `anki.txt` 헤더가 덱 · 노트 유형 · 태그 열을 지정
- [x] `known.py update` 2회 연속 정답에서 known 이동, 오답에서 hard 이동과 known 해제
- [x] `known.py filter` 가 hard · known · level 판정을 구분
- [ ] Quizlet · Anki 에 실제로 가져와 확인
- [ ] 실제 논문 한 편으로 `level` → `cards` → `result` 한 바퀴
