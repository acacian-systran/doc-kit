/* Spring 서비스 간 데이터 일관성 기법 비교 — method-atlas 의 두 번째 예시 (논문이 아니라 공식 문서 · 패턴 카탈로그가 근거인 경우) */
window.PAGE = {
 title: "Spring 서비스 간 일관성 기법 비교",
 h1: "Spring 서비스 간 데이터 일관성 기법 비교 (T1–T10)",
 lede: "주문 · 결제 · 재고가 서로 다른 DB 를 쓰는 Spring 마이크로서비스에서, 서비스 사이 데이터가 어긋나는 문제(이벤트 유실 · 유령 이벤트 · 중복 처리 · 중간 단계 실패)를 다루는 기법 T1–T10 을 같은 축으로 비교한다. 필터 조건은 같은 축 안에서 OR, 축 사이에서 AND 로 적용된다.",
 question: {k: "공통 예시", v: "주문 #1001(상품 A × 2)이 생기면 재고 서비스의 A 재고가 10 → 8, 정확히 한 번 줄어야 한다"},
 legend: [{label: "추가하는 테이블 · 토픽", cls: "idx"}, {label: "원래 있는 DB · 브로커", cls: "kg"}],
 criterion: "<b>개입 지점 기준</b> — 주문 이벤트가 생산 서비스의 커밋에서 소비 서비스의 반영까지 가는 경로 중 어디서 작동하는가. <b>생산 쪽</b>: 이벤트를 만드는 서비스의 트랜잭션 코드 안 · <b>전달 경로</b>: 비즈니스 코드 밖에서 메시지를 옮기고 다시 보내는 릴레이 · 리스너 컨테이너 · <b>소비 쪽 · 사후</b>: 받는 서비스의 처리 로직, 또는 흐름 전체를 되돌리거나 사후에 비교하는 쪽. 2PC 는 코디네이터가 생산 쪽 커밋과 브로커를 함께 묶어 두 곳에 표시한다.",
 labels: {method: "기법", source: "근거 문서", boundary: "배포 전 준비", noBuild: "배포 전 준비 없음"},
 stages: [{key: "pre", short: "생산"}, {key: "mid", short: "전달"}, {key: "post", short: "소비 · 사후"}],
 axes: {
  structureTitle: "구조 분류", opsTitle: "운영 요건",
  structure: [
   {key: "fail", name: "막는 실패", opts: ["이벤트 유실", "유령 이벤트", "중복 처리", "중간 단계 실패", "원인 모를 불일치", "처리 실패 (일시 장애 · 독 메시지)"]},
   {key: "build", name: "추가 구성", opts: ["DB 테이블", "별도 인프라 · 서비스", "토픽 (재시도 · DLT)", "없음"], cls: ["idx", "", "idx", "none"]},
   {key: "how", name: "처리 방식", opts: ["커밋 후 콜백", "같은 트랜잭션에 기록", "기록을 읽어 발행", "투표 후 일괄 커밋", "보상 트랜잭션", "처리 기록 대조", "재시도 · 격리", "주기적 전수 비교"]},
   {key: "cons", name: "일관성", opts: ["강한 일관성", "최종 일관성"]},
   {key: "stage", name: "개입 지점", opts: ["생산 쪽 · 커밋 안", "전달 경로", "소비 쪽 · 사후"]},
  ],
  ops: [
   {key: "impl", name: "구현 수단", opts: ["Spring Framework 기본", "Spring 프로젝트 (Modulith · Kafka · Batch)", "외부 도구 · 직접 구현"]},
   {key: "burden", name: "운영 부담", opts: ["낮음", "테이블 정리 · 감시", "별도 인프라 운영", "업무 규칙 설계"]},
   {key: "sync", name: "일치되기까지", opts: ["요청 안에서", "비동기 · 짧은 지연", "배치 주기"]},
   {key: "src", name: "근거 문서", opts: ["Spring 공식 문서", "microservices.io", "Debezium", "Sagas (1987)"], tip: "● 핵심 또는 ○ 부분 사용"},
  ],
 },
 compareDefault: ["T2", "T3", "T5"],
 exampleDataLabel: "예시 상태",
 diagramLegend: {llm: "서비스 로직", store: "추가 테이블 · 토픽", kg: "서비스 DB · 브로커", io: "입력 · 결과"},
 sourceColumns: ["종류"],

 methods: [
 {
  id: "T1", name: "After-Commit Publishing (@TransactionalEventListener)", short: "After-Commit Publishing", stage: "pre",
  one: "주문 트랜잭션이 커밋된 뒤에 Kafka 로 이벤트를 보내, 롤백된 주문의 이벤트가 나가지 않게 한다.",
  def: {text: "@TransactionalEventListener 는 트랜잭션 단계(phase)에 묶인 이벤트 리스너다. 기본 phase 는 AFTER_COMMIT 이고, 진행 중인 트랜잭션이 없으면 fallbackExecution 을 켜지 않는 한 이벤트를 처리하지 않는다.",
   src: "Spring Framework Reference — Transaction-bound Events", link: "https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html"},
  sources: {"Spring Framework": "●"},
  v: {fail: [1], build: [3], how: [0], cons: [1], stage: [0], impl: [0], burden: [0], sync: [1], src: [0]},
  flow: [
   {l: "입력", t: "ApplicationEvent", v: "OrderCreated(1001)", tag: "트랜잭션 안에서 발행"},
   {l: "처리", t: "커밋 대기", s: "phase = AFTER_COMMIT"},
   {l: "기준", t: "주문 DB 커밋", s: "롤백되면 리스너를 부르지 않는다", c: "kg"},
   {l: "출력", t: "kafkaTemplate.send", m: "order-events ←\n{orderId:1001, A×2}"},
   {l: "반영 위치", t: "생산 쪽 · 커밋 뒤", s: "같은 스레드에서 리스너 실행"}],
  ex: {data: `orders (주문 DB)       stock (재고 DB)
  1001  CREATED          A  10
order-events (Kafka)   비어 있음`,
   html: `<h4>① 코드</h4>
<pre>@Transactional
public void place(Order o) {
  orders.save(o);
  events.publishEvent(new OrderCreated(o.id()));   // 아직 Kafka 로 나가지 않는다
}

@TransactionalEventListener                        // phase = AFTER_COMMIT
void on(OrderCreated e) { kafka.send("order-events", e); }</pre>
<p class="src">설명용으로 줄인 코드다.</p>
<h4>② 결과 비교</h4>
<div class="tw"><table><tr><th></th><th>상황</th><th>주문 DB</th><th>Kafka</th><th>재고 A</th></tr>
<tr><td>T1 없음</td><td>save 직후 send, 그 뒤 검증 예외로 롤백</td><td>없음</td><td>OrderCreated(1001)</td><td>8 — 유령 이벤트</td></tr>
<tr><td>T1 있음</td><td>정상</td><td>1001</td><td>OrderCreated(1001)</td><td>8</td></tr>
<tr><td>T1 있음, 장애</td><td>커밋 직후 send 전에 프로세스 종료</td><td>1001</td><td>없음</td><td>10 — 유실</td></tr></table></div>
<h4>막지 못하는 것</h4><p>마지막 줄이다. 커밋과 발행이 여전히 두 번의 별도 작업이라, 그 사이 장애에서 이벤트가 사라진다. 리스너의 예외는 이미 커밋된 주문을 되돌리지 못한다.</p>`},
  pc: {usePro: "롤백된 주문의 이벤트가 나가지 않는다. 애너테이션 하나라 추가 구성이 없다",
   useCon: "커밋과 발행 사이에 프로세스가 죽거나 브로커가 응답하지 않으면 이벤트가 사라진다. 발행 실패로 주문을 되돌릴 수 없다",
   skipPro: "트랜잭션 안에서 바로 보내면 코드가 가장 단순하다",
   skipCon: "트랜잭션이 롤백돼도 이미 보낸 메시지는 회수할 수 없다 (유령 이벤트)"},
  limit: "커밋 뒤에 보내므로 유령 이벤트는 막는다. 커밋과 발행 사이 장애로 생기는 유실은 막지 못한다 (→ T3 · T5).",
  notes: {build: "— 추가 구성 없음", impl: "@TransactionalEventListener", burden: "— 발행 실패 로그 감시 정도", sync: "커밋 직후 발행, 소비는 비동기"},
  bySource: {"Spring Framework": "트랜잭션 단계에 묶인 리스너로 소개된다. 커밋 이후 동작의 예로 메시지 발송을 든다 ‡."},
  rel: [["대체", "T3", "커밋 뒤 발행 ↔ 같은 트랜잭션에 기록"]],
  diagram: {nodes: [
    {id: "q", c: 0, r: 1, k: "io", n: "주문 요청", ty: "[입력]", d: ["주문 #1001", "상품 A × 2"]},
    {id: "svc", c: 1, r: 1, k: "llm", n: "OrderService", ty: "[@Transactional]", d: ["save +", "publishEvent"]},
    {id: "db", c: 1, r: 2, k: "kg", n: "주문 DB", ty: "[orders]", d: ["1001 CREATED"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "AFTER_COMMIT 리스너", ty: "[T1 · 커밋 후 콜백]", d: ["커밋 성공 시에만", "실행"]},
    {id: "mq", c: 3, r: 1, k: "kg", n: "Kafka", ty: "[order-events]", d: ["OrderCreated"]},
    {id: "inv", c: 4, r: 1, k: "io", n: "재고 서비스", ty: "[소비자]", d: ["A: 10 → 8"]}],
   edges: [{f: "q", t: "svc", n: 1}, {f: "svc", t: "db", n: 2}, {f: "svc", t: "tech", n: 3}, {f: "tech", t: "mq", n: 4}, {f: "mq", t: "inv", n: 5}],
   steps: ["주문 #1001 요청이 OrderService 에 들어온다",
    "트랜잭션 안에서 주문을 저장하고 OrderCreated 를 Spring 이벤트로 발행한다. 아직 Kafka 로는 나가지 않는다",
    "커밋이 성공하면 AFTER_COMMIT 리스너가 실행된다. 롤백되면 실행되지 않는다",
    "리스너가 order-events 토픽으로 보낸다. 이 순간 프로세스가 죽으면 이벤트는 사라진다",
    "재고 서비스가 받아 상품 A 재고를 10 → 8 로 줄인다"],
   offNone: "애너테이션만 바꾼다."}
 },
 {
  id: "T2", name: "Two-Phase Commit (XA · JTA)", short: "Two-Phase Commit", stage: "pre",
  one: "주문 DB 와 메시지 브로커를 한 분산 트랜잭션으로 묶어, 둘 다 커밋하거나 둘 다 롤백한다.",
  def: {text: "JtaTransactionManager 는 JTA 트랜잭션 관리자에 위임해 여러 트랜잭션 리소스(XA 데이터소스, XA 지원 메시지 브로커)를 한 트랜잭션으로 조정한다. 관리자는 모든 리소스에 prepare 를 물어 투표를 모은 뒤 commit 또는 rollback 을 지시한다 (2단계 커밋).",
   src: "Spring Framework Reference — Transaction Management (JtaTransactionManager)", link: "https://docs.spring.io/spring-framework/reference/data-access/transaction/strategies.html"},
  sources: {"Spring Framework": "●", "microservices.io": "○"},
  v: {fail: [0, 1], build: [1], how: [3], cons: [0], stage: [0, 1], impl: [0, 2], burden: [2], sync: [0], src: [0, 1]},
  flow: [
   {l: "입력", t: "두 리소스 작업", v: "주문 저장\n+ 메시지 전송"},
   {l: "처리", t: "1단계 prepare", s: "리소스마다 커밋 가능 여부 투표"},
   {l: "참가자", t: "XA 리소스", s: "주문 DB · JMS 브로커", c: "kg"},
   {l: "결과", t: "2단계 commit / rollback", m: "DB : prepared → commit\nJMS: prepared → commit"},
   {l: "반영 위치", t: "생산 쪽 · 전달 경로", s: "요청 안에서 끝난다"}],
  ex: {data: `orders (주문 DB, XA)     order-queue (JMS 브로커, XA)
  비어 있음                비어 있음`,
   html: `<p class="src">Kafka 는 XA 리소스가 아니어서 이 예시는 XA 를 지원하는 JMS 브로커를 가정한다.</p>
<h4>① 두 단계</h4>
<div class="tw"><table><tr><th>단계</th><th>관리자 → 리소스</th><th>주문 DB</th><th>JMS 브로커</th></tr>
<tr><td>1. prepare</td><td>커밋할 수 있나?</td><td>yes (변경을 기록해 두고 잠금 유지)</td><td>yes</td></tr>
<tr><td>2. commit</td><td>커밋하라</td><td>1001 저장</td><td>OrderCreated(1001) 전달 가능</td></tr></table></div>
<h4>② 결과 비교</h4>
<div class="tw"><table><tr><th></th><th>상황</th><th>결과</th></tr>
<tr><td>T2 없음</td><td>DB 커밋 뒤 JMS 전송 실패</td><td>주문 있음, 메시지 없음 — 재고 10</td></tr>
<tr><td>T2 있음</td><td>브로커가 prepare 에 no</td><td>둘 다 롤백, 요청이 실패로 응답 — 어긋남 없음</td></tr>
<tr><td>T2 있음, 장애</td><td>prepare 뒤 관리자가 죽음</td><td>두 리소스가 결정을 기다리며 잠금을 쥔 채 남는다 (in-doubt). 관리자 복구 로그로 끝낸다</td></tr></table></div>
<h4>쓸 수 없는 곳</h4><p>서비스마다 DB 가 다른 마이크로서비스에서 재고 서비스 DB 까지 묶으려면 서비스 경계를 넘어 트랜잭션을 걸어야 한다. microservices.io 는 이 구조에서 2PC 를 대안으로 보지 않는다.</p>`},
  pc: {usePro: "두 리소스가 함께 커밋되므로 유실 · 유령 이벤트가 모두 없다. 요청이 끝나면 일치해 있다",
   useCon: "XA 를 지원하는 리소스만 묶을 수 있다 (Kafka 는 아니다). 외부 트랜잭션 관리자가 필요하고, prepare 동안 잠금이 잡혀 처리량이 떨어진다",
   skipPro: "트랜잭션 관리자 · XA 드라이버 없이 로컬 트랜잭션만 쓴다",
   skipCon: "DB 와 브로커를 따로 커밋하므로 둘 사이 장애에서 어긋난다"},
  limit: "참가자가 모두 XA 를 지원하고 살아 있을 때만 강한 일관성을 준다. 서비스 DB 가 나뉜 구조에는 걸기 어렵다 (→ T6 · T7).",
  notes: {build: "● 외부 JTA 관리자, XA 데이터소스 · 커넥션 팩토리", impl: "JtaTransactionManager + 외부 관리자 (Narayana 등)", burden: "● 관리자 복구 로그, in-doubt 트랜잭션 처리", sync: "요청 안에서 끝난다"},
  bySource: {"Spring Framework": "JtaTransactionManager 가 애플리케이션 서버나 독립 JTA 관리자에 트랜잭션 조정을 맡긴다.",
   "microservices.io": "Saga 패턴의 배경으로, 서비스마다 DB 를 가진 구조에서는 2PC 를 쓸 수 없다고 적는다."},
  rel: [["대체", "T3", "분산 커밋 ↔ 로컬 기록"], ["대체", "T6", "분산 커밋 ↔ 보상"]],
  diagram: {nodes: [
    {id: "cfg", c: 1, r: 0, k: "build", n: "XA 설정", ty: "[배포 전]", d: ["XA 데이터소스", "외부 JTA 관리자"], off: true},
    {id: "q", c: 0, r: 1, k: "io", n: "주문 요청", ty: "[입력]", d: ["주문 #1001"]},
    {id: "svc", c: 1, r: 1, k: "llm", n: "OrderService", ty: "[@Transactional · JTA]", d: ["저장 + 전송"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "트랜잭션 관리자", ty: "[T2 · 2단계 커밋]", d: ["prepare 투표", "→ commit"]},
    {id: "db", c: 3, r: 0, k: "kg", n: "주문 DB", ty: "[XA 리소스]", d: ["orders"]},
    {id: "mq", c: 3, r: 2, k: "kg", n: "JMS 브로커", ty: "[XA 리소스]", d: ["order-queue"]},
    {id: "out", c: 4, r: 1, k: "io", n: "결과", ty: "[요청 종료]", d: ["둘 다 커밋", "또는 둘 다 롤백"]}],
   edges: [{f: "cfg", t: "svc", off: 1}, {f: "q", t: "svc", n: 1}, {f: "svc", t: "tech", n: 2}, {f: "tech", t: "db", n: 3, both: 1, route: "vh"}, {f: "tech", t: "mq", n: 4, both: 1, route: "vh"}, {f: "tech", t: "out", n: 5}],
   steps: ["주문 #1001 요청이 들어온다",
    "주문 저장과 메시지 전송을 같은 JTA 트랜잭션 안에서 하고 커밋을 요청한다",
    "관리자가 주문 DB 에 prepare 를 묻는다. 커밋할 수 있으면 yes 와 함께 잠금을 유지한다",
    "JMS 브로커에도 prepare 를 묻는다. 둘 다 yes 면 commit, 하나라도 no 면 둘 다 rollback 을 지시한다",
    "요청이 끝날 때 주문과 메시지는 함께 있거나 함께 없다"],
   offNote: "XA 데이터소스 · XA 커넥션 팩토리와 외부 JTA 트랜잭션 관리자를 설정한다."}
 },
 {
  id: "T3", name: "Transactional Outbox", short: "Transactional Outbox", stage: "pre",
  one: "이벤트를 브로커로 바로 보내지 않고, 주문과 같은 로컬 트랜잭션으로 outbox 테이블에 적는다.",
  def: {text: "서비스는 비즈니스 엔터티를 갱신하는 같은 데이터베이스 트랜잭션 안에서 메시지를 outbox 테이블에 삽입한다. 별도의 message relay 가 outbox 를 읽어 메시지 브로커로 발행한다.",
   src: "microservices.io — Pattern: Transactional outbox", link: "https://microservices.io/patterns/data/transactional-outbox.html"},
  sources: {"microservices.io": "●", "Debezium": "○"},
  v: {fail: [0, 1], build: [0], how: [1], cons: [1], stage: [0], impl: [2], burden: [1], sync: [1], src: [1, 2]},
  flow: [
   {l: "입력", t: "주문 + 이벤트", v: "주문 #1001\nOrderCreated"},
   {l: "처리", t: "로컬 트랜잭션", s: "INSERT orders · INSERT outbox"},
   {l: "기록 위치", t: "outbox 테이블", s: "주문 DB 안", c: "idx"},
   {l: "출력", t: "outbox 행", m: "id=e-77  aggregate=order\ntype=OrderCreated\npayload={orderId:1001,…}"},
   {l: "전달 대상", t: "T4 Message Relay", s: "발행은 릴레이가 맡는다"}],
  ex: {data: `orders (주문 DB)       outbox (주문 DB)        stock (재고 DB)
  비어 있음              비어 있음               A  10`,
   html: `<h4>① 코드</h4>
<pre>@Transactional
public void place(Order o) {
  orders.save(o);
  outbox.save(new OutboxEvent("e-77", "order", "1001", "OrderCreated", json(o)));
}   // 둘 다 커밋되거나 둘 다 롤백된다</pre>
<h4>② 장애별 결과</h4>
<div class="tw"><table><tr><th></th><th>상황</th><th>주문 DB</th><th>재고 A</th></tr>
<tr><td>T3 없음 (T1 방식)</td><td>커밋 직후 send 전에 종료</td><td>1001</td><td>10 — 유실</td></tr>
<tr><td>T3 있음</td><td>커밋 직후 종료</td><td>1001, outbox e-77</td><td>재시작 뒤 T4 가 발행 → 8</td></tr>
<tr><td>T3 있음</td><td>주문 저장 중 예외</td><td>둘 다 롤백</td><td>10 — 메시지 없음, 정상</td></tr>
<tr><td>T3 있음, 그런데</td><td>릴레이가 발행 후 표시 전에 종료</td><td>e-77 두 번 발행</td><td>T8 없으면 6</td></tr></table></div>
<h4>막지 못하는 것</h4><p>마지막 줄이다. outbox 는 「최소 한 번」 발행을 만든다. 정확히 한 번 반영은 소비자가 멱등해야 얻는다.</p>`},
  pc: {usePro: "주문과 이벤트가 한 로컬 트랜잭션이라 유실 · 유령 이벤트가 둘 다 없다. XA 없이 된다",
   useCon: "outbox 테이블과 릴레이(T4)가 필요하다. 릴레이가 같은 이벤트를 두 번 보낼 수 있어 소비자가 멱등해야 한다",
   skipPro: "테이블 · 릴레이가 없어 단순하다",
   skipCon: "커밋과 발행이 따로라 둘 사이 장애에서 이벤트가 사라지거나 유령 이벤트가 나간다"},
  limit: "이벤트를 DB 에 남길 뿐 브로커로 옮기지는 않는다 (→ T4). 발행이 최소 한 번이라 중복은 소비자가 막아야 한다 (→ T8).",
  notes: {build: "● outbox 테이블", impl: "직접 구현 (엔터티 + 같은 트랜잭션)", burden: "○ 발행된 행 정리, 밀린 행 감시", sync: "비동기 — 릴레이 지연만큼"},
  bySource: {"microservices.io": "패턴의 정의와 함께 릴레이 방식 두 가지(Polling publisher, Transaction log tailing)를 짝으로 둔다.",
   "Debezium": "outbox 테이블 형식(id · aggregatetype · aggregateid · type · payload)을 정해 두고 CDC 로 읽는다."},
  rel: [["보완", "T8", "릴레이는 중복 발행할 수 있다"]],
  diagram: {nodes: [
    {id: "tbl", c: 2, r: 0, k: "store", n: "outbox 테이블", ty: "[스키마 추가]", d: ["주문 DB 안"], off: true},
    {id: "q", c: 0, r: 1, k: "io", n: "주문 요청", ty: "[입력]", d: ["주문 #1001"]},
    {id: "svc", c: 1, r: 1, k: "llm", n: "OrderService", ty: "[@Transactional]", d: ["주문 저장"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "outbox INSERT", ty: "[T3 · 같은 트랜잭션]", d: ["주문과 함께", "커밋 · 롤백"]},
    {id: "db", c: 2, r: 2, k: "kg", n: "주문 DB", ty: "[orders + outbox]", d: ["1001 · e-77"]},
    {id: "t4", c: 3, r: 1, k: "other", ref: "T4", n: "Message Relay", ty: "[T4]", d: ["커밋된 행 발행"]},
    {id: "mq", c: 4, r: 1, k: "kg", n: "Kafka", ty: "[order-events]", d: ["OrderCreated"]}],
   edges: [{f: "tbl", t: "tech", off: 1}, {f: "q", t: "svc", n: 1}, {f: "svc", t: "tech", n: 2}, {f: "tech", t: "db", n: 3}, {f: "db", t: "t4", n: 4}, {f: "t4", t: "mq", n: 5}],
   steps: ["주문 #1001 요청이 들어온다",
    "같은 @Transactional 안에서 주문을 저장하고",
    "OrderCreated 를 outbox 행 e-77 로 같은 DB 에 적는다. 커밋되면 둘 다 있고, 롤백되면 둘 다 없다",
    "릴레이(T4)가 커밋된 outbox 행을 읽는다",
    "Kafka 로 발행한다. 서비스가 죽어도 outbox 행이 남아 재시작 뒤 발행된다"],
   offNote: "주문 DB 에 outbox 테이블(id · aggregate · type · payload · 생성 시각)을 만든다."}
 },
 {
  id: "T4", name: "Message Relay (Polling Publisher · Transaction Log Tailing)", short: "Message Relay", stage: "mid",
  one: "outbox 에 커밋된 행을 읽어 브로커로 발행한다. 테이블을 주기적으로 조회하거나(Polling) DB 커밋 로그를 따라 읽는다(CDC).",
  def: {text: "Polling publisher 는 outbox 테이블을 주기적으로 조회해 메시지를 발행한다. Transaction log tailing 은 DB 의 트랜잭션 로그(MySQL binlog, Postgres WAL 등)를 읽어 outbox 에 삽입된 메시지를 발행한다. Debezium 의 Outbox Event Router(SMT)는 outbox 행을 aggregatetype 에 따라 토픽으로 보낸다.",
   src: "microservices.io — Polling publisher · Transaction log tailing, Debezium — Outbox Event Router", link: "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html"},
  sources: {"microservices.io": "●", "Debezium": "●"},
  v: {fail: [0], build: [1], how: [2], cons: [1], stage: [1], impl: [2], burden: [1, 2], sync: [1], src: [1, 2]},
  flow: [
   {l: "입력", t: "outbox 행", m: "e-77  order  OrderCreated", tag: "T3 출력"},
   {l: "처리", t: "Polling 또는 log tailing", s: "@Scheduled 조회 · Debezium 커넥터"},
   {l: "출처", t: "주문 DB", s: "outbox 테이블 · 트랜잭션 로그", c: "kg"},
   {l: "출력", t: "Kafka 레코드", m: "topic: outbox.event.order\nkey: 1001\nvalue: {orderId:1001,…}"},
   {l: "반영 위치", t: "전달 경로", s: "발행 후 행 표시 · 오프셋 저장"}],
  ex: {data: `outbox (주문 DB)
  e-77  order  1001  OrderCreated  published=false`,
   html: `<h4>① 두 방식</h4>
<div class="tw"><table><tr><th>방식</th><th>읽는 것</th><th>지연</th><th>드는 것</th></tr>
<tr><td>Polling publisher</td><td><code>SELECT … FROM outbox WHERE published = false</code></td><td>조회 주기만큼</td><td>DB 조회 부하, 발행 표시 UPDATE</td></tr>
<tr><td>Transaction log tailing (CDC)</td><td>binlog · WAL 의 outbox INSERT</td><td>로그 반영 지연만큼 (짧다)</td><td>Kafka Connect · Debezium 운영</td></tr></table></div>
<h4>② 중복이 생기는 순간</h4>
<pre>Polling : send(e-77) 성공 → UPDATE published=true 전에 종료 → 재시작 뒤 e-77 재발행
CDC     : 레코드 발행 → 커넥터 오프셋 저장 전에 재시작 → 같은 행 재발행</pre>
<p>두 방식 모두 최소 한 번 전달이다. 재고 서비스에는 e-77 이 두 번 올 수 있다 (→ T8).</p>
<h4>쓰지 않으면</h4><p>outbox 행이 쌓이기만 하고 재고 서비스는 아무것도 받지 못한다. T3 은 이 단계 없이 쓸 수 없다.</p>`},
  pc: {usePro: "커밋된 이벤트만, 결국 한 번 이상 발행된다. CDC 를 쓰면 서비스 코드가 발행을 몰라도 된다",
   useCon: "Polling 은 DB 조회 부하와 주기만큼의 지연, CDC 는 Kafka Connect · 커넥터 운영이 든다. 어느 쪽이든 중복 발행이 있다",
   skipPro: "구성 요소가 하나 줄어든다",
   skipCon: "outbox 를 써도 이벤트가 브로커로 나가지 않는다"},
  limit: "outbox 행을 최소 한 번 브로커로 옮긴다. 정확히 한 번은 보장하지 않는다 (→ T8).",
  notes: {build: "○ Polling: 없음 · CDC: Kafka Connect + Debezium", impl: "@Scheduled 직접 구현 또는 Debezium", burden: "● CDC 커넥터 · 오프셋 운영 / ○ Polling 조회 부하", sync: "비동기 — 조회 주기 또는 로그 반영 지연"},
  bySource: {"microservices.io": "outbox 와 짝인 두 패턴으로 따로 정리한다. Polling 은 단순하지만 DB 부하가, log tailing 은 DB 별 구현이 단점으로 적혀 있다.",
   "Debezium": "CDC 커넥터가 outbox 테이블 변경을 읽고, Outbox Event Router 가 aggregatetype 으로 토픽을, aggregateid 로 키를 정한다."},
  rel: [["선행", "T3"], ["보완", "T8", "재발행 대비"]],
  diagram: {nodes: [
    {id: "conn", c: 2, r: 0, k: "build", n: "Kafka Connect", ty: "[CDC 일 때]", d: ["Debezium 커넥터", "+ Outbox Router"], off: true},
    {id: "svc", c: 0, r: 1, k: "other", ref: "T3", n: "OrderService", ty: "[T3 · outbox 기록]", d: ["1001 + e-77", "함께 커밋"]},
    {id: "db", c: 1, r: 1, k: "kg", n: "주문 DB", ty: "[outbox · 커밋 로그]", d: ["e-77 미발행"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "Relay", ty: "[T4 · Polling / CDC]", d: ["@Scheduled 조회", "또는 로그 읽기"]},
    {id: "mq", c: 3, r: 1, k: "kg", n: "Kafka", ty: "[outbox.event.order]", d: ["key 1001"]},
    {id: "inv", c: 4, r: 1, k: "io", n: "재고 서비스", ty: "[소비자]", d: ["e-77 수신", "(두 번 올 수 있다)"]}],
   edges: [{f: "conn", t: "tech", off: 1}, {f: "svc", t: "db", n: 1}, {f: "tech", t: "db", n: 2, both: 1}, {f: "tech", t: "mq", n: 3}, {f: "tech", t: "db", n: 4, route: "below"}, {f: "mq", t: "inv", n: 5}],
   steps: ["T3 이 주문과 outbox 행 e-77 을 함께 커밋한다",
    "Relay 가 아직 발행하지 않은 행을 읽는다. Polling 은 SELECT, CDC 는 커밋 로그",
    "Kafka 로 보낸다. Debezium 은 aggregatetype 으로 토픽을 정한다",
    "발행 완료를 남긴다. Polling 은 행 표시 · 삭제, CDC 는 오프셋 저장. 이 전에 죽으면 다시 보낸다",
    "재고 서비스가 받는다. 같은 e-77 이 두 번 올 수 있다"],
   offNote: "CDC 를 쓰면 Kafka Connect 와 Debezium 커넥터를 띄우고 outbox 라우팅을 설정한다. Polling 은 스케줄러만 있으면 된다."}
 },
 {
  id: "T5", name: "Event Publication Registry (Spring Modulith)", short: "Event Publication Registry", stage: "pre",
  one: "Spring 이벤트를 발행하는 트랜잭션 안에서 리스너별 발행 기록을 DB 에 남기고, 리스너가 성공하면 완료로 표시한다. 남은 기록은 다시 실행한다.",
  def: {text: "Spring Modulith 는 트랜잭션 이벤트 리스너마다 이벤트 발행 기록을 원래 비즈니스 트랜잭션 안에서 저장한다. 리스너가 성공하면 기록이 완료로 표시되고, 실패하면 그대로 남아 재시도에 쓰인다. spring.modulith.events.republish-outstanding-events-on-restart 로 재시작 때 미완료 기록을 다시 발행할 수 있다.",
   src: "Spring Modulith Reference — Working with Application Events", link: "https://docs.spring.io/spring-modulith/reference/events.html"},
  sources: {"Spring Modulith": "●"},
  v: {fail: [0, 1], build: [0], how: [1, 2], cons: [1], stage: [0], impl: [1], burden: [1], sync: [1], src: [0]},
  flow: [
   {l: "입력", t: "ApplicationEvent", v: "OrderCreated(1001)"},
   {l: "처리", t: "발행 기록 저장", s: "같은 트랜잭션 · 리스너마다 1행"},
   {l: "기록 위치", t: "event_publication", s: "주문 DB 안", c: "idx"},
   {l: "출력", t: "발행 기록", m: "listener = Kafka 외부화\nevent    = OrderCreated(1001)\ncompleted = (비어 있음)"},
   {l: "반영 위치", t: "생산 쪽 · 커밋 안", s: "리스너 성공 시 완료 시각 기록"}],
  ex: {data: `orders (주문 DB)       event_publication (주문 DB)     order-events (Kafka)
  비어 있음              비어 있음                       비어 있음`,
   html: `<h4>① 코드</h4>
<pre>@Externalized("order-events::#{orderId()}")     // Kafka 로 외부화
record OrderCreated(long orderId) {}

@Transactional
public void place(Order o) {
  orders.save(o);
  events.publishEvent(new OrderCreated(o.id()));
}</pre>
<p class="src">설명용으로 줄인 코드다. 외부화에는 spring-modulith-events-kafka 같은 모듈이 필요하다.</p>
<h4>② 발행 기록의 상태</h4>
<div class="tw"><table><tr><th>시점</th><th>event_publication</th><th>Kafka</th></tr>
<tr><td>커밋</td><td>1행, completed 비어 있음</td><td>없음</td></tr>
<tr><td>외부화 성공</td><td>completed = 10:00:01</td><td>OrderCreated(1001)</td></tr>
<tr><td>커밋 직후 종료</td><td>completed 비어 있음 — 남는다</td><td>없음 → 재시작 때 재발행 (설정을 켰을 때)</td></tr></table></div>
<h4>T3 과 비교</h4><p>직접 만드는 outbox(T3 + T4)와 같은 원리를 Spring 이벤트 리스너 단위로 라이브러리가 제공한다. 리스너가 성공한 뒤 완료 표시 전에 죽으면 그 리스너가 다시 실행되므로, 리스너는 멱등해야 한다 ‡ (→ T8).</p>`},
  pc: {usePro: "outbox 와 같은 보장을 Spring 이벤트 그대로 얻는다. 기록 테이블 · 재발행 · Kafka 외부화가 라이브러리에 있다",
   useCon: "Spring Modulith 의존과 기록 테이블이 생긴다. 완료 기록 정리와 실패 기록 재제출을 운영해야 한다",
   skipPro: "의존이 적다",
   skipCon: "T1 처럼 커밋 뒤 리스너가 실패하거나 프로세스가 죽으면 이벤트가 사라진다"},
  limit: "리스너 단위로 최소 한 번 실행을 보장한다. 중복 실행은 막지 못한다 (→ T8).",
  notes: {build: "● event_publication 테이블", impl: "Spring Modulith", burden: "○ 완료 기록 정리, 실패 기록 재제출", sync: "비동기 — 커밋 직후"},
  bySource: {"Spring Modulith": "Event Publication Registry 와 이벤트 외부화(@Externalized)를 함께 쓰면 Spring 이벤트가 outbox 처럼 Kafka · AMQP 로 나간다. 2.0 은 발행 수명주기(처리 중 · 완료 · 실패)를 나눠 실패한 것만 다시 제출하게 한다."},
  rel: [["대체", "T3", "같은 원리, 라이브러리 제공"], ["보완", "T8"]],
  diagram: {nodes: [
    {id: "q", c: 0, r: 1, k: "io", n: "주문 요청", ty: "[입력]", d: ["주문 #1001"]},
    {id: "svc", c: 1, r: 1, k: "llm", n: "OrderService", ty: "[@Transactional]", d: ["save +", "publishEvent"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "Publication Registry", ty: "[T5 · 기록 · 재발행]", d: ["리스너마다", "발행 기록"]},
    {id: "tbl", c: 2, r: 2, k: "store", n: "event_publication", ty: "[주문 DB 안]", d: ["completed 비어 있음"]},
    {id: "lst", c: 3, r: 1, k: "llm", n: "리스너 · 외부화", ty: "[@Externalized]", d: ["커밋 뒤 실행"]},
    {id: "mq", c: 4, r: 1, k: "kg", n: "Kafka", ty: "[order-events]", d: ["OrderCreated"]}],
   edges: [{f: "q", t: "svc", n: 1}, {f: "svc", t: "tech", n: 2}, {f: "tech", t: "tbl", n: 3}, {f: "tech", t: "lst", n: 4}, {f: "lst", t: "mq", n: 5}, {f: "lst", t: "tbl", n: 6, route: "vh"}],
   steps: ["주문 #1001 요청이 들어온다",
    "트랜잭션 안에서 OrderCreated 를 Spring 이벤트로 발행한다",
    "Registry 가 리스너마다 발행 기록을 같은 트랜잭션으로 event_publication 에 적는다",
    "커밋 뒤 리스너(Kafka 외부화)를 실행한다",
    "order-events 로 나간다",
    "성공하면 기록에 완료 시각을 적는다. 남은 기록은 재시작 때(설정) 또는 직접 재제출로 다시 실행한다"],
   offNote: "spring-modulith-events 의존과 기록 저장소(JPA · JDBC 등)를 추가한다. Kafka 로 보내려면 외부화 모듈을 더한다."}
 },
 {
  id: "T6", name: "Saga — Orchestration", short: "Saga (Orchestration)", stage: "post",
  one: "오케스트레이터가 결제 → 재고 단계를 차례로 명령하고, 중간 단계가 실패하면 앞 단계의 보상 트랜잭션을 거꾸로 실행한다.",
  def: {text: "Saga 는 로컬 트랜잭션의 연속이다. 한 로컬 트랜잭션이 실패하면 앞선 로컬 트랜잭션들의 변경을 되돌리는 보상 트랜잭션을 실행한다. Orchestration 방식에서는 오케스트레이터가 참가자에게 어떤 로컬 트랜잭션을 실행할지 알린다.",
   src: "microservices.io — Pattern: Saga, Garcia-Molina & Salem (1987)", link: "https://microservices.io/patterns/data/saga.html"},
  sources: {"microservices.io": "●", "Sagas (1987)": "●"},
  v: {fail: [3], build: [0, 1], how: [4], cons: [1], stage: [2], impl: [2], burden: [1, 3], sync: [1], src: [1, 3]},
  flow: [
   {l: "입력", t: "주문 생성", v: "주문 #1001\nPENDING"},
   {l: "처리", t: "단계별 명령", s: "결제 승인 → 재고 차감"},
   {l: "상태 저장", t: "saga 상태", s: "오케스트레이터 DB", c: "idx"},
   {l: "결과", t: "응답 · 보상", m: "결제 승인 OK\n재고 차감 실패 (재고 1)\n→ 결제 취소 · 주문 거절"},
   {l: "반영 위치", t: "소비 · 사후", s: "최종 APPROVED · REJECTED"}],
  ex: {data: `orders (주문 DB)     payments (결제 DB)     stock (재고 DB)
  비어 있음            비어 있음              A  1      ← 이번 예시는 재고 부족`,
   html: `<h4>① 정상 흐름 (재고 10 이었다면)</h4>
<div class="tw"><table><tr><th>단계</th><th>오케스트레이터 명령</th><th>참가자 결과</th><th>주문 상태</th></tr>
<tr><td>1</td><td>—</td><td>주문 1001 생성</td><td>PENDING</td></tr>
<tr><td>2</td><td>결제 승인</td><td>승인</td><td>PENDING</td></tr>
<tr><td>3</td><td>재고 차감</td><td>A 10 → 8</td><td>APPROVED</td></tr></table></div>
<h4>② 재고 부족 — 보상</h4>
<div class="tw"><table><tr><th>단계</th><th>명령</th><th>결과</th><th>보상</th></tr>
<tr><td>2</td><td>결제 승인</td><td>승인</td><td>—</td></tr>
<tr><td>3</td><td>재고 차감</td><td>실패 (재고 1)</td><td>—</td></tr>
<tr><td>4</td><td>결제 취소</td><td>환불</td><td>단계 2 의 보상</td></tr>
<tr><td>5</td><td>주문 거절</td><td>REJECTED</td><td>단계 1 의 보상</td></tr></table></div>
<h4>쓰지 않으면</h4><p>결제는 승인됐는데 재고가 없어 주문이 PENDING 에 멈춘다. 고객 돈만 빠진 상태가 남는다.</p>
<h4>막지 못하는 것</h4><p>격리가 없다. 단계 2–4 사이에 다른 요청이 「결제됨 · 재고 미차감」 인 중간 상태를 본다. microservices.io 는 이를 Saga 의 단점(ACID 의 I 부재)으로 짚고 대응책 설계를 요구한다.</p>`},
  pc: {usePro: "흐름이 한곳에 있어 단계 · 보상 · 현재 상태를 읽기 쉽다. 서비스마다 DB 가 달라도 쓸 수 있다",
   useCon: "오케스트레이터와 saga 상태 저장이 필요하다. 단계마다 보상 로직을 설계해야 하고, 중간 상태가 다른 요청에 보인다",
   skipPro: "보상 설계 · 오케스트레이터가 필요 없다",
   skipCon: "중간 단계가 실패하면 앞 단계의 변경(결제)이 남은 채 어긋난다"},
  limit: "부분 실패를 업무 규칙(보상)으로 되돌린다. 단계 사이 격리는 없고, 명령 · 응답 메시지가 유실되면 멈춘다 (→ T3 · T8).",
  notes: {build: "● 오케스트레이터 · saga 상태 테이블", impl: "직접 구현 또는 saga 프레임워크 (Eventuate Tram Sagas 등)", burden: "● 단계별 보상 규칙 설계, 멈춘 saga 감시", sync: "비동기 — 단계 수만큼 왕복"},
  bySource: {"microservices.io": "주문 생성 예로 choreography 와 orchestration 두 방식을 나란히 설명한다.",
   "Sagas (1987)": "긴 트랜잭션을 하위 트랜잭션 T1…Tn 과 보상 C1…Cn 으로 나누는 원래 정의. 실패 시 이미 실행된 Ti 의 보상을 역순으로 실행한다."},
  rel: [["대체", "T7"], ["보완", "T3", "명령 · 응답 유실 방지"], ["보완", "T8", "명령 재전송 대비"]],
  diagram: {nodes: [
    {id: "q", c: 0, r: 1, k: "io", n: "주문 요청", ty: "[입력]", d: ["주문 #1001", "PENDING"]},
    {id: "tech", c: 1, r: 1, k: "tech", n: "Order Saga", ty: "[T6 · 오케스트레이터]", d: ["단계 · 보상 순서", "saga 상태 저장"]},
    {id: "pay", c: 3, r: 0, k: "llm", n: "결제 서비스", ty: "[참가자]", d: ["승인 · 취소"]},
    {id: "inv", c: 3, r: 2, k: "llm", n: "재고 서비스", ty: "[참가자]", d: ["A 재고 1", "차감 실패"]},
    {id: "out", c: 4, r: 1, k: "io", n: "주문 결과", ty: "[최종 상태]", d: ["REJECTED", "(재고 있으면 APPROVED)"]}],
   edges: [{f: "q", t: "tech", n: 1}, {f: "tech", t: "pay", n: 2, both: 1, route: "vh"}, {f: "tech", t: "inv", n: 3, both: 1, route: "vh"}, {f: "tech", t: "pay", n: 4, route: "above"}, {f: "tech", t: "out", n: 5}],
   steps: ["주문 #1001 을 PENDING 으로 만들고 saga 를 시작한다. 단계마다 saga 상태를 저장해, 오케스트레이터가 재시작돼도 이어 간다",
    "결제 서비스에 승인 명령 → 승인됨",
    "재고 서비스에 차감 명령 → 재고 1 이라 실패",
    "보상: 결제 서비스에 결제 취소 명령",
    "주문을 REJECTED 로 확정한다. 재고가 있었다면 APPROVED"],
   offNote: "오케스트레이터(서비스 또는 모듈)와 saga 상태 테이블을 두고, 단계마다 보상 명령을 정의한다."}
 },
 {
  id: "T7", name: "Saga — Choreography", short: "Saga (Choreography)", stage: "post",
  one: "중앙 조정자 없이 각 서비스가 앞 서비스의 이벤트를 듣고 자기 로컬 트랜잭션을 실행하며, 실패하면 실패 이벤트를 듣고 각자 보상한다.",
  def: {text: "Choreography 방식에서는 각 로컬 트랜잭션이 도메인 이벤트를 발행하고, 그 이벤트가 다른 서비스의 로컬 트랜잭션을 촉발한다.",
   src: "microservices.io — Pattern: Saga (choreography-based)", link: "https://microservices.io/patterns/data/saga.html"},
  sources: {"microservices.io": "●", "Sagas (1987)": "○"},
  v: {fail: [3], build: [3], how: [4], cons: [1], stage: [2], impl: [1], burden: [3], sync: [1], src: [1, 3]},
  flow: [
   {l: "입력", t: "OrderCreated", v: "주문 #1001 PENDING"},
   {l: "처리", t: "이벤트 연쇄", s: "결제 → PaymentApproved → 재고"},
   {l: "통로", t: "Kafka 토픽", s: "서비스마다 자기 이벤트 토픽", c: "kg"},
   {l: "결과", t: "실패 이벤트", m: "StockReservationFailed(1001)\n→ 결제: 환불\n→ 주문: REJECTED"},
   {l: "반영 위치", t: "소비 · 사후", s: "듣는 서비스가 각자 보상"}],
  ex: {data: `stock (재고 DB)   A  1      ← T6 과 같은 재고 부족 상황`,
   html: `<h4>① 이벤트 순서</h4>
<div class="tw"><table><tr><th>순서</th><th>발행</th><th>이벤트</th><th>듣는 쪽 · 하는 일</th></tr>
<tr><td>1</td><td>주문</td><td>OrderCreated(1001)</td><td>결제: 결제 승인</td></tr>
<tr><td>2</td><td>결제</td><td>PaymentApproved(1001)</td><td>재고: 차감 시도</td></tr>
<tr><td>3</td><td>재고</td><td>StockReservationFailed(1001)</td><td>결제: 환불 · 주문: REJECTED</td></tr></table></div>
<h4>② T6 과 비교</h4>
<div class="tw"><table><tr><th></th><th>흐름이 있는 곳</th><th>결합</th><th>지금 어디까지 왔나</th></tr>
<tr><td>T6 Orchestration</td><td>오케스트레이터 코드 한곳</td><td>오케스트레이터가 참가자를 안다</td><td>saga 상태 한 행</td></tr>
<tr><td>T7 Choreography</td><td>여러 서비스의 리스너에 흩어짐</td><td>서비스가 서로의 이벤트를 안다</td><td>로그 · 추적 ID 로 재구성</td></tr></table></div>
<h4>막지 못하는 것</h4><p>단계가 늘면 「누가 무엇을 듣는가」 가 얽혀 순환 의존이 생기기 쉽다. 이벤트 하나가 유실되면 흐름이 조용히 멈추고, 멈춘 것을 알려 주는 곳이 없다.</p>`},
  pc: {usePro: "별도 조정 서비스가 없고 이벤트만 주고받아 결합이 느슨하다. 단계가 적을 때 빨리 만든다",
   useCon: "흐름이 여러 서비스에 흩어져 전체 상태를 한눈에 볼 수 없다. 단계가 늘면 이벤트 의존이 얽힌다",
   skipPro: "이벤트 설계 · 보상 핸들러가 필요 없다",
   skipCon: "재고 실패가 결제 · 주문에 전달되지 않아 결제만 된 주문이 남는다"},
  limit: "부분 실패를 이벤트 연쇄로 되돌린다. 흐름 전체를 보는 곳이 없어 멈춘 saga 를 찾기 어렵다 (→ T10).",
  notes: {build: "— 기존 브로커만 쓴다", impl: "Spring for Apache Kafka 리스너", burden: "● 이벤트 흐름 설계, 추적 ID", sync: "비동기"},
  bySource: {"microservices.io": "같은 주문 예로 choreography 를 먼저 설명하고, 참가자가 많아지면 orchestration 이 이해하기 쉽다고 비교한다 ‡.",
   "Sagas (1987)": "원 논문은 조정 방식을 나누지 않는다. 보상 트랜잭션이라는 개념만 가져온다."},
  rel: [["보완", "T3"], ["보완", "T8"]],
  diagram: {nodes: [
    {id: "ord", c: 0, r: 1, k: "llm", n: "주문 서비스", ty: "[참가자]", d: ["1001 PENDING"]},
    {id: "tech", c: 2, r: 1, k: "tech", n: "이벤트 연쇄", ty: "[T7 · Kafka 토픽]", d: ["각자 듣고", "각자 보상"]},
    {id: "pay", c: 3, r: 0, k: "llm", n: "결제 서비스", ty: "[참가자]", d: ["승인 · 환불"]},
    {id: "inv", c: 3, r: 2, k: "llm", n: "재고 서비스", ty: "[참가자]", d: ["A 재고 1"]},
    {id: "out", c: 4, r: 1, k: "io", n: "보상", ty: "[실패 이벤트를 들은 쪽]", d: ["결제: 환불", "주문: REJECTED"]}],
   edges: [{f: "ord", t: "tech", n: 1}, {f: "tech", t: "pay", n: 2, both: 1, route: "vh"}, {f: "tech", t: "inv", n: 3, both: 1, route: "vh"}, {f: "tech", t: "out", n: 4}],
   steps: ["주문 서비스가 주문 #1001(PENDING)을 만들고 OrderCreated 를 낸다",
    "결제 서비스가 OrderCreated 를 듣고 결제를 승인한 뒤 PaymentApproved 를 낸다",
    "재고 서비스가 PaymentApproved 를 듣고 차감을 시도하지만, 재고가 1 이라 StockReservationFailed 를 낸다",
    "실패 이벤트를 들은 결제 서비스는 환불, 주문 서비스는 REJECTED 로 각자 보상한다"],
   offNote: "이벤트 계약(이름 · 필드)과 서비스마다 보상 핸들러를 정한다."}
 },
 {
  id: "T8", name: "Idempotent Consumer", short: "Idempotent Consumer", stage: "post",
  one: "소비자가 처리한 메시지 id 를 비즈니스 변경과 같은 트랜잭션으로 기록하고, 이미 기록된 id 는 건너뛰어 중복 전달을 무해하게 만든다.",
  def: {text: "Idempotent consumer 는 같은 메시지를 여러 번 받아도 올바르게 처리한다. 처리한 메시지의 id 를 데이터베이스 테이블에 기록하고, 이미 기록된 id 의 메시지는 버린다.",
   src: "microservices.io — Pattern: Idempotent Consumer", link: "https://microservices.io/patterns/communication-style/idempotent-consumer.html"},
  sources: {"microservices.io": "●"},
  v: {fail: [2], build: [0], how: [5], cons: [1], stage: [2], impl: [2], burden: [1], sync: [1], src: [1]},
  flow: [
   {l: "입력", t: "메시지", m: "eventId=e-77\nOrderCreated(1001, A×2)", tag: "T4 가 두 번 보냄"},
   {l: "처리", t: "중복 키 검사", s: "INSERT processed_message (기본 키)"},
   {l: "기록 위치", t: "processed_message", s: "재고 DB 안", c: "idx"},
   {l: "결과", t: "처리 · 건너뜀", m: "1회: 삽입 성공 → A 10→8\n2회: 키 충돌 → 건너뜀"},
   {l: "반영 위치", t: "소비 쪽", s: "재고 변경과 같은 트랜잭션"}],
  ex: {data: `stock (재고 DB)        processed_message (재고 DB)
  A  10                  비어 있음`,
   html: `<h4>① 코드</h4>
<pre>@KafkaListener(topics = "order-events")
@Transactional
void on(OrderCreated e) {
  if (!processed.insertIfAbsent(e.eventId())) return;   // 이미 처리한 메시지
  stock.decrease("A", 2);
}</pre>
<h4>② 결과 비교 — e-77 이 두 번 도착</h4>
<div class="tw"><table><tr><th></th><th>회차</th><th>processed_message</th><th>재고 A</th></tr>
<tr><td>T8 없음</td><td>1</td><td>—</td><td>8</td></tr>
<tr><td>T8 없음</td><td>2</td><td>—</td><td>6 — 중복 차감</td></tr>
<tr><td>T8 있음</td><td>1</td><td>e-77 삽입</td><td>8</td></tr>
<tr><td>T8 있음</td><td>2</td><td>e-77 이미 있음 → 건너뜀</td><td>8</td></tr></table></div>
<h4>틀리기 쉬운 곳</h4><p>id 기록과 재고 변경이 다른 트랜잭션이면 둘 사이 장애에서 다시 어긋난다. id 는 생산자가 정한 고유 값(eventId)이어야 한다. Kafka 오프셋은 릴레이가 같은 이벤트를 다시 발행하면 새 레코드라 값이 바뀐다.</p>`},
  pc: {usePro: "릴레이 재발행 · 재시도 · 리밸런스로 같은 메시지가 와도 재고가 한 번만 준다",
   useCon: "처리 기록 테이블과 정리 주기가 필요하다. 생산자가 고유 eventId 를 넣어야 한다",
   skipPro: "테이블 · 검사가 없어 처리 경로가 짧다",
   skipCon: "최소 한 번 전달에서 같은 주문으로 재고가 두 번 준다"},
  limit: "같은 메시지의 중복을 막는다. 메시지가 오지 않는 유실이나 처리 자체의 실패는 다루지 않는다 (→ T3 · T9).",
  notes: {build: "● 처리 기록 테이블", impl: "직접 구현 (리스너 + 같은 트랜잭션)", burden: "○ 오래된 기록 정리", sync: "비동기 — 소비 시점"},
  bySource: {"microservices.io": "outbox 등 최소 한 번 전달을 쓰는 구조의 짝으로 둔다. 처리 id 를 비즈니스 엔터티 갱신과 같은 트랜잭션에 기록하라고 한다."},
  rel: [["보완", "T9", "재시도도 중복을 만든다"]],
  diagram: {nodes: [
    {id: "mq", c: 0, r: 1, k: "kg", n: "Kafka", ty: "[order-events]", d: ["e-77", "(두 번 도착)"]},
    {id: "tech", c: 1, r: 1, k: "tech", n: "중복 검사", ty: "[T8 · 처리 기록 대조]", d: ["eventId", "삽입 시도"]},
    {id: "tbl", c: 1, r: 2, k: "store", n: "processed_message", ty: "[재고 DB 안]", d: ["e-77"]},
    {id: "svc", c: 2, r: 1, k: "llm", n: "재고 차감", ty: "[@Transactional]", d: ["A − 2"]},
    {id: "db", c: 2, r: 2, k: "kg", n: "재고 DB", ty: "[stock]", d: ["A 10 → 8"]},
    {id: "out", c: 3, r: 1, k: "io", n: "결과", ty: "[출력]", d: ["A = 8", "두 번째는 건너뜀"]}],
   edges: [{f: "mq", t: "tech", n: 1}, {f: "tech", t: "tbl", n: 2, both: 1}, {f: "tech", t: "svc", n: 3}, {f: "svc", t: "db", n: 4}, {f: "svc", t: "out", n: 5}],
   steps: ["e-77 이 도착한다. 릴레이 재발행으로 같은 e-77 이 한 번 더 온다",
    "processed_message 에 e-77 삽입을 시도한다. 이미 있으면 여기서 끝난다",
    "처음이면 재고 차감으로 넘어간다",
    "같은 트랜잭션에서 상품 A 를 10 → 8 로 줄인다. 기록과 차감이 함께 커밋된다",
    "두 번째 e-77 은 2 에서 걸러져 재고가 8 로 남는다"],
   offNote: "재고 DB 에 processed_message 테이블(message_id 기본 키, 처리 시각)을 만든다."}
 },
 {
  id: "T9", name: "Retry + Dead Letter Topic (Spring Kafka)", short: "Retry + Dead Letter Topic", stage: "mid",
  one: "소비자 처리가 실패하면 정해진 횟수만큼 다시 시도하고, 끝까지 실패한 메시지는 Dead Letter Topic 으로 옮겨 뒤 메시지를 막지 않게 한다.",
  def: {text: "DefaultErrorHandler 는 실패한 레코드를 BackOff 에 따라 다시 전달하고, 재시도가 끝나면 recoverer 를 부른다. DeadLetterPublishingRecoverer 는 그 레코드를 dead-letter 토픽으로 발행한다. 논블로킹 재시도에는 @RetryableTopic 이 재시도 토픽들을 만든다.",
   src: "Spring for Apache Kafka Reference — Handling Exceptions · Non-Blocking Retries", link: "https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html"},
  sources: {"Spring Kafka": "●"},
  v: {fail: [5], build: [2], how: [6], cons: [1], stage: [1], impl: [1], burden: [1], sync: [1], src: [0]},
  flow: [
   {l: "입력", t: "실패한 레코드", m: "e-82 OrderCreated(1002)\n예외: 상품 Z 없음"},
   {l: "처리", t: "BackOff 재시도", s: "예: 1초 간격 2회 (설정값)"},
   {l: "통로", t: "Kafka", s: "같은 레코드 재전달 · DLT", c: "kg"},
   {l: "결과", t: "성공 또는 DLT", m: "order-events.DLT ← e-82\n헤더: 예외 · 원래 오프셋"},
   {l: "반영 위치", t: "전달 경로", s: "리스너 컨테이너 설정"}],
  ex: {data: `order-events (Kafka)   e-81 OrderCreated(1002, A×1)
                       e-82 OrderCreated(1003, Z×1)   ← 상품 Z 는 재고 DB 에 없음`,
   html: `<h4>① 설정</h4>
<pre>@Bean
DefaultErrorHandler errorHandler(KafkaTemplate&lt;Object, Object&gt; t) {
  return new DefaultErrorHandler(
      new DeadLetterPublishingRecoverer(t),
      new FixedBackOff(1000L, 2L));      // 1초 간격으로 2회 더
}</pre>
<h4>② 두 메시지</h4>
<div class="tw"><table><tr><th>메시지</th><th>1회</th><th>2회</th><th>3회</th><th>결과</th></tr>
<tr><td>e-81 (재고 DB 일시 타임아웃)</td><td>실패</td><td>실패</td><td>성공</td><td>재고 반영</td></tr>
<tr><td>e-82 (상품 Z 없음 — 독 메시지)</td><td>실패</td><td>실패</td><td>실패</td><td>order-events.DLT ‡ 로 이동, 다음 메시지 진행</td></tr></table></div>
<p class="src">DLT 이름은 기본 규칙(원래 토픽 + .DLT)을 따른다고 가정했다 ‡. 버전 · 설정에 따라 다르니 문서로 확인한다.</p>
<h4>쓰지 않으면</h4><p>에러 처리 설정에 따라 독 메시지가 같은 파티션을 계속 막거나, 일시 장애인 e-81 까지 로그만 남기고 건너뛰어 유실된다.</p>
<h4>막지 못하는 것</h4><p>DLT 로 간 메시지는 사람이 원인을 고쳐 다시 보내기 전까지 반영되지 않는다. 재시도는 같은 메시지를 다시 처리하므로, 처리가 절반쯤 된 상태에서 실패했다면 T8 없이 두 번 반영될 수 있다.</p>`},
  pc: {usePro: "일시 장애는 재시도로 넘기고, 고칠 수 없는 메시지는 격리해 파티션이 멈추지 않는다",
   useCon: "DLT 감시 · 재처리 절차가 필요하다. 블로킹 재시도 동안 그 파티션 처리가 늦어진다",
   skipPro: "설정 · 토픽이 늘지 않는다",
   skipCon: "일시 장애에 메시지를 잃거나, 독 메시지 하나가 파티션 전체를 막는다"},
  limit: "실패 메시지를 잃지 않고 격리한다. DLT 에 간 건의 반영은 사람 · 배치가 해야 하고, 재시도는 중복을 만든다 (→ T8 · T10).",
  notes: {build: "○ DLT · 재시도 토픽", impl: "Spring for Apache Kafka", burden: "○ DLT 감시 · 재처리 절차", sync: "비동기 — 재시도 간격만큼 늦어짐"},
  bySource: {"Spring Kafka": "블로킹 재시도(DefaultErrorHandler)와 논블로킹 재시도(@RetryableTopic)를 모두 제공하고, 마지막 단계로 DLT 발행을 붙인다."},
  rel: [["보완", "T10", "DLT 에 남은 건 확인"]],
  diagram: {nodes: [
    {id: "mq", c: 0, r: 1, k: "kg", n: "Kafka", ty: "[order-events]", d: ["e-82"]},
    {id: "tech", c: 1, r: 1, k: "tech", n: "Error Handler", ty: "[T9 · 재시도 · 격리]", d: ["FixedBackOff", "→ DLT"]},
    {id: "svc", c: 2, r: 1, k: "llm", n: "재고 리스너", ty: "[@KafkaListener]", d: ["상품 Z 처리"]},
    {id: "db", c: 3, r: 1, k: "kg", n: "재고 DB", ty: "[stock]", d: ["Z 없음 → 예외"]},
    {id: "dlt", c: 1, r: 2, k: "store", n: "order-events.DLT", ty: "[격리 토픽]", d: ["e-82 + 예외 헤더"]},
    {id: "ops", c: 2, r: 2, k: "io", n: "재처리", ty: "[운영자 · 배치]", d: ["원인 수정 뒤", "다시 보냄"]}],
   edges: [{f: "mq", t: "tech", n: 1}, {f: "tech", t: "svc", n: 2}, {f: "svc", t: "db", n: 3, both: 1}, {f: "svc", t: "tech", n: 4, route: "above"}, {f: "tech", t: "dlt", n: 5}, {f: "dlt", t: "ops", n: 6}],
   steps: ["e-82 가 재고 리스너 컨테이너로 온다",
    "리스너를 부른다",
    "재고 DB 에서 처리하다 예외(상품 Z 없음)가 난다",
    "예외가 Error Handler 로 돌아오고, BackOff 만큼 기다려 다시 부른다 (2–4 반복)",
    "재시도가 끝나면 DLT 로 발행하고 다음 메시지로 넘어간다",
    "DLT 의 메시지는 원인을 고친 뒤 다시 보내거나 대사(T10)에서 다룬다"],
   offNote: "재시도 횟수 · 간격과 DLT 토픽을 정한다. 기본 recoverer 는 원래 파티션 번호로 보내므로 DLT 파티션 수를 원래 토픽 이상으로 둔다."}
 },
 {
  id: "T10", name: "Reconciliation Batch*", short: "Reconciliation Batch", stage: "post",
  one: "주기적으로 주문 DB 와 재고 DB 를 비교해, 어떤 경로로든 생긴 불일치를 찾아 보정하거나 알린다.",
  def: {text: "정해진 패턴 이름은 없다. 정산 · 결제 영역의 대사(reconciliation) 관행을 서비스 간 데이터에 적용한 것으로, Spring Batch 의 chunk 처리(ItemReader → ItemProcessor → ItemWriter)로 구현한다.",
   src: "이름은 이 페이지의 작명 *. 구현 수단 — Spring Batch Reference, Chunk-oriented Processing", link: "https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing.html"},
  sources: {"Spring Batch": "●"},
  v: {fail: [4], build: [0], how: [7], cons: [1], stage: [2], impl: [1], burden: [1, 3], sync: [2], src: [0]},
  flow: [
   {l: "입력", t: "기준 기간", v: "어제 00:00–24:00"},
   {l: "처리", t: "양쪽 집계 비교", s: "주문별 기대 차감량 vs 재고 이력"},
   {l: "출처", t: "주문 DB · 재고 DB", s: "읽기 전용 조회", c: "kg"},
   {l: "결과", t: "불일치 목록", m: "1001  기대 −2  실제 −4  중복\n1003  기대 −1  실제  0  유실"},
   {l: "반영 위치", t: "사후", s: "자동 보정 또는 담당자 알림"}],
  ex: {data: `orders (주문 DB)                     stock_history (재고 DB)
  1001  A×2  APPROVED                  1001  A −2
  1002  B×1  APPROVED                  1001  A −2     ← 같은 주문 두 번
  1003  A×1  APPROVED                  1002  B −1
  1004  A×1  CANCELLED                 1004  A −1     ← 취소인데 되돌림 없음`,
   html: `<h4>① 주문 단위 비교</h4>
<div class="tw"><table><tr><th>주문</th><th>기대</th><th>재고 이력</th><th>판정</th><th>짚이는 원인</th></tr>
<tr><td>1001</td><td>A −2</td><td>A −2, −2</td><td>중복</td><td>T8 없음</td></tr>
<tr><td>1002</td><td>B −1</td><td>B −1</td><td>일치</td><td>—</td></tr>
<tr><td>1003</td><td>A −1</td><td>없음</td><td>유실</td><td>T3 · T4 없음, 또는 DLT 에 남음</td></tr>
<tr><td>1004</td><td>0 (취소)</td><td>A −1</td><td>보상 누락</td><td>saga 보상 실패</td></tr></table></div>
<h4>② 처리</h4><p>보정 규칙이 분명한 것(중복 차감 → +2 되돌림)은 자동으로, 나머지는 담당자에게 알린다.</p>
<h4>감시 지표로서</h4><p>앞의 기법들이 제대로 동작하면 불일치 목록은 비어야 한다. 비어 있지 않으면 「짚이는 원인」 칸이 어느 기법이 빠졌는지 알려 준다.</p>
<h4>막지 못하는 것</h4><p>다음 실행까지는 불일치가 그대로 남는다. 비교 규칙은 업무마다 새로 써야 하고, 재고 변경 이력이 없으면 비교할 수 없다.</p>`},
  pc: {usePro: "원인과 상관없이 남은 불일치를 찾는다. 다른 기법의 구멍을 드러내는 감시 지표가 된다",
   useCon: "실행 주기만큼 늦게 찾는다. 대량 조회 부하와 업무별 비교 · 보정 규칙이 든다",
   skipPro: "배치 · 비교 규칙을 만들지 않아도 된다",
   skipCon: "다른 기법이 놓친 불일치가 고객 문의로나 드러난다"},
  limit: "이미 생긴 불일치를 뒤늦게 찾는다. 막지는 못하고 다음 실행까지 남으므로 앞단 기법과 함께 쓴다.",
  notes: {build: "● 결과 테이블, 재고 변경 이력", impl: "Spring Batch", burden: "● 업무별 비교 · 보정 규칙, 실행 감시", sync: "배치 주기"},
  bySource: {"Spring Batch": "주문 · 재고 이력을 chunk 단위로 읽어 비교하고, 실패한 Job 을 JobRepository 기록으로 이어서 다시 실행한다."},
  rel: [["보완", "T7", "흩어진 흐름의 멈춤을 찾는다"], ["보완", "T6"]],
  diagram: {nodes: [
    {id: "sch", c: 0, r: 1, k: "io", n: "스케줄", ty: "[매일 01:00]", d: ["어제 분 대사"]},
    {id: "tech", c: 1, r: 1, k: "tech", n: "대사 배치", ty: "[T10 · 주기적 전수 비교]", d: ["ItemReader", "양쪽 읽기"]},
    {id: "odb", c: 1, r: 0, k: "kg", n: "주문 DB", ty: "[orders]", d: ["기대 차감량"]},
    {id: "idb", c: 1, r: 2, k: "kg", n: "재고 DB", ty: "[stock_history]", d: ["실제 차감 이력"]},
    {id: "proc", c: 2, r: 1, k: "llm", n: "비교 · 판정", ty: "[ItemProcessor]", d: ["일치 · 중복", "유실 · 보상 누락"]},
    {id: "res", c: 3, r: 1, k: "store", n: "불일치 목록", ty: "[결과 테이블]", d: ["1001 · 1003 · 1004"]},
    {id: "out", c: 4, r: 1, k: "io", n: "보정 · 알림", ty: "[출력]", d: ["자동 보정", "또는 담당자"]}],
   edges: [{f: "sch", t: "tech", n: 1}, {f: "tech", t: "odb", n: 2, both: 1}, {f: "tech", t: "idb", n: 3, both: 1}, {f: "tech", t: "proc", n: 4}, {f: "proc", t: "res", n: 5}, {f: "res", t: "out", n: 6}],
   steps: ["매일 정해진 시각에 배치를 시작한다",
    "주문 DB 에서 기간 안 주문과 기대 차감량을 읽는다",
    "재고 DB 에서 같은 기간의 차감 이력을 읽는다",
    "주문 단위로 맞춰 일치 · 중복 · 유실 · 보상 누락을 판정한다",
    "불일치 행을 결과 테이블에 쓴다",
    "규칙이 정해진 것은 자동 보정하고, 나머지는 담당자에게 알린다"],
   offNote: "재고 변경 이력(어떤 주문으로 얼마나)을 남기도록 해 둔다. 이력이 없으면 비교할 수 없다."}
 },
 ],

 sources: [
  {key: "Spring Framework", title: "Spring Framework Reference — Transaction Management",
   links: [["Transaction-bound Events", "https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html"], ["Transaction Strategies (JTA)", "https://docs.spring.io/spring-framework/reference/data-access/transaction/strategies.html"]],
   meta: [["종류", "공식 문서"]],
   problemShort: "선언적 트랜잭션과 트랜잭션 단계에 묶인 리스너",
   problem: "선언적 트랜잭션과 트랜잭션 단계에 묶인 이벤트 리스너를 제공한다. 서비스 사이의 일관성 자체는 다루지 않는다.",
   core: ["@Transactional — 메서드 단위 로컬 트랜잭션 경계", "@TransactionalEventListener — 커밋 · 롤백 등 트랜잭션 단계에 맞춰 리스너를 실행한다. 기본은 AFTER_COMMIT", "JtaTransactionManager — 외부 JTA 관리자에 위임해 여러 리소스를 한 트랜잭션으로 묶는다"],
   limits: ["커밋 뒤 리스너의 실패는 이미 커밋된 트랜잭션에 영향을 주지 않는다. 발행 보장은 별도 장치가 필요하다", "JTA 는 외부 트랜잭션 관리자와 XA 리소스를 전제한다"]},
  {key: "Spring Modulith", title: "Spring Modulith Reference — Working with Application Events",
   links: [["문서", "https://docs.spring.io/spring-modulith/reference/events.html"]],
   meta: [["종류", "공식 문서"]],
   problemShort: "트랜잭션 이벤트 리스너의 실패 · 유실",
   problem: "커밋 뒤에 실행되는 이벤트 리스너가 실패하거나 프로세스가 죽으면 이벤트가 사라진다. 이를 발행 기록으로 막는다.",
   core: ["Event Publication Registry — 리스너마다 발행 기록을 원래 트랜잭션 안에서 저장하고, 성공하면 완료로 표시한다", "재발행 — 미완료 기록을 재시작 때(설정) 또는 API 로 다시 제출한다", "이벤트 외부화 — @Externalized 로 Kafka · AMQP 등 브로커에 내보낸다", "2.0 발행 수명주기 — 처리 중 · 완료 · 실패를 나누고 오래 멈춘 발행을 실패로 표시한다"],
   limits: ["완료 기록은 정리 · 보관해야 한다", "리스너가 다시 실행될 수 있어 멱등해야 한다 ‡"]},
  {key: "Spring Kafka", title: "Spring for Apache Kafka Reference — Handling Exceptions",
   links: [["문서", "https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html"]],
   meta: [["종류", "공식 문서"]],
   problemShort: "소비자 처리 실패의 재시도와 격리",
   problem: "리스너 처리가 실패한 레코드를 어떻게 다시 시도하고, 끝까지 실패하면 어디로 보낼지 정한다.",
   core: ["DefaultErrorHandler — BackOff 에 따라 재전달하고, 끝나면 recoverer 를 부른다", "DeadLetterPublishingRecoverer — 실패 레코드를 예외 정보 헤더와 함께 DLT 로 발행한다", "@RetryableTopic — 재시도 토픽을 거치는 논블로킹 재시도"],
   limits: ["블로킹 재시도 동안 그 파티션 처리가 멈춘다", "DLT 이후의 처리는 애플리케이션이 정한다"]},
  {key: "Spring Batch", title: "Spring Batch Reference — Chunk-oriented Processing",
   links: [["문서", "https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing.html"]],
   meta: [["종류", "공식 문서"]],
   problemShort: "대량 데이터의 읽기 · 처리 · 쓰기와 재시작",
   problem: "대량 데이터를 chunk 단위로 읽고 처리해 쓰며, 실패한 Job 을 이어서 다시 실행한다.",
   core: ["Job · Step — 배치 작업의 단위", "Chunk 처리 — ItemReader → ItemProcessor → ItemWriter", "JobRepository — 실행 기록으로 재시작 지점을 정한다"],
   limits: ["비교 · 보정 규칙은 제공하지 않는다. 대사 로직은 업무마다 쓴다"]},
  {key: "microservices.io", title: "Chris Richardson — Microservice Architecture patterns",
   links: [["Saga", "https://microservices.io/patterns/data/saga.html"], ["Transactional outbox", "https://microservices.io/patterns/data/transactional-outbox.html"], ["Idempotent Consumer", "https://microservices.io/patterns/communication-style/idempotent-consumer.html"]],
   meta: [["종류", "패턴 카탈로그"]],
   problemShort: "서비스마다 DB 를 가진 구조의 트랜잭션 · 메시징",
   problem: "서비스마다 DB 를 가진 구조에서 서비스를 넘나드는 비즈니스 트랜잭션과 신뢰할 수 있는 메시징을 어떻게 구현할지 패턴으로 정리한다.",
   core: ["Saga — 로컬 트랜잭션의 연속과 보상, choreography · orchestration", "Transactional outbox — 같은 트랜잭션에 메시지 기록", "Polling publisher · Transaction log tailing — outbox 릴레이", "Idempotent consumer — 처리 id 기록으로 중복 무해화"],
   claim: "서비스마다 DB 를 가진 구조에서는 2PC 를 쓸 수 없으므로 Saga 와 outbox 로 대신한다.",
   limits: ["Saga 에는 격리(ACID 의 I)가 없어 대응책 설계가 필요하다", "outbox 릴레이는 같은 메시지를 두 번 이상 보낼 수 있어 소비자가 멱등해야 한다"]},
  {key: "Debezium", title: "Debezium Reference — Outbox Event Router",
   links: [["문서", "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html"]],
   meta: [["종류", "공식 문서"]],
   problemShort: "outbox 테이블을 CDC 로 브로커에 옮기기",
   problem: "outbox 테이블에 기록된 이벤트를 DB 트랜잭션 로그에서 읽어 Kafka 로 보낸다. 서비스 코드에 발행 로직이 필요 없다.",
   core: ["CDC 커넥터 — MySQL binlog · Postgres WAL 등 커밋 로그를 읽는다", "Outbox Event Router — aggregatetype 으로 토픽, aggregateid 로 키를 정하는 변환(SMT)"],
   limits: ["Kafka Connect 와 커넥터를 운영해야 한다", "최소 한 번 전달이라 소비자가 멱등해야 한다"]},
  {key: "Sagas (1987)", title: "H. Garcia-Molina, K. Salem. Sagas. ACM SIGMOD 1987",
   meta: [["종류", "논문"]],
   problemShort: "긴 트랜잭션이 자원을 오래 잠근다",
   problem: "오래 걸리는 트랜잭션(LLT)이 자원을 오래 잠가 다른 트랜잭션을 막는다.",
   core: ["saga — 다른 트랜잭션과 끼어 실행될 수 있는 하위 트랜잭션 T1…Tn 의 연속", "보상 트랜잭션 — Ti 의 효과를 의미상 되돌리는 Ci. 실패 시 이미 실행된 것의 보상을 역순으로 실행한다"],
   claim: "LLT 를 saga 로 쓰면 전체가 완료되거나 보상으로 부분 실행이 되돌려져, 긴 잠금 없이 일관성을 유지한다.",
   limits: ["보상은 의미상 되돌림이라 원래 상태로 돌아간다는 보장은 없다", "하위 트랜잭션 사이에 다른 트랜잭션이 중간 상태를 본다"]},
 ],

 glossary: [
  ["개입 지점", [
   ["생산 쪽 · 커밋 안", "이벤트를 만드는 서비스의 트랜잭션 코드 안에서 작동한다", "이 페이지 기준"],
   ["전달 경로", "비즈니스 코드 밖에서 메시지를 옮기고 다시 보내는 릴레이 · 리스너 컨테이너", "이 페이지 기준"],
   ["소비 쪽 · 사후", "받는 서비스의 처리 로직, 또는 흐름 전체를 되돌리거나 사후에 비교하는 쪽", "이 페이지 기준"],
   ["판정 기준 (이 페이지)", "주문 이벤트가 생산 서비스의 커밋에서 소비 서비스의 반영까지 가는 경로 중 어디서 작동하는가. 두 곳에 걸치면 복수 표시", "Claude 제안 — 기법을 한 경로 위에 놓기 위한 기준"]]],
  ["실패 종류", [
   ["이벤트 유실", "변경은 커밋됐는데 그 이벤트가 소비자에게 끝내 가지 않는 상태", "microservices.io (outbox)"],
   ["유령 이벤트", "롤백된 변경의 이벤트가 이미 나가 소비자가 반영한 상태", "이 페이지 작명 *"],
   ["중복 처리", "같은 메시지가 두 번 이상 전달 · 처리되어 효과가 겹친 상태", "microservices.io (idempotent consumer)"],
   ["중간 단계 실패", "여러 서비스에 걸친 흐름에서 앞 단계는 커밋되고 뒤 단계가 실패한 상태", "microservices.io (saga)"],
   ["독 메시지 (poison message)", "몇 번을 다시 처리해도 실패하는 메시지. 뒤 메시지까지 막는다", "Spring Kafka 문서"]]],
  ["용어", [
   ["로컬 트랜잭션", "한 서비스가 자기 DB 하나에 거는 트랜잭션", "microservices.io"],
   ["2PC · XA", "코디네이터가 모든 참가 리소스에 prepare 를 물은 뒤 commit 을 지시하는 분산 커밋 규약. XA 는 그 표준 인터페이스", "Spring Framework (JTA)"],
   ["outbox", "보낼 메시지를 비즈니스 변경과 같은 트랜잭션으로 적어 두는 테이블", "microservices.io"],
   ["CDC", "Change Data Capture. DB 커밋 로그를 읽어 변경을 이벤트로 내보내는 방식", "Debezium"],
   ["최소 한 번 전달 (at-least-once)", "메시지가 사라지지는 않지만 두 번 이상 올 수 있는 전달 보장", "일반 용어"],
   ["멱등 (idempotent)", "같은 작업을 여러 번 해도 한 번 한 것과 결과가 같은 성질", "microservices.io"],
   ["보상 트랜잭션", "이미 커밋된 단계의 효과를 업무 의미상 되돌리는 트랜잭션 (환불, 주문 거절)", "Sagas (1987)"],
   ["최종 일관성", "잠시 어긋나도 추가 장애가 없으면 결국 일치하는 성질", "일반 용어"],
   ["DLT", "Dead Letter Topic. 끝까지 처리하지 못한 메시지를 옮겨 두는 토픽", "Spring Kafka 문서"],
   ["대사 (reconciliation)", "두 장부를 맞대어 차이를 찾는 작업", "정산 · 결제 영역 관행"]]],
 ],

 footer: "<div>근거 — <a href=\"https://docs.spring.io/spring-framework/reference/data-access/transaction.html\" target=\"_blank\" rel=\"noopener\">Spring Framework</a> · <a href=\"https://docs.spring.io/spring-modulith/reference/events.html\" target=\"_blank\" rel=\"noopener\">Spring Modulith</a> · <a href=\"https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html\" target=\"_blank\" rel=\"noopener\">Spring for Apache Kafka</a> · <a href=\"https://docs.spring.io/spring-batch/reference/\" target=\"_blank\" rel=\"noopener\">Spring Batch</a> 공식 문서, <a href=\"https://microservices.io/patterns/\" target=\"_blank\" rel=\"noopener\">microservices.io</a> 패턴, <a href=\"https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html\" target=\"_blank\" rel=\"noopener\">Debezium</a>, Garcia-Molina &amp; Salem (1987)</div><div>기법 분류(T1–T10)와 판정은 Claude 가 제안한 것이며 확립된 분류가 아니다. ‡ 는 문서에서 확인하지 않은 추론, * 는 문서에 없는 작명이다. 서비스 · 테이블 · 토픽 이름과 코드는 설명용이다. method-atlas 스킬의 두 번째 예시.</div>",
};
