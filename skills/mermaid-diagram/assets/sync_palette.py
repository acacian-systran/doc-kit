#!/usr/bin/env python3
"""_palette.mmd 의 classDef 블록을 .mmd 파일들에 뿌린다.

    sync_palette.py docs/diagrams/_palette.mmd docs/diagrams/**/*.mmd
    sync_palette.py --check ...   # 다르면 exit 1 (CI 용)

각 그림의 `%% palette:begin` ~ `%% palette:end` 사이를 팔레트의 같은 구간으로
교체한다. 마커가 없는 그림은 건너뛰고 이름을 출력한다 — 마커를 손으로 넣어야
한다. Mermaid 에 import 가 없어서 생긴 우회다.
"""
import re
import sys
from pathlib import Path

BEGIN, END = "%% palette:begin", "%% palette:end"
RX = re.compile(rf"^([ \t]*){re.escape(BEGIN)}[^\n]*\n.*?^[ \t]*{re.escape(END)}[^\n]*$",
                re.S | re.M)


def block(text: str) -> str:
    m = RX.search(text)
    if not m:
        sys.exit("팔레트 파일에 palette:begin/end 마커가 없다")
    return m.group(0)


def main(argv):
    check = "--check" in argv
    args = [a for a in argv if a != "--check"]
    if len(args) < 2:
        sys.exit(__doc__)
    palette = block(Path(args[0]).read_text(encoding="utf-8"))
    # 그림 쪽 들여쓰기를 따르지 않고 팔레트 그대로 넣는다 — mermaid 는 들여쓰기에 무심하다.
    changed, skipped = [], []
    for p in map(Path, args[1:]):
        if p.name.startswith("_"):
            continue
        src = p.read_text(encoding="utf-8")
        if not RX.search(src):
            skipped.append(p)
            continue
        new = RX.sub(lambda _: palette, src, count=1)
        if new != src:
            changed.append(p)
            if not check:
                p.write_text(new, encoding="utf-8")
    for p in skipped:
        print(f"! 마커 없음: {p}")
    for p in changed:
        print(("≠ " if check else "~ ") + str(p))
    if check and changed:
        sys.exit(1)
    if not changed and not skipped:
        print("= 모두 최신")


if __name__ == "__main__":
    main(sys.argv[1:])
