#!/usr/bin/env python3
"""claims.md 의 논문 수치와 runs/ 의 실측을 대조한 표를 산출한다.

    python compare.py --tag baseline        # 논문 주장과의 대조
    python compare.py --delta baseline      # 태그별 낙폭 (절제 판정용)
    python compare.py --list                # 발견한 run 목록

claims.md 는 `| # | 주장 | 지표 | 논문 수치 | 앵커 | 축소 | 확인 방법 |` 열을 유지해야
한다. `지표` 열의 첫 백틱 토큰이 metrics.json 의 키와 대조된다.

절제 낙폭 주장은 지표 키에 Δ 를 붙인다 — `Δf1`. 이 주장은 --tag 에서 판정되지 않고
--delta 에서 판정되며, `논문 수치` 는 부호를 포함한 변화량으로, `확인 방법` 의 첫 백틱
토큰은 그 절제의 run 태그로 읽는다.

metrics.json 계약:
    {"tag": "baseline", "seed": 0, "metrics": {"f1": 31.52}, "extra": {...}}
tag·seed 가 없으면 같은 디렉터리의 env.json 에서 채운다.
"""
import argparse
import json
import re
import statistics
import sys
from pathlib import Path

NUM = re.compile(r"-?\d+(?:\.\d+)?")


def parse_num(cell):
    """'64.89 (Table 1, p.6)' → 64.89 · '—' → None. 반올림하지 않는다."""
    cell = cell.replace(",", "")
    m = NUM.search(cell)
    return float(m.group()) if m else None


def split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def read_claims(path):
    """claims.md 의 주장 표를 읽는다. 열 이름으로 위치를 찾는다."""
    if not path.is_file():
        return []
    rows, header = [], None
    for line in path.read_text().splitlines():
        if not line.lstrip().startswith("|"):
            header = None
            continue
        cells = split_row(line)
        if header is None:
            if "지표" in cells and "논문 수치" in cells:
                header = {name: i for i, name in enumerate(cells)}
            continue
        if set("".join(cells)) <= set("-: "):
            continue

        def get(name):
            i = header.get(name)
            return cells[i] if i is not None and i < len(cells) else ""

        key = re.search(r"`([^`]+)`", get("지표"))
        rows.append({
            "id": get("#"),
            "claim": get("주장"),
            "metric": key.group(1) if key else None,
            "metric_label": get("지표"),
            "paper": parse_num(get("논문 수치")),
            "paper_raw": get("논문 수치"),
            "anchor": get("앵커"),
            "scale": get("축소"),
            "how": get("확인 방법"),
        })
    return rows


def read_runs(runs_dir):
    runs = []
    for mpath in sorted(Path(runs_dir).glob("*/metrics.json")):
        try:
            m = json.loads(mpath.read_text())
        except json.JSONDecodeError as e:
            print(f"[경고] {mpath} 파싱 실패: {e}", file=sys.stderr)
            continue
        env = {}
        epath = mpath.parent / "env.json"
        if epath.is_file():
            try:
                env = json.loads(epath.read_text())
            except json.JSONDecodeError:
                pass
        runs.append({
            "dir": mpath.parent.name,
            "tag": m.get("tag") or env.get("tag") or "?",
            "seed": m.get("seed", env.get("seed")),
            "metrics": m.get("metrics", {}),
            "exit_code": env.get("exit_code"),
        })
    return runs


def base_metric(m):
    return m.lstrip("Δ") if m else m


def agg(runs, tag, metric):
    metric = base_metric(metric)
    vals = [r["metrics"][metric] for r in runs
            if r["tag"] == tag and isinstance(r["metrics"].get(metric), (int, float))]
    if not vals:
        return None
    mean = statistics.fmean(vals)
    sd = statistics.stdev(vals) if len(vals) > 1 else 0.0
    return mean, sd, len(vals)


def fmt(a):
    if a is None:
        return "미측정"
    mean, sd, n = a
    return f"{mean:.2f} ± {sd:.2f} ({n}시드)" if n > 1 else f"{mean:.2f} (1시드)"


def table(rows):
    if not rows:
        return "(행 없음)"
    head, *body = rows
    out = ["| " + " | ".join(head) + " |", "|" + "|".join(["---"] * len(head)) + "|"]
    out += ["| " + " | ".join(r) + " |" for r in body]
    return "\n".join(out)


def cmd_tag(claims, runs, tag):
    rows = [["#", "주장", "지표", "논문", f"내 수치 ({tag})", "차이", "축소", "앵커"]]
    for c in claims:
        if not c["metric"]:
            rows.append([c["id"], c["claim"], c["metric_label"], c["paper_raw"],
                         "지표 키 없음", "—", c["scale"], c["anchor"]])
            continue
        if c["metric"].startswith("Δ"):
            rows.append([c["id"], c["claim"], f"`{c['metric']}`", c["paper_raw"],
                         "절제 주장 — `--delta` 로 판정", "—", c["scale"], c["anchor"]])
            continue
        a = agg(runs, tag, c["metric"])
        if a is None or c["paper"] is None:
            diff = "—"
        else:
            diff = f"{a[0] - c['paper']:+.2f}"
        rows.append([c["id"], c["claim"], f"`{c['metric']}`", c["paper_raw"],
                     fmt(a), diff, c["scale"], c["anchor"]])
    return table(rows)


def cmd_delta(claims, runs, base):
    metrics = []
    for src in ([base_metric(c["metric"]) for c in claims]
                + [m for r in runs for m in r["metrics"]]):
        if src and src not in metrics:
            metrics.append(src)
    tags = sorted({r["tag"] for r in runs} - {base})
    if not tags:
        return f"기준 태그 `{base}` 외의 run 이 없다"

    rows = [["태그", "지표", f"기준 ({base})", "해당 태그", "차이(pt)"]]
    for t in tags:
        for m in metrics:
            b, a = agg(runs, base, m), agg(runs, t, m)
            if b is None or a is None:
                continue
            rows.append([t, f"`{m}`", fmt(b), fmt(a), f"{a[0] - b[0]:+.2f}"])
    out = ["## 태그별 차이", table(rows)]

    verdict = [["#", "주장", "태그", "논문 변화", "내 변화", "방향", "분산", "앵커"]]
    for c in claims:
        if not c["metric"] or not c["metric"].startswith("Δ"):
            continue
        tag = re.search(r"`([^`]+)`", c["how"] or "")
        tag = tag.group(1) if tag else None
        m = base_metric(c["metric"])
        b = agg(runs, base, m)
        a = agg(runs, tag, m) if tag else None
        if b is None or a is None:
            verdict.append([c["id"], c["claim"], tag or "태그 미기재",
                            c["paper_raw"], "미측정", "—", "—", c["anchor"]])
            continue
        d = a[0] - b[0]
        if c["paper"] is None:
            direction = "논문 수치 없음"
        elif d == 0:
            direction = "변화 없음"
        else:
            direction = "같음" if (d > 0) == (c["paper"] > 0) else "반대"
        spread = 2 * max(b[1], a[1])
        band = "밖" if abs(d) > spread else f"안 (±{spread:.2f})"
        verdict.append([c["id"], c["claim"], tag, c["paper_raw"], f"{d:+.2f}",
                        direction, band, c["anchor"]])
    if len(verdict) > 1:
        out += ["", "## 절제 주장 판정", table(verdict),
                "", "방향이 `같음` 이고 분산이 `밖` 이면 그 주장은 재현된 것으로 판정한다."]
    return "\n".join(out)


def cmd_list(runs):
    rows = [["run", "태그", "시드", "종료코드", "지표"]]
    for r in runs:
        rows.append([r["dir"], r["tag"], str(r["seed"]), str(r["exit_code"]),
                     ", ".join(f"{k}={v}" for k, v in r["metrics"].items()) or "없음"])
    return table(rows)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--claims", default="claims.md")
    ap.add_argument("--runs-dir", default="runs")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--tag", help="논문 수치와 대조할 태그")
    g.add_argument("--delta", metavar="BASE", help="기준 태그. 나머지 태그와의 차이를 낸다")
    g.add_argument("--list", action="store_true", help="run 목록")
    args = ap.parse_args()

    claims = read_claims(Path(args.claims))
    runs = read_runs(args.runs_dir)
    if not runs:
        sys.exit(f"{args.runs_dir}/*/metrics.json 이 없다")

    if args.list:
        print(cmd_list(runs))
    elif args.delta:
        print(cmd_delta(claims, runs, args.delta))
    else:
        if not claims:
            sys.exit(f"{args.claims} 에서 주장 표를 찾지 못하였다 — 열 이름을 확인한다")
        print(cmd_tag(claims, runs, args.tag))


if __name__ == "__main__":
    main()
