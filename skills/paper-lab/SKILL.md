---
name: paper-lab
description: Implement and test a paper hands-on in five modes — gate (judge whether the paper is worth implementing at all, four verdicts, before any code is written), plan (break the paper into checkable claims with page anchors and fix the compute/cost budget), build (an isolated per-paper environment, the implementation, property tests, mini-overfit), run (scaled-down reproduction and ablation, each run snapshotting its config, seed, commit and model id), gap (rank the suspects behind a number that disagrees with the paper, cheapest to rule out first). Every decision the paper left unspecified is recorded in decisions.md instead of being buried in code. Use whenever the user wants to 논문 구현 · 논문 재현 · 직접 돌려보기 · 환경 만들어서 테스트 · 절제 실험 · ablation · 논문 수치가 안 맞아 · 이 논문 구현할 가치 있나 · implement this paper · reproduce this paper. Pairs with paper-tutor, which reads the paper; both share papers/<citekey>/. Provides the gate checklist, the verification ladder by paper type, the property-test catalogue, the run-snapshot script and the comparison-table generator.
---

# 논문 구현

논문 한 편을 다섯 모드로 구현해 확인한다. 어느 모드든 규칙은 하나다 —
**논문에 없어서 내가 정한 것을 기록한다.** 코드가 동작하고 수치가 산출되었다는 이유로
논문대로 구현되었다고 믿는 것이 유일한 실패 방식이고, 그 믿음은 어디를 메웠는지 모르는
구현에서 도출된다.

| 모드 | 언제 | 산출 | 형식은 |
|---|---|---|---|
| `gate` | 코드 이전. 구현할 가치가 있나 | `gate.md` | `references/gate.md` |
| `plan` | 게이트 통과 후. 무엇을 어디까지 | `claims.md` | `references/plan.md` |
| `build` | 환경·구현·성질 검사 (1~3칸) | `src/` `tests/` `decisions.md` | `references/build.md` |
| `run` | 축소 재현·절제 (4~5칸) | `runs/` `report.md` | `references/run.md` |
| `gap` | 수치가 어긋났을 때. 반복 진입 | `report.md` 갱신 | `references/gap.md` |

흐름은 gate → plan → build → run → (gap → run) 이고, `gate` 만 건너뛸 수 없다.

---

## 1. 모드 고르기

사용자가 모드를 말하지 않으면 요청 문장으로 고른다.

| 요청에 있는 말 | 모드 |
|---|---|
| 구현할 만해 · 해볼 가치 · 재현 가능해 · 판단해 줘 | gate |
| 뭘 확인할지 · 계획 · 예산 · 범위 | plan |
| 환경 · 구현 · 짜 줘 · 테스트 작성 | build |
| 돌려 · 실험 · 절제 · ablation · 축소 재현 | run |
| 수치가 안 맞아 · 왜 다르지 · 격차 · 재현이 안 돼 | gap |
| 논문만 주고 "구현해 줘" | **gate 부터 시작한다** |

`lab/gate.md` 가 이미 있으면 그 판정을 한 줄로 제시하고 다음 모드로 넘어간다. 판정이
`읽기만` 인데 구현을 요청하면 판정 근거를 제시하고 사용자의 결정을 받는다.

## 2. 게이트 선행

`gate` 없이 착수하면 이 스킬은 "구현해 봐" 의 다른 말이 된다. 판정 대상은 하나다 —
**내 예산 안에서 답이 분기할 수 있는 질문이 이 논문에 남아 있는가.**

판정은 넷이다. `구현` · `질문 교체` · `읽기만` · `보류`. 질문 아홉 개와 채운 예시는
`references/gate.md` 에 있다. 30분, 코드 없음.

`plan` 은 판정이 `구현` 또는 `질문 교체` 일 때만 시작한다.

## 3. 파일 배치

`paper-tutor` 와 루트를 공유한다. citekey 하나에 디렉터리 하나다.

```
papers/<citekey>/              # citekey = 제1저자성-연도-제목첫단어 (vaswani-2017-attention)
  study/                       # paper-tutor 의 산출. 읽기만 한다
  lab/                         # 이 스킬의 산출
    gate.md · claims.md · decisions.md · env.md · report.md
    pyproject.toml · uv.lock   # 논문마다 따로
    src/ · tests/ · configs/
    runs/<날짜>-<태그>/
```

사용자가 경로를 말하지 않으면 이 규칙으로 쓰고 경로를 알린다. 묻지 않는다.

**`papers/` 밖에 아무것도 기재하지 않는다.** 호스트 프로젝트의 `pyproject.toml`·
`requirements.txt`·`.gitignore` 를 수정하지 않는다. 무시 규칙은 `papers/.gitignore` 안에서
처리한다. `papers/` 가 없으면 `README.md` 와 `.gitignore` 를 함께 구축하고, 이미 있으면
내용을 확인한다. 다른 이름을 쓰기로 하면 그 루트의 `README.md` 머리에 경로를 기재한다.

**환경은 논문마다 격리한다.** 논문 A 가 torch 2.1, B 가 2.5 를 요구하는 경우가 흔하며,
루트에 venv 하나를 배치하면 두 번째 논문에서 첫 번째가 무너진다. 각 `lab/` 을 독립
프로젝트로 취급하고 그 디렉터리에서 `uv sync` 한다.

**`papers/_shared/` 를 작성하지 않는다.** 두 논문이 같은 유틸리티를 사용해도 복사한다.
공유하면 논문 A 를 위한 수정으로 논문 B 의 과거 run 이 재현 불가가 된다.

## 4. 사다리

칸마다 저렴하고 명확한 합격 조건이 있으며, 아래 칸이 통과되지 않으면 위로 오르지 않는다.
A형(모델·학습) 기준으로 1 형상 · 2 성질 · 3 미니 과적합 · 4 축소 학습 · 5 절제 ·
6 전체 재현이다. B형(LLM 파이프라인) · C형(시스템) · D형(이론)은 칸의 내용이 분기하며
`references/build.md` 에 표로 있다.

**성공의 정의는 5칸이다.** 논문 표의 절대 수치 일치는 대개 예산 밖이고 목적도 아니다.
절제가 논문과 같은 방향·같은 순서를 보이면 아이디어는 재현된 것으로 판정한다. 산출은
"재현 실패" 대신 "3칸까지 도달, 절제는 같은 방향, 절대 수치는 3.1 낮음" 이 된다.

## 5. 다섯 모드의 절차

형식·템플릿·채운 예시는 각 references 파일에 있다. **쓰기 전에 해당 파일을 읽는다.**

### gate

1. 논문 또는 `study/note.md` 를 읽고 가능성 질문 다섯 개를 매긴다.
2. 가치 질문 네 개를 매긴다. 가능해도 여기서 걸리면 구현하지 않는다.
3. 치명 빨강(데이터·환경 차단, 평가 재현 불가) 여부를 먼저 확인한다.
4. 나머지 빨강은 질문 교체가 성립하는지 검토한다.
5. 판정·예산·실제로 답할 질문 한 문장을 `gate.md` 에 기재한다.

### plan

1. 논문을 검증 가능한 주장 단위로 분해한다. 주장마다 앵커가 있어야 한다.
2. 주장마다 축소판에서 확인 가능한지 판정하고 불가한 것은 범위 밖으로 제외한다.
3. 예산을 확정한다 — GPU 시간, API 비용, 기한. 그 예산에서 오를 칸을 고른다.
4. `claims.md` 를 채운다. 열은 고정이다 — `compare.py` 가 이 표를 읽는다.

### build

1. `lab/` 에 독립 환경을 구축하고 버전·장치·시드를 `env.md` 에 기재한다.
2. 논문에 없는 결정을 만날 때마다 `decisions.md` 에 항목을 추가한다. 코드 주석에 남기지
   않는다 — 용의자 명단이 분산되면 `gap` 이 성립하지 않는다.
3. 수식이 함의하는 불변량을 `tests/` 로 옮긴다. 카탈로그는 `references/build.md`.
4. 학습이 있는 논문은 미니 과적합까지 확인한다. 실패하면 위 칸으로 오르지 않는다.

### run

1. `configs/tiny.yaml` 로 시작해 순서와 방향만 확인한다.
2. `assets/run.py` 로 실행한다. 설정·commit·시드·환경·모델 id 가 스냅샷으로 남는다.
3. 절제를 수행한다. 논문의 절제를 재현하고, 논문에 없는 절제는 `decisions.md` 항목에서
   고른다.
4. 차이를 주장하려면 3시드. `assets/compare.py` 로 비교 표를 산출해 `report.md` 에 포함한다.

### gap

1. 격차가 3시드 분산 안에 들어가는지 먼저 확인한다.
2. 용의자를 확인 비용 오름차순으로 배열한다 — 평가 스크립트 · 데이터 · `decisions.md`
   항목 · 저자 코드와 논문의 차이 · 시드.
3. 용의자마다 그것을 배제하는 가장 저렴한 실험을 병기한다.
4. 배제 결과를 `report.md` 에 누적한다. 하이퍼파라미터 스윕을 먼저 돌리지 않는다.

## 6. 공통 규약

- **논문에 없어서 정한 것은 `decisions.md` 에.** 코드 주석에 남기지 않는다.
- **논문 수치는 앵커와 함께 인용한다.** `(Table 2, p.6)` · `(§3.2, p.4)`. `claims.md` 의
  앵커를 그대로 옮긴다.
- **내 수치는 run 태그와 함께 기재한다.** `51.49 (runs/2026-09-22-baseline, 3시드 평균)`.
  태그를 달 수 없는 수치는 재현할 수 없으므로 기재하지 않는다.
- **축소한 조건은 수치와 같은 문장에.** 모델·데이터·스텝을 줄였으면 그 사실이 결과의
  일부다.
- **시드 하나로 차이를 주장하지 않는다.** 3시드, 표준편차 병기.
- **수치를 다시 반올림하지 않는다.** 논문 수치도 내 수치도 산출된 자리수로 옮긴다.
- **`runs/` 는 추가만 한다.** 과거 run 을 수정하거나 삭제하지 않는다. 설정이 틀렸으면 새
  run 을 추가하고 `report.md` 에 폐기 사유를 기재한다.
- **재현 성공을 넓게 주장하지 않는다.** 확인한 칸까지만 기재하고 오르지 않은 칸은 오르지
  않았다고 기재한다.
- **실패를 그대로 기재한다.** 성질 검사가 깨졌으면 깨진 내용을, 절제가 논문과 반대
  방향이면 그 방향을 기재한다.

문체는 `korean-report-style` — `.md` 산출물은 평서체다.

## 7. 쓰고 나서 확인

- [ ] `decisions.md` 에 없는 임의 결정이 코드에 있나 — `grep -rn "TODO\|hardcode\|magic" src/`
- [ ] 앵커 없는 논문 수치 — `claims.md` 와 `report.md` 의 수치를 한 줄씩
- [ ] run 태그 없는 내 수치 — `report.md` 를 한 줄씩
- [ ] (gate) 판정 넷 중 하나가 명시되었나. 예산과 답할 질문 한 문장이 있나
- [ ] (plan) 주장마다 앵커와 `축소 가능/불가` 가 있나. 불가한 주장이 제외되었나
- [ ] (build) 성질 검사가 논문의 식과 예외 경로를 검사하나
- [ ] (run) 스냅샷만으로 3일 뒤 같은 수치를 재현할 수 있나. 3시드인가
- [ ] (gap) 용의자가 비용 오름차순인가. 배제 실험이 병기되었나
- [ ] `papers/` 밖의 파일을 수정하지 않았나 — `git status`
- [ ] `papers/README.md` 의 색인 행이 갱신되었나

## 8. 다른 스킬과의 관계

- **논문 읽기** — `paper-tutor`. `study/note.md` 의 `실험이 보인 것` 절이 `claims.md` 의
  입력이고, `읽으며 든 의문` 절이 `gate` 의 가치 질문과 논문에 없는 절제의 씨앗이다.
  노트가 없어도 이 스킬은 단독으로 동작한다.
- **문체** — `korean-report-style`. 산출 파일은 보고 문서다.
- **HTML·PDF 산출** — `korean-report-doc`. 결과를 배포용으로 만들 때만.
- **구조 그림** — `mermaid-diagram`. 파이프라인을 그려야 구현이 정리되는 논문일 때.

## 9. 참고 파일

- `references/gate.md` — 질문 아홉 개 · 치명 빨강 · 질문 교체 · 판정 넷 · 채운 예시
- `references/plan.md` — 주장 분해 기준 · 예산 산정 · `claims.md` 템플릿
- `references/build.md` — 유형별 사다리 · 성질 검사 카탈로그 · `decisions.md` 형식
- `references/run.md` — run 규약 · 절제 설계 · 시드·분산 보고 · `report.md` 템플릿
- `references/gap.md` — 용의자 순서 · 배제 실험 · 격차 크기별 대응
- `assets/run.py` — run 디렉터리 생성과 스냅샷
- `assets/compare.py` — `claims.md` 와 `runs/` 를 읽어 비교 표 산출
