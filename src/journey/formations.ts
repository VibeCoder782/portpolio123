// 포메이션 좌표 생성기 — 전부 마운트 시 1회 사전 계산 (프레임 중 계산 금지)
// 좌표계: 카메라는 z=0에서 -z 방향으로 전진. 각 포메이션은 카메라 경로 위에 배치된 3D 부피.

const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;

/** F0 불씨 구름 — 카메라를 감싸는 따뜻한 부피 (z +8 ~ -32, 통과용 깊이) */
export function makeEmbers(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2;
    const wild = Math.random() < 0.12;
    const rho = wild
      ? 6 + Math.random() * 13
      : 1.6 + Math.pow(Math.random(), 0.7) * 9;
    out[i * 3] = Math.cos(th) * rho;
    out[i * 3 + 1] = Math.sin(th) * rho * 0.72;
    out[i * 3 + 2] = 8 - Math.random() * 40;
  }
  return out;
}

/** F1 비산 — 불씨가 축에서 바깥으로 터져나감 (카메라가 파편 사이를 통과) */
export function makeBurst(embers: Float32Array): Float32Array {
  const n = embers.length / 3;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = embers[i * 3], y = embers[i * 3 + 1], z = embers[i * 3 + 2];
    const len = Math.hypot(x, y) || 1;
    const push = 4 + Math.random() * 10;
    out[i * 3] = x + (x / len) * push;
    out[i * 3 + 1] = y + (y / len) * push;
    out[i * 3 + 2] = z - 2 - Math.random() * 6;
  }
  return out;
}

/** F2 픽셀 격자 — 차가운 3D 래티스. 중앙 회랑은 비워서 카메라가 그 속으로 진입 */
export function makeLattice(n: number): Float32Array {
  const cells: number[][] = [];
  for (let xi = -6; xi <= 6; xi++)
    for (let yi = -4; yi <= 4; yi++) {
      const x = xi * 2.2, y = yi * 2.2;
      if (Math.abs(x) < 2.3 && Math.abs(y) < 2.3) continue; // 회랑 확보
      for (let zi = 0; zi < 13; zi++) cells.push([x, y, -40 - zi * 3]);
    }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.08) {
      // 8%는 격자 사이 먼지 — 질감
      out[i * 3] = (Math.random() * 2 - 1) * 14;
      out[i * 3 + 1] = (Math.random() * 2 - 1) * 9;
      out[i * 3 + 2] = -38 - Math.random() * 40;
    } else {
      const c = cells[(Math.random() * cells.length) | 0];
      out[i * 3] = c[0] + (Math.random() - 0.5) * 0.36;
      out[i * 3 + 1] = c[1] + (Math.random() - 0.5) * 0.36;
      out[i * 3 + 2] = c[2] + (Math.random() - 0.5) * 0.36;
    }
  }
  return out;
}

/** F3 성긴 별밭 — 넓고 어두운 배경 (콘텐츠 방해 금지 구간) */
export function makeSparse(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (Math.random() * 2 - 1) * 32;
    out[i * 3 + 1] = (Math.random() * 2 - 1) * 18;
    out[i * 3 + 2] = -30 - Math.random() * 70;
  }
  return out;
}

/** F4 수렴 — 전방 한 점으로 (YSM 광원) */
export function makeConverge(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const halo = Math.random() < 0.06;
    const r = halo ? 0.45 + Math.random() * 3.5 : 0.45;
    out[i * 3] = gauss() * r;
    out[i * 3 + 1] = 0.3 + gauss() * r;
    out[i * 3 + 2] = -70 + gauss() * r * 0.7;
  }
  return out;
}
