"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/lib/noise";
import { useGame } from "@/lib/store";
import { smoothRingRoad } from "@/lib/roads";

// Lamp posts that automatically switch on at dusk and off at dawn,
// driven by the world's day/night cycle (store.timeOfDay).
const COUNT = 18;
const LIT_EVERY = 3;

export default function Streetlights() {
  const heads = useRef<THREE.MeshStandardMaterial[]>([]);
  const lights = useRef<THREE.PointLight[]>([]);

  const posts = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const p = smoothRingRoad[Math.floor((i / COUNT) * (smoothRingRoad.length - 1))];
        const next = smoothRingRoad[Math.min(smoothRingRoad.length - 1, Math.floor((i / COUNT) * (smoothRingRoad.length - 1)) + 1)];
        const dx = next[0] - p[0];
        const dz = next[1] - p[1];
        const len = Math.hypot(dx, dz) || 1;
        const x = p[0] - (dz / len) * 3.6;
        const z = p[1] + (dx / len) * 3.6;
        return { x, z, y: terrainHeight(x, z), rot: Math.atan2(dx, dz) };
      }),
    []
  );

  useFrame(() => {
    const tod = useGame.getState().timeOfDay;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    // night factor: 1 when sun below horizon, 0 in daylight
    const night = THREE.MathUtils.clamp(0.5 - elev * 2.5, 0, 1);
    heads.current.forEach((m) => m && (m.emissiveIntensity = night * 3));
    lights.current.forEach((l) => l && (l.intensity = night * 6));
  });

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          {/* pole */}
          <mesh castShadow={i < 6} position={[0, 2.4, 0]} rotation={[0, p.rot, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 4.8, 6]} />
            <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* arm */}
          <mesh position={[0.4, 4.7, 0]}>
            <boxGeometry args={[1, 0.12, 0.12]} />
            <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* lamp head */}
          <mesh position={[0.85, 4.6, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.4]} />
            <meshStandardMaterial
              ref={(m) => { if (m) heads.current[i] = m; }}
              color="#fff4d0"
              emissive="#ffdf9e"
              emissiveIntensity={0}
            />
          </mesh>
          {i % LIT_EVERY === 0 && (
            <pointLight
              ref={(l) => { if (l) lights.current[i] = l; }}
              position={[0.85, 4.4, 0]}
              color="#ffe6ab"
              distance={15}
              decay={2}
              intensity={0}
            />
          )}
        </group>
      ))}
    </group>
  );
}
