import * as THREE from "three";

/**
 * OKAP CITY — kò moun reyalis.
 *
 * Pwoporsyon antwopometrik (wotè ≈ 1.78 m, tèt ≈ 1/7.5 wotè kò a).
 * Tout jwenti yo se Group pou animasyon pwosediral.
 *
 * Sistèm jeyometri a sèvi ak "lathe" (sifas revolisyon) pou misk ak manm
 * yo gen yon silwèt kontinyèl olye de yon seri boul kole youn sou lòt.
 */

export type PoseState =
  | "idle"
  | "walk"
  | "run"
  | "sprint"
  | "crouch"
  | "prone"
  | "jump"
  | "shoot"
  | "aim"
  | "reload"
  | "down"
  | "dead"
  | "win"
  | "drive";

/* ------------------------------------------------------------------ *
 * Jeyometri pataje
 * ------------------------------------------------------------------ */

const GEO = {
  sphere: new THREE.SphereGeometry(1, 24, 18),
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 18, 1, false),
  disc: new THREE.CircleGeometry(1, 20),
};

const _taper = new Map<string, THREE.CylinderGeometry>();
const _lathe = new Map<string, THREE.LatheGeometry>();

/** Silenn konik (bon rapò kalite/pri). */
export function tubeMesh(rTop: number, rBottom: number, len: number, mat: THREE.Material, cast = true, xScale = 1, zScale = 1) {
  const key = `${rTop.toFixed(4)}|${rBottom.toFixed(4)}|${len.toFixed(4)}`;
  let g = _taper.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rTop, rBottom, len, 16, 1, false);
    _taper.set(key, g);
  }
  const m = new THREE.Mesh(g, mat);
  if (xScale !== 1 || zScale !== 1) m.scale.set(xScale, 1, zScale);
  m.castShadow = cast;
  m.receiveShadow = cast;
  return m;
}

/** Sifas revolisyon: pwofil [reyon, wotè] soti anba pou ale anwo. */
export function latheMesh(profile: [number, number][], mat: THREE.Material, segments = 18, cast = true) {
  const key = profile.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(";") + `|${segments}`;
  let g = _lathe.get(key);
  if (!g) {
    g = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0004, r), y)),
      segments,
    );
    _lathe.set(key, g);
  }
  const m = new THREE.Mesh(g, mat);
  m.castShadow = cast;
  m.receiveShadow = cast;
  return m;
}

/** Manm: pwofil eliptik (x = lajè, z = epesè) pou misk reyalis. */
export function limbMesh(profile: [number, number][], mat: THREE.Material, depth = 0.92, segments = 18) {
  const m = latheMesh(profile, mat, segments);
  m.scale.set(1, 1, depth);
  return m;
}

/** Elipsoyid — baz pou detay ògànik. */
export function ellipsoid(rx: number, ry: number, rz: number, mat: THREE.Material, cast = true) {
  const m = new THREE.Mesh(GEO.sphere, mat);
  m.scale.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = cast;
  return m;
}

export function capsuleMesh(r: number, len: number, mat: THREE.Material, cast = true) {
  const g = new THREE.CapsuleGeometry(r, len, 6, 14);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = cast;
  m.receiveShadow = cast;
  return m;
}

export function boxMesh(w: number, h: number, d: number, mat: THREE.Material | THREE.Material[]) {
  const m = new THREE.Mesh(GEO.box, mat);
  m.scale.set(w, h, d);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function discMesh(r: number, mat: THREE.Material) {
  const m = new THREE.Mesh(GEO.disc, mat);
  m.scale.setScalar(r);
  return m;
}

/* ------------------------------------------------------------------ *
 * Pwoporsyon (an mèt, sòti atè)
 * ------------------------------------------------------------------ */

export const ANATOMY = {
  ankleY: 0.085,
  kneeY: 0.48,
  hipY: 0.95,
  waistY: 1.08,
  chestY: 1.3,
  shoulderY: 1.46,
  neckY: 1.5,
  /** Sant zo bwa tèt la (head group origin) */
  headY: 1.655,
  thigh: 0.47,
  shin: 0.395,
  upperArm: 0.31,
  foreArm: 0.27,
  hand: 0.1,
  headWidth: 0.077,
  headHeight: 0.099,
  headDepth: 0.094,
};

export interface BodyType {
  /** Miltiplikatè wotè (1 = 1.78 m) */
  scale: number;
  /** Miltiplikatè lajè zepòl */
  shoulder: number;
  chestW: number;
  chestD: number;
  waistW: number;
  hipW: number;
  /** 0 = gason, 1 = fi (pwatrin) */
  bust: number;
  /** Miltiplikatè mas manm yo */
  limb: number;
  /** Epa sè (gason = dwat, fi = pi awondi) */
  softness: number;
  /** Miltiplikatè longè janm */
  legLength: number;
}

export const BODY_TYPES: Record<string, BodyType> = {
  male: {
    scale: 1,
    shoulder: 0.215,
    chestW: 0.178,
    chestD: 0.118,
    waistW: 0.138,
    hipW: 0.148,
    bust: 0,
    limb: 1,
    softness: 0.32,
    legLength: 1,
  },
  maleLean: {
    scale: 1.015,
    shoulder: 0.2,
    chestW: 0.168,
    chestD: 0.11,
    waistW: 0.126,
    hipW: 0.14,
    bust: 0,
    limb: 0.95,
    softness: 0.3,
    legLength: 1.03,
  },
  maleBroad: {
    scale: 1.005,
    shoulder: 0.232,
    chestW: 0.192,
    chestD: 0.128,
    waistW: 0.15,
    hipW: 0.155,
    bust: 0,
    limb: 1.1,
    softness: 0.38,
    legLength: 0.97,
  },
  female: {
    scale: 0.955,
    shoulder: 0.176,
    chestW: 0.15,
    chestD: 0.112,
    waistW: 0.106,
    hipW: 0.157,
    bust: 1,
    limb: 0.86,
    softness: 0.62,
    legLength: 1,
  },
  femaleTall: {
    scale: 0.985,
    shoulder: 0.183,
    chestW: 0.154,
    chestD: 0.114,
    waistW: 0.11,
    hipW: 0.16,
    bust: 1,
    limb: 0.89,
    softness: 0.58,
    legLength: 1.04,
  },
};

/* ------------------------------------------------------------------ *
 * Eskèlèt
 * ------------------------------------------------------------------ */

export interface Joints {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  shoulderL: THREE.Group;
  shoulderR: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  wristL: THREE.Group;
  wristR: THREE.Group;
  hipL: THREE.Group;
  hipR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  ankleL: THREE.Group;
  ankleR: THREE.Group;
  torso: THREE.Mesh;
  headMesh: THREE.Mesh;
  hipY: number;
  body: BodyType;
}

function joint(parent: THREE.Object3D, x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** Tòso: pwofil kontinyèl soti nan basen rive nan zepòl. */
function torsoProfile(body: BodyType, from: number, to: number, steps = 9): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = from + (to - from) * t;
    // 0 = basen, 1 = zepòl
    const hip = body.hipW * (0.96 + body.softness * 0.12);
    const waist = body.waistW;
    const chest = body.chestW;
    const top = body.chestW * 0.72;
    let r: number;
    if (t < 0.32) {
      const k = t / 0.32;
      r = hip + (waist - hip) * k;
    } else if (t < 0.68) {
      const k = (t - 0.32) / 0.36;
      r = waist + (chest - waist) * Math.pow(k, 0.85);
    } else {
      const k = (t - 0.68) / 0.32;
      r = chest + (top - chest) * Math.pow(k, 0.9);
    }
    // ti koube natirèl nan lonje a
    r *= 1 - 0.03 * Math.sin(t * Math.PI);
    pts.push([r, y]);
  }
  return pts;
}

export function buildSkeleton(skinMat: THREE.Material, body: BodyType = BODY_TYPES.male): Joints {
  const A = ANATOMY;
  const L = body.limb * body.scale;
  const root = new THREE.Group();

  /* ---- tòso an 3 segman ki lye ak jwenti yo ---- */
  const pelvis = joint(root, 0, A.hipY, 0);
  const pelvisMesh = latheMesh(
    [
      [body.hipW * 0.72, -0.1],
      [body.hipW * 0.97, -0.06],
      [body.hipW * 1.0, -0.01],
      [body.waistW * 1.08, 0.055],
      [body.waistW * 0.99, 0.1],
    ],
    skinMat,
  );
  pelvisMesh.position.y = 0.02;
  pelvis.add(pelvisMesh);

  const spine = joint(pelvis, 0, A.waistY - A.hipY, 0);
  const waistMesh = latheMesh(
    [
      [body.waistW * 0.99, -0.09],
      [body.waistW * 1.01, -0.02],
      [body.waistW * 1.06, 0.045],
      [body.chestW * 0.9, 0.11],
      [body.chestW * 0.95, 0.15],
    ],
    skinMat,
  );
  spine.add(waistMesh);

  const chest = joint(spine, 0, A.chestY - A.waistY, 0);
  const chestMesh = latheMesh(
    [
      [body.chestW * 0.95, -0.16],
      [body.chestW * 1.0, -0.06],
      [body.chestW * 1.02, 0.02],
      [body.chestW * 0.93, 0.1],
      [body.chestW * 0.74, 0.155],
      [body.chestW * 0.5, 0.19],
    ],
    skinMat,
  );
  chestMesh.scale.set(1, 1, body.chestD / body.chestW);
  chest.add(chestMesh);

  // trapèz + klavikil
  const trap = ellipsoid(body.chestW * 0.98, 0.045, body.chestD * 0.86, skinMat, false);
  trap.position.y = 0.15;
  chest.add(trap);
  if (body.bust > 0) {
    for (const s of [-1, 1]) {
      const b = ellipsoid(0.058, 0.05, 0.046, skinMat, false);
      b.position.set(s * body.chestW * 0.42, -0.03, -(body.chestW * 0.62 - 0.012));
      chest.add(b);
    }
  }

  /* ---- kou + tèt ---- */
  const neck = joint(chest, 0, A.neckY - A.chestY, 0.006);
  const neckMesh = latheMesh(
    [
      [0.058, -0.03],
      [0.052, 0.01],
      [0.048, 0.045],
      [0.05, 0.065],
    ],
    skinMat,
  );
  neckMesh.position.y = 0.005;
  neck.add(neckMesh);

  const head = joint(neck, 0, A.headY - A.neckY, 0);
  const headMesh = buildSkull(skinMat, body);
  head.add(headMesh);

  /* ---- bra ---- */
  const mkArm = (side: number) => {
    const shoulder = joint(chest, side * body.shoulder, A.shoulderY - A.chestY, 0);
    const deltoid = ellipsoid(0.055 * L, 0.06 * L, 0.052 * L, skinMat, false);
    deltoid.position.y = -0.012;
    shoulder.add(deltoid);

    const upper = limbMesh(
      [
        [0.049 * L, -A.upperArm],
        [0.043 * L, -A.upperArm * 0.78],
        [0.046 * L, -A.upperArm * 0.55],
        [0.045 * L, -A.upperArm * 0.4],
        [0.039 * L, -A.upperArm * 0.16],
        [0.035 * L, -A.upperArm * 0.02],
        [0.037 * L, 0],
      ],
      skinMat,
      body.softness * 0.25 + 0.78,
    );
    shoulder.add(upper);

    const elbow = joint(shoulder, 0, -A.upperArm, 0);
    const elbowBall = ellipsoid(0.036 * L, 0.033 * L, 0.034 * L, skinMat, false);
    elbow.add(elbowBall);

    const fore = limbMesh(
      [
        [0.026 * L, -A.foreArm],
        [0.03 * L, -A.foreArm * 0.8],
        [0.036 * L, -A.foreArm * 0.5],
        [0.038 * L, -A.foreArm * 0.32],
        [0.033 * L, -A.foreArm * 0.12],
        [0.028 * L, -A.foreArm * 0.02],
        [0.028 * L, 0],
      ],
      skinMat,
      body.softness * 0.2 + 0.8,
    );
    elbow.add(fore);

    const wrist = joint(elbow, 0, -A.foreArm, 0);
    buildHand(wrist, skinMat, L, side, body);
    return { shoulder, elbow, wrist };
  };
  const AL = mkArm(-1);
  const AR = mkArm(1);

  /* ---- janm ---- */
  const mkLeg = (side: number) => {
    const hip = joint(root, side * (body.hipW * 0.55), A.hipY, 0);
    const thigh = limbMesh(
      [
        [0.048 * L, -A.thigh],
        [0.06 * L, -A.thigh * 0.82],
        [0.07 * L, -A.thigh * 0.58],
        [0.076 * L, -A.thigh * 0.38],
        [0.078 * L, -A.thigh * 0.2],
        [0.074 * L, -A.thigh * 0.04],
        [0.07 * L, -A.thigh * 0.007],
      ],
      skinMat,
      body.softness * 0.3 + 0.72,
    );
    hip.add(thigh);

    const knee = joint(hip, 0, -A.thigh, 0);
    const kneeBall = ellipsoid(0.049 * L, 0.044 * L, 0.05 * L, skinMat, false);
    knee.add(kneeBall);

    const shin = limbMesh(
      [
        [0.034 * L, -A.shin],
        [0.038 * L, -A.shin * 0.82],
        [0.046 * L, -A.shin * 0.62],
        [0.05 * L, -A.shin * 0.44],
        [0.047 * L, -A.shin * 0.24],
        [0.04 * L, -A.shin * 0.06],
        [0.038 * L, -A.shin * 0.01],
      ],
      skinMat,
      body.softness * 0.3 + 0.7,
    );
    knee.add(shin);

    const ankle = joint(knee, 0, -A.shin, 0);
    return { hip, knee, ankle };
  };
  const LL = mkLeg(-1);
  const RL = mkLeg(1);

  return {
    root,
    pelvis,
    spine,
    chest,
    neck,
    head,
    shoulderL: AL.shoulder,
    shoulderR: AR.shoulder,
    elbowL: AL.elbow,
    elbowR: AR.elbow,
    wristL: AL.wrist,
    wristR: AR.wrist,
    hipL: LL.hip,
    hipR: RL.hip,
    kneeL: LL.knee,
    kneeR: RL.knee,
    ankleL: LL.ankle,
    ankleR: RL.ankle,
    torso: chestMesh as THREE.Mesh,
    headMesh: headMesh.skull,
    hipY: A.hipY,
    body,
  };
}

/* ------------------------------------------------------------------ *
 * Zo bwa tèt + men
 * ------------------------------------------------------------------ */

export interface Skull {
  skull: THREE.Mesh;
  jaw: THREE.Mesh;
}

/** Zo bwa tèt reyalis: kran awondi, machwè ki trase, manton. */
export function buildSkull(mat: THREE.Material, body: BodyType): Skull & THREE.Mesh {
  const A = ANATOMY;
  const w = A.headWidth * (0.97 + body.softness * 0.08);
  const h = A.headHeight;
  const d = A.headDepth;
  const g = new THREE.Group();

  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 24), mat);
  skull.scale.set(w, h, d);
  skull.position.y = 0.012;
  skull.castShadow = true;
  skull.receiveShadow = true;
  g.add(skull);

  // zo machwè a (joue → manton)
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat);
  jaw.scale.set(w * 0.88, h * 0.62, d * 0.92);
  jaw.position.set(0, -h * 0.44, -d * 0.06);
  jaw.castShadow = true;
  g.add(jaw);

  // manton
  const chin = ellipsoid(w * 0.38, h * 0.3, d * 0.34, mat, false);
  chin.position.set(0, -h * 0.72, -d * 0.62);
  g.add(chin);

  // zo machwè ki parèt (cheekbone)
  for (const s of [-1, 1]) {
    const cheek = ellipsoid(w * 0.3, h * 0.22, d * 0.3, mat, false);
    cheek.position.set(s * w * 0.62, -h * 0.22, -d * 0.42);
    g.add(cheek);
    const ear = ellipsoid(w * 0.16, h * 0.24, d * 0.2, mat, false);
    ear.position.set(s * w * 0.96, -h * 0.06, d * 0.02);
    g.add(ear);
  }

  const mesh = g as unknown as THREE.Mesh;
  return Object.assign(mesh, { skull, jaw });
}

/** Men reyalis: pla(n) + 4 dwèt (2 segman) + pous. */
export function buildHand(wrist: THREE.Group, mat: THREE.Material, L: number, side: number, body: BodyType) {
  const scale = L * (0.9 + body.softness * 0.12);
  const palm = boxMesh(0.03 * scale, 0.082 * scale, 0.052 * scale, mat);
  palm.position.set(0, -0.043 * scale, -0.004 * scale);
  wrist.add(palm);
  const knuckles = ellipsoid(0.03 * scale, 0.014 * scale, 0.048 * scale, mat, false);
  knuckles.position.set(0, -0.082 * scale, -0.004 * scale);
  wrist.add(knuckles);

  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.022 * scale;
    const spread = (i - 1.5) * 0.05;
    const len = (i === 0 ? 0.042 : i === 3 ? 0.036 : 0.046) * scale;
    const prox = new THREE.Group();
    prox.position.set(x, -0.088 * scale, -0.006 * scale);
    prox.rotation.z = side * spread * 0.5;
    prox.rotation.x = -0.28;
    wrist.add(prox);
    const seg1 = capsuleMesh(0.0095 * scale, len * 0.55, mat, false);
    seg1.position.y = -len * 0.34;
    prox.add(seg1);
    const distal = new THREE.Group();
    distal.position.y = -len * 0.72;
    distal.rotation.x = -0.5;
    prox.add(distal);
    const seg2 = capsuleMesh(0.0085 * scale, len * 0.45, mat, false);
    seg2.position.y = -len * 0.3;
    distal.add(seg2);
  }

  const thumb = new THREE.Group();
  thumb.position.set(-side * 0.03 * scale, -0.062 * scale, -0.028 * scale);
  thumb.rotation.set(-0.5, 0, -side * 0.85);
  wrist.add(thumb);
  const tseg = capsuleMesh(0.011 * scale, 0.05 * scale, mat, false);
  tseg.position.y = -0.026 * scale;
  thumb.add(tseg);
  const tdistal = new THREE.Group();
  tdistal.position.y = -0.05 * scale;
  tdistal.rotation.z = -side * 0.5;
  thumb.add(tdistal);
  const tseg2 = capsuleMesh(0.01 * scale, 0.03 * scale, mat, false);
  tseg2.position.y = -0.018 * scale;
  tdistal.add(tseg2);
}

/* ------------------------------------------------------------------ *
 * Animasyon pwosediral
 * ------------------------------------------------------------------ */

function ease(current: number, target: number, k: number) {
  return k >= 1 ? target : current + (target - current) * k;
}

interface JointValues {
  pelvisY: number;
  pelvisRotX: number;
  pelvisRotY: number;
  spineRotX: number;
  chestRotX: number;
  chestRotY: number;
  neckRotX: number;
  headRotX: number;
  headRotY: number;
  shoulderXR: number;
  shoulderZR: number;
  shoulderYR: number;
  shoulderXL: number;
  shoulderZL: number;
  shoulderYL: number;
  elbowXR: number;
  elbowXL: number;
  elbowZR: number;
  elbowZL: number;
  wristXR: number;
  wristXL: number;
  hipXR: number;
  hipXL: number;
  hipZR: number;
  hipZL: number;
  kneeXR: number;
  kneeXL: number;
  ankleXR: number;
  ankleXL: number;
  rootRotX: number;
  rootY: number;
  rootRotZ: number;
}

const _smooth = new WeakMap<THREE.Object3D, Record<number, THREE.Vector3>>();

function smoothRot(obj: THREE.Object3D, x: number, y: number, z: number, key: number, k: number) {
  let store = _smooth.get(obj);
  if (!store) {
    store = {};
    _smooth.set(obj, store);
  }
  let cur = store[key];
  if (!cur) {
    cur = new THREE.Vector3(x, y, z);
    store[key] = cur;
  }
  cur.set(ease(cur.x, x, k), ease(cur.y, y, k), ease(cur.z, z, k));
  obj.rotation.set(cur.x, cur.y, cur.z);
}

export interface PoseInput {
  state: PoseState;
  t: number;
  speed?: number;
  aim?: boolean;
  aimPitch?: number;
  yawOffset?: number;
  recoil?: number;
  crouchAmount?: number;
  smooth?: number;
}

export function poseSkeleton(j: Joints, input: PoseInput): void {
  const { state, t } = input;
  const k = input.smooth ?? 0.24;
  const speed = input.speed ?? 1;
  const A = ANATOMY;

  const v: JointValues = {
    pelvisY: A.hipY,
    pelvisRotX: 0,
    pelvisRotY: 0,
    spineRotX: 0.015,
    chestRotX: 0.03,
    chestRotY: 0,
    neckRotX: 0,
    headRotX: 0,
    headRotY: 0,
    shoulderXR: -0.05,
    shoulderZR: 0.1,
    shoulderYR: 0,
    shoulderXL: -0.05,
    shoulderZL: -0.1,
    shoulderYL: 0,
    elbowXR: -0.22,
    elbowXL: -0.24,
    elbowZR: 0,
    elbowZL: 0,
    wristXR: 0,
    wristXL: 0,
    hipXR: 0,
    hipXL: 0,
    hipZR: 0.02,
    hipZL: -0.02,
    kneeXR: 0.04,
    kneeXL: 0.04,
    ankleXR: 0,
    ankleXL: 0,
    rootRotX: 0,
    rootY: 0,
    rootRotZ: 0,
  };

  const stride = state === "sprint" ? 11.5 : state === "run" ? 9.0 : 5.6;
  const walkPhase = t * stride * speed;
  const swing = Math.sin(walkPhase);
  const swingCos = Math.cos(walkPhase);
  const breath = Math.sin(t * 1.5) * 0.5 + 0.5;
  const isMove = state === "walk" || state === "run" || state === "sprint";
  const amp = state === "sprint" ? 1.0 : state === "run" ? 0.74 : 0.42;

  v.chestRotX = 0.03 + breath * 0.01;
  v.pelvisRotY = swing * 0.05;
  v.chestRotY = -swing * 0.045;
  v.shoulderZL = -0.11 - breath * 0.02;
  v.shoulderZR = 0.11 + breath * 0.02;

  if (state === "dead") {
    v.rootRotX = -Math.PI / 2 + 0.1;
    v.rootY = 0.2;
    v.rootRotZ = 0.32;
    v.shoulderXL = -0.7;
    v.shoulderXR = 0.45;
    v.shoulderZL = 0.7;
    v.shoulderZR = -0.35;
    v.elbowXL = -0.5;
    v.elbowXR = -0.4;
    v.hipXL = 0.3;
    v.hipXR = -0.2;
    v.kneeXL = 0.75;
    v.kneeXR = 0.3;
    applyJoints(j, v, k);
    return;
  }
  if (state === "down") {
    v.rootRotX = -1.12;
    v.rootY = 0.32;
    v.rootRotZ = 0.34;
    v.shoulderXL = -0.55;
    v.shoulderXR = 0.85;
    v.shoulderZL = 0.5;
    v.shoulderZR = -0.4;
    v.elbowXL = -1.0;
    v.elbowXR = -0.6;
    v.hipXL = 0.6;
    v.hipXR = 0.1;
    v.kneeXL = 1.15;
    v.kneeXR = 0.5;
    applyJoints(j, v, k);
    return;
  }
  if (state === "prone") {
    v.rootRotX = -Math.PI / 2 + 0.05;
    v.rootY = 0.16;
    v.shoulderXR = -1.4;
    v.shoulderXL = -1.28;
    v.elbowXR = -1.15;
    v.elbowXL = -1.4;
    v.hipXL = -0.08;
    v.hipXR = -0.08;
    v.kneeXL = 0.25;
    v.kneeXR = 0.25;
  } else if (state === "drive") {
    v.pelvisY = A.hipY - 0.3;
    v.hipXL = -1.3;
    v.hipXR = -1.3;
    v.kneeXL = 1.1;
    v.kneeXR = 1.1;
    v.shoulderXL = -1.0;
    v.shoulderXR = -1.0;
    v.elbowXL = -0.85;
    v.elbowXR = -0.85;
    v.chestRotX = 0.34;
  } else if (state === "win") {
    v.shoulderXL = -2.45;
    v.shoulderXR = -2.45;
    v.shoulderZL = -0.25;
    v.shoulderZR = 0.25;
    v.elbowXL = -0.45;
    v.elbowXR = -0.45;
    v.headRotX = -0.22;
    v.hipXL = 0.05;
    v.hipXR = -0.05;
  } else if (state === "jump") {
    v.hipXL = -0.5;
    v.hipXR = 0.28;
    v.kneeXL = 0.85;
    v.kneeXR = 0.2;
    v.shoulderXL = -1.05;
    v.shoulderXR = -0.55;
    v.elbowXL = -0.7;
  } else if (state === "crouch") {
    const c = input.crouchAmount ?? 1;
    v.pelvisY = A.hipY - 0.33 * c;
    v.hipXL = -1.0 * c;
    v.hipXR = -1.0 * c;
    v.kneeXL = 1.65 * c;
    v.kneeXR = 1.65 * c;
    v.ankleXL = -0.6 * c;
    v.ankleXR = -0.6 * c;
    v.chestRotX = 0.32 * c;
    if (isMove) {
      v.hipXL += swing * amp * 0.35;
      v.hipXR -= swing * amp * 0.35;
      v.kneeXL += Math.max(0, swing) * 0.35;
      v.kneeXR += Math.max(0, -swing) * 0.35;
      v.shoulderXL = -swing * amp * 0.45 - 0.5;
      v.shoulderXR = swing * amp * 0.45 - 0.5;
      v.elbowXL = -0.8;
      v.elbowXR = -0.7;
    } else {
      v.shoulderXL = -0.5;
      v.shoulderXR = -0.45;
      v.elbowXL = -0.8;
      v.elbowXR = -0.75;
    }
  } else if (isMove) {
    const lean = state === "sprint" ? 0.22 : state === "run" ? 0.14 : 0.05;
    v.chestRotX = lean;
    v.pelvisRotX = lean * 0.3;
    v.hipXR = -swing * amp;
    v.hipXL = swing * amp;
    v.kneeXR = Math.max(0.05, -swing * amp * 1.15 + 0.3);
    v.kneeXL = Math.max(0.05, swing * amp * 1.15 + 0.3);
    v.ankleXR = Math.sin(walkPhase + 0.6) * 0.18;
    v.ankleXL = Math.sin(walkPhase + Math.PI + 0.6) * 0.18;
    v.shoulderXR = swing * amp * 0.75 - 0.1;
    v.shoulderXL = -swing * amp * 0.75 - 0.1;
    v.shoulderZR = 0.13 + Math.abs(swing) * 0.05;
    v.shoulderZL = -0.13 - Math.abs(swing) * 0.05;
    v.elbowXR = -0.55 - Math.max(0, swing) * 0.55;
    v.elbowXL = -0.55 - Math.max(0, -swing) * 0.55;
    v.wristXR = -0.15;
    v.wristXL = -0.15;
    v.pelvisY = A.hipY - Math.abs(swingCos) * 0.03 - (state === "sprint" ? 0.03 : 0);
    v.pelvisRotY = swing * 0.1;
    v.chestRotY = -swing * 0.13;
    v.rootRotZ = -swing * 0.012;
  } else {
    v.shoulderXL = -0.05 + breath * 0.015;
    v.shoulderXR = -0.05 + breath * 0.015;
    v.shoulderZR = 0.12;
    v.shoulderZL = -0.12;
    v.elbowXL = -0.24 - breath * 0.04;
    v.elbowXR = -0.22 - breath * 0.04;
    v.wristXR = -0.12;
    v.wristXL = -0.12;
    v.pelvisY = A.hipY + Math.sin(t * 1.3) * 0.007;
    v.pelvisRotY = Math.sin(t * 0.7) * 0.03;
    v.headRotX = Math.sin(t * 0.5) * 0.03;
    v.headRotY = Math.sin(t * 0.33) * 0.05;
  }

  // Poz ak zam
  const aiming = !!input.aim && state !== "crouch" && state !== "prone";
  if (aiming) {
    const pitch = input.aimPitch ?? 0;
    const kick = input.recoil ?? 0;
    v.chestRotY = -0.16;
    v.shoulderXR = -1.3 - pitch * 0.8 + kick * 0.28;
    v.shoulderZR = 0.26;
    v.shoulderYR = -0.18;
    v.elbowXR = -0.62 + kick * 0.42;
    v.elbowZR = -0.16;
    v.wristXR = 0.1;
    v.shoulderXL = -1.14 - pitch * 0.75 + kick * 0.24;
    v.shoulderZL = -0.34;
    v.shoulderYL = 0.22;
    v.elbowXL = -0.9 + kick * 0.32;
    v.elbowZL = 0.2;
    v.wristXL = 0.1;
    v.headRotX = -pitch * 0.28;
    v.neckRotX = -pitch * 0.1;
  } else if (state === "crouch") {
    // kenbe poz akoupi a
  } else if (!isMove) {
    v.shoulderXR = -0.05 + breath * 0.015;
    v.shoulderXL = -0.05 + breath * 0.015;
    v.shoulderZR = 0.13;
    v.shoulderZL = -0.13;
    v.elbowXR = -0.24 - breath * 0.04;
    v.elbowXL = -0.26 - breath * 0.04;
  }

  if (state === "reload" && aiming) {
    const r = (Math.sin(t * 6.0) + 1) * 0.5;
    v.shoulderXL = -1.3 - r * 0.3;
    v.elbowXL = -1.4 - r * 0.45;
    v.shoulderZL = -0.5 + r * 0.2;
  }

  if (isMove && !aiming) {
    v.headRotX = -0.04;
    v.neckRotX = -0.02;
  }

  applyJoints(j, v, k);
}

function applyJoints(j: Joints, v: JointValues, k: number) {
  j.pelvis.position.y = ease(j.pelvis.position.y, v.pelvisY, k);
  smoothRot(j.pelvis, v.pelvisRotX, v.pelvisRotY, 0, 0, k);
  smoothRot(j.spine, v.spineRotX, 0, 0, 0, k);
  smoothRot(j.chest, v.chestRotX, v.chestRotY, 0, 0, k);
  smoothRot(j.neck, v.neckRotX, 0, 0, 0, k);
  smoothRot(j.head, v.headRotX, v.headRotY, 0, 0, k);
  smoothRot(j.shoulderR, v.shoulderXR, v.shoulderYR, v.shoulderZR, 0, k);
  smoothRot(j.shoulderL, v.shoulderXL, v.shoulderYL, v.shoulderZL, 0, k);
  smoothRot(j.elbowR, v.elbowXR, 0, v.elbowZR, 0, k);
  smoothRot(j.elbowL, v.elbowXL, 0, v.elbowZL, 0, k);
  smoothRot(j.wristR, v.wristXR, 0, 0, 0, k);
  smoothRot(j.wristL, v.wristXL, 0, 0, 0, k);
  smoothRot(j.hipR, v.hipXR, 0, v.hipZR, 0, k);
  smoothRot(j.hipL, v.hipXL, 0, v.hipZL, 0, k);
  smoothRot(j.kneeR, v.kneeXR, 0, 0, 0, k);
  smoothRot(j.kneeL, v.kneeXL, 0, 0, 0, k);
  smoothRot(j.ankleR, v.ankleXR, 0, 0, 0, k);
  smoothRot(j.ankleL, v.ankleXL, 0, 0, 0, k);
  const rootYaw = j.root.rotation.y;
  smoothRot(j.root, v.rootRotX, rootYaw, v.rootRotZ, 1, k);
  j.root.position.y = ease(j.root.position.y, v.rootY, k);
}

export function totalHeight() {
  return ANATOMY.headY + ANATOMY.headHeight + 0.03;
}
