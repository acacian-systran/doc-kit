# doc-kit

여러 프로젝트에서 공통으로 가져다 쓰는 문서화 관련 Claude Code 스킬 모음.

## 구성

```
skills/
  explain-diff-html/    # 코드 변경(diff/PR)을 한국어 인터랙티브 HTML 문서로 설명
  korean-report-style/  # 한국어 보고 문서의 문체·프레이밍 규약 (문장 담당)
  korean-report-doc/    # 한국어 기술 문서를 자립형 HTML/PDF로 제작 (템플릿·도해 담당)
```

`korean-report-style` 과 `korean-report-doc` 은 짝으로 쓴다. 문서를 만들 때는 두 개를
함께 링크해 두는 것이 좋다.

## 사용법

### 1. 특정 프로젝트에만 적용

대상 프로젝트의 `.claude/skills/` 아래에 심볼릭 링크를 건다.

```bash
mkdir -p /path/to/project/.claude/skills
for s in explain-diff-html korean-report-style korean-report-doc; do
  ln -s ~/projects/doc-kit/skills/$s /path/to/project/.claude/skills/$s
done
```

### 2. 사용자 전역으로 적용

```bash
for s in explain-diff-html korean-report-style korean-report-doc; do
  ln -s ~/projects/doc-kit/skills/$s ~/.claude/skills/$s
done
```

링크로 걸어두면 doc-kit에서 스킬을 고칠 때 모든 프로젝트에 바로 반영된다.

## 스킬 추가하기

`skills/<skill-name>/SKILL.md` 를 만들고, frontmatter에 `name` 과 `description` 을 넣는다.
`description` 은 Claude가 언제 이 스킬을 쓸지 판단하는 기준이므로, 트리거가 될 표현
(한국어 표현 포함)을 구체적으로 적는다.
