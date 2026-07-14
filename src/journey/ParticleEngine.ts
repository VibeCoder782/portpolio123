import * as THREE from "three";
import { JOURNEY } from "./config";
import { makeEmbers, makeBurst, makeLattice, makeSparse, makeConverge } from "./formations";

// 볼류메트릭 파티클 필드 — 포메이션 5종을 셰이더에서 per-particle 지연으로 모프 (1 draw call)
export class ParticleEngine {
  points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private segCols: THREE.Color[];
  private clearCols: THREE.Color[];

  constructor(isMobile: boolean, dpr: number) {
    const N = isMobile ? JOURNEY.counts.mobile : JOURNEY.counts.desktop;
    const embers = makeEmbers(N);
    const seed = new Float32Array(N);
    const scale = new Float32Array(N);
    for (let i = 0; i < N; i++) { seed[i] = Math.random(); scale[i] = 0.6 + Math.random(); }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(embers, 3)); // = P0 불씨
    this.geo.setAttribute("aP1", new THREE.BufferAttribute(makeBurst(embers), 3));
    this.geo.setAttribute("aP2", new THREE.BufferAttribute(makeLattice(N), 3));
    this.geo.setAttribute("aP3", new THREE.BufferAttribute(makeSparse(N), 3));
    this.geo.setAttribute("aP4", new THREE.BufferAttribute(makeConverge(N), 3));
    this.geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));

    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: (isMobile ? 3.2 : 3.6) * dpr },
        uWobble: { value: JOURNEY.segWobble[0] },
        uFlicker: { value: 1 },
        uColA: { value: new THREE.Color(JOURNEY.segColors[0]) },
        uColB: { value: new THREE.Color(JOURNEY.segColors[1]) },
        uDimA: { value: JOURNEY.segDim[0] },
        uDimB: { value: JOURNEY.segDim[1] },
        uFogNear: { value: JOURNEY.fog.near },
        uFogFar: { value: JOURNEY.fog.far },
      },
      vertexShader: `
        attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec3 aP4;
        attribute float aSeed; attribute float aScale;
        uniform float uMorph; uniform float uTime; uniform float uSize; uniform float uWobble;
        varying float vSeed; varying float vT; varying float vDepth;
        void main(){
          float m = clamp(uMorph, 0.0, 4.0);
          float seg = floor(min(m, 3.999));
          float f = m - seg;
          // per-particle 지연 스태거 — 유기적 전환
          float tt = clamp((f - aSeed*0.35) / 0.65, 0.0, 1.0);
          tt = tt*tt*(3.0-2.0*tt);
          vec3 a = seg < 0.5 ? position : seg < 1.5 ? aP1 : seg < 2.5 ? aP2 : aP3;
          vec3 b = seg < 0.5 ? aP1      : seg < 1.5 ? aP2 : seg < 2.5 ? aP3 : aP4;
          vec3 pos = mix(a, b, tt);
          pos += vec3(
            sin(uTime*0.6 + aSeed*17.0),
            cos(uTime*0.8 + aSeed*23.0),
            sin(uTime*0.5 + aSeed*29.0)
          ) * uWobble * (0.5 + aSeed);
          vSeed = aSeed; vT = tt;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          float dist = max(-mv.z, 0.001);
          vDepth = dist;
          gl_PointSize = uSize * aScale * clamp(24.0/dist, 0.05, 7.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColA; uniform vec3 uColB;
        uniform float uDimA; uniform float uDimB;
        uniform float uFogNear; uniform float uFogFar;
        uniform float uFlicker; uniform float uTime; uniform float uReveal;
        varying float vSeed; varying float vT; varying float vDepth;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c); if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.06, d);
          vec3 col = mix(uColA, uColB, vT);
          col = mix(col, vec3(1.0), vSeed * 0.22); // per-particle 색 편차
          float alpha = core * 0.55 * mix(uDimA, uDimB, vT);
          alpha *= smoothstep(uFogFar, uFogNear, vDepth);   // 깊이 안개
          alpha *= smoothstep(0.55, 2.2, vDepth);           // 카메라 근접 페이드
          alpha *= 1.0 - uFlicker * (0.5 + 0.5*sin(uTime*3.0 + vSeed*40.0)) * 0.45; // 불씨 깜빡임
          alpha *= clamp((uReveal - vSeed) * 6.0, 0.0, 1.0); // 로더 점화
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.segCols = JOURNEY.segColors.map((c) => new THREE.Color(c));
    this.clearCols = JOURNEY.clearColors.map((c) => new THREE.Color(c));
  }

  update(morph: number, time: number, reveal: number) {
    const m = Math.min(Math.max(morph, 0), 4);
    const seg = Math.min(Math.floor(m), 3);
    const f = m - seg;
    const u = this.mat.uniforms;
    u.uMorph.value = m;
    u.uTime.value = time;
    u.uReveal.value = reveal;
    u.uWobble.value = JOURNEY.segWobble[seg] + (JOURNEY.segWobble[seg + 1] - JOURNEY.segWobble[seg]) * f;
    u.uFlicker.value = Math.max(0, 1 - m);
    (u.uColA.value as THREE.Color).copy(this.segCols[seg]);
    (u.uColB.value as THREE.Color).copy(this.segCols[seg + 1]);
    u.uDimA.value = JOURNEY.segDim[seg];
    u.uDimB.value = JOURNEY.segDim[seg + 1];
  }

  /** 배경(클리어) 색 — 필름 색 그레이딩 */
  clearColor(morph: number, out: THREE.Color): THREE.Color {
    const m = Math.min(Math.max(morph, 0), 4);
    const seg = Math.min(Math.floor(m), 3);
    return out.copy(this.clearCols[seg]).lerp(this.clearCols[seg + 1], m - seg);
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}
