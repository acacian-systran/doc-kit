---
name: explain-ladder
description: Explain code, changes, investigation results or concepts so a human can understand and review them fast, picking the simplest format that answers the reviewer's question — plain writing (STE-style) → Mermaid diagram → interactive single-file HTML → narrated Manim video (video only on explicit request). Use when the user asks to 설명해줘 · 이해가 안 돼 · 모르겠어 · 그림으로 보여줘 · 시각화해줘 · 보여줘 · PR 정리해줘 · 리뷰용으로 정리 · 리뷰어용 · 영상으로 만들어줘 · explain · walk me through, or asks for a handoff after a large change or investigation (a PR write-up explicitly wanted as an HTML page goes to explain-diff-html). Do NOT use for simple factual questions, how-to questions answerable with a snippet, writing code itself, or answers that fit in one or two sentences.
---

# explain-ladder — 검토자의 질문에 맞는 가장 단순한 포맷

Karpathy 가 제시한 설명 사다리를 따른다: **글(STE) → 다이어그램 → 인터랙티브 HTML → 설명 영상**.
위 칸으로 갈수록 만들기 비싸고, 검토하기도 비싸다. 화려한 포맷이 더 좋은 포맷이 아니다.

> 원칙: 검토자가 던질 질문에 답할 수 있는 **가장 낮은 칸**을 고른다.

## 1. 발동 범위

| 발동한다 | 발동하지 않는다 |
|---|---|
| "이 함수가 뭐 하는지 설명해줘" | "파이썬 리스트 정렬하는 법" — 스니펫 하나로 끝나는 how-to |
| "인증 흐름이 어떻게 이어지는지 모르겠어" | "Python 최신 버전이 뭐야" — 단순 사실 질문 |
| "이번 PR 리뷰어용으로 정리해줘" | "이 함수 리팩터링해줘" — 코드 작성 자체 |
| 큰 변경·조사를 끝낸 뒤 "정리해서 넘겨줘" | 한두 문장으로 끝나는 답 |

판정 기준: 답의 목적이 **사람이 이해하고 검토하게 만드는 것**인가. 아니면 이 스킬을 쓰지 않는다.

설명할 대상("이 함수", "인증 흐름")이 대화나 작업 디렉터리에서 특정되지 않으면, 포맷을 고르기 전에 코드를 찾아보고 그래도 모르면 한 번 묻는다.

## 2. 포맷 고르기

### 2.1 사용자가 지정했을 때

포맷을 지정했으면 그 포맷을 쓴다. 판정 로직을 건너뛴다.

| 사용자 표현 | 포맷 |
|---|---|
| 글로, 텍스트로, 문서 말고 짧게 | writing |
| 그림, 다이어그램, 도식, 흐름도, mermaid | diagram |
| 인터랙티브, HTML, 조작해볼 수 있게, 슬라이더 | html |
| 영상, 동영상, 비디오, 3b1b 스타일, 애니메이션 영상 | video |

### 2.2 지정하지 않았을 때

위에서부터 차례로 검사하고, **처음 맞는 칸**에서 멈춘다.

1. **writing** — 결정 하나, 작은 변경, 개념 정의, 함수 하나의 역할, PR·변경 인계.
2. **diagram** — 요소 사이의 **관계**가 이해를 막는다.
   신호: 호출 경로, 흐름이 "어떻게 이어지는지", 상태 전이, 의존성, 소유 관계, "어디서 어디로".
3. **html** — 변수나 시나리오를 **바꿔 봐야** 이해된다.
   신호: "X 에 따라 어떻게 달라지는지", 파라미터 효과, 여러 실패 경로 비교, 알고리즘 단계별 진행.
4. **video** — 자동으로 고르지 않는다. 사용자가 영상을 명시적으로 요청했을 때만 쓴다.
   시간에 따른 변화나 직관 형성이 핵심인 주제라도, 요청이 없으면 html 까지만 간다.

판정이 애매하면 **writing 으로 시작**하고, 끝에 상위 포맷 하나를 한 줄로 제안한다.
예: "호출 순서가 헷갈리면 sequenceDiagram 으로 그려 드릴 수 있습니다."

### 2.3 응답 첫 줄

포맷을 고른 이유를 **첫 줄에 한 문장**으로 쓴다.

```
포맷: diagram — 인증 단계 사이의 호출 순서가 이해의 걸림돌이라서.
포맷: video — 영상을 직접 요청하셔서.
```

"정리해줘", "보여줘"는 포맷 지정이 아니다. 내용을 보고 2.2 로 판정한다.

## 3. 참조 파일 읽기

포맷을 고른 **뒤에** 해당 파일 **하나만** 읽는다. 네 파일을 한꺼번에 읽지 않는다.

| 포맷 | 읽을 파일 |
|---|---|
| writing | `references/writing.md` |
| diagram | `references/diagram.md` |
| html | `references/html.md` |
| video | `references/video.md` (렌더링은 `scripts/render_video.sh`) |

writing 에서 시작해 상위 포맷을 제안했고 사용자가 수락하면, 그때 해당 파일을 추가로 읽는다.

## 4. 공통 규칙 (모든 포맷)

### 4.1 설명은 검증이 아니다

출력 마지막에 세 구분을 둔다. 해당 항목이 없으면 "없음"이라고 쓴다.

```
[확인된 사실]
- 토큰 만료 검사는 `auth/session.py:validate_token` 에서 한다.
[추론]
- 갱신 실패 시 재로그인으로 이어진다 — 호출부를 다 확인하지는 않았다.
[불확실]
- 동시 요청 두 개가 같은 refresh token 을 쓸 때의 동작.
```

- **확인된 사실**: 이번 세션에서 코드·문서·실행 결과로 직접 확인한 것.
- **추론**: 근거는 있으나 직접 확인하지 않은 것.
- **불확실**: 판단할 근거가 부족한 것. 검토자가 확인해야 할 지점이다.

### 4.2 근거를 단다

코드를 설명할 때는 주장마다 파일 경로나 심볼을 붙인다 (`path/to/file.py:42`, `ClassName.method`).
근거를 붙일 수 없는 주장은 [추론]으로 분류한다.

### 4.3 예시 값은 예시라고 쓴다

시뮬레이션 결과, 가상의 입력, 그럴듯한 숫자에는 "예시" 라벨을 단다.
측정값처럼 보이게 쓰지 않는다. 실제로 측정한 값이면 측정 조건(명령, 환경)을 함께 쓴다.

### 4.4 언어

사용자가 지정하지 않으면 한국어로 쓴다. 고유명사와 코드 심볼은 원문을 유지한다.

## 5. 이웃 스킬

| 상황 | 스킬 |
|---|---|
| PR 설명을 **HTML 문서**로 원한다고 명시 | `explain-diff-html` |
| 문서에 넣을 정식 다이어그램(.mmd 파일, 팔레트, SVG 렌더) | `mermaid-diagram` |
| 논문 해설 | `paper-tutor`, `paper-explainer` |

이 스킬의 diagram 포맷은 응답 안에 바로 넣는 검토용 그림이다. 파일로 남길 정식 도해는 `mermaid-diagram` 이 맡는다.
