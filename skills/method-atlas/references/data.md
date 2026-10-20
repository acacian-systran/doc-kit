# 데이터 형식 — `<key>.data.js`

파일은 `window.PAGE = { ... };` 하나다. 문자열 안 HTML 은 `lede` · `criterion` · `footer` · `ex.html` · `def.html` 에서만 해석되고
나머지는 모두 글자 그대로(escape) 나온다. 완성본은 `examples/text2sparql.data.js`.

```js
window.PAGE = {
  title: "Text2SPARQL 기법 비교",            // <title>, 빌드 시 파일 제목
  h1: "Text2SPARQL 기법 비교 (T1–T10)",       // 생략하면 title
  lede: "… 필터 조건은 같은 축 안에서 OR, 축 사이에서 AND 로 적용된다.",
  question: {k: "공통 예시 질문", v: "서울에 있는 대학의 설립 연도는?"},
  legend: [{label: "사전 인덱스", cls: "idx"}, {label: "KG 직접 접근", cls: "kg"}],
  criterion: "<b>개입 시점 기준</b> — …",     // 필터 보드 각주 (HTML)
  labels: {method: "기법", source: "논문"},   // 탭 · 문구의 명사. 그 밖에 boundary, noBuild, stageAxis, detail …
  stages: [{key: "pre", short: "Pre"}, {key: "mid", short: "Mid"}, {key: "post", short: "Post"}],

  axes: {
    structureTitle: "구조 분류", opsTitle: "운영 요건",
    structure: [
      {key: "build", name: "사전 구축", opts: ["배포 시 인덱스 구축", "예제 · 학습 데이터 작성", "다른 기법 자원 재사용", "없음"], cls: ["", "", "", "none"]},
      {key: "stage", name: "개입 시점", opts: ["Pre · 생성 전", "Mid · 생성 중", "Post · 생성 뒤"]},
    ],
    ops: [
      {key: "agent", name: "에이전트", opts: ["필요 (다회 도구 호출)", "고정 반복 루프", "단발 호출"]},
      {key: "paper", name: "근거 논문", opts: ["SPARQL-LLM", "SAGA", "PGMR"], tip: "● 핵심 또는 ○ 부분 사용"},
    ],
  },
  compareDefault: ["T1", "T4", "T5"],         // 비교 탭 기본 선택
  exampleDataLabel: "예시 KG",               // 예시 데이터 블록 제목
  diagramLegend: {kg: "KG"},                  // 구조도 범례 이름 덮어쓰기 (tech llm store kg other io)
  sourceColumns: ["조회 방식", "에이전트", "주 개입 시점"],  // 근거 비교표 열 = sources[].meta 의 key

  // 권장 출발점 (선택, 권장) — 첫 화면의 답. 판단 주체를 label 에 적는다
  answer: {label: "권장 출발점 · Claude 판단", html: "… <b>T3 + T4 + T8 + T9</b> 로 시작한다 …", note: "근거는 …", ids: ["T3", "T4", "T8", "T9"]},
  // 흐름 지도 (선택) — 필터 보드 위 격자. 행 축 × 열 축 칸에 기법을 놓고, 올리면 한계 「(→ Tn)」 으로 이어진 기법을 강조한다
  map: {rows: "fail", cols: "stage", title: "막는 실패 × 개입 지점", lede: "한 줄 설명 (HTML)"},
  // 조합 (선택) — 「조합」 탭. 축(combosAxis, 기본 map.rows) 값마다 묶음 안 누가 막는지 ● 와 막힘/남음을 자동 계산
  combos: [{name: "A. Outbox 기본 조합", ids: ["T3", "T4", "T8", "T9"], when: "언제 쓰나", residual: "남는 위험", cost: "드는 것"}],
  combosAxis: "fail",
  // 보기 스위치 기본값. 보는 사람이 머리의 「보기」 단추로 바꾸며, 브라우저에만 저장된다. viewToggles: false 면 단추를 숨긴다
  views: {map: true, combos: true, compact: true, filters: false},   // 기본값. filters = 필터 보드 펼침
  matrix: true,   // 흐름 지도가 있어도 요약 행렬 탭을 보이고 싶을 때만

  methods: [{
    id: "T1", name: "Data-Aware Schema (VoID → ShEx)", short: "Data-Aware Schema",
    stage: "pre",                              // 색 슬롯 pre | mid | post
    one: "VoID 에서 class 별 ShEx 를 생성해 인덱싱하고, …",
    def: {text: "원문 영어 용어를 살린 정의", formula: "P_τ(e) = { … }", src: "원문 — SPARQL-LLM §3.1.2", link: "https://…"},
    sources: {"SPARQL-LLM": "●", "SAGA": "○"},
    badges: [["조회 방식", "Semantic Parsing ● · Graph Exploration* ●"],
             ["검색 증강", "●", "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"]],  // 3번째 = 분류 표 설명
    v: {build: [0], stage: [0, 1], agent: [2], paper: [0, 1]},   // 축 key → opts 번호들. 모든 축 필수
    flow: [
      {l: "검색 키", t: "high-level concepts", v: "「대학」 · 「도시」", tag: "T3 decomposition 출력"},
      {l: "출처", t: "vector database", s: "indexed schema classes (ShEx)", c: "idx"},
      {l: "조회 결과", t: "ShEx shape", m: "ex:UniversityShape {\n  ex:locatedIn [ ex:City ] }"},
    ],
    ex: {data: "ex:HanbitUniv a ex:University ; …", html: "<h4>① …</h4><p>…</p><div class=\"tw\"><table>…</table></div>"},
    pc: {usePro: "…", useCon: "…", skipPro: "…", skipCon: "…"},
    limit: "KG 전체를 요약한 스키마이므로, 특정 개체에 해당 간선이 존재한다는 보장은 없다 (→ T5).",
    notes: {build: "● VoID → ShEx, 임베딩 인덱스", agent: "— 단발 생성 앞에서 prompt 에 넣는다"},  // 축 key → 이 기법 설명
    bySource: {"SPARQL-LLM": "근거별 적용 방식 한 문단"},
    rel: [["보완", "T3"], ["자원 공유", "T6"], ["충돌", "T7", "‡ 이유"]],
    diagram: {
      nodes: [
        {id: "kg", c: 0, r: 0, k: "kg", n: "KG endpoint", ty: "[SPARQL endpoint]", d: ["VoID description"], off: true},
        {id: "q", c: 0, r: 1, k: "io", n: "질문", ty: "[입력]", d: ["서울에 있는 대학의", "설립 연도는?"]},
        {id: "t3", c: 1, r: 1, k: "other", ref: "T3", n: "Decomposition", ty: "[T3]", d: ["concepts:", "대학 · 도시"]},
        {id: "tech", c: 2, r: 1, k: "tech", n: "Schema Retriever", ty: "[T1 · 임베딩 유사도]", d: ["concept 마다", "15 classes"]},
      ],
      edges: [{f: "kg", t: "bld", off: 1}, {f: "q", t: "t3", n: 1}, {f: "tech", t: "idx", n: 3, both: 1}, {f: "llm", t: "tech", n: 5, route: "above"}],
      steps: ["간선 1 에서 일어나는 일", "간선 2 …"],      // 번호 붙은 간선 수와 같아야 한다
      offNote: "사전 구축 한 줄",                        // 또는 offNone: "구축 없음 이유"
    },
  }],

  sources: [{
    key: "SPARQL-LLM", title: "논문 전체 제목",
    links: [["arXiv 2512.14277", "https://arxiv.org/abs/2512.14277"], ["코드", "https://github.com/…"]],
    meta: [["조회 방식", "Semantic Parsing"], ["에이전트", "없음 (고정 검증 루프)"], ["주 개입 시점", "Pre · Post"]],
    problem: "해결하려는 문제. 첫 문장이 비교표에 들어간다.",
    core: ["Indexing Component — 설명", "…"],
    claim: "주장 한 문장",
    limits: ["…"],
  }],

  glossary: [
    ["개입 시점", [["Pre-Generation", "LLM generation 이전에 적용하는 enhancement", "GraphRAG 서베이 Fig. 2"]]],
  ],
  footer: "<div>근거 논문 — <a href=…>…</a></div><div>분류와 판정은 Claude 가 제안한 것이며 …</div>",
};
```

## 실제 실행 출력

예시를 실제로 돌렸으면 `ex.html` 안에서 지어낸 예시와 구별한다. 환경(버전)을 `p.src` 한 줄로 적고, 출력은 아래처럼 grep 한 줄 그대로 넣는다.
줄이거나 고치지 않는다. 실행 프로젝트는 `papers/<key>/lab/` 에 두고 README 에 실행 명령 · 버전을 남긴다.

```html
<div class="runk">T8 있음 · 실행 출력</div>
<pre class="run">recv e-77 → skip (already processed)
final stock A = 8</pre>
```

## 구조도 좌표 요령

- 열 `c` 0–4(넘으면 폭이 늘어난다), 행 `r` 0–2. 상자 140×88, 열 간격 180, 행 간격 144.
- 같은 행 · 같은 열 간선은 직선, 그 밖은 꺾은선(가로 먼저, `route:"vh"` 면 세로 먼저).
- 같은 행에서 건너뛰는 간선(열 0 → 열 2)은 사이 상자를 가로지르므로 피하거나 `route:"above"|"below"` 를 쓴다.
- 번호 원은 가장 긴 선분 가운데 놓인다.
