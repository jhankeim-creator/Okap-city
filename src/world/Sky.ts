import * as THREE from "three";
import { fbm, makeCanvas, mulberry32, texFrom } from "./Materials";

/**
 * Syèl fizik-style (gradyan + soley + nyaj) ak yon environment map (IBL)
 * pou tout materyèl yo jwenn refleksyon reyèl.
 */
export class SkySystem {
  group = new THREE.Group();
  sun: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private sunDisc: THREE.Mesh;
  private clouds: THREE.Mesh;
  private uniforms: Record<string, THREE.IUniform>;
  private cloudTex: THREE.CanvasTexture;
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private pmrem: THREE.PMREMGenerator;
  timeOfDay = 8.2;

  constructor(private renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.uniforms = {
      uTop: { value: new THREE.Color(0x1d6fc4) },
      uMid: { value: new THREE.Color(0x8fc7ea) },
      uBottom: { value: new THREE.Color(0xf6d9a8) },
      uSun: { value: new THREE.Vector3(0.4, 0.35, 0.85).normalize() },
      uSunColor: { value: new THREE.Color(0xfff0c4) },
      uSunIntensity: { value: 1.6 },
      uExposure: { value: 1 },
    };

    const skyGeo = new THREE.SphereGeometry(1600, 48, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBottom;
        uniform vec3 uSun; uniform vec3 uSunColor; uniform float uSunIntensity;
        varying vec3 vWorld;
        void main() {
          vec3 dir = normalize(vWorld - cameraPosition);
          float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uBottom, uMid, smoothstep(0.42, 0.56, h));
          col = mix(col, uTop, smoothstep(0.55, 0.92, h));
          float sunAmt = max(dot(dir, normalize(uSun)), 0.0);
          col += uSunColor * pow(sunAmt, 260.0) * 12.0 * uSunIntensity;
          col += uSunColor * pow(sunAmt, 8.0) * 0.34 * uSunIntensity;
          float glow = pow(sunAmt, 1.6) * 0.16 * uSunIntensity;
          col += uSunColor * glow;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1000;
    this.group.add(this.sky);

    // Disk soley la (pou limyè vizib ak bloom)
    this.sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(38, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.95, fog: false }),
    );
    this.sunDisc.renderOrder = -999;
    this.group.add(this.sunDisc);

    // Nyaj (plak segondè)
    this.cloudTex = texFrom(paintClouds(512), 1);
    this.clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(2600, 2600),
      new THREE.MeshBasicMaterial({ map: this.cloudTex, transparent: true, opacity: 0.55, depthWrite: false, fog: false }),
    );
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.position.y = 320;
    this.clouds.renderOrder = -998;
    this.group.add(this.clouds);

    this.sun = new THREE.DirectionalLight(0xfff1d0, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 260;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    scene.add(this.sun);

    scene.add(this.group);
  }

  private applyTime() {
    const t = this.timeOfDay;
    // Apremidi/lè solèy kouche: ang soley la
    const elev = Math.sin((t / 24) * Math.PI * 2 - Math.PI / 2) * 0.9 + 0.12;
    const azim = (t / 24) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(azim) * 0.7, Math.max(0.05, elev), Math.sin(azim) * 0.7).normalize();
    this.uniforms.uSun.value.copy(dir);
    const warm = THREE.MathUtils.clamp(1 - elev * 1.8, 0, 1);
    const sunColor = new THREE.Color().setHSL(0.13 - warm * 0.06, 0.55 * warm + 0.05, 0.72 - warm * 0.1);
    (this.uniforms.uSunColor.value as THREE.Color).copy(sunColor);
    this.uniforms.uSunIntensity.value = 1.1 + (1 - warm) * 0.9;
    (this.uniforms.uTop.value as THREE.Color).setHex(warm > 0.55 ? 0x1a5fa8 : 0x1d6fc4);
    (this.uniforms.uMid.value as THREE.Color).setHex(warm > 0.55 ? 0x9ec7e6 : 0x8fc7ea);
    (this.uniforms.uBottom.value as THREE.Color).setHex(warm > 0.55 ? 0xf3c88f : 0xf6d9a8);

    this.sun.color.copy(sunColor);
    this.sun.intensity = 2.1 + (1 - warm) * 0.9;
    this.sun.position.copy(dir).multiplyScalar(150);
    this.sunDisc.position.copy(dir).multiplyScalar(1200);
    this.sunDisc.lookAt(0, 0, 0);
    this.clouds.position.y = 260 + Math.sin(t) * 12;
  }

  setTime(t: number) {
    this.timeOfDay = t;
    this.applyTime();
  }

  /** Jenere env map (IBL) pou materyèl yo. */
  bakeEnvironment() {
    this.applyTime();
    this.envTarget?.dispose();
    const target = this.pmrem.fromScene(this.group as unknown as THREE.Scene, 0, 0.1, 2000);
    this.envTarget = target;
    return target.texture;
  }

  update(dt: number, cameraPos: THREE.Vector3) {
    this.group.position.copy(cameraPos);
    this.cloudTex.offset.x = (this.cloudTex.offset.x + dt * 0.0035) % 1;
    this.cloudTex.offset.y = (this.cloudTex.offset.y + dt * 0.0012) % 1;
  }
}

export function paintClouds(size = 512, seed = 777) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.012, y * 0.012, 5, seed) * 0.7 + fbm(x * 0.05, y * 0.05, 3, seed + 3) * 0.3;
      const a = Math.max(0, (n - 0.52) * 3.4);
      img.data[i] = 255;
      img.data[i + 1] = 252;
      img.data[i + 2] = 248;
      img.data[i + 3] = Math.min(255, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  // kèk gwo nyaj reyalis
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 26; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const r = 24 + rand() * 90;
    for (let k = 0; k < 8; k++) {
      const g = ctx.createRadialGradient(cx + (rand() - 0.5) * r, cy + (rand() - 0.5) * r * 0.5, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}
