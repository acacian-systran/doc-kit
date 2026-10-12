/* 사이트의 목차. 미니맵 · 흐름도 · 이전/다음 · 위치 표시줄이 모두 여기서 만들어진다.
 * 섹션을 추가·삭제·합칠 때는 이 파일만 고치고 check.py 를 다시 돌린다. */
window.PAPER = {
  title: "Attention Is All You Need",            // 논문 원제
  short: "Transformer 해설",                     // 미니맵 머리와 모바일 바에 쓰는 짧은 이름
  citekey: "vaswani-2017-attention",
  source: "arXiv:1706.03762",
  home: "index.html",

  // Overview 흐름도의 단계. 4~7개. 논문 목차가 아니라 논증의 흐름이다.
  stages: [
    { id: "problem",  label: "문제",        summary: "순환 구조는 병렬화가 어렵고 먼 위치 사이의 의존을 배우기 어렵다." },
    { id: "method",   label: "제안 방법",   summary: "순환·합성곱 없이 attention 만으로 encoder-decoder 를 만든다." },
    { id: "results",  label: "실험",        summary: "WMT 번역에서 더 적은 학습 비용으로 더 높은 BLEU." },
    { id: "wrap",     label: "결론",        summary: "다른 모달리티로의 확장을 과제로 남긴다." }
  ],

  // 읽는 순서대로. id 의 점 개수가 깊이다 (3 → 챕터, 3.2 → 하위 챕터).
  // q: 이 섹션이 답하는 질문 / anchor: 원문 위치 / merged: 합친 하위 챕터
  sections: [
    { id: "1",   title: "Introduction",                 file: "s1.html",   stage: "problem", anchor: "§1, p.1-2" },
    { id: "3",   title: "Model Architecture",           file: "s3.html",   stage: "method",  anchor: "§3, p.2-3" },
    { id: "3.1", title: "Encoder and Decoder Stacks",   file: "s3-1.html", stage: "method",  anchor: "§3.1, p.3" },
    { id: "3.2", title: "Attention",                    file: "s3-2.html", stage: "method",  anchor: "§3.2, p.3-5", merged: ["3.2.1", "3.2.2", "3.2.3"] },
    { id: "6",   title: "Results",                      file: "s6.html",   stage: "results", anchor: "§6, p.8-9" },
    { id: "7",   title: "Conclusion",                   file: "s7.html",   stage: "wrap",    anchor: "§7, p.10" }
  ]
};
