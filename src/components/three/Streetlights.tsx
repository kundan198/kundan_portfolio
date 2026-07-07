"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/lib/noise";
import { useGame } from "@/lib/store";
import { smoothRingRoad } from "@/lib/roads";

// Lamp posts that automatically switch on at dusk and off at dawn, driven by
// the world's day/night cycle. All poles/arms merge into one geometry and all
// lamp heads into another (with one shared animated emissive material), so the
// full ring of streetlights costs 2 draw calls instead of ~54.
const COUNT = 18;

export default function Streetlights() {
  const headMat = useRef<THREE.MeshStandardMaterial>(null);

  const merged = useMemo(() => {
    const poles: THREE.BufferGeometry[] = [];
    const heads: THREE.BufferGeometry[] = [];
    for (let i = 0; i < COUNT; i++) {
      const idx = Math.floor((i / COUNT) * (smoothRingRoad.length - 1));
      const p = smoothRingRoad[idx];
      const next = smoothRingRoad[Math.min(smoothRingRoad.length - 1, idx + 1)];
      const dx = next[0] - p[0];
      const dz = next[1] - p[1];
      const len = Math.hypot(dx, dz) || 1;
      const x = p[0] - (dz / len) * 3.6;
      const z = p[1] + (dx / len) * 3.6;
      const y = terrainHeight(x, z);
      const rot = Math.atan2(dx, dz);

      const pole = new THREE.CylinderGeometry(0.12, 0.16, 4.8, 6);
      pole.rotateY(rot);
      pole.translate(x, y + 2.4, z);
      poles.push(pole);

      const arm = new THREE.BoxGeometry(1, 0.12, 0.12);
      arm.translate(0.4, 4.7, 0);
      arm.rotateY(rot);
      arm.translate(x, y, z);
      poles.push(arm);

      const head = new THREE.BoxGeometry(0.4, 0.2, 0.4);
      head.translate(0.85, 4.6, 0);
      head.rotateY(rot);
      head.translate(x, y, z);
      heads.push(head);
    }
    const out = { poles: mergeGeometries(poles, false)!, heads: mergeGeometries(heads, false)! };
    [...poles, ...heads].forEach((g) => g.dispose());
    return out;
  }, []);

  useFrame(() => {
    const tod = useGame.getState().timeOfDay;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    // night factor: 1 when sun below horizon, 0 in daylight
    const night = THREE.MathUtils.clamp(0.5 - elev * 2.5, 0, 1);
    if (headMat.current) headMat.current.emissiveIntensity = night * 4;
  });

  return (
    <group>
      <mesh geometry={merged.poles} castShadow>
        <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh geometry={merged.heads}>
        <meshStandardMaterial ref={headMat} color="#fff4d0" emissive="#ffdf9e" emissiveIntensity={0} />
      </mesh>
    </group>
  );
}
