import * as THREE from "three";
import {
  ANATOMY,
  boxMesh,
  ellipsoid,
  latheMesh,
  limbMesh,
  tubeMesh,
  type BodyType,
  type Joints,
} from "./Body";

/**
 * OKAP CITY — atelye rad: tout pyès rad yo koupe selon pwofons kò a
 * (menm pwofil ak kò a + yon ti epesè twal), kidonk rad yo kole sou kò a
 * olye de flote bò kote l.
 */

/* ------------------------------------------------------------------ *
 * Pwofil kò a
 * ------------------------------------------------------------------ */

/** Reyon tòso a nan yon wotè global y (an mèt). */
export function torsoRadius(body: BodyType, y: number) {
  const hip = body.hipW * (0.96 + body.softness * 0.12);
  const waist = body.waistW;
  const chest = body.chestW;
  const top = body.chestW * 0.72;
  const t = Math.max(-0.2, (y - 0.85) / (ANATOMY.neckY - 0.85));
  if (t < 0.16) {
    const k = Math.max(0, t) / 0.16;
    return hip + (waist - hip) * k;
  }
  if (t < 0.5) {
    const k = (t - 0.16) / 0.34;
    return waist + (chest - waist) * Math.pow(k, 0.85);
  }
  if (t < 1) {
    const k = (t - 0.5) / 0.5;
    return chest + (top - chest) * Math.pow(k, 0.9);
  }
  return top;
}

function torsoDepth(body: BodyType) {
  return body.chestD / body.chestW;
}

const SEAMS: [number, number, number][] = [
  // [jwenti, wotè jwenti a, marge anwo]
  [0, ANATOMY.hipY, 0.1],
  [1, ANATOMY.waistY, 0.12],
  [2, ANATOMY.chestY, 0.2],
];

/** Kouch twal sou tòso a, koupe an segman ki swiv jwenti yo (li ka pliye). */
export function torsoShell(
  j: Joints,
  mat: THREE.Material,
  opts: { from: number; to: number; inflate?: number; depth?: number; steps?: number; segments?: number },
) {
  const body = j.body;
  const inflate = opts.inflate ?? 1.05;
  const depth = opts.depth ?? torsoDepth(body) * 1.02;
  const steps = opts.steps ?? 5;
  const joints = [j.pelvis, j.spine, j.chest];
  const group = new THREE.Group();
  group.name = "torso-shell";

  for (let s = 0; s < 3; s++) {
    const [index, baseY, margin] = SEAMS[s];
    const segFrom = Math.max(opts.from, baseY - margin);
    const segTo = Math.min(opts.to, s === 2 ? opts.to : baseY + margin);
    if (segTo <= segFrom) continue;
    const profile: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const y = segFrom + ((segTo - segFrom) * i) / steps;
      profile.push([torsoRadius(body, y) * inflate, y - baseY]);
    }
    const mesh = latheMesh(profile, mat, 20);
    mesh.scale.set(1, 1, depth);
    joints[index].add(mesh);
    group.attach?.(mesh);
    joints[index].add(mesh);
  }
  return group;
}

/** Bò manch (zepòl → ponyèt), ak yon kouch twal. */
export function sleeve(
  j: Joints,
  mat: THREE.Material,
  opts: { inflate?: number; long?: boolean; short?: boolean; cuff?: THREE.Material; shoulderPad?: boolean },
) {
  const L = j.body.limb;
  const inflate = opts.inflate ?? 1.16;
  const depth = j.body.softness * 0.2 + 0.84;
  const pairs: [THREE.Group, THREE.Group][] = [
    [j.shoulderR, j.elbowR],
    [j.shoulderL, j.elbowL],
  ];
  for (const [shoulder, elbow] of pairs) {
    const cap = ellipsoid(0.052 * L * inflate, 0.055 * L * inflate, 0.05 * L, mat, false);
    cap.position.y = -0.008;
    shoulder.add(cap);
    const upper = limbMesh(
      [
        [0.045 * L * inflate, -ANATOMY.upperArm],
        [0.041 * L * inflate, -ANATOMY.upperArm * 0.75],
        [0.045 * L * inflate, -ANATOMY.upperArm * 0.45],
        [0.047 * L * inflate, -ANATOMY.upperArm * 0.2],
        [0.04 * L * inflate, 0],
      ],
      mat,
      depth,
    );
    shoulder.add(upper);
    if (opts.long) {
      const fore = limbMesh(
        [
          [0.03 * L * inflate, -ANATOMY.foreArm * 0.92],
          [0.036 * L * inflate, -ANATOMY.foreArm * 0.66],
          [0.041 * L * inflate, -ANATOMY.foreArm * 0.42],
          [0.04 * L * inflate, -ANATOMY.foreArm * 0.16],
          [0.035 * L * inflate, 0],
        ],
        mat,
        depth,
      );
      elbow.add(fore);
      if (opts.cuff) {
        const cuff = tubeMesh(0.04 * L, 0.037 * L, 0.045, opts.cuff, true, 1, 0.9);
        cuff.position.y = -ANATOMY.foreArm + 0.03;
        elbow.add(cuff);
      }
    } else if (opts.short) {
      const hem = tubeMesh(0.048 * L * inflate, 0.046 * L * inflate, 0.03, mat, true, 1, depth);
      hem.position.y = -ANATOMY.upperArm * 0.55;
      shoulder.add(hem);
    }
  }
}

/** Kòlè (kraze oswa won). */
export function collar(j: Joints, mat: THREE.Material, opts: { height?: number; radius?: number; open?: boolean } = {}) {
  const h = opts.height ?? 0.075;
  const r = opts.radius ?? 0.062;
  const shell = latheMesh(
    [
      [r, 0],
      [r * 1.06, h * 0.45],
      [r * 0.94, h],
    ],
    mat,
    16,
  );
  shell.position.y = -0.045;
  j.neck.add(shell);
  return shell;
}

/** Zip / bann devan. */
export function placket(j: Joints, mat: THREE.Material, opts: { from?: number; to?: number; width?: number; offset?: number } = {}) {
  const from = opts.from ?? 1.06;
  const to = opts.to ?? 1.46;
  const w = opts.width ?? 0.02;
  const mat2 = mat;
  const g = new THREE.Group();
  const body = j.body;
  for (let y = from; y < to; y += 0.06) {
    const band = boxMesh(w, 0.07, 0.012, mat2);
    band.position.set(0, y + 0.03 - ANATOMY.chestY, -torsoRadius(body, y) * (torsoDepth(body) + 0.09) + (opts.offset ?? 0));
    band.castShadow = false;
    g.add(band);
  }
  j.chest.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 * Pantalon
 * ------------------------------------------------------------------ */

export function pantsShell(
  j: Joints,
  mat: THREE.Material,
  opts: { cargo?: boolean; shorts?: boolean; inflate?: number; cuff?: THREE.Material; cuffedAt?: number },
) {
  const L = j.body.limb;
  const inflate = opts.inflate ?? 1.12;
  const depth = j.body.softness * 0.25 + 0.8;
  const hip = latheMesh(
    [
      [j.body.hipW * 0.7 * inflate, -0.12],
      [j.body.hipW * 0.99 * inflate, -0.07],
      [j.body.hipW * 1.02 * inflate, -0.01],
      [j.body.waistW * 1.1 * inflate, 0.06],
      [j.body.waistW * 1.02 * inflate, 0.11],
    ],
    mat,
    18,
  );
  hip.scale.set(1, 1, depth * 1.08);
  hip.position.y = 0.02;
  j.pelvis.add(hip);

  const pairs: [THREE.Group, THREE.Group, THREE.Group][] = [
    [j.hipR, j.kneeR, j.ankleR],
    [j.hipL, j.kneeL, j.ankleL],
  ];
  for (const [hipJoint, knee, ankle] of pairs) {
    const thighLen = opts.shorts ? ANATOMY.thigh * 0.52 : ANATOMY.thigh;
    const thigh = limbMesh(
      [
        [0.052 * L * inflate, -thighLen],
        [0.062 * L * inflate, -thighLen * 0.8],
        [0.072 * L * inflate, -thighLen * 0.55],
        [0.077 * L * inflate, -thighLen * 0.32],
        [0.078 * L * inflate, -thighLen * 0.12],
        [0.074 * L * inflate, 0],
      ],
      mat,
      depth,
    );
    hipJoint.add(thigh);
    if (opts.shorts) {
      const hem = tubeMesh(0.055 * L * inflate, 0.052 * L * inflate, 0.03, opts.cuff ?? mat, true, 1, depth);
      hem.position.y = -thighLen + 0.01;
      hipJoint.add(hem);
    } else {
      const shin = limbMesh(
        [
          [0.036 * L * inflate, -ANATOMY.shin * 0.94],
          [0.04 * L * inflate, -ANATOMY.shin * 0.78],
          [0.05 * L * inflate, -ANATOMY.shin * 0.58],
          [0.053 * L * inflate, -ANATOMY.shin * 0.4],
          [0.05 * L * inflate, -ANATOMY.shin * 0.2],
          [0.042 * L * inflate, 0],
        ],
        mat,
        depth,
      );
      knee.add(shin);
      if (opts.cargo) {
        const pocketMat = opts.cuff ?? mat;
        const p = boxMesh(0.055, 0.115, 0.075, pocketMat);
        p.position.set(0.062 * L, -ANATOMY.thigh * 0.62, 0.01);
        hipJoint.add(p);
        const flap = boxMesh(0.058, 0.022, 0.08, pocketMat);
        flap.position.set(0.062 * L, -ANATOMY.thigh * 0.55, 0.01);
        hipJoint.add(flap);
      }
      const cuffY = opts.cuffedAt ?? -ANATOMY.shin * 0.86;
      const shoeCuff = tubeMesh(0.042 * L, 0.05 * L, 0.05, opts.cuff ?? mat, true, 1, depth);
      shoeCuff.position.y = cuffY;
      knee.add(shoeCuff);
      void ankle;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Soulye
 * ------------------------------------------------------------------ */

export function shoes(
  j: Joints,
  mat: THREE.Material,
  soleMat: THREE.Material,
  opts: { boot?: boolean; highTop?: boolean; color?: THREE.Material } = {},
) {
  const L = j.body.limb;
  const pairs: [THREE.Group][] = [[j.ankleR], [j.ankleL]];
  for (const [ankle] of pairs) {
    const body = new THREE.Group();
    body.position.set(0, -0.058, -0.026);
    ankle.add(body);
    const main = boxMesh(0.036 * L * 3.0, 0.03 * L * 2.6, 0.088 * L * 2.6, mat);
    main.scale.set(main.scale.x * 1.02, main.scale.y, main.scale.z);
    body.add(main);
    const toe = ellipsoid(0.028 * L * 1.9, 0.02 * L * 2.1, 0.032 * L * 2.0, mat, false);
    toe.position.set(0, -0.006, -0.075);
    body.add(toe);
    const heel = ellipsoid(0.026 * L * 1.8, 0.024 * L * 2.1, 0.026 * L * 1.9, mat, false);
    heel.position.set(0, 0.004, 0.052);
    body.add(heel);
    const sole = boxMesh(0.04 * L * 2.8, 0.014, 0.1 * L * 2.6, soleMat);
    sole.position.set(0, -0.024, -0.004);
    sole.castShadow = false;
    body.add(sole);
    if (opts.highTop || opts.boot) {
      const shaft = latheMesh(
        [
          [0.031 * L * 1.9, 0],
          [0.033 * L * 1.9, 0.045],
          [0.03 * L * 1.9, 0.085],
        ],
        mat,
        14,
      );
      shaft.position.set(0, 0.0, 0.0);
      shaft.scale.set(1, 1, 0.9);
      ankle.add(shaft);
      const laces = boxMesh(0.014, 0.07, 0.03, soleMat);
      laces.position.set(0, 0.045, -0.03);
      laces.castShadow = false;
      ankle.add(laces);
    } else {
      const collarMesh = latheMesh(
        [
          [0.03 * L * 1.9, 0],
          [0.033 * L * 1.9, 0.036],
        ],
        mat,
        14,
      );
      collarMesh.position.y = 0.0;
      collarMesh.scale.set(1, 1, 0.9);
      ankle.add(collarMesh);
    }
    if (opts.color) {
      const stripe = boxMesh(0.078 * L, 0.012, 0.02, opts.color);
      stripe.position.set(0, -0.012, 0.05);
      stripe.castShadow = false;
      body.add(stripe);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Gan
 * ------------------------------------------------------------------ */

export function gloves(j: Joints, mat: THREE.Material, opts: { fingerless?: boolean } = {}) {
  const L = j.body.limb;
  for (const wrist of [j.wristR, j.wristL]) {
    const palm = boxMesh(0.032 * L, 0.07 * L, 0.056 * L, mat);
    palm.position.set(0, -0.045 * L, -0.004);
    wrist.add(palm);
    const cuff = latheMesh(
      [
        [0.026 * L, 0],
        [0.028 * L, 0.045],
        [0.024 * L, 0.075],
      ],
      mat,
      12,
    );
    cuff.position.set(0, 0.0, 0);
    wrist.add(cuff);
    if (!opts.fingerless) {
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * 0.022 * L;
        const seg = boxMesh(0.02 * L, 0.052 * L, 0.024 * L, mat);
        seg.position.set(x, -0.1 * L, -0.006);
        seg.rotation.x = -0.3;
        wrist.add(seg);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Bagay sou tèt
 * ------------------------------------------------------------------ */

export function cap(j: Joints, mat: THREE.Material, opts: { brim?: boolean; logoMat?: THREE.Material; logo?: string } = {}) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), mat);
  dome.scale.set(ANATOMY.headWidth * 1.09, ANATOMY.headHeight * 0.86, ANATOMY.headDepth * 1.06);
  dome.position.y = 0.052;
  dome.rotation.x = -0.06;
  dome.castShadow = true;
  j.head.add(dome);
  const band = latheMesh(
    [
      [ANATOMY.headWidth * 1.06, 0],
      [ANATOMY.headWidth * 1.1, 0.028],
      [ANATOMY.headWidth * 1.08, 0.05],
    ],
    mat,
    20,
  );
  band.scale.set(1, 1, ANATOMY.headDepth / ANATOMY.headWidth * 1.04);
  band.position.y = 0.016;
  j.head.add(band);
  if (opts.brim !== false) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.068, 0.012, 20, 1, false, Math.PI * 0.5, Math.PI), mat);
    brim.scale.set(1.25, 1, 1.3);
    brim.position.set(0, 0.028, -0.048);
    brim.rotation.x = 0.14;
    brim.castShadow = true;
    j.head.add(brim);
  }
  if (opts.logo && opts.logoMat) {
    const logo = boxMesh(0.026, 0.026, 0.006, opts.logoMat);
    logo.position.set(0, 0.056, -(ANATOMY.headDepth * 1.03));
    logo.rotation.x = -0.16;
    j.head.add(logo);
  }
}

export function bandana(j: Joints, mat: THREE.Material, opts: { knot?: boolean; y?: number } = {}) {
  const band = latheMesh(
    [
      [ANATOMY.headWidth * 1.05, -0.022],
      [ANATOMY.headWidth * 1.12, 0],
      [ANATOMY.headWidth * 1.05, 0.024],
    ],
    mat,
    20,
  );
  band.scale.set(1, 1, ANATOMY.headDepth / ANATOMY.headWidth * 1.05);
  band.position.y = opts.y ?? 0.052;
  j.head.add(band);
  if (opts.knot !== false) {
    const knot = ellipsoid(0.02, 0.018, 0.02, mat, false);
    knot.position.set(0.0, (opts.y ?? 0.052) + 0.01, ANATOMY.headDepth * 1.06);
    j.head.add(knot);
    const tail = boxMesh(0.02, 0.06, 0.014, mat);
    tail.position.set(0.012, (opts.y ?? 0.052) - 0.03, ANATOMY.headDepth * 1.08);
    tail.rotation.z = 0.3;
    j.head.add(tail);
  }
}

export function sunglasses(j: Joints, lensMat: THREE.Material, frameMat: THREE.Material, opts: { mirrored?: boolean } = {}) {
  const y = 0.02;
  for (const s of [-1, 1]) {
    const lens = boxMesh(0.052, 0.03, 0.012, lensMat);
    lens.position.set(s * 0.032, y, -(ANATOMY.headDepth * 0.86));
    lens.rotation.y = s * -0.28;
    j.head.add(lens);
    const frame = boxMesh(0.056, 0.034, 0.008, frameMat);
    frame.position.set(s * 0.032, y, -(ANATOMY.headDepth * 0.82));
    frame.rotation.y = s * -0.28;
    j.head.add(frame);
  }
  const bridge = boxMesh(0.024, 0.012, 0.01, frameMat);
  bridge.position.set(0, y + 0.004, -(ANATOMY.headDepth * 0.86));
  j.head.add(bridge);
  const arms = boxMesh(0.16, 0.008, 0.008, frameMat);
  arms.position.set(0, y + 0.006, -(ANATOMY.headDepth * 0.4));
  j.head.add(arms);
  void opts;
}

export function goggles(j: Joints, strapMat: THREE.Material, lensMat: THREE.Material) {
  const strap = latheMesh(
    [
      [ANATOMY.headWidth * 1.03, -0.014],
      [ANATOMY.headWidth * 1.09, 0],
      [ANATOMY.headWidth * 1.03, 0.014],
    ],
    strapMat,
    18,
  );
  strap.scale.set(1, 1, ANATOMY.headDepth / ANATOMY.headWidth * 1.05);
  strap.position.y = 0.062;
  j.head.add(strap);
  const lens = boxMesh(0.084, 0.03, 0.02, lensMat);
  lens.position.set(0, 0.062, -(ANATOMY.headDepth * 0.92));
  lens.rotation.x = -0.1;
  j.head.add(lens);
}

export function hoops(j: Joints, mat: THREE.Material) {
  for (const s of [-1, 1]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0022, 6, 16), mat);
    hoop.position.set(s * ANATOMY.headWidth * 0.98, -0.028, 0.004);
    hoop.rotation.y = Math.PI / 2;
    hoop.castShadow = false;
    j.head.add(hoop);
  }
}

export function chain(j: Joints, mat: THREE.Material, opts: { pendant?: boolean } = {}) {
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.0035, 6, 26), mat);
  neckRing.rotation.x = Math.PI / 2 - 0.18;
  neckRing.position.set(0, 0.04, 0.006);
  neckRing.scale.set(1, 1, 0.72);
  neckRing.castShadow = false;
  j.chest.add(neckRing);
  const drop = boxMesh(0.02, 0.055, 0.006, mat);
  drop.position.set(0, 0.0, -(j.body.chestD * 0.9));
  drop.rotation.x = 0.1;
  j.chest.add(drop);
  if (opts.pendant !== false) {
    const pendant = boxMesh(0.028, 0.03, 0.008, mat);
    pendant.position.set(0, -0.03, -(j.body.chestD * 0.92));
    j.chest.add(pendant);
  }
}

export function choker(j: Joints, mat: THREE.Material) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 22), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, -0.04, 0.005);
  ring.castShadow = false;
  j.neck.add(ring);
}

export function watch(j: Joints, mat: THREE.Material) {
  const w = boxMesh(0.032, 0.012, 0.032, mat);
  w.position.set(0, -0.01, 0);
  w.castShadow = false;
  j.wristR.add(w);
}

/* ------------------------------------------------------------------ *
 * Sak do, may, pochèt
 * ------------------------------------------------------------------ */

export function backpack(j: Joints, mat: THREE.Material, opts: { flagMat?: THREE.Material; size?: number; pockets?: boolean } = {}) {
  const s = opts.size ?? 1;
  const body = ellipsoid(0.135 * s, 0.2 * s, 0.085 * s, mat, true);
  body.position.set(0, -0.0, j.body.chestD * 0.9);
  j.chest.add(body);
  const lid = ellipsoid(0.12 * s, 0.06 * s, 0.075 * s, mat, true);
  lid.position.set(0, 0.17 * s, j.body.chestD * 0.9);
  j.chest.add(lid);
  const front = ellipsoid(0.1 * s, 0.11 * s, 0.05 * s, mat, true);
  front.position.set(0, -0.08 * s, j.body.chestD * 1.16);
  j.chest.add(front);
  for (const side of [-1, 1]) {
    const strap = boxMesh(0.036, 0.3, 0.02, mat);
    strap.position.set(side * 0.075, -0.04, -j.body.chestD * 0.72);
    strap.rotation.z = side * 0.12;
    j.chest.add(strap);
  }
  if (opts.pockets !== false) {
    const pouch = boxMesh(0.1, 0.07, 0.05, mat);
    pouch.position.set(0, -0.16 * s, j.body.chestD * 1.14);
    j.chest.add(pouch);
  }
  if (opts.flagMat) {
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.048), opts.flagMat);
    flag.position.set(0, 0.02, j.body.chestD * 1.32);
    flag.rotation.y = Math.PI;
    j.chest.add(flag);
  }
}

/** May taktik (straps sou pwatrin). */
export function chestRig(j: Joints, mat: THREE.Material, opts: { pouches?: number } = {}) {
  const n = opts.pouches ?? 4;
  for (let i = 0; i < n; i++) {
    const y = 0.02 - i * 0.075;
    const pouch = boxMesh(0.062, 0.06, 0.045, mat);
    pouch.position.set(i % 2 === 0 ? -0.045 : 0.045, y, -(j.body.chestD * 1.02));
    j.chest.add(pouch);
    const strap = boxMesh(0.014, 0.06, 0.02, mat);
    strap.position.set(i % 2 === 0 ? -0.045 : 0.045, y + 0.03, -(j.body.chestD * 1.05));
    j.chest.add(strap);
  }
  const belt = latheMesh(
    [
      [torsoRadius(j.body, ANATOMY.chestY - 0.1) * 1.06, 0],
      [torsoRadius(j.body, ANATOMY.chestY - 0.06) * 1.08, 0.045],
      [torsoRadius(j.body, ANATOMY.chestY - 0.1) * 1.06, 0.09],
    ],
    mat,
    18,
  );
  belt.scale.set(1, 1, torsoDepth(j.body) * 1.06);
  belt.position.y = -0.14;
  j.chest.add(belt);
}

/** Senti ak zepòl may pou fi (harness). */
export function harness(j: Joints, mat: THREE.Material) {
  const belt = latheMesh(
    [
      [j.body.hipW * 1.14, -0.035],
      [j.body.hipW * 1.18, 0],
      [j.body.hipW * 1.14, 0.035],
    ],
    mat,
    18,
  );
  belt.scale.set(1, 1, torsoDepth(j.body) * 1.12);
  belt.position.y = 0.0;
  j.pelvis.add(belt);
  for (const s of [-1, 1]) {
    const strap = boxMesh(0.022, 0.26, 0.016, mat);
    strap.position.set(s * 0.05, 0.16, -(j.body.chestD * 0.98));
    strap.rotation.z = s * 0.16;
    j.chest.add(strap);
  }
  const cross = boxMesh(0.1, 0.02, 0.014, mat);
  cross.position.set(0, 0.2, -(j.body.chestD * 0.96));
  j.chest.add(cross);
}

/** Kòlè/kapuches pou sweatshirt. */
export function hood(j: Joints, mat: THREE.Material) {
  const h = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), mat);
  h.scale.set(0.115, 0.13, 0.12);
  h.position.set(0, 0.1, 0.085);
  h.rotation.x = 0.5;
  h.castShadow = true;
  j.chest.add(h);
}

/** Zepòlèt (kousen) pou rad espò. */
export function shoulderPads(j: Joints, mat: THREE.Material) {
  for (const shoulder of [j.shoulderR, j.shoulderL]) {
    const pad = ellipsoid(0.052, 0.03, 0.05, mat, false);
    pad.position.y = 0.005;
    shoulder.add(pad);
  }
}
