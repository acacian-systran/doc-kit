# spec JSON 형식

`build.py` 가 읽는 파일 하나. 기준 예시는 `examples/support-bot.json`. 처음에는 이 파일을 복사해서 고친다.

```jsonc
{
  "page": {
    "title": "그림 A 코드 기준판",       // <title> · h1. 두세 단어 이름
    "eyebrow": "…",                      // 선택
    "lede": "`pipeline.py`의 …",           // 선택. `code` · **굵게** 됨
    "modes": true,                       // 색 · 흑백 토글 (기본 true)
    "color_label": "덱용 색", "bw_label": "논문용 흑백"
  },
  "verdict": {"head": "확인 결과: …", "body": "…"},   // 선택. 사용자가 "맞는지 확인"을 물었을 때만

  "figure": {
    "eyebrow": "그림 A · 코드 기준", "heading": "table 하나마다: …",
    "viewBox": [1000, 700],
    "desc": "그림 전체를 글로 — 스크린리더 · 대체 텍스트",
    "legend": {"x": 700, "y": 46, "col_w": 90, "hide": ["frag"],
               "roles": {"merge": "Integrate"},
               "lines": {"flow": "flow", "write": "write core", "read": "read · fallback"}},  // false 면 범례 없음
    "frames": [
      {"kind": "loop",  "x": 120, "y": 124, "w": 830, "h": 451, "label": "Iterate · BFS (FK)", "at": [200, 143]},
      {"kind": "group", "x": 475, "y": 128, "w": 290, "h": 167, "label": "Retrieval · top-3 each"}
    ],
    "nodes": [
      // 타일 (기본). x, y 는 왼쪽 위. w, h 기본 60
      {"id": "a", "badge": "a", "x": 160, "y": 170, "role": "rule", "icon": "table",
       "label": "Each table", "pos": "below", "fs": 12.5, "label_dy": 0,
       "tip": "(a) traverse_schema_fk_order: … pipeline.py:120"},
      // 띠: 누적 상태
      {"id": "core", "kind": "band", "x": 270, "y": 300, "w": 460, "h": 52, "role": "merge", "icon": "onto", "label": "Core ontology", "tip": "…"},
      // 판단: 중심 (cx, cy), 반지름 rx 45 · ry 26 기본
      {"id": "m", "badge": "m", "kind": "decision", "cx": 190, "cy": 470, "label": "Last table?", "tip": "…"}
    ],
    "edges": [
      {"from": "a", "to": "b"},                                   // 자동: 곧은 선 또는 L 자
      {"from": "c", "to": "core", "kind": "write", "label": "Direct mapping merged", "at": [402, 286], "anchor": "end"},
      {"from": "core", "to": "f", "kind": "read", "x": 705},       // 세로선 x 고정
      {"from": "h", "to": "k", "via": "vh"},                       // L 자 방향: hv(가로 먼저) · vh(세로 먼저)
      {"path": [[145, 470], [134, 470], [134, 200], [158, 200]], "loop": true, "label": "next table", "at": [142, 345]},
      {"path": [[610, 502], [610, 545]], "arrow": false}           // 합류선(화살촉 없음)
    ],
    "texts": [{"x": 140, "y": 436, "text": "no", "cls": "s"}],    // 선에 붙지 않는 글자. cls: s · xs · m · t · hlt
    "caption": "그림 밑 한 줄"
  },

  "matrix": {                     // 선택: 방법 · 설정마다 쓰는 단계
    "heading": "방법마다 사용되는 단계",
    "cols": [["(a)", "Each table"], ["(b)", "DM"]],
    "rows": [{"name": "RIGOR", "cells": ["full", {"v": "part", "tip": "schema JSON 순서"}]}]   // full · part · none
  },
  "steps": {"heading": "처리 단계 (a)–(n)", "items": [{"k": "a", "text": "…"}]},
  "notes": {"heading": "코드 기준 보충", "lede": "…", "items": [{"title": "(c) DM 먼저 통합", "text": "…", "ref": "`pipeline.py:170–179`"}]},
  "diff":  {"heading": "이전 그림과 다른 점", "cols": ["곳", "이전 그림", "코드"], "rows": [["…", "…", "…"]]}
}
```

## 간선 자동 경로

`from` · `to` 만 주면 이 순서로 고른다.

1. `x` 가 있으면 그 x 의 세로선, `y` 가 있으면 그 y 의 가로선.
2. 한쪽 중심 x 가 다른 쪽 가로 범위 안이고 위아래로 떨어져 있으면 세로선(띠에 꽂히는 선이 이 경우).
3. 한쪽 중심 y 가 다른 쪽 세로 범위 안이면 가로선.
4. 아니면 L 자 — `via: "hv"`(기본, 가로로 나가 세로로 들어감) 또는 `"vh"`.

시작점은 출발 도형의 변, 끝점은 도착 도형 변에서 2 떨어진 곳(화살촉 자리). 틀 경계에서 끊어야 하거나(틀 안으로 들어가는 선)
고리 · retry 처럼 꺾임이 둘 이상이면 `path` 로 점을 직접 준다. `from` · `to` 에 `[x, y]` 점을 줘도 된다.

## 선 라벨 위치

`at` 이 없으면 첫 선분 가운데 — 가로선이면 위 8, 세로선이면 오른쪽 8. 대부분 `at` 으로 직접 준다.
`check.py --render` 가 라벨이 선 · 틀 · 타일 · 다른 글자와 겹치면 실패로 알려 주므로, 대충 놓고 검사로 맞춘다.

## 노드 · 간선 data (선택)

`nodes[].data` 는 그 자리에 **저장된 형태**, `edges[].data` 는 그 선으로 **주고받는 데이터**. 있으면 그 타일 · 선(라벨 포함)을
마우스로 올리면 오른쪽 칸에 미리 보이고, 누르거나 Enter · Space 로 고정, Esc · × 로 닫는다. 실무진이 추상 이름이 아니라
실제 값을 확인하게 하는 용도라 `body` 는 실제 실행 파일에서 그대로 뽑는다(손으로 옮겨 적지 않음).

```jsonc
"data": {
  "title": "Retrieval query (04)",          // 칸 제목
  "kind": "만든 것",                         // 선택. 기본: 타일이면 "저장된 형태", 선이면 "주고받는 데이터"
  "lede": "vector는 파일로 남지 않음 …",      // 선택
  "items": [{"h": "검색어", "src": "runs/…/02_retrieval_query.txt:1–1 · 1행", "body": "COMTNBBS …", "note": "선택"}]
}
```

선에 data 가 있으면 굵은 투명 선(`.hit`)이 덧그려져 누르기 쉬워진다. `check.py` 는 `.hit` 를 선으로 세지 않는다.
