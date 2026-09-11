# 04 SYSTEM — 부분 움직임 시안

검토 주소: http://localhost:8790/design-candidates/editorial-images-v2/cms-motion/

사용자 승인 범위: 좋아한 04 이미지의 제목과 배경은 고정하고 내부 패널만 미세하게 움직이는 별도 시안. 05와 기존 포트폴리오 본문은 수정하지 않음. 원본 `../cms-system.png`도 유지.

## 구성

- `index.html`: 1536×1024 SVG 좌표 안에 배경과 원본을 잘라 표시한 패널 세 개를 합성. 실제 래스터 원본을 교체하거나 리터칭하지 않음.
- `cms-background-v1.png`: 내장 image_gen으로 전경 패널과 파란 선을 제거하고 가려진 배경을 복원한 별도 이미지. 가려졌던 관리자 창의 오른쪽 가장자리 등은 재구성되어 원본과 완전히 동일하지 않음.
- `motion.css`: 세 패널의 세로 이동 23–32 좌표 px, 회전 최대 1.4도, 주기 4.8–6.2초. 좁은 화면은 ResizeObserver로 이동 폭을 보정하여 331px 브라우저에서도 세로 이동 약 12–17 화면 px가 보이게 함. 연결선 위 짧은 밝은 선 순환. 제목과 배경 고정.
- `motion.js`: 재생/정지, 원본/시안 비교, 화면 밖·숨겨진 탭에서 일시정지. OS 움직임 줄이기 설정이면 처음에는 정지하며 사용자가 명시적으로 재생 가능.
- 외부 라이브러리, 동영상, 유료 API, 추가 네트워크 서비스 없음.

개념 설명용 그래픽으로 표시. 실제 CMS 서비스 화면이나 업무 증빙으로 표기하지 않음.

첫 시안은 331px 브라우저에서 이동 폭이 약 1px로 축소되어 사용자가 움직임을 인지하지 못함. v2에서 폭 보정, 이동량 증가, 주기 단축을 적용. 단순 재생 상태 확인을 넘어 서로 다른 시점의 실제 화면으로 확인.

## 확인한 범위

- 브라우저 1280×1000: 합성 경계와 그림자 시각 확인, 패널별 transform 변화 확인.
- 정지 전후 및 시간 간격을 둔 재조회에서 transform 동일: 정지 동작 확인.
- 원본 전환 시 원본 PNG 표시, 합성 숨김, 재생 제어 비활성화 확인.
- Enter로 비교 복귀·재생 확인.
- 모바일 390×844: 가로 넘침 없음, 두 버튼 높이 44px, 재생 상태 확인.
- 브라우저 오류·경고 없음.
- 움직임 줄이기·탭 비활성화·화면 밖 정지 처리는 코드로 확인했으며 OS 설정 전환과 실제 기기 성능은 별도 실측하지 않음.

## 배경 복원 기록

도구: 내장 `image_gen.imagegen`, 참조 `../cms-system.png`.

생성 원본: `/Users/yangsoonmin/.codex/generated_images/01a07e7f-0a0e-72a2-b04e-de972004ffbd/exec-c7a7eab4-e272-4b1f-9ed5-d669abe3375c.png`

프롬프트:

```text
Use case: precise-object-edit. Create an inpainted background plate for subtle web animation from this exact 1536x1024 image. Preserve the canvas dimensions, composition, giant SYSTEM title, every other title/caption/footer word, all original colors, grain, lighting, and the large main CMS list window at the lower left EXACTLY.
REMOVE ONLY these three foreground windows and their cast shadows:
1. the big upper-right content-editor window, approximately x930..1433 y193..542;
2. the smaller lower-middle/right content editor, x834..1160 y555..862;
3. the small far-right reservation calendar, x1228..1435 y546..827.
Restore what was hidden by those windows: warm blank off-white background at the right, and the continuing unobstructed right edge and simple generic grey list rows of the large lower-left CMS window where needed. The original large CMS list window remains at exactly its original position and perspective; do not enlarge it.
Also remove only the thin blue connector strokes and endpoint dots that lead to the labels COMMON and CUSTOM, leaving the words COMMON and CUSTOM themselves in their EXACT original positions. These strokes will be redrawn in the browser.
Do not add anything. No replacement windows, no extra text, no rectangles or mask boundaries, no new decorative elements. This is the same existing image with three foreground UI windows and connector strokes cleanly removed. All unedited pixels should look unchanged. Output one 1536x1024 image.
```

위 프롬프트 좌표는 생성 시 근사값이며, 브라우저 합성의 패널 경계는 원본을 보고 별도로 맞춤.
