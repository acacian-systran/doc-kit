#!/usr/bin/env python3
"""논문 PDF에서 쪽 앵커가 붙은 텍스트를 뽑는다.

    python3 pdftext.py paper.pdf                 # paper.txt 생성
    python3 pdftext.py paper.pdf --pages 3-8     # paper.p3-8.txt
    python3 pdftext.py paper.pdf --pages 8 --layout  # paper.p8.layout.txt (표 전용)
    python3 pdftext.py paper.pdf --info          # 쪽수·쪽당 글자수·스캔 여부만

각 쪽 앞에 `[[p.N]]` 을 넣는다. 요약 노트의 앵커(§4.2, p.7)를 지어내지 않고
실제 쪽에서 가져오게 하려는 것이다.

poppler 의 pdftotext 를 쓰고, 없으면 pypdf 로 넘어간다.
둘 다 없으면 설치 방법을 안내하고 exit 1.
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

SCAN_THRESHOLD = 120  # 쪽당 글자수가 이보다 적으면 스캔본으로 의심


def page_count(pdf: Path) -> int:
    if shutil.which("pdfinfo"):
        out = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
        m = re.search(r"^Pages:\s+(\d+)", out, re.M)
        if m:
            return int(m.group(1))
    try:
        from pypdf import PdfReader
        return len(PdfReader(str(pdf)).pages)
    except Exception:
        return 0


def extract_poppler(pdf: Path, first: int, last: int, layout: bool) -> list[str]:
    pages = []
    for n in range(first, last + 1):
        cmd = ["pdftotext", "-f", str(n), "-l", str(n), "-enc", "UTF-8"]
        if layout:
            cmd.append("-layout")
        cmd += [str(pdf), "-"]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"pdftotext 실패 (p.{n}): {r.stderr.strip()}")
        pages.append(r.stdout.replace("\f", "").rstrip())
    return pages


def extract_pypdf(pdf: Path, first: int, last: int) -> list[str]:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf))
    return [(reader.pages[n - 1].extract_text() or "").rstrip() for n in range(first, last + 1)]


def default_out(pdf: Path, first: int, last: int, total: int, layout: bool) -> Path:
    """부분 추출은 파일명을 달리한다. 표 쪽만 다시 뽑다가 전체 추출본을 덮는 사고를 막는다."""
    parts = []
    if not (first == 1 and last == (total or last)):
        parts.append(f"p{first}" if first == last else f"p{first}-{last}")
    if layout:
        parts.append("layout")
    return pdf.with_suffix("." + ".".join(parts) + ".txt") if parts else pdf.with_suffix(".txt")


def main() -> None:
    ap = argparse.ArgumentParser(description="PDF → 쪽 앵커가 붙은 텍스트")
    ap.add_argument("pdf", type=Path)
    ap.add_argument("-o", "--out", type=Path,
                    help="기본값은 <pdf이름>[.pN][.layout].txt, '-' 는 표준출력")
    ap.add_argument("--pages", help="예: 3-8 또는 5")
    ap.add_argument("--layout", action="store_true", help="열 위치를 보존한다. 표를 읽을 때만")
    ap.add_argument("--info", action="store_true", help="추출하지 않고 진단만 낸다")
    a = ap.parse_args()

    if not a.pdf.exists():
        sys.exit(f"없는 파일: {a.pdf}")

    total = page_count(a.pdf)
    first, last = 1, total or 1
    if a.pages:
        m = re.fullmatch(r"(\d+)(?:-(\d+))?", a.pages.strip())
        if not m:
            sys.exit("--pages 는 3-8 또는 5 형식이다")
        first = int(m.group(1))
        last = int(m.group(2) or m.group(1))
        if total:
            last = min(last, total)

    have_poppler = bool(shutil.which("pdftotext"))
    if have_poppler:
        pages = extract_poppler(a.pdf, first, last, a.layout)
    else:
        try:
            pages = extract_pypdf(a.pdf, first, last)
        except ImportError:
            sys.exit("pdftotext 도 pypdf 도 없다. `brew install poppler` 또는 `pip install pypdf`")
        if a.layout:
            print("경고: pypdf 폴백에는 --layout 이 없다. 표는 Read 로 직접 본다.", file=sys.stderr)

    counts = [len(p.strip()) for p in pages]
    thin = [first + i for i, c in enumerate(counts) if c < SCAN_THRESHOLD]

    if a.info:
        print(f"{a.pdf.name}: {total or len(pages)}쪽, 추출 {first}-{last}")
        print(f"글자수 합계 {sum(counts)}, 쪽 평균 {sum(counts) // max(len(counts), 1)}")
        if thin:
            print(f"글자가 거의 없는 쪽: {thin}")
            print("스캔본이거나 그림 전용 쪽이다. 그 쪽은 Read 로 PDF 를 직접 본다.")
        return

    if thin and len(thin) > len(pages) / 2:
        print("경고: 대부분의 쪽에서 글자가 나오지 않는다. 스캔본으로 보인다 — "
              "Read 로 PDF 를 직접 읽는다.", file=sys.stderr)

    body = "\n\n".join(f"[[p.{first + i}]]\n{p}" for i, p in enumerate(pages))
    if a.out and str(a.out) == "-":
        sys.stdout.write(body + "\n")
    else:
        out = a.out or default_out(a.pdf, first, last, total, a.layout)
        out.write_text(body + "\n", encoding="utf-8")
        print(f"{out}  ({first}-{last}쪽, {sum(counts)}자)")


if __name__ == "__main__":
    main()
