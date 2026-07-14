import * as THREE from "three";
import { JOURNEY } from "./config";

// 카메라 리그 — z 전진(돌리) + 마우스 오비트 오프셋(lerp) + FOV 킥
export class CameraRig {
  camera: THREE.PerspectiveCamera;
  private mx = 0; private my = 0;
  private sx = 0; private sy = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(JOURNEY.camera.fovBase, aspect, 0.1, 220);
    this.camera.position.set(0, 0, 0);
    window.addEventListener("mousemove", this.onMove, { passive: true });
  }

  private onMove = (e: MouseEvent) => {
    this.mx = e.clientX / window.innerWidth - 0.5;
    this.my = -(e.clientY / window.innerHeight - 0.5);
  };

  setAspect(a: number) {
    this.camera.aspect = a;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, z: number, fovKick: number) {
    const k = Math.min(1, dt * 4);
    this.sx += (this.mx - this.sx) * k;
    this.sy += (this.my - this.sy) * k;
    this.camera.position.set(this.sx * 2.4, this.sy * 1.5, z);
    const fov = JOURNEY.camera.fovBase + fovKick;
    if (Math.abs(fov - this.camera.fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    // 시선은 전방 — 마우스로 미세 팬 (씬 전체가 시선을 따라 도는 시차)
    this.camera.lookAt(this.sx * 5, this.sy * 3, z - 14);
  }

  dispose() {
    window.removeEventListener("mousemove", this.onMove);
  }
}
