import * as THREE from "three";
import { JOURNEY } from "./config";

// 근경 더스트 — 카메라 바로 앞을 스치는 크고 흐릿한 입자 소수. 가장 싼 깊이 장치. (1 draw call)
export class DustLayer {
  points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private segCols: THREE.Color[];

  constructor(isMobile: boolean, dpr: number) {
    const N = isMobile ? JOURNEY.counts.dustMobile : JOURNEY.counts.dustDesktop;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const scale = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 7;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 4.5;
      pos[i * 3 + 2] = 6 - Math.random() * 88; // 카메라 전체 경로에 분포
      seed[i] = Math.random();
      scale[i] = 0.5 + Math.random() * 1.5;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));

    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 9 * dpr },
        uCap: { value: 230 * dpr },
        uCol: { value: new THREE.Color(JOURNEY.segColors[0]) },
      },
      vertexShader: `
        attribute float aSeed; attribute float aScale;
        uniform float uTime; uniform float uSize; uniform float uCap;
        varying float vDepth; varying float vSeed;
        void main(){
          vec3 pos = position + vec3(
            sin(uTime*0.15 + aSeed*20.0) * 0.8,
            cos(uTime*0.12 + aSeed*30.0) * 0.5,
            0.0
          );
          vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          float dist = max(-mv.z, 0.001);
          vDepth = dist;
          gl_PointSize = min(uSize * aScale * clamp(30.0/dist, 0.3, 30.0), uCap);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uCol;
        varying float vDepth; varying float vSeed;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c); if (d > 0.5) discard;
          float soft = smoothstep(0.5, 0.05, d);
          float alpha = soft * 0.05 * (0.6 + vSeed*0.7);
          alpha *= smoothstep(0.35, 1.8, vDepth);   // 너무 가까우면 페이드
          alpha *= smoothstep(60.0, 12.0, vDepth);  // 멀면 소멸
          gl_FragColor = vec4(uCol, alpha);
        }
      `,
    });

    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.segCols = JOURNEY.segColors.map((c) => new THREE.Color(c));
  }

  update(morph: number, time: number) {
    const m = Math.min(Math.max(morph, 0), 4);
    const seg = Math.min(Math.floor(m), 3);
    this.mat.uniforms.uTime.value = time;
    (this.mat.uniforms.uCol.value as THREE.Color)
      .copy(this.segCols[seg])
      .lerp(this.segCols[seg + 1], m - seg);
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}
