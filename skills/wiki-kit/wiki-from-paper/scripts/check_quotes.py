#!/usr/bin/env python3
"""Check that every quote a paper-wiki node cites is really on the page it names.

    python3 check_quotes.py <wiki root>                 # every node
    python3 check_quotes.py <wiki root> <node.md> ...   # only these files

A node's `## 원문` section lists its quotes, one per line:

    - [p.5] "exact words copied from paper.txt"
    - [p.5–6] "a quote that runs over a page break"

Figure label files (`그림/*-labels.md`) are checked too: rows of the `## 원문 확인`
table look like `| p.5 | exact words |`.

The paper text is `sources` in wiki.config.md (a paper.txt from paper-tutor's
pdftext.py, pages marked `[[p.N]]`). Matching ignores case, whitespace, line-break
hyphens and ligatures, nothing else. Standard library only, no LLM calls.
Exit 1 if any quote is missing or a node has no quotes.
"""
import re
import sys
import unicodedata
from pathlib import Path


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)          # line-break hyphen
    s = s.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    s = s.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    return re.sub(r"\s+", " ", s).strip().lower()


def frontmatter(text: str) -> dict:
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    if not m:
        return {}
    return {k.strip(): v.strip() for k, _, v in (l.partition(":") for l in m.group(1).splitlines()) if v}


def pages(paper: Path) -> dict:
    parts = re.split(r"\[\[p\.(\d+)\]\]", paper.read_text(encoding="utf-8"))
    return {int(parts[i]): norm(parts[i + 1]) for i in range(1, len(parts) - 1, 2)}


def page_range(spec: str) -> list:
    nums = [int(n) for n in re.split(r"[–-]", spec)]
    return list(range(nums[0], nums[-1] + 1))


NODE_Q = re.compile(r'^\s*[-*]\s*\[p\.(\d+(?:[–-]\d+)?)\]\s*"(.+)"\s*$', re.M)
LABEL_Q = re.compile(r"^\|\s*p\.(\d+(?:[–-]\d+)?)\s*\|\s*(.+?)\s*\|\s*$", re.M)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    root = Path(sys.argv[1]).resolve()
    cfg = frontmatter((root / "wiki.config.md").read_text(encoding="utf-8"))
    paper = (root / cfg.get("sources", "../study/paper.txt")).resolve()
    if not paper.exists():
        print(f"ERROR paper text not found: {paper}")
        return 1
    text = pages(paper)
    types = [t.strip() for t in cfg.get("node_types", "").split(",") if t.strip()]

    if len(sys.argv) > 2:
        files = [Path(f).resolve() for f in sys.argv[2:]]
    else:
        files = sorted(p for t in types if (root / t).is_dir() for p in (root / t).rglob("*.md"))
        files += sorted((root / "그림").glob("*-labels.md")) if (root / "그림").is_dir() else []

    bad = total = 0
    for f in files:
        body = f.read_text(encoding="utf-8")
        is_label = f.name.endswith("-labels.md")
        if is_label:
            sect = body.partition("## 원문 확인")[2]
            quotes = LABEL_Q.findall(sect)
        else:
            sect = re.split(r"^## 원문\s*$", body, flags=re.M)
            quotes = NODE_Q.findall(sect[1]) if len(sect) > 1 else []
            if frontmatter(body).get("type") == "헷갈린-점" and not quotes:
                continue  # 사용자 질문 노드는 원문 인용이 없을 수 있음
        rel = f.relative_to(root) if f.is_relative_to(root) else f
        if not quotes:
            print(f"ERROR {rel}: no quotes in '## 원문'" + (" 확인" if is_label else ""))
            bad += 1
            continue
        for spec, q in quotes:
            total += 1
            ps = page_range(spec)
            hay = " ".join(text.get(p, "") for p in ps)
            if norm(q) not in hay:
                near = [p for p, t in text.items() if norm(q) in t]
                hint = f" (found on p.{near[0]})" if near else ""
                print(f"ERROR {rel}: p.{spec} missing quote{hint}: {q[:90]}")
                bad += 1
    print(f"{'FAIL' if bad else 'OK'}: {len(files)} files, {total} quotes, {bad} problems")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
