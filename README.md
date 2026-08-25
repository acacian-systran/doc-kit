# doc-kit

여러 프로젝트에서 공통으로 가져다 쓰는 문서화 관련 Claude Code 스킬 모음.

## 구성

```
skills/
  explain-diff-html/   # 코드 변경(diff/PR)을 한국어 인터랙티브 HTML 문서로 설명
```

## 사용법

### 1. 특정 프로젝트에만 적용

대상 프로젝트의 `.claude/skills/` 아래에 심볼릭 링크를 건다.

```bash
mkdir -p /path/to/project/.claude/skills
ln -s /Users/acacian/projects/doc-kit/skills/explain-diff-html \
      /path/to/project/.claude/skills/explain-diff-html
```

### 2. 사용자 전역으로 적용

```bash
ln -s /Users/acacian/projects/doc-kit/skills/explain-diff-html \
      ~/.claude/skills/explain-diff-html
```

링크로 걸어두면 doc-kit에서 스킬을 고칠 때 모든 프로젝트에 바로 반영된다.

## 스킬 추가하기

`skills/<skill-name>/SKILL.md` 를 만들고, frontmatter에 `name` 과 `description` 을 넣는다.
`description` 은 Claude가 언제 이 스킬을 쓸지 판단하는 기준이므로, 트리거가 될 표현
(한국어 표현 포함)을 구체적으로 적는다.
