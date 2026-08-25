---
name: d2-diagram
description: Draw architecture and pipeline diagrams as D2 source rendered to SVG, using a fixed Korean visual vocabulary — shape means storage kind, color means role — so structure reads before labels. Use whenever the user wants a system diagram, data-flow diagram, pipeline or module diagram, runtime/infra diagram, or asks to 아키텍처 그림·다이어그램·구조도·플로우·d2 를 그려달라, and when revising or reviewing existing .d2 files or setting up a docs/diagrams directory. Provides a shared palette, 3-column and timeline templates, the grammar, and the conventions for the diagram directory's README.
---

# D2 다이어그램

시스템 그림을 `.d2` 소스로 그리고 SVG 로 렌더한다. 어휘는 한 벌로 고정한다 —
**모양이 저장소의 종류를, 색이 역할을 말한다.** 라벨을 읽기 전에 구조가 먼저 보이게
하려는 것이다.

자재는 이 스킬 디렉터리에 있다.

| 파일 | 무엇 |
|---|---|
| `assets/_style.d2` | 색과 모양의 정의 한 벌. 각 그림이 임포트한다 |
| `assets/_template.d2` | 3열 격자 기본형. 복사해서 채운다 |
| `assets/_template-timeline.d2` | 눕힌 격자. 시간이 주제일 때만 |
| `assets/_template-container.d2` | 컨테이너형. 상자 20개 이상 · 배포 경계가 여럿일 때 |
| `references/grammar.md` | 클래스 표, 배치 규칙, 그림을 언제 나누나 |
| `references/diagrams-readme.md` | 그림 디렉터리 README 에 무엇을 적나 |

---

## 1. 시작 전 결정

**답하는 질문을 한 문장으로 쓴다.** 두 문장이 되면 그림이 둘이다. 이 문장은 나중에
파일 머리말과 README 표에 그대로 들어간다.

**목표 상태(to-be)인가 현재 상태(as-is)인가.** 목표 상태로 두면 그림이 설계이고 구현보다
앞선다 — 갱신 의무가 없고, 구현이 그림에 도달하는 것이지 그림이 구현을 따라가는 것이
아니다. 현재 상태로 두면 갱신 의무가 생기고, 지킬 수 없으면 그리지 않는 편이 낫다. `references/diagrams-readme.md` 를 본다.

**관점 그림인가 모듈 그림인가.** 관점 그림은 여러 모듈을 한 장에 담고(경계·런타임·시간),
모듈 그림은 한 모듈의 단계와 게이트를 판다. 섞지 않는다.

**어느 형태인가.** 단계의 사슬이면 3열 격자, 시간이 주제면 눕힌 격자, 상자가 스무 개를
넘고 배포 경계가 여럿이면 컨테이너형이다. 컨테이너형은 규칙이 몇 가지 더 붙는다 —
`references/grammar.md` 의 "대형 그림" 절을 읽고 시작한다.

## 2. 디렉터리 세우기

프로젝트에 그림 디렉터리가 없으면 만든다. 관점별 하위 디렉터리를 둘 생각이면 자재는 한
층 위에 둔다 — 자재는 관점을 가리지 않는다.

```
docs/diagrams/
  _style.d2          # 이 스킬의 assets/_style.d2 를 복사
  _template.d2       # 이 스킬의 assets/_template.d2 를 복사
  README.md          # references/diagrams-readme.md 를 보고 작성
  <관점>/
    <이름>.d2
    <이름>.svg
```

자재를 한 층 위에 뒀으면 그림의 임포트를 `...@../_style` 로 고친다. 같은 디렉터리에
뒀으면 `...@_style` 그대로다.

**색상값을 그림 파일에 직접 적지 않는다.** 색을 새로 써야 하면 `_style.d2` 에 클래스를
더한다 — 인라인으로 박으면 같은 뜻이 파일마다 다른 색으로 갈라진다.

## 3. 그리기

템플릿을 복사해 이름을 바꾸고 채운다. 그대로 렌더해도 예시 그림이 나오므로, 뼈대가
어떻게 생겼는지는 파일을 열지 않고 SVG 로도 볼 수 있다.

- 3열 격자가 기본형이다. `왼쪽 = 바깥에서 받는 것 · 가운데 = 단계 · 오른쪽 = 남기는 것`.
- 시간이 주제면 격자를 눕힌다. 열을 시간, 행을 "어디에 있나"로.
- 큰 그림은 최상위 한 겹만 격자로 잡고 나머지는 컨테이너로 간다. 배포 경계는 `배포`
  (실선), 논리 그룹은 `영역`(점선) — 같이 묶인 것과 같이 죽는 것은 다르다.
- 설계가 아직 정하지 않은 자리(벤더 미정 · 근거 없음)는 `미확정`(빨강 점선)으로 표시한다.
  **구현 여부는 그림에 표시하지 않는다** — 그림은 구현보다 앞서고, 대조를 전제한 그림은
  갱신 의무를 져서 반드시 낡는다. 진척은 README 의 "그린 시점" 절에 적는다.
- 빈 칸은 `빈칸` 클래스로 자리를 채운다. 비우면 격자가 밀린다.
- 조건은 자기 칸을 갖고 `필터` 색을 입는다. 괄호로 라벨에 묶지 않는다.
- 선에도 클래스를 쓴다 — `축`·`부수`·`읽기`·`호출`.
- 판단의 근거는 그리지 않고 `.d2` 주석에 적는다. 근거 문서의 파일명과 절 번호를 남긴다.

클래스 표 전체와 배치 규칙(행 순서로 화살표 다스리기, `layers:`, 그림을 나누는 기준)은
`references/grammar.md` 에 있다. **그림을 그리기 전에 읽는다.**

## 4. 렌더

```bash
d2 <디렉터리>/<이름>.d2 <디렉터리>/<이름>.svg
d2 --layout=elk <디렉터리>/<이름>.d2 <디렉터리>/<이름>.svg   # 컨테이너형
```

컨테이너형은 `elk` 를 쓴다. 기본 dagre 는 컨테이너 간격이 헐렁해 큰 그림이 더 커진다.

`.svg` 를 함께 커밋한다 — `d2` 없이도 보이게 하기 위해서다. `.d2` 를 고치면 같은 커밋에서
`.svg` 도 다시 뽑는다.

`layers:` 가 있으면 출력이 디렉터리다(`<이름>/{index,<레이어>}.svg`). 한 장만 뽑으려면
`d2 --target=<레이어>`.

PNG 출력은 Playwright 드라이버를 내려받으므로 그 다운로드가 막힌 환경에서는 실패한다.
SVG 를 쓴다.

**`d2` 가 없으면** `brew install d2` 로 설치한다. 설치할 수 없는 환경이면 `.d2` 소스만
쓰고 렌더는 못 했다고 말한다 — 렌더하지 않은 `.d2` 를 렌더했다고 하지 않는다.

## 5. 렌더 후 확인

컴파일 성공은 그림이 읽힌다는 뜻이 아니다. SVG 를 열어 확인한다.

- 화살표가 다른 상자를 **관통하는가**. 관통하면 대개 배치가 아니라 그림이 인과를
  건너뛴 것이다 — 오가는 상대를 인접 행으로 옮긴다.
- 굵은 축만 따라가서 전체가 읽히는가.
- 격자가 밀리지 않았는가 (빈 칸에 `빈칸`을 넣었는지).
- 라벨을 가리고 봤을 때 색만으로 무엇이 거르는 단계인지 보이는가.
- (큰 그림) 범례와 꼬리말이 제자리에 있는가. `near` 로 고정하지 않으면 레이아웃 엔진이
  그림 한복판에 놓는다.
- (큰 그림) 열을 넘는 대각선이 그림을 덮지 않는가. 덮으면 열 배치를 바꿔 본다.

## 6. 문서에 얹기

README 의 "답하는 질문" 표에 줄을 더하고, 열이나 축의 뜻이 기본형과 다르면 그 뜻과 이유를
적는다. 그린 시점(날짜 + 기준 리비전)을 남긴다. 무엇을 적는지는
`references/diagrams-readme.md` 에 있다.
