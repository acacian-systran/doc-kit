# video — 내레이션이 붙은 Manim 설명 영상

사용자가 영상을 **명시적으로 요청했을 때만** 쓴다. 만드는 비용(시간, 의존성, 경우에 따라 TTS 요금)이 가장 크다.

## 0. 의존성 확인

먼저 확인만 한다. **사용자 확인 없이 설치하지 않는다.**

```bash
command -v manim; command -v ffmpeg; command -v ffprobe; command -v edge-tts
[ -n "$ELEVENLABS_API_KEY" ] && echo "ElevenLabs 키 있음"
```

없는 것이 있으면 설치 명령을 안내하고 기다린다.

| 도구 | macOS | 그 외 |
|---|---|---|
| ffmpeg / ffprobe | `brew install ffmpeg` | `apt install ffmpeg` |
| manim (Community Edition) | `brew install py3cairo pango && pip install manim` | `pip install manim` (+ cairo, pango 개발 패키지) |
| edge-tts | `pip install edge-tts` | 같음 |
| LaTeX (수식을 쓸 때만) | `brew install --cask mactex-no-gui` | `apt install texlive-latex-extra` |

## 1단계 — 스크립트 (승인 전 렌더링 금지)

- 전체 **60~120초**. 한국어 내레이션 기준 대략 분당 300~350자.
- 구성 순서: **직관 → 예시 → 일반화**.
- 장면마다 [화면] / [내레이션] 쌍으로 쓴다.

```markdown
### 장면 1 — 직관 (약 15초)
[화면] 단어 6개가 한 줄로 놓인다. "it" 에서 다른 단어로 선이 뻗는다. 선 굵기만 변한다.
[내레이션] 문장을 읽을 때 우리는 모든 단어를 똑같이 보지 않습니다. "it" 이 무엇을 가리키는지 알려면 앞 단어 중 하나를 더 봐야 합니다.

### 장면 2 — 예시 (약 30초)
...
```

- 각 장면에 예상 길이를 적는다. 합계를 맨 아래에 쓴다.
- 예시 숫자(가중치 등)를 화면에 띄우면 화면에 "예시" 표기를 넣는다.
- 스크립트를 사용자에게 보여주고 **승인을 받은 뒤에만** 2단계로 간다. 수정 요청이 오면 스크립트만 고친다.

## 2단계 — Manim 구현

장면 디렉터리를 만든다 (기본 `explain/<주제-slug>-video/`):

```
scene_1.py   narration_1.txt
scene_2.py   narration_2.txt
...
```

- `scene_N.py` 는 Scene 클래스를 **하나만** 둔다. 클래스 이름은 자유.
- `narration_N.txt` 는 그 장면의 [내레이션] 텍스트만 담는다.
- 시각 규칙:
  - 어두운 배경: `self.camera.background_color = "#111418"` (또는 `config.background_color`).
  - **색 하나 = 개념 하나.** 장면 전체에서 유지한다. 색 대응표를 파일 상단 주석에 둔다.
    예: `QUERY = BLUE`, `KEY = GREEN`, `VALUE = ORANGE`, `WEIGHT = YELLOW`.
  - **한 장면에서는 한 가지만 움직인다.** 동시에 여러 대상이 애니메이션되지 않게 `self.play` 를 나눈다.
  - 한국어 텍스트는 `Text(..., font="Apple SD Gothic Neo")` (macOS) 처럼 한글 폰트를 지정한다. `Tex` 는 수식에만 쓴다.
- 장면 길이를 내레이션에 정확히 맞추지 않아도 된다. 4단계 스크립트가 맞춘다. 다만 영상이 음성보다 지나치게 길지 않게 한다.

## 3단계 — TTS

- `ELEVENLABS_API_KEY` 가 있으면 ElevenLabs, 없으면 edge-tts.
- ElevenLabs 는 유료다. 쓰기 전에 총 글자 수와 예상 크레딧을 알리고 확인을 받는다.
  edge-tts 로 먼저 만들어 보고, 만족하면 ElevenLabs 로 다시 만드는 순서를 제안한다.
- 음성 지정: `TTS_VOICE` 환경 변수. 기본값은 edge-tts `ko-KR-SunHiNeural`, ElevenLabs 는 `ELEVENLABS_VOICE_ID` 필요.
- 강제로 엔진을 고를 때: `TTS_ENGINE=edge` 또는 `TTS_ENGINE=elevenlabs`.

## 4단계 — 합성

```bash
bash <skill-dir>/scripts/render_video.sh explain/attention-video        # 기본 품질 -qm
QUALITY=-qh bash <skill-dir>/scripts/render_video.sh explain/attention-video
```

스크립트가 하는 일:

1. 장면별로 `manim` 렌더링.
2. 장면별 TTS 음성 생성.
3. 음성이 더 길면 마지막 프레임을 정지 화면으로 덧붙이고, 영상이 더 길면 음성 뒤에 무음을 붙인다.
4. 장면을 이어 `<scene-dir>/out/final.mp4` 를 만든다.

실패하면 `[render_video] 장면 N / 단계명 실패` 형식으로 어느 단계가 실패했는지 출력한다. 로그 경로도 함께 출력한다.

## 완성 후

- 최종 파일 경로와 길이를 알린다.
- 스크립트 아래에 [확인된 사실] / [추론] / [불확실] 을 둔다 (SKILL.md 4.1). 영상 속 단순화(예: 차원 축소, 예시 가중치)는 [추론] 또는 "예시"로 밝힌다.
