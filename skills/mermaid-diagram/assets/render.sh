#!/usr/bin/env bash
# .mmd → .svg (또는 .png/.pdf). mermaid-cli 를 npx 로 부른다 — 전역 설치 불필요.
#
#   render.sh <이름>.mmd                 # 옆에 <이름>.svg
#   render.sh <이름>.mmd <출력>.png      # 확장자로 형식 결정. png 는 2배 스케일
#   render.sh docs/diagrams/**/*.mmd     # 여러 장
#   render.sh README.md                  # 마크다운의 ```mermaid 펜스를 뽑아 옆에 svg 로
#
# 스킬의 mermaid.config.json 을 기본 설정으로 쓴다. 그림 파일의 frontmatter
# `config:` 가 있으면 그쪽이 이긴다.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cfg="${MERMAID_CONFIG:-$here/mermaid.config.json}"
mmdc=(npx -y -p @mermaid-js/mermaid-cli mmdc -q -b white -c "$cfg")

if [ $# -eq 2 ] && [ -f "$1" ] && [[ "$2" != *.mmd ]]; then
  in="$1"; out="$2"
  case "$out" in *.png) "${mmdc[@]}" -i "$in" -o "$out" -s 2 ;; *) "${mmdc[@]}" -i "$in" -o "$out" ;; esac
  echo "→ $out"; exit 0
fi

for in in "$@"; do
  case "$in" in
    *.md)  "${mmdc[@]}" -i "$in" -o "${in%.md}.rendered.md"; echo "→ ${in%.md}.rendered.md (+ svg)";;
    *.mmd) "${mmdc[@]}" -i "$in" -o "${in%.mmd}.svg"; echo "→ ${in%.mmd}.svg";;
    *) echo "! 건너뜀 (mmd/md 아님): $in" >&2;;
  esac
done
