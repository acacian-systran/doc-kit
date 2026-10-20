/* Text2SPARQL 환각 감소 기법 비교 — method-atlas 의 기준 예시 (원본 아티팩트에서 변환) */
window.PAGE = {
 "title": "Text2SPARQL 기법 비교",
 "h1": "Text2SPARQL 기법 비교 (T1–T10)",
 "lede": "SPARQL-LLM · SAGA · PGMR 의 기법 T1–T10 을 동일한 분류 축으로 비교한다. 필터 조건은 같은 축 안에서 OR, 축 사이에서 AND 로 적용된다.",
 "question": {
  "k": "공통 예시 질문",
  "v": "서울에 있는 대학의 설립 연도는?"
 },
 "legend": [
  {
   "label": "사전 인덱스",
   "cls": "idx"
  },
  {
   "label": "KG 직접 접근",
   "cls": "kg"
  }
 ],
 "criterion": "<b>개입 시점 기준</b> — LLM 이 SPARQL 을 작성하는 호출을 기준으로 한다. <b>Pre</b>: 그 호출의 prompt 를 구성할 때 · <b>Mid</b>: 호출이 진행되는 도중 (에이전트 턴 사이의 도구 observation, LLM 출력 형식 자체의 변경) · <b>Post</b>: 출력된 쿼리를 받아 검사 · 치환 · 실행할 때. 같은 기법도 적용 시스템에 따라 시점이 달라 복수로 표시한다 (예: T10 은 SAGA 에이전트에서 Mid, 단발 생성 뒤 재시도 루프에서 Post).",
 "labels": {
  "method": "기법",
  "source": "논문"
 },
 "stages": [
  {
   "key": "pre",
   "short": "Pre"
  },
  {
   "key": "mid",
   "short": "Mid"
  },
  {
   "key": "post",
   "short": "Post"
  }
 ],
 "axes": {
  "structureTitle": "구조 분류",
  "opsTitle": "운영 요건",
  "structure": [
   {
    "key": "build",
    "name": "사전 구축",
    "opts": [
     "배포 시 인덱스 구축",
     "예제 · 학습 데이터 작성",
     "다른 기법 자원 재사용",
     "없음"
    ],
    "cls": [
     "",
     "",
     "",
     "none"
    ]
   },
   {
    "key": "src",
    "name": "출처",
    "opts": [
     "사전 인덱스",
     "KG endpoint",
     "LLM 출력 쿼리",
     "없음"
    ],
    "cls": [
     "idx",
     "kg",
     "",
     "none"
    ]
   },
   {
    "key": "what",
    "name": "조회 대상",
    "opts": [
     "스키마 (class · property)",
     "질문–쿼리 예제",
     "IRI",
     "개체 주변 트리플",
     "오류 · 빈 결과 신호",
     "없음"
    ],
    "cls": [
     "",
     "",
     "",
     "",
     "",
     "none"
    ]
   },
   {
    "key": "how",
    "name": "처리 방식",
    "opts": [
     "임베딩 유사도",
     "레이블 검색",
     "그래프 조회",
     "스키마 대조",
     "쿼리 실행",
     "LLM 분해 · 생성"
    ]
   },
   {
    "key": "stage",
    "name": "개입 시점",
    "opts": [
     "Pre · 생성 전",
     "Mid · 생성 중",
     "Post · 생성 뒤"
    ]
   }
  ],
  "ops": [
   {
    "key": "mode",
    "name": "조회 방식",
    "opts": [
     "Semantic Parsing",
     "Graph Exploration*"
    ],
    "tip": "● 논문이 사용 또는 ○ 원리상 가능"
   },
   {
    "key": "paper",
    "name": "근거 논문",
    "opts": [
     "SPARQL-LLM",
     "SAGA",
     "PGMR"
    ],
    "tip": "● 핵심 또는 ○ 부분 사용"
   },
   {
    "key": "agent",
    "name": "에이전트",
    "opts": [
     "필요 (다회 도구 호출)",
     "고정 반복 루프",
     "단발 호출"
    ]
   },
   {
    "key": "admin",
    "name": "KG 관리자 부담",
    "opts": [
     "수작업 작성 · 검수",
     "KG 품질 의존",
     "없음"
    ]
   },
   {
    "key": "schemaChg",
    "name": "스키마 변경 시",
    "opts": [
     "즉시 반영",
     "재인덱싱",
     "수작업 수정",
     "영향 없음 · 미미"
    ]
   },
   {
    "key": "instChg",
    "name": "개체 변경 시",
    "opts": [
     "즉시 반영",
     "재인덱싱",
     "영향 없음 · 미미"
    ]
   }
  ]
 },
 "map": {"rows": "what", "cols": "stage", "title": "조회 대상 × 개입 시점", "lede": "무엇을 보고 언제 끼어드는지. 기법에 올리면 그 한계를 맡는 기법이 강조된다."},
 "compareDefault": [
  "T1",
  "T4",
  "T5"
 ],
 "exampleDataLabel": "예시 KG",
 "diagramLegend": {
  "kg": "KG"
 },
 "sourceColumns": [
  "조회 방식",
  "에이전트",
  "주 개입 시점"
 ],
 "methods": [
  {
   "id": "T1",
   "name": "Data-Aware Schema (VoID → ShEx)",
   "short": "Data-Aware Schema",
   "stage": "pre",
   "one": "VoID 에서 class 별 ShEx 를 생성해 인덱싱하고, 질문과 유사한 shape 을 검색해 prompt 에 삽입한다.",
   "def": {
    "text": "SPARQL endpoint 의 VoID description 에서 class 별 ShEx shape 을 생성해 prompt 에 넣는다. LLM 이 실제로 존재하는 class · property 와 그 연결을 보고 쿼리를 쓰게 하는 기법이다.",
    "src": "원문 — SPARQL-LLM §3.1.2. SAGA 는 같은 계열을 schema-in-context methods 로 부른다",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7398"
   },
   "sources": {
    "SPARQL-LLM": "●",
    "SAGA": "○"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     0
    ],
    "src": [
     0
    ],
    "what": [
     0
    ],
    "how": [
     0
    ],
    "stage": [
     0,
     1
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     0,
     1
    ],
    "agent": [
     2
    ],
    "admin": [
     1
    ],
    "schemaChg": [
     1
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "검색 키",
     "t": "high-level concepts",
     "v": "「대학」 · 「도시」",
     "tag": "T3 decomposition 출력"
    },
    {
     "l": "처리 방식",
     "t": "embeddings-based similarity search",
     "s": "concept 마다 15 most similar classes"
    },
    {
     "l": "출처",
     "t": "vector database",
     "s": "indexed schema classes (ShEx)",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "ShEx shape (class 별)",
     "m": "ex:UniversityShape {\n  ex:locatedIn [ ex:City ] ;\n  ex:foundingYear xsd:integer }"
    },
    {
     "l": "반영 위치",
     "t": "Pre · Mid",
     "s": "SPARQL-LLM: SPARQL Generation Prompt · SAGA: search 결과의 domain · range"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 .\nex:NuriUniv    a ex:University ;  rdfs:label \"누리대학교\" ;\n               ex:locatedIn ex:Busan ;  ex:foundingYear 1971 .\nex:Seoul       a ex:City ;  rdfs:label \"서울\" .",
    "html": "<h4>① VoID 에서 ShEx 로</h4>\n<p>endpoint 의 VoID 는 「ex:University 인스턴스는 ex:locatedIn · ex:foundingYear 를 가진다」 같은 통계를 담고 있다. 여기서 class 별 shape 을 만든다. 값은 다른 shape 이 아니라 class 목록 <code>[ ex:City ]</code> 으로 적어, shape 하나만 떼어 넣어도 읽힌다.</p>\n<pre>ex:UniversityShape {\n  a               [ ex:University ] ;\n  ex:locatedIn    [ ex:City ] ;\n  ex:foundingYear xsd:integer\n}</pre>\n<h4>② 검색해 prompt 에 넣기</h4><p>질문과 가까운 shape(UniversityShape, CityShape)을 검색해 붙인다.</p>\n<h4>③ 결과 비교</h4>\n<div class=\"tw\"><table><tr><th></th><th>LLM 이 쓴 쿼리</th><th>결과</th></tr>\n<tr><td>T1 없음</td><td><code>?u a ex:University ; ex:establishedYear ?y ; ex:city \"서울\"</code></td><td>없는 property 두 개 → 빈 결과</td></tr>\n<tr><td>T1 없음</td><td><code>ex:Seoul ex:locatedIn ?u . ?u ex:foundingYear ?y</code></td><td>property 는 맞지만 방향이 반대 → 빈 결과</td></tr>\n<tr><td>T1 있음</td><td><code>?u a ex:University ; ex:locatedIn ex:Seoul ; ex:foundingYear ?y</code></td><td>한빛대학교 · 1952</td></tr></table></div>\n<p><b>SAGA 에서는</b> 탐색 중 <code>search(\"설립\")</code> 결과에 <code>[domain: ex:University | range: xsd:integer]</code> 를 붙여, 둘 다 「연도」 인 ex:foundingYear 와 ex:birthYear 를 domain 으로 가르게 한다.</p>"
   },
   "pc": {
    "usePro": "실제 class · property 와 연결(domain · range)을 보고 쓰므로 없는 property 나 방향이 틀린 트리플이 줄어든다",
    "useCon": "VoID · ShEx 를 미리 만들어야 한다. 스키마가 크면 prompt 가 길어지고, 스키마 기술이 부정확하면 오히려 오도한다",
    "skipPro": "사전 작업 없이 새 KG 에 바로 붙일 수 있고 prompt 가 짧다",
    "skipCon": "모델이 스키마를 기억으로 추측해야 한다."
   },
   "limit": "KG 전체를 요약한 스키마이므로, 특정 개체에 해당 간선이 존재한다는 보장은 없다 (→ T5).",
   "notes": {
    "build": "● VoID → ShEx, 임베딩 인덱스",
    "agent": "— 단발 생성 앞에서 prompt 에 넣는다",
    "admin": "○ VoID generator 로 자동 생성 가능, 검수는 필요",
    "schemaChg": "인스턴스 무관 / 스키마 재인덱싱"
   },
   "bySource": {
    "SPARQL-LLM": "인덱싱 컴포넌트가 VoID 기반 스키마를 임베딩해 vector DB 에 적재하고(배포 시 1회), 프롬프트 빌딩 컴포넌트가 질문과 관련된 class 의 ShEx 를 유사도 검색으로 골라 넣는다. VoID 가 없으면 오픈소스 VoID generator 로 자동 생성한다.",
    "SAGA": "search 결과의 property 에 domain · range annotation 을 붙인다. 값은 Schema Index 에서 오며 Wikidata 는 P2302, Freebase 는 fb_roles, 선언이 없으면 주어–목적어 표본에서 경험적으로 뽑는다."
   },
   "rel": [
    [
     "보완",
     "T3"
    ],
    [
     "자원 공유",
     "T6"
    ],
    [
     "자원 공유",
     "T9"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "kg",
      "c": 0,
      "r": 0,
      "k": "kg",
      "n": "KG endpoint",
      "ty": "[SPARQL endpoint]",
      "d": [
       "VoID description"
      ],
      "off": true
     },
     {
      "id": "bld",
      "c": 1,
      "r": 0,
      "k": "build",
      "n": "ShEx 생성 · 임베딩",
      "ty": "[배포 시 1회]",
      "d": [
       "class 별 shape"
      ],
      "off": true
     },
     {
      "id": "idx",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "Vector DB",
      "ty": "[사전 인덱스]",
      "d": [
       "ShEx shape"
      ],
      "off": true
     },
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "t3",
      "c": 1,
      "r": 1,
      "k": "other",
      "ref": "T3",
      "n": "Decomposition",
      "ty": "[T3]",
      "d": [
       "concepts:",
       "대학 · 도시"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Schema Retriever",
      "ty": "[T1 · 임베딩 유사도]",
      "d": [
       "concept 마다",
       "15 classes"
      ]
     },
     {
      "id": "llm",
      "c": 3,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[SPARQL 생성]",
      "d": [
       "shape 을 보고",
       "property 선택"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:locatedIn",
       "ex:Seoul"
      ]
     }
    ],
    "edges": [
     {
      "f": "kg",
      "t": "bld",
      "off": 1
     },
     {
      "f": "bld",
      "t": "idx",
      "off": 1
     },
     {
      "f": "q",
      "t": "t3",
      "n": 1
     },
     {
      "f": "t3",
      "t": "tech",
      "n": 2
     },
     {
      "f": "tech",
      "t": "idx",
      "n": 3,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 4
     },
     {
      "f": "llm",
      "t": "out",
      "n": 5
     }
    ],
    "steps": [
     "질문을 T3 가 high-level concepts(대학 · 도시)로 나눈다",
     "concept 마다 Schema Retriever 에 검색을 요청한다",
     "Vector DB 에서 concept 와 가장 가까운 class 15개의 ShEx shape 을 가져온다",
     "가져온 shape 을 SPARQL Generation Prompt 에 넣는다",
     "LLM 이 shape 에 있는 property 와 방향(대학 → 도시)대로 쿼리를 쓴다"
    ],
    "offNote": "VoID 에서 class 별 ShEx 를 만들어 임베딩해 둔다. class · property 가 바뀌면 다시 만든다."
   }
  },
  {
   "id": "T2",
   "name": "Question–Query Example Retrieval (few-shot)*",
   "short": "Question–Query Example Retrieval",
   "stage": "pre",
   "one": "질문–쿼리 쌍을 인덱싱하고, 입력 질문과 유사한 쌍을 검색해 few-shot 예제로 제공한다.",
   "def": {
    "text": "human-crafted question–query examples 를 embeddings-based similarity search 로 retrieve 해 few-shot example 로 제공한다. 비슷한 질문을 푼 검증된 쿼리를 보고 따라 쓰게 하는 기법이다.",
    "src": "작명 — SPARQL-LLM §3.1.1 · §3.2.2 의 \"question–query examples\" 를 조합한 이름",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7418"
   },
   "sources": {
    "SPARQL-LLM": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ○"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     0,
     1
    ],
    "src": [
     0
    ],
    "what": [
     1
    ],
    "how": [
     0
    ],
    "stage": [
     0
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     0
    ],
    "agent": [
     2
    ],
    "admin": [
     0
    ],
    "schemaChg": [
     2
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "검색 키",
     "t": "question · sub-questions",
     "v": "원래 질문",
     "tag": "T3 sub-questions 포함"
    },
    {
     "l": "처리 방식",
     "t": "embeddings-based similarity search",
     "s": "sub-question 마다 20 most similar examples"
    },
    {
     "l": "출처",
     "t": "vector database",
     "s": "indexed question–query examples",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "question–query examples",
     "v": "「부산에 있는 박물관의 개관 연도는?」",
     "m": "?m ex:locatedIn ex:Busan ;\n   ex:openingYear ?y"
    },
    {
     "l": "반영 위치",
     "t": "Pre",
     "s": "SPARQL Generation Prompt 에 few-shot 으로 삽입"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 .\nex:Seoul       a ex:City ;  rdfs:label \"서울\" .\nex:Busan       a ex:City ;  rdfs:label \"부산\" .",
    "html": "<h4>① 예제 저장소</h4><p>KG 운영자가 미리 써 둔 질문–쿼리 쌍이 인덱싱되어 있다.</p>\n<div class=\"tw\"><table><tr><th>#</th><th>질문</th><th>쿼리</th></tr>\n<tr><td>1</td><td>부산에 있는 박물관의 개관 연도는?</td><td><code>?m a ex:Museum ; ex:locatedIn ex:Busan ; ex:openingYear ?y</code></td></tr>\n<tr><td>2</td><td>가장 오래된 대학은?</td><td><code>?u a ex:University ; ex:foundingYear ?y } ORDER BY ?y LIMIT 1</code></td></tr>\n<tr><td>3</td><td>인구가 가장 많은 도시는?</td><td><code>?c a ex:City ; ex:population ?p } ORDER BY DESC(?p)</code></td></tr></table></div>\n<h4>② 검색</h4><p>질문 임베딩과 가까운 #1(「~에 있는 ~의 ~연도」 구조가 같음)과 #2(대학 · 설립 연도가 같음)가 뽑힌다.</p>\n<h4>③ 결과 비교</h4>\n<div class=\"tw\"><table><tr><th></th><th>LLM 이 쓴 쿼리</th><th>결과</th></tr>\n<tr><td>T2 없음</td><td><code>?u a ex:University ; ex:address ?a . FILTER(CONTAINS(?a,\"서울\"))</code></td><td>KG 에 없는 주소 문자열 비교 → 빈 결과</td></tr>\n<tr><td>T2 있음</td><td><code>?u a ex:University ; ex:locatedIn ex:Seoul ; ex:foundingYear ?y</code></td><td>한빛대학교 · 1952</td></tr></table></div>\n<p>#1 에서 「도시는 문자열이 아니라 IRI 로 잇는다」는 관례를, #2 에서 ex:foundingYear 를 가져온다. 「두 대학 중 어느 쪽이 먼저 세워졌나」 같은 비교 질문은 예제에 없어 따라 할 틀이 없다.</p>"
   },
   "pc": {
    "usePro": "비슷한 질문의 검증된 쿼리를 따라 쓰므로 KG 고유의 관례(prefix · 한정자 패턴 등)와 쿼리 구조가 맞아진다",
    "useCon": "질문–쿼리 쌍을 모으고 인덱싱해야 한다. 예제에 없는 유형에는 효과가 없고, 예제 구조를 과하게 따라갈 수 있다",
    "skipPro": "예제 셋 구축이 필요 없다",
    "skipCon": "KG 고유 관례를 모델이 모르므로 구조 오류가 늘어난다"
   },
   "limit": "기존 쿼리의 작성 패턴을 참조한다. 예제에 없는 유형의 질문에는 참조할 패턴이 없다.",
   "notes": {
    "build": "● 질문–쿼리 쌍 작성 · 인덱싱",
    "agent": "— 단발 생성 앞에서 prompt 에 넣는다",
    "admin": "● 예제 쿼리는 KG 관례를 아는 사람이 쓰고 검수해야 한다",
    "schemaChg": "인스턴스 대체로 무관 / 스키마 수작업 (예제 쿼리가 깨진다)"
   },
   "bySource": {
    "SPARQL-LLM": "endpoint 에서 SHACL · schema.org 어휘로 기술된 질문–쿼리 예제 쌍을 가져와 인덱싱한다(배포 시 1회). 질의 시점에 질문(과 T3 로 분해한 하위 질문)으로 관련 예제를 검색해 넣는다. 절제 실험에서 예제가 가장 중요한 요소였다."
   },
   "rel": [
    [
     "보완",
     "T3"
    ],
    [
     "충돌",
     "T7",
     "‡ 예제도 placeholder 형식이어야 한다"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "ex",
      "c": 0,
      "r": 0,
      "k": "build",
      "n": "질문–쿼리 예제",
      "ty": "[수작업 작성]",
      "d": [
       "KG 관례를 아는",
       "사람이 작성"
      ],
      "off": true
     },
     {
      "id": "bld",
      "c": 1,
      "r": 0,
      "k": "build",
      "n": "임베딩",
      "ty": "[배포 시 1회]",
      "d": [
       "질문 문장 기준"
      ],
      "off": true
     },
     {
      "id": "idx",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "Vector DB",
      "ty": "[사전 인덱스]",
      "d": [
       "질문–쿼리 쌍"
      ],
      "off": true
     },
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "t3",
      "c": 1,
      "r": 1,
      "k": "other",
      "ref": "T3",
      "n": "Decomposition",
      "ty": "[T3 · 선택]",
      "d": [
       "sub-questions"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Example Retriever",
      "ty": "[T2 · 임베딩 유사도]",
      "d": [
       "sub-question 마다",
       "20 examples"
      ]
     },
     {
      "id": "llm",
      "c": 3,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[SPARQL 생성]",
      "d": [
       "예제의 패턴을",
       "따라 작성"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:locatedIn",
       "ex:Seoul"
      ]
     }
    ],
    "edges": [
     {
      "f": "ex",
      "t": "bld",
      "off": 1
     },
     {
      "f": "bld",
      "t": "idx",
      "off": 1
     },
     {
      "f": "q",
      "t": "t3",
      "n": 1
     },
     {
      "f": "t3",
      "t": "tech",
      "n": 2
     },
     {
      "f": "tech",
      "t": "idx",
      "n": 3,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 4
     },
     {
      "f": "llm",
      "t": "out",
      "n": 5
     }
    ],
    "steps": [
     "질문을 T3 가 sub-question 으로 나눈다 (선택 사항)",
     "sub-question 마다 Example Retriever 에 검색을 요청한다",
     "Vector DB 에서 질문이 가장 비슷한 예제 20개를 가져온다 (예: 「부산에 있는 박물관의 개관 연도는?」)",
     "질문–쿼리 쌍을 few-shot 예제로 prompt 에 넣는다",
     "LLM 이 예제의 패턴(도시를 문자열이 아닌 IRI 로 잇기)을 따라 쿼리를 쓴다"
    ],
    "offNote": "KG 관례를 아는 사람이 질문–쿼리 쌍을 써 두고 임베딩한다. 스키마가 바뀌면 예제 쿼리를 손으로 고친다."
   }
  },
  {
   "id": "T3",
   "name": "Query Decomposition",
   "short": "Query Decomposition",
   "stage": "pre",
   "one": "질문을 하위 질문 · 개념으로 분해해 각각 스키마 · 예제를 검색하여, 복합 질문의 일부가 검색에서 누락되지 않게 한다.",
   "def": {
    "text": "question 을 standalone sub-questions 와 high-level concepts(class 후보)로 decompose 해 retrieval 에 쓴다.",
    "src": "원문 — SPARQL-LLM §3.2.2, GraphRAG 서베이 §6.4.1",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7438"
   },
   "sources": {
    "SPARQL-LLM": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ○"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     2
    ],
    "src": [
     3
    ],
    "what": [
     5
    ],
    "how": [
     5
    ],
    "stage": [
     0
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     0
    ],
    "agent": [
     2
    ],
    "admin": [
     2
    ],
    "schemaChg": [
     3
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "question",
     "v": "서울에 있는 대학의 설립 연도는?"
    },
    {
     "l": "처리",
     "t": "decomposition phase",
     "s": "질문당 LLM 호출 1회 추가"
    },
    {
     "l": "출력",
     "t": "standalone sub-questions · high-level concepts",
     "v": "서울에 있는 대학은?\n대학의 설립 연도는?\nconcepts: 대학 · 도시"
    },
    {
     "l": "전달 대상",
     "t": "vector database 검색 (T1 · T2)",
     "s": "sub-question · concept 별 검색",
     "c": "idx"
    },
    {
     "l": "반영 위치",
     "t": "Pre",
     "s": "검색된 examples · classes 를 prompt 에 삽입"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 .\nex:Seoul       a ex:City ;  rdfs:label \"서울\" .",
    "html": "<h4>① 분해</h4>\n<div class=\"tw\"><table><tr><th>종류</th><th>결과</th></tr>\n<tr><td>sub-question 1</td><td>서울에 있는 대학은?</td></tr><tr><td>sub-question 2</td><td>대학의 설립 연도는?</td></tr><tr><td>high-level concepts</td><td>대학, 도시</td></tr></table></div>\n<p>각 sub-question 은 앞 문장 없이도 뜻이 통하게(standalone) 쓴다. 「그 대학의 설립 연도는?」 이 아니라 「대학의 설립 연도는?」 이다.</p>\n<h4>② 조각마다 검색</h4>\n<div class=\"tw\"><table><tr><th>검색 질의</th><th>찾아온 것</th></tr>\n<tr><td>서울에 있는 대학은?</td><td>「부산에 있는 박물관은?」 예제 (T2) — ex:locatedIn 패턴</td></tr>\n<tr><td>대학의 설립 연도는?</td><td>「가장 오래된 대학은?」 예제 (T2) — ex:foundingYear</td></tr>\n<tr><td>대학 / 도시</td><td>UniversityShape / CityShape (T1)</td></tr></table></div>\n<h4>③ 분해하지 않으면</h4><p>원래 질문 하나로 검색하면 「서울」 이 도시라는 것과 CityShape 가 순위에서 밀릴 수 있다. 그러면 LLM 은 <code>ex:locatedIn ex:Seoul</code> 대신 <code>ex:city \"서울\"</code> 같은 추측을 쓴다. 질문이 단순할수록(「한빛대학교의 설립 연도는?」) 이득은 작고 호출만 1회 는다.</p>"
   },
   "pc": {
    "usePro": "복합 질문을 나눠 부분마다 검색하므로 필요한 스키마 · 예제가 빠지지 않는다 (SPARQL-LLM)",
    "useCon": "LLM 호출이 1회 늘고, 분해가 틀리면 검색도 엇나간다",
    "skipPro": "호출과 지연이 줄고 단순 질문에는 충분하다",
    "skipCon": "다중 홉 질문에서 일부 개념의 스키마 · 예제가 검색에서 빠진다"
   },
   "limit": "자체 조회 대상이 없다. T1 · T2 의 검색 키를 확장하여 복합 질문의 일부가 검색에서 누락되지 않게 한다.",
   "notes": {
    "build": "○ T1 · T2 인덱스를 쓴다",
    "agent": "— 질문마다 LLM 을 1회 더 호출할 뿐이다",
    "admin": "— 관리할 산출물이 없다",
    "schemaChg": "인스턴스 무관 / 스키마 무관 (T1 · T2 쪽에서 반영)"
   },
   "bySource": {
    "SPARQL-LLM": "프롬프트 빌딩 컴포넌트가 사용자 질문을 하위 질문과 클래스로 분해한 뒤, 각각으로 임베딩 유사도 검색을 해 관련 예제(T2)와 스키마(T1)를 추출한다. 질문이 이미 원자적이면 분해하지 않는다."
   },
   "rel": [
    [
     "선행",
     "T1",
     "T1 · T2 중 하나"
    ],
    [
     "선행",
     "T2",
     "T1 · T2 중 하나"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "tech",
      "c": 1,
      "r": 1,
      "k": "tech",
      "n": "Decomposer",
      "ty": "[T3 · LLM 호출 1회]",
      "d": [
       "sub-question 2개",
       "concept 2개"
      ]
     },
     {
      "id": "ret",
      "c": 2,
      "r": 1,
      "k": "other",
      "n": "Retriever",
      "ty": "[T1 · T2]",
      "d": [
       "조각마다 검색"
      ]
     },
     {
      "id": "idx",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "Vector DB",
      "ty": "[T1 · T2 인덱스]",
      "d": [
       "shape · 예제"
      ]
     },
     {
      "id": "llm",
      "c": 3,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[SPARQL 생성]",
      "d": [
       "모은 shape · 예제로",
       "작성"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:locatedIn",
       "ex:Seoul"
      ]
     }
    ],
    "edges": [
     {
      "f": "q",
      "t": "tech",
      "n": 1
     },
     {
      "f": "tech",
      "t": "ret",
      "n": 2
     },
     {
      "f": "ret",
      "t": "idx",
      "n": 3,
      "both": 1
     },
     {
      "f": "ret",
      "t": "llm",
      "n": 4
     },
     {
      "f": "llm",
      "t": "out",
      "n": 5
     }
    ],
    "steps": [
     "질문을 Decomposer(LLM 호출 1회)에 넘긴다",
     "standalone sub-question(「서울에 있는 대학은?」 · 「대학의 설립 연도는?」)과 concept(대학 · 도시)을 넘긴다",
     "조각마다 T1 · T2 인덱스를 따로 검색한다. 원래 질문 하나로 검색할 때 순위에서 밀리던 CityShape 도 잡힌다",
     "모은 shape · 예제를 prompt 에 넣는다",
     "LLM 이 쿼리를 쓴다"
    ],
    "offNote": null,
    "offNone": "T1 · T2 인덱스를 그대로 쓴다."
   }
  },
  {
   "id": "T4",
   "name": "Entity Linking",
   "short": "Entity Linking",
   "stage": "pre",
   "one": "질문 속 개체명을 레이블 검색으로 KG 의 IRI 후보에 연결해 생성 전에 LLM 에 제공한다.",
   "def": {
    "text": "question 에 나온 entity 를 KG 의 node(IRI)로 identify 한다. 서베이는 이를 retrieval 의 pre-processing step 으로 본다.",
    "src": "원문 — GraphRAG 서베이 §6.1, SAGA search",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7458"
   },
   "sources": {
    "SAGA": "○",
    "PGMR": "○"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     0
    ],
    "src": [
     0
    ],
    "what": [
     2
    ],
    "how": [
     1
    ],
    "stage": [
     0,
     1
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     1,
     2
    ],
    "agent": [
     2
    ],
    "admin": [
     1
    ],
    "schemaChg": [
     3
    ],
    "instChg": [
     1
    ]
   },
   "flow": [
    {
     "l": "검색 키",
     "t": "question 속 entity",
     "v": "「서울」"
    },
    {
     "l": "처리 방식",
     "t": "search (text query)",
     "s": "label · description 대상"
    },
    {
     "l": "출처",
     "t": "entity search API · URI memory",
     "s": "SAGA: KG 검색 API · PGMR RAG baseline: BGE + FAISS",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "top-k URI 후보 (PGMR k = 10)",
     "m": "ex:Q101  서울 — 대한민국의 수도\nex:Q102  서울역 — 철도역"
    },
    {
     "l": "반영 위치",
     "t": "Pre · Mid",
     "s": "PGMR RAG baseline: prompt · SAGA: search 의 observation"
    }
   ],
   "ex": {
    "data": "ex:Q101  a ex:Q5 ;   rdfs:label \"서울\" ;    rdfs:comment \"대한민국의 수도\" .\nex:Q102  a ex:Q9 ;   rdfs:label \"서울역\" ;  rdfs:comment \"서울의 철도역\" .\nex:Q207  a ex:Q3 ;   rdfs:label \"한빛대학교\" ;\n         ex:P2 ex:Q101 ;  ex:P7 1952 .\nex:P2    rdfs:label \"소재지\" .    ex:P7  rdfs:label \"설립 연도\" .",
    "html": "<p class=\"src\">이 예시는 Wikidata 의 Q-id 처럼 식별자가 이름을 드러내지 않는 KG 를 가정한다.</p>\n<h4>① 이름 뽑기 → ② 레이블 검색</h4>\n<div class=\"tw\"><table><tr><th>순위</th><th>IRI</th><th>label</th><th>description</th></tr>\n<tr><td>1</td><td><code>ex:Q101</code></td><td>서울</td><td>대한민국의 수도</td></tr>\n<tr><td>2</td><td><code>ex:Q102</code></td><td>서울역</td><td>서울의 철도역</td></tr></table></div>\n<h4>③ prompt 에 넣고 생성</h4>\n<div class=\"tw\"><table><tr><th></th><th>LLM 이 쓴 쿼리 조각</th><th>결과</th></tr>\n<tr><td>T4 없음</td><td><code>?u ex:P2 ex:Q8684</code></td><td>기억(다른 KG 에서 본 번호)으로 지어낸 IRI → 빈 결과</td></tr>\n<tr><td>T4 있음</td><td><code>?u ex:P2 ex:Q101</code></td><td>한빛대학교 · 1952</td></tr>\n<tr><td>T4 있음, 오선택</td><td><code>?u ex:P2 ex:Q102</code></td><td>후보를 받았지만 서울역을 골랐다 → 빈 결과</td></tr></table></div>\n<p>마지막 줄이 약점이다. 후보를 보여 줄 뿐 고르는 것은 LLM 이라 동명 · 유사 개체를 잘못 고르거나 후보를 무시하고 지어낼 수 있다. PGMR 이 RAG baseline 에서 URI 환각이 8.71% 남는다고 보고한 이유다.</p>"
   },
   "pc": {
    "usePro": "이름을 실제 IRI 후보로 바꿔 주므로 없는 IRI 를 지어내는 일이 줄어든다 (PGMR: URI 환각 평균 75.42% → 8.71%)",
    "useCon": "레이블 검색 인덱스가 필요하다. 동명 개체를 잘못 고르면 그대로 오답이 되고, 환각이 남는다 (PGMR: 8.71%)",
    "skipPro": "인덱스가 필요 없다",
    "skipCon": "Q-id 처럼 의미 없는 식별자는 모델이 기억으로 회상해야 한다 (PGMR: direct 생성 평균 75.42% 환각)"
   },
   "limit": "KG 탐색의 시작점(IRI) 후보만 제공한다. 후보 선택은 LLM 이 수행하므로 서울역이 선택될 수 있다 (→ T8 은 같은 문제를 생성 후에 처리한다).",
   "notes": {
    "build": "● 레이블 인덱스 (전문 검색 또는 임베딩), KG 검색 API 로 대신 가능",
    "agent": "— SAGA 에서는 search 도구로 부르지만 기법 자체는 에이전트를 요구하지 않는다",
    "admin": "○ 레이블 · 별칭 · 설명이 부실하면 후보를 찾지 못한다",
    "schemaChg": "인스턴스 재인덱싱 (증분) / 스키마 무관"
   },
   "bySource": {
    "SAGA": "search(text) 가 text query 로 entity · property 를 retrieve 한다. 탐색의 출발점을 정하는 행동이며 SAGA 의 기여 지점은 아니다.",
    "PGMR": "비교군인 RAG baseline. question 과 label 이 가장 가까운 URI k 개(k = 10)를 retrieve 해 prompt 에 넣은 뒤 생성한다 (§5.3 · A.1). 검색 결과를 따르도록 강제하지 않아 환각이 남는다."
   },
   "rel": [
    [
     "보완",
     "T5"
    ],
    [
     "대체",
     "T8"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "kg",
      "c": 0,
      "r": 0,
      "k": "kg",
      "n": "KG",
      "ty": "[원천 데이터]",
      "d": [
       "label · description"
      ],
      "off": true
     },
     {
      "id": "bld",
      "c": 1,
      "r": 0,
      "k": "build",
      "n": "임베딩 · 색인",
      "ty": "[배포 시 1회]",
      "d": [
       "개체 추가 시 증분"
      ],
      "off": true
     },
     {
      "id": "idx",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "레이블 인덱스",
      "ty": "[사전 인덱스]",
      "d": [
       "label → IRI"
      ],
      "off": true
     },
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Entity Linker",
      "ty": "[T4 · 레이블 검색]",
      "d": [
       "「서울」 →",
       "top-k IRI 후보"
      ]
     },
     {
      "id": "llm",
      "c": 3,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[SPARQL 생성]",
      "d": [
       "후보 중 하나를",
       "LLM 이 고른다"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:P2 ex:Q101"
      ]
     }
    ],
    "edges": [
     {
      "f": "kg",
      "t": "bld",
      "off": 1
     },
     {
      "f": "bld",
      "t": "idx",
      "off": 1
     },
     {
      "f": "q",
      "t": "tech",
      "n": 1
     },
     {
      "f": "tech",
      "t": "idx",
      "n": 2,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 3
     },
     {
      "f": "llm",
      "t": "out",
      "n": 4
     }
    ],
    "steps": [
     "질문에서 개체명 「서울」 을 뽑아 Entity Linker 에 넘긴다",
     "레이블 인덱스(또는 KG 검색 API)에서 label · description 으로 IRI 후보를 찾는다 (PGMR k = 10)",
     "후보 목록(ex:Q101 서울 · ex:Q102 서울역 …)을 prompt 에 넣는다",
     "LLM 이 후보 가운데 하나를 골라 쿼리를 쓴다. 서울역을 고르면 그대로 오답이 된다"
    ],
    "offNote": "KG 의 label · description 을 색인한다. 개체가 추가되면 증분으로 갱신한다."
   }
  },
  {
   "id": "T5",
   "name": "Graph-Guided Retrieval",
   "short": "Graph-Guided Retrieval",
   "stage": "pre",
   "one": "시작 개체 주변의 트리플 · 경로 · 서브그래프를 질의 시점에 KG 에서 조회해 실제 데이터를 LLM 에 제공한다.",
   "def": {
    "text": "question-relevant nodes · triplets · paths · subgraphs 를 retrieve 해 LLM 에 제공한다. 질문 주변의 실제 연결을 보여 주는 기법이다.",
    "src": "원문 — GraphRAG 서베이 §6 (retrieval granularity §6.3)",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7478"
   },
   "sources": {
    "SAGA": "○"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ○ · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     3
    ],
    "src": [
     1
    ],
    "what": [
     3
    ],
    "how": [
     2
    ],
    "stage": [
     0,
     1
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     1
    ],
    "agent": [
     0,
     2
    ],
    "admin": [
     2
    ],
    "schemaChg": [
     0
    ],
    "instChg": [
     0
    ]
   },
   "flow": [
    {
     "l": "검색 키",
     "t": "entity e",
     "v": "ex:Seoul",
     "tag": "T4 결과"
    },
    {
     "l": "처리 방식",
     "t": "lookup(e)",
     "s": "1–2 hop · triplets · paths · subgraphs"
    },
    {
     "l": "출처",
     "t": "KG endpoint",
     "s": "질의 시점 직접 조회",
     "c": "kg"
    },
    {
     "l": "조회 결과",
     "t": "raw outgoing neighborhood N(e)",
     "m": "(한빛대학교, ex:locatedIn, 서울)\n(한빛대학교, ex:foundingYear, 1952)\n(서울, ex:population, 9400000)"
    },
    {
     "l": "반영 위치",
     "t": "Pre · Mid",
     "s": "1회 주입형: prompt · SAGA: lookup 의 observation"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 ;\n               ex:president ex:Kim .\nex:Seoul       a ex:City ;  rdfs:label \"서울\" ;  ex:population 9400000 .",
    "html": "<h4>① 단발 생성에 붙이는 경우 (Semantic Parsing ○)</h4><p>T4 로 찾은 ex:Seoul 을 중심으로 1–2 hop 트리플을 가져와 prompt 에 넣는다. LLM 은 「대학 → 도시」 방향의 ex:locatedIn 이 실제로 있다는 것을 스키마가 아니라 실제 데이터로 본다. ex:population 처럼 무관한 트리플도 섞인다.</p>\n<h4>② 탐색에서 반복하는 경우 (Graph Exploration ●, SAGA)</h4>\n<pre>lookup(ex:HanbitUniv) →\n  N(e) = { (rdfs:label, \"한빛대학교\"), (ex:locatedIn, ex:Seoul),\n           (ex:foundingYear, 1952), (ex:president, ex:Kim) }</pre>\n<p>에이전트는 ex:locatedIn 이 ex:Seoul 로 이어지는 것을 확인하고 ex:foundingYear 를 답 자리로 고른다. 이웃이 수백 개인 개체(예: Wikidata 의 국가)에서는 목록이 길어져 토큰이 커진다.</p>\n<h4>쓰지 않으면</h4><p>개체 사이 연결을 보지 못한 채 <code>ex:Seoul ex:hasUniversity ?u</code> 같은 없는 경로를 추측할 수 있다.</p>"
   },
   "pc": {
    "usePro": "질문 주변의 실제 트리플 · 경로를 보여 주므로 KG 에 있는 연결만 쓰게 된다",
    "useCon": "이웃이 큰 개체에서는 후보가 늘어 토큰이 커지고 무관한 이웃이 섞인다. 반복 조회하면 호출이 늘어난다",
    "skipPro": "질의 시점에 KG 를 조회하지 않아 비용 · 지연이 낮다",
    "skipCon": "개체 사이의 실제 연결을 모른 채 경로를 추측한다"
   },
   "limit": "해당 개체 주변의 현재 데이터를 조회한다. 무관한 트리플이 포함되며, 허브 개체는 이웃이 수천 개여서 필터링이 필요하다 (→ T6).",
   "notes": {
    "build": "— 질의 시점에 KG 에서 이웃을 직접 조회한다",
    "agent": "반복형 ● (SAGA) · 1회 주입형 —",
    "admin": "— 관리할 산출물이 없다",
    "schemaChg": "인스턴스 쉬움 / 스키마 쉬움"
   },
   "bySource": {
    "SAGA": "lookup(e) 가 entity e 의 raw outgoing neighborhood N(e) = {(p, v)} 를 돌려준다. SAGA 는 이 결과에 T6 을 적용한다."
   },
   "rel": [
    [
     "선행",
     "T4"
    ],
    [
     "보완",
     "T6"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "t4",
      "c": 1,
      "r": 1,
      "k": "other",
      "ref": "T4",
      "n": "Entity Linking",
      "ty": "[T4]",
      "d": [
       "시작 개체",
       "ex:Seoul"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Graph Retriever",
      "ty": "[T5 · lookup(e)]",
      "d": [
       "1–2 hop 이웃 조회"
      ]
     },
     {
      "id": "kg",
      "c": 2,
      "r": 2,
      "k": "kg",
      "n": "KG endpoint",
      "ty": "[질의 시점 조회]",
      "d": [
       "현재 데이터"
      ]
     },
     {
      "id": "llm",
      "c": 3,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[생성 · controller]",
      "d": [
       "실제 트리플을",
       "보고 작성"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:locatedIn",
       "ex:Seoul"
      ]
     }
    ],
    "edges": [
     {
      "f": "q",
      "t": "t4",
      "n": 1
     },
     {
      "f": "t4",
      "t": "tech",
      "n": 2
     },
     {
      "f": "tech",
      "t": "kg",
      "n": 3,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 4
     },
     {
      "f": "llm",
      "t": "tech",
      "n": 5,
      "route": "above"
     },
     {
      "f": "llm",
      "t": "out",
      "n": 6
     }
    ],
    "steps": [
     "질문 속 개체를 T4 로 IRI 에 연결한다",
     "시작 개체 ex:Seoul 을 Graph Retriever 에 넘긴다",
     "KG endpoint 에서 그 개체의 1–2 hop 트리플 · 경로를 바로 조회한다",
     "조회한 트리플을 prompt(1회 주입형) 또는 observation(SAGA)으로 LLM 에 준다",
     "SAGA 처럼 탐색형이면 LLM 이 다음 개체를 골라 3–4 를 되풀이한다",
     "LLM 이 실제로 있는 연결(대학 → 도시의 ex:locatedIn)로 쿼리를 쓴다"
    ],
    "offNote": null,
    "offNone": "질의 시점에 KG 를 직접 조회하므로 데이터 변경이 바로 반영된다."
   }
  },
  {
   "id": "T6",
   "name": "Type-constrained Filtering",
   "short": "Type-constrained Filtering",
   "stage": "mid",
   "one": "lookup 결과에서 domain 이 개체 타입과 맞지 않는 property 를 LLM 에 제시하기 전에 제거해, 타입이 틀린 탐색 분기를 차단한다.",
   "def": {
    "text": "lookup(e) 의 raw outgoing neighborhood N(e) 에서, declared domain 이 entity type τ(e) 와 conflict 하는 property 를 controller 에 보이기 전에 제거한다. domain 이 unknown 인 property 는 retain 한다.",
    "formula": "P_τ(e) = { p ∈ P(e) | δ(p) = ∅  ∨  δ(p) ∩ τ(e) ≠ ∅ }",
    "src": "원문 — SAGA Method 식 (3), Table 5 ablation",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7498"
   },
   "sources": {
    "SAGA": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing — · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "○",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     0
    ],
    "src": [
     0
    ],
    "what": [
     0
    ],
    "how": [
     3
    ],
    "stage": [
     1
    ],
    "mode": [
     1
    ],
    "paper": [
     1
    ],
    "agent": [
     0
    ],
    "admin": [
     1
    ],
    "schemaChg": [
     1
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "P(e) — N(e) 의 property",
     "v": "τ(ex:HanbitUniv) = { University }",
     "tag": "lookup(e) 결과"
    },
    {
     "l": "처리 방식",
     "t": "type-constrained grounding",
     "s": "식 (3) · δ(p) = ∅ 는 retain"
    },
    {
     "l": "대조 기준",
     "t": "schema index",
     "s": "property 별 domain δ(p) · range ρ(p)",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "P_τ(e)",
     "m": "ex:locatedIn     retain\nex:foundingYear  retain\nex:birthYear     filtered"
    },
    {
     "l": "반영 위치",
     "t": "Mid",
     "s": "lookup 의 observation — schema-compact neighborhood"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 ;\n               ex:birthYear 1952 ;          # 잘못 입력된 edge\n               ex:nickname \"한빛대\" .",
    "html": "<h4>Schema Index (property 별 domain)</h4>\n<div class=\"tw\"><table><tr><th>property</th><th>domain δ(p)</th><th>δ(p) ∩ τ(e)</th><th>판정</th></tr>\n<tr><td><code>ex:locatedIn</code></td><td>선언 없음 (∅)</td><td>δ 가 ∅</td><td>남김 (unknown 은 retain)</td></tr>\n<tr><td><code>ex:foundingYear</code></td><td>{ University, Company }</td><td>{ University }</td><td>남김</td></tr>\n<tr><td><code>ex:birthYear</code></td><td>{ Person }</td><td>∅</td><td>제거</td></tr>\n<tr><td><code>ex:nickname</code></td><td>선언 없음 (∅)</td><td>δ 가 ∅</td><td>남김</td></tr></table></div>\n<h4>필터가 없으면</h4><p>「연도」 를 찾는 에이전트 앞에 ex:foundingYear 와 ex:birthYear 가 나란히 놓인다. ex:birthYear 로 조립하면 이 edge 가 없는 다른 대학에서 빈 결과가 되고 수정 턴이 는다. SAGA 는 SPINACH 오답의 36.9% 가 이런 타입 무시 접지였다고 보고한다.</p>\n<h4>필터가 틀리는 경우</h4><p>ex:foundingYear 의 domain 이 { Company } 로만 좁게 선언되어 있었다면 정답 property 가 지워진다. gold property 재현율 62.1% 가 이 경우를 센 수치다.</p>\n<h4>Persistent Type State Θ</h4><p>앞 턴에서 <code>?u a ex:University</code> 를 쓴 순간 Θ 에 「?u : University」 가 기록되고, 이후 ?u 에 붙이려는 property 도 같은 기준으로 걸러진다.</p>\n<div class=\"tw\"><table><tr><th>SAGA 수치 (gpt-oss-120B, Wikidata)</th><th>값</th></tr>\n<tr><td>필터 제거 절제</td><td>F1 −4.97점</td></tr><tr><td>타입 상태 Θ 제거 절제</td><td>F1 −5.43점 (세 요소 중 가장 큼)</td></tr>\n<tr><td>lookup 당 후보 edge 축소</td><td>25.8% (Table 9)</td></tr><tr><td>gold property 재현율</td><td>62.1%</td></tr>\n<tr><td>빈 결과율 (SAGA 전체, SPINACH 대비)</td><td>WWQ-test 75.5% → 27.0%</td></tr></table></div>"
   },
   "pc": {
    "usePro": "타입이 맞지 않는 술어를 미리 지워 빈 결과가 줄어든다 (SAGA: 후보 25.8% 축소, 필터 제거 시 F1 −4.97)",
    "useCon": "정답 술어도 걸러질 수 있다 (SAGA: gold 재현율 62.1%). domain · range 인덱스가 필요하다",
    "skipPro": "정답 술어를 잘못 지우는 일이 없다",
    "skipCon": "타입을 무시한 분기로 빈 결과가 나고 수정 턴이 는다 (SAGA: SPINACH 오답의 36.9%)"
   },
   "limit": "T5 의 조회 결과를 LLM 에 제시하기 전에 축소한다. domain 선언이 좁으면 정답 property 도 제거된다 (SAGA: gold 재현율 62.1%).",
   "notes": {
    "build": "● Schema Index (property 별 domain)",
    "agent": "● lookup 단계가 있는 탐색 루프에서만 걸 수 있다",
    "admin": "○ domain 선언의 정확도가 재현율을 좌우한다 (gold 의 37.9% 가 걸림)",
    "schemaChg": "인스턴스 무관 / 스키마 재인덱싱"
   },
   "bySource": {
    "SAGA": "τ(e) = ∅ 이면 필터를 건너뛰고 기저 파서(SPINACH)의 LLM 가지치기로 돌아간다. 살아남은 property 는 label (PID): description / domain / range 형식으로 렌더링되어 별도의 LLM 가지치기 호출을 대체한다. 결손을 비호환의 증거로 취급하지 않는 것이 설계 원칙이다."
   },
   "rel": [
    [
     "선행",
     "T5"
    ],
    [
     "자원 공유",
     "T1"
    ],
    [
     "보완",
     "T9"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "ctl",
      "c": 1,
      "r": 1,
      "k": "llm",
      "n": "LLM controller",
      "ty": "[SAGA 에이전트]",
      "d": [
       "다음 행동 선택"
      ]
     },
     {
      "id": "out",
      "c": 1,
      "r": 0,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "stop() 시 확정"
      ]
     },
     {
      "id": "look",
      "c": 1,
      "r": 2,
      "k": "other",
      "ref": "T5",
      "n": "lookup(e)",
      "ty": "[T5]",
      "d": [
       "raw N(e)"
      ]
     },
     {
      "id": "kg",
      "c": 0,
      "r": 2,
      "k": "kg",
      "n": "KG endpoint",
      "ty": "[질의 시점 조회]",
      "d": [
       "이웃 트리플"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Type Filter",
      "ty": "[T6 · 스키마 대조]",
      "d": [
       "domain 이 충돌하는",
       "property 제거"
      ]
     },
     {
      "id": "idx",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "Schema Index",
      "ty": "[사전 인덱스]",
      "d": [
       "property 별",
       "domain · range"
      ],
      "off": true
     },
     {
      "id": "bld",
      "c": 3,
      "r": 0,
      "k": "build",
      "n": "타입 정보 추출",
      "ty": "[배포 시 1회]",
      "d": [
       "P2302 · fb_roles"
      ],
      "off": true
     },
     {
      "id": "src",
      "c": 4,
      "r": 0,
      "k": "kg",
      "n": "KG",
      "ty": "[원천 데이터]",
      "d": [
       "타입 선언 · 표본 쌍"
      ],
      "off": true
     }
    ],
    "edges": [
     {
      "f": "src",
      "t": "bld",
      "off": 1
     },
     {
      "f": "bld",
      "t": "idx",
      "off": 1
     },
     {
      "f": "q",
      "t": "ctl",
      "n": 1
     },
     {
      "f": "ctl",
      "t": "look",
      "n": 2
     },
     {
      "f": "look",
      "t": "kg",
      "n": 3,
      "both": 1
     },
     {
      "f": "look",
      "t": "tech",
      "n": 4
     },
     {
      "f": "tech",
      "t": "idx",
      "n": 5,
      "both": 1
     },
     {
      "f": "tech",
      "t": "ctl",
      "n": 6
     },
     {
      "f": "ctl",
      "t": "out",
      "n": 7
     }
    ],
    "steps": [
     "질문을 controller 에 넘긴다",
     "controller 가 lookup(ex:HanbitUniv) 를 부른다",
     "KG endpoint 에서 이웃 N(e) 를 가져온다 (ex:locatedIn · ex:foundingYear · ex:birthYear …)",
     "N(e) 의 property 를 LLM 에 보이기 전에 Type Filter 에 넘긴다",
     "Schema Index 에서 property 별 domain 을 찾아 개체 타입 τ(e) = {University} 와 대조한다. ex:birthYear(domain Person)는 지우고, domain 이 없는 property 는 남긴다",
     "남은 property 를 domain · range 와 함께 observation 으로 돌려준다",
     "2–6 을 되풀이하다 답이 나오면 stop() 으로 쿼리를 확정한다"
    ],
    "offNote": "property 별 domain · range 를 Schema Index 에 적는다 (Wikidata P2302 · Freebase fb_roles · 선언이 없으면 표본 쌍)."
   }
  },
  {
   "id": "T7",
   "name": "Structural Synthesis (placeholder query)",
   "short": "Structural Synthesis",
   "stage": "mid",
   "one": "LLM 은 IRI 위치를 레이블 · 설명(placeholder)으로 둔 쿼리 골격만 생성한다. IRI 를 임의로 생성할 위치가 없다.",
   "def": {
    "text": "URI 자리를 natural language placeholder([ENT] / [REL] label + description)로 둔 intermediate query(SPARQL-PGMR query)를 먼저 생성한다. LLM 은 쿼리 구조만 만들고, IRI 확정은 T8 이 맡는다.",
    "src": "원문 — PGMR §4",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7518"
   },
   "sources": {
    "PGMR": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ○"
    ],
    [
     "검색 증강",
     "—",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     1
    ],
    "src": [
     3
    ],
    "what": [
     5
    ],
    "how": [
     5
    ],
    "stage": [
     1
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     2
    ],
    "agent": [
     2
    ],
    "admin": [
     1
    ],
    "schemaChg": [
     3
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "question",
     "v": "placeholder 형식으로 학습된 LLM"
    },
    {
     "l": "처리",
     "t": "LLM 생성",
     "s": "query block 은 구조만 · URI 는 placeholder"
    },
    {
     "l": "출력",
     "t": "intermediate query (SPARQL-PGMR query)",
     "m": "?u relation1 entity1 .\nentity1   = [ENT] 서울 [/ENT]\nrelation1 = [REL] 소재지 [/REL]"
    },
    {
     "l": "전달 대상",
     "t": "T8",
     "s": "placeholder → URI 치환"
    },
    {
     "l": "반영 위치",
     "t": "Mid",
     "s": "LLM 출력 형식 자체를 변경"
    }
   ],
   "ex": {
    "html": "<p class=\"src\">식별자가 이름을 드러내지 않는 KG(서울 = ex:Q101, 소재지 = ex:P2 …)를 가정한다. 형식은 PGMR §4 를 설명용으로 단순화했다.</p>\n<h4>① LLM 이 쓰는 intermediate query — IRI 를 하나도 쓰지 않는다</h4>\n<pre>SELECT ?u ?y WHERE {\n  ?u  relation0  entity0 .\n  ?u  relation1  entity1 .\n  ?u  relation2  ?y .\n}\nentity0   = [ENT] 대학 [/ENT] 고등 교육 기관\nentity1   = [ENT] 서울 [/ENT] 대한민국의 수도\nrelation0 = [REL] 유형 [/REL] 개체가 속한 클래스\nrelation1 = [REL] 소재지 [/REL] 개체가 위치한 곳\nrelation2 = [REL] 설립 연도 [/REL] 기관이 세워진 해</pre>\n<h4>② 이후</h4><p>T8 이 mapping block 의 각 줄을 메모리에서 찾아 <code>entity1 → ex:Q101</code>, <code>relation1 → ex:P2</code> 처럼 바꾼다.</p>\n<h4>쓰지 않으면</h4><p>LLM 이 구조와 IRI 를 한 번에 써야 한다. <code>?u ex:P2 ex:Q8684</code> 처럼 구조는 맞고 IRI 만 지어낸 쿼리가 나온다.</p>\n<h4>막지 못하는 것</h4><p>구조가 틀리면 그대로 남는다. LLM 이 <code>entity1 relation1 ?u</code>(서울 → 대학, 방향 반대)로 쓰면 T8 이 IRI 를 정확히 채워도 빈 결과다. PGMR 이 한계로 적은 「질의 구조 환각」 이다.</p>"
   },
   "pc": {
    "usePro": "LLM 은 구조만 만들고 IRI 는 따로 확정하므로 IRI 를 지어낼 자리가 없고, 구조 오류와 식별자 오류를 나눠 다룰 수 있다 (PGMR)",
    "useCon": "단독으로는 실행할 수 없어 T8 이 함께 있어야 한다. 구조 자체의 환각은 남는다",
    "skipPro": "파이프라인이 한 단계라 단순하다",
    "skipCon": "구조와 IRI 를 한꺼번에 생성하므로 IRI 환각이 섞인다"
   },
   "limit": "검색을 수행하지 않는다. LLM 출력에서 IRI 위치를 placeholder 로 대체하고, 치환은 T8 이 수행한다. 쿼리 구조의 오류는 방지하지 못한다.",
   "notes": {
    "build": "● placeholder 형식 학습 데이터 (미세조정 또는 few-shot)",
    "agent": "— 단발 생성의 출력 형식을 바꾼다",
    "admin": "○ 기존 질문–쿼리 쌍의 IRI 를 label · description 으로 바꿔 만들 수 있다 ‡",
    "schemaChg": "인스턴스 무관 / 스키마 영향 작음 ‡ (새 관계 패턴은 재학습이 필요할 수 있다)"
   },
   "bySource": {
    "PGMR": "intermediate query 는 query block 과 mapping block 으로 구성된다. 평가 모델은 T5-Small(FT), Llama 3.1 8B Instruct(PEFT), GPT-4o(25-shot). 구조 합성과 식별자 접지를 시점상 분리한 것이 핵심이다."
   },
   "rel": [
    [
     "선행",
     "T8"
    ],
    [
     "충돌",
     "T2",
     "‡ 예제 쿼리 형식"
    ],
    [
     "충돌",
     "T1",
     "‡ IRI 를 보여 주는 쪽"
    ],
    [
     "충돌",
     "T4",
     "‡ IRI 를 보여 주는 쪽"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "data",
      "c": 0,
      "r": 0,
      "k": "build",
      "n": "학습 데이터",
      "ty": "[placeholder 형식]",
      "d": [
       "IRI → label · 설명"
      ],
      "off": true
     },
     {
      "id": "train",
      "c": 1,
      "r": 0,
      "k": "build",
      "n": "미세조정 · few-shot",
      "ty": "[배포 전 1회]",
      "d": [
       "FT · PEFT · 25-shot"
      ],
      "off": true
     },
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "tech",
      "c": 1,
      "r": 1,
      "k": "tech",
      "n": "LLM (PGMR 형식)",
      "ty": "[T7 · 출력 형식 변경]",
      "d": [
       "IRI 대신",
       "[ENT] · [REL]"
      ]
     },
     {
      "id": "mid",
      "c": 2,
      "r": 1,
      "k": "io",
      "n": "중간 쿼리",
      "ty": "[SPARQL-PGMR]",
      "d": [
       "query: 구조만",
       "mapping: [ENT] 서울"
      ]
     },
     {
      "id": "t8",
      "c": 3,
      "r": 1,
      "k": "other",
      "ref": "T8",
      "n": "Grounding",
      "ty": "[T8]",
      "d": [
       "placeholder → IRI"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[실행 가능]",
      "d": [
       "?u ex:P2 ex:Q101"
      ]
     }
    ],
    "edges": [
     {
      "f": "data",
      "t": "train",
      "off": 1
     },
     {
      "f": "train",
      "t": "tech",
      "off": 1
     },
     {
      "f": "q",
      "t": "tech",
      "n": 1
     },
     {
      "f": "tech",
      "t": "mid",
      "n": 2
     },
     {
      "f": "mid",
      "t": "t8",
      "n": 3
     },
     {
      "f": "t8",
      "t": "out",
      "n": 4
     }
    ],
    "steps": [
     "질문을 placeholder 형식으로 학습된 LLM 에 넘긴다",
     "LLM 은 IRI 자리를 [ENT] · [REL] placeholder 로 둔 중간 쿼리를 쓴다. IRI 를 지어낼 자리가 없다",
     "mapping block 을 T8 에 넘겨 placeholder 를 IRI 로 바꾼다",
     "IRI 가 채워진 실행 가능한 SPARQL 이 나온다. 구조(방향)가 틀렸다면 그대로 남는다"
    ],
    "offNote": "기존 질문–쿼리 쌍의 IRI 를 label · description 으로 바꾼 데이터로 미세조정하거나 few-shot 예제로 쓴다."
   }
  },
  {
   "id": "T8",
   "name": "Identifier Grounding (Post-Generation Memory Retrieval)",
   "short": "Identifier Grounding",
   "stage": "post",
   "one": "생성 후 placeholder 를 KG IRI 메모리에서 검색한 IRI 로 치환해, 존재하는 IRI 만 쿼리에 포함한다.",
   "def": {
    "text": "post-generation retrieval step 에서 retriever 가 non-parametric memory(entity memory · ontology memory)에서 placeholder 와 가장 similar 한 URI 를 찾아 치환한다. top-ranked URI 의 similarity score 가 retrieval confidence threshold 미만이면 refusal 한다.",
    "src": "원문 — PGMR §4 · §7",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7538"
   },
   "sources": {
    "PGMR": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ○"
    ],
    [
     "검색 증강",
     "●",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     0
    ],
    "src": [
     0,
     2
    ],
    "what": [
     2
    ],
    "how": [
     0
    ],
    "stage": [
     2
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     2
    ],
    "agent": [
     2
    ],
    "admin": [
     1
    ],
    "schemaChg": [
     1
    ],
    "instChg": [
     1
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "mapping block 의 placeholder",
     "v": "[ENT] 서울 — 대한민국의 수도",
     "tag": "T7 출력"
    },
    {
     "l": "처리 방식",
     "t": "similarity search",
     "s": "top-ranked URI · retrieval confidence threshold 0.85"
    },
    {
     "l": "출처",
     "t": "entity · ontology memory",
     "s": "BGE 임베딩 + FAISS",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "top-ranked URI",
     "m": "entity1   → ex:Q101  0.97\nrelation1 → ex:P2    0.93"
    },
    {
     "l": "반영 위치",
     "t": "Post",
     "s": "출력 쿼리의 placeholder 를 URI 로 치환 · 미달 시 refusal"
    }
   ],
   "ex": {
    "html": "<p class=\"src\">T7 이 만든 mapping block 을 이어받는다. score 는 설명용 값이고 threshold 는 PGMR 이 권한 0.85 다.</p>\n<h4>① 메모리 — 배포 전에 모든 IRI 를 「label + description」 임베딩을 key 로 저장</h4>\n<div class=\"tw\"><table><tr><th>메모리</th><th>key</th><th>value</th></tr>\n<tr><td>entity</td><td>서울 — 대한민국의 수도</td><td><code>ex:Q101</code></td></tr>\n<tr><td>entity</td><td>서울역 — 서울의 철도역</td><td><code>ex:Q102</code></td></tr>\n<tr><td>ontology</td><td>소재지 — 개체가 위치한 행정 구역</td><td><code>ex:P2</code></td></tr>\n<tr><td>ontology</td><td>설립 연도 — 조직이 창립된 해</td><td><code>ex:P7</code></td></tr>\n<tr><td>ontology</td><td>창립자 — 조직을 세운 사람</td><td><code>ex:P9</code></td></tr></table></div>\n<h4>② placeholder 마다 검색</h4>\n<div class=\"tw\"><table><tr><th>placeholder</th><th>top-1</th><th>score</th><th>처리</th></tr>\n<tr><td>entity1 = [ENT] 서울</td><td><code>ex:Q101</code></td><td>0.97</td><td>치환 (서울역은 2위)</td></tr>\n<tr><td>relation1 = [REL] 소재지</td><td><code>ex:P2</code></td><td>0.93</td><td>치환</td></tr>\n<tr><td>relation2 = [REL] 설립 연도</td><td><code>ex:P7</code></td><td>0.95</td><td>치환</td></tr></table></div>\n<p>완성된 쿼리의 IRI 는 모두 메모리에서 왔으므로 KG 에 존재한다. URI 환각 0.0% 의 이유다.</p>\n<h4>③ refusal</h4><p>「서울에 있는 대학의 총장 이름은?」 이고 KG 에 「총장」 property 가 없으면, top-1 이 ex:P9 (창립자) 0.62 라 0.85 미만으로 답하지 않는다. threshold 가 없으면 「창립자」 가 조용히 들어가 틀린 답이 나온다.</p>\n<div class=\"tw\"><table><tr><th>방식</th><th>URI 환각 (데이터셋 · 모델 평균)</th></tr>\n<tr><td>direct 생성</td><td>75.42%</td></tr><tr><td>RAG baseline (T4)</td><td>8.71%</td></tr><tr><td>PGMR (T7 + T8)</td><td>대부분 설정에서 0.0%</td></tr></table></div>"
   },
   "pc": {
    "usePro": "메모리에 있는 IRI 만 들어가므로 URI 환각이 사라진다 (PGMR: 대부분 설정에서 0.0%)",
    "useCon": "메모리를 구축해야 한다. 가장 가까운 IRI 를 항상 넣으므로 거부 임계값이 필요하다.",
    "skipPro": "메모리 구축 · 검색 단계가 없다",
    "skipCon": "모델이 적은 IRI 를 검증 없이 그대로 쓴다"
   },
   "limit": "메모리에 존재하는 IRI 만 삽입된다. 존재하는 다른 IRI(소재지 ↔ 본사 소재지)를 선택하는 오류는 방지하지 못한다.",
   "notes": {
    "build": "● entity · ontology memory (BGE + FAISS)",
    "agent": "— 생성 뒤 placeholder 마다 1회 검색한다",
    "admin": "○ key 가 label · description 이라 그 품질이 치환 정확도를 좌우한다",
    "schemaChg": "인스턴스 재인덱싱 / 스키마 재인덱싱"
   },
   "bySource": {
    "PGMR": "entity memory 는 entity URI, ontology memory 는 relation · property URI 를 담는다. label · description embedding 을 key, URI 를 value 로 두며 인코더는 BGE, 근사 최근접 검색은 FAISS 다. RAG(T4)가 생성 이전에 검색하는 것과 달리 생성 이후에 검색한다. threshold 는 약 0.85 에서 refusal 과 정확도가 균형을 이룬다 (§7)."
   },
   "rel": [
    [
     "선행",
     "T7"
    ],
    [
     "대체",
     "T4"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "src",
      "c": 1,
      "r": 0,
      "k": "kg",
      "n": "KG",
      "ty": "[원천 데이터]",
      "d": [
       "URI 의 label · 설명"
      ],
      "off": true
     },
     {
      "id": "bld",
      "c": 2,
      "r": 0,
      "k": "build",
      "n": "임베딩 적재",
      "ty": "[배포 시 1회]",
      "d": [
       "BGE → FAISS"
      ],
      "off": true
     },
     {
      "id": "mem",
      "c": 3,
      "r": 0,
      "k": "store",
      "n": "IRI 메모리",
      "ty": "[entity · ontology]",
      "d": [
       "key: label + 설명",
       "value: IRI"
      ],
      "off": true
     },
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "t7",
      "c": 1,
      "r": 1,
      "k": "other",
      "ref": "T7",
      "n": "LLM (T7)",
      "ty": "[placeholder 생성]",
      "d": [
       "IRI 없는 쿼리"
      ]
     },
     {
      "id": "mid",
      "c": 2,
      "r": 1,
      "k": "io",
      "n": "중간 쿼리",
      "ty": "[mapping block]",
      "d": [
       "[ENT] 서울",
       "[REL] 소재지"
      ]
     },
     {
      "id": "tech",
      "c": 3,
      "r": 1,
      "k": "tech",
      "n": "Grounder",
      "ty": "[T8 · 임베딩 유사도]",
      "d": [
       "placeholder 마다",
       "top-1 IRI"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "SPARQL",
      "ty": "[출력]",
      "d": [
       "?u ex:P2 ex:Q101"
      ]
     },
     {
      "id": "ref",
      "c": 3,
      "r": 2,
      "k": "io",
      "n": "Refusal",
      "ty": "[score < 0.85]",
      "d": [
       "답하지 않는다"
      ]
     }
    ],
    "edges": [
     {
      "f": "src",
      "t": "bld",
      "off": 1
     },
     {
      "f": "bld",
      "t": "mem",
      "off": 1
     },
     {
      "f": "q",
      "t": "t7",
      "n": 1
     },
     {
      "f": "t7",
      "t": "mid",
      "n": 2
     },
     {
      "f": "mid",
      "t": "tech",
      "n": 3
     },
     {
      "f": "tech",
      "t": "mem",
      "n": 4,
      "both": 1
     },
     {
      "f": "tech",
      "t": "out",
      "n": 5
     },
     {
      "f": "tech",
      "t": "ref",
      "n": 6
     }
    ],
    "steps": [
     "질문을 T7 형식의 LLM 에 넘긴다",
     "LLM 이 IRI 없이 placeholder 만 둔 중간 쿼리를 쓴다",
     "mapping block 의 placeholder(「[ENT] 서울 — 대한민국의 수도」)를 Grounder 에 넘긴다",
     "IRI 메모리에서 label + description 임베딩이 가장 가까운 IRI 를 찾는다 (ex:Q101 0.97)",
     "top-1 score 가 0.85 이상이면 치환한다. 쿼리의 IRI 는 모두 메모리에서 오므로 KG 에 존재한다",
     "0.85 미만이면 치환하지 않고 답하지 않는다 (refusal)"
    ],
    "offNote": "KG 의 모든 URI 를 label · description 임베딩을 key 로 메모리에 적재한다. 개체 · property 가 추가되면 다시 적재한다."
   }
  },
  {
   "id": "T9",
   "name": "Validation + Iterative Refinement",
   "short": "Validation + Iterative Refinement",
   "stage": "post",
   "one": "생성된 쿼리를 실행 전에 스키마와 대조하고, 오류 메시지와 대체 옵션을 피드백해 LLM 이 수정하게 한다.",
   "def": {
    "text": "validator 가 generated query 의 triple patterns 를 provided schema 와 대조해 human-readable error messages 를 내고, 이를 새 prompt 로 되먹여 query 를 iteratively refine 한다.",
    "src": "원문 — SPARQL-LLM §3.2.3. SAGA 는 같은 계열을 post-hoc validators 로 부른다",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7558"
   },
   "sources": {
    "SPARQL-LLM": "●",
    "SAGA": "○"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ● · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "—",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     2
    ],
    "src": [
     0,
     2
    ],
    "what": [
     4
    ],
    "how": [
     3
    ],
    "stage": [
     1,
     2
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     0,
     1
    ],
    "agent": [
     1
    ],
    "admin": [
     2
    ],
    "schemaChg": [
     1
    ],
    "instChg": [
     2
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "generated query 의 triple patterns",
     "m": "?u ex:foundedYear ?y"
    },
    {
     "l": "처리 방식",
     "t": "validator",
     "s": "triple patterns 를 provided schema 와 대조"
    },
    {
     "l": "대조 기준",
     "t": "provided schema",
     "s": "T1 의 schema 정보 공유",
     "c": "idx"
    },
    {
     "l": "조회 결과",
     "t": "human-readable error messages · possible solutions",
     "v": "ex:foundedYear 는 스키마에 없음\n쓸 수 있는 것: ex:foundingYear"
    },
    {
     "l": "반영 위치",
     "t": "Mid · Post",
     "s": "SAGA: execute 의 [BLOCKED] observation · SPARQL-LLM: 생성 후 refinement (최대 3회)"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 .\n# 스키마: University 는 ex:locatedIn(→ City) · ex:foundingYear 를 가진다\n#         ex:birthYear 의 domain 은 ex:Person 이다",
    "html": "<h4>SPARQL-LLM 형 — 생성 뒤 검증하고 고쳐 쓰기</h4>\n<div class=\"tw\"><table><tr><th>회차</th><th>LLM 이 쓴 쿼리</th><th>validator 메시지</th></tr>\n<tr><td>1</td><td><code>?u a ex:University ; ex:locatedIn ex:Seoul ; ex:foundedYear ?y</code></td><td>ex:foundedYear 는 스키마에 없다. 쓸 수 있는 property: ex:locatedIn, ex:foundingYear</td></tr>\n<tr><td>2</td><td><code>?u a ex:University ; ex:locatedIn ex:Seoul ; ex:foundingYear ?y</code></td><td>통과 → 실행 → 한빛대학교 · 1952</td></tr></table></div>\n<p>메시지에 대체 옵션(쓸 수 있는 property 목록)이 들어 있어 2회차에 바로 고쳐진다.</p>\n<h4>SAGA 형 — 실행 시점에 막기</h4>\n<pre>execute(?u a ex:University ; ex:birthYear ?y)\n→ [BLOCKED]</pre>\n<p>controller prompt 는 「[BLOCKED] 는 property domain 이 subject type 과 맞지 않는다는 뜻이니 다른 property 를 쓰라」 고 지시한다. 논문은 신호 문구만 적고 판정 절차는 서술하지 않는다.</p>\n<h4>잡지 못하는 것</h4><p>스키마에는 맞고 뜻이 틀린 쿼리다. 「설립 연도」 를 물었는데 <code>ex:openingYear</code>(역시 University 의 property 라고 하자)를 쓰면 통과한다.</p>"
   },
   "pc": {
    "usePro": "문법 · 스키마 위반을 실행 전에 잡아 고친다 (SPARQL-LLM: 최대 3회 수정)",
    "useCon": "수정마다 LLM 호출과 지연이 는다. 문법은 맞고 뜻이 틀린 쿼리는 잡지 못한다",
    "skipPro": "호출 1회로 끝나 비용 · 지연이 가장 적다",
    "skipCon": "틀린 쿼리가 그대로 실행되어 오류나 빈 결과가 답으로 나간다"
   },
   "limit": "실행 전에 스키마 위반을 검출한다. 스키마에는 부합하나 결과가 비는 쿼리는 통과한다 (→ T10).",
   "notes": {
    "build": "○ T1 스키마를 validator 에 쓴다",
    "agent": "○ 검증 → 오류 메시지 → 재생성의 고정 루프로 충분하다",
    "admin": "— 스키마 품질은 T1 쪽에서 관리한다",
    "schemaChg": "인스턴스 무관 / 스키마 T1 과 함께 갱신"
   },
   "bySource": {
    "SPARQL-LLM": "SPARQL 생성 컴포넌트의 Validator 가 오류 메시지와 대체 옵션을 제공하고, typically up to three refinement iterations 안에 실행 가능한 쿼리를 도출한다. 절제 실험에서 예제 · class 정보 다음으로 중요했다.",
    "SAGA": "execute_sparql 이 domain 이 맞지 않는 질의에 [BLOCKED] 를 돌려준다 (Appendix F.2, p.16). 본문 Algorithm 1 에는 이 검사가 없고, SAGA 는 스스로를 post-hoc validator 와 구별하므로 ○ 로 둔다."
   },
   "rel": [
    [
     "자원 공유",
     "T1"
    ],
    [
     "보완",
     "T6"
    ],
    [
     "보완",
     "T10"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "llm",
      "c": 1,
      "r": 1,
      "k": "llm",
      "n": "LLM",
      "ty": "[SPARQL 생성]",
      "d": [
       "오류 메시지를",
       "받아 고쳐 쓴다"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "Validator",
      "ty": "[T9 · 스키마 대조]",
      "d": [
       "triple pattern 검사"
      ]
     },
     {
      "id": "sch",
      "c": 2,
      "r": 0,
      "k": "store",
      "n": "Schema",
      "ty": "[T1 인덱스 공유]",
      "d": [
       "class · property"
      ]
     },
     {
      "id": "kg",
      "c": 3,
      "r": 1,
      "k": "kg",
      "n": "KG endpoint",
      "ty": "[실행]",
      "d": [
       "통과한 쿼리만"
      ]
     },
     {
      "id": "out",
      "c": 4,
      "r": 1,
      "k": "io",
      "n": "답",
      "ty": "[결과]",
      "d": [
       "한빛대학교 · 1952"
      ]
     }
    ],
    "edges": [
     {
      "f": "q",
      "t": "llm",
      "n": 1
     },
     {
      "f": "llm",
      "t": "tech",
      "n": 2
     },
     {
      "f": "tech",
      "t": "sch",
      "n": 3,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 4,
      "route": "below"
     },
     {
      "f": "tech",
      "t": "kg",
      "n": 5
     },
     {
      "f": "kg",
      "t": "out",
      "n": 6
     }
    ],
    "steps": [
     "질문을 LLM 에 넘긴다 (T1 · T2 로 prompt 를 채운 상태)",
     "생성된 쿼리를 실행하기 전에 Validator 에 넘긴다",
     "triple pattern 을 T1 스키마와 대조한다",
     "위반이면 오류 메시지와 대체 옵션(「ex:foundedYear 없음, 쓸 수 있는 것: ex:foundingYear」)을 돌려 LLM 이 고쳐 쓴다. SPARQL-LLM 은 보통 3회 안에 끝난다",
     "통과한 쿼리만 KG endpoint 에서 실행한다",
     "결과를 답으로 낸다. 스키마에 맞지만 뜻이 틀린 쿼리도 여기까지 통과한다"
    ],
    "offNote": null,
    "offNone": "T1 의 스키마를 그대로 쓴다."
   }
  },
  {
   "id": "T10",
   "name": "Execution Feedback (empty-result signal)",
   "short": "Execution Feedback",
   "stage": "post",
   "one": "쿼리 실행 결과(빈 결과 등)를 신호로 피드백해, 스키마에는 부합하나 결과가 비는 쿼리를 LLM 이 수정하게 한다.",
   "def": {
    "text": "execute 결과(empty result 등)를 feedback 으로 되돌려 partial query 를 revise 한다. 잘못 든 탐색 분기에서 돌아오게 하는 기법이다.",
    "src": "원문 — SAGA Related Work (SPINACH 가 \"revises partial queries through execution feedback\")",
    "link": "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7578"
   },
   "sources": {
    "SAGA": "●"
   },
   "badges": [
    [
     "조회 방식",
     "Semantic Parsing ○ · Graph Exploration* ●"
    ],
    [
     "검색 증강",
     "—",
     "KG 에서 검색한 정보를 LLM 에 주는가 (● 예 · ○ 부분 · — 아니오)"
    ]
   ],
   "v": {
    "build": [
     3
    ],
    "src": [
     1,
     2
    ],
    "what": [
     4
    ],
    "how": [
     4
    ],
    "stage": [
     1,
     2
    ],
    "mode": [
     0,
     1
    ],
    "paper": [
     1
    ],
    "agent": [
     1
    ],
    "admin": [
     2
    ],
    "schemaChg": [
     0
    ],
    "instChg": [
     0
    ]
   },
   "flow": [
    {
     "l": "입력",
     "t": "partial query σ",
     "m": "?u ex:locatedIn \"서울\""
    },
    {
     "l": "처리 방식",
     "t": "execute(σ)",
     "s": "결과 행 수 확인"
    },
    {
     "l": "출처",
     "t": "KG endpoint",
     "s": "실행마다 현재 KG 조회",
     "c": "kg"
    },
    {
     "l": "조회 결과",
     "t": "[WARNING] empty result",
     "m": "execute_sparql → 0 rows"
    },
    {
     "l": "반영 위치",
     "t": "Mid · Post",
     "s": "SAGA: execute 의 observation · 단발 생성: 재시도 루프"
    }
   ],
   "ex": {
    "data": "ex:HanbitUniv  a ex:University ;  rdfs:label \"한빛대학교\" ;\n               ex:locatedIn ex:Seoul ;  ex:foundingYear 1952 .\nex:Seoul       a ex:City ;  rdfs:label \"서울\" .",
    "html": "<h4>① 빈 결과를 신호로 받기</h4>\n<div class=\"tw\"><table><tr><th>턴</th><th>행동</th><th>관찰</th></tr>\n<tr><td>1</td><td><code>execute(?u a ex:University ; ex:locatedIn \"서울\")</code></td><td>[WARNING] empty result — 0행</td></tr>\n<tr><td>2</td><td><code>search(\"서울\")</code></td><td>ex:Seoul (City)</td></tr>\n<tr><td>3</td><td><code>execute(?u a ex:University ; ex:locatedIn ex:Seoul)</code></td><td>1행: ex:HanbitUniv</td></tr>\n<tr><td>4</td><td><code>execute(... ; ex:foundingYear ?y)</code></td><td>1행: 1952 → stop()</td></tr></table></div>\n<p>1턴의 쿼리는 문법도 스키마도 맞다. 서울을 IRI 가 아니라 문자열로 쓴 점이 틀려 T9 는 통과시킨다. 실행해 봐야 알 수 있는 오류이고, 빈 결과 신호가 에이전트를 재탐색으로 돌린다.</p>\n<h4>오히려 해가 되는 경우</h4><p>「서울에 있는 대학 중 1900년 이전에 세워진 곳은?」 의 정답이 실제로 0건이라면 [WARNING] 이 맞는 쿼리를 고치도록 유도한다. SAGA 의 controller prompt 가 「질문에는 반드시 답이 있다」 고 전제하는 것(Appendix F.2 지시 6)도 이 방향을 강화한다. 결과가 있는 오답(부산의 대학까지 섞인 경우)은 신호가 나오지 않는다.</p>"
   },
   "pc": {
    "usePro": "빈 결과를 신호로 다른 분기를 시도해 잘못 든 경로에서 돌아올 수 있다 (SAGA)",
    "useCon": "실행마다 endpoint 를 호출해 지연이 는다. 정답이 원래 빈 결과인 질문에도 수정을 유도하고, 결과가 있는 오답은 잡지 못한다",
    "skipPro": "실행 1회로 끝나 endpoint 부하가 적다",
    "skipCon": "빈 결과가 그대로 최종 답이 된다"
   },
   "limit": "실행 후에만 드러나는 오류를 검출한다. 정답이 원래 0건인 질문에서는 올바른 쿼리의 수정을 유도할 수 있다.",
   "notes": {
    "build": "— 실행할 endpoint 만 있으면 된다",
    "agent": "○ 실행 → 결과 확인 → 재생성 루프. 단발 생성에 재시도 루프만 붙여도 된다",
    "admin": "— 관리할 산출물이 없다",
    "schemaChg": "인스턴스 쉬움 / 스키마 쉬움"
   },
   "bySource": {
    "SAGA": "execute 결과가 관찰로 돌아와 interaction history 에 쌓이고, 같은 실패를 되풀이하지 않게 한다. execute_sparql 은 빈 결과에 [WARNING] 을 붙여 「property type compatibility 를 확인하라」 고 알린다 (Appendix F.2, p.16–17). 루프 자체는 기저 파서 SPINACH 에서 이어받았다. SAGA 는 빈 결과율을 타입 무시 접지의 진단 지표로 쓴다."
   },
   "rel": [
    [
     "보완",
     "T9"
    ]
   ],
   "diagram": {
    "nodes": [
     {
      "id": "q",
      "c": 0,
      "r": 1,
      "k": "io",
      "n": "질문",
      "ty": "[입력]",
      "d": [
       "서울에 있는 대학의",
       "설립 연도는?"
      ]
     },
     {
      "id": "llm",
      "c": 1,
      "r": 1,
      "k": "llm",
      "n": "LLM controller",
      "ty": "[에이전트 · 재시도]",
      "d": [
       "쿼리 수정 · 재탐색"
      ]
     },
     {
      "id": "tech",
      "c": 2,
      "r": 1,
      "k": "tech",
      "n": "execute(σ)",
      "ty": "[T10 · 쿼리 실행]",
      "d": [
       "결과 행 수 확인"
      ]
     },
     {
      "id": "kg",
      "c": 2,
      "r": 2,
      "k": "kg",
      "n": "KG endpoint",
      "ty": "[질의 시점 조회]",
      "d": [
       "현재 데이터"
      ]
     },
     {
      "id": "out",
      "c": 3,
      "r": 1,
      "k": "io",
      "n": "답",
      "ty": "[결과 있음]",
      "d": [
       "한빛대학교 · 1952"
      ]
     }
    ],
    "edges": [
     {
      "f": "q",
      "t": "llm",
      "n": 1
     },
     {
      "f": "llm",
      "t": "tech",
      "n": 2
     },
     {
      "f": "tech",
      "t": "kg",
      "n": 3,
      "both": 1
     },
     {
      "f": "tech",
      "t": "llm",
      "n": 4,
      "route": "above"
     },
     {
      "f": "tech",
      "t": "out",
      "n": 5
     }
    ],
    "steps": [
     "질문을 controller(또는 단발 생성 + 재시도 루프)에 넘긴다",
     "partial query σ 를 실행한다",
     "KG endpoint 에서 결과를 받아 행 수를 센다",
     "0행이면 [WARNING] empty result 를 돌려 LLM 이 다른 분기를 시도한다 (「서울」 문자열 → search 로 ex:Seoul)",
     "결과가 있으면 답으로 낸다. 결과가 있는 오답과 원래 0건인 정답은 구별하지 못한다"
    ],
    "offNote": null,
    "offNone": "실행할 endpoint 만 있으면 된다."
   }
  }
 ],
 "sources": [
  {
   "key": "SPARQL-LLM",
   "title": "SPARQL-LLM: Real-Time SPARQL Query Generation from Natural Language Questions",
   "links": [
    [
     "arXiv 2512.14277",
     "https://arxiv.org/abs/2512.14277"
    ],
    [
     "ClickUp 논문정리",
     "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7078"
    ]
   ],
   "meta": [
    [
     "조회 방식",
     "Semantic Parsing"
    ],
    [
     "에이전트",
     "없음 (고정 검증 루프)"
    ],
    [
     "주 개입 시점",
     "Pre · Post"
    ]
   ],
   "problem": "기존 text-to-SPARQL 시스템이 정확도에 치중해 실행 속도 · 비용 · federated query 지원이 미흡하다. 비교 대상은 LLM 이 도구를 반복 호출하는 에이전트형(MetaboT, GRASP)과 TEXT2SPARQL 챌린지 참가 시스템이다.",
   "core": [
    "Indexing Component — endpoint 에서 질문–쿼리 예제와 VoID 기반 스키마를 가져와 임베딩해 vector database 에 적재한다. 최초 배포 시 1회만 실행한다",
    "Prompt Building Component — 질문을 sub-questions 와 high-level concepts 로 분해하고, 각각으로 관련 예제 · class 를 검색해 prompt 를 구성한다",
    "SPARQL Generation Component — validator 가 생성 쿼리를 스키마와 대조하고, 오류 메시지 · 대체 옵션을 되돌려 반복 수정한다",
    "SPARQL Execution Component — 검증된 쿼리를 실행하고 결과를 LLM 이 자연어로 해석한다. federated query 는 여러 endpoint 결과를 결합한다"
   ],
   "claim": "질의 시점에 KG 를 탐색하지 않고, 사전 인덱싱한 메타데이터 검색과 검증 루프로 에이전트형보다 빠르고 저렴하게 생성한다.",
   "limits": [
    "다른 언어 · 도메인, SPARQL 전체 기능에 대한 체계적 평가가 없다",
    "제공 예제의 품질 · 패턴 범위 · 노이즈 영향을 체계적으로 평가하지 않았다",
    "제공 context 의 기여와 LLM 의 사전 지식을 완전히 분리하기 어렵다"
   ]
  },
  {
   "key": "SAGA",
   "title": "SAGA: Schema-Aware Grounding for Agentic Text-to-SPARQL Generation",
   "links": [
    [
     "arXiv 2607.14494",
     "https://arxiv.org/abs/2607.14494"
    ],
    [
     "ClickUp 논문정리",
     "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7138"
    ]
   ],
   "meta": [
    [
     "조회 방식",
     "Graph Exploration* (interactive agentic semantic parsing)"
    ],
    [
     "에이전트",
     "필요 (search · lookup · examples · execute · stop)"
    ],
    [
     "주 개입 시점",
     "Mid"
    ]
   ],
   "problem": "interactive agentic semantic parsing 에서 에이전트가 property 를 어휘 유사성과 인스턴스 관찰만으로 고른다. 개체 타입 · property domain · range · 기대 답 타입을 보지 않는 type-blind grounding 이 빈 결과와 불필요한 수정 턴을 낳는다.",
   "core": [
    "schema index — 추론 전에 property 별 domain · range 를 기록한다. Wikidata 는 P2302, Freebase 는 fb_roles, 선언이 없으면 표본 subject–object 쌍에서 soft evidence 를 뽑는다",
    "persistent bidirectional type state Θ — 개체 · 변수 타입은 KG 관찰에서 앞으로, 기대 답 타입은 질문에서 뒤로 누적한다",
    "type-constrained grounding — lookup 시점에 domain 충돌 property 를 제거하고, schema 가 없는 property 는 남긴다",
    "schema-compact observation — 남은 property 를 inline domain · range 와 함께 보여 별도 LLM 가지치기 호출을 대체한다"
   ],
   "claim": "schema 를 prompt 에 넣거나 사후 검증하는 대신, graph-pattern 조회 단계 자체를 schema-aware 로 바꾼다. training-free 이며 기저 파서는 SPINACH 다.",
   "limits": [
    "P31 로 선언된 타입만 필터에 쓸 수 있어, 타입 선언이 없는 class 수준 개체에서는 필터가 건너뛰어진다",
    "domain 선언이 좁거나 class 계층 경로가 다르면 정답 property 도 제거된다",
    "[BLOCKED] · [WARNING] 은 controller prompt 에만 나오고 판정 절차는 서술하지 않는다"
   ]
  },
  {
   "key": "PGMR",
   "title": "PGMR: Reducing Hallucinations in Language Model-based SPARQL Query Generation Using Post-Generation Memory Retrieval",
   "links": [
    [
     "arXiv 2502.13369",
     "https://arxiv.org/abs/2502.13369"
    ],
    [
     "ClickUp 논문정리",
     "https://app.clickup.com/9018039211/v/dc/8cr8pxb-7238/8cr8pxb-7318"
    ],
    [
     "코드",
     "https://github.com/Lama-West/PGMR"
    ]
   ],
   "meta": [
    [
     "조회 방식",
     "Semantic Parsing"
    ],
    [
     "에이전트",
     "없음 (단발 생성 + 후처리)"
    ],
    [
     "주 개입 시점",
     "Mid · Post"
    ]
   ],
   "problem": "Wikidata 의 Q-id · P-id 처럼 의미 없는 식별자는 LLM 이 파라메트릭 메모리로 회상해야 해서, 직접 생성하면 KG 에 없는 URI 를 지어낸다.",
   "core": [
    "intermediate query (SPARQL-PGMR query) — LLM 은 URI 자리를 [ENT] · [REL] placeholder 로 둔 query block 과 mapping block 을 생성한다",
    "post-generation memory retrieval — entity memory · ontology memory 에서 placeholder 와 가장 가까운 URI 를 찾아 치환한다",
    "retrieval confidence threshold — top-ranked URI 의 score 가 기준 미만이면 답하지 않는다(refusal)",
    "비교군 RAG baseline — 생성 전에 URI 후보를 prompt 에 넣는 방식과 대비한다"
   ],
   "claim": "구조 합성과 식별자 접지를 시점상 분리해, 메모리에 있는 URI 만 쿼리에 들어가게 한다.",
   "limits": [
    "LLM 이 만드는 질의 구조 자체의 환각은 개선하지 못한다",
    "존재하는 다른 URI 를 고르는 접지 오류는 막지 못한다",
    "배포 전에 KG 의 모든 URI 를 메모리에 적재해야 한다"
   ]
  }
 ],
 "glossary": [
  [
   "개입 시점",
   [
    [
     "Pre-Generation",
     "LLM generation 이전에 적용하는 enhancement",
     "GraphRAG 서베이 Fig. 2"
    ],
    [
     "Mid-Generation",
     "generation 도중에 적용하는 enhancement",
     "GraphRAG 서베이 Fig. 2"
    ],
    [
     "Post-Generation",
     "generation 이후 output 에 적용하는 enhancement",
     "GraphRAG 서베이 Fig. 2, PGMR"
    ],
    [
     "판정 기준 (이 페이지)",
     "LLM 이 SPARQL 을 작성하는 호출 기준. Pre 는 prompt 구성, Mid 는 호출 도중 (에이전트 턴 사이 observation · 출력 형식 변경), Post 는 출력 쿼리의 검사 · 치환 · 실행. 시스템에 따라 달라지면 복수 표시",
     "Claude 제안 — 서베이의 세 단계를 기법 단위에 적용하기 위한 기준"
    ]
   ]
  ],
  [
   "조회 방식",
   [
    [
     "Semantic Parsing",
     "question 을 executable logical form(SPARQL 등)으로 변환하고 KG 에 execute 해 answer 를 얻는다. LLM 이 쿼리를 한 번에 쓴다 (SPARQL-LLM · PGMR)",
     "GraphRAG 서베이 §2.3, SAGA Introduction"
    ],
    [
     "Graph Exploration*",
     "LLM controller 가 매 step 다음에 조회할 대상을 정하며 KG 를 iterative 하게 조회한다. search → lookup → execute 로 한 단계씩 조립한다 (SAGA). 작명",
     "대응 원문: 서베이 §6.2.2 adaptive retrieval, SAGA interactive agentic semantic parsing"
    ],
    [
     "Retrieval-Augmented",
     "retriever 가 KG 에서 question-relevant graph elements 를 retrieve 해 LLM 에 제공한다. 조회 방식과 나란한 세 번째 경로가 아니라 기법에 붙는 속성으로 둔다",
     "GraphRAG 서베이 §2.3 · §4, SAGA Introduction"
    ]
   ]
  ],
  [
   "표 셀에 나오는 용어",
   [
    [
     "VoID",
     "Vocabulary of Interlinked Datasets. RDF dataset 의 class · predicate 관계 등 metadata 를 기술하는 vocabulary",
     "SPARQL-LLM §3.1"
    ],
    [
     "ShEx",
     "Shape Expressions. RDF graph 의 schema constraints 를 표현하는 schema language",
     "SPARQL-LLM §3.1.2"
    ],
    [
     "search · lookup · execute",
     "SAGA controller 의 actions (이 밖에 examples · stop). search 는 text 로 entity 를, lookup(e) 는 이웃을, execute 는 query 를 실행",
     "SAGA Method"
    ],
    [
     "[BLOCKED] · [WARNING]",
     "execute_sparql 이 돌려주는 signal. domain 불일치면 BLOCKED, empty result 면 WARNING",
     "SAGA Appendix F.2"
    ],
    [
     "Persistent Type State Θ",
     "interaction 중 만난 entity · 변수를 현재 알려진 types 로 mapping 하는 running record",
     "SAGA Method"
    ],
    [
     "Validator",
     "parse 한 query 의 triple patterns 를 schema 와 대조해 human-readable error messages 를 내는 component",
     "SPARQL-LLM §3.2.3"
    ],
    [
     "RAG baseline",
     "PGMR 의 비교군. question 과 label 이 가까운 URI k 개(k = 10)를 prompt 에 넣고 생성한다",
     "PGMR §5.3 · A.1"
    ],
    [
     "Type-blind grounding",
     "property 의 domain 과 개체 타입이 맞지 않아도 어휘 유사성만으로 고르는 오류. 빈 결과 · 잘못된 쿼리로 이어진다",
     "SAGA"
    ]
   ]
  ],
  [
   "KG · 검색 기본 용어",
   [
    [
     "domain δ(p) · range ρ(p)",
     "property p 의 subject / object 가 가져야 하는 type 의 집합",
     "SAGA Problem Setup"
    ],
    [
     "conflict",
     "entity 의 type 과 property 의 domain 이 하나도 겹치지 않는 상태. δ(p) ∩ τ(e) = ∅",
     "SAGA 식 (3)"
    ],
    [
     "IRI · URI",
     "KG 요소의 고유 식별자. 예: Q76 (entity), P26 (relation)",
     "PGMR §3.1"
    ],
    [
     "triple pattern",
     "variable(?x)이 섞인 triple. SPARQL WHERE 절의 기본 단위",
     "PGMR §3.2"
    ],
    [
     "embeddings-based similarity search",
     "embedding 사이의 cosine similarity 로 가장 가까운 항목을 찾는 검색",
     "SPARQL-LLM §3.2.2"
    ],
    [
     "non-parametric memory",
     "모델 parameter 밖의 외부 저장소. PGMR 은 label · description embedding 을 key, URI 를 value 로 둔다",
     "PGMR §4.2"
    ],
    [
     "retrieval confidence threshold",
     "검색 결과를 받아들이는 최소 similarity score. PGMR 은 약 0.85",
     "PGMR §7"
    ],
    [
     "retrieval granularity",
     "검색해 오는 단위 (nodes · triplets · paths · subgraphs)",
     "GraphRAG 서베이 §6.3"
    ],
    [
     "placeholder · [ENT] · [REL]",
     "URI 대신 넣어 둔 자리표시. entityX = [ENT] Label [/ENT] Description",
     "PGMR §4"
    ],
    [
     "intermediate query",
     "URI 자리만 placeholder 로 둔 중간 형태의 query. query block + mapping block",
     "PGMR §4"
    ],
    [
     "refusal",
     "답할 근거가 부족할 때 답하지 않는 동작",
     "PGMR §7"
    ],
    [
     "empty result",
     "query 는 실행되었지만 결과가 0건인 상태",
     "SAGA Experiments"
    ]
   ]
  ]
 ],
 "footer": "<div>근거 논문 — <a href=\"https://arxiv.org/abs/2512.14277\" target=\"_blank\" rel=\"noopener\">SPARQL-LLM (2512.14277)</a> · <a href=\"https://arxiv.org/abs/2607.14494\" target=\"_blank\" rel=\"noopener\">SAGA (2607.14494)</a> · <a href=\"https://arxiv.org/abs/2502.13369\" target=\"_blank\" rel=\"noopener\">PGMR (2502.13369)</a> · <a href=\"https://arxiv.org/abs/2408.08921\" target=\"_blank\" rel=\"noopener\">GraphRAG 서베이 (2408.08921)</a></div>\n<div>기법 분류(T1–T10)와 분류 · 운영 요건 판정은 Claude 가 제안한 것이며 문헌의 확립된 분류가 아니다. ‡ 는 원문에서 확인하지 않은 추론, * 는 원문에 없는 작명이다. 예시의 <code>ex:</code> IRI 는 설명용 가상 어휘다. 원본: ClickUp 「방법론 소개 및 비교」 (2026-09-28 기준).</div>"
};
