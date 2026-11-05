# {{NAME}}

{{ONE_LINE}} 노드 하나가 개념 · 결정 · 결과 하나이고, 링크를 따라가면 근거까지 이어짐.

## 노드

{{#each NODE_TYPES}}
### {{this}}
(아직 없음)

{{/each}}
## 시간순

[변경 기록](log.md)

## 노드 규칙

- 노드 하나 = 개념 · 결정 · 결과 하나. frontmatter `type`(폴더와 같음)과 `aliases`(검색어)
- 형식은 wiki-kit 공용 기본값, 다른 점은 [wiki.config.md](wiki.config.md)
- 숫자는 근거 파일에서만, 링크는 표준 Markdown 상대 경로
- 바꾸면 [log.md](log.md)에 한 줄
