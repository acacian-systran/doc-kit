# reading-vocab 스펙 (v0.2)

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
| 1 | 이름 | `reading-vocab`. `paper-quizlet` → `paper-vocab`(Anki 지원) → `reading-vocab`(책 원문 지원, v0.2) |
| 2 | 단어 종류 | A 전문 용어 · B 뜻이 바뀌는 학술 어휘 · C 학술 표현 · W 일반 어휘 |
| 3 | 카드 방향 | 영어 → 한국어 |
| 4 | 뒷면 | 뜻 + 예문 + 앵커. `--no-example` 로 뜻만 (Quizlet 쓰기 모드용) |
| 5 | 카드 수 | 상한 없음. 행 순서가 우선순위 |
| 6 | 세트 단위 | 논문당 한 세트. 책은 장마다 한 세트 (v0.2) |
| 7 | 기본 분야 | AI·머신러닝 (NLP·RAG 포함) |
| 8 | 수준 기준 | 수준 테스트(zipf 5구간 × 5문제, 4/5 이상 통과). 없으면 zipf 5.0. **W 에만 적용** |
| 9 | 학습 결과 반영 | Quizlet 틀린 단어 붙여넣기. 2회 연속 정답 → known, 오답 → hard |
| 10 | 원본 형식 | `cards.csv` (열 분리). 앱 파일은 `export.py` 산출 |
| 11 | 책 원문 (v0.2) | 장별 Markdown. `mdtext.py` 로 평문화, 앵커는 `ch06 §제목` |
| 12 | 장 사이 중복 (v0.2) | `filter --seen` 이 같은 책 다른 장 덱의 표제어를 `drop(seen:chNN)` 으로 판정. 다른 뜻이면 남긴다 |

v0.2 에서 책을 별도 스킬로 떼지 않고 이름만 `reading-vocab` 으로 바꾼 이유: 달라지는 것은
원문 형식과 앵커뿐이고, 책을 떼면 known 목록이 둘로 갈린다. 산출물 루트 `papers/` 는
`paper-tutor` · `paper-lab` 과 공유하므로 그대로 두고, 책도 `papers/<key>/` 에 둔다.
Anki 덱 접두어는 `Vocab::` 에서 `Vocab::` 으로 바꿨다(실사용 덱이 생기기 전).

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
| `assets/known.py` | `sample` · `filter`(`--seen`) · `update` · `level` |
| `assets/mdtext.py` | 장별 Markdown → 제목 앵커 달린 평문 (v0.2) |

## 9. 완성 확인

- [x] `export.py` 가 A · B · C · W 샘플로 세 파일을 만들고, `quizlet.txt` 각 줄에 탭이 하나
- [x] `anki.txt` 헤더가 덱 · 노트 유형 · 태그 열을 지정
- [x] `known.py update` 2회 연속 정답에서 known 이동, 오답에서 hard 이동과 known 해제
- [x] `known.py filter` 가 hard · known · level 판정을 구분
- [ ] Quizlet · Anki 에 실제로 가져와 확인
- [ ] 실제 논문 한 편으로 `level` → `cards` → `result` 한 바퀴
- [x] 실제 책 한 권(*Evals for AI Engineers*, 0~12장)으로 `level` → `cards`. 2,033장. `result` 는 아직
- [x] `mdtext.py` 가 *Evals for AI Engineers* 13개 장에서 frontmatter · 코드 · 이미지 캡션을 지우고 제목 앵커를 단다
- [x] `export.py` 가 `vocab/<unit>/cards.csv` 에서 덱 `Vocab::<key>::<unit>` 을 쓰고, `known.py filter --seen` 이 다른 장 표제어를 뺀다
