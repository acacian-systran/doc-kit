#!/usr/bin/env python3
"""Structural check of a wiki-kit wiki. Standard library only, no LLM calls.

Usage:
    python3 wiki_lint.py <wiki root>             # all nodes
    python3 wiki_lint.py <wiki root> --changed   # nodes changed in git (+ log-missing)

Reads <wiki root>/wiki.config.md frontmatter (index, log, node_types, ignore); works with defaults
when it is missing. Nodes are the .md files inside node_types folders. Prints one line per problem
("LEVEL code file:line: detail") and exits 1 when there is an error.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

DEFAULTS = {"index": "index.md", "log": "log.md", "node_types": "개념, 결정, 결과, 헷갈린-점", "ignore": ""}
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
CODE = re.compile(r"```.*?```|`[^`\n]*`", re.S)


def frontmatter(text: str) -> dict[str, str] | None:
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end < 0:
        return None
    out, key = {}, None
    for line in text[4:end].splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m:
            key = m.group(1)
            out[key] = m.group(2).strip()
        elif key and line.strip().startswith("- "):
            out[key] = (out[key] + ", " if out[key] else "") + line.strip()[2:].strip()
    return out


def split(value: str) -> list[str]:
    value = value.strip().strip("[]")
    return [v.strip().strip("'\"") for v in value.split(",") if v.strip()]


def links(path: Path) -> list[tuple[int, str]]:
    text = CODE.sub(lambda m: "\n" * m.group().count("\n"), path.read_text(encoding="utf-8"))
    out = []
    for n, line in enumerate(text.splitlines(), 1):
        for m in LINK.finditer(line):
            target = m.group(1)
            if re.match(r"^[a-z][a-z0-9+.-]*:", target) or target.startswith("#"):
                continue
            out.append((n, unquote(target.split("#")[0])))
    return out


def git_changed(root: Path) -> set[Path]:
    try:
        top = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], cwd=root, text=True).strip())
        out = subprocess.check_output(["git", "status", "--porcelain", "-z", "--untracked-files=all", "--", "."],
                                      cwd=root, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return set()
    files = set()
    for entry in out.split("\0"):
        if len(entry) > 3:
            files.add((top / entry[3:]).resolve())
    return files


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("--changed", action="store_true")
    args = ap.parse_args()
    root = Path(args.root).resolve()

    cfg = dict(DEFAULTS)
    cfg_file = root / "wiki.config.md"
    if cfg_file.exists():
        cfg.update({k: v for k, v in (frontmatter(cfg_file.read_text(encoding="utf-8")) or {}).items() if v})
    else:
        print(f"note: {cfg_file.name} 없음 — 기본값 사용")
    types = split(cfg["node_types"])
    ignore = set(split(cfg["ignore"]))
    index = root / cfg["index"]
    log = root / cfg["log"]

    def ignored(p: Path) -> bool:
        return any(part in ignore for part in p.relative_to(root).parts)

    nodes = sorted(p for t in types if (root / t).is_dir() for p in (root / t).rglob("*.md") if not ignored(p))
    pages = sorted(p for p in root.rglob("*.md") if not ignored(p) and ".obsidian" not in p.parts)
    changed = git_changed(root) if args.changed else set()
    check = {p for p in nodes if p.resolve() in changed} if args.changed else set(nodes)

    problems: list[tuple[str, str, str]] = []

    def add(level: str, code: str, where: str, detail: str) -> None:
        problems.append((level, code, f"{where}: {detail}"))

    def rel(p: Path) -> str:
        return str(p.relative_to(root))

    inbound: dict[Path, set[Path]] = {p.resolve(): set() for p in nodes}
    for page in pages:
        for n, target in links(page):
            dest = (page.parent / target).resolve()
            if dest in inbound and dest != page.resolve():
                inbound[dest].add(page.resolve())
            if (page in check or page in (index, log) or not args.changed) and target and not dest.exists():
                add("ERROR", "broken-link", f"{rel(page)}:{n}", target)

    for p in sorted(check):
        r = p.resolve()
        fm = frontmatter(p.read_text(encoding="utf-8"))
        folder = p.relative_to(root).parts[0]
        if fm is None:
            add("ERROR", "no-frontmatter", rel(p), "")
        else:
            if fm.get("type", "") != folder:
                add("ERROR", "type-mismatch", rel(p), f"type '{fm.get('type', '')}' ≠ 폴더 '{folder}'")
            if not fm.get("aliases"):
                add("WARN", "no-aliases", rel(p), "")
        if index.exists() and index.resolve() not in inbound[r]:
            add("ERROR", "not-in-index", rel(p), f"{cfg['index']}에 링크 없음")
        if not (inbound[r] - {index.resolve(), log.resolve()}):
            add("WARN", "orphan", rel(p), "index 말고 링크하는 노드 없음")

    if args.changed and check and log.resolve() not in changed:
        add("WARN", "log-missing", cfg["log"], f"노드 {len(check)}개가 바뀌었는데 log 변경 없음")

    for level, code, msg in sorted(problems, key=lambda x: (x[0] != "ERROR", x[1], x[2])):
        print(f"{level} {code} {msg}")
    errors = sum(1 for p in problems if p[0] == "ERROR")
    warns = len(problems) - errors
    scope = f"바뀐 노드 {len(check)}개" if args.changed else f"노드 {len(nodes)}개"
    print(f"— {scope} · 페이지 {len(pages)}개 · 오류 {errors} · 경고 {warns}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
