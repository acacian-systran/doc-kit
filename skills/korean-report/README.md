# korean-report 번들

한국어 기술·사업 문서를 만들기 위한 두 스킬. **짝으로 쓴다.**

| 스킬 | 담당 |
|------|------|
| `korean-report-style` | 문장과 프레이밍 — 문체(-다체), 미달·리스크 서술 방식, 용어 정확도, AI 문투 제거, 편집 후 정합성 |
| `korean-report-doc`   | 제작 — 자립형 HTML/PDF, paper·deck 템플릿, SVG 도해, 빌드 시점 KaTeX, 렌더 QA |

역할이 겹치지 않게 갈라 둔 것이므로 하나만 링크하면 반쪽이 된다. 문체 규약만 필요한
경우(기존 문서 말투 교정 등)에는 `korean-report-style` 단독으로도 쓸 수 있지만,
새 문서를 만들 때는 둘 다 필요하다.

## 링크

두 스킬 모두 `.claude/skills/` 아래에 **말단 디렉터리**로 링크한다. 이 번들 디렉터리
자체를 링크하면 Claude Code가 SKILL.md를 찾지 못한다.

```bash
for s in korean-report-style korean-report-doc; do
  ln -s ~/projects/doc-kit/skills/korean-report/$s ~/.claude/skills/$s
done
```

저장소 루트의 `install.sh` 가 이 작업을 대신 해준다.
