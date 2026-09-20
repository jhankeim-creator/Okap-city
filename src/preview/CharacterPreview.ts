import * as THREE from "three";
import { CHARACTERS } from "../data/characters";
import { createCharacterRig, animateRig, type CharacterRig } from "../characters/CharacterFactory";
import type { PoseState } from "../characters/Body";
import { SkySystem } from "../world/Sky";
import { MAT } from "../world/Materials";

/**
 * Fèy pèsonaj 3D + sèn "lineup" pou apèsi a.
 *
 * Paramèt URL:
 *   ?solo=<id>     — yon sèl pèsonaj
 *   &view=orbit|front|face|side|three-quarter|back
 *   &auto=0        — kamera pa vire
 *   &pose=idle|run|aim|...
 *   &time=8.2      — lè solèy la
 *
 * API pou zouti kaptire videyo a (window.__okapPreview):
 *   setCharacter(id), setView(v), setPose(p), step(dt), frame, t
 */

export interface PreviewHandle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sky: SkySystem;
  rigs: CharacterRig[];
  setCharacter: (id: string | null) => void;
  setView: (v: string) => void;
  setPose: (p: PoseState) => void;
  setSunTime: (t: number) => void;
  step: (dt: number, count?: number) => void;
  frame: () => number;
}

const VIEWS = ["orbit", "front", "face", "side", "three-quarter", "back"] as const;

export function mountCharacterPreview(container: HTMLElement, opts: { count?: number; time?: number } = {}): PreviewHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.05, 4000);

  const sky = new SkySystem(renderer, scene);
  sky.setTime(opts.time ?? 7.6);
  scene.environment = sky.bakeEnvironment();
  scene.fog = new THREE.Fog(0xcfd6d8, 26, 150);

  // Planche: beton + yon ti plat won pou pèsonaj la kanpe
  const floor = new THREE.Mesh(new THREE.CircleGeometry(24, 64), MAT.sidewalk);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ramp = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.1, 48), MAT.painted(0x1d2127, 0.45));
  ramp.position.y = 0.05;
  ramp.receiveShadow = true;
  ramp.castShadow = true;
  scene.add(ramp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.012, 8, 64), MAT.painted(0xd4a017, 0.35));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.101;
  scene.add(ring);

  const rigs: CharacterRig[] = CHARACTERS.slice(0, opts.count ?? CHARACTERS.length).map((def) => {
    const rig = createCharacterRig(def.id);
    rig.root.visible = false;
    scene.add(rig.root);
    return rig;
  });

  let solo: string | null = null;
  let view: string = "orbit";
  let pose: PoseState = "idle";
  let frames = 0;
  let elapsed = 0;
  let auto = true;

  const applyCharacter = (id: string | null) => {
    solo = id;
    const perRow = 4;
    const spread = 1.35;
    const shown = id ? rigs.filter((r) => r.def.id === id) : rigs;
    shown.forEach((rig, i) => {
      rig.root.visible = true;
      if (id) {
        rig.root.position.set(0, 0, 0);
        rig.root.rotation.y = 0;
      } else {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const inRow = Math.min(perRow, shown.length - row * perRow);
        rig.root.position.set((col - (inRow - 1) / 2) * spread, 0, row === 0 ? 0.9 : -0.95);
        rig.root.rotation.y = row === 0 ? 0.1 : -0.06;
      }
    });
    for (const rig of rigs) if (!shown.includes(rig)) rig.root.visible = false;
  };
  applyCharacter(null);

  const width = () => (solo ? 1 : 4 * 1.35 + 1.0);

  const updateCamera = () => {
    const span = width();
    switch (view) {
      case "front":
        camera.position.set(0, 1.05, -(solo ? 2.6 : span * 0.9));
        camera.lookAt(0, solo ? 1.05 : 1.15, 0);
        break;
      case "face":
        camera.position.set(0.06, 1.64, -(solo ? 0.72 : span));
        camera.lookAt(0, 1.6, 0);
        break;
      case "side":
        camera.position.set(solo ? 2.1 : span * 0.95, 1.15, 0.05);
        camera.lookAt(0, 1.05, 0);
        break;
      case "back":
        camera.position.set(0.1, 1.2, solo ? 2.3 : span * 0.95);
        camera.lookAt(0, 1.1, 0);
        break;
      case "three-quarter":
        camera.position.set(solo ? 1.55 : span * 0.75, 1.35, -(solo ? 1.75 : span * 0.8));
        camera.lookAt(0, 1.05, 0);
        break;
      default: {
        const a = auto ? elapsed * 0.18 : 0.6;
        const radius = solo ? 2.6 : span * 0.92;
        camera.position.set(Math.sin(a) * radius, 1.5 + Math.sin(a * 0.7) * 0.22, Math.cos(a) * radius * 0.9);
        camera.lookAt(0, 1.08, 0);
        break;
      }
    }
  };

  renderer.render(scene, camera);

  const step = (dt: number, count = 1) => {
    for (let i = 0; i < count; i++) {
      elapsed += dt;
      sky.update(dt, camera.position);
      rigs.forEach((rig, i) => {
        if (!rig.root.visible) return;
        if (pose === "idle") rig.root.rotation.y = Math.sin(elapsed * 0.3 + i) * (solo ? 0.35 : 0.18);
        animateRig(rig, pose, elapsed + i * 0.6, { aimPitch: 0, aim: pose === "aim" || pose === "shoot" });
      });
      updateCamera();
      renderer.render(scene, camera);
      frames++;
    }
  };

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Bou nòmal la (nan navigatè a)
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    if (!window.__okapManual) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const handle: PreviewHandle = {
    renderer,
    scene,
    camera,
    sky,
    rigs,
    setCharacter: applyCharacter,
    setView: (v: string) => {
      view = VIEWS.includes(v as (typeof VIEWS)[number]) ? v : "orbit";
      auto = v === "orbit";
    },
    setPose: (p: PoseState) => {
      pose = p;
    },
    setSunTime: (t: number) => {
      sky.setTime(t);
      scene.environment = sky.bakeEnvironment();
    },
    step,
    frame: () => frames,
  };

  const params = new URLSearchParams(location.search);
  if (params.get("solo")) handle.setCharacter(params.get("solo"));
  handle.setView(params.get("view") ?? "orbit");
  if (params.get("auto") === "0") auto = false;
  if (params.get("pose")) handle.setPose(params.get("pose") as PoseState);

  window.__okapPreview = handle;
  return handle;
}

declare global {
  interface Window {
    __previewFrame?: number;
    __okapPreview?: PreviewHandle;
    __okapManual?: boolean;
  }
}
