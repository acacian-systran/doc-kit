---
name: book-reader
description: Turn a book kept as one Markdown file per chapter (O'Reilly clippings, web clippings, Obsidian notes) into a static web reader that opens from file:// — a home page with every chapter, its reading time and progress and a "continue reading" link; chapter pages with a chapter list and an in-chapter contents list that tracks the current section, a progress bar, prev/next, light · sepia · dark themes, text size and line width; math (KaTeX), code highlighting, numbered figures and tables, cross references and footnotes. A translated copy whose Korean lines sit under each English block becomes an English + 한국어 edition with a KO on/off switch. Drag over a word to save it with its sentence and section; the Words drawer copies them to Quizlet, saves an Anki file, or exports them for reading-vocab, which writes the meaning the book uses into that chapter's deck. Optionally colours English sentence structure with esh. Everything that differs between books lives in one book.json. Use whenever the user asks to 책 웹으로 읽기 · 원서 리더 · 마크다운 책을 웹페이지로 · 읽기 좋게 만들어줘 · 오라일리 클리핑 읽기 · 번역본이랑 같이 보기 · 한영 병기 리더 · 책 리더 다시 빌드, or hands over a folder of chapter Markdown files to read in a browser. For an explainer that adds new commentary to a paper, use paper-explainer instead; for a word deck chosen by Claude, use reading-vocab.
---

# 책 → 웹 리더

장마다 Markdown 파일 하나인 책을 브라우저에서 읽기 좋은 정적 사이트로 만든다. 본문은 **원문
그대로** 렌더한다 — 해설을 덧붙이지 않는다. 덧붙이는 일은 `paper-explainer` 의 몫이다.

코드는 이 스킬의 `assets/` 에 하나만 있고, 책마다 다른 것은 `book.json` 한 파일에만 적는다.
빌드 스크립트에 책 제목이나 경로를 넣지 않는다.

## 1. 파일 배치

```
papers/<key>/                       # key = 제1저자성-연도-제목첫단어 (shankar-2026-evals)
  reader/
    book.json                       # 이 책의 설정 — 유일한 원본
    esh.yaml                        # (선택) 영어 구문 하이라이팅 설정
    site/  site-ko/                 # 빌드 산출물. 손으로 고치지 않는다
  study/  vocab/                    # paper-tutor · reading-vocab 와 공유
```

원문은 옮기지 않는다. `book.json` 이 볼트 안의 원래 폴더를 가리킨다.

## 2. `book.json`

`assets/book.example.json` 을 복사해 고친다.

| 키 | 필수 | 내용 |
|---|---|---|
| `key` | 예 | `papers/<key>` 의 key. 내보낸 단어 파일 이름이 이것으로 시작해 `reading-vocab` 이 책을 찾는다 |
| `title` | 예 | 책 제목 |
| `authors` | 아니오 | 표지에 쓸 저자 |
| `kicker` | 아니오 | 표지 위 작은 줄 (`O'Reilly · Early Release`) |
| `store` | 아니오 | localStorage 접두사. 기본은 `key`. **한 번 정하면 바꾸지 않는다** — 바꾸면 저장 단어 · 진도 · 설정이 안 보인다 |
| `front` | 아니오 | 0번 장의 이름. 기본 `Preface` |
| `chapterFiles` | 아니오 | 장 파일을 고르는 정규식, 첫 그룹이 장 번호. 기본 `^(\d+)\..*\.md$` (`3. Error Analysis.md`) |
| `sourceUrl` | 아니오 | 온라인판 주소. 그 아래 `chN.html` · `preface…` 링크를 로컬 페이지로 바꾼다 |
| `editions` | 예 | `{ "<이름>": { "src", "out", "bilingual"?, "label"? } }`. `src` 는 원문 폴더, `out` 은 산출 폴더. `~/` 는 홈, 그 밖의 상대 경로는 `book.json` 기준 |
| `texFixes` | 아니오 | 클리핑이 망가뜨린 수식 고치기. `[["정규식", "바꿀 문자열"], …]` 을 블록 수식 TeX 에 차례로 적용 |
| `esh` | 아니오 | `esh` 설정 파일 경로. 없거나 `esh` 가 설치돼 있지 않으면 건너뛴다 |

판이 둘 이상이면 머리줄에 서로를 오가는 링크가 생긴다. 이름은 `label`, 없으면 이중 언어판이
`EN + 한국어`, 아니면 `English only` 다.

## 3. 원문 형식

빌드가 알아보는 것과 처리 방식:

| 원문 | 결과 |
|---|---|
| 파일 이름 앞 숫자 | 장 번호 → `chNN.html`. 0 은 `front` |
| 장 첫머리의 `## Chapter 3. …` (없으면 첫 줄의 `##`) | 페이지 제목. 이런 제목이 없는 장(서문)은 제목을 따로 떼지 않는다 |
| `##` · `###` | 목차 항목과 앵커 |
| 이미지만 있는 문단 | 번호 붙은 그림(`Figure 3-1`). 바로 뒤에 같은 캡션 문단이 있으면 지운다 |
| `$…$` · `$$…$$` | KaTeX. 코드 블록 안은 건드리지 않는다 |
| `[[노트#제목\|별칭]]` | 장 노트를 가리키면 로컬 페이지 링크, 아니면 글자만 |
| `Figure 3-1` · `Table 5-1` · `“Section Title”` 링크 | 해당 그림 · 표 · 절로 |
| `> [!summary] 제목` | 콜아웃 상자 |
| `~x~` | 아래첨자 |

**이중 언어판**(`"bilingual": true`)은 번역 사본의 형식을 따른다.
- 영어 블록 바로 뒤의 한국어 블록(문단 · 목록 항목 · 표)을 번역으로 보고 KO 스위치(`K`)로 숨긴다.
  한글이 글자의 15% 이상이면 한국어 블록이다.
- 제목 바로 아래 `**한국어 제목**` 한 줄은 그 제목에 붙는다.
- 목록 항목 아래의 한국어만 있는 하위 목록은 그 항목의 번역이다.
- 콜아웃은 번역자의 메모로 보고 KO 스위치를 따른다.
- 각주는 영어 줄 바로 아래 들여쓴 한국어 줄을 별도 문단으로 나눈다.

이 형식에 맞지 않는 원문은 빌드 스크립트를 고치기 전에 사용자에게 원문 쪽을 맞출지 묻는다.
새 규칙을 넣을 때는 모든 책에 적용해도 되는 것만 넣고, 한 책에만 필요하면 `book.json` 키로 뺀다.

## 4. 빌드

```bash
npm ci --prefix <스킬경로>/assets                    # 처음 한 번 (markdown-it · KaTeX · highlight.js)
node <스킬경로>/assets/build.mjs papers/<key>/reader/book.json        # 모든 판
node <스킬경로>/assets/build.mjs papers/<key>/reader/book.json ko     # 한 판만
ESH=0 node …                                          # 구문 하이라이팅 건너뛰기
```

빌드는 `out` 폴더를 지우고 다시 만든다. 원문을 고쳤으면 다시 빌드한다.

## 5. 단어 저장과 `reading-vocab` 연계

읽다가 단어나 구(8단어 이하)를 드래그하면 뜻 입력 칸이 뜨고, 저장하면 문장 · 대응 번역 문장 ·
장과 절이 함께 남는다. 머리줄 **Words**(`W`) 서랍에서:

| 버튼 | 산출 | 다음 |
|---|---|---|
| Copy for Quizlet · Download .txt | 탭 구분 텍스트 | Quizlet → 가져오기 |
| Anki .csv | 앞면 · 뜻 · 문장 · 번역 · 위치 | Anki → 가져오기 |
| **For reading-vocab** | `<key>-picked-<날짜>.csv` | Claude 에게 주면 `reading-vocab` §10 이 원문 속 뜻을 적어 그 장의 덱 맨 앞에 넣고 `hard.txt` 에 올린다 |

사용자가 적은 뜻은 바로 쓰는 Quizlet 용이고, 원문 속 뜻을 확인한 카드는 `reading-vocab` 쪽이다.
picked 파일의 앵커(`ch03 §Section`)는 `reading-vocab` 의 앵커 형식과 같다 — 페이지 이름 `chNN` 이
덱 폴더 이름이 된다.

저장 단어는 브라우저 localStorage(`<store>-words`)에 있다. 브라우저 데이터를 지우면 사라지므로
서랍의 **Backup .json** 으로 받아 두라고 안내한다.

## 6. 검사

- [ ] 빌드가 장 수를 출력하고 오류 없이 끝났다
- [ ] 이전 빌드가 있으면 `diff -r` 로 비교해, 바뀐 곳이 이번에 고친 것뿐이다
- [ ] 브라우저(헤드리스 가능)에서 한 장을 열어 콘솔 오류가 없고, 목차 · 그림 · 수식이 보인다
- [ ] 단어 하나를 저장해 서랍에 나오고, **For reading-vocab** 파일의 `anchor` 가 `chNN §…` 꼴이다
- [ ] 이중 언어판이면 `K` 로 한국어가 사라지고, 판 전환 링크가 같은 장으로 간다

## 7. 응답

`site/index.html` 경로(판마다 하나), 장 수, 확인한 것과 확인하지 않은 것을 적는다. 처음
만들었으면 단어 저장 → **For reading-vocab** 흐름을 한 줄로 알린다.

## 8. 다른 스킬과의 관계

- `reading-vocab` — 저장한 단어의 원문 속 뜻 · 덱 · 아는 단어 관리(§5). 장 원문 평문은 그쪽의
  `mdtext.py` 가 뽑는다. 리더의 렌더러와는 용도가 달라 공유하지 않는다.
- `paper-explainer` — 원문에 해설을 써 붙이는 사이트. 이 스킬은 원문만 보여준다.
- `esh`(`~/projects/esh`, 스킬 아님) — 영어 구문 하이라이팅. 설정은 `papers/<key>/reader/esh.yaml`.

## 9. 참고 파일

- `assets/build.mjs` — 빌드. 책 설정은 모두 `book.json` 에서 읽는다
- `assets/reader.css` · `reader.js` — 레이아웃 · 테마 · 진도 · 단축키
- `assets/vocab.js` — 단어 저장 · 서랍 · 내보내기
- `assets/book.example.json` — 『Evals for AI Engineers』 설정
