import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// "타이포 기반 3D 포트폴리오" — 클로드 디자인(포트폴리오 메인.dc.html) React 포팅
// 룩/모션 설정 (디자인의 data-props와 동일)
// ─────────────────────────────────────────────────────────────
const ACC = "#C8FF16";
const CONFIG = {
  letterFx: "pop3d" as "pop3d" | "light" | "wave" | "repel",
  companion: true,
  repelStrength: 1,
  tiltStrength: 0,
};
const MONO = "'IBM Plex Mono',monospace";
const ANTON = "Anton,sans-serif";
// 클린 타이포 — 그림자 없음, 솔리드 블랙

let introPlayed = false; // 재생 완료 가드 (SPA 재마운트 시 재생 방지)
let introSeqStarted = false; // 실행 중 가드 — 어떤 경로로든 낙하 시퀀스가 두 번 돌 수 없게

// 히어로 타이포를 물리 반응용 글자 스팬으로 분해
const split = (txt: string) =>
  [...txt].map((ch, i) => (
    <span key={i} data-ltr style={{ display: "inline-block", whiteSpace: "pre", willChange: "transform" }}>
      {ch}
    </span>
  ));

// shape: 호버 프리뷰의 블루프린트 와이어프레임 3D 도형 (프로젝트의 은유) / cap: 도형 캡션
// shot: /public/shots/ 에 스크린샷이 생기면 자동으로 도형 대신 표시
type Build = { no: string; name: string; meta: string; shape: string; cap: string; shot: string | null; ko: string; koDesc: string };
const BUILDS: Build[] = [
  { no: "01", name: "AI AUTOMATION", meta: "N8N · IN USE", shape: "rings", cap: "AUTOMATION LOOP", shot: "/shots/n8n.png", ko: "AI 업무자동화", koDesc: "회의록·OCR·트렌드 자동화 — 지금도 매일 쓴다" },
  { no: "02", name: "BOOGION", meta: "TEAM OF 4 · TOP CONTRIBUTOR", shape: "cube4", cap: "TEAM OF FOUR", shot: "/shots/boogion.png", ko: "부기온", koDesc: "정서 케어 앱 · 4인 팀 · 기여 최다" },
  { no: "03", name: "MOUNTAINON", meta: "APP BUILD", shape: "peak", cap: "THE PEAK", shot: "/shots/mountainon.png", ko: "마운틴온", koDesc: "GPS 등산 기록 앱 · 1인 개발" },
  { no: "04", name: "BOOKITDA", meta: "STORE-READY", shape: "pages", cap: "PAGES", shot: "/shots/bookitda.png", ko: "북잇다", koDesc: "독서 한줄평 소셜 · 출시 직전" },
  { no: "05", name: "CASETALK", meta: "AI SELF-CHECK", shape: "dialogue", cap: "DIALOGUE", shot: "/shots/casetalk.png", ko: "모의톡", koDesc: "AI 셀프 점검 웹 · 안전장치 설계" },
  { no: "06", name: "AI INSIGHT OS", meta: "35 SPECS · PRE-MVP", shape: "stack", cap: "STACK OF 35", shot: "/shots/insightos.png", ko: "AI 인사이트 OS", koDesc: "35개 스펙 문서로 설계한 개인용 지식 OS" },
  { no: "07", name: "CONTENT PLATFORM ※", meta: "IN SERVICE · ANONYMOUS", shape: "sealed", cap: "SEALED", shot: null, ko: "콘텐츠 플랫폼", koDesc: "운영 중 · 서비스명은 비공개" },
  { no: "08", name: "WEBOPS BUILDER", meta: "OPS CONSOLE · IN DESIGN", shape: "console", cap: "CONSOLE", shot: "/shots/webops.png", ko: "웹옵스 빌더", koDesc: "멀티 프로덕트 운영 콘솔 · 설계 중" },
  { no: "09", name: "FLOWON", meta: "3D WEB · SHIPPED", shape: "wave", cap: "THE WAVE", shot: "/shots/flowon.png", ko: "플로우온", koDesc: "3D 인터랙티브 웹 · 완성" },
  { no: "10", name: "CITIZEN'S TURN", meta: "UNITY 2D · IN DEV", shape: "die", cap: "THE DIE", shot: "/shots/citizensturn.png", ko: "시민의 턴", koDesc: "Unity 2D 의사결정 게임 · 개발 중" },
];

// 04는 경력 전용 — 개인 프로젝트는 02 Builds가 단독 담당 (중복 제거)
type ArchiveRow = { yr: string; name: string; meta: string; desc?: string; sub?: { n: string; p: string }[] };
const ARCHIVE: ArchiveRow[] = [
  {
    yr: "2024–25", name: "HANDY — 이사 · PO/팀장", meta: "CMS · 아르피나 예약 전환",
    desc: "개발 1팀 이사 · PO/팀장 — 애자일 스크럼 도입, JIRA 기반 일정·이슈 관리, Figma UI/UX 설계, AI 업무 자동화 주도. 자체 CMS와 선착순 예약 시스템 구축을 총괄하고 착수·완료 보고를 책임졌다.",
    sub: [
      { n: "홈페이지 관리 CMS 기획·UI/UX 디자인", p: "2024.08 – 2025.05 · 자체 서비스" },
      { n: "부산경상대 창업가꿈 홈페이지 구축", p: "2024 · 신규" },
      { n: "아르피나 수영장 선착순 예약 시스템 + 리뉴얼", p: "2024 – 25 · 예약" },
      { n: "허치슨 홈페이지 리뉴얼", p: "2024 – 25 · 리뉴얼" },
      { n: "부산경상대 메이커스페이스 신규 구축", p: "2024 – 25 · 신규" },
      { n: "울산과학대 EPL 신규 구축 (선착순 예약)", p: "2025 · 예약" },
    ],
  },
  {
    yr: "2022–24", name: "ARIMOA — PM/PL", meta: "사원→대리→과장 · 70+ SITES",
    desc: "기획팀 PM/PL — 입사 1년 반 만에 사원에서 대리를 거쳐 과장까지. 요구사항 정의·IA·프로그램 스토리보드·제안서 작성, 착수·완료 보고회 발표 다수. 총 15개 계약 건, 대학 통합 홈페이지 70개+를 지켰다.",
    sub: [
      { n: "경성대 LINC 3.0 사업단 구축 (11개 프로그램)", p: "2022 – 23 · 신규" },
      { n: "한국기술교육대 산학협력단 고도화", p: "2023 · 고도화" },
      { n: "상지건축 50주년 리뉴얼", p: "2023 · 리뉴얼" },
      { n: "동아대 교내 홈페이지 고도화", p: "2023 · 고도화" },
      { n: "울산과학대 통합 구축 (40개+, PHP→JAVA)", p: "2023 – 24 · 대규모" },
      { n: "경성대 LINC 3.0 공유형 콘텐츠 다중활용", p: "2023 – 24 · 신규" },
      { n: "전국 기술사교육원 구축", p: "2023 – 24 · 신규" },
      { n: "철강산업 인적양성 부트캠프", p: "2023 – 24 · 신규" },
      { n: "한진 공식 홈페이지 메인 리뉴얼", p: "2024 · 리뉴얼" },
      { n: "대동대 통합 구축 (30개)", p: "2024 · 대규모" },
      { n: "영렘브란트 신규 구축", p: "2024 · 신규" },
      { n: "울산과학대 진로진학지원센터 외 부속", p: "2023 – 24 · 다수" },
    ],
  },
  {
    yr: "2009–21", name: "DOMINO'S — STORE MANAGER", meta: "12 YEARS",
    desc: "매장 매니저 12년 — 매출과 손익, 사람, 새벽의 현장. 고객 중심 사고와 현장 커뮤니케이션이 여기서 만들어졌다. 모든 기획의 뿌리.",
  },
];

const CASES = [
  {
    no: "01",
    title: "새벽 줄서기를 온라인으로",
    accent: "— 아르피나 예약",
    body: "새벽부터 현장에 줄 서던 수영장 선착순 접수를 온라인 예약으로 전환. 레퍼런스 조사와 실무자 개별 미팅으로 요구사항을 수렴하고, 선착순·인원 제한 정책을 설계해 홈페이지 리뉴얼과 통합 오픈.",
    tag: "HANDY · 예약 시스템",
  },
  {
    no: "02",
    title: "재학생 의견이 실제 개편이 되다",
    accent: "— 대동대 30",
    body: "착수보고회에서 수렴한 재학생 의견을 실제 개편 방향에 반영해 본대·입학·학과 약 30개 사이트를 통합 구축. 지금도 가장 애착이 가는 프로젝트.",
    tag: "ARIMOA · PM",
  },
  {
    no: "03",
    title: "혼자 60여 개 사이트, 연기 0건",
    accent: "— 문서화의 힘",
    body: "울산과학대·대동대 통합 구축에서 60여 개 사이트를 전 작업 문서화로 누락 없이 관리. 팀원 상황을 살피며 WBS로 일정을 조율해 단 한 건의 연기 없이 오픈.",
    tag: "ARIMOA · 70+ SITES",
  },
  {
    no: "04",
    title: "도입보다 설득이 어렵다",
    accent: "— 스크럼 × AI",
    body: "핸디 스크럼 조직에 Gemini·Claude·Gamma를 도입해 제안서·기획 문서 작성 시간을 단축. 새 도구를 팀에 정착시키는 일은 도입보다 설득이 어렵다는 걸 배운 프로젝트.",
    tag: "HANDY · AI 정착",
  },
  {
    no: "05",
    title: "2개월 안에 11개 프로그램",
    accent: "— 경성대 LINC 3.0",
    body: "11개 신청·관리 프로그램을 2개월 안에 오픈해야 하는 일정. 공통 프로세스 설계로 개발 부담을 줄이고 핵심 프로그램에 집중해 일정 내 안정 오픈 — 유지보수를 거쳐 지금도 다수 사용자가 이용 중.",
    tag: "ARIMOA · 11 PROGRAMS",
  },
  {
    no: "06",
    title: "레퍼런스 없이 CMS를 제로부터",
    accent: "— 자체 CMS 설계",
    body: "기존에 없던 홈페이지 관리 CMS를 IA 구조도 → 스토리보드 → 플로우차트 → UI/UX까지 약 9개월간 Figma로 전 과정 설계. 이후 모든 웹 프로젝트의 관리 기반이 됐다.",
    tag: "HANDY · 9 MONTHS",
  },
];

// ─────────────────────────────────────────────────────────────
// 블루프린트 와이어프레임 3D 도형 — 프로젝트의 은유 (스크린샷 오기 전 프리뷰)
// ─────────────────────────────────────────────────────────────
const WIRE = "1.5px solid rgba(200,255,22,.85)";
const WIREBG = "rgba(200,255,22,.05)";
const wf = (key: string | number, w: number, h: number, t: string, extra?: React.CSSProperties) => (
  <span key={key} style={{ position: "absolute", left: "50%", top: "50%", width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, transform: t, border: WIRE, background: WIREBG, ...extra }} />
);
const WireShape = ({ type }: { type: string }) => {
  let faces: React.ReactNode = null;
  switch (type) {
    case "rings": // 맞물려 도는 궤도 — 자동화 루프
      faces = [wf(1, 86, 86, "rotateY(0deg)", { borderRadius: "50%" }), wf(2, 86, 86, "rotateY(90deg)", { borderRadius: "50%" }), wf(3, 86, 86, "rotateX(90deg)", { borderRadius: "50%", opacity: 0.5 })];
      break;
    case "cube4": // 4조각 큐브 — 4인 팀
      faces = [
        ...[0, 90, 180, 270].map((a) => wf(a, 64, 64, `rotateY(${a}deg) translateZ(32px)`)),
        wf("t", 64, 64, "rotateX(90deg) translateZ(32px)"), wf("b", 64, 64, "rotateX(-90deg) translateZ(32px)"),
        wf("h", 66, 1.5, "translateZ(33px)", { background: "rgba(200,255,22,.85)", border: "none" }),
        wf("v", 1.5, 66, "translateZ(33px)", { background: "rgba(200,255,22,.85)", border: "none" }),
      ];
      break;
    case "peak": // 쌓인 링의 원뿔 — 산
      faces = [
        wf(1, 84, 84, "rotateX(90deg) translateZ(-30px)", { borderRadius: "50%" }),
        wf(2, 54, 54, "rotateX(90deg) translateZ(0px)", { borderRadius: "50%" }),
        wf(3, 26, 26, "rotateX(90deg) translateZ(28px)", { borderRadius: "50%" }),
        wf(4, 7, 7, "rotateX(90deg) translateZ(42px)", { borderRadius: "50%", background: "rgba(200,255,22,.9)" }),
      ];
      break;
    case "pages": // 펼쳐지는 책장
      faces = [-36, -18, 0, 18, 36].map((a) => wf(a, 60, 82, `rotateY(${a}deg)`, { transformOrigin: "left center", marginLeft: 0 }));
      break;
    case "dialogue": // 마주 보는 두 판 — 대화
      faces = [wf(1, 50, 66, "translateX(-30px) rotateY(32deg)"), wf(2, 50, 66, "translateX(30px) rotateY(-32deg)")];
      break;
    case "stack": // 층층이 쌓인 레이어 — 35개 스펙
      faces = [0, 1, 2, 3].map((i) => wf(i, 80, 52, `translateY(${(i - 1.5) * 18}px) rotateX(72deg)`));
      break;
    case "sealed": // 봉인된 큐브 — 익명
      faces = [
        ...[0, 90, 180, 270].map((a) => wf(a, 64, 64, `rotateY(${a}deg) translateZ(32px)`)),
        wf("t", 64, 64, "rotateX(90deg) translateZ(32px)"), wf("b", 64, 64, "rotateX(-90deg) translateZ(32px)"),
        wf("x1", 88, 1.5, "translateZ(33px) rotate(45deg)", { background: "rgba(200,255,22,.85)", border: "none" }),
        wf("x2", 88, 1.5, "translateZ(33px) rotate(-45deg)", { background: "rgba(200,255,22,.85)", border: "none" }),
      ];
      break;
    case "console": // 격자 콘솔 판 — 운영 대시보드
      faces = [wf(1, 92, 64, "rotateX(55deg)", { backgroundImage: "repeating-linear-gradient(rgba(200,255,22,.45) 0 1px,transparent 1px 12px),repeating-linear-gradient(90deg,rgba(200,255,22,.45) 0 1px,transparent 1px 12px)" })];
      break;
    case "wave": // 얼어붙은 물결 — Flow
      faces = [0, 1, 2, 3, 4, 5, 6].map((i) => wf(i, 8, 52, `translateX(${(i - 3) * 13}px) translateY(${(Math.sin(i * 1.05) * 14).toFixed(1)}px) rotateX(58deg)`));
      break;
    case "die": // 구르는 주사위 — 의사결정
      faces = [
        wf("f", 64, 64, "translateZ(32px)", { backgroundImage: "radial-gradient(circle 5px at 50% 50%, rgba(200,255,22,.95) 4px, transparent 5px)" }),
        wf("k", 64, 64, "rotateY(180deg) translateZ(32px)", { backgroundImage: "radial-gradient(circle 4px at 30% 30%, rgba(200,255,22,.95) 3px, transparent 4px),radial-gradient(circle 4px at 70% 30%, rgba(200,255,22,.95) 3px, transparent 4px),radial-gradient(circle 4px at 30% 70%, rgba(200,255,22,.95) 3px, transparent 4px),radial-gradient(circle 4px at 70% 70%, rgba(200,255,22,.95) 3px, transparent 4px)" }),
        wf("r", 64, 64, "rotateY(90deg) translateZ(32px)", { backgroundImage: "radial-gradient(circle 4px at 30% 30%, rgba(200,255,22,.95) 3px, transparent 4px),radial-gradient(circle 4px at 50% 50%, rgba(200,255,22,.95) 3px, transparent 4px),radial-gradient(circle 4px at 70% 70%, rgba(200,255,22,.95) 3px, transparent 4px)" }),
        wf("l", 64, 64, "rotateY(-90deg) translateZ(32px)"),
        wf("t", 64, 64, "rotateX(90deg) translateZ(32px)"), wf("b2", 64, 64, "rotateX(-90deg) translateZ(32px)"),
      ];
      break;
  }
  return (
    <span className="w3" aria-hidden="true">
      <span className="w3spin">{faces}</span>
    </span>
  );
};

// 콘택트 파티클 — "LET'S BUILD" 위로 피어오르는 작업장의 불씨
const Sparks = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      const r = cv.parentElement!.getBoundingClientRect();
      w = cv.width = Math.floor(r.width); h = cv.height = Math.floor(r.height);
    };
    resize();
    const N = 110;
    const P = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), r: 0.7 + Math.random() * 1.6,
      vy: 0.18 + Math.random() * 0.5, sway: Math.random() * 6.28, sa: 0.15 + Math.random() * 0.35,
      a: 0.12 + Math.random() * 0.45, lime: Math.random() < 0.24,
    }));
    let t = 0;
    const loop = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= (p.vy / h) * 1.6;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const x = (p.x + Math.sin(t * p.sa + p.sway) * 0.012) * w;
        const fade = p.y < 0.25 ? p.y / 0.25 : 1; // 위로 갈수록 소멸
        ctx.beginPath();
        ctx.arc(x, p.y * h, p.r, 0, 6.283);
        ctx.fillStyle = p.lime ? `rgba(200,255,22,${(p.a * fade).toFixed(3)})` : `rgba(244,243,240,${(p.a * 0.7 * fade).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
};

// ─────────────────────────────────────────────────────────────
// 히어로 WebGL 유리 오브제 — 커스텀 굴절 셰이더.
// 핵심: DOM 타이포·그리드를 캔버스 텍스처로 복제해 유리 픽셀이 그 텍스처를
// 스크린공간 굴절로 샘플링 → 진짜로 글자가 유리 안에서 휘어 보인다.
// (WebGL transmission은 씬 안의 것만 굴절시키므로 이 방식이 DOM 통합의 정석)
// 메인 rAF 루프가 glassTick을 호출 — 루프는 하나만 존재.
// ─────────────────────────────────────────────────────────────
let glassTick: ((emx: number, emy: number, introDone: boolean) => void) | null = null;

const GLASS_VERT = `
varying vec3 vN; varying vec3 vV;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const GLASS_FRAG = `
precision highp float;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uRefr;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float edge = pow(1.0 - ndv, 1.6);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 off = (n.xy * uRefr * (0.3 + 0.7 * edge)) / uRes;
  vec2 suv = uv - off;
  vec2 fo = vec2(1.6) / uRes;
  vec3 col = ( texture2D(uTex, suv).rgb
             + texture2D(uTex, suv + vec2(fo.x, 0.0)).rgb
             + texture2D(uTex, suv - vec2(fo.x, 0.0)).rgb
             + texture2D(uTex, suv + vec2(0.0, fo.y)).rgb ) * 0.25;
  col *= 0.9 + 0.1 * ndv;                       // 두께감 — 가장자리 미세하게 어둡게
  float fres = pow(1.0 - ndv, 3.0);
  col = mix(col, vec3(1.0), fres * 0.5);        // 프레넬 림 라이트
  vec3 l1 = normalize(vec3(-0.45, 0.55, 0.62)); // 스튜디오 키 라이트
  vec3 l2 = normalize(vec3(0.62, 0.18, 0.5));   // 보조 라이트
  col += vec3(pow(max(dot(reflect(-l1, n), v), 0.0), 90.0) * 0.45
            + pow(max(dot(reflect(-l2, n), v), 0.0), 170.0) * 0.3);
  gl_FragColor = vec4(col, 1.0);
}`;

const HeroGlass = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.innerWidth <= 900) return;
    const cell = canvas.parentElement as HTMLElement;
    const sceneEl = canvas.closest<HTMLElement>("[data-scene]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let ready = false;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    const CAMD = 1000; // 카메라 거리 1000 + fov 보정 = z0 평면에서 1 world unit = 1 px

    const texCanvas = document.createElement("canvas");
    const tex = new THREE.CanvasTexture(texCanvas);
    tex.minFilter = THREE.LinearFilter;
    const uni = { uTex: { value: tex }, uRes: { value: new THREE.Vector2(1, 1) }, uRefr: { value: 90 } };
    const mat = new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: uni });

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(190, 64, 64), mat);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(78, 26, 48, 96), mat);
    const small = new THREE.Mesh(new THREE.SphereGeometry(55, 48, 48), mat);
    scene.add(sphere, torus, small);

    type Obj = { m: THREE.Mesh; base: THREE.Vector3; exit: THREE.Vector2; exitAt: number; entDelay: number; phase: number; ampX: number; ampY: number; f1: number; f2: number };
    let objs: Obj[] = [];

    const drawTexture = (w: number, h: number, cr: DOMRect) => {
      const s = Math.min(window.devicePixelRatio, 1.5);
      texCanvas.width = Math.round(w * s);
      texCanvas.height = Math.round(h * s);
      const g = texCanvas.getContext("2d");
      if (!g) return;
      g.scale(s, s);
      g.fillStyle = "#f4f3f0"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(17,17,17,.07)"; g.lineWidth = 1;
      for (let x = 0.5; x < w; x += 72) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0.5; y < h; y += 72) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.textBaseline = "middle"; g.textAlign = "left";
      const num = cell.querySelector<HTMLElement>("[data-hero-num]");
      if (num) {
        const r = num.getBoundingClientRect();
        g.font = `${parseFloat(getComputedStyle(num).fontSize)}px Anton`;
        g.strokeStyle = "rgba(17,17,17,.13)"; g.lineWidth = 2;
        g.strokeText("12/3", r.left - cr.left, r.top - cr.top + r.height * 0.55);
      }
      const ds = cell.querySelectorAll<HTMLElement>("[data-split]");
      const line = (el: HTMLElement | undefined, text: string, color = "#111") => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        g.font = `${parseFloat(getComputedStyle(el).fontSize)}px Anton`;
        g.fillStyle = color;
        g.fillText(text, r.left - cr.left, r.top - cr.top + r.height * 0.56);
      };
      line(ds[0], "12 YEARS ON THE FLOOR,");
      line(ds[1], "3 IN PRODUCT.");
      line(ds[2], "NOW");
      line(ds[3], " I BUILD.");
      line(cell.querySelector<HTMLElement>("[data-hero-dash]") ?? undefined, "—", ACC);
      tex.needsUpdate = true;
    };

    const measure = () => {
      const w = cell.clientWidth, h = cell.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = CAMD;
      camera.fov = (2 * Math.atan(h / 2 / CAMD) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      const db = new THREE.Vector2();
      renderer.getDrawingBufferSize(db);
      uni.uRes.value.copy(db);
      const cr = cell.getBoundingClientRect();
      const W = (x: number, y: number) => new THREE.Vector3(x - w / 2, h / 2 - y, 0);
      // 랜덤 시작 위치 — 방문할 때마다 다른 구도. 서로 최소 간격 확보(리젝션 샘플링, 유영 반경만큼 여유)
      const rand = (a: number, b: number) => a + Math.random() * (b - a);
      const placed: { x: number; y: number; r: number }[] = [];
      const place = (r: number, ax: number, ay: number) => {
        // 여유 = 반지름 + 유영 최대 반경 → 떠다니는 중에도 화면 밖으로 안 나감
        const mx = Math.min(r + ax + 20, w * 0.42), my = Math.min(r + ay + 20, h * 0.42);
        for (let k = 0; k < 30; k++) {
          const x = rand(mx, w - mx), y = rand(my, h - my);
          if (placed.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + 90)) { placed.push({ x, y, r }); return { x, y }; }
        }
        const x = rand(mx, w - mx), y = rand(my, h - my);
        placed.push({ x, y, r });
        return { x, y };
      };
      const p1 = place(190, w * 0.0675, h * 0.117), p2 = place(104, w * 0.108, h * 0.143), p3 = place(55, w * 0.1485, h * 0.195);
      // ampX/ampY = 유영 반경, f1/f2 = 유영 주파수(느릴수록 몽환적) — 둥둥 떠다니다 그 자리에서 퇴장
      objs = [
        { m: sphere, base: W(p1.x, p1.y), exit: new THREE.Vector2(0.6 * w, 0.8 * h), exitAt: 0.12, entDelay: 0, phase: rand(0, 6.28), ampX: w * 0.05, ampY: h * 0.09, f1: 0.11, f2: 0.07 },
        { m: torus, base: W(p2.x, p2.y), exit: new THREE.Vector2(-0.5 * w, 0.7 * h), exitAt: 0.17, entDelay: 120, phase: rand(0, 6.28), ampX: w * 0.08, ampY: h * 0.11, f1: 0.09, f2: 0.13 },
        { m: small, base: W(p3.x, p3.y), exit: new THREE.Vector2(0.06 * w, -1.0 * h), exitAt: 0.22, entDelay: 240, phase: rand(0, 6.28), ampX: w * 0.11, ampY: h * 0.15, f1: 0.14, f2: 0.1 },
      ];
      drawTexture(w, h, cr);
    };

    document.fonts.ready.then(() => {
      if (disposed) return;
      measure();
      ready = true;
    });

    let entT0 = 0;
    const easeOutBack = (t: number) => { const c = 1.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const easeIn = (t: number) => t * t * t;

    glassTick = (emx, emy, introDone) => {
      if (disposed || !ready) return;
      const now = performance.now();
      if (introDone && !entT0) entT0 = now;
      const p = sceneEl ? parseFloat(sceneEl.style.getPropertyValue("--p") || "0") : 0;
      const t = now / 1000;
      objs.forEach((o, i) => {
        let en = 1;
        if (!reduce) {
          if (!entT0) en = 0;
          else {
            const raw = Math.max(0, Math.min(1, (now - entT0 - o.entDelay) / 850));
            en = raw >= 1 ? 1 : easeOutBack(raw);
          }
        }
        const ex = easeIn(Math.max(0, Math.min(1, (p - o.exitAt) / 0.38))); // 스크럽 연동 퇴장 — 유영하던 그 자리에서 각자 방향으로
        // 이중 사인 유영 — 리사주 궤적으로 화면을 느리게 떠다님
        const wx = reduce ? 0 : Math.sin(t * o.f1 + o.phase) * o.ampX + Math.sin(t * o.f2 * 1.7 + o.phase * 2.3) * o.ampX * 0.35;
        const wy = reduce ? 0 : Math.cos(t * o.f2 + o.phase * 1.3) * o.ampY + Math.sin(t * o.f1 * 0.8 + o.phase * 0.7) * o.ampY * 0.3;
        o.m.position.set(
          o.base.x + wx + o.exit.x * (ex + (1 - en) * 0.35) + emx * (14 + i * 8),
          o.base.y + wy + o.exit.y * (ex + (1 - en) * 0.35) - emy * (10 + i * 6),
          0
        );
        if (i === 1) { // 토러스 — 상시 저속 텀블, 퇴장 시 가속 스핀
          o.m.rotation.set(1.05 + ex * 1.6, -0.4 + (reduce ? 0 : t * 0.16) + ex * 2.4, 0.2);
        }
      });
      renderer.render(scene, camera);
    };

    let rto = 0;
    const onResize = () => {
      clearTimeout(rto);
      rto = window.setTimeout(() => { if (!disposed && ready) measure(); }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      glassTick = null;
      window.removeEventListener("resize", onResize);
      clearTimeout(rto);
      sphere.geometry.dispose(); torus.geometry.dispose(); small.geometry.dispose();
      mat.dispose(); tex.dispose();
      renderer.dispose();
    };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" className="hero-obj" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }} />;
};

// Builds 행 — 호버 시 라임 스윕 + 유리 패널 프리뷰(스크린샷 있으면 이미지, 없으면 와이어프레임 도형)
const BuildRow = ({ b, i }: { b: Build; i: number }) => {
  const [shotOk, setShotOk] = useState(true);
  const th = (0.16 + i * 0.09).toFixed(2);
  const vis = `clamp(0, calc(var(--p,0)*4 - ${th}), 1)`;
  return (
    <div data-row data-hover style={{ position: "relative", borderTop: "1px solid #242424", opacity: vis, transform: `translateY(calc((1 - ${vis})*40px))`, perspective: 1200 }}>
      <div className="bflip">
        {/* 앞면 — 영문 타이틀 */}
        <div className="bface" style={{ display: "flex", alignItems: "center", gap: "2.5vw", padding: "2.2vh 3.5vw", color: "#f4f3f0" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, width: "3ch", flex: "none", opacity: 0.55 }}>{b.no}</span>
          <span style={{ fontFamily: ANTON, fontSize: "clamp(26px,3.9vw,64px)", lineHeight: 1, transform: "skewY(var(--skew,0deg))" }}>{b.name}</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", opacity: 0.55 }}>{b.meta}</span>
        </div>
        {/* 뒷면 — 라임 + 한글 정보 */}
        <div className="bface" style={{ position: "absolute", inset: 0, transform: "rotateX(180deg)", background: ACC, color: "#0a0a0a", display: "flex", alignItems: "center", gap: "2.5vw", padding: "2.2vh 3.5vw" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, width: "3ch", flex: "none", opacity: 0.6 }}>{b.no}</span>
          <span style={{ fontSize: "clamp(17px,2vw,26px)", fontWeight: 800, letterSpacing: "-.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {b.ko}
            <span style={{ fontWeight: 500, opacity: 0.72, marginLeft: 16, fontSize: "clamp(13px,1.4vw,17px)", letterSpacing: "-.005em" }}>{b.koDesc}</span>
          </span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", opacity: 0.55, flex: "none" }}>{b.name}</span>
        </div>
      </div>
      <span className="glass-d glassy" data-glass-track style={{ position: "absolute", right: "9vw", top: "50%", width: 270, height: 175, zIndex: 1, pointerEvents: "none", opacity: "var(--th,0)", transform: "translateY(-50%) perspective(750px) rotateY(calc(-24deg + var(--th,0)*10deg)) rotateX(7deg)", transition: "opacity .28s ease,transform .38s cubic-bezier(.2,.7,.2,1)", overflow: "hidden", borderRadius: 14 }}>
        {b.shot && shotOk ? (
          <img src={b.shot} alt="" onError={() => setShotOk(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <WireShape type={b.shape} />
        )}
        <span style={{ position: "absolute", left: 10, bottom: 8, fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", background: "#0a0a0a", color: ACC, padding: "4px 7px", zIndex: 2 }}>
          {b.shot && shotOk ? `FIG.${b.no} — ${b.name}` : `OBJ.${b.no} — ${b.cap}`}
        </span>
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AI 챗봇 (기존 기능 유지 — 새 룩으로 재스타일)
// ─────────────────────────────────────────────────────────────
const Chatbot = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "안녕하세요. 양순민 포트폴리오 어시스턴트입니다. 경력·프로젝트·스킬, 무엇이든 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const PROFILE = `양순민 프로필:
- 이름: 양순민, 남성, 39세, 부산
- 이메일: swatsoonmin@gmail.com
- 학력: 경성대학교 경영학과 졸업(편입)
- 자격증: 웹디자인개발기능사(2024.09)
- PM/PO 경력: 약 3년 (도미노 서비스업 포함 전체 사회경력 14년+)

[경력]
1. ㈜핸디 (2024.08~2025.08) 개발1팀 이사/팀장, PO
   - 애자일 스크럼 도입, JIRA 관리, Figma UI/UX, AI 자동화
   - 프로젝트: 자체 CMS 기획 및 UI/UX디자인, 부산경상대 창업가꿈, 아르피나 수영장 선착순예약시스템(새벽 오프라인 줄서기의 온라인 전환), 허치슨 리뉴얼, 부산경상대 메이커스페이스, 울산과학대 EPL
2. ㈜아리모아 (2022.12~2024.07) 기획팀 과장 PM/PL
   - 1년반만에 사원→대리→과장 진급, 15개 계약건 수행
   - 프로젝트: 경성대LINC3.0(11개프로그램), 한국기술교육대 산학협력단, 상지건축 리뉴얼, 울산과학대 통합(40개+), 동아대 고도화, 대동대 통합(30개, 착수보고회 재학생 의견 반영), 영렘브란트, 한진 리뉴얼
3. 도미노피자 (2009.09~2021.05) 매장매니저 12년 - 고객중심사고 체득

[핵심역량] 합리적판단, 리스크관리, 문서화&소통, AI·업무자동화
[문제해결사례]
1. 문서화시스템구축: 워터폴환경 개선
2. 2개월내 11개프로그램: 공통프로세스 설계
3. 스코프크리프 대응: 회의록 문서화
4. 1인PM 60개사이트: WBS·체계적 문서화·팀원 케어로 연기0건
5. 자체CMS 설계: 처음부터 IA/스토리보드/플로우차트/UI설계까지 전과정 주도
6. 아르피나 선착순 예약: 새벽 오프라인 줄서기→온라인 전환, 동시접속 대응 설계

[스킬] 기획,JIRA,Notion,Figma,HTML/CSS/JS,Claude Code,ChatGPT,n8n,Flutter,Supabase,Agile/Scrum,WBS
[AI·업무자동화] n8n으로 회의록→할일추출→Notion정리→Discord알림, 스크린샷 OCR→인사이트DB 등 반복업무 자동화 워크플로우 설계·구현
[수상] 경성대 최우수상(2018), KT&G 팀워크상(2011)
[성격] "성격좋은꼰대" - 원칙+유연함, 34세에 웹기획 전향, 바이브코딩으로 앱개발중

[개인 개발 프로젝트-바이브코딩] 기획에 머무르지 않고 직접 설계·개발한 앱/서비스 10개+: AI 업무자동화(n8n 워크플로우), AI Insight OS(개인용 AI Knowledge OS 설계·35개 스펙문서), MountainOn(등산 기록 앱,Flutter), WebOps Builder(여러 서비스 운영·배포 관리 플랫폼,Next.js), 콘텐츠 서비스 플랫폼(웹+관리자CMS,운영중), 부기온(정서케어 앱,4인팀 기여 최다), 모의톡(AI 셀프점검 웹), 북잇다(독서 소셜앱,출시 직전), Flowon 홈페이지(3D 인터랙티브 웹), 시민의 턴(Unity 2D 의사결정 게임). "기획하고 직접 만들어 검증까지 하는 실행형 PO"`;

  const send = async () => {
    const q = input.trim(); if (!q || loading) return;
    const newMsgs = [...messages, { role: "user", content: q }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 1000,
          system: `당신은 양순민의 포트폴리오 AI 어시스턴트입니다. 아래 프로필 정보를 바탕으로 친절하고 간결하게 한국어로 답변하세요. 3~5문장 이내. 프로필에 없는 내용은 "해당 정보는 포트폴리오에 포함되어 있지 않습니다"라고 안내.\n\n${PROFILE}`,
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[chat] API error:", res.status, data);
        setMessages((p) => [...p, { role: "assistant", content: `오류가 발생했습니다. (${res.status})` }]);
      } else {
        setMessages((p) => [...p, { role: "assistant", content: data.content?.map((c: { text?: string }) => c.text || "").join("") || "응답을 가져오지 못했습니다." }]);
      }
    } catch (e) {
      console.error("[chat] fetch error:", e);
      setMessages((p) => [...p, { role: "assistant", content: "네트워크 오류가 발생했습니다. 다시 시도해 주세요." }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div className="glass-d glassy" data-glass-track style={{ position: "fixed", bottom: 92, right: 24, width: 380, maxWidth: "calc(100vw - 48px)", height: 520, maxHeight: "calc(100vh - 140px)", zIndex: 195, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 16 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #2c2c2c", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", color: "#f4f3f0" }}>
          ASK — PORTFOLIO AI <span style={{ color: ACC }}>●</span>
        </div>
        <button onClick={onClose} data-hover style={{ background: "none", border: "none", color: "#777", fontSize: 16, cursor: "pointer", fontFamily: MONO }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "10px 14px", background: m.role === "user" ? ACC : "#1a1a1a", color: m.role === "user" ? "#0a0a0a" : "#ccc", fontSize: 13, lineHeight: 1.7, wordBreak: "break-word", border: m.role === "user" ? "none" : "1px solid #2c2c2c", fontWeight: m.role === "user" ? 600 : 400 }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "10px 16px", background: "#1a1a1a", border: "1px solid #2c2c2c", fontFamily: MONO, fontSize: 11, color: ACC }}>…</div>
          </div>
        )}
        <div ref={msgEnd} />
      </div>
      {messages.length <= 1 && (
        <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["경력을 요약해주세요", "핵심 강점은?", "어떤 걸 만들었나요?"].map((q, i) => (
            <button key={i} onClick={() => setInput(q)} data-hover style={{ padding: "6px 12px", background: "#1a1a1a", border: "1px solid #2c2c2c", fontSize: 12, color: ACC, cursor: "pointer", fontFamily: "inherit" }}>{q}</button>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #2c2c2c", display: "flex", gap: 8, flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="질문을 입력하세요…" style={{ flex: 1, padding: "10px 12px", background: "#1a1a1a", border: "1px solid #2c2c2c", color: "#f4f3f0", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={loading || !input.trim()} data-hover style={{ padding: "10px 16px", background: input.trim() ? ACC : "#1a1a1a", border: "none", color: input.trim() ? "#0a0a0a" : "#555", fontFamily: MONO, fontSize: 12, cursor: input.trim() ? "pointer" : "default", letterSpacing: ".1em" }}>SEND</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
const Portfolio = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [qrOk, setQrOk] = useState(true);
  // 프로젝트 목록(sub)이 있는 행은 기본 펼침 — 스크롤만 해도 전체 이력이 보이게
  const [openArcs, setOpenArcs] = useState<number[]>([]); // 전부 닫힌 채 시작 — 인쇄 장면을 보여주기 위해
  const toggleArc = (i: number) => setOpenArcs((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  // 영수증 자동 인쇄 — 각 "행"이 화면 상단 65% 안으로 확실히 들어온 순간 그 행을 인쇄.
  // (섹션 단위 트리거는 사용자가 보기도 전에 인쇄가 끝나는 문제 → 행 단위로 교체)
  // 여러 행이 동시에 진입하면 0.6초 간격으로 직렬화해 순차로 뽑힌다.
  useEffect(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-arc-row]"));
    if (!rows.length) return;
    const done = new Set<number>();
    let lastAt = 0;
    const timers: number[] = [];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = Number((e.target as HTMLElement).dataset.arcRow);
        if (done.has(i)) return;
        done.add(i);
        io.unobserve(e.target);
        const now = performance.now();
        const at = Math.max(now, lastAt + 600);
        lastAt = at;
        timers.push(window.setTimeout(() => setOpenArcs((p) => (p.includes(i) ? p : [...p, i])), at - now));
      });
    }, { rootMargin: "0px 0px -35% 0px" });
    rows.forEach((r) => io.observe(r));
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const scroller = root.querySelector<HTMLElement>("[data-scroll-root]");
    const dot = root.querySelector<HTMLElement>("[data-cursor]");
    const ring = root.querySelector<HTMLElement>("[data-cursor-ring]");
    const L = (a: number, b: number, t: number) => a + (b - a) * t;

    const S = {
      mx: 0, my: 0, emx: 0, emy: 0,
      px: -200, py: -200, cx: -200, cy: -200, rx: -200, ry: -200,
      cs: 1, ecs: 1, lastSt: undefined as number | undefined, dashSt: 0, skew: 0,
      curRow: null as HTMLElement | null,
      introDone: false, raf: 0, dead: false, opInteracted: false,
      prevPx: undefined as number | undefined, prevPy: undefined as number | undefined, opAcc: 0,
      cardEntT0: 0, // 유리 카드 입장 애니메이션 시작 시각 (인트로 완료 시점)
      dash: null as null | { x: number; y: number; vx: number; vy: number; r: number },
    };

    root.style.setProperty("--acc", ACC);
    root.style.setProperty("--tilt", String(CONFIG.tiltStrength));

    const onMove = (e: MouseEvent) => {
      S.px = e.clientX; S.py = e.clientY;
      S.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      S.my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const onOver = (e: MouseEvent) => {
      const t = e.target instanceof HTMLElement ? e.target : null;
      S.cs = t && t.closest("[data-hover]") ? 3.2 : 1;
      const row = t ? (t.closest("[data-row]") as HTMLElement | null) : null;
      if (row !== S.curRow) {
        if (S.curRow) S.curRow.style.setProperty("--th", "0");
        if (row) row.style.setProperty("--th", "1");
        S.curRow = row;
      }
    };
    document.addEventListener("mouseover", onOver);

    const heroCard = root.querySelector<HTMLElement>("[data-hero-card]");
    const heroScene = heroCard ? heroCard.closest<HTMLElement>("[data-scene]") : null;

    const loopBody = () => {
      const vh = window.innerHeight;
      const now = performance.now();
      S.emx = L(S.emx, S.mx, 0.06); S.emy = L(S.emy, S.my, 0.06);
      root.style.setProperty("--emx", S.emx.toFixed(4));
      root.style.setProperty("--emy", S.emy.toFixed(4));
      S.cx = L(S.cx, S.px, 0.55); S.cy = L(S.cy, S.py, 0.55);
      S.rx = L(S.rx, S.px, 0.16); S.ry = L(S.ry, S.py, 0.16);
      S.ecs = L(S.ecs, S.cs, 0.18);
      if (dot) dot.style.transform = `translate3d(${S.cx.toFixed(1)}px,${S.cy.toFixed(1)}px,0)`;
      if (ring) ring.style.transform = `translate3d(${S.rx.toFixed(1)}px,${S.ry.toFixed(1)}px,0) scale(${(0.35 + S.ecs * 0.65).toFixed(3)})`;
      root.style.setProperty("--cxp", ((S.px / window.innerWidth) * 100).toFixed(2));
      root.style.setProperty("--cyp", ((S.py / window.innerHeight) * 100).toFixed(2));

      // 씬 진행도
      root.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const total = r.height - vh;
        const p = el.getAttribute("data-scene") === "pin" && total > 4
          ? Math.min(1, Math.max(0, -r.top / total))
          : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        el.style.setProperty("--p", p.toFixed(4));
      });

      // 스크롤 속도 → 스큐
      if (scroller) {
        const st = scroller.scrollTop;
        const v = st - (S.lastSt ?? st);
        S.lastSt = st;
        if (!reduceMotion) {
          S.skew = L(S.skew, Math.max(-6, Math.min(6, v * 0.09)), 0.12);
          root.style.setProperty("--skew", S.skew.toFixed(3) + "deg");
        }
        const max = scroller.scrollHeight - scroller.clientHeight;
        root.style.setProperty("--sp", max > 0 ? Math.min(1, st / max).toFixed(4) : "0");
      }

      // 카운트업
      root.querySelectorAll<HTMLElement & { _cDone?: boolean }>("[data-count]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (el._cDone || r.top > vh * 0.88 || r.bottom < 0) return;
        el._cDone = true;
        const target = parseInt(el.getAttribute("data-count") || "0", 10);
        const t0 = performance.now(), dur = 900;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      // 시계 (부산)
      const ck = root.querySelector<HTMLElement>("[data-clock]");
      if (ck) {
        const txt = "LOCAL " + new Date().toLocaleTimeString("en-GB", { hour12: false }) + " KST";
        if (ck.textContent !== txt) ck.textContent = txt;
      }

      // 라벨 스크램블
      if (!reduceMotion) root.querySelectorAll<HTMLElement & { _scDone?: boolean }>("[data-scramble]").forEach((el) => {
        if (el._scDone) return;
        const r = el.getBoundingClientRect();
        if (r.top > vh * 0.92 || r.bottom < 0) return;
        el._scDone = true;
        const orig = el.textContent || "";
        const CH = "#/\\|<>+=*%@&0123456789ABCDEF";
        const t0 = performance.now(), dur = 620;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const lock = Math.floor(orig.length * p);
          let out = orig.slice(0, lock);
          for (let i = lock; i < orig.length; i++) out += orig[i] === " " ? " " : CH[Math.floor(Math.random() * CH.length)];
          el.textContent = out;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = orig;
        };
        requestAnimationFrame(tick);
      });

      // 라인 리빌
      root.querySelectorAll<HTMLElement & { _rDone?: boolean }>("[data-reveal]").forEach((el) => {
        if (el._rDone) return;
        const r = el.getBoundingClientRect();
        if (r.top > vh * 0.9 || r.bottom < 0) return;
        el._rDone = true;
        const delay = parseInt(el.getAttribute("data-reveal") || "0", 10);
        el.style.transition = `transform .8s cubic-bezier(.2,.75,.2,1) ${delay}ms, opacity .55s ease ${delay}ms`;
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      });

      // 커서 이동량 — 스포트라이트 "실제 사용" 판정용
      const mvd = Math.hypot(S.px - (S.prevPx ?? S.px), S.py - (S.prevPy ?? S.py));
      S.prevPx = S.px; S.prevPy = S.py;

      // 글자 물리 (pop3d / wave / repel)
      const K = CONFIG.repelStrength;
      const mode = CONFIG.letterFx;
      const R = mode === "pop3d" ? 210 : mode === "wave" ? 200 : 150;
      type LtrState = { x: number; y: number; r: number; s: number; rx: number; ry: number; z: number };
      if (S.introDone && !reduceMotion && mode !== "light")
        root.querySelectorAll<HTMLElement & { _s?: LtrState }>("[data-ltr]").forEach((el) => {
          const st = el._s || (el._s = { x: 0, y: 0, r: 0, s: 1, rx: 0, ry: 0, z: 0 });
          {
            const rc = el.getBoundingClientRect();
            const dx0 = rc.left + rc.width / 2 - S.px;
            const dy0 = rc.top + rc.height / 2 - S.py;
            const d = Math.hypot(dx0, dy0) || 1;
            let tx = 0, ty = 0, tr = 0, ts = 1, trx = 0, tryy = 0, tz = 0;
            if (d < R && K > 0) {
              const f = 1 - d / R;
              if (mode === "pop3d") {
                trx = (dy0 / d) * f * 30 * K;
                tryy = -(dx0 / d) * f * 38 * K;
                tz = f * f * 52 * K;
              } else if (mode === "wave") {
                const fe = f * f;
                tx = (dx0 / d) * fe * 12 * K; ty = -fe * 30 * K;
                tr = -(dx0 / d) * f * 10 * K; ts = 1 + fe * 0.16 * K;
              } else {
                const fo = f * f * 46 * K;
                tx = (dx0 / d) * fo; ty = (dy0 / d) * fo; tr = (dx0 / d) * f * 8;
              }
            }
            st.x = L(st.x, tx, 0.16); st.y = L(st.y, ty, 0.16); st.r = L(st.r, tr, 0.16); st.s = L(st.s, ts, 0.16);
            st.rx = L(st.rx, trx, 0.14); st.ry = L(st.ry, tryy, 0.14); st.z = L(st.z, tz, 0.14);
          }
          if (Math.abs(st.x) > 0.05 || Math.abs(st.y) > 0.05 || Math.abs(st.r) > 0.05 || Math.abs(st.s - 1) > 0.002 || Math.abs(st.rx) > 0.05 || Math.abs(st.ry) > 0.05 || Math.abs(st.z) > 0.05) {
            el.style.transform = `perspective(520px) translate3d(${st.x.toFixed(2)}px,${st.y.toFixed(2)}px,${st.z.toFixed(2)}px) rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg) rotate(${st.r.toFixed(2)}deg) scale(${st.s.toFixed(3)})`;
          } else if (el.style.transform) {
            el.style.transform = "";
          }
        });

      // 'light' 모드: 커서가 조명 — 계단 그림자 방향
      type ExtState = { base: string; colors: string[]; lx: number; ly: number };
      root.querySelectorAll<HTMLElement & { _ext?: ExtState; _lightOn?: boolean }>("[data-split]").forEach((el) => {
        const raw = el.style.textShadow;
        if (!el._ext && raw) {
          const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
          el._ext = { base: raw, colors: parts.map((p) => p.split(" ").pop() || ""), lx: 0.7, ly: 0.7 };
        }
        if (!el._ext) return;
        if (mode !== "light") {
          if (el._lightOn) { el.style.textShadow = el._ext.base; el._lightOn = false; }
          return;
        }
        const rc = el.getBoundingClientRect();
        const dx = rc.left + rc.width / 2 - S.px, dy = rc.top + rc.height / 2 - S.py;
        const d = Math.hypot(dx, dy) || 1;
        el._ext.lx = L(el._ext.lx, dx / d, 0.1);
        el._ext.ly = L(el._ext.ly, dy / d, 0.1);
        let s = "";
        for (let i = 0; i < el._ext.colors.length; i++) {
          s += (i ? "," : "") + (el._ext.lx * 2.2 * (i + 1)).toFixed(1) + "px " + (el._ext.ly * 2.2 * (i + 1)).toFixed(1) + "px 0 " + el._ext.colors[i];
        }
        el.style.textShadow = s;
        el._lightOn = true;
      });

      // 히어로 격자 캘리퍼 + 좌표 슬롯 롤
      root.querySelectorAll<HTMLElement>("[data-cell]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const lx = S.px - r.left, ly = S.py - r.top;
        el.style.setProperty("--gx", Math.floor(lx / 72) * 72 + "px");
        el.style.setProperty("--gy", Math.floor(ly / 72) * 72 + "px");
        const c = el.querySelector<HTMLElement & { _target?: string; _lock?: number }>("[data-coord]");
        if (c) {
          const target = String(Math.max(0, Math.floor(lx / 72))).padStart(2, "0") + " × " + String(Math.max(0, Math.floor(ly / 72))).padStart(2, "0");
          if (c._target !== target) { c._target = target; c._lock = performance.now() + 240; }
          if (performance.now() < (c._lock || 0)) {
            c.textContent = target.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
          } else if (c.textContent !== target) {
            c.textContent = target;
          }
        }
      });

      // 스포트라이트 씬 — 커서가 "실제로 움직이기" 전엔 조명이 스스로 훑고 다님 (유도 + 모바일 대응)
      root.querySelectorAll<HTMLElement>("[data-light]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const inside = S.px >= r.left && S.px <= r.right && S.py >= r.top && S.py <= r.bottom;
        if (inside) {
          S.opAcc += mvd; // 우연히 커서가 걸쳐 있는 건 무시, 누적 이동 140px부터 인계
          if (S.opAcc > 140) S.opInteracted = true;
        }
        let lx: number, ly: number;
        if (S.opInteracted) {
          lx = S.px - r.left; ly = S.py - r.top;
        } else {
          const tt = performance.now() / 1000;
          lx = r.width * (0.5 + 0.34 * Math.sin(tt * 0.6));
          ly = r.height * (0.48 + 0.26 * Math.cos(tt * 0.43));
        }
        el.style.setProperty("--lx", lx.toFixed(0) + "px");
        el.style.setProperty("--ly", ly.toFixed(0) + "px");
        const hint = el.querySelector<HTMLElement>("[data-op-hint]");
        if (hint && S.opInteracted && hint.style.opacity !== "0") {
          hint.style.animation = "none"; // 펄스 정지 후 페이드아웃 (애니메이션이 opacity를 덮지 않게)
          hint.style.opacity = "0";
        }
      });

      // 마키
      if (!reduceMotion) root.querySelectorAll<HTMLElement & { _mq?: { x: number; v: number } }>("[data-marquee]").forEach((el) => {
        const m = el._mq || (el._mq = { x: 0, v: 1 });
        const hovered = !!el.parentElement && el.parentElement.matches(":hover");
        m.v = L(m.v, hovered ? 0.18 : 1, 0.08);
        m.x -= m.v * 1.1;
        const half = el.scrollWidth / 2;
        if (half > 0 && -m.x >= half) m.x += half;
        el.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0)`;
      });

      // 라임 대시 컴패니언
      const dEl = root.querySelector<HTMLElement>("[data-dash]");
      if (dEl) {
        const show = CONFIG.companion && !reduceMotion;
        dEl.style.display = show ? "block" : "none";
        if (show) {
          const vw = window.innerWidth;
          const D = S.dash || (S.dash = { x: vw * 0.78, y: vh * 0.24, vx: 0.5, vy: 0.3, r: 0 });
          const sv = (S.lastSt ?? 0) - S.dashSt;
          S.dashSt = S.lastSt ?? 0;
          D.vy -= Math.max(-14, Math.min(14, sv * 0.05));
          const ddx = D.x + 27 - S.px, ddy = D.y + 5.5 - S.py;
          const dd = Math.hypot(ddx, ddy);
          if (dd < 90 && dd > 0.01) {
            const f = (1 - dd / 90) * 5.5;
            D.vx += (ddx / dd) * f; D.vy += (ddy / dd) * f;
          }
          D.x += D.vx; D.y += D.vy;
          if (D.x < 0) { D.x = 0; D.vx = Math.abs(D.vx) * 0.85; }
          if (D.x > vw - 54) { D.x = vw - 54; D.vx = -Math.abs(D.vx) * 0.85; }
          if (D.y < 0) { D.y = 0; D.vy = Math.abs(D.vy) * 0.85; }
          if (D.y > vh - 11) { D.y = vh - 11; D.vy = -Math.abs(D.vy) * 0.85; }
          D.vx *= 0.985; D.vy *= 0.985;
          if (Math.hypot(D.vx, D.vy) < 0.3) { D.vx += (Math.random() - 0.5) * 0.12; D.vy += (Math.random() - 0.5) * 0.12; }
          D.r = L(D.r, Math.max(-28, Math.min(28, D.vx * 3.2)), 0.12);
          dEl.style.transform = `translate3d(${D.x.toFixed(1)}px,${D.y.toFixed(1)}px,0) rotate(${D.r.toFixed(1)}deg)`;
        }
      }

      // 유리 스펙큘러 — 커서 위치를 유리 요소 로컬 좌표로 전달 (라임 하이라이트)
      root.querySelectorAll<HTMLElement>("[data-glass-track]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh || r.width === 0) return;
        el.style.setProperty("--hx", (S.px - r.left).toFixed(0) + "px");
        el.style.setProperty("--hy", (S.py - r.top).toFixed(0) + "px");
      });
      if (ring) ring.classList.toggle("hot", S.cs > 1);

      // 자석
      root.querySelectorAll<HTMLElement & { _m?: { x: number; y: number } }>("[data-magnetic]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = S.px - (r.left + r.width / 2), dy = S.py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        const m = el._m || (el._m = { x: 0, y: 0 });
        m.x = L(m.x, d < 130 ? dx * 0.32 : 0, 0.18);
        m.y = L(m.y, d < 130 ? dy * 0.32 : 0, 0.18);
        el.style.transform = `translate(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px)`;
      });

      // 히어로 유리 카드 — 인트로 후 입장 + 스크롤 걷어내기 퇴장 (우하단으로, 틸트 심화)
      if (heroCard && heroScene) {
        if (S.introDone && !S.cardEntT0) S.cardEntT0 = now;
        let enE = 1;
        if (!reduceMotion) {
          const en = S.cardEntT0 ? Math.max(0, Math.min(1, (now - S.cardEntT0 - 300) / 750)) : 0;
          enE = 1 - Math.pow(1 - en, 3);
        }
        const hp = parseFloat(heroScene.style.getPropertyValue("--p") || "0");
        const ex = Math.max(0, Math.min(1, (hp - 0.16) / 0.38));
        const exE = ex * ex * ex;
        const ox = (1 - enE) * window.innerWidth * 0.18 + exE * window.innerWidth * 0.55 + S.emx * 10;
        const oy = (1 - enE) * vh * 0.22 + exE * vh * 0.5 + S.emy * 6;
        heroCard.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0) rotate(${(-5 - exE * 10).toFixed(2)}deg)`;
      }

      // WebGL 유리 오브제 렌더 (HeroGlass가 등록한 틱 — rAF 루프는 이거 하나)
      if (glassTick) glassTick(S.emx, S.emy, S.introDone);
    };
    // 한 프레임에서 예외가 나도 rAF 루프는 죽지 않는다 (루프 사망 = 페이지 전체 정지)
    let loopErrLogged = false;
    const loop = () => {
      if (S.dead) return;
      try { loopBody(); } catch (err) { if (!loopErrLogged) { loopErrLogged = true; console.error(err); } }
      S.raf = requestAnimationFrame(loop);
    };
    S.raf = requestAnimationFrame(loop);

    // ── 인트로: 카운트업 → 글자 낙하 → 제자리 복귀 ──
    // 재생 완료 시점에만 가드를 세운다 (StrictMode 이중 마운트가 인트로를 건너뛰지 않게)
    const runIntro = () => {
      const ov = root.querySelector<HTMLElement>("[data-intro]");
      const num = root.querySelector<HTMLElement>("[data-intro-num]");
      if (!ov || introPlayed || introSeqStarted || reduceMotion) {
        if (ov) ov.style.display = "none";
        // 스킵 시 글자 원위치 강제 복원 — HMR/재마운트로 흩어진 상태(prepAssemble)가 박제되는 것 방지
        root.querySelectorAll<HTMLElement>("[data-split] [data-ltr]").forEach((el) => {
          el.style.transition = ""; el.style.opacity = ""; el.style.transform = "";
        });
        S.introDone = true;
        return;
      }
      introSeqStarted = true;
      startedIntroHere = true;
      const t0 = performance.now(), DUR = 1400;
      const tick = (t: number) => {
        if (S.dead) return; // 언마운트된 인스턴스의 잔여 틱 정지
        const p = Math.min(1, (t - t0) / DUR);
        const e = 1 - Math.pow(1 - p, 3);
        root.style.setProperty("--ip", e.toFixed(4));
        if (num) num.textContent = String(Math.round(e * 100));
        if (p < 1) requestAnimationFrame(tick);
        else finishIntro(ov);
      };
      requestAnimationFrame(tick);
    };

    let startedIntroHere = false; // StrictMode: 미완주 인스턴스가 정리될 때 실행 가드 반납

    // 인트로 "조립" — 흩어져 있던 글자 조각들이 날아와 헤드라인으로 지어짐 (I BUILD)
    const prepAssemble = () => {
      const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-split] [data-ltr]"));
      const vw = window.innerWidth, vh = window.innerHeight;
      letters.forEach((el) => {
        const dx = (Math.random() - 0.5) * vw * 0.7;
        const dy = (Math.random() - 0.5) * vh * 0.65;
        const rot = (Math.random() - 0.5) * 140;
        const sc = 0.5 + Math.random() * 0.4;
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = `translate3d(${dx.toFixed(0)}px,${dy.toFixed(0)}px,0) rotate(${rot.toFixed(0)}deg) scale(${sc.toFixed(2)})`;
      });
      return letters;
    };

    const assemble = (letters: HTMLElement[]) => {
      if (!letters.length) { S.introDone = true; return; }
      letters.forEach((el, i) => {
        const d = i * 16 + Math.random() * 140;
        setTimeout(() => {
          if (S.dead) return;
          el.style.transition = "transform .8s cubic-bezier(.22,1.35,.32,1), opacity .3s ease";
          el.style.opacity = "1";
          el.style.transform = "";
        }, d);
      });
      setTimeout(() => {
        if (S.dead) return;
        letters.forEach((el) => { el.style.transition = ""; el.style.opacity = ""; });
        S.introDone = true;
      }, letters.length * 16 + 1000);
    };

    const finishIntro = (ov: HTMLElement) => {
      introPlayed = true; // 완주한 경우에만 재생 가드
      const letters = prepAssemble();
      setTimeout(() => { ov.style.transform = "translate3d(0,-101%,0)"; }, 140);
      setTimeout(() => { assemble(letters); }, 340);
      setTimeout(() => { ov.style.display = "none"; }, 980);
    };

    runIntro();

    return () => {
      S.dead = true;
      if (startedIntroHere && !introPlayed) introSeqStarted = false; // 미완주 시 가드 반납
      cancelAnimationFrame(S.raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, [reduceMotion]);

  const label: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: ".16em" };
  const heroLine: React.CSSProperties = { fontFamily: ANTON, fontSize: "clamp(52px,9.6vw,175px)", lineHeight: 0.92, textTransform: "uppercase" };

  return (
    <div
      ref={rootRef}
      data-root
      style={{ "--acc": ACC, position: "fixed", inset: 0, background: "#0a0a0a", color: "#f4f3f0", fontFamily: "'Pretendard Variable',Pretendard,sans-serif", cursor: reduceMotion ? "auto" : "none", overflow: "hidden" } as React.CSSProperties}
    >
      <style>{`
        html,body{margin:0;padding:0;height:100%;background:#0a0a0a;overscroll-behavior:none}
        *{box-sizing:border-box}
        a{color:inherit;text-decoration:none}
        a:hover{color:${ACC}}
        ::selection{background:${ACC};color:#0a0a0a}
        @media (pointer:coarse){[data-cursor],[data-cursor-ring],[data-op-hint]{display:none!important}[data-root]{cursor:auto!important}}
        @keyframes opPulse{0%,100%{opacity:1}50%{opacity:.4}}

        /* ── 유리 시스템: 재질은 젖빛, 거동은 리퀴드, 라임은 하이라이트에만 ── */
        .glass-d{background:linear-gradient(135deg,rgba(22,22,22,.52),rgba(22,22,22,.34));
          backdrop-filter:blur(14px) saturate(1.12);-webkit-backdrop-filter:blur(14px) saturate(1.12);
          border:1px solid rgba(255,255,255,.16);
          box-shadow:0 18px 50px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.14)}
        .glassy{position:relative;overflow:hidden}
        .glassy::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;
          background:radial-gradient(130px circle at var(--hx,-999px) var(--hy,-999px),rgba(200,255,22,.18),rgba(255,255,255,.10) 45%,transparent 75%)}

        /* 리퀴드 렌즈 커서 */
        .lens{animation:blobMorph 7s ease-in-out infinite}
        .lens.hot{box-shadow:0 0 26px rgba(200,255,22,.28), inset 0 1px 0 rgba(255,255,255,.4)}
        @keyframes blobMorph{
          0%,100%{border-radius:52% 48% 55% 45% / 48% 55% 45% 52%}
          33%{border-radius:46% 54% 44% 56% / 56% 44% 58% 42%}
          66%{border-radius:57% 43% 50% 50% / 44% 57% 43% 56%}
        }

        /* 리퀴드 라임 필 버튼 */
        .liquid-btn{position:relative;overflow:hidden;transition:color .3s,border-color .3s}
        .liquid-btn::before{content:"";position:absolute;left:-12%;right:-12%;bottom:-45%;height:165%;z-index:0;
          background:${ACC};border-radius:44% 52% 0 0 / 95% 100% 0 0;
          transform:translateY(101%);transition:transform .55s cubic-bezier(.2,.7,.2,1)}
        .liquid-btn:hover::before{transform:translateY(16%)}
        .liquid-btn:hover{color:#0a0a0a!important;border-color:${ACC}!important}
        .liquid-btn>span{position:relative;z-index:2}

        /* 블루프린트 와이어프레임 도형 */
        .w3{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:640px}
        .w3spin{width:100px;height:100px;position:relative;transform-style:preserve-3d;
          animation:w3spin 10s linear infinite;animation-play-state:paused}
        [data-row]:hover .w3spin{animation-play-state:running}
        @keyframes w3spin{from{transform:rotateX(-16deg) rotateY(0deg)}to{transform:rotateX(-16deg) rotateY(360deg)}}

        @keyframes opBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes heroFloatA{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(1.6deg)}}
        @keyframes heroFloatB{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(16px) rotate(-1.8deg)}}

        /* 히어로 타이포 — 커서에 반응하는 물리 글자 */
        [data-split]{user-select:none;-webkit-user-select:none}
        /* 좁은 화면에선 히어로 오브제 숨김 */
        @media (max-width:900px){.gchunk-wrap,.hero-obj{display:none}}

        /* 영수증 펄럭임 — 피드 직후 크게 2회, 이후 미풍에 걸린 듯 미세하게 상시 흔들림 (입체감) */
        .paper-flutter{animation:paperWave 1.9s ease-in-out 1.75s 2, paperIdle 5.6s ease-in-out 5.55s infinite}
        @keyframes paperWave{0%,100%{transform:rotateX(0deg)}28%{transform:rotateX(7deg)}62%{transform:rotateX(-4.5deg)}}
        @keyframes paperIdle{0%,100%{transform:rotateX(0deg) rotate(0deg)}32%{transform:rotateX(2.6deg) rotate(.18deg)}66%{transform:rotateX(-2deg) rotate(-.14deg)}}
        /* 인쇄 LED — 피드 동안 슬롯에서 라임 점멸 */
        .print-led{position:absolute;right:9px;top:3.5px;width:5px;height:5px;border-radius:50%;background:#3a3a3a}
        .print-led.on{animation:ledBlink 1.75s linear 1}
        @keyframes ledBlink{0%,15%,32%,47%,64%,79%{background:#C8FF16;box-shadow:0 0 7px rgba(200,255,22,.95)}16%,31%,48%,63%,80%,100%{background:#3a3a3a;box-shadow:none}}

        /* 행 플립 — 호버 시 행 전체가 젖혀지며 뒷면(라임+한글) 공개 */
        .bflip{position:relative;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.45,0,.22,1)}
        [data-row]:hover .bflip{transform:rotateX(180deg)}
        .bface{backface-visibility:hidden;-webkit-backface-visibility:hidden}

        @media (prefers-reduced-motion:reduce){.w3spin,.lens,[data-op-hint],.paper-flutter{animation:none!important}[aria-hidden] > div{animation:none!important}.bflip{transition:none!important}}
        .mono-btn{transition:border-color .25s,color .25s}
        .mono-btn:hover{border-color:${ACC}!important;color:${ACC}!important}
        .arc-row{transition:background .25s}
        .arc-row:hover{background:rgba(17,17,17,.04)}
        ::-webkit-scrollbar{width:0;height:0}
      `}</style>

      <div data-scroll-root style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>

        {/* ============ HERO ============ */}
        <section data-scene="pin" style={{ height: "240vh", position: "relative", background: "#f4f3f0", color: "#111" }}>
          <div data-cell style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(17,17,17,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(17,17,17,.07) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
            <div style={{ position: "absolute", left: 0, top: 0, zIndex: 1, width: 72, height: 72, background: "rgba(200,255,22,.2)", border: `1px solid ${ACC}`, transform: "translate3d(var(--gx,-200px),var(--gy,-200px),0)", transition: "transform .13s cubic-bezier(.2,.7,.2,1)", pointerEvents: "none" }}>
              <span data-coord style={{ position: "absolute", right: 5, bottom: 3, fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: "#111", opacity: 0.65 }} />
            </div>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(17,17,17,.08)", zIndex: 6 }}>
              <span style={{ position: "absolute", inset: 0, background: ACC, transform: "scaleX(var(--sp,0))", transformOrigin: "left", display: "block" }} />
            </div>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "26px 3.5vw", ...label, zIndex: 5 }}>
              <span>YANG SOONMIN — PORTFOLIO</span>
              <span style={{ color: "#666" }}>PM/PO · BUSAN · <span data-clock>LOCAL --:--:-- KST</span></span>
            </div>
            <div style={{ position: "absolute", top: 27, left: "50%", transform: "translateX(-50%)", fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: "#999", zIndex: 5 }}>TYPE IS PHYSICAL</div>
            <div data-hero-num style={{ position: "absolute", top: "4vh", right: "1.5vw", fontFamily: ANTON, fontSize: "46vh", lineHeight: 1, color: "transparent", WebkitTextStroke: "1.5px rgba(17,17,17,.13)", zIndex: 1, transform: "translateY(calc(var(--p,0)*-24vh))" }}>12/3</div>
            <div style={{ position: "absolute", left: "3.5vw", bottom: "12vh", zIndex: 2, transform: "perspective(950px) rotateX(calc(var(--emy,0)*var(--tilt,0)*4deg)) rotateY(calc(var(--emx,0)*var(--tilt,0)*-6deg))", transformStyle: "preserve-3d" }}>
              <div data-split style={{ ...heroLine, transform: "translateX(calc(var(--p,0)*-5vw))" }}>{split("12 YEARS ON THE FLOOR,")}</div>
              <div data-split style={{ ...heroLine, transform: "translateX(calc(var(--p,0)*3.5vw))" }}>{split("3 IN PRODUCT.")}</div>
              <div style={{ transform: "translateX(calc(var(--p,0)*-2vw))" }}>
                <span style={{ position: "relative", display: "inline-block", ...heroLine }}>
                  <span data-split style={{ whiteSpace: "pre" }}>{split("NOW ")}</span>
                  <span data-hero-dash style={{ color: ACC }}>—</span>
                  <span data-split style={{ whiteSpace: "pre" }}>{split(" I BUILD.")}</span>
                </span>
              </div>
            </div>
            <div data-magnetic data-hover style={{ position: "absolute", left: "3.5vw", bottom: "3.5vh", zIndex: 4, fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: "#555", border: "1px solid rgba(17,17,17,.25)", padding: "10px 16px" }}>SCROLL</div>

            {/* ── 히어로 오브제: WebGL 유리 (타이포 관통형 대형구 + 토러스 + 소형구) ──
                타이포(z2) 위, 유리 카드(z4) 아래 캔버스 한 장. 유리 안에서 글자가 굴절됨 */}
            <HeroGlass />

            {/* 유리 선언문 카드 — DOM 유지 (backdrop-filter). 입장·퇴장은 메인 루프가 구동
                ⚠ backdrop-filter 요소의 조상에 filter 금지 (backdrop-root 경계 → 유리 무효) */}
            <div data-hero-card style={{ position: "absolute", top: "42vh", right: "15vw", width: 370, zIndex: 4, pointerEvents: "none", transform: "rotate(-5deg)" }}>
              <div style={{ borderRadius: 22, padding: "24px 28px", background: "linear-gradient(150deg, rgba(255,255,255,.38), rgba(255,255,255,.10) 55%, rgba(255,255,255,.24))", backdropFilter: "blur(9px) saturate(1.12) brightness(1.03)", WebkitBackdropFilter: "blur(9px) saturate(1.12) brightness(1.03)", border: "1px solid rgba(255,255,255,.65)", boxShadow: "0 34px 70px rgba(17,17,17,.14), inset 0 1px 0 rgba(255,255,255,.75)" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: "#666", marginBottom: 13 }}>MANIFESTO</div>
                <div style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 500, color: "#2a2a28" }}>현장에서 12년, 프로덕트에서 3년.<br />이제는 직접 만들어 증명한다.</div>
                <b style={{ display: "block", marginTop: 10, fontSize: 15.5, color: "#111", fontWeight: 800 }}>"안 되는 건 없다, 방법이 다를 뿐."</b>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 01 PIVOT ============ */}
        <section data-scene="pin" style={{ height: "320vh", position: "relative", background: "#f4f3f0" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "#f4f3f0", color: "#111" }}>
              <div data-scramble style={{ position: "absolute", top: 26, left: "3.5vw", ...label, color: "#666" }}>01 — THE PIVOT</div>
              <div aria-hidden="true" style={{ position: "absolute", top: "5vh", right: "2vw", fontFamily: ANTON, fontSize: "26vh", lineHeight: 0.92, textTransform: "uppercase", color: "transparent", WebkitTextStroke: "1.5px rgba(17,17,17,.09)", textAlign: "right", transform: "translateY(calc(var(--p,0)*-6vh))" }}>THE<br />FLOOR</div>
              <div aria-hidden="true" style={{ position: "absolute", right: "3.5vw", top: "44vh", display: "flex", flexDirection: "column", gap: "4vh", alignItems: "flex-end" }}>
                {[2009, 2012, 2015, 2018, 2021].map((y) => (
                  <div key={y} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", color: "rgba(17,17,17,.38)" }}>{y}</span>
                    <span style={{ width: 34, height: 1, background: "rgba(17,17,17,.28)" }} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: "3.5vw", right: "3.5vw", bottom: "10vh", display: "flex", alignItems: "flex-end", gap: "4vw", flexWrap: "wrap" }}>
                <div data-count="12" style={{ fontFamily: ANTON, fontSize: "36vh", lineHeight: 0.82, transform: "scale(calc(.94 + var(--p,0)*.12))", transformOrigin: "bottom left" }}>12</div>
                <div style={{ paddingBottom: "3vh", maxWidth: "38ch" }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "#666" }}>2009 — 2021 · DOMINO'S PIZZA · STORE MANAGER</div>
                  <div style={{ overflow: "hidden" }}>
                    <div data-reveal="0" style={{ fontSize: "clamp(20px,2vw,30px)", fontWeight: 800, lineHeight: 1.4, marginTop: 14, transform: "translateY(110%)", opacity: 0 }}>12년을 현장에서 보냈다.<br />매출, 사람, 새벽의 매장.</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", inset: 0, background: "#0a0a0a", color: "#f4f3f0", clipPath: "inset(calc(100% - clamp(0%, calc((var(--p,0) - 0.18)*180%), 100%)) 0 0 0)" }}>
              <div data-scramble style={{ position: "absolute", top: 26, left: "3.5vw", ...label, color: "#777" }}>01 — THE PIVOT</div>
              <div aria-hidden="true" style={{ position: "absolute", top: "5vh", right: "2vw", fontFamily: ANTON, fontSize: "26vh", lineHeight: 0.92, textTransform: "uppercase", color: "transparent", WebkitTextStroke: "1.5px rgba(244,243,240,.09)", textAlign: "right", transform: "translateY(calc(var(--p,0)*-6vh))" }}>THE<br />PIVOT</div>
              <div aria-hidden="true" style={{ position: "absolute", right: "3.5vw", top: "44vh", display: "flex", flexDirection: "column", gap: "5vh", alignItems: "flex-end" }}>
                {[2022, 2023, 2024, 2025].map((y, i) => (
                  <div key={y} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", color: i === 3 ? ACC : "rgba(244,243,240,.4)" }}>{y}</span>
                    <span style={{ width: 34, height: 1, background: i === 3 ? ACC : "rgba(244,243,240,.3)" }} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: "3.5vw", right: "3.5vw", bottom: "10vh", display: "flex", alignItems: "flex-end", gap: "4vw", flexWrap: "wrap" }}>
                <div style={{ fontFamily: ANTON, fontSize: "36vh", lineHeight: 0.82, transform: "scale(calc(.94 + var(--p,0)*.12))", transformOrigin: "bottom left" }}>34</div>
                <div style={{ paddingBottom: "3vh", maxWidth: "40ch" }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: ACC }}>2022 — 2025 · ARIMOA PM/PL → HANDY PO·이사</div>
                  <div style={{ overflow: "hidden" }}>
                    <div data-reveal="80" style={{ fontSize: "clamp(20px,2vw,30px)", fontWeight: 800, lineHeight: 1.4, marginTop: 14, transform: "translateY(110%)", opacity: 0 }}>34세, 방법을 바꿨다.<br /><span style={{ color: ACC }}>—</span> 3년 만에 프로덕트를 책임지는 사람이 됐다.</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, height: 56, marginTop: -28, top: "calc(100% - clamp(0%, calc((var(--p,0) - 0.18)*180%), 100%))", backdropFilter: "blur(8px)", background: "linear-gradient(to bottom,transparent,rgba(200,255,22,.12),transparent)", pointerEvents: "none", opacity: "calc(clamp(0, calc((var(--p,0) - 0.18)*10), 1) * clamp(0, calc((0.78 - var(--p,0))*7), 1))" }} />
          </div>
        </section>

        {/* ============ 마키 ============ */}
        <div style={{ position: "relative", background: "#0a0a0a", color: "#f4f3f0", overflow: "hidden", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e" }}>
          <div data-marquee style={{ display: "flex", whiteSpace: "nowrap", willChange: "transform", padding: "2.2vh 0" }}>
            {[0, 1].map((k) => (
              <span key={k} style={{ fontFamily: ANTON, fontSize: "clamp(28px,3.4vw,58px)", lineHeight: 1, color: ACC, paddingRight: "3vw", flex: "none" }}>
                12 YEARS ON THE FLOOR <span style={{ color: "#3a3a3a", padding: "0 1.2vw" }}>—</span> 3 IN PRODUCT <span style={{ color: "#3a3a3a", padding: "0 1.2vw" }}>—</span> 10+ BUILDS <span style={{ color: "#3a3a3a", padding: "0 1.2vw" }}>—</span> NO EXCUSES, ONLY METHODS <span style={{ color: "#3a3a3a", padding: "0 1.2vw" }}>—</span>
              </span>
            ))}
          </div>
        </div>

        {/* ============ 02 BUILDS ============ */}
        <section data-scene="flow" style={{ position: "relative", background: "#0a0a0a", color: "#f4f3f0", padding: "16vh 0 10vh", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(244,243,240,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(244,243,240,.05) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(244,243,240,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(244,243,240,.22) 1px,transparent 1px)", backgroundSize: "72px 72px", WebkitMaskImage: "radial-gradient(320px circle at calc(var(--cxp,50)*1%) calc(var(--cyp,50)*1%),#000,transparent 74%)", maskImage: "radial-gradient(320px circle at calc(var(--cxp,50)*1%) calc(var(--cyp,50)*1%),#000,transparent 74%)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#777", padding: "0 3.5vw", position: "relative", zIndex: 2 }}>
            <span data-scramble>02 — BUILDS (10+)</span><span>COLOR ON HOVER ONLY</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "7vh", borderBottom: "1px solid #242424", perspective: 1100 }}>
            {BUILDS.map((b, i) => (
              <BuildRow key={b.no} b={b} i={i} />
            ))}
          </div>
        </section>

        {/* ============ 03 OPERATOR (스포트라이트) ============ */}
        <section data-light data-scene="flow" style={{ position: "relative", background: "#050505", color: "#f4f3f0", height: "100vh", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(244,243,240,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(244,243,240,.13) 1px,transparent 1px)", backgroundSize: "72px 72px", WebkitMaskImage: "radial-gradient(360px circle at var(--lx,50%) var(--ly,55%),#000,transparent 70%)", maskImage: "radial-gradient(360px circle at var(--lx,50%) var(--ly,55%),#000,transparent 70%)" }} />
          <div data-scramble style={{ position: "absolute", top: 26, left: "3.5vw", ...label, color: "#777", zIndex: 4 }}>03 — THE OPERATOR</div>
          <div style={{ position: "absolute", top: 26, right: "3.5vw", fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: ACC, opacity: 0.85, zIndex: 4 }}>● CURSOR IS THE LIGHT</div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6vw", gap: "4vw" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: ANTON, fontSize: "clamp(56px,9vw,160px)", lineHeight: 0.95, textTransform: "uppercase", color: "transparent", WebkitTextStroke: "1px rgba(244,243,240,.13)" }}>YANG<br />SOONMIN<br />PM/PO</div>
              <div style={{ position: "absolute", inset: 0, fontFamily: ANTON, fontSize: "clamp(56px,9vw,160px)", lineHeight: 0.95, textTransform: "uppercase", color: "#f4f3f0", WebkitMaskImage: "radial-gradient(300px circle at var(--lx,-500px) var(--ly,-500px),#000 35%,transparent 72%)", maskImage: "radial-gradient(300px circle at var(--lx,-500px) var(--ly,-500px),#000 35%,transparent 72%)" }}>YANG<br />SOONMIN<br /><span style={{ color: ACC }}>PM/PO</span></div>
              <div style={{ overflow: "hidden", marginTop: "3.5vh" }}>
                <div data-reveal="0" style={{ fontSize: 15, lineHeight: 1.8, fontWeight: 500, color: "#9a9a9a", transform: "translateY(110%)", opacity: 0, maxWidth: "44ch" }}>현장을 아는 프로덕트 오너.<br />부산에서 만들고, 결과로 증명한다.</div>
              </div>
              <div data-op-hint style={{ marginTop: "3.5vh", display: "inline-flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: ".14em", background: ACC, color: "#0a0a0a", padding: "13px 22px", transition: "opacity .6s ease", animation: "opPulse 1.6s ease-in-out infinite, opBob 2.8s ease-in-out infinite", boxShadow: "0 0 34px rgba(200,255,22,.35)" }}>✦ 커서를 움직여 조명을 비춰보세요</div>
            </div>
            <div style={{ position: "relative", flex: "none", width: "clamp(240px,23vw,360px)" }}>
              <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", border: "1px solid #2c2c2c" }}>
                {imgOk ? (
                  <img src="/profile.jpg" alt="Yang Soonmin" onError={() => setImgOk(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.06)" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(-45deg,#101010,#101010 9px,#1a1a1a 9px,#1a1a1a 19px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", background: "#0a0a0a", color: ACC, padding: "4px 8px" }}>DROP — /public/profile.jpg</span>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(300px circle at var(--lx,50%) var(--ly,50%),transparent 20%,rgba(5,5,5,.82) 78%)", pointerEvents: "none" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", color: "#5f5f5f" }}><span>FIG. 01 — OPERATOR</span><span>B/W · BUSAN</span></div>
            </div>
          </div>
        </section>

        {/* ============ 04 ARCHIVE ============ */}
        <section data-scene="flow" data-arc-section style={{ position: "relative", background: "#f4f3f0", color: "#111", padding: "14vh 3.5vw 12vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#666" }}>
            <span data-scramble>04 — CAREER</span><span>2009 → 2026</span>
          </div>
          <div style={{ marginTop: "6vh", borderBottom: "1px solid rgba(17,17,17,.18)" }}>
            {ARCHIVE.map((a, i) => {
              const expandable = !!(a.sub || a.desc);
              return (
                <div key={i} data-arc-row={expandable ? i : undefined}>
                  <div
                    className="arc-row"
                    data-hover={expandable ? true : undefined}
                    onClick={expandable ? () => toggleArc(i) : undefined}
                    style={{ display: "flex", alignItems: "baseline", gap: "2.5vw", padding: "2.2vh 0", borderTop: "1px solid rgba(17,17,17,.18)", cursor: expandable ? "pointer" : undefined }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 11, color: "#999", width: "9ch", flex: "none" }}>{a.yr}</span>
                    <span style={{ fontFamily: ANTON, fontSize: "clamp(20px,2.2vw,38px)", lineHeight: 1, textTransform: "uppercase" }}>{a.name}</span>
                    <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", color: "#999" }}>
                      {a.meta}
                      {expandable && (
                        <span style={{ marginLeft: 14, color: "#111", background: ACC, padding: "3px 8px", letterSpacing: ".1em" }}>
                          {openArcs.includes(i) ? "− CLOSE" : a.sub ? `+ ${a.sub.length} PROJECTS` : "+ ROLE"}
                        </span>
                      )}
                    </span>
                  </div>
                  {expandable && (
                    <div style={{ display: "grid", gridTemplateRows: openArcs.includes(i) ? "1fr" : "0fr", transition: "grid-template-rows 1.7s cubic-bezier(.3,.65,.3,1)" }}>
                      <div style={{ overflow: "hidden" }}>
                        {/* 영수증 — 슬롯 아래로 지나간 부분만 보이며 뽑혀 나옴 (진짜 인쇄 마스킹) + 인쇄 중 LED */}
                        <div style={{ padding: "1.4vh 0 3.2vh calc(9ch + 2.5vw)" }}>
                          <div style={{ maxWidth: 580, transform: "rotate(.4deg)", perspective: 700 }}>
                            <div style={{ position: "relative", zIndex: 2, height: 12, background: "#161616", borderRadius: 7, boxShadow: "inset 0 2px 5px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.4)" }}>
                              <span className={openArcs.includes(i) ? "print-led on" : "print-led"} />
                            </div>
                            {/* 인쇄 창 — 슬롯 아래만 노출. 종이는 창 안에서 translateY로 피드 */}
                            <div style={{ overflow: "hidden", marginTop: -2 }}>
                            <div className={openArcs.includes(i) ? "paper-flutter" : ""} style={{ transformOrigin: "top center", transform: openArcs.includes(i) ? "translateY(0)" : "translateY(-101%)", transition: "transform 1.7s cubic-bezier(.3,.65,.3,1)" }}>
                            <div style={{ background: "#fff", padding: "15px 20px 16px", borderTop: "2px dashed rgba(17,17,17,.3)", boxShadow: "0 20px 46px rgba(17,17,17,.11)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, letterSpacing: ".18em", color: "#999" }}>
                                <span>RECEIPT — {a.name.split(" —")[0]}</span><span>{a.yr}</span>
                              </div>
                              {a.desc && (
                                <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.75, color: "#333", margin: "10px 0 2px" }}>{a.desc}</div>
                              )}
                              {a.sub && (
                                <div style={{ borderTop: "1px dashed #ddd", marginTop: 10, paddingTop: 4 }}>
                                  {a.sub.map((s, j) => (
                                    <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline", padding: "6px 0", borderBottom: j === a.sub!.length - 1 ? "none" : "1px dashed #eee" }}>
                                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#222" }}>
                                        <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#aaa", marginRight: 10 }}>{String(j + 1).padStart(2, "0")}</span>
                                        {s.n}
                                      </span>
                                      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".06em", color: "#999", whiteSpace: "nowrap" }}>{s.p}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: "#999", borderTop: "1px dashed #ddd", marginTop: 10, paddingTop: 10 }}>
                                <span>{a.sub ? `TOTAL — ${a.sub.length} PROJECTS` : "12 YEARS OF FLOOR"}</span><span>YANG SOONMIN</span>
                              </div>
                            </div>
                              <div style={{ height: 9, background: "linear-gradient(45deg,#fff 6px,transparent 0),linear-gradient(-45deg,#fff 6px,transparent 0)", backgroundSize: "12px 12px", backgroundRepeat: "repeat-x", filter: "drop-shadow(0 8px 12px rgba(17,17,17,.07))" }} />
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ 05 CASES ============ */}
        <section data-scene="flow" style={{ position: "relative", background: "#0a0a0a", color: "#f4f3f0", padding: "14vh 3.5vw 12vh", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#777" }}>
            <span data-scramble>05 — CASES</span><span>HOW PROBLEMS GOT SOLVED</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "6vh", borderBottom: "1px solid #242424" }}>
            {CASES.map((c) => (
              <div key={c.no} style={{ display: "flex", gap: "3vw", alignItems: "baseline", padding: "4vh 0", borderTop: "1px solid #242424", flexWrap: "wrap" }}>
                <span style={{ fontFamily: ANTON, fontSize: "clamp(40px,5vw,84px)", lineHeight: 1, color: "transparent", WebkitTextStroke: "1px #3a3a3a", flex: "none" }}>{c.no}</span>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontFamily: ANTON, fontSize: "clamp(22px,2.4vw,42px)", lineHeight: 1.05, textTransform: "uppercase" }}>{c.title} <span style={{ color: ACC }}>{c.accent}</span></div>
                  <div style={{ overflow: "hidden" }}>
                    <div data-reveal="0" style={{ fontSize: 14, lineHeight: 1.8, color: "#9a9a9a", fontWeight: 500, marginTop: 12, maxWidth: "60ch", transform: "translateY(110%)", opacity: 0 }}>{c.body}</div>
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", color: "#5f5f5f", flex: "none" }}>{c.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 06 SKILLS ============ */}
        <section data-scene="flow" style={{ position: "relative", background: "#f4f3f0", color: "#111", padding: "14vh 3.5vw 12vh", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#666" }}>
            <span data-scramble>06 — HOW I WORK</span><span>FLOOR × PRODUCT × AI</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, background: "rgba(17,17,17,.2)", border: "1px solid rgba(17,17,17,.2)", marginTop: "6vh" }}>
            {[
              { tag: "A — PRODUCT", title: "SPEC & SHIP", body: <>요구사항 정의 · IA · User Flow<br />CMS·예약 시스템 화면 기획<br />일정·이슈·우선순위 오너십</> },
              { tag: "B — AI / AUTOMATION", title: "BUILD WITH AI", body: <>n8n — 회의록·OCR·트렌드 자동화<br />Claude Code · ChatGPT · 바이브코딩<br />기획 → 구현 검증 사이클 운용</> },
              { tag: "C — FLOOR", title: "12Y OPERATIONS", body: <>매장 운영·손익 책임 12년<br />현장 감각으로 요구사항 검증<br />사람을 움직이는 리딩</> },
            ].map((s, i) => (
              <div key={i} style={{ background: "#f4f3f0", padding: "4vh 2vw", minHeight: "34vh", display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", color: "#111", background: ACC, alignSelf: "flex-start", padding: "4px 9px" }}>{s.tag}</div>
                <div style={{ fontFamily: ANTON, fontSize: "clamp(26px,2.6vw,44px)", lineHeight: 1.05, textTransform: "uppercase", marginTop: 14 }}>{s.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.85, color: "#555", marginTop: "auto", fontWeight: 500 }}>{s.body}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "8vh", display: "flex", justifyContent: "space-between", ...label, color: "#666" }}>
            <span>CREDENTIALS</span><span>EDU · CERT · AWARDS</span>
          </div>
          <div style={{ marginTop: "2vh", borderBottom: "1px solid rgba(17,17,17,.18)" }}>
            {[
              { yr: "2011–19", name: "경성대학교 경영학과", meta: "편입 / 졸업" },
              { yr: "2024.09", name: "웹디자인개발기능사", meta: "한국산업인력공단" },
              { yr: "2018", name: "서비스 디자인 청사진 — 최우수상", meta: "경성대 우수과제공모전" },
              { yr: "2011", name: "KT&G 마케팅 캠프 — 팀워크상", meta: "롯데 에비뉴몰 전략 공모전" },
            ].map((c, i) => (
              <div key={i} className="arc-row" style={{ display: "flex", alignItems: "baseline", gap: "2.5vw", padding: "1.8vh 0", borderTop: "1px solid rgba(17,17,17,.18)" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#999", width: "9ch", flex: "none" }}>{c.yr}</span>
                <span style={{ fontSize: "clamp(15px,1.4vw,19px)", fontWeight: 800, letterSpacing: "-.01em" }}>{c.name}</span>
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", color: "#999" }}>{c.meta}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 07 CONTACT ============ */}
        <section data-scene="flow" style={{ position: "relative", background: "#050505", color: "#f4f3f0", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(244,243,240,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(244,243,240,.055) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
          <Sparks />
          <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#777", padding: "26px 3.5vw", position: "relative", zIndex: 2 }}>
            <span data-scramble>07 — CONTACT</span><span>BUSAN · OPEN TO BUILD</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 3.5vw", position: "relative", zIndex: 2 }}>
            <div style={{ fontFamily: ANTON, fontSize: "clamp(60px,11vw,190px)", lineHeight: 0.95, textTransform: "uppercase", color: "#f4f3f0" }}>
              LET'S BUILD<br />
              <span style={{ position: "relative", display: "inline-block", color: ACC }}>
                SOMETHING.
                <span style={{ position: "absolute", left: 0, bottom: -12, height: 9, width: "100%", background: "#f4f3f0", transform: "scaleX(clamp(0, calc(var(--p,0)*4 - 1), 1))", transformOrigin: "left" }} />
              </span>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: "5vh", flexWrap: "wrap", alignItems: "stretch" }}>
              <a href="mailto:swatsoonmin@gmail.com" data-magnetic data-hover data-glass-track className="glass-d glassy liquid-btn" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".18em", padding: "18px 34px", display: "inline-flex", alignItems: "center", borderRadius: 12 }}><span>SWATSOONMIN@GMAIL.COM</span></a>
              <div data-hover data-glass-track className="glass-d glassy" style={{ padding: 14, borderRadius: 12, display: "inline-flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                <div style={{ background: "#fff", padding: 8, borderRadius: 6, position: "relative", zIndex: 2 }}>
                  {qrOk ? (
                    <img src="/kakao-qr.png" width={108} height={108} alt="카카오톡 오픈채팅 QR" onError={() => setQrOk(false)} style={{ display: "block" }} />
                  ) : (
                    <div style={{ width: 108, height: 108, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: "#999", border: "1px dashed #ccc" }}>DROP<br />kakao-qr.png</div>
                  )}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".16em", color: "#9a9a9a", position: "relative", zIndex: 2 }}>KAKAO OPEN CHAT — SCAN</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", color: "#4d4d4d", borderTop: "1px solid #1e1e1e", padding: "3vh 3.5vw", position: "relative", zIndex: 2 }}>
            <span>© 2026 YANG SOONMIN — 12Y FLOOR · 3Y PRODUCT · 10+ BUILDS</span>
            <span>MADE WITH METHOD, NOT EXCUSES</span>
          </div>
        </section>
      </div>

      {/* 인트로 오버레이 */}
      <div data-intro style={{ position: "fixed", inset: 0, zIndex: 150, background: "#0a0a0a", color: "#f4f3f0", display: "flex", flexDirection: "column", padding: "26px 3.5vw 3.5vh", transform: "translate3d(0,0,0)", transition: "transform .78s cubic-bezier(.76,0,.24,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...label, color: "#777" }}>
          <span>YANG SOONMIN — PORTFOLIO</span><span>LOADING</span>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "4vw", marginBottom: "4vh" }}>
          <div style={{ fontFamily: ANTON, fontSize: "clamp(80px,15vw,240px)", lineHeight: 0.85 }}><span data-intro-num>0</span><span style={{ color: ACC }}>%</span></div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: "#666", paddingBottom: "2vh", textAlign: "right", lineHeight: 1.9 }}>12 YEARS — 3 YEARS — 10+ BUILDS<br />BUSAN · PM/PO</div>
        </div>
        <div style={{ height: 6, background: "#1c1c1c", position: "relative" }}><span style={{ position: "absolute", inset: 0, background: ACC, transform: "scaleX(var(--ip,0))", transformOrigin: "left" }} /></div>
        {/* 커튼 가장자리 유리 스캔라인 — 걷힐 때 화면을 한 번 쓸고 지나감 (피벗 씬과 같은 문법) */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -30, height: 60, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", background: "linear-gradient(to bottom,transparent,rgba(200,255,22,.13),transparent)", pointerEvents: "none" }} />
      </div>

      {/* 라임 대시 컴패니언 + 커서 */}
      <div data-dash style={{ position: "fixed", left: 0, top: 0, zIndex: 198, pointerEvents: "none", width: 54, height: 11, background: ACC, transform: "translate3d(-300px,-300px,0)" }} />
      {!reduceMotion && (
        <div data-cursor-ring className="lens" style={{ position: "fixed", left: 0, top: 0, zIndex: 200, pointerEvents: "none", width: 46, height: 46, margin: "-23px 0 0 -23px", border: "1px solid rgba(255,255,255,.38)", opacity: 0.92, transform: "translate3d(-200px,-200px,0)", backdropFilter: "blur(1.6px) brightness(1.07) contrast(1.03)", WebkitBackdropFilter: "blur(1.6px) brightness(1.07) contrast(1.03)", background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,.16), rgba(255,255,255,.02) 62%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.32), inset 0 0 0 1px rgba(0,0,0,.07), 0 8px 26px rgba(0,0,0,.14)" }} />
      )}
      {!reduceMotion && <div data-cursor style={{ position: "fixed", left: 0, top: 0, zIndex: 201, pointerEvents: "none", width: 8, height: 8, margin: "-4px 0 0 -4px", background: ACC, borderRadius: "50%", transform: "translate3d(-200px,-200px,0)" }} />}

      {/* AI 챗봇 */}
      <button onClick={() => setChatOpen((o) => !o)} data-hover data-glass-track className="glass-d glassy liquid-btn" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 190, fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", color: "#f4f3f0", padding: "14px 22px", cursor: "pointer", borderRadius: 11 }}>
        <span>{chatOpen ? "CLOSE ✕" : "ASK AI ▮"}</span>
      </button>
      <Chatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Portfolio;
