---
name: wiki-add
description: Add one node to a project wiki set up with wiki-kit — a term the user does not know (개념), a question they got confused by while reading (헷갈린-점), a decision, a result or a limit — following the project's wiki.config.md. Finds the facts in the project's evidence and sources (never from memory), writes the node in the shared format, links it from the index, from the nodes and glossary rows where the term first appears, adds a log line, runs the project's check command and commits when the config says so. Use when the user says 위키에 정리 · 한 페이지로 정리 · 개념 노드 · 이것도 위키에 · 모르는 용어 정리 · 헷갈린 점 남겨 · wiki node · add to wiki, or names a term from a wiki page and asks what it is in a way that should be kept. Part of wiki-kit (with wiki-init, wiki-ask, wiki-lint).
---

# 위키 노드 더하기

노드 하나를 더하고, 위키 안에서 그 노드가 찾아지게 만든다. 노드만 쓰고 연결을 빠뜨리면 다음 사람이 못 찾으므로 6단계 모두가 한 작업이다.

## 0. 설정 읽기

1. `wiki.config.md`를 찾는다(번들 README "설정 파일 찾기"). 없으면 `wiki-init`을 제안하고 멈춘다.
2. 읽는 것: 설정 파일 전체, 위키의 index(노드 규칙 절), `references/node-formats.md`, 프로젝트 · 위키 상위의 `CLAUDE.md`.
3. 우선순위: 사용자 말 > 설정 · CLAUDE.md > 공용 형식.
4. `git status --short`로 작업 트리를 본다. 이미 바뀐 파일은 다른 세션 · 사용자의 작업일 수 있으니 이번 작업 목록과 따로 기억해 둔다. 같은 저장소에서 다른 세션이 동시에 일할 수 있다.

## 1. 종류와 중복

- 종류: 용어 하나 → 개념. "X는 왜 Y인가", "A와 B는 같은가" 같은 질문 → 헷갈린-점. 정한 것 → 결정. 숫자로 답한 것 → 결과. 설정 `node_types`에 없는 종류면 가장 가까운 것을 고르고 알린다.
- 중복 확인: 제목 · `aliases`에서 찾는다.
  ```bash
  grep -rli "<용어>" <위키 루트> --include='*.md' | head -30
  ```
  같은 것을 다루는 노드가 있으면 새로 만들지 않고 그 노드를 고친다(사용자에게 한 줄로 알림).
- 위키에서 그 용어가 나오는 곳 목록을 남겨 둔다(5단계 링크에 씀).

## 2. 근거 찾기

- 설정 `evidence` · `sources`와 원문에서 정의 · 수치 · 예를 찾는다. 기억으로 쓰지 않는다. 표준 정의(예: OWL 2 명세)처럼 프로젝트 밖 사실은 널리 확인된 것만, 한 문장으로.
- 예는 실제 데이터 · 실행 결과 파일을 열어 확인한 것 하나. 파일 경로를 기록.
- 근거 디렉터리 밖 파일이 필요하면 설정 `outside_policy`:
  - `copy` → 근거 디렉터리 아래 알맞은 곳으로 복사(발췌면 첫 줄에 원래 경로)하고 복사본을 링크. 원본이 크거나 여러 파일에서 계산해야 하면, 원본을 읽어 필요한 것만 뽑는 스크립트와 그 출력을 근거 디렉터리(예: `checks/`)에 두는 것도 복사로 친다. 스크립트 첫 줄 주석에 무엇을 왜 세는지 · 실행 명령
  - `link` → 그대로 링크
  - `ask` → 사용자에게 묻는다
- 근거 범위(설정 "범위")를 벗어난 자료는 쓰지 않는다.
- 결과 파일의 키(run 이름 · 조건 코드)는 설정 "숫자 읽는 법" 표로 고른다. 표가 없거나 맞는 행이 없으면, 같은 숫자를 이미 쓴 노드나 원문 표와 맞춰 보고 고른 근거를 노드 `## 원문`에 적는다. 그래도 모르면 사용자에게 묻는다.
- 찾다가 생각과 다른 사실이 나오면(예: 응답에는 없는 선언이 파싱 결과에 있음) 노드에 그대로 반영하고 근거 파일에 메모를 남긴다.

## 3. 노드 쓰기

- 형식: `references/node-formats.md`의 해당 종류, 설정 "노드 종류"가 다르게 정했으면 그쪽.
- 위치: `<위키 루트>/<종류>/<파일 이름>.md`. 폴더가 없으면 만든다.
- 문장 끝: 설정 `ending`. 용어: 설정 `glossary` 표와 "문체 · 용어" 절.
- 헷갈린-점 노드의 "왜 헷갈렸나"는 사용자가 말한 맥락 그대로(날짜 · 읽던 문서 · 절). 추측으로 채우지 않는다.

## 4. 수치 다시 확인

노드에 쓴 숫자를 근거 파일과 한 번 더 맞춘다(평균 · run별 값 · 조건 이름). 다른 노드에 같은 숫자가 있으면 그것과도.

## 5. 연결

1. index: 같은 종류 노드가 나열된 줄 · 절에 링크를 더한다. 알맞은 묶음(예: "평가 · 도구")이 있으면 그 안에.
2. 첫 등장: 1단계 목록의 노드마다, 그 용어가 처음 나오는 자리에 링크(노드마다 한 번만). 표 칸 · 괄호 속 언급이어도 그 노드의 첫 등장이면 건다. 코드 블록 · 인용문 · 제목에는 걸지 않고 그다음 등장에.
3. 용어표: 설정 `glossary`에 그 용어 행이 있으면 메모 칸에 링크.
4. 새 노드의 `## 관련`에 이웃 노드.
5. log: 설정 `log` 파일 끝에 `- YYYY-MM-DD: <무엇을 더했나, 근거를 복사했으면 어디로, 어디서 링크했나>` 한 줄.

## 6. 검사 · 커밋

1. 설정 "문체 · 용어"가 금지 표현 목록(예: `style-ban.tsv`)을 가리키면, 새로 쓴 문장을 그 목록과 grep으로 대조해 고친다.
2. 설정 `check` 명령을 위키 루트에서 실행(`cd <위키 루트> && <check>`).
3. `wiki-lint`의 스크립트로 링크 · index 확인:
   `python3 <wiki-lint 스킬 디렉터리>/scripts/wiki_lint.py <위키 루트> --changed`
4. 둘 다 통과하면 설정 `commit`:
   - `auto` → 이번에 만든 · 고친 파일만 경로로 하나씩 `git add <경로>`(`git add -A` · `-u` · `.` · `git commit -a` 금지). 커밋 직전에 `git diff --cached --name-only`가 이번 작업 목록과 정확히 같은지 확인하고, 다른 파일이 staged면 커밋하지 않고 알린다. 메시지는 `<commit_prefix><종류> 노드 <제목> — <한 구절>`.
   - `ask` → 커밋할 파일 목록을 보여 주고 묻는다.
   - `never` → 하지 않음.

   0단계 이후 이번 작업 파일이 다른 커밋에 이미 들어갔으면(`git log -3 --stat`) 다시 커밋하지 않고 그 커밋을 알린다. push는 하지 않는다.
5. 실패하면 고치고 다시. 고칠 수 없으면 무엇이 실패했는지 그대로 보고.

## 7. 보고

사용자에게: 노드 경로, 핵심 내용 3–5줄(정의 · 예 · 숫자 · 주의), 근거 복사 여부, 링크한 곳, 검사 결과, 커밋 해시. 노드 본문을 통째로 붙이지 않는다.
