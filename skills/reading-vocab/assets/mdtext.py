#!/usr/bin/env python3
"""Markdown 원문(책 장 · 웹 클리핑 · Obsidian 노트) → 앵커 달린 평문

    python3 mdtext.py "6. Evaluating Multi-Turn Conversations.md" > papers/<key>/study/ch06.txt
    python3 mdtext.py chapter.md --unit ch06      # 앵커 접두어를 직접 정한다

쪽 번호가 없으므로 앵커는 가장 가까운 제목이다. 제목마다 `[[ch06 §Session Level]]` 한 줄을
넣는다. 접두어는 파일 이름 앞 숫자에서 만든다(`6. ...md` → ch06). 숫자가 없으면 접두어 없이
`[[§제목]]` 이다.

없애는 것: frontmatter, 코드 블록(`[code]` 한 줄로), 이미지와 그 뒤에 반복된 캡션, 링크 주소,
강조 기호, HTML 태그, 각주 참조 표시. 수식은 `[math]` 로 바꾼다. 각주 본문은 `[[<unit> §Notes]]` 아래에 남긴다.
첫 제목 앞의 본문은 frontmatter `title` 로 앵커를 단다.
Note · Tip · Warning 제목은 앵커를 바꾸지 않고, `Example 6-1. ...` 같은 긴 제목은
`Example 6-1` 로 줄인다. 예문을 grep 으로 대조할 수 있게 문단은 한 줄로 이어 붙인다.
"""
import argparse, re, sys
from pathlib import Path


ADMONITIONS = {"note", "tip", "warning", "caution", "important"}


def inline(s):
    s = re.sub(r"\$\$.*?\$\$", "[math]", s)                       # 수식 (금액 $100 은 남긴다)
    s = re.sub(r"\$[^$]*\\[^$]*\$", "[math]", s)
    s = re.sub(r"\\([\\`*_\[\]()#+.!|~-])", r"\1", s)       # 마크다운 이스케이프 \` → `
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)                  # 이미지
    s = re.sub(r"!\[\[[^\]]*\]\]", "", s)                        # Obsidian 임베드
    s = re.sub(r"\[\[([^\]|]*\|)?([^\]]*)\]\]", r"\2", s)        # [[a|b]] → b
    s = re.sub(r"\[\^[^\]]+\](?!:)", "", s)                      # 각주 참조
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)               # [text](url) → text
    s = re.sub(r"<[^>]+>", "", s)                                # HTML 태그
    s = re.sub(r"(\*\*|__|\*|`)", "", s)                         # 강조 · 인라인 코드 표시
    s = re.sub(r"(?<!\w)_([^_]+)_(?!\w)", r"\1", s)
    return " ".join(s.split())


def convert(text, unit):
    fm = re.match(r"\A---\n(.*?)\n---\n", text, flags=re.S)
    doc_title = re.search(r'^title:\s*"?(?:\d+\.\s*)?(.*?)"?\s*$', fm.group(1), flags=re.M) if fm else None
    text = text[fm.end():] if fm else text                      # frontmatter
    pre = f"{unit} " if unit else ""
    out, para, notes, fence, alt = [], [], [], None, None

    def flush():
        if para:
            line = inline(" ".join(para))
            if line:
                out.append(line)
            para.clear()

    for raw in text.splitlines():
        line = raw.rstrip()
        m = re.match(r"\s*(```+|~~~+)", line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            continue
        if m:
            flush(); out.append("[code]"); fence = m.group(1); continue
        h = re.match(r"#{1,6}\s+(.*)", line)
        if h:
            flush()
            title = inline(h.group(1))
            if title.lower() in ADMONITIONS:
                continue                                          # Note · Tip 은 앞 절에 붙인다
            short = re.match(r"(Example|Figure|Table) [\d.-]*\d", title)
            out.append(f"\n[[{pre}§{short.group(0) if short else title}]]")
            continue
        img = re.match(r"\s*!\[([^\]]*)\]\(", line)
        if img:
            flush(); alt = " ".join(img.group(1).split()); continue
        if alt and " ".join(line.split()) == alt:
            continue                                              # 이미지 바로 뒤에 반복된 캡션
        if line.strip():
            alt = None
        fn = re.match(r"\[\^[^\]]+\]:\s*(.*)", line)
        if fn:
            flush(); notes.append(inline(fn.group(1))); continue
        stripped = re.sub(r"^\s*(>\s?)+", "", line)              # 인용 · callout
        stripped = re.sub(r"^\s*([-*+]|\d+\.)\s+", "", stripped)  # 목록 표시
        if re.match(r"\s*\[!\w+\]", stripped) or re.fullmatch(r"\s*\|?[-:| ]+\|?\s*", stripped):
            continue                                              # callout 머리 · 표 구분줄
        if not stripped.strip():
            flush(); continue
        if re.match(r"^\s*([-*+]|\d+\.)\s+", line):
            flush()                                               # 목록 항목은 각자 한 줄
        para.append(stripped.replace("|", " "))
    flush()
    if out and not out[0].lstrip().startswith("[["):            # 첫 제목 앞 본문에도 앵커를 단다
        out.insert(0, f"[[{pre}§{doc_title.group(1) if doc_title else 'Start'}]]")
    if notes:
        out.append(f"\n[[{pre}§Notes]]")
        out.extend(notes)
    return "\n".join(out).strip() + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("md", type=Path)
    ap.add_argument("--unit", help="앵커 접두어 (기본: 파일 이름 앞 숫자 → chNN)")
    a = ap.parse_args()
    unit = a.unit
    if unit is None:
        m = re.match(r"(\d+)\b", a.md.name)
        unit = f"ch{int(m.group(1)):02d}" if m else ""
    sys.stdout.write(convert(a.md.read_text(encoding="utf-8"), unit))


if __name__ == "__main__":
    main()
