---
name: {{TITLE}}
language: ko
index: index.md
log: log.md
glossary: 용어.md
node_types: 개념, 기법, 결과, 한계, 헷갈린-점
evidence: ../study
sources: ../study/paper.txt
outside_policy: link
check: python3 {{SKILL_DIR}}/scripts/check_quotes.py .
commit: {{COMMIT}}
commit_prefix: wiki({{CITEKEY}}): 
ending: {{ENDING}}
ignore: plan.md, 그림
---

# {{TITLE}} 위키 설정

논문 한 편({{CITEKEY}})을 노드로 나눈 위키. `wiki-from-paper`가 만들었고, 이후 노드는 `wiki-add`로 더함.
공용 형식과 다른 것만 적음.

## 범위

- 이 논문 한 편. 다른 논문 · 일반 지식은 근거로 쓰지 않음. 표준 정의가 꼭 필요하면 한 문장, 앞에 `논문 밖:`.
- 읽은 범위: {{READ_RANGE}}

## 근거 규칙

- 숫자 · 주장은 `../study/paper.txt`(쪽 표시 `[[p.N]]`)에서만. 표 숫자는 `--layout`으로 뽑은 쪽 파일(`../study/paper.pN.layout.txt`)에서 읽음.
- 노드 맨 끝 `## 원문`에 인용을 한 줄씩: `- [p.N] "원문 그대로"`. `check_quotes.py`가 그 쪽에 있는지 검사함.
- 저자 주장과 숫자가 말하는 것을 나눔. 저자 해석은 "저자:"로 시작.

## 노드 종류

`{{SKILL_DIR}}/references/paper-nodes.md`의 개념 · 기법 · 결과 · 한계 형식. 헷갈린-점은 wiki-kit 공용 형식이고, 사용자가 실제로 헷갈린 질문만 노드로 만듦(자동 생성 안 함).

## 문체 · 용어

- 문장 끝: {{ENDING}}.
- 용어는 [용어](용어.md) 표. 논문 용어는 영어 원문을 제목으로 쓰고, 번역어는 aliases와 용어표에.

## 연결

- index: 종류별 절, 같은 종류 안에서는 plan.md 순서(앞 노드를 알아야 뒤 노드를 읽을 수 있는 순서).
- 다른 노드에 처음 나오는 곳과 용어표 해당 행 메모에 링크.

## 그림

- 방식: `{{FIGURES}}`(svg · mermaid · none). svg는 `그림/make_w_<이름>.py` + `<이름>-labels.md`, 공통 처리는 `그림/wfig.py`.
