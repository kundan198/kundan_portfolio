"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";

const COUNT = 1400;
const AREA = 60;

export default function Rain() {
  const points = useRef<THREE.Points>(null);
  const weather = useGame((s) => s.weather);

  const { geo, velocities } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * AREA;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * AREA;
      vel[i] = 30 + Math.random() * 25;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, velocities: vel };
  }, []);

  useFrame((_, dt) => {
    if (weather !== "rain" || !points.current) return;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= velocities[i] * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 40;
        arr[i * 3] = (Math.random() - 0.5) * AREA;
        arr[i * 3 + 2] = (Math.random() - 0.5) * AREA;
      }
    }
    geo.attributes.position.needsUpdate = true;
    points.current.position.set(tracker.hero.x, 0, tracker.hero.z);
  });

  if (weather !== "rain") return null;

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial color="#9fc7ff" size={0.18} transparent opacity={0.6} depthWrite={false} fog />
    </points>
  );
}
