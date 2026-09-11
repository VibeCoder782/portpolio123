# 04·05 정적 보조 이미지

후속 배치 변경: [LOWER-FLOW-V2.md](LOWER-FLOW-V2.md). 아래는 최초 정적 이미지 배치 기록이며, 현재는 제목이 이미지보다 먼저 나오고 06도 함께 정리됨.

사용자 결정: 큰 글자와 번호가 들어간 이미지·움직임 시안 대신 기존 두 칼럼의 제목 위에 정적 이미지 배치. 별도 장면이나 설명 문구를 추가하지 않음.

적용: `shared/body.template.html` → `sans.html`, `serif.html`. 이미지 CSS에는 확대·입체·반복 애니메이션 없음. 04·05 표의 기존 등장 애니메이션도 제거. 다른 섹션은 유지.

파일:
- `shared/assets/cms-support-static-v1.png`
- `shared/assets/team-support-static-v1.png`

내장 image_gen으로 기존 이미지를 참조 편집. 텍스트가 없는 설명용 개념 이미지이며 실제 업무 화면이 아님. 원본 및 이전 움직임 시안은 보존.

변경 전 템플릿·CSS: `archive/before-static-practice-images-20260910/`.

## 검증

- 빌드 성공: sans/serif 생성 및 CSS 캐시 버전 갱신.
- 1440px 데스크톱: 두 이미지 604×402.7px로 동일, 두 칼럼의 제목·본문 배치 시각 확인.
- 390px 모바일: 한 칼럼, 이미지 335×223.3px, 04/05 각각 시각 확인, 가로 넘침 없음.
- 두 이미지 로딩 완료, 이미지 animation-name none, 두 사례의 data-motion 대상 0개.
- 브라우저 오류 로그 없음. 다른 섹션의 기존 효과를 변경하지 않았으며 전체 사이트 재검증은 하지 않음.
- 확인 주소: http://localhost:8790/hero-compare/sans.html?review=static-practice-v1#row-cms

## 사용 프롬프트

### cmsStatic

참조: /Users/yangsoonmin/vibe_project/portpolio/portpolio_v2/design-candidates/editorial-images-v2/cms-system.png

```text
Use case: precise-object-edit. Edit this portfolio illustration into a SIMPLE TEXT-FREE supporting image to sit above an existing heading in one half-width website column. Keep the elegant off-white digital UI surfaces, dark charcoal sidebar, restrained ink-blue accents, subtle perspective and soft shadows of the reference. REMOVE ALL typography: SYSTEM, Reusable CMS, labels COMMON/CUSTOM, footer, numbers and every other word. Recompose just ONE primary admin list window with TWO smaller overlapping modules: a content editor and a small booking calendar. Only these three interface objects, tidy grey abstract content lines, a single restrained thin blue connector. No readable text anywhere. No floating labels or margins for captions. Make the interface group centered and visually balanced, large enough to read as simple shapes at 500px width, with modest breathing room on all four sides. Landscape 1536x1024. Warm uniform near-white background #f4f1eb, crisp subtle dimensionality, professional and quiet. This is a compact supporting illustration, NOT a poster, title card, infographic or whole website screenshot. No decorative symbols, no device mockups, no paper sculptures. Keep visual complexity low.
```

### teamStatic

참조: /Users/yangsoonmin/vibe_project/portpolio/portpolio_v2/design-candidates/editorial-images-v2/team-together.png

```text
Use case: precise-object-edit. Edit this portfolio illustration into a SIMPLE TEXT-FREE supporting image to sit above an existing heading in one half-width website column. Keep the elegant off-white digital panels, restrained ink-blue accents, subtle perspective and soft shadows. REMOVE ALL typography: TOGETHER, all Korean text, STORY POINTS, SHARED CONTEXT, WHY, PRIORITIES, SUPPORT, labels, footer, numbers and every other word. Simplify into just TWO clean overlapping documents and ONE smaller dialogue panel between them. Left document has a few grey planning rows; right document has three clear grey content groups; small dialogue panel has two minimal speech bubbles with grey lines. One restrained blue connecting stroke suggests conversation leading to shared understanding. No scores, no charts, no giant quotation marks, no additional icons or labels. Center the group with modest breathing room, consistent visual weight for a companion CMS illustration. Landscape 1536x1024. Uniform warm near-white background #f4f1eb. Crisp digital UI surfaces, subtle planar depth, professional and quiet. This is a compact supporting illustration, NOT a poster, title card, infographic or whole website screenshot. No readable text anywhere. No physical paper sculptures or devices. Keep visual complexity low.
```
