"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { districts } from "@/lib/portfolio";
import { terrainHeight, roadFlatten } from "@/lib/noise";
import { distanceToRoad } from "@/lib/roads";
import { useGame } from "@/lib/store";
import { makeGlassMaterial, makeNeonMaterial, updateCityMaterials } from "@/lib/buildingMaterials";

/* -------------------------------------------------------------------------- */
/*  Premium glass-tower skyline.                                              */
/*                                                                            */
/*  Each "city" district grows a cluster of varied skyscrapers — setbacks,    */
/*  podiums, rooftop mechanicals (HVAC, water tanks, antennas, helipads),     */
/*  LED roofline accents and a neon facade sign. Every tower is merged into a */
/*  few per-district geometries (glass / concrete / neon) so the entire city  */
/*  renders in a handful of draw calls, with reflective glass + procedural    */
/*  lit windows from the shared shader material. Buildings are visual only —  */
/*  no colliders — so navigation, routes and missions are untouched.          */
/* -------------------------------------------------------------------------- */

type CityTier = "core" | "mid" | "low";
const CITY: Record<string, { tier: CityTier; sign?: string }> = {
  lab: { tier: "core", sign: "AI RESEARCH" },
  downtown: { tier: "core", sign: "DATA CENTER" },
  startup: { tier: "mid", sign: "STARTUP LABS" },
  campus: { tier: "mid", sign: "UNIVERSITY" },
  space: { tier: "mid", sign: "AEROSPACE" },
  waterfront: { tier: "low", sign: "HARBOR ONE" },
};

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blocksRoad(x: number, z: number, clearance = 4.5) {
  return distanceToRoad(x, z) < clearance || roadFlatten(x, z) > 0.04;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}
function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, seg = 12) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(x, y, z);
  return g;
}

type Tower = { x: number; z: number; w: number; d: number; h: number; rot: number; r: number };

// deterministic tower cluster for a district
function layout(id: string, cx: number, cz: number, tier: CityTier): Tower[] {
  const rnd = seeded(1000 + id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  // fewer buildings, kept as a tight cluster inside each district
  const count = tier === "core" ? 7 : tier === "mid" ? 5 : 3;
  const maxH = tier === "core" ? 46 : tier === "mid" ? 30 : 20;
  const out: Tower[] = [];
  let tries = 0;
  while (out.length < count && tries < count * 16) {
    tries++;
    const a = rnd() * Math.PI * 2;
    // ring the plaza (leave the centre clear for the mission marker + orbs)
    const r = 9 + Math.pow(rnd(), 0.7) * 12;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    if (blocksRoad(x, z, 4.2)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 4.6)) continue;
    // tallest towers near the plaza edge -> a believable skyline peak
    const central = 1 - THREE.MathUtils.clamp((r - 9) / 12, 0, 1);
    const h = (tier === "low" ? 9 : 13) + Math.pow(rnd(), 1.5) * (maxH - 13) * (0.5 + central * 0.7);
    const w = 2.4 + rnd() * (tier === "core" ? 2.6 : 1.8);
    out.push({ x, z, w, d: w * (0.78 + rnd() * 0.4), h, rot: (rnd() - 0.5) * 0.9, r });
  }
  return out;
}

type Built = {
  glass: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  neon: THREE.BufferGeometry;
  signs: { x: number; y: number; z: number; rot: number; text: string }[];
  base: number;
};

function buildDistrict(id: string, cx: number, cz: number, tier: CityTier, sign?: string): Built {
  const base = terrainHeight(cx, cz);
  const rnd = seeded(7000 + id.length * 13 + Math.round(cx));
  const glass: THREE.BufferGeometry[] = [];
  const trim: THREE.BufferGeometry[] = [];
  const neon: THREE.BufferGeometry[] = [];
  const signs: Built["signs"] = [];

  const towers = layout(id, cx, cz, tier);
  let tallest: Tower | null = null;

  for (const t of towers) {
    const lx = t.x - cx;
    const lz = t.z - cz;
    const foot = terrainHeight(t.x, t.z) - base; // sit on the terrain

    // ---- podium (ground floor, concrete) ----
    trim.push(box(t.w + 0.9, 1.6, t.d + 0.9, lx, foot + 0.8, lz, t.rot));
    // entrance canopy + door glow
    neon.push(box(t.w * 0.6, 0.12, 0.2, lx + Math.cos(t.rot) * 0.0, foot + 1.5, lz + t.d * 0.5 + 0.5, t.rot));

    // ---- stacked body with setbacks ----
    const segs = t.h > 30 ? 3 : t.h > 18 ? 2 : 1;
    let y = foot + 1.6;
    let w = t.w;
    let d = t.d;
    let remaining = t.h;
    for (let s = 0; s < segs; s++) {
      const segH = s === segs - 1 ? remaining : remaining * (0.42 + rnd() * 0.18);
      remaining -= segH;
      glass.push(box(w, segH, d, lx, y + segH / 2, lz, t.rot));
      // roofline LED accent at each setback
      neon.push(box(w + 0.06, 0.16, 0.06, lx, y + segH, lz + d / 2, t.rot));
      neon.push(box(0.06, 0.16, d + 0.06, lx + w / 2, y + segH, lz, t.rot));
      y += segH;
      w *= 0.72 + rnd() * 0.12;
      d *= 0.72 + rnd() * 0.12;
    }

    // ---- rooftop mechanicals on the crown ----
    const rTop = y;
    // parapet rim
    trim.push(box(w + 0.3, 0.4, d + 0.3, lx, rTop + 0.2, lz, t.rot));
    // HVAC blocks
    const units = 1 + Math.floor(rnd() * 3);
    for (let u = 0; u < units; u++) {
      const ox = (rnd() - 0.5) * w * 0.6;
      const oz = (rnd() - 0.5) * d * 0.6;
      trim.push(box(0.7 + rnd() * 0.5, 0.5 + rnd() * 0.4, 0.7 + rnd() * 0.5, lx + ox, rTop + 0.6, lz + oz, t.rot));
    }
    // water tank
    if (rnd() < 0.6) trim.push(cyl(0.45, 0.5, 1.0, lx + w * 0.25, rTop + 0.9, lz - d * 0.2, 10));
    // antenna / comms mast on taller towers
    if (t.h > 20) {
      trim.push(box(0.1, 2.4 + rnd() * 2.5, 0.1, lx - w * 0.2, rTop + 1.6, lz + d * 0.2));
      neon.push(box(0.16, 0.16, 0.16, lx - w * 0.2, rTop + 3.9 + rnd() * 2.5, lz + d * 0.2));
    }
    // helipad H on the very tallest
    if (!tallest || t.h > tallest.h) tallest = t;
  }

  // ---- neon facade sign on the tallest tower, facing OUTWARD toward approaching
  //      players (away from the plaza centre) so it reads as a landmark ----
  if (sign && tallest) {
    const t = tallest;
    const lx = t.x - cx;
    const lz = t.z - cz;
    const outLen = Math.hypot(lx, lz) || 1;
    const ox = lx / outLen;
    const oz = lz / outLen;
    const dist = Math.max(t.w, t.d) * 0.5 + 0.12;
    const signRot = Math.atan2(ox, oz);
    const foot = terrainHeight(t.x, t.z) - base;
    const signY = foot + t.h * 0.72;
    signs.push({ x: lx + ox * dist, y: signY, z: lz + oz * dist, rot: signRot, text: sign });
    // backing panel glow just behind the text
    neon.push(box(Math.min(t.w * 1.5, sign.length * 0.6), 1.15, 0.08, lx + ox * (dist - 0.06), signY, lz + oz * (dist - 0.06), signRot));
  }

  const merge = (arr: THREE.BufferGeometry[]) =>
    arr.length ? mergeGeometries(arr, false)! : new THREE.BufferGeometry();
  const built = { glass: merge(glass), trim: merge(trim), neon: merge(neon), signs, base };
  [...glass, ...trim, ...neon].forEach((g) => g.dispose());
  return built;
}

function DistrictTowers({ id, cx, cz, tier, sign, glassMat, trimMat, neonMat }: {
  id: string; cx: number; cz: number; tier: CityTier; sign?: string;
  glassMat: THREE.Material; trimMat: THREE.Material; neonMat: THREE.Material;
}) {
  const built = useMemo(() => buildDistrict(id, cx, cz, tier, sign), [id, cx, cz, tier, sign]);
  const color = useMemo(() => districts.find((d) => d.id === id)?.color ?? "#8ab4ff", [id]);
  return (
    <group position={[cx, built.base, cz]}>
      <mesh geometry={built.glass} material={glassMat} castShadow receiveShadow />
      <mesh geometry={built.trim} material={trimMat} castShadow receiveShadow />
      <mesh geometry={built.neon} material={neonMat} />
      {built.signs.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} rotation={[0, s.rot, 0]}>
          <Text fontSize={0.82} color={color} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#04060c" maxWidth={12}>
            {s.text}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function CitySkyline() {
  const vitality = useGame((s) => s.vitality);

  // a few shared glass tints (cool blues/teals) + warm interior; one concrete trim
  const mats = useMemo(() => {
    const glassPool = [
      makeGlassMaterial({ tint: "#25384a", accent: "#ffd39a" }),
      makeGlassMaterial({ tint: "#1c3140", accent: "#ffe0b0", colW: 1.7, colH: 2.1 }),
      makeGlassMaterial({ tint: "#2b3b4d", accent: "#cfe4ff", colW: 1.4, colH: 1.8 }),
    ];
    const trim = new THREE.MeshStandardMaterial({ color: "#9aa1a8", metalness: 0.35, roughness: 0.72 });
    const neon = makeNeonMaterial("#8fd0ff", 1.4);
    return { glassPool, trim, neon };
  }, []);

  const cityDistricts = useMemo(
    () => districts.filter((d) => CITY[d.id]).map((d) => ({ d, cfg: CITY[d.id] })),
    []
  );

  useFrame((state) => {
    const g = useGame.getState();
    const tod = g.timeOfDay;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    const night = THREE.MathUtils.clamp(1 - Math.max(elev, 0) * 2.2, 0, 1);
    updateCityMaterials(state.clock.elapsedTime, night, g.vitality);
  });

  return (
    <group>
      {cityDistricts.map(({ d, cfg }, i) => (
        <DistrictTowers
          key={d.id}
          id={d.id}
          cx={d.position[0]}
          cz={d.position[1]}
          tier={cfg.tier}
          sign={cfg.sign}
          glassMat={mats.glassPool[i % mats.glassPool.length]}
          trimMat={mats.trim}
          neonMat={mats.neon}
        />
      ))}
    </group>
  );
}
