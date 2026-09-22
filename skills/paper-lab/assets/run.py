#!/usr/bin/env python3
"""run 디렉터리를 만들고 실행 조건을 스냅샷으로 남긴다.

    python run.py --tag baseline --config configs/tiny.yaml --seeds 0,1,2 \
        -- uv run python -m src.eval --config configs/tiny.yaml

시드마다 runs/<날짜>-<태그>-s<시드>/ 를 만들고 env.json · config 사본 · stdout.log 를
남긴다. 실행 대상에는 RUN_DIR·SEED 환경변수와 `--seed <n>` 인자가 전달되며, 대상
스크립트가 그 디렉터리에 metrics.json 을 기재한다.

기존 디렉터리를 덮어쓰지 않는다 — 이름이 겹치면 -2, -3 을 붙인다.
"""
import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

SECRET_HINTS = ("KEY", "TOKEN", "SECRET", "PASSWORD", "CREDENTIAL", "COOKIE")
MODEL_HINTS = ("MODEL", "API_BASE", "BASE_URL", "ENDPOINT", "DEPLOYMENT", "PROVIDER")


def sh(cmd):
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        return out.stdout.strip() if out.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def git_info():
    return {
        "commit": sh(["git", "rev-parse", "HEAD"]),
        "branch": sh(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
        "dirty": bool(sh(["git", "status", "--porcelain"])),
    }


def packages():
    try:
        from importlib.metadata import distributions
    except ImportError:
        return None
    out = {}
    for d in distributions():
        name = d.metadata.get("Name")
        if name:
            out[name] = d.version
    return dict(sorted(out.items()))


def model_env():
    """모델·endpoint 관련 환경변수만 남긴다. 자격증명은 이름도 값도 남기지 않는다."""
    out = {}
    for k, v in os.environ.items():
        up = k.upper()
        if any(h in up for h in SECRET_HINTS):
            continue
        if any(h in up for h in MODEL_HINTS):
            out[k] = v
    return out


def make_dir(runs_dir, tag, seed):
    base = f"{date.today().isoformat()}-{tag}-s{seed}"
    path = runs_dir / base
    n = 2
    while path.exists():
        path = runs_dir / f"{base}-{n}"
        n += 1
    path.mkdir(parents=True)
    return path


def one_run(args, cmd, seed):
    run_dir = make_dir(Path(args.runs_dir), args.tag, seed)
    snap = {
        "tag": args.tag,
        "seed": seed,
        "run_dir": str(run_dir),
        "cwd": os.getcwd(),
        "cmd": cmd,
        "started": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "git": git_info(),
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "model_env": model_env(),
        "packages": packages(),
        "note": args.note,
    }
    if args.config:
        src = Path(args.config)
        if not src.is_file():
            sys.exit(f"설정 파일이 없다: {src}")
        shutil.copy2(src, run_dir / f"config{src.suffix or '.txt'}")
        snap["config"] = str(src)

    (run_dir / "env.json").write_text(json.dumps(snap, ensure_ascii=False, indent=2))
    print(f"[run] {run_dir}", flush=True)

    full = list(cmd) + ([] if args.no_seed_flag else ["--seed", str(seed)])
    env = dict(os.environ, RUN_DIR=str(run_dir.resolve()), SEED=str(seed))

    if args.dry_run:
        print("[run] dry-run:", " ".join(full))
        return 0

    t0 = time.time()
    log = (run_dir / "stdout.log").open("w")
    proc = subprocess.Popen(full, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, bufsize=1, env=env)
    for line in proc.stdout:
        sys.stdout.write(line)
        log.write(line)
    proc.wait()
    log.close()

    snap.update(finished=time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                duration_s=round(time.time() - t0, 1),
                exit_code=proc.returncode)
    (run_dir / "env.json").write_text(json.dumps(snap, ensure_ascii=False, indent=2))

    if proc.returncode != 0:
        print(f"[run] 종료코드 {proc.returncode} — 폐기 사유를 report.md 에 기재한다")
    elif not (run_dir / "metrics.json").is_file():
        print("[run] metrics.json 이 없다 — 대상 스크립트가 $RUN_DIR 에 기재해야 한다")
    return proc.returncode


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tag", required=True, help="run 태그. baseline · abl-<요소> · xabl-<요소> · gap-D<n>-revert")
    ap.add_argument("--config", help="스냅샷으로 복사할 설정 파일")
    ap.add_argument("--seeds", default="0", help="쉼표로 구분. 기본 0")
    ap.add_argument("--runs-dir", default="runs")
    ap.add_argument("--note", help="한 줄 메모. env.json 에 남는다")
    ap.add_argument("--no-seed-flag", action="store_true",
                    help="`--seed <n>` 을 명령에 붙이지 않는다. SEED 환경변수는 그대로 전달된다")
    ap.add_argument("--dry-run", action="store_true")
    args, rest = ap.parse_known_args()

    if "--" in sys.argv:
        cmd = sys.argv[sys.argv.index("--") + 1:]
    else:
        cmd = rest
    if not cmd:
        sys.exit("실행할 명령이 없다. `-- <명령>` 으로 전달한다")

    seeds = [s.strip() for s in args.seeds.split(",") if s.strip()]
    worst = 0
    for s in seeds:
        rc = one_run(args, cmd, s)
        worst = worst or rc
    return worst


if __name__ == "__main__":
    sys.exit(main())
