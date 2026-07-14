import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { gsap, ScrollTrigger } from "./gsapSetup";
import { ParticleEngine } from "./ParticleEngine";
import { DustLayer } from "./DustLayer";
import { CameraRig } from "./CameraRig";
import { JOURNEY } from "./config";

// Director — 스크롤(필름 타임코드)을 파티클·카메라·DOM 타이포에 배급하는 마스터
// 씬 매핑: pivot(핀#1 전향) → morph 0~2 / mid(중간 챕터) → 2~3 / conv(수렴) → 3~4

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const invLerp = (a: number, b: number, v: number) => clamp01((v - a) / (b - a));

export function initJourney(container: HTMLElement): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return () => {};
  }
  const isMobile = window.innerWidth < 768;
  const DPR = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(DPR);
  renderer.domElement.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const rig = new CameraRig(window.innerWidth / window.innerHeight);
  const engine = new ParticleEngine(isMobile, DPR);
  const dust = new DustLayer(isMobile, DPR);
  scene.add(engine.points);
  scene.add(dust.points);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, rig.camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.65, 0.12);
  composer.addPass(bloom);

  // 스크롤 → 목표값, rAF에서 lerp (버터 스크럽)
  const target = { pivot: 0, mid: 0, conv: 0, reveal: 0 };
  const state = { pivot: 0, mid: 0, conv: 0, reveal: 0 };

  const sts: ScrollTrigger[] = [
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: isMobile ? "+=80%" : "+=100%",
      pin: true,
      anticipatePin: 1,
      onUpdate: (st) => { target.pivot = st.progress; },
    }),
    ScrollTrigger.create({
      trigger: "#stats-bar",
      start: "top bottom",
      endTrigger: "#contact",
      end: "top 60%",
      onUpdate: (st) => { target.mid = st.progress; },
    }),
    ScrollTrigger.create({
      trigger: "#contact",
      start: "top 85%",
      end: "bottom bottom",
      onUpdate: (st) => { target.conv = st.progress; },
    }),
  ];

  // 로더 점화 연동 (씬 0)
  const onLoader = (e: Event) => {
    target.reveal = 0.05 + (e as CustomEvent<number>).detail * 1.05;
  };
  window.addEventListener("ysm-loader", onLoader as EventListener);
  const revealFallback = window.setTimeout(() => {
    target.reveal = Math.max(target.reveal, 1.1);
  }, 4500);

  const els = {
    hero: document.getElementById("hero-content"),
    vig: document.getElementById("hero-vignette"),
    cue: document.getElementById("hero-scrollcue"),
    n1: document.getElementById("nar-p1"),
    n2: document.getElementById("nar-p2"),
    nc: document.getElementById("nar-conv"),
  };

  // 타이틀 카드 연출 언어 — 깊은 곳에서 접근(스케일업) → 자간 정착 → 부드럽게 이탈
  const card = (el: HTMLElement | null, p: number) => {
    if (!el) return;
    const cp = clamp01(p);
    const a = cp <= 0 || cp >= 1
      ? 0
      : smooth(clamp01(cp / 0.3)) * (1 - smooth(clamp01((cp - 0.72) / 0.28)));
    el.style.opacity = a.toFixed(3);
    el.style.transform = `scale(${(0.92 + 0.12 * smooth(cp)).toFixed(4)})`;
    el.style.letterSpacing = `${(0.22 - 0.19 * smooth(Math.min(1, cp * 1.8))).toFixed(3)}em`;
    el.style.filter = `blur(${((1 - Math.min(1, cp * 3.2)) * 7).toFixed(2)}px)`;
  };

  const clock = new THREE.Clock();
  const clearCol = new THREE.Color();
  let frames = 0, acc = 0, lowSpec = false, running = true;

  const update = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const k = Math.min(1, dt * 7);
    state.pivot += (target.pivot - state.pivot) * k;
    state.mid += (target.mid - state.mid) * k;
    state.conv += (target.conv - state.conv) * k;
    state.reveal += (target.reveal - state.reveal) * Math.min(1, dt * 2.2);

    const morph = Math.min(4, state.pivot * 2 + state.mid + state.conv);
    engine.update(morph, t, state.reveal);
    dust.update(morph, t);

    // 카메라 — 전향 가속(스무스스텝 = 중반 최고속) + 중간 드리프트 + 수렴 정착
    const zp = smooth(state.pivot);
    const z = JOURNEY.camera.zPivotEnd * zp
      + JOURNEY.camera.zMidDrift * state.mid
      + JOURNEY.camera.zConvDrift * state.conv;
    const fovKick = JOURNEY.camera.fovKick * Math.sin(Math.PI * Math.min(1, state.pivot));
    rig.update(dt, z, fovKick);

    renderer.setClearColor(engine.clearColor(morph, clearCol));

    // DOM 연출 — 히어로 이탈 + 내레이션 타이틀 카드
    if (els.hero) {
      const hp = clamp01(state.pivot / 0.22);
      els.hero.style.opacity = (1 - hp).toFixed(3);
      els.hero.style.transform = `scale(${(1 + state.pivot * 0.4).toFixed(4)}) translateY(${(-state.pivot * 40).toFixed(1)}px)`;
      els.hero.style.pointerEvents = state.pivot > 0.03 ? "none" : "auto";
    }
    if (els.vig) els.vig.style.opacity = (1 - clamp01(state.pivot / 0.3)).toFixed(3);
    if (els.cue) els.cue.style.opacity = (1 - clamp01(state.pivot / 0.06)).toFixed(3);
    card(els.n1, invLerp(0.14, 0.52, state.pivot));
    card(els.n2, invLerp(0.56, 1.0, state.pivot));
    card(els.nc, invLerp(0.04, 0.55, state.conv));

    if (lowSpec) renderer.render(scene, rig.camera);
    else composer.render();

    // 저사양 폴백 — 점화 후 90프레임 평균 fps < 40 → DPR 1·블룸 해제·더스트 오프
    if (!lowSpec && state.reveal > 0.9 && frames < 90) {
      acc += dt; frames++;
      if (frames === 90 && acc / 90 > 1 / 40) {
        lowSpec = true;
        renderer.setPixelRatio(1);
        dust.points.visible = false;
      }
    }
  };
  gsap.ticker.add(update);

  const onResize = () => {
    rig.setAspect(window.innerWidth / window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    composer.setSize(window.innerWidth, window.innerHeight);
  };
  onResize();
  window.addEventListener("resize", onResize);
  const onVis = () => { running = !document.hidden; if (running) clock.getDelta(); };
  document.addEventListener("visibilitychange", onVis);
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);

  (window as unknown as Record<string, unknown>).__JOURNEY = { state, target }; // 디버그용

  return () => {
    gsap.ticker.remove(update);
    sts.forEach((s) => s.kill());
    window.removeEventListener("ysm-loader", onLoader as EventListener);
    window.clearTimeout(revealFallback);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("load", onLoad);
    rig.dispose();
    engine.dispose();
    dust.dispose();
    bloom.dispose();
    composer.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    renderer.dispose();
  };
}
