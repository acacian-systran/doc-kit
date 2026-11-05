# wiki-kit

프로젝트 하나의 지식을 Markdown 위키(노드 하나 = 개념 · 결정 · 결과 하나)로 쌓는 번들.
공용 규칙은 이 번들에 두고, 프로젝트마다 다른 것은 위키 루트의 `wiki.config.md` 한 파일에 둔다.
스킬을 프로젝트마다 복사하지 않으므로 여기서 규칙을 고치면 모든 프로젝트에 바로 반영된다.

| 스킬 | 역할 | 쓰기 |
|---|---|---|
| `wiki-init` | 질문 몇 개 → `wiki.config.md`와 빈 뼈대(index · log). 이미 있는 위키에서는 지금 규칙을 읽어 설정 파일만 씀 | 씀 |
| `wiki-add` | 모르는 용어 · 헷갈린 질문 · 결정 · 결과를 노드 하나로. 근거 찾기 → 노드 → index · log · 링크 → 검사 → 커밋 | 씀 |
| `wiki-ask` | 위키와 근거에서만 답하고 노드 링크를 붙임. 위키에 없으면 `wiki-add`를 제안 | 읽기만 |
| `wiki-from-paper` | 논문 한 편 → 위키. 텍스트 추출(paper-tutor) → 뼈대 → plan 승인 → workflow(노드 쓰기 ∥ → 독립 검증 → 그림 옵션 → 연결). 인용은 쪽 대조 스크립트로 검사 | 씀 |
| `wiki-lint` | 깨진 링크 · index에 없는 노드 · 고아 노드 · type과 폴더 불일치 · log 누락(스크립트) + 노드 숫자와 근거의 어긋남(읽기) | 읽기만 |

다섯 스킬은 서로를 전제하므로 같이 설치한다. `wiki-from-paper`는 `paper-tutor`(pdftext.py)도 필요하다.

- 설정 형식: `wiki-init/references/config.md`
- 노드 형식(공용 기본값): `wiki-add/references/node-formats.md`
- 검사 스크립트: `wiki-lint/scripts/wiki_lint.py` (표준 라이브러리만, LLM 호출 없음)
- 논문 위키: 프리셋 `wiki-from-paper/assets/wiki.config.paper.md`, 노드 형식 `wiki-from-paper/references/paper-nodes.md`, 인용 검사 `wiki-from-paper/scripts/check_quotes.py`, 그림 `wiki-from-paper/assets/wfig.py`

## 설정 파일 찾기 (공통)

작업 디렉터리 아래에서 `wiki.config.md`를 찾는다.

```bash
find . -name wiki.config.md -not -path '*/node_modules/*' -not -path '*/.git/*' | head
```

- 하나면 그 디렉터리가 위키 루트.
- 여럿이면 사용자에게 어느 위키인지 묻는다.
- 없으면 `wiki-init`을 먼저 제안한다(`wiki-ask`는 설정 없이도 Markdown 폴더를 읽어 답할 수 있음).

## 우선순위

1. 사용자가 이번에 말한 것
2. `wiki.config.md`(프로젝트 규칙) — 프로젝트의 CLAUDE.md가 위키 규칙을 따로 적었으면 그것도
3. 이 번들의 공용 기본값
