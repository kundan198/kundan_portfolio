"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight, roadFlatten } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { useGame, type GraphicsQuality } from "@/lib/store";
import { tracker } from "@/lib/refs";

/* -------------------------------------------------------------------------- */
/*  Dense GPU-instanced grass.                                                */
/*                                                                            */
/*  • One tapered, gently-curved blade geometry, shared by every instance.    */
/*  • A single per-instance attribute (aPhase) drives a custom GLSL vertex     */
/*    shader: two-octave wind + gusts that bend toward the tip, plus hero/car  */
/*    trample. We piggyback on MeshStandardMaterial via onBeforeCompile so the */
/*    grass still receives soft shadows, fog and the golden-hour lighting.     */
/*  • Blades are placed everywhere EXCEPT roads, sidewalks/corridors, the      */
/*    pond and building plots, with a density + height falloff hugging roads.  */
/*  • LOD + chunk streaming: a dense NEAR tier and a sparser FAR tier are      */
/*    refilled from a precomputed pool only when the hero crosses a chunk.     */
/* -------------------------------------------------------------------------- */

const POOL_SPACING = 0.46; // metres between candidate blades (finest density)
const WORLD_RADIUS = 122;
const STREAM_CELL = 24; // refill grass when the hero crosses this grid

type Tier = { nearR: number; farR: number; nearKeep: number; farKeep: number; nearCap: number; farCap: number };
const TIERS: Record<GraphicsQuality, Tier> = {
  low: { nearR: 24, farR: 44, nearKeep: 0.62, farKeep: 0.22, nearCap: 12000, farCap: 13000 },
  medium: { nearR: 32, farR: 62, nearKeep: 0.8, farKeep: 0.32, nearCap: 18000, farCap: 21000 },
  high: { nearR: 40, farR: 80, nearKeep: 0.92, farKeep: 0.36, nearCap: 27000, farCap: 34000 },
  ultra: { nearR: 46, farR: 94, nearKeep: 1.0, farKeep: 0.42, nearCap: 36000, farCap: 46000 },
};

// pond footprints (must match Terrain / Scenery)
function nearWater(x: number, z: number) {
  return Math.hypot(x - 76, z + 68) < 44 || Math.hypot(x + 12, z + 14) < 26;
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pool = {
  px: Float32Array;
  py: Float32Array;
  pz: Float32Array;
  scale: Float32Array; // uniform blade scale (height in metres)
  yaw: Float32Array;
  lean: Float32Array;
  phase: Float32Array;
  cr: Float32Array;
  cg: Float32Array;
  cb: Float32Array;
  keep: Float32Array; // stable 0..1 used for density LOD (no flicker)
  n: number;
};

// One tapered, slightly curved blade. Unit height (0..1), thin width baked in,
// normals biased upward so blades read soft & bright under the sky (lush look).
function makeBladeGeometry() {
  const SEG = 4;
  const rows = SEG + 1;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < rows; i++) {
    const t = i / SEG;
    const w = 0.075 * (1 - t * 0.82) + 0.008; // taper to a near-point tip
    const curve = 0.16 * t * t; // gentle forward arc baked in
    pos.push(-w, t, curve, w, t, curve);
    // upward-biased normals = soft, even sky lighting across the blade
    nor.push(-0.25, 0.9, 0.35, 0.25, 0.9, 0.35);
  }
  for (let s = 0; s < SEG; s++) {
    const a = s * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function buildPool(): Pool {
  const rnd = rand(20260630);
  const px: number[] = [];
  const py: number[] = [];
  const pz: number[] = [];
  const scale: number[] = [];
  const yaw: number[] = [];
  const lean: number[] = [];
  const phase: number[] = [];
  const cr: number[] = [];
  const cg: number[] = [];
  const cb: number[] = [];
  const keep: number[] = [];

  const col = new THREE.Color();
  const min = -WORLD_RADIUS;
  const span = WORLD_RADIUS * 2;
  for (let gz = min; gz < WORLD_RADIUS; gz += POOL_SPACING) {
    for (let gx = min; gx < WORLD_RADIUS; gx += POOL_SPACING) {
      const x = gx + (rnd() - 0.5) * POOL_SPACING * 1.2;
      const z = gz + (rnd() - 0.5) * POOL_SPACING * 1.2;
      const dC = Math.hypot(x, z);
      if (dC > WORLD_RADIUS) continue;
      if (dC < 7) continue; // keep the spawn pad clear
      if (nearWater(x, z)) continue; // no grass on the pond

      // O(1) baked road influence: 1 on the asphalt/centre -> 0 a few metres off.
      const rf = roadFlatten(x, z);
      if (rf > 0.14) continue; // no grass on roads, sidewalks or their flattened corridor
      // density + height falloff hugging the road shoulder (1 in open field -> 0 at road)
      const edge = THREE.MathUtils.clamp(1 - rf / 0.14, 0, 1);
      if (rnd() > 0.3 + edge * 0.7) continue;

      // clear building plots
      let onPlot = false;
      for (const d of districts) {
        if (Math.hypot(x - d.position[0], z - d.position[1]) < 8.5) { onPlot = true; break; }
      }
      if (onPlot) continue;

      const mountain = dC > 88;
      const meadow = !mountain && rf < 0.02;

      // height: tall lush meadow, only gently trimmed near roads & up the slopes
      let h = (mountain ? 0.55 : 0.85) + Math.pow(rnd(), 1.3) * (meadow ? 1.15 : 0.7);
      h *= 0.62 + edge * 0.38;

      // colour: lush warm-leaning green in fields, drier/paler on the heights,
      // with per-blade hue + lightness jitter for natural variation
      const dry = mountain ? 0.26 + rnd() * 0.2 : rnd() < 0.04 ? 0.32 : 0.0;
      const hue = 0.33 - dry * 0.09 + (rnd() - 0.5) * 0.03; // ~120deg = true lush green
      const sat = (mountain ? 0.44 : 0.58) - dry * 0.16 + (rnd() - 0.5) * 0.08;
      const lit = (mountain ? 0.42 : 0.44) + Math.pow(rnd(), 2) * 0.14 - dry * 0.02;
      col.setHSL(THREE.MathUtils.clamp(hue, 0.2, 0.38), THREE.MathUtils.clamp(sat, 0.3, 0.85), THREE.MathUtils.clamp(lit, 0.3, 0.64));

      px.push(x);
      py.push(terrainHeight(x, z));
      pz.push(z);
      scale.push(h);
      yaw.push(rnd() * Math.PI);
      lean.push((rnd() - 0.5) * 0.5);
      phase.push(rnd() * Math.PI * 2);
      cr.push(col.r);
      cg.push(col.g);
      cb.push(col.b);
      keep.push(rnd());
    }
  }
  return {
    px: new Float32Array(px),
    py: new Float32Array(py),
    pz: new Float32Array(pz),
    scale: new Float32Array(scale),
    yaw: new Float32Array(yaw),
    lean: new Float32Array(lean),
    phase: new Float32Array(phase),
    cr: new Float32Array(cr),
    cg: new Float32Array(cg),
    cb: new Float32Array(cb),
    keep: new Float32Array(keep),
    n: px.length,
  };
}

function injectGrassShader(shader: THREE.WebGLProgramParametersWithUniforms, store: THREE.WebGLProgramParametersWithUniforms[]) {
  shader.uniforms.uTime = { value: 0 };
  shader.uniforms.uWind = { value: 1 };
  shader.uniforms.uHero = { value: new THREE.Vector3(9999, 0, 9999) };
  shader.uniforms.uCar = { value: new THREE.Vector3(9999, 0, 9999) };
  shader.uniforms.uGold = { value: new THREE.Color("#ffcaa0") };

  shader.vertexShader =
    "attribute float aPhase;\nuniform float uTime;\nuniform float uWind;\nuniform vec3 uHero;\nuniform vec3 uCar;\nvarying float vBladeH;\n" +
    shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
     float bladeH = position.y;        // 0 base -> 1 tip
     vBladeH = bladeH;
     float bend = bladeH * bladeH;      // displacement concentrates toward the tip
     vec3 root = vec3(instanceMatrix[3].x, instanceMatrix[3].y, instanceMatrix[3].z);
     // two-octave sway + a slow broad gust rolling across the field
     float sway = sin(uTime * 1.7 + aPhase) * 0.6 + sin(uTime * 3.3 + aPhase * 1.7) * 0.22;
     float gust = sin(uTime * 0.45 + root.x * 0.05 + root.z * 0.045) * 0.5 + 0.5;
     transformed.x += (sway + gust * 0.6) * bend * 0.42 * uWind;
     transformed.z += cos(uTime * 1.25 + aPhase) * bend * 0.26 * uWind;
     // trample: bend away from the hero / car when they get close
     vec2 toHero = root.xz - uHero.xz;
     float hd = length(toHero);
     if (hd < 3.0) {
       vec2 d = normalize(toHero + vec2(0.0001));
       float p = (1.0 - smoothstep(0.4, 3.0, hd)) * bend;
       transformed.x += d.x * p * 1.1;
       transformed.z += d.y * p * 1.1;
       transformed.y -= p * 0.3;
     }
     vec2 toCar = root.xz - uCar.xz;
     float cd = length(toCar);
     if (cd < 4.4) {
       vec2 d = normalize(toCar + vec2(0.0001));
       float p = (1.0 - smoothstep(0.8, 4.4, cd)) * bend;
       transformed.x += d.x * p * 1.5;
       transformed.z += d.y * p * 1.5;
       transformed.y -= p * 0.45;
     }`
  );

  // base-darkening (fake AO) + warm golden tip so blades glow at grazing sun
  shader.fragmentShader = "uniform vec3 uGold;\nvarying float vBladeH;\n" + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_fragment>",
    `#include <color_fragment>
     diffuseColor.rgb *= mix(0.62, 1.12, vBladeH);
     diffuseColor.rgb += uGold * pow(vBladeH, 3.0) * 0.06;`
  );
  // A whisper of self-illumination keyed to the blade's own green keeps shaded
  // blades from crushing to black without making the grass glow.
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <emissivemap_fragment>",
    `#include <emissivemap_fragment>
     totalEmissiveRadiance += diffuseColor.rgb * (0.02 + vBladeH * 0.03);`
  );
  store.push(shader);
}

function GrassLayer({
  pool,
  capacity,
  radius,
  selector,
  shaderStore,
}: {
  pool: Pool;
  capacity: number;
  radius: number;
  selector: (i: number, d2: number) => boolean;
  shaderStore: React.MutableRefObject<THREE.WebGLProgramParametersWithUniforms[]>;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(makeBladeGeometry, []);

  // per-instance wind phase attribute
  const phaseAttr = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1), [capacity]);
  // Pre-create instanceColor (white) so USE_INSTANCING_COLOR is defined at first
  // shader compile — otherwise setColorAt() in the effect is silently ignored.
  const colorAttr = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(1), 3), [capacity]);

  // chunk-streamed refill
  const streamKey = useGame((s) => {
    const cx = Math.floor(s.heroPos[0] / STREAM_CELL);
    const cz = Math.floor(s.heroPos[2] / STREAM_CELL);
    return `${cx}:${cz}`;
  });

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const hx = tracker.hero.x;
    const hz = tracker.hero.z;
    let count = 0;
    for (let i = 0; i < pool.n && count < capacity; i++) {
      const dx = pool.px[i] - hx;
      const dz = pool.pz[i] - hz;
      const d2 = dx * dx + dz * dz;
      if (!selector(i, d2)) continue;
      dummy.position.set(pool.px[i], pool.py[i], pool.pz[i]);
      dummy.rotation.set(pool.lean[i] * 0.5, pool.yaw[i], pool.lean[i]);
      dummy.scale.setScalar(pool.scale[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(count, dummy.matrix);
      col.setRGB(pool.cr[i], pool.cg[i], pool.cb[i]);
      mesh.setColorAt(count, col);
      phaseAttr.setX(count, pool.phase[i]);
      count++;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    phaseAttr.needsUpdate = true;
    // bounding sphere big enough that the whole streamed patch is frustum-tested as one
    mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(hx, 0, hz), radius + 4);
    mesh.position.set(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, capacity, streamKey]);

  return (
    <instancedMesh
      ref={(m) => {
        ref.current = m;
        if (m) {
          m.geometry.setAttribute("aPhase", phaseAttr);
          m.instanceColor = colorAttr; // present before first compile
        }
      }}
      args={[geom, undefined, capacity]}
      receiveShadow
      frustumCulled={false}
    >
      <meshStandardMaterial
        side={THREE.DoubleSide}
        roughness={0.82}
        metalness={0}
        onBeforeCompile={(s) => injectGrassShader(s, shaderStore.current)}
      />
    </instancedMesh>
  );
}

export default function Grass() {
  const quality = useGame((s) => s.graphicsQuality);
  const tier = TIERS[quality];
  const pool = useMemo(buildPool, []);
  const shaderStore = useRef<THREE.WebGLProgramParametersWithUniforms[]>([]);

  const nearR2 = tier.nearR * tier.nearR;
  const farR2 = tier.farR * tier.farR;

  useFrame((state) => {
    const wind = useGame.getState().weather === "rain" ? 2.1 : 1;
    const t = state.clock.elapsedTime;
    for (const s of shaderStore.current) {
      s.uniforms.uTime.value = t;
      s.uniforms.uWind.value = wind;
      s.uniforms.uHero.value.set(tracker.hero.x, tracker.hero.y, tracker.hero.z);
      s.uniforms.uCar.value.set(tracker.car.x, tracker.car.y, tracker.car.z);
    }
  });

  // key by quality so the capacity-sized buffers rebuild cleanly on tier change
  return (
    <group key={quality}>
      <GrassLayer
        pool={pool}
        capacity={tier.nearCap}
        radius={tier.nearR}
        shaderStore={shaderStore}
        selector={(i, d2) => d2 <= nearR2 && pool.keep[i] < tier.nearKeep}
      />
      <GrassLayer
        pool={pool}
        capacity={tier.farCap}
        radius={tier.farR}
        shaderStore={shaderStore}
        selector={(i, d2) => d2 > nearR2 && d2 <= farR2 && pool.keep[i] < tier.farKeep}
      />
    </group>
  );
}
