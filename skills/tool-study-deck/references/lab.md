# lab — 예시를 실제로 돌리기

## 환경

```bash
mkdir -p papers/<key>/lab/examples && cd papers/<key>/lab
uv venv -q .venv && uv pip install -q --python .venv/bin/python <package>
```

- 런타임(Java, Node)이 필요하면 `java -version` 처럼 먼저 확인하고 버전을 `sources.md` 에 적는다.
- 배포물 안의 버전은 README·MANIFEST 에서 읽는다 (예: `unzip -p HermiT.jar META-INF/MANIFEST.MF`).
- 도구에 CLI 가 있으면 한 줄짜리 래퍼(`lab/<tool>.sh`)를 두고, 라이브러리 경로와 CLI 경로
  두 가지로 같은 결과를 확인할 수 있게 한다.
- Python 은 `-I` 로 실행한다.

## 장면 스크립트

장면 하나 = 함수 하나 또는 블록 하나. 새 세계(World·세션)를 장면마다 만들어 서로 섞이지 않게 한다.

```python
header("4. two rdfs:domain axioms are an intersection (OOPS P19)")
w, o = fresh("ex4")
with o:
    ...                      # 적은 것
try:
    run(w)                   # 실행
    print("consistent; ICN.is_a =", icn.is_a)   # 관찰한 것
except InconsistentError:
    print("inconsistent")
```

- 출력은 `examples/<name>.out` 에 `tee` 로 남긴다. 덱의 근거는 이 파일이다.
- 장면 이름은 영어 식별자, 화면 라벨은 한국어. 대응은 `sources.md` 실행 결과 표에 적는다.
- 같은 영역 안에서 장면끼리 이어지게 만든다 (A380 → 여객기 → 콤비기 → 화물기 HL8000).

## 장면 고르기

| 종류 | 목적 | HermiT 예 |
|---|---|---|
| 정상 동작 | 도구가 하는 일을 한 장면으로 | 정의에서 A380 → 여객기 분류, HL7611 개체 분류 |
| 오류 신호 | 도구가 잡는 실수의 모양 | 콤비기 만족 불가, HL8000 불일치 |
| 놀라는 결과 | 기본 가정이 낳는 의외의 동작 | 도메인 두 줄 = 교집합, 열린 세계, 고유 이름 가정 없음 |
| 짝 도구 연결 | 같은 결함을 다른 도구가 어떻게 보나 | OOPS P19 경고 ↔ HermiT 결과 |

놀라는 결과는 도구 문서의 FAQ·튜토리얼의 "흔한 오해" 절, 커뮤니티 질문에서 찾는다.
장면마다 "흔한 기대 → 실제 출력 → 고치는 법" 세 가지를 확인해 둔다.

## 확인이 애매할 때

라이브러리가 결과를 보여 주지 않는 경우(예: owlready2 는 sameAs 추론을 개체 속성에 반영하지
않음)는 CLI 의 다른 경로로 확인한다. HermiT 는 `--premise`·`--conclusion`·`-E` 로 함의 여부를
`true`/`false` 로 답하고, 대조군(성립하지 않아야 하는 결론)도 함께 돌린다.
