"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight, roadFlatten } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { useGame } from "@/lib/store";
import { distanceToRoad, inDrivingCorridor } from "@/lib/roads";
import { tracker } from "@/lib/refs";

type Species = "oak" | "pine" | "maple" | "birch" | "cedar" | "willow" | "palm" | "sapling" | "dead" | "giant" | "moss";
type Tree = {
  species: Species;
  x: number;
  z: number;
  y: number;
  height: number;
  trunk: number;
  crown: number;
  rot: number;
  hue: number;
  lean: number;
  wind: number;
};
type GrassSpecies = "lawn" | "meadow" | "wild" | "forest" | "dry" | "marsh" | "alpine" | "roadside" | "flowering";
type GrassBlade = {
  species: GrassSpecies;
  x: number;
  z: number;
  y: number;
  s: number;
  rot: number;
  color: THREE.Color;
  wide: number;
};
type GroundCoverKind = "flower" | "fern" | "moss" | "leaf" | "twig" | "pebble" | "mushroom";
type GroundCover = {
  kind: GroundCoverKind;
  x: number;
  z: number;
  y: number;
  s: number;
  rot: number;
  color: THREE.Color;
};
type CarpetPatch = {
  x: number;
  z: number;
  y: number;
  sx: number;
  sz: number;
  rot: number;
  color: THREE.Color;
};

const ROCKS = 70;
// Grass blades are now rendered by the dedicated Grass component (curved blades,
// GLSL wind/LOD/streaming). Scenery keeps trees, rocks, flowers, ground cover and
// the soft colour "carpet" patches that blend the ground beneath the grass.
const ROADSIDE_GRASS = 0;
const FIELD_GRASS = 0;
const CARPET_PATCHES = 4200;
const GROUND_COVER = 4200;
const STREAM_CELL = 32;
const FOREST_COUNTS: Record<Species, number> = {
  oak: 64,
  pine: 92,
  maple: 48,
  birch: 42,
  cedar: 54,
  willow: 18,
  palm: 28,
  sapling: 95,
  dead: 8,
  giant: 12,
  moss: 58,
};

const speciesOrder = Object.keys(FOREST_COUNTS) as Species[];
const grassSpeciesOrder: GrassSpecies[] = ["lawn", "meadow", "wild", "forest", "dry", "marsh", "alpine", "roadside", "flowering"];
const coverKindOrder: GroundCoverKind[] = ["flower", "fern", "moss", "leaf", "twig", "pebble", "mushroom"];

function emptyGrassGroups(): Record<GrassSpecies, GrassBlade[]> {
  return {
    lawn: [],
    meadow: [],
    wild: [],
    forest: [],
    dry: [],
    marsh: [],
    alpine: [],
    roadside: [],
    flowering: [],
  };
}

function emptyCoverGroups(): Record<GroundCoverKind, GroundCover[]> {
  return {
    flower: [],
    fern: [],
    moss: [],
    leaf: [],
    twig: [],
    pebble: [],
    mushroom: [],
  };
}

function streamRadius(kind: "tree" | "grass" | "rock") {
  const q = useGame.getState().graphicsQuality;
  if (kind === "grass") return q === "low" ? 58 : q === "medium" ? 86 : q === "high" ? 112 : 148;
  if (kind === "rock") return q === "low" ? 52 : q === "medium" ? 74 : q === "high" ? 98 : 130;
  return q === "low" ? 56 : q === "medium" ? 82 : q === "high" ? 108 : 142;
}

function nearStream(x: number, z: number, hx: number, hz: number, radius: number) {
  return Math.abs(x - hx) < radius && Math.abs(z - hz) < radius && Math.hypot(x - hx, z - hz) < radius;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function farFromDistricts(x: number, z: number, min: number) {
  if (Math.hypot(x, z) < 20) return false;
  if (inDrivingCorridor(x, z, 4.5)) return false;
  if (roadFlatten(x, z) > 0.08) return false; // exact: never on a flattened road corridor
  for (const d of districts) {
    if (Math.hypot(x - d.position[0], z - d.position[1]) < min + 10) return false;
  }
  return true;
}

function nearWater(x: number, z: number) {
  return Math.hypot(x - 76, z + 68) < 42 || Math.hypot(x + 12, z + 14) < 24;
}

function districtInfluence(x: number, z: number) {
  let best = { id: "wild", d: Infinity };
  for (const district of districts) {
    const d = Math.hypot(x - district.position[0], z - district.position[1]);
    if (d < best.d) best = { id: district.id, d };
  }
  return best;
}

function pickGrassSpecies(x: number, z: number, road: number, rnd: () => number): GrassSpecies {
  const district = districtInfluence(x, z);
  const water = nearWater(x, z);
  const mountain = Math.hypot(x, z) > 86;
  if (road < 9) return rnd() < 0.18 ? "flowering" : "roadside";
  if (water) return rnd() < 0.72 ? "marsh" : "meadow";
  if (mountain) return rnd() < 0.7 ? "alpine" : "dry";
  if (district.d < 24 && (district.id === "home" || district.id === "campus" || district.id === "lab" || district.id === "startup")) {
    return rnd() < 0.72 ? "lawn" : "flowering";
  }
  if (district.id === "forest" && district.d < 52) return rnd() < 0.58 ? "forest" : rnd() < 0.78 ? "wild" : "flowering";
  if (district.id === "downtown" && district.d < 34) return rnd() < 0.65 ? "roadside" : "lawn";
  if (rnd() < 0.1) return "dry";
  return rnd() < 0.58 ? "meadow" : rnd() < 0.78 ? "wild" : "flowering";
}

function grassScale(species: GrassSpecies, rnd: () => number) {
  switch (species) {
    case "lawn":
      return { h: 0.28 + rnd() * 0.42, wide: 0.34 + rnd() * 0.32, sat: 0.42, light: 0.32 };
    case "roadside":
      return { h: 0.38 + rnd() * 0.72, wide: 0.32 + rnd() * 0.34, sat: 0.36, light: 0.34 };
    case "meadow":
      return { h: 0.76 + rnd() * 1.28, wide: 0.34 + rnd() * 0.36, sat: 0.46, light: 0.28 };
    case "wild":
      return { h: 0.95 + rnd() * 1.65, wide: 0.38 + rnd() * 0.42, sat: 0.48, light: 0.25 };
    case "forest":
      return { h: 0.58 + rnd() * 1.08, wide: 0.32 + rnd() * 0.36, sat: 0.38, light: 0.2 };
    case "dry":
      return { h: 0.34 + rnd() * 0.72, wide: 0.18 + rnd() * 0.22, sat: 0.32, light: 0.31 };
    case "marsh":
      return { h: 0.9 + rnd() * 1.7, wide: 0.36 + rnd() * 0.44, sat: 0.54, light: 0.25 };
    case "alpine":
      return { h: 0.22 + rnd() * 0.48, wide: 0.16 + rnd() * 0.18, sat: 0.28, light: 0.29 };
    case "flowering":
      return { h: 0.62 + rnd() * 1.24, wide: 0.32 + rnd() * 0.38, sat: 0.5, light: 0.3 };
  }
}

function grassColor(species: GrassSpecies, rnd: () => number) {
  const c = new THREE.Color();
  const dry = species === "dry" || (species !== "marsh" && rnd() < 0.025);
  if (dry) return c.setHSL(0.18 + rnd() * 0.05, 0.32 + rnd() * 0.12, 0.34 + rnd() * 0.1);
  if (species === "marsh") return c.setHSL(0.3 + rnd() * 0.06, 0.56 + rnd() * 0.16, 0.34 + rnd() * 0.11);
  if (species === "forest") return c.setHSL(0.29 + rnd() * 0.06, 0.46 + rnd() * 0.14, 0.29 + rnd() * 0.11);
  if (species === "alpine") return c.setHSL(0.23 + rnd() * 0.05, 0.34 + rnd() * 0.1, 0.34 + rnd() * 0.09);
  if (species === "flowering") return c.setHSL(0.25 + rnd() * 0.08, 0.56 + rnd() * 0.16, 0.34 + rnd() * 0.12);
  return c.setHSL(0.25 + rnd() * 0.08, 0.54 + rnd() * 0.18, 0.32 + rnd() * 0.12);
}

function carpetColor(x: number, z: number, rnd: () => number) {
  const c = new THREE.Color();
  const water = nearWater(x, z);
  const mountain = Math.hypot(x, z) > 86;
  if (water) return c.setHSL(0.31 + rnd() * 0.04, 0.5 + rnd() * 0.14, 0.3 + rnd() * 0.1);
  if (mountain) return c.setHSL(0.21 + rnd() * 0.06, 0.36 + rnd() * 0.12, 0.32 + rnd() * 0.1);
  return c.setHSL(0.25 + rnd() * 0.08, 0.48 + rnd() * 0.18, 0.3 + rnd() * 0.11);
}

function pickScale(species: Species, r: number) {
  switch (species) {
    case "giant":
      return { height: 21 + r * 13, trunk: 0.72 + r * 0.55, crown: 4.6 + r * 2.4 };
    case "oak":
      return { height: 8 + r * 9, trunk: 0.42 + r * 0.38, crown: 3.2 + r * 2.2 };
    case "pine":
      return { height: 10 + r * 13, trunk: 0.28 + r * 0.24, crown: 2.4 + r * 1.8 };
    case "maple":
      return { height: 7 + r * 8, trunk: 0.3 + r * 0.28, crown: 2.9 + r * 1.9 };
    case "birch":
      return { height: 8 + r * 8, trunk: 0.22 + r * 0.16, crown: 2.1 + r * 1.2 };
    case "cedar":
      return { height: 7 + r * 8, trunk: 0.34 + r * 0.22, crown: 2.2 + r * 1.5 };
    case "willow":
      return { height: 7 + r * 7, trunk: 0.36 + r * 0.28, crown: 3.7 + r * 1.6 };
    case "palm":
      return { height: 8 + r * 8, trunk: 0.22 + r * 0.16, crown: 2.7 + r * 1.25 };
    case "sapling":
      return { height: 2 + r * 3.8, trunk: 0.08 + r * 0.08, crown: 0.8 + r * 0.8 };
    case "dead":
      return { height: 5 + r * 9, trunk: 0.24 + r * 0.22, crown: 0.4 + r * 0.5 };
    case "moss":
      return { height: 7 + r * 8, trunk: 0.36 + r * 0.28, crown: 2.6 + r * 1.5 };
  }
}

function foliageColor(species: Species, hue: number) {
  // light, fresh green across every species
  const color = new THREE.Color();
  switch (species) {
    case "pine":
      return color.setHSL(0.3 + hue * 0.03, 0.5, 0.5 + hue * 0.08);
    case "cedar":
      return color.setHSL(0.31 + hue * 0.03, 0.48, 0.5 + hue * 0.08);
    case "maple":
      return color.setHSL(0.26 + hue * 0.05, 0.55, 0.54 + hue * 0.08);
    case "birch":
      return color.setHSL(0.29 + hue * 0.04, 0.52, 0.56 + hue * 0.08);
    case "willow":
      return color.setHSL(0.28 + hue * 0.04, 0.54, 0.54 + hue * 0.08);
    case "palm":
      return color.setHSL(0.3 + hue * 0.03, 0.58, 0.54 + hue * 0.08);
    case "sapling":
      return color.setHSL(0.3 + hue * 0.03, 0.52, 0.55 + hue * 0.08);
    case "moss":
      return color.setHSL(0.29 + hue * 0.03, 0.46, 0.5 + hue * 0.08);
    case "giant":
      return color.setHSL(0.29 + hue * 0.04, 0.5, 0.5 + hue * 0.08);
    default:
      return color.setHSL(0.29 + hue * 0.04, 0.52, 0.54 + hue * 0.08);
  }
}

function trunkColor(species: Species, hue: number) {
  const color = new THREE.Color();
  if (species === "birch") return color.setHSL(0.11, 0.12, 0.68 + hue * 0.08);
  if (species === "dead") return color.setHSL(0.09, 0.12, 0.36 + hue * 0.16);
  if (species === "palm") return color.setHSL(0.095 + hue * 0.03, 0.38, 0.36 + hue * 0.1);
  if (species === "moss") return color.setHSL(0.19, 0.22, 0.31 + hue * 0.1);
  return color.setHSL(0.08 + hue * 0.04, 0.42, 0.32 + hue * 0.13);
}

function makeForest() {
  const rnd = seeded(88201);
  const trees: Tree[] = [];
  for (const species of speciesOrder) {
    const count = FOREST_COUNTS[species];
    let tries = 0;
    while (trees.filter((t) => t.species === species).length < count && tries < count * 18) {
      tries++;
      let x: number;
      let z: number;

      if (species === "palm") {
        const coastal = rnd() < 0.68;
        const baseX = coastal ? 70 : 38;
        const baseZ = coastal ? -52 : 46;
        const a = rnd() * Math.PI * 2;
        const r = 10 + rnd() * 34;
        x = baseX + Math.cos(a) * r + (rnd() - 0.5) * 12;
        z = baseZ + Math.sin(a) * r + (rnd() - 0.5) * 12;
      } else if (species === "willow") {
        const a = rnd() * Math.PI * 2;
        const r = 9 + rnd() * 18;
        const coastal = rnd() < 0.55;
        x = (coastal ? 70 : -8) + Math.cos(a) * r;
        z = (coastal ? -58 : -12) + Math.sin(a) * r;
      } else {
        const cluster = rnd();
        const a = rnd() * Math.PI * 2;
        const r = cluster < 0.52 ? 18 + Math.pow(rnd(), 0.7) * 34 : cluster < 0.76 ? 16 + Math.pow(rnd(), 0.7) * 42 : 28 + Math.pow(rnd(), 0.72) * 90;
        const ox = cluster < 0.52 ? -58 : cluster < 0.76 ? -6 : 0;
        const oz = cluster < 0.52 ? 26 : cluster < 0.76 ? 70 : 0;
        x = ox + Math.cos(a) * r + (rnd() - 0.5) * 10;
        z = oz + Math.sin(a) * r + (rnd() - 0.5) * 10;
      }

      if (Math.hypot(x, z) > 116) continue;
      if (!farFromDistricts(x, z, species === "sapling" ? 9 : 12)) continue;
      if (species !== "willow" && species !== "palm" && nearWater(x, z) && rnd() < 0.55) continue;

      const scale = pickScale(species, rnd());
      trees.push({
        species,
        x,
        z,
        y: terrainHeight(x, z),
        height: scale.height,
        trunk: scale.trunk,
        crown: scale.crown,
        rot: rnd() * Math.PI * 2,
        hue: rnd(),
        lean: (rnd() - 0.5) * (species === "dead" ? 0.24 : 0.12),
        wind: 0.45 + rnd() * 1.2,
      });
    }
  }
  return trees;
}

function assignTrunk(dummy: THREE.Object3D, t: Tree) {
  dummy.position.set(t.x, t.y + t.height * 0.5, t.z);
  const palmLean = t.species === "palm" ? t.lean * 1.9 + Math.sin(t.rot) * 0.08 : t.lean;
  dummy.rotation.set(palmLean, t.rot, -palmLean * 0.6);
  dummy.scale.set(t.trunk, t.height, t.trunk * (0.82 + t.hue * 0.35));
  dummy.updateMatrix();
}

function assignCrown(dummy: THREE.Object3D, t: Tree, layer = 0) {
  const layerLift = layer * t.height * 0.1;
  const layerScale = 1 - layer * 0.18;
  dummy.position.set(
    t.x + Math.sin(t.rot + layer) * t.crown * 0.22,
    t.y + t.height * (0.68 + layer * 0.055) + layerLift,
    t.z + Math.cos(t.rot - layer) * t.crown * 0.18
  );
  dummy.rotation.set(t.lean * 0.5, t.rot + layer * 0.8, -t.lean * 0.3);
  if (t.species === "palm") {
    dummy.scale.set(t.crown * 0.42 * layerScale, t.crown * 0.34 * layerScale, t.crown * 0.42 * layerScale);
  } else if (t.species === "pine" || t.species === "cedar") {
    dummy.scale.set(t.crown * layerScale, t.height * 0.22 * layerScale, t.crown * layerScale);
  } else if (t.species === "willow") {
    dummy.scale.set(t.crown * 1.15 * layerScale, t.crown * 0.78 * layerScale, t.crown * 1.05 * layerScale);
  } else {
    dummy.scale.set(t.crown * (1.1 + t.hue * 0.25) * layerScale, t.crown * (0.72 + t.hue * 0.18) * layerScale, t.crown * (0.9 + t.hue * 0.22) * layerScale);
  }
  dummy.updateMatrix();
}

export default function Scenery() {
  const trunkRefs = useRef<Record<Species, THREE.InstancedMesh | null>>({} as Record<Species, THREE.InstancedMesh | null>);
  const crownRefs = useRef<Record<Species, THREE.InstancedMesh | null>>({} as Record<Species, THREE.InstancedMesh | null>);
  const extraCrownRefs = useRef<Record<Species, THREE.InstancedMesh | null>>({} as Record<Species, THREE.InstancedMesh | null>);
  const palmFrondRef = useRef<THREE.InstancedMesh>(null);
  const rootsRef = useRef<THREE.InstancedMesh>(null);
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const barkMarkRef = useRef<THREE.InstancedMesh>(null);
  const floorRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const carpetRef = useRef<THREE.InstancedMesh>(null);
  const grassRefs = useRef<Record<GrassSpecies, THREE.InstancedMesh | null>>({} as Record<GrassSpecies, THREE.InstancedMesh | null>);
  const coverRefs = useRef<Record<GroundCoverKind, THREE.InstancedMesh | null>>({} as Record<GroundCoverKind, THREE.InstancedMesh | null>);
  const crownShaders = useRef<THREE.WebGLProgramParametersWithUniforms[]>([]);
  const grassShaders = useRef<THREE.WebGLProgramParametersWithUniforms[]>([]);
  const streamKey = useGame((s) => {
    const q = s.graphicsQuality;
    const cx = Math.floor(s.heroPos[0] / STREAM_CELL);
    const cz = Math.floor(s.heroPos[2] / STREAM_CELL);
    return `${q}:${cx}:${cz}`;
  });

  const trees = useMemo(makeForest, []);
  const visibleTrees = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const radius = streamRadius("tree");
    return trees.filter((t) => nearStream(t.x, t.z, hx, hz, radius));
  }, [trees, streamKey]);

  const bySpecies = useMemo(() => {
    const groups: Record<Species, Tree[]> = {
      oak: [],
      pine: [],
      maple: [],
      birch: [],
      cedar: [],
      willow: [],
      palm: [],
      sapling: [],
      dead: [],
      giant: [],
      moss: [],
    };
    visibleTrees.forEach((t) => groups[t.species].push(t));
    return groups;
  }, [visibleTrees]);

  const extras = useMemo(() => {
    const rnd = seeded(99112);
    const roots: { tree: Tree; angle: number; length: number; thick: number }[] = [];
    const branches: { tree: Tree; angle: number; y: number; length: number; thick: number; dead: boolean }[] = [];
    const bark: { tree: Tree; angle: number; y: number; color: THREE.Color; w: number; h: number }[] = [];
    const floor: { x: number; z: number; y: number; rot: number; s: number; color: THREE.Color }[] = [];

    visibleTrees.forEach((t, ti) => {
      const old = t.species === "giant" || t.species === "oak" || t.species === "moss";
      const rootCount = old ? 5 : t.species === "sapling" ? 1 : 3;
      for (let i = 0; i < rootCount; i++) {
        roots.push({
          tree: t,
          angle: t.rot + (i / rootCount) * Math.PI * 2 + (rnd() - 0.5) * 0.5,
          length: t.trunk * (2.7 + rnd() * 3.2),
          thick: t.trunk * (0.13 + rnd() * 0.12),
        });
      }
      const branchCount = t.species === "palm" ? 0 : t.species === "dead" ? 5 : t.species === "pine" || t.species === "cedar" ? 2 : old ? 6 : 3;
      for (let i = 0; i < branchCount; i++) {
        branches.push({
          tree: t,
          angle: t.rot + rnd() * Math.PI * 2,
          y: t.height * (0.34 + rnd() * 0.44),
          length: t.crown * (0.45 + rnd() * 0.55),
          thick: t.trunk * (0.11 + rnd() * 0.12),
          dead: t.species === "dead" || rnd() < 0.17,
        });
      }
      const markCount = t.species === "birch" ? 5 : old ? 4 : 2;
      for (let i = 0; i < markCount; i++) {
        const moss = t.species === "moss" || rnd() < 0.32;
        bark.push({
          tree: t,
          angle: rnd() * Math.PI * 2,
          y: t.height * (0.08 + rnd() * 0.64),
          color: new THREE.Color(moss ? "#3f5f32" : t.species === "birch" ? "#28251f" : "#2b1a12"),
          w: t.trunk * (0.5 + rnd() * 0.7),
          h: 0.24 + rnd() * 0.7,
        });
      }
      const litterCount = t.species === "palm" ? 6 : t.species === "pine" || t.species === "cedar" ? 4 : old ? 8 : 3;
      for (let i = 0; i < litterCount; i++) {
        const a = rnd() * Math.PI * 2;
        const r = t.trunk * 1.4 + rnd() * t.crown * 0.75;
        const x = t.x + Math.cos(a) * r;
        const z = t.z + Math.sin(a) * r;
        floor.push({
          x,
          z,
          y: terrainHeight(x, z) + 0.05,
          rot: rnd() * Math.PI * 2,
          s: 0.18 + rnd() * 0.55,
          color: new THREE.Color(t.species === "pine" || t.species === "cedar" ? "#8a5e2d" : ["#8f6234", "#b5823b", "#6f7435", "#5b3b25"][Math.floor(rnd() * 4)]),
        });
      }
      if (ti % 9 === 0) {
        const x = t.x + Math.cos(t.rot) * t.trunk * 1.2;
        const z = t.z + Math.sin(t.rot) * t.trunk * 1.2;
        floor.push({ x, z, y: terrainHeight(x, z) + 0.1, rot: rnd() * 6.28, s: 0.28 + rnd() * 0.35, color: new THREE.Color("#b85b3d") });
      }
    });
    return { roots, branches, bark, floor };
  }, [visibleTrees]);

  const palmFronds = useMemo(() => {
    const fronds: { x: number; y: number; z: number; len: number; wide: number; rot: number; droop: number; color: THREE.Color }[] = [];
    visibleTrees.forEach((t) => {
      if (t.species !== "palm") return;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = t.rot + (i / count) * Math.PI * 2 + Math.sin(t.hue * 18 + i) * 0.14;
        const len = t.crown * (1.45 + ((i + 3) % 4) * 0.12);
        const wide = t.crown * (0.16 + (i % 3) * 0.02);
        fronds.push({
          x: t.x + Math.cos(a) * len * 0.42,
          y: t.y + t.height * 0.92 - 0.1 - (i % 2) * 0.16,
          z: t.z + Math.sin(a) * len * 0.42,
          len,
          wide,
          rot: a,
          droop: 0.18 + (i % 4) * 0.055,
          color: foliageColor("palm", Math.min(1, t.hue + i * 0.035)),
        });
      }
    });
    return fronds;
  }, [visibleTrees]);

  const rocks = useMemo(() => {
    const rnd = seeded(73122);
    const arr: { x: number; z: number; y: number; s: number; rot: number }[] = [];
    let tries = 0;
    while (arr.length < ROCKS && tries < ROCKS * 8) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = 20 + rnd() * 96;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!farFromDistricts(x, z, 8) || inDrivingCorridor(x, z, 6.5)) continue;
      arr.push({ x, z, y: terrainHeight(x, z), s: 0.35 + rnd() * 1.55, rot: rnd() * 6.28 });
    }
    return arr;
  }, []);

  const visibleRocks = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const radius = streamRadius("rock");
    return rocks.filter((r) => nearStream(r.x, r.z, hx, hz, radius));
  }, [rocks, streamKey]);

  const carpetPatches = useMemo(() => {
    const rnd = seeded(55017);
    const arr: CarpetPatch[] = [];
    let tries = 0;
    while (arr.length < CARPET_PATCHES && tries < CARPET_PATCHES * 7) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 118;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const road = distanceToRoad(x, z);
      if (road < 5.2 || roadFlatten(x, z) > 0.025) continue;
      if (districts.some((d) => Math.hypot(x - d.position[0], z - d.position[1]) < 10)) continue;
      const mountain = Math.hypot(x, z) > 88;
      const nearRoad = road < 12;
      arr.push({
        x,
        z,
        y: terrainHeight(x, z) + 0.045,
        sx: (nearRoad ? 0.75 : mountain ? 0.95 : 1.2) + rnd() * (nearRoad ? 1.0 : 1.8),
        sz: (nearRoad ? 0.45 : mountain ? 0.7 : 0.95) + rnd() * (nearRoad ? 0.75 : 1.45),
        rot: rnd() * Math.PI * 2,
        color: carpetColor(x, z, rnd),
      });
    }
    return arr;
  }, []);

  const visibleCarpetPatches = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const q = useGame.getState().graphicsQuality;
    const radius = q === "low" ? 54 : q === "medium" ? 80 : q === "high" ? 106 : 138;
    return carpetPatches.filter((p) => nearStream(p.x, p.z, hx, hz, radius));
  }, [carpetPatches, streamKey]);

  const roadGrass = useMemo(() => {
    const rnd = seeded(44033);
    const arr: GrassBlade[] = [];
    let tries = 0;
    while (arr.length < ROADSIDE_GRASS && tries < ROADSIDE_GRASS * 8) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 118;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const road = distanceToRoad(x, z);
      if (road < 1.6) continue;
      if (road > 34 && rnd() < 0.55) continue;
      if (districts.some((d) => Math.hypot(x - d.position[0], z - d.position[1]) < 5)) continue;
      const shoulder = road < 5;
      const species: GrassSpecies = shoulder ? "roadside" : rnd() < 0.22 ? "flowering" : "meadow";
      const scale = grassScale(species, rnd);
      const h = shoulder ? Math.min(scale.h, 0.46) : scale.h;
      arr.push({
        species,
        x,
        z,
        y: terrainHeight(x, z) + h * 0.5,
        s: h,
        rot: rnd() * Math.PI,
        color: grassColor(species, rnd),
        wide: shoulder ? Math.min(scale.wide, 0.3) : scale.wide,
      });
    }
    return arr;
  }, []);

  const fieldGrass = useMemo(() => {
    const rnd = seeded(93017);
    const arr: GrassBlade[] = [];
    let tries = 0;
    while (arr.length < FIELD_GRASS && tries < FIELD_GRASS * 8) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 116;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const road = distanceToRoad(x, z);
      if (road < 3.8 || roadFlatten(x, z) > 0.04) continue;
      if (districts.some((d) => Math.hypot(x - d.position[0], z - d.position[1]) < 7)) continue;
      const species = pickGrassSpecies(x, z, road, rnd);
      const scale = grassScale(species, rnd);
      arr.push({
        species,
        x,
        z,
        y: terrainHeight(x, z) + scale.h * 0.5,
        s: scale.h,
        rot: rnd() * Math.PI,
        color: grassColor(species, rnd),
        wide: scale.wide,
      });
    }
    return arr;
  }, []);

  const visibleRoadGrass = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const radius = streamRadius("grass") * 0.72;
    return roadGrass.filter((g) => nearStream(g.x, g.z, hx, hz, radius));
  }, [roadGrass, streamKey]);

  const visibleFieldGrass = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const radius = streamRadius("grass") * 0.72;
    return fieldGrass.filter((g) => nearStream(g.x, g.z, hx, hz, radius));
  }, [fieldGrass, streamKey]);

  const visibleGrassBySpecies = useMemo(() => {
    const grouped = emptyGrassGroups();
    [...visibleRoadGrass, ...visibleFieldGrass].forEach((g) => grouped[g.species].push(g));
    return grouped;
  }, [visibleRoadGrass, visibleFieldGrass]);

  const groundCover = useMemo(() => {
    const rnd = seeded(118441);
    const arr: GroundCover[] = [];
    let tries = 0;
    while (arr.length < GROUND_COVER && tries < GROUND_COVER * 9) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 114;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const road = distanceToRoad(x, z);
      if (road < 4.6 || roadFlatten(x, z) > 0.035) continue;
      if (districts.some((d) => Math.hypot(x - d.position[0], z - d.position[1]) < 7)) continue;
      const district = districtInfluence(x, z);
      const water = nearWater(x, z);
      const forest = district.id === "forest" && district.d < 62;
      let kind: GroundCoverKind;
      const roll = rnd();
      if (forest) kind = roll < 0.24 ? "fern" : roll < 0.42 ? "moss" : roll < 0.58 ? "leaf" : roll < 0.76 ? "twig" : roll < 0.91 ? "mushroom" : "pebble";
      else if (water) kind = roll < 0.28 ? "fern" : roll < 0.58 ? "flower" : roll < 0.78 ? "moss" : roll < 0.91 ? "pebble" : "leaf";
      else kind = roll < 0.3 ? "flower" : roll < 0.48 ? "fern" : roll < 0.62 ? "moss" : roll < 0.78 ? "leaf" : roll < 0.9 ? "pebble" : "twig";
      const color = new THREE.Color(
        kind === "flower" ? ["#fef3c7", "#f9a8d4", "#bfdbfe", "#fde68a", "#ddd6fe", "#fb923c"][Math.floor(rnd() * 6)] :
        kind === "fern" ? ["#2f6b35", "#3f7f3a", "#224f2d"][Math.floor(rnd() * 3)] :
        kind === "moss" ? ["#244f24", "#315f2a", "#4d6f2c"][Math.floor(rnd() * 3)] :
        kind === "leaf" ? ["#7c4f25", "#a16207", "#6b5d2c", "#445f26"][Math.floor(rnd() * 4)] :
        kind === "twig" ? "#4a2f1c" :
        kind === "mushroom" ? "#d6c3a3" :
        "#777267"
      );
      arr.push({ kind, x, z, y: terrainHeight(x, z) + 0.035, s: 0.08 + rnd() * (kind === "fern" ? 0.34 : kind === "moss" ? 0.26 : 0.24), rot: rnd() * Math.PI * 2, color });
    }
    return arr;
  }, []);

  const visibleGroundCover = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const radius = streamRadius("grass") * 0.82;
    return groundCover.filter((g) => nearStream(g.x, g.z, hx, hz, radius));
  }, [groundCover, streamKey]);

  const visibleCoverByKind = useMemo(() => {
    const grouped = emptyCoverGroups();
    visibleGroundCover.forEach((g) => grouped[g.kind].push(g));
    return grouped;
  }, [visibleGroundCover]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    speciesOrder.forEach((species) => {
      const group = bySpecies[species];
      const trunks = trunkRefs.current[species];
      const crowns = crownRefs.current[species];
      const crowns2 = extraCrownRefs.current[species];
      if (!trunks) return;

      group.forEach((t, i) => {
        assignTrunk(dummy, t);
        trunks.setMatrixAt(i, dummy.matrix);
        trunks.setColorAt(i, trunkColor(t.species, t.hue));

        if (crowns && species !== "dead") {
          assignCrown(dummy, t, 0);
          crowns.setMatrixAt(i, dummy.matrix);
          crowns.setColorAt(i, foliageColor(t.species, t.hue));
        }
        if (crowns2 && species !== "dead" && species !== "sapling") {
          assignCrown(dummy, t, 1);
          crowns2.setMatrixAt(i, dummy.matrix);
          crowns2.setColorAt(i, foliageColor(t.species, Math.min(1, t.hue + 0.12)));
        }
      });

      trunks.instanceMatrix.needsUpdate = true;
      if (trunks.instanceColor) trunks.instanceColor.needsUpdate = true;
      if (crowns) {
        crowns.instanceMatrix.needsUpdate = true;
        if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
      }
      if (crowns2) {
        crowns2.instanceMatrix.needsUpdate = true;
        if (crowns2.instanceColor) crowns2.instanceColor.needsUpdate = true;
      }
    });

    if (rootsRef.current) {
      extras.roots.forEach((r, i) => {
        const x = r.tree.x + Math.cos(r.angle) * r.length * 0.45;
        const z = r.tree.z + Math.sin(r.angle) * r.length * 0.45;
        dummy.position.set(x, terrainHeight(x, z) + r.thick * 0.4, z);
        dummy.rotation.set(Math.PI / 2, 0, -r.angle);
        dummy.scale.set(r.thick, r.length, r.thick);
        dummy.updateMatrix();
        rootsRef.current!.setMatrixAt(i, dummy.matrix);
        rootsRef.current!.setColorAt(i, trunkColor(r.tree.species, r.tree.hue * 0.8));
      });
      rootsRef.current.instanceMatrix.needsUpdate = true;
      if (rootsRef.current.instanceColor) rootsRef.current.instanceColor.needsUpdate = true;
    }

    if (branchRef.current) {
      extras.branches.forEach((b, i) => {
        const x = b.tree.x + Math.cos(b.angle) * b.length * 0.34;
        const z = b.tree.z + Math.sin(b.angle) * b.length * 0.34;
        dummy.position.set(x, b.tree.y + b.y, z);
        dummy.rotation.set(Math.PI / 2 - 0.42, 0, -b.angle);
        dummy.scale.set(b.thick, b.length, b.thick);
        dummy.updateMatrix();
        branchRef.current!.setMatrixAt(i, dummy.matrix);
        branchRef.current!.setColorAt(i, b.dead ? col.set("#3a3128") : trunkColor(b.tree.species, b.tree.hue));
      });
      branchRef.current.instanceMatrix.needsUpdate = true;
      if (branchRef.current.instanceColor) branchRef.current.instanceColor.needsUpdate = true;
    }

    if (barkMarkRef.current) {
      extras.bark.forEach((m, i) => {
        const x = m.tree.x + Math.cos(m.angle) * (m.tree.trunk * 0.52);
        const z = m.tree.z + Math.sin(m.angle) * (m.tree.trunk * 0.52);
        dummy.position.set(x, m.tree.y + m.y, z);
        dummy.rotation.set(0, -m.angle, 0);
        dummy.scale.set(m.w, m.h, 0.025);
        dummy.updateMatrix();
        barkMarkRef.current!.setMatrixAt(i, dummy.matrix);
        barkMarkRef.current!.setColorAt(i, m.color);
      });
      barkMarkRef.current.instanceMatrix.needsUpdate = true;
      if (barkMarkRef.current.instanceColor) barkMarkRef.current.instanceColor.needsUpdate = true;
    }

    if (floorRef.current) {
      extras.floor.forEach((f, i) => {
        dummy.position.set(f.x, f.y, f.z);
        dummy.rotation.set(0, f.rot, 0);
        dummy.scale.set(f.s, 0.035, f.s * (0.35 + (i % 3) * 0.25));
        dummy.updateMatrix();
        floorRef.current!.setMatrixAt(i, dummy.matrix);
        floorRef.current!.setColorAt(i, f.color);
      });
      floorRef.current.instanceMatrix.needsUpdate = true;
      if (floorRef.current.instanceColor) floorRef.current.instanceColor.needsUpdate = true;
    }

    if (rockRef.current) {
      visibleRocks.forEach((r, i) => {
        dummy.position.set(r.x, r.y + r.s * 0.3, r.z);
        dummy.scale.set(r.s, r.s * 0.72, r.s * (0.75 + (i % 5) * 0.08));
        dummy.rotation.set((i % 3) * 0.18, r.rot, (i % 4) * 0.11);
        dummy.updateMatrix();
        rockRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rockRef.current.instanceMatrix.needsUpdate = true;
    }
    if (carpetRef.current) {
      visibleCarpetPatches.forEach((p, i) => {
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(-Math.PI / 2, 0, p.rot);
        dummy.scale.set(p.sx, p.sz, 1);
        dummy.updateMatrix();
        carpetRef.current!.setMatrixAt(i, dummy.matrix);
        carpetRef.current!.setColorAt(i, p.color);
      });
      carpetRef.current.instanceMatrix.needsUpdate = true;
      if (carpetRef.current.instanceColor) carpetRef.current.instanceColor.needsUpdate = true;
    }
    if (palmFrondRef.current) {
      palmFronds.forEach((p, i) => {
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(-Math.PI / 2 + p.droop, 0, p.rot - Math.PI / 2);
        dummy.scale.set(p.wide, p.len, 1);
        dummy.updateMatrix();
        palmFrondRef.current!.setMatrixAt(i, dummy.matrix);
        palmFrondRef.current!.setColorAt(i, p.color);
      });
      palmFrondRef.current.instanceMatrix.needsUpdate = true;
      if (palmFrondRef.current.instanceColor) palmFrondRef.current.instanceColor.needsUpdate = true;
    }
    grassSpeciesOrder.forEach((species) => {
      const mesh = grassRefs.current[species];
      if (!mesh) return;
      visibleGrassBySpecies[species].forEach((g, i) => {
        const lean = species === "wild" || species === "marsh" ? -0.22 + (i % 13) * 0.032 : -0.1 + (i % 9) * 0.022;
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(0, g.rot, lean);
        const bladeWidth = Math.max(0.0035, g.s * 0.018 * g.wide);
        dummy.scale.set(bladeWidth, g.s, bladeWidth * 0.35);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, g.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });

    coverKindOrder.forEach((kind) => {
      const mesh = coverRefs.current[kind];
      if (!mesh) return;
      visibleCoverByKind[kind].forEach((g, i) => {
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(kind === "fern" ? -0.25 : 0, g.rot, kind === "twig" ? 1.35 : 0);
        const flat = kind === "leaf" || kind === "moss" || kind === "pebble";
        dummy.scale.set(g.s * (kind === "fern" ? 1.8 : kind === "twig" ? 2.4 : 1), flat ? 0.025 : g.s * 1.25, g.s * (kind === "flower" ? 0.45 : 1));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, g.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [bySpecies, extras, visibleRocks, visibleCarpetPatches, palmFronds, visibleGrassBySpecies, visibleCoverByKind]);

  const onCrownCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 1 };
    shader.vertexShader = "uniform float uTime;\nuniform float uWind;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float ph = instanceMatrix[3].x * 0.19 + instanceMatrix[3].z * 0.23;
       float canopy = clamp(position.y + 0.5, 0.0, 1.0);
       transformed.x += sin(uTime * 0.9 + ph) * 0.16 * canopy * uWind;
       transformed.z += cos(uTime * 0.7 + ph) * 0.11 * canopy * uWind;`
    );
    crownShaders.current.push(shader);
  };

  const onGrassCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 1 };
    shader.uniforms.uHero = { value: new THREE.Vector3(9999, 0, 9999) };
    shader.uniforms.uCar = { value: new THREE.Vector3(9999, 0, 9999) };
    shader.vertexShader =
      "uniform float uTime;\nuniform float uWind;\nuniform vec3 uHero;\nuniform vec3 uCar;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       vec3 worldRoot = vec3(instanceMatrix[3].x, instanceMatrix[3].y, instanceMatrix[3].z);
       float blade = clamp(position.y + 0.5, 0.0, 1.0);
       float ph = worldRoot.x * 0.17 + worldRoot.z * 0.21;
       transformed.x += sin(uTime * 1.45 + ph) * 0.18 * blade * uWind;
       transformed.z += cos(uTime * 1.1 + ph) * 0.12 * blade * uWind;
       vec2 toHero = worldRoot.xz - uHero.xz;
       float heroD = length(toHero);
       if (heroD < 3.2) {
         vec2 push = normalize(toHero + vec2(0.001));
         float press = (1.0 - smoothstep(0.45, 3.2, heroD)) * blade;
         transformed.x += push.x * press * 0.95;
         transformed.z += push.y * press * 0.95;
         transformed.y -= press * 0.25;
       }
       vec2 toCar = worldRoot.xz - uCar.xz;
       float carD = length(toCar);
       if (carD < 4.5) {
         vec2 push = normalize(toCar + vec2(0.001));
         float press = (1.0 - smoothstep(0.8, 4.5, carD)) * blade;
         transformed.x += push.x * press * 1.35;
         transformed.z += push.y * press * 1.35;
         transformed.y -= press * 0.36;
       }`
    );
    grassShaders.current.push(shader);
  };

  useFrame((state) => {
    const wind = useGame.getState().weather === "rain" ? 1.8 : 1;
    crownShaders.current.forEach((shader) => {
      shader.uniforms.uTime.value = state.clock.elapsedTime;
      shader.uniforms.uWind.value = wind;
    });
    grassShaders.current.forEach((shader) => {
      shader.uniforms.uTime.value = state.clock.elapsedTime;
      shader.uniforms.uWind.value = wind;
      shader.uniforms.uHero.value.set(tracker.hero.x, tracker.hero.y, tracker.hero.z);
      shader.uniforms.uCar.value.set(tracker.car.x, tracker.car.y, tracker.car.z);
    });
  });

  return (
    <group>
      {speciesOrder.map((species) => {
        const count = bySpecies[species].length;
        const isNeedle = species === "pine" || species === "cedar";
        const isDead = species === "dead";
        return (
          <group key={species}>
            <instancedMesh ref={(m) => { trunkRefs.current[species] = m; }} args={[undefined, undefined, count]} castShadow>
              <cylinderGeometry args={[0.55, 0.78, 1, species === "birch" ? 8 : 7]} />
              <meshStandardMaterial roughness={1} vertexColors />
            </instancedMesh>
            {!isDead && (
              <instancedMesh ref={(m) => { crownRefs.current[species] = m; }} args={[undefined, undefined, count]} castShadow>
                {isNeedle ? <coneGeometry args={[1, 1.2, 8]} /> : <dodecahedronGeometry args={[1, 1]} />}
                <meshStandardMaterial roughness={0.86} vertexColors emissive="#4f8f3c" emissiveIntensity={0.16} flatShading={species !== "willow"} onBeforeCompile={onCrownCompile} />
              </instancedMesh>
            )}
            {!isDead && species !== "sapling" && (
              <instancedMesh ref={(m) => { extraCrownRefs.current[species] = m; }} args={[undefined, undefined, count]} castShadow>
                {isNeedle ? <coneGeometry args={[1, 1.1, 8]} /> : <icosahedronGeometry args={[1, 1]} />}
                <meshStandardMaterial roughness={0.86} vertexColors emissive="#57993f" emissiveIntensity={0.15} transparent opacity={species === "willow" ? 0.84 : 0.96} flatShading onBeforeCompile={onCrownCompile} />
              </instancedMesh>
            )}
          </group>
        );
      })}

      <instancedMesh ref={palmFrondRef} args={[undefined, undefined, palmFronds.length]} castShadow receiveShadow>
        <planeGeometry args={[1, 1, 4, 1]} />
        <meshStandardMaterial vertexColors roughness={0.88} side={THREE.DoubleSide} transparent opacity={0.96} />
      </instancedMesh>

      <instancedMesh ref={rootsRef} args={[undefined, undefined, extras.roots.length]} receiveShadow>
        <cylinderGeometry args={[1, 0.7, 1, 6]} />
        <meshStandardMaterial roughness={1} vertexColors />
      </instancedMesh>

      <instancedMesh ref={branchRef} args={[undefined, undefined, extras.branches.length]} castShadow>
        <cylinderGeometry args={[1, 0.65, 1, 6]} />
        <meshStandardMaterial roughness={0.95} vertexColors />
      </instancedMesh>

      <instancedMesh ref={barkMarkRef} args={[undefined, undefined, extras.bark.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} vertexColors />
      </instancedMesh>

      <instancedMesh ref={floorRef} args={[undefined, undefined, extras.floor.length]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} vertexColors />
      </instancedMesh>

      <instancedMesh ref={rockRef} args={[undefined, undefined, visibleRocks.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#686970" roughness={0.96} flatShading />
      </instancedMesh>

      <instancedMesh ref={carpetRef} args={[undefined, undefined, visibleCarpetPatches.length]} receiveShadow frustumCulled>
        <circleGeometry args={[1, 9]} />
        <meshStandardMaterial vertexColors roughness={1} transparent opacity={0.72} depthWrite={false} />
      </instancedMesh>

      {grassSpeciesOrder.map((species) => {
        const count = visibleGrassBySpecies[species].length;
        return (
          <instancedMesh key={species} ref={(m) => { grassRefs.current[species] = m; }} args={[undefined, undefined, count]} castShadow receiveShadow frustumCulled>
            <planeGeometry args={[1, 1, 1, 4]} />
            <meshStandardMaterial
              vertexColors
              roughness={0.94}
              side={THREE.DoubleSide}
              transparent
              opacity={species === "dry" ? 0.82 : 0.94}
              alphaTest={0.08}
              onBeforeCompile={onGrassCompile}
            />
          </instancedMesh>
        );
      })}

      {coverKindOrder.map((kind) => {
        const count = visibleCoverByKind[kind].length;
        return (
          <instancedMesh key={kind} ref={(m) => { coverRefs.current[kind] = m; }} args={[undefined, undefined, count]} receiveShadow frustumCulled>
            {kind === "flower" ? <sphereGeometry args={[1, 6, 4]} /> :
              kind === "fern" ? <coneGeometry args={[0.45, 1, 5]} /> :
                kind === "mushroom" ? <sphereGeometry args={[0.65, 8, 5]} /> :
                  kind === "twig" ? <cylinderGeometry args={[0.18, 0.12, 1, 5]} /> :
                    kind === "pebble" ? <dodecahedronGeometry args={[0.55, 0]} /> :
                      <boxGeometry args={[1, 1, 1]} />}
            <meshStandardMaterial vertexColors roughness={kind === "pebble" ? 0.9 : 1} flatShading={kind !== "flower"} />
          </instancedMesh>
        );
      })}
    </group>
  );
}
