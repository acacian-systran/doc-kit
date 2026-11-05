---
name: wiki-init
description: Set up a project wiki for the wiki-kit bundle — asks a few questions (where the wiki lives, node types, where evidence comes from, how outside files are cited, which check command runs, commit policy, sentence ending) and writes wiki.config.md plus an empty index.md and log.md. On a wiki that already exists it reads the current index rules, CLAUDE.md and recent nodes and writes only the config, changing no node. Use when the user asks to 위키 만들기 · 프로젝트 위키 시작 · 위키 설정 · wiki.config 만들어줘 · 이 프로젝트에도 위키 · 노드 규칙 정리, or when wiki-add / wiki-lint finds no wiki.config.md. Part of wiki-kit (with wiki-add, wiki-ask, wiki-lint).
---

# 위키 설정 만들기

wiki-kit의 다른 스킬은 프로젝트마다 다른 것을 `wiki.config.md` 한 파일에서 읽는다. 이 스킬은 그 파일을 만든다. 스킬을 새로 만들거나 복사하지 않는다 — 프로젝트별 차이는 설정 파일에만 둔다.

설정 형식은 `references/config.md`. 먼저 읽는다.

## 1. 있는 것 확인

```bash
find . -name wiki.config.md -not -path '*/node_modules/*' -not -path '*/.git/*'
find . -name index.md -not -path '*/node_modules/*' -not -path '*/.git/*' | head
```

- `wiki.config.md`가 이미 있으면: 사용자가 바꾸려는 칸만 고친다.
- 위키 폴더는 있는데 설정이 없으면 → **2-A 기존 위키**.
- 아무것도 없으면 → **2-B 새 위키**.

## 2-A. 기존 위키에서 설정 뽑기

노드를 하나도 고치지 않는다. 읽기만 하고 설정 파일 하나를 쓴다.

1. 읽는 것: 위키의 index(특히 "노드 규칙" 같은 절), log 첫 몇 줄과 마지막 몇 줄, 프로젝트와 위키 상위 폴더의 `CLAUDE.md`, 하위 폴더 목록과 폴더별 노드 하나씩, 사용자 메모리에 위키 관련 항목이 있으면 그것.
2. 칸 채우기: 폴더 이름 → `node_types`, 근거 링크가 가리키는 곳 → `evidence` · `sources`, CLAUDE.md의 검사 명령 → `check`, 커밋 규칙 → `commit`.
3. 본문: 공용 기본값(`wiki-add/references/node-formats.md`)과 **다른 것만** 옮긴다. 출처를 괄호로(예: "(index 노드 규칙)", "(paper/CLAUDE.md)").
4. 확실하지 않은 칸은 비우고 사용자에게 한 번에 묻는다.

## 2-B. 새 위키

AskUserQuestion으로 한 번에 묻는다(최대 4개, 기본값을 첫 선택지로).

1. 위키 위치: `docs/wiki/`(기본) · `wiki/` · 기타
2. 노드 종류: 개념 · 결정 · 결과 · 헷갈린-점(기본) / + 한계 · 지표 / 직접
3. 근거: 숫자를 가져올 디렉터리와, 그 밖의 파일 인용 방식(`link` 기본 · `copy` · `ask`)
4. 끝난 뒤: 커밋 `ask`(기본) · `auto` · `never`, 문장 끝 명사형(기본) · 한다체

그다음 만든다.

- `<위키>/wiki.config.md` — 형식대로
- `<위키>/index.md` — `assets/index.template.md`를 채움
- `<위키>/log.md` — `# <이름> 위키 변경 기록` + 오늘 날짜로 시작 한 줄
- `node_types` 폴더는 만들지 않는다(첫 노드가 생길 때 wiki-add가 만듦)

## 3. 마무리

- 만든 파일과 설정 요약(표 하나)을 보여 준다.
- `wiki-lint` 스크립트를 한 번 돌려 설정이 읽히는지 확인한다:
  `python3 <wiki-lint 스킬 디렉터리>/scripts/wiki_lint.py <위키 루트>`
- 커밋은 설정의 `commit`을 따른다. 설정 파일 자체를 처음 만들 때는 `auto`여도 무엇을 커밋하는지 한 줄로 알린다.
