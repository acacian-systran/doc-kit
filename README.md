# doc-kit

여러 프로젝트에서 공통으로 가져다 쓰는 문서화 관련 Claude Code 스킬 모음.

## 구성

```
skills/
  mermaid-diagram/              # 단독
  explain-diff-html/            # 단독
  paper-tutor/                  # 단독
  paper-lab/                    # 단독
  reading-vocab/                # 단독
  korean-report/                # 번들 — 짝으로 쓰는 스킬 묶음
    korean-report-style/
    korean-report-doc/
```

디렉터리가 한 단계 더 들어가 있으면 **번들**이다. 그 안의 스킬들은 서로를 전제하므로
같이 설치한다. 번들 디렉터리의 README에 역할 분담이 적혀 있다.

| 스킬 | 역할 | 묶음 |
|------|------|------|
| `mermaid-diagram`     | 아키텍처·순서·상태·ER·일정 그림을 Mermaid 소스로 그려 SVG 로 렌더 | 단독 |
| `explain-diff-html`   | 코드 변경(diff/PR)을 한국어 인터랙티브 HTML 문서로 설명 | 단독 |
| `paper-tutor`         | 논문 공부 — 읽기 전 용어집(prep) · 원문 앵커 Q&A(ask) · 메커니즘 중심 노트(read) · 대화형 퀴즈(quiz) | 단독 |
| `paper-lab`           | 논문 구현 — 구현 가치 판정(gate) · 주장 표와 예산(plan) · 성질 검사(build) · 축소 재현과 절제(run) · 격차 분석(gap) | 단독 |
| `reading-vocab`       | 논문 · 책(장별 Markdown) 단어 카드 — 원문 속 뜻 하나만 담은 Quizlet · Anki 덱(cards) · 어휘 수준 테스트(level) · 학습 결과로 아는 단어 줄이기(result) | 단독 |
| `korean-report-style` | 한국어 보고 문서의 문체·프레이밍 규약, AI 문투 검출 (문장 담당) | korean-report |
| `korean-report-doc`   | 한국어 기술 문서를 자립형 HTML/PDF로 제작 (템플릿·도해 담당) | korean-report |

`paper-tutor` · `paper-lab` · `reading-vocab` 은 산출물 루트를 공유한다 — 논문 하나가
`papers/<citekey>/` 이고 그 아래 `study/`(읽기) · `lab/`(구현) · `vocab/`(단어 카드)로 갈린다.
`reading-vocab` 은 `paper-tutor` 의 `pdftext.py` 를 함께 쓰므로 두 스킬을 같이 설치한다.

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
ln -s ~/projects/doc-kit/skills/korean-report/korean-report-doc \
      ~/.claude/skills/korean-report-doc
```

## 스킬 추가하기

`skills/<skill-name>/SKILL.md` 를 만들고, frontmatter에 `name` 과 `description` 을 넣는다.
`description` 은 Claude가 언제 이 스킬을 쓸지 판단하는 기준이므로, 트리거가 될 표현
(한국어 표현 포함)을 구체적으로 적는다.

여러 스킬이 서로를 전제한다면 `skills/<bundle>/` 아래로 묶고, 번들 README에 역할 분담과
왜 갈라 뒀는지를 적는다. 위의 표에도 한 줄 추가한다.
