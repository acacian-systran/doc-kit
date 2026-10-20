# -*- coding: utf-8 -*-
"""
build.py — 데이터 파일(window.PAGE = {...})과 엔진을 한 장짜리 HTML 로 묶는다.

    python3 <스킬경로>/assets/build.py <data.js> [-o page.html]

출력은 외부 의존이 Google Fonts 뿐인 단일 파일이라 그대로 Artifact 로 게시하거나 file:// 로 연다.
"""
import argparse
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    data_path = pathlib.Path(a.data)
    data = data_path.read_text(encoding="utf-8")
    if "window.PAGE" not in data:
        raise SystemExit("데이터 파일은 window.PAGE = {...} 로 시작해야 한다")
    m = re.search(r'\btitle\s*:\s*("(?:[^"\\]|\\.)*")', data)
    title = json.loads(m.group(1)) if m else "기법 비교"
    html = (HERE / "shell.html").read_text(encoding="utf-8")
    # 치환 순서: 본문 쪽 토큰을 먼저 넣으면 데이터 안의 「__CSS__」 같은 글자가 다시 치환될 수 있어 엔진 · 데이터를 마지막에 넣는다
    html = html.replace("__TITLE__", title.replace("&", "&amp;").replace("<", "&lt;"))
    html = html.replace("__CSS__", (HERE / "engine.css").read_text(encoding="utf-8"))
    html = html.replace("__ENGINE__", (HERE / "engine.js").read_text(encoding="utf-8"))
    html = html.replace("__DATA__", data.replace("</script", "<\\/script"))
    out = pathlib.Path(a.out) if a.out else data_path.with_name(data_path.name.replace(".data.js", "") .replace(".js", "") + ".html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
