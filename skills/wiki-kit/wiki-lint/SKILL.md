---
name: wiki-lint
description: Read-only health check of a project wiki set up with wiki-kit — a script finds broken relative links, nodes missing from the index, nodes no other page links to, frontmatter type that disagrees with the folder, missing aliases, and (with --changed) nodes changed in git without a log line; then a reading pass compares numbers in nodes against the evidence files and source chapters they cite. Reports problems with file:line and evidence, never edits and never proposes rewrites unless asked. Use when the user asks 위키 점검 · 위키 검사 · 깨진 링크 · 고아 노드 · 위키 숫자 맞나 · wiki lint · check the wiki, after a batch of wiki edits, or before sharing the wiki. Part of wiki-kit (with wiki-init, wiki-add, wiki-ask).
---

# 위키 점검

읽기 전용. 문제를 찾아 근거와 함께 보고만 한다. 고치는 것은 사용자가 정하면 `wiki-add`(노드)나 직접 편집으로.

## 1. 스크립트 (구조)

```bash
python3 <이 스킬 디렉터리>/scripts/wiki_lint.py <위키 루트>            # 전체
python3 <이 스킬 디렉터리>/scripts/wiki_lint.py <위키 루트> --changed  # git에서 바뀐 노드만 + log 누락
```

설정(`wiki.config.md`)의 `index` · `log` · `node_types` · `ignore`를 읽는다. 표준 라이브러리만 쓰고 LLM을 부르지 않는다.

| 코드 | 뜻 | 수준 |
|---|---|---|
| `broken-link` | 상대 링크의 파일이 없음 | 오류 |
| `not-in-index` | 노드가 index에서 링크되지 않음 | 오류 |
| `type-mismatch` | frontmatter `type` ≠ 폴더 이름 | 오류 |
| `no-frontmatter` | frontmatter 없음 | 오류 |
| `orphan` | index 말고는 어느 노드도 링크하지 않음 | 경고 |
| `no-aliases` | `aliases` 없음 | 경고 |
| `log-missing` | (`--changed`) 노드가 바뀌었는데 log가 안 바뀜 | 경고 |

오류가 있으면 종료 코드 1.

## 2. 읽기 (내용)

범위를 사용자에게 받는다(전체 · 폴더 하나 · 최근 커밋 몇 개). 전체가 크면 최근에 바뀐 노드부터.

노드마다:
1. **숫자**: 노드의 숫자를 `## 원문`이 가리키는 근거 파일 · 원문 장과 맞춘다. 다르면 둘 다 인용.
2. **같은 숫자 다른 노드**: 같은 지표 · 조건의 값이 다른 노드에 다르게 적혔는지.
3. **용어**: 설정 `glossary` 표와 다른 표기.
4. **범위**: 설정 "범위"가 막은 자료를 근거로 쓰는지.

노드가 많으면(30개 넘게) 폴더별로 나눠 서브에이전트에 맡길 수 있다. 각 서브에이전트에 설정 파일 경로와 위 4가지를 주고, 결과는 아래 형식으로 받는다.

## 3. 보고

```
### 구조 (스크립트)
오류 N · 경고 M — 코드별 개수, 오류는 전부 file:line

### 내용
| 노드 | 줄 | 문제 | 노드에 적힌 것 | 근거에 적힌 것 (파일:줄) |
```

추측은 쓰지 않는다. 근거 파일을 열어 확인한 것만 "어긋남"으로 쓰고, 확인 못 한 것은 "확인 못 함"으로 따로.
