#!/usr/bin/env bash
# doc-kit 스킬을 Claude Code가 읽는 위치에 심볼릭 링크로 설치한다.
#
#   ./install.sh                 # ~/.claude/skills (사용자 전역)
#   ./install.sh /path/to/proj   # <proj>/.claude/skills (프로젝트 한정)
#
# 번들 디렉터리 중첩 여부와 무관하게 SKILL.md를 담은 디렉터리만 골라 링크한다.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target="${1:+$1/.claude/skills}"
target="${target:-$HOME/.claude/skills}"
mkdir -p "$target"

find "$root/skills" -name SKILL.md -print0 | while IFS= read -r -d '' skill; do
  dir="$(dirname "$skill")"
  name="$(basename "$dir")"
  link="$target/$name"

  if [ -L "$link" ]; then
    if [ "$(readlink "$link")" = "$dir" ]; then
      echo "= $name (이미 링크됨)"
    else
      ln -sfn "$dir" "$link"
      echo "~ $name (링크 대상 갱신)"
    fi
  elif [ -e "$link" ]; then
    echo "! $name — 실제 파일/디렉터리가 이미 있어 건너뜀: $link" >&2
  else
    ln -s "$dir" "$link"
    echo "+ $name"
  fi
done

echo
echo "설치 위치: $target"
