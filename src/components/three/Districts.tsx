"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { districts, type District } from "@/lib/portfolio";
import { terrainHeight } from "@/lib/noise";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";
import Orb from "./Orb";

export default function Districts() {
  const last = useRef<string | null>(null);

  // proximity → which district panel to show
  useFrame(() => {
    const onFoot = useGame.getState().onFoot;
    const t = onFoot ? tracker.hero : tracker.car;
    let nearest: string | null = null;
    let best = 18; // activation radius
    for (const d of districts) {
      const dist = Math.hypot(t.x - d.position[0], t.z - d.position[1]);
      if (dist < best) {
        best = dist;
        nearest = d.id;
      }
    }
    if (nearest !== last.current) {
      last.current = nearest;
      useGame.getState().setActiveDistrict(nearest);
    }
  });

  return (
    <>
      {districts.map((d) => (
        <DistrictNode key={d.id} d={d} />
      ))}
    </>
  );
}

function DistrictNode({ d }: { d: District }) {
  const [cx, cz] = d.position;
  const cy = terrainHeight(cx, cz);
  const color = useMemo(() => new THREE.Color(d.color), [d.color]);

  const crystal = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const skyline = useRef<THREE.Group>(null);

  // deterministic building layout around the district
  const buildings = useMemo(() => {
    const arr: { x: number; z: number; w: number; depth: number; h: number; glow: number }[] = [];
    const dense = d.id === "downtown" || d.id === "campus" || d.id === "startup" || d.id === "lab";
    const n = dense ? 12 : 0;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + (cx + cz) * 0.07;
      const r = 10 + ((i * 37) % 10) + (dense && i % 3 === 0 ? 5 : 0);
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const h = dense ? 7 + ((i * 53) % 15) : 3.8 + ((i * 43) % 8);
      arr.push({
        x,
        z,
        w: 1.8 + ((i * 17) % 4) * 0.34,
        depth: 1.8 + ((i * 29) % 4) * 0.34,
        h,
        glow: 0.16 + (i % 5) * 0.05,
      });
    }
    return arr;
  }, [d.id, cx, cz]);

  // trees for the skills forest
  const trees = useMemo(() => {
    const arr: { x: number; z: number; s: number }[] = [];
    return arr;
  }, [d.id]);

  // scatter orbs around the district
  const orbPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < d.orbs; i++) {
      const ang = (i / Math.max(1, d.orbs)) * Math.PI * 2 + d.orbs;
      const r = 6 + (i % 3) * 3;
      const ox = cx + Math.cos(ang) * r;
      const oz = cz + Math.sin(ang) * r;
      arr.push([ox, terrainHeight(ox, oz) + 1.4, oz]);
    }
    return arr;
  }, [cx, cz, d.orbs]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const prog = useGame.getState().progress[d.id];
    const alive = prog?.complete ? 1 : (prog?.orbsCollected ?? 0) / Math.max(1, d.orbs);

    if (crystal.current) {
      crystal.current.rotation.y = t * 0.7;
      crystal.current.position.y = 4.2 + Math.sin(t * 1.4 + cx) * 0.16;
    }
    if (ring.current) ring.current.rotation.z = t * 0.3;
    if (light.current) light.current.intensity = 0.75 + alive * 2.5 + Math.sin(t * 2) * 0.22;

    // buildings rise + brighten with progress
    if (skyline.current) {
      skyline.current.children.forEach((c) => {
        const target = 0.68 + alive * 0.32;
        c.scale.y += (target - c.scale.y) * Math.min(1, dt * 2);
      });
    }
  });

  return (
    <>
    <group position={[cx, cy, cz]}>
      {/* ground ring pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <ringGeometry args={[6, 7, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <torusGeometry args={[6.5, 0.12, 10, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.32} transparent opacity={0.32} />
      </mesh>

      {/* subtle mission marker */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.24, 0.34, 2.5, 8]} />
        <meshStandardMaterial color="#111827" emissive={color} emissiveIntensity={0.08} metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh ref={crystal} position={[0, 4.2, 0]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.95} metalness={0.25} roughness={0.18} transparent opacity={0.78} />
      </mesh>
      <pointLight ref={light} position={[0, 3.8, 0]} color={color} distance={10} intensity={0.65} />

      {/* floating label */}
      <Text position={[0, 6.0, 0]} fontSize={0.5} color={d.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
        {d.icon + "  " + d.name}
      </Text>
      <Text position={[0, 5.35, 0]} fontSize={0.24} color="#dbeafe" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000">
        {d.subtitle}
      </Text>

      {/* skyline that builds itself */}
      <group ref={skyline}>
        {buildings.map((b, i) => {
          const by = terrainHeight(cx + b.x, cz + b.z) - cy;
          return (
            <mesh key={i} castShadow receiveShadow position={[b.x, by + b.h / 2, b.z]} scale={[1, 0.68, 1]}>
              <boxGeometry args={[b.w, b.h, b.depth]} />
              <meshStandardMaterial color="#182233" emissive={color} emissiveIntensity={b.glow} metalness={0.28} roughness={0.48} />
            </mesh>
          );
        })}
      </group>
      <group>
        {buildings.map((b, i) => {
          const by = terrainHeight(cx + b.x, cz + b.z) - cy;
          const rows = Math.max(2, Math.floor(b.h / 2.1));
          return Array.from({ length: rows }, (_, r) => (
            <mesh key={`${i}-${r}`} position={[b.x, by + 1.15 + r * 1.52, b.z + b.depth * 0.51 + 0.018]}>
              <boxGeometry args={[b.w * 0.58, 0.14, 0.025]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.34} roughness={0.28} />
            </mesh>
          ));
        })}
      </group>

      {/* forest trees */}
      {trees.map((tr, i) => {
        const ty = terrainHeight(cx + tr.x, cz + tr.z) - cy;
        return (
          <group key={i} position={[tr.x, ty, tr.z]} scale={tr.s}>
            <mesh castShadow position={[0, 1, 0]}>
              <cylinderGeometry args={[0.18, 0.26, 2, 6]} />
              <meshStandardMaterial color="#5b3a21" roughness={1} />
            </mesh>
            <mesh castShadow position={[0, 2.6, 0]}>
              <coneGeometry args={[1.1, 2.4, 7]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.8} />
            </mesh>
          </group>
        );
      })}

    </group>

      {/* mission orbs — rendered in world space (Orb uses world-coord proximity) */}
      {orbPositions.map((p, i) => (
        <Orb key={i} position={p} color={d.color} districtId={d.id} />
      ))}
    </>
  );
}
