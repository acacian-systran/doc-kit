# deck — 마크업 · 색 · 대본

Slides 아티팩트 형식(1920×1080, 인라인 스타일만)을 따른다. 아래 마크업 예시의 색은 HermiT 첫 판의 것이며, 실제 값은 `deck/style.md` 에서 가져온다.

## 디자인 방향 — 덱마다 새로 정한다

색·서체·배치를 다른 시리즈(예: Evals 스터디 덱 규칙)에서 그대로 가져오지 않는다. 가져오는 것은
**내용 규칙**(명사구 제목, 도형 우선, 읽는 대본, 출처 표시)뿐이다. 겉모습은 예시 영역에서 끌어온다.

1. 예시 영역의 시각 언어 하나를 고른다 — 공항이면 안내 표지판·출발 안내판, 병원이면 차트·처방전, 물류면 운송장·컨베이어.
2. 그 언어로 **반복 부품 세 가지**를 정한다: 섹션 표지(공항: GATE A–E), 결과 모음 화면(출발 안내판), 상태 표현(추론 · 운항 불가 · 공항 폐쇄 · 정상).
3. 바탕 두 가지(밝은 설명용, 어두운 강조용), 강조색 하나(영역에서 가져온 색), 상태 색 셋(추론됨 · 오류 · 정상)을 정한다. 추론됨은 도구 UI 의 표시색과 맞추면 화면 읽기 슬라이드와 이어진다(Protégé = 연노랑).
4. 서체는 한글 본문 하나 + 숫자·표지용 하나(+ 코드용 mono). 
5. `deck/style.md` 에 표로 적는다. 예: `papers/glimm-2014-hermit/deck2/style.md`.

색만으로 말하지 않는다 — 칩 안에 "불일치", "정상" 같은 글자를 함께 쓴다.
비유 이름(운항 불가 등)은 화면에서 반드시 정식 용어와 짝지어 한 번 보여 준다.

## 공통 마크업

```html
<section id="ID" style="background:#FAF7F0;color:#1F1D1A;font-family:'Noto Sans KR', Arial, sans-serif;padding:128px 154px 160px;display:flex;flex-direction:column;gap:44px">
<div style="display:flex;flex-direction:column;gap:12px">
<p style="font-size:24px;font-weight:700;letter-spacing:4px;color:#6F6A60">EYEBROW</p>
<h2 style="font-family:'Noto Serif KR', Georgia, serif;font-size:64px;font-weight:700;line-height:1.15">명사구 제목</h2>
</div>
<!-- 본문 -->
<p style="font-size:32px;font-weight:500">결론 한 줄 — 명사형 끝맺음</p>
<p style="position:absolute;left:154px;bottom:64px;width:1200px;font-size:24px;color:#6F6A60">도구 · 섹션</p>
<p style="position:absolute;right:154px;bottom:64px;width:200px;font-size:24px;color:#6F6A60;text-align:right">NN / 총장수</p>
<aside>대본</aside>
</section>
```

자주 쓴 본문 부품:

- **입력 → 결과 줄**: 가로 flex, 입력 칩(`#F1ECE2` 면 또는 개념 테두리) · `<x-shape kind="arrow-right">` · 결과 칩(색의 뜻대로).
- **전과 후**: 카드 두 개 사이에 화살표와 도구 이름. 계층은 `padding-left:48px; border-left:2px solid #D9D3C7` 로 들여 쓴 div 를 중첩.
- **흔한 기대 vs 실제**: 라벨 칸(width 260px) + 칩. 흔한 기대 칩은 점선 회색.
- **비교표**: `<table>` 28px, 첫 열은 흐린 글자, 칸마다 한 줄.
- **도구 출력**: `#F1ECE2` 면에 JetBrains Mono 24~26px, 실제 출력 그대로 2~4줄.
- **BEFORE → AFTER**: 줄 카드, 왼쪽 따옴표 친 막연한 말(width 500px, 흐린 글자) · 화살표 · 굵은 용어 + 풀이.

크기 계산: 안쪽 높이 792px. 제목 묶음 약 122px, 간격 40~48px, 결론 줄 약 45px. 한글 한 글자 ≈ 글자 크기, 라틴 ≈ 0.6배. 칸이 넘치면 글자를 줄이지 말고 문구를 줄이거나 칸을 넓힌다.

## 대본(`<aside>`)

- 발표자가 그대로 읽는다. 250~350자, "~입니다/~습니다"에 가끔 "~죠", "~거든요".
- 첫 문장은 핵심, 마지막 문장은 "다음은 ○○입니다".
- 화면 위치를 가리키는 문장 앞에 ①②③. "왼쪽/오른쪽"은 쓰지 않는다.
- 용어는 슬라이드마다 첫 등장에 `English(한글 풀이)`, 한글은 용어집의 뜻. 발음 표기 금지.
- 나란히 소개하는 항목은 "설명 + 용어입니다", 대비는 "○○하는 것이 △△입니다".
- 줄바꿈은 `<br>`, 선택 블록 앞은 `<br><br>`: `(시간 남으면)` · `(예상 질문) Q. … → A. …`.
- 내가 만든 예시는 줄 끝 `[발표자 예시: 장면 이름, 실행 결과 N번]`, 의견은 `[발표자 의견] 저는 ~라고 봅니다`.
- 화면이 실제 UI 캡처가 아니라 모형이면 `[발표자 예시: 화면 모형, 실제 캡처 아님]`.
