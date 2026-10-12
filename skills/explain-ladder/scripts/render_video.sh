#!/usr/bin/env bash
# 장면 디렉터리를 내레이션이 붙은 mp4 하나로 만든다.
#
#   render_video.sh <scene-dir>
#
# <scene-dir> 에는 scene_N.py 와 narration_N.txt 가 짝으로 있어야 한다 (N = 1, 2, ...).
# 장면마다 Manim 렌더링 → TTS → 길이 맞춤을 하고, 전부 이어 <scene-dir>/out/final.mp4 를 만든다.
# 음성이 더 길면 마지막 프레임을 정지 화면으로 늘리고, 영상이 더 길면 음성 뒤에 무음을 붙인다.
#
# 환경 변수
#   QUALITY              manim 품질 플래그 (기본 -qm; -ql 미리보기, -qh 고화질)
#   TTS_ENGINE           edge | elevenlabs (기본: ELEVENLABS_API_KEY 가 있으면 elevenlabs, 없으면 edge)
#   TTS_VOICE            edge-tts 음성 (기본 ko-KR-SunHiNeural)
#   ELEVENLABS_API_KEY   ElevenLabs 키
#   ELEVENLABS_VOICE_ID  ElevenLabs 음성 ID (elevenlabs 사용 시 필수)
#   ELEVENLABS_MODEL     ElevenLabs 모델 (기본 eleven_multilingual_v2)
set -euo pipefail

die() { echo "[render_video] $*" >&2; exit 1; }
log() { echo "[render_video] $*" >&2; }

# ── 입력 ────────────────────────────────────────────────────────────────
[ $# -eq 1 ] || die "사용법: render_video.sh <scene-dir>"
[ -d "$1" ] || die "입력 실패: 디렉터리가 없음 — $1"
dir="$(cd "$1" && pwd)"
out="$dir/out"
work="$out/work"
logs="$out/logs"
mkdir -p "$work" "$logs"

quality="${QUALITY:--qm}"
if [ -n "${TTS_ENGINE:-}" ]; then
  engine="$TTS_ENGINE"
elif [ -n "${ELEVENLABS_API_KEY:-}" ]; then
  engine=elevenlabs
else
  engine=edge
fi

# ── 의존성 (설치하지 않고 안내만 한다) ───────────────────────────────────
missing=""
for cmd in manim ffmpeg ffprobe; do
  command -v "$cmd" >/dev/null 2>&1 || missing="$missing $cmd"
done
case "$engine" in
  edge)
    command -v edge-tts >/dev/null 2>&1 || missing="$missing edge-tts" ;;
  elevenlabs)
    command -v curl >/dev/null 2>&1 || missing="$missing curl"
    command -v python3 >/dev/null 2>&1 || missing="$missing python3"
    [ -n "${ELEVENLABS_API_KEY:-}" ] || die "의존성 실패: TTS_ENGINE=elevenlabs 인데 ELEVENLABS_API_KEY 가 없음"
    [ -n "${ELEVENLABS_VOICE_ID:-}" ] || die "의존성 실패: ELEVENLABS_VOICE_ID 가 없음" ;;
  *)
    die "의존성 실패: 알 수 없는 TTS_ENGINE — $engine (edge | elevenlabs)" ;;
esac
if [ -n "$missing" ]; then
  die "의존성 실패: 없는 도구 —$missing
  ffmpeg/ffprobe: brew install ffmpeg
  manim:          brew install py3cairo pango && pip install manim
  edge-tts:       pip install edge-tts"
fi

# ── 장면 목록 (숫자 순) ─────────────────────────────────────────────────
scenes="$(find "$dir" -maxdepth 1 -name 'scene_*.py' -exec basename {} \; \
  | sed -n 's/^scene_\([0-9][0-9]*\)\.py$/\1/p' | sort -n)"
[ -n "$scenes" ] || die "입력 실패: scene_N.py 가 없음 — $dir"
for n in $scenes; do
  [ -s "$dir/narration_$n.txt" ] || die "입력 실패: 장면 $n — narration_$n.txt 가 없거나 비어 있음"
done
log "장면: $(echo $scenes | tr ' ' ',') · TTS: $engine · 품질: $quality"

duration() { ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"; }

# ── 장면별 처리 ─────────────────────────────────────────────────────────
concat_list="$work/concat.txt"
: > "$concat_list"

for n in $scenes; do
  # 1. 렌더링
  log "장면 $n / 렌더링"
  media="$work/media_$n"
  rm -rf "$media"
  if ! (cd "$dir" && manim render "$quality" --disable_caching --media_dir "$media" \
          -o "scene_$n" "scene_$n.py") >"$logs/scene_${n}_render.log" 2>&1; then
    die "장면 $n / 렌더링 실패 — 로그: $logs/scene_${n}_render.log"
  fi
  video="$(find "$media/videos" -name "scene_$n.mp4" -not -path '*partial_movie_files*' | head -n 1)"
  [ -n "$video" ] && [ -s "$video" ] \
    || die "장면 $n / 렌더링 실패 — 출력 mp4 를 찾지 못함 (Scene 클래스가 하나인지 확인). 로그: $logs/scene_${n}_render.log"

  # 2. TTS
  log "장면 $n / TTS ($engine)"
  audio="$work/narration_$n.mp3"
  tts_log="$logs/scene_${n}_tts.log"
  case "$engine" in
    edge)
      edge-tts --voice "${TTS_VOICE:-ko-KR-SunHiNeural}" \
        --file "$dir/narration_$n.txt" --write-media "$audio" >"$tts_log" 2>&1 \
        || die "장면 $n / TTS 실패 (edge-tts) — 로그: $tts_log" ;;
    elevenlabs)
      body="$(python3 -c 'import json,sys; print(json.dumps({"text": open(sys.argv[1], encoding="utf-8").read().strip(), "model_id": sys.argv[2]}))' \
        "$dir/narration_$n.txt" "${ELEVENLABS_MODEL:-eleven_multilingual_v2}")"
      code="$(curl -sS -o "$audio" -w '%{http_code}' \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/$ELEVENLABS_VOICE_ID" \
        -H "xi-api-key: $ELEVENLABS_API_KEY" -H 'Content-Type: application/json' \
        -H 'Accept: audio/mpeg' --data "$body" 2>"$tts_log")" \
        || die "장면 $n / TTS 실패 (ElevenLabs 요청 오류) — 로그: $tts_log"
      if [ "$code" != 200 ]; then
        cp "$audio" "$tts_log.body" 2>/dev/null || true
        die "장면 $n / TTS 실패 (ElevenLabs HTTP $code) — 응답: $tts_log.body"
      fi ;;
  esac
  [ -s "$audio" ] || die "장면 $n / TTS 실패 — 음성 파일이 비어 있음"

  # 3. 길이 맞춤
  log "장면 $n / 길이 맞춤"
  vdur="$(duration "$video")" || die "장면 $n / 길이 측정 실패 (영상)"
  adur="$(duration "$audio")" || die "장면 $n / 길이 측정 실패 (음성)"
  # 음성 앞뒤에 0.3초 여유를 둔다.
  target="$(awk -v v="$vdur" -v a="$adur" 'BEGIN { a += 0.3; printf "%.3f", (a > v ? a : v) }')"
  pad="$(awk -v v="$vdur" -v t="$target" 'BEGIN { d = t - v; printf "%.3f", (d > 0 ? d : 0) }')"
  log "장면 $n / 영상 ${vdur}s · 음성 ${adur}s → ${target}s (정지 프레임 ${pad}s)"

  clip="$work/clip_$n.mp4"
  if ! ffmpeg -nostdin -y -v error -i "$video" -i "$audio" \
        -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=${pad},fps=30,format=yuv420p[v];[1:a]adelay=150:all=1,apad,aresample=48000[a]" \
        -map '[v]' -map '[a]' -t "$target" \
        -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 160k -ac 2 \
        "$clip" >"$logs/scene_${n}_mux.log" 2>&1; then
    die "장면 $n / 합성 실패 (영상+음성) — 로그: $logs/scene_${n}_mux.log"
  fi
  echo "file '$clip'" >> "$concat_list"
done

# ── 이어 붙이기 ─────────────────────────────────────────────────────────
log "전체 / 이어 붙이기"
final="$out/final.mp4"
if ! ffmpeg -nostdin -y -v error -f concat -safe 0 -i "$concat_list" -c copy -movflags +faststart \
      "$final" >"$logs/concat.log" 2>&1; then
  die "전체 / 이어 붙이기 실패 — 로그: $logs/concat.log"
fi

log "완료: $final ($(duration "$final")s)"
echo "$final"
