"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_WIDTH, clamp01, frameAt, journeyCurve } from "@/lib/journeyPath";
import { destinations } from "@/data/experiences";

/** Deterministic PRNG so the skyline is identical on every load and reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lit-window grid drawn once and shared by every building instance. */
function makeWindowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, c.width, c.height);
  const rand = mulberry32(9271);
  const cols = 6;
  const rows = 16;
  const cw = c.width / cols;
  const ch = c.height / rows;
  const palette = ["#cfe4ff", "#a9c6ff", "#ffe6b8", "#bfe9ff"];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const r = rand();
      if (r < 0.42) continue;
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
      ctx.globalAlpha = 0.35 + rand() * 0.65;
      ctx.fillRect(x * cw + cw * 0.2, y * ch + ch * 0.22, cw * 0.6, ch * 0.5);
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface Block {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  yaw: number;
  tint: THREE.Color;
}

function buildBlocks(count: number, seed: number): Block[] {
  const rand = mulberry32(seed);
  const blocks: Block[] = [];
  const f = frameAt(0);
  const accents = destinations.map((d) => new THREE.Color(d.accent));

  for (let i = 0; i < count; i++) {
    const t = clamp01((i + 0.5) / count + (rand() - 0.5) * 0.01);
    frameAt(t, f);
    const side = rand() > 0.5 ? 1 : -1;
    // Push buildings well clear of the carriageway so the camera never clips.
    const lateral = side * (ROAD_WIDTH / 2 + 16 + rand() * 78);
    const depth = (rand() - 0.5) * 42;

    const height = 14 + rand() * rand() * 118;
    const width = 9 + rand() * 17;
    const breadth = 9 + rand() * 17;

    const position = new THREE.Vector3()
      .copy(f.position)
      .addScaledVector(f.right, lateral)
      .addScaledVector(f.tangent, depth);
    position.y = height / 2 - 1;

    // Nearest destination tints its district.
    let nearest = 0;
    let best = Infinity;
    destinations.forEach((d, di) => {
      const dist = Math.abs(d.anchor - t);
      if (dist < best) {
        best = dist;
        nearest = di;
      }
    });

    blocks.push({
      position,
      scale: new THREE.Vector3(width, height, breadth),
      yaw: f.yaw + (rand() - 0.5) * 0.5,
      tint: accents[nearest].clone().lerp(new THREE.Color("#243049"), 0.72 + rand() * 0.2),
    });
  }
  return blocks;
}

interface CityProps {
  quality: "low" | "medium" | "high";
}

export default function City({ quality }: CityProps) {
  const buildingCount = quality === "low" ? 90 : quality === "medium" ? 190 : 300;
  const trafficCount = quality === "low" ? 0 : quality === "medium" ? 10 : 18;

  const windowTex = useMemo(() => makeWindowTexture(), []);
  useLayoutEffect(() => () => windowTex.dispose(), [windowTex]);

  const blocks = useMemo(() => buildBlocks(buildingCount, 1337), [buildingCount]);
  const towers = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const overpass = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = towers.current;
    const crown = crowns.current;
    if (!mesh || !crown) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const crownScale = new THREE.Vector3();
    const crownPos = new THREE.Vector3();

    blocks.forEach((b, i) => {
      e.set(0, b.yaw, 0);
      q.setFromEuler(e);
      m.compose(b.position, q, b.scale);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, b.tint);

      // A thin emissive band at the top reads as signage from a distance.
      crownPos.set(b.position.x, b.position.y + b.scale.y / 2 + 0.6, b.position.z);
      crownScale.set(b.scale.x * 0.82, 1.1, b.scale.z * 0.82);
      m.compose(crownPos, q, crownScale);
      crown.setMatrixAt(i, m);
      crown.setColorAt(i, b.tint);
    });

    mesh.instanceMatrix.needsUpdate = true;
    crown.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (crown.instanceColor) crown.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    crown.computeBoundingSphere();
  }, [blocks]);

  // Elevated cross-highways: a handful of slabs bridging over the route.
  const overpassCount = quality === "low" ? 3 : 6;
  useLayoutEffect(() => {
    const mesh = overpass.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3(190, 1.6, 11);
    const f = frameAt(0);
    for (let i = 0; i < overpassCount; i++) {
      const t = 0.12 + (i / overpassCount) * 0.76;
      frameAt(t, f);
      pos.copy(f.position);
      pos.y += 17 + (i % 2) * 5;
      e.set(0, f.yaw + Math.PI / 2, 0);
      q.setFromEuler(e);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [overpassCount]);

  // Distant traffic — a few emissive slivers sliding along the spline.
  const traffic = useRef<THREE.InstancedMesh>(null);
  const trafficSeeds = useMemo(() => {
    const rand = mulberry32(5150);
    return Array.from({ length: trafficCount }, () => ({
      t: rand(),
      speed: 0.012 + rand() * 0.02,
      lane: (rand() > 0.5 ? 1 : -1) * (2.6 + rand() * 2.2),
      dir: rand() > 0.35 ? 1 : -1,
    }));
  }, [trafficCount]);

  useFrame((_, delta) => {
    const mesh = traffic.current;
    if (!mesh || trafficCount === 0) return;
    const dt = Math.min(delta, 0.1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const f = frameAt(0);

    trafficSeeds.forEach((s, i) => {
      s.t += s.speed * dt * s.dir * 0.35;
      if (s.t > 1) s.t -= 1;
      if (s.t < 0) s.t += 1;
      frameAt(s.t, f);
      pos.copy(f.position).addScaledVector(f.right, s.lane);
      pos.y += 0.6;
      e.set(f.pitch, f.yaw, 0, "YXZ");
      q.setFromEuler(e);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  const groundGeo = useMemo(() => new THREE.PlaneGeometry(2600, 3200), []);
  useLayoutEffect(() => () => groundGeo.dispose(), [groundGeo]);
  const groundCenter = useMemo(() => journeyCurve.getPointAt(0.5), []);

  return (
    <group>
      <mesh
        geometry={groundGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[groundCenter.x, -1.2, groundCenter.z]}
        receiveShadow={quality === "high"}
      >
        <meshStandardMaterial color="#05060d" roughness={0.9} metalness={0.2} />
      </mesh>

      <instancedMesh
        ref={towers}
        args={[undefined, undefined, blocks.length]}
        castShadow={quality === "high"}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={windowTex}
          emissiveMap={windowTex}
          emissive="#ffffff"
          emissiveIntensity={0.62}
          roughness={0.72}
          metalness={0.32}
        />
      </instancedMesh>

      <instancedMesh ref={crowns} args={[undefined, undefined, blocks.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.55} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={overpass} args={[undefined, undefined, overpassCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0d1120" roughness={0.85} metalness={0.3} />
      </instancedMesh>

      {trafficCount > 0 && (
        <instancedMesh ref={traffic} args={[undefined, undefined, trafficCount]} frustumCulled={false}>
          <boxGeometry args={[1.7, 0.5, 3.6]} />
          <meshBasicMaterial color="#ffd9a8" toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
