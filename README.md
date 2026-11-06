# doc-kit

여러 프로젝트에서 공통으로 가져다 쓰는 문서화 관련 Claude Code 스킬 모음.

## 구성

```
skills/
  mermaid-diagram/              # 단독
  explain-diff-html/            # 단독
  explain-ladder/               # 단독
  paper-tutor/                  # 단독
  paper-lab/                    # 단독
  paper-explainer/              # 단독
  reading-vocab/                # 단독
  book-reader/                  # 단독
  w2ho/                         # 단독
  tool-study-deck/              # 단독
  method-atlas/                 # 단독
  korean-report-style/          # 단독
  wiki-kit/                     # 번들 — wiki-init · wiki-add · wiki-ask · wiki-lint · wiki-from-paper
```

디렉터리가 한 단계 더 들어가 있으면 **번들**이다. 그 안의 스킬들은 서로를 전제하므로
같이 설치한다. 번들 디렉터리의 README에 역할 분담이 적혀 있다.

| 스킬 | 역할 | 묶음 |
|------|------|------|
| `mermaid-diagram`     | 아키텍처·순서·상태·ER·일정 그림을 Mermaid 소스로 그려 SVG 로 렌더. 처음 보는 사람용 **그림 읽는 법 페이지**(기호 전체 + 고른 예시 그림에서 항목을 누르면 쓰인 곳만 켜짐)와 그림 디렉터리 전체를 둘러보는 **그림 뷰어**(목록 나무 · 상자 두 번 눌러 펼친 그림으로 들어가기 · 요소 정보 · 범례 · 찾기)도 만든다. 여러 그림에 나오는 요소는 `_elements.md` 한 곳에 적고 `elements_lint.py` 로 그림마다 색 · 모양이 같은지 검사한다 | 단독 |
| `explain-diff-html`   | 코드 변경(diff/PR)을 한국어 인터랙티브 HTML 문서로 설명 | 단독 |
| `explain-ladder`      | 검토자의 질문에 답하는 가장 단순한 포맷을 골라 설명 — 글(STE) → Mermaid → 인터랙티브 HTML → Manim 영상(요청 시), 끝에 확인된 사실·추론·불확실 구분 | 단독 |
| `paper-tutor`         | 논문 공부 — 읽기 전 용어집(prep) · 원문 앵커 Q&A(ask) · 메커니즘 중심 노트(read) · 대화형 퀴즈(quiz) | 단독 |
| `paper-lab`           | 논문 구현 — 구현 가치 판정(gate) · 주장 표와 예산(plan) · 성질 검사(build) · 축소 재현과 절제(run) · 격차 분석(gap) | 단독 |
| `paper-explainer`     | 논문 해설 사이트 — Overview 흐름도 + 챕터·하위 챕터별 페이지, 모든 페이지에 현재 위치를 강조한 고정 미니맵 · 단계 풀이 | 단독 |
| `reading-vocab`       | 논문 · 책(장별 Markdown) 단어 카드 — 원문 속 뜻 하나만 담은 Quizlet · Anki 덱(cards) · 어휘 수준 테스트(level) · 학습 결과로 아는 단어 줄이기(result) | 단독 |
| `book-reader`         | 장별 Markdown 책(O'Reilly 클리핑 등) → 원문 그대로의 정적 웹 리더 · 한영 병기판 · 드래그 단어 저장, 저장 단어는 `reading-vocab` 덱으로 넘김. 책마다 다른 것은 `book.json` 하나 | 단독 |
| `w2ho`                | 논리적 말하기·글쓰기 — Why → What → How → Opinion 구조로 면접 답변·보고·발표·문서를 짜고(write) · 진단해 고치고(review) · 한 문제씩 연습(drill), 청중에 따라 How 깊이 조절 | 단독 |
| `tool-study-deck`     | 도구 학습 덱 — 근거 표(sources) · 격리 환경에서 예시 장면을 실제로 돌려 기록(lab) · 15장 뼈대(storyboard) · 도형 중심 Slides 아티팩트와 읽는 대본(deck). 화면의 결과는 모두 실행 출력 | 단독 |
| `method-atlas`        | 기법 비교 지도 — 문제 하나와 그 해결 기법들을 공통 예시 질문 · 같은 분류 축으로 비교하는 인터랙티브 페이지. 기법마다 구조도 · 단계별 입출력 · 쓸 때/안 쓸 때 예시 · 장단점과 한계 · 관계(선행·보완·대체·충돌·자원 공유), 필터 · 비교 · 요약 행렬 · 근거 · 용어집 탭. 데이터 파일 하나만 쓰고 엔진은 공용 | 단독 |
| `korean-report-style` | 파일로 남기거나 보내는 한국어 문서의 문장 규약 — ASD-STE100에서 가져온 문장 원칙 · 편집 시 뜻 보존 · 상태와 위험의 정직한 서술 · 외부 공유 점검 · AI 문투 검출 | 단독 |
| `wiki-init`           | 프로젝트 위키 설정 — 질문 몇 개로 `wiki.config.md`와 빈 index · log를 만듦. 기존 위키는 지금 규칙을 읽어 설정만 씀 | wiki-kit |
| `wiki-add`            | 위키 노드 하나 더하기 — 모르는 용어 · 헷갈린 질문 · 결정 · 결과를 근거에서 찾아 공용 형식으로 쓰고 index · 첫 등장 · log 연결, 검사 · 커밋 | wiki-kit |
| `wiki-ask`            | 위키에 묻기(읽기 전용) — 위키와 근거에서만 답하고 노드 링크를 붙임, 없으면 `wiki-add` 제안 | wiki-kit |
| `wiki-from-paper`     | 논문 한 편 → 위키 — 쪽 앵커 텍스트 · 노드 plan(사용자 승인) · workflow로 노드 쓰기 ∥ → 독립 검증 → 그림(svg · mermaid · none, 실행마다 고름) → 연결. 인용마다 쪽 대조 검사 | wiki-kit |
| `wiki-lint`           | 위키 점검(읽기 전용) — 깨진 링크 · index 누락 · 고아 · type 불일치 · log 누락(스크립트) + 노드 숫자와 근거 대조 | wiki-kit |

`paper-tutor` · `paper-lab` · `reading-vocab` · `paper-explainer` · `book-reader` 는 산출물 루트를 공유한다 — 논문(책) 하나가
`papers/<citekey>/` 이고 그 아래 `study/`(읽기) · `lab/`(구현) · `vocab/`(단어 카드) · `site/`(해설 사이트) · `reader/`(웹 리더)로 갈린다.
`book-reader` 의 Words 서랍이 내보낸 `<key>-picked-*.csv` 는 `reading-vocab` 의 `picked` 모드가 받는다.
`wiki-from-paper` 는 논문 위키를 `papers/<citekey>/wiki/` 에 두고 `study/paper.txt` 를 근거로 쓴다(paper-tutor 필요).
`wiki-kit` 은 프로젝트마다 다른 것을 위키 루트의 `wiki.config.md` 하나에 두고 스킬은 복사하지 않는다(`book-reader` 의 `book.json` 과 같은 방식).
`book-reader` 는 Node 의존성이 있어 처음 한 번 `npm ci --prefix skills/book-reader/assets` 가 필요하다.
`reading-vocab` · `paper-explainer` 는 `paper-tutor` 의 `pdftext.py` 를 함께 쓰므로 두 스킬을 같이 설치한다.

## 설치

`install.sh` 가 `skills/` 를 훑어 SKILL.md를 담은 디렉터리만 골라 링크한다. 번들이 몇
단계로 중첩되든 상관없다.

```bash
./install.sh                  # ~/.claude/skills — 사용자 전역
./install.sh /path/to/project # <project>/.claude/skills — 프로젝트 한정
```

이미 링크된 스킬은 건너뛰고, 같은 이름의 실제 파일/디렉터리가 있으면 덮어쓰지 않고
경고만 낸다. 링크로 걸어두므로 doc-kit에서 스킬을 고치면 모든 프로젝트에 바로 반영된다.

손으로 걸 때는 **말단 디렉터리**(SKILL.md가 직접 들어 있는 디렉터리)를 가리켜야 한다.
Claude Code는 `.claude/skills/<name>/SKILL.md` 한 단계만 스캔하므로, 번들 디렉터리를
통째로 링크하면 스킬을 찾지 못한다.

```bash
ln -s ~/projects/doc-kit/skills/korean-report-style \
      ~/.claude/skills/korean-report-style
```

## 스킬 추가하기

`skills/<skill-name>/SKILL.md` 를 만들고, frontmatter에 `name` 과 `description` 을 넣는다.
`description` 은 Claude가 언제 이 스킬을 쓸지 판단하는 기준이므로, 트리거가 될 표현
(한국어 표현 포함)을 구체적으로 적는다.

처음 쓰는 사람이 알아 두면 좋은 기능이 있으면 스킬 디렉터리에 `.install-hint` 를 두고 한 줄로 적는다. `install.sh` 가 설치 끝에 모아 보여 준다.

여러 스킬이 서로를 전제한다면 `skills/<bundle>/` 아래로 묶고, 번들 README에 역할 분담과
왜 갈라 뒀는지를 적는다. 위의 표에도 한 줄 추가한다.
