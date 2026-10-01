#!/usr/bin/env python3
"""아는 단어 관리. papers/ 아래의 공유 파일을 읽고 쓴다.

  papers/level.txt   수준 테스트로 정한 기준 zipf 한 줄 (없으면 5.0)
  papers/known.txt   아는 표제어, 한 줄에 하나
  papers/hard.txt    자주 틀린 표제어. 기준을 넘어도 카드에 넣는다
  papers/stats.csv   term,streak,missed  (Quizlet 결과 누적)

  uv run --with wordfreq python known.py sample                  # 수준 테스트 후보
  uv run --with wordfreq python known.py filter cands.txt        # 후보 중 뺄 것 판정
      --seen papers/<key>/vocab/ch06   책의 다른 장 덱에 이미 있는 표제어도 판정 (drop(seen:ch02))
  python3 known.py update papers/<citekey>/vocab/cards.csv missed.txt   # 학습 결과 반영
  python3 known.py level 4.0                                     # 기준 저장
"""
import argparse, csv, random, re, sys
from pathlib import Path

BANDS = [5.0, 4.5, 4.0, 3.5, 3.0]   # zipf 하한. 5.0 이상 ≈ 최빈 2천 단어
DEFAULT_LEVEL = 5.0                  # 테스트 전 기본값: 기초 단어만 뺀다
KNOWN_STREAK = 2                     # 학습 결과에서 연속 몇 번 맞히면 known


def read_set(p):
    return {l.strip().lower() for l in p.read_text(encoding="utf-8").splitlines() if l.strip()} if p.exists() else set()


def write_set(p, s):
    p.write_text("".join(f"{w}\n" for w in sorted(s)), encoding="utf-8")


def level(papers):
    p = papers / "level.txt"
    return float(p.read_text().strip()) if p.exists() else DEFAULT_LEVEL


def zipf(word):
    from wordfreq import zipf_frequency
    # 구(account for)는 가장 드문 단어 기준
    return min(zipf_frequency(w, "en") for w in word.split())


def cmd_sample(a):
    from wordfreq import top_n_list
    words = [w for w in top_n_list("en", 60000) if re.fullmatch(r"[a-z]{4,}", w)]
    rng = random.Random(a.seed)
    for lo in BANDS:
        hi = lo + 0.5 if lo < 5.0 else 9
        pool = [w for w in words if lo <= zipf(w) < hi]
        print(f"[{lo}] " + " ".join(rng.sample(pool, min(a.n, len(pool)))))


def seen_terms(unit_dir):
    """같은 책의 다른 장 덱(vocab/<unit>/cards.csv)에 있는 표제어 → 장 이름"""
    seen = {}
    me = unit_dir.resolve()
    for p in sorted(me.parent.glob("*/cards.csv")):
        if p.parent == me:
            continue
        with open(p, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                seen.setdefault(r["term"].strip().lower(), p.parent.name)
    return seen


def cmd_filter(a):
    known, hard, lv = read_set(a.papers / "known.txt"), read_set(a.papers / "hard.txt"), level(a.papers)
    seen = seen_terms(a.seen) if a.seen else {}
    print(f"# drop(level): zipf {lv} 이상. W 종류에만 적용한다")
    for line in Path(a.cands).read_text(encoding="utf-8").splitlines():
        w = line.strip().lower()
        if not w:
            continue
        z = zipf(w)
        if w in hard:
            verdict = "keep(hard)"
        elif w in known:
            verdict = "drop(known)"
        elif w in seen:
            verdict = f"drop(seen:{seen[w]})"
        elif z >= lv:
            verdict = "drop(level)"
        else:
            verdict = "keep"
        print(f"{verdict}\t{z:.2f}\t{w}")


def cmd_update(a):
    vocab = next(p for p in Path(a.cards).resolve().parents if p.name == "vocab")
    papers = vocab.parent.parent  # papers/<key>/vocab/[<unit>/]cards.csv
    with open(a.cards, newline="", encoding="utf-8") as f:
        terms = [r["term"].strip().lower() for r in csv.DictReader(f)]
    missed = read_set(Path(a.missed))
    unknown = missed - set(terms)
    if unknown:
        sys.exit(f"cards.csv 에 없는 표제어: {sorted(unknown)}")
    sp = papers / "stats.csv"
    stats = {}
    if sp.exists():
        with open(sp, newline="", encoding="utf-8") as f:
            stats = {r["term"]: r for r in csv.DictReader(f)}
    known, hard = read_set(papers / "known.txt"), read_set(papers / "hard.txt")
    promoted = []
    for t in terms:
        r = stats.setdefault(t, {"term": t, "streak": "0", "missed": "0"})
        if t in missed:
            r["streak"] = "0"
            r["missed"] = str(int(r["missed"]) + 1)
            hard.add(t)
            known.discard(t)
        else:
            r["streak"] = str(int(r["streak"]) + 1)
            if int(r["streak"]) >= KNOWN_STREAK and t not in known:
                known.add(t)
                hard.discard(t)
                promoted.append(t)
    with open(sp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["term", "streak", "missed"])
        w.writeheader()
        w.writerows(sorted(stats.values(), key=lambda r: r["term"]))
    write_set(papers / "known.txt", known)
    write_set(papers / "hard.txt", hard)
    print(f"틀림 {len(missed)} · 맞힘 {len(terms) - len(missed)} · known 으로 이동 {len(promoted)}: {' '.join(promoted)}")


def cmd_level(a):
    a.papers.mkdir(parents=True, exist_ok=True)
    (a.papers / "level.txt").write_text(f"{a.value}\n")
    print(f"기준 zipf {a.value} 저장")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--papers", type=Path, default=Path("papers"))
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sample"); s.add_argument("-n", type=int, default=15); s.add_argument("--seed", type=int)
    s = sub.add_parser("filter"); s.add_argument("cands"); s.add_argument("--seen", type=Path)
    s = sub.add_parser("update"); s.add_argument("cards"); s.add_argument("missed")
    s = sub.add_parser("level"); s.add_argument("value", type=float, choices=BANDS + [9.0])
    a = ap.parse_args()
    {"sample": cmd_sample, "filter": cmd_filter, "update": cmd_update, "level": cmd_level}[a.cmd](a)


if __name__ == "__main__":
    main()
