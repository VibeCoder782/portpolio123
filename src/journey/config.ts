// "필름: 한 사람의 궤적" — 챕터·색·카메라·내레이션 단일 소스
// 포메이션 인덱스: 0 불씨(현장) · 1 비산(전향 폭발) · 2 격자(디지털) · 3 성긴 별밭(성장~실행) · 4 수렴(한 점)

export const JOURNEY = {
  counts: { desktop: 15000, mobile: 9000, dustDesktop: 90, dustMobile: 36 },

  // 포메이션별 파티클 기본색 (morph 구간에서 인접 색끼리 보간)
  segColors: ["#ff9a4d", "#ffdcb0", "#6b9aff", "#4b7fd8", "#86ffd0"] as const,
  // 포메이션별 밝기 (성긴 별밭은 어둡게 — 콘텐츠 방해 금지)
  segDim: [1.0, 1.4, 0.85, 0.5, 1.6] as const,
  // 포메이션별 유기적 흔들림 강도
  segWobble: [0.3, 0.55, 0.05, 0.14, 0.02] as const,
  // 포메이션별 배경(클리어) 색 — 필름 색 그레이딩
  clearColors: ["#0c0805", "#0d0906", "#04060c", "#05070a", "#040806"] as const,

  camera: {
    fovBase: 58,
    fovKick: 8, // 전향 가속 중 화각 킥 (속도감)
    zPivotEnd: -46, // 핀 종료 시점 (격자 회랑 내부)
    zMidDrift: -14, // 중간 챕터 동안 추가 전진
    zConvDrift: -2, // 수렴 구간 미세 전진
  },

  fog: { near: 7, far: 62 },

  narration: {
    pivot1: "12년의 현장을 뒤로하고",
    pivot2: "34세, 방향을 바꿨다",
    converge: "다음 이야기를, 함께",
  },
} as const;
