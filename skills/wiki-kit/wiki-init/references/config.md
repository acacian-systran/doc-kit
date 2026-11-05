# wiki.config.md 형식

위키 루트에 둔다. 앞부분(frontmatter)은 `wiki_lint.py`가 읽는 기계용 칸, 본문은 사람과 Claude가 읽는 프로젝트 규칙.

## frontmatter

`key: value` 한 줄씩. 목록은 쉼표로 구분. YAML 문법 중 이것만 쓴다(스크립트가 YAML 라이브러리 없이 읽음).

| 키 | 뜻 | 예 | 기본값 |
|---|---|---|---|
| `name` | 위키 이름 | `eGov RIGOR 연구` | 폴더 이름 |
| `language` | 노드 언어 | `ko` | `ko` |
| `index` | 목록 파일 | `index.md` | `index.md` |
| `log` | 변경 기록 파일 | `log.md` | `log.md` |
| `glossary` | 용어표 파일(없으면 비움) | `용어.md` | (없음) |
| `node_types` | 노드 폴더 = frontmatter `type` 값 | `개념, 결정, 결과, 헷갈린-점` | `개념, 결정, 결과, 헷갈린-점` |
| `evidence` | 근거 디렉터리(위키 루트 기준 상대 경로, 여럿 가능) | `../evidence` | (없음) |
| `sources` | 노드가 원문으로 링크하는 문서(초안 · 문서 · 코드) | `../draft/chapters` | (없음) |
| `outside_policy` | 근거 디렉터리 밖 파일 인용 | `copy`(evidence로 복사 후 인용) · `link`(그대로 링크) · `ask` | `link` |
| `check` | 노드를 고친 뒤 돌릴 명령. 위키 루트에서 실행(경로도 위키 루트 기준), `;`로 여럿 | `python3 ../draft/check_refs.py` | (없음) |
| `commit` | 끝난 뒤 커밋 | `auto`(검사 통과 시) · `ask` · `never` | `ask` |
| `commit_prefix` | 커밋 메시지 머리 | `wiki: ` | `wiki: ` |
| `ending` | 문장 끝 | `명사형` · `한다체` · `합니다체` | `명사형` |
| `ignore` | 노드로 보지 않는 파일 · 폴더 | `reading, 이력.md` | (없음) |

위키 루트 바로 아래의 `.md` 파일(index · log · 용어표 · 설정 파일 등)은 노드로 보지 않는다. 노드는 `node_types` 폴더 안의 파일뿐.

## 본문

아래 절 중 프로젝트에 해당하는 것만 쓴다. 공용 기본값과 같으면 쓰지 않는다.

```markdown
# <위키 이름> 위키 설정

## 범위
무엇을 다루고 무엇은 근거로 끌어오지 않는가.

## 근거 규칙
숫자 · 사실을 어디서만 가져오는가. 새로 잰 것은 어디에 두는가.

## 노드 종류
공용 형식(wiki-add/references/node-formats.md)과 다른 종류만. 예: 결과 노드는 맨 위에 "답하는 질문".

## 숫자 읽는 법
채점 · 결과 파일의 키(run 이름, 조건 코드)와 문서에서 부르는 조건 이름의 대응표. 노드에 숫자를 쓸 때 어느 키를 읽는가.

## 문체 · 용어
문장 끝, 쓰지 않을 표현, 번역하지 않는 용어, 용어표 사용법.

## 연결
첫 등장 링크, 용어표 메모 링크, index의 어느 절에 넣는가.

## 언제 노드를 만드나
예: 검토 중 헷갈린 개념 · 질문의 답은 채팅으로 끝내지 않고 헷갈린-점 노드로.
```

## 예 (rdb2ontology `paper/wiki/`)

```markdown
---
name: eGov RIGOR 연구
language: ko
index: index.md
log: log.md
glossary: 용어.md
node_types: 개념, 헷갈린-점, 결정, 결과, 한계, 지표, 조건, 기법, 입력, 질문
evidence: ../evidence
sources: ../draft/chapters
outside_policy: copy
check: python3 ../draft/check_refs.py
commit: auto
ending: 명사형
ignore: 이력.md
---
```
