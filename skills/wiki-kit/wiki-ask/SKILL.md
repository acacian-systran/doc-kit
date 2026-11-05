---
name: wiki-ask
description: Answer a question from a project wiki (wiki-kit or any Markdown wiki with relative links) and its evidence only — read-only, never edits a file. Searches node titles and aliases, follows links to the evidence, answers in a few sentences with the node and evidence links that carry each claim, and says plainly when the wiki does not hold the answer, then offers wiki-add to keep it. Use when the user asks 위키에서 찾아줘 · 위키 기준으로 답해줘 · 우리 위키에 X 있어? · X가 뭐였지(프로젝트 용어) · 이 숫자 어디서 나왔지 · ask the wiki, or asks about a project term or number that the wiki covers. Part of wiki-kit (with wiki-init, wiki-add, wiki-lint).
---

# 위키에 묻기

읽기 전용. 파일을 쓰지도 고치지도 않는다. 답은 위키와 그 근거 파일에 있는 것만.

## 1. 위키 찾기

`wiki.config.md`를 찾는다(번들 README "설정 파일 찾기"). 없으면 `index.md`가 있는 Markdown 폴더를 위키로 본다. 둘 다 없으면 위키가 없다고 말하고 멈춘다.

## 2. 찾기

순서대로, 찾으면 멈춘다.

1. 제목 · `aliases`:
   ```bash
   grep -rl -i -E "^# .*<말>|^  - .*<말>|aliases:.*<말>" <위키 루트> --include='*.md'
   ```
2. index에서 그 말이 있는 줄 → 링크된 노드
3. 본문 전체 grep → 가장 많이 다루는 노드 2–3개
4. 노드 `## 원문`이 가리키는 근거 파일(숫자 질문이면 반드시 열어 확인)

## 3. 답하기

- 첫 문장이 답. 두세 문장 + 필요하면 작은 표 하나.
- 문장마다 근거 링크: `[노드](경로)`, 숫자는 근거 파일까지.
- 노드끼리 숫자가 다르거나 노드와 근거가 다르면 숨기지 않고 둘 다 보이고 어긋남을 알린다(고치는 것은 `wiki-lint`/`wiki-add` 몫).
- 위키에 없는 부분은 "위키에 없음"이라고 쓰고 구분한다. 일반 지식으로 보충하면 그 문장 앞에 "(위키 밖)".

## 4. 위키에 없을 때

답이 위키에 없거나 일부만 있으면 끝에 한 줄:
"이 내용을 노드로 남길까요? (`wiki-add` — <종류> 노드 '<제목>')"
사용자가 원하면 `wiki-add`로 넘어간다. 이 스킬 안에서는 쓰지 않는다.
