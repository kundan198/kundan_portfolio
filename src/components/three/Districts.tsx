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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const prog = useGame.getState().progress[d.id];
    const alive = prog?.complete ? 1 : (prog?.orbsCollected ?? 0) / Math.max(1, d.orbs);

    if (crystal.current) {
      crystal.current.rotation.y = t * 0.7;
      crystal.current.position.y = 4.2 + Math.sin(t * 1.4 + cx) * 0.16;
    }
    if (ring.current) ring.current.rotation.z = t * 0.3;
    if (light.current) light.current.intensity = 0.75 + alive * 2.5 + Math.sin(t * 2) * 0.22;
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
      {/* Detailed glass-tower skyline is rendered by <CitySkyline /> (merged, world-space). */}
    </group>

      {/* mission orbs — rendered in world space (Orb uses world-coord proximity) */}
      {orbPositions.map((p, i) => (
        <Orb key={i} position={p} color={d.color} districtId={d.id} />
      ))}
    </>
  );
}
