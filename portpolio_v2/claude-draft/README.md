# 양순민 포트폴리오 V2 — Claude 비교 시안 「정렬」

> 비교용 시안입니다. 운영 사이트·기존 V1·Codex 시안과 독립된 정적 프로토타입이며, 배포·push 대상이 아닙니다.

## 실행

빌드 없이 정적 파일만 있습니다. 둘 중 하나로 엽니다.

```bash
# 1) 로컬 서버 (권장 — 해시 라우팅·폰트 로딩이 안정적)
cd /Users/yangsoonmin/vibe_project/portpolio/portpolio_v2/claude-draft
python3 -m http.server 8787
# → http://localhost:8787
```

```bash
# 2) 파일로 바로 열기
open /Users/yangsoonmin/vibe_project/portpolio/portpolio_v2/claude-draft/index.html
```

서체(Noto Serif KR · Instrument Serif — Google Fonts, Pretendard — jsDelivr)는 온라인에서 내려받습니다. 오프라인이면 시스템 서체로 대체됩니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 첫 화면(오프닝 장면) · 프로젝트 목록 · About · Contact · 상세 사례 템플릿(아르피나 전용 + 공통) |
| `css/style.css` | 타이포그래피·색·레이아웃·반응형(860px 이하 모바일 구도) |
| `js/app.js` | 오프닝 장면(스크롤 진행도 → 문장 정렬), 마우스 패럴랙스, 커서 프리뷰, 상세 오버레이 + 해시 라우팅, 설명용 도식(SVG) |
| `assets/` | V1에서 가져온 프로필 사진·카카오 QR |

## 흐름

- 첫 화면 → 스크롤 → 흩어진 요구 문장이 「일하는 순서」 한 줄로 정렬 → 프로젝트 목록 → About → Contact
- 목록 행 클릭(또는 Enter) → 상세 오버레이(`#/work/arpina` 등) → 「목록으로」·ESC·브라우저 뒤로가기로 복귀 → 「다음 사례」로 연쇄 이동
- 상세 URL로 직접 진입 가능: `http://localhost:8787/#/work/arpina`

## 사실 표기 원칙

- 역할·기간·규모는 사용자 확인 내용과 V1 이력 데이터를 그대로 사용했습니다.
- 도식·정책표·관리표는 모두 "설명용 재구성"으로 표기했으며 당시 원본이 아닙니다.
- 확인되지 않은 수치(민원 감소율, 시간 절감률, 사용자 수)·후기·로고·수상은 넣지 않았습니다.
- 개인 프로젝트는 저장소 README 기준 상태만 적었습니다(이음: MVP 구현·출시 준비, FLOWON: 설계·구축 진행 중, AI Insight OS: 비공개 빌드).

## 디버그

숨겨진 탭에서는 `requestAnimationFrame`이 멈추므로, 콘솔에서 `__scene.renderAt(p)` (0~1)로 장면의 특정 진행도를 즉시 그릴 수 있습니다.
