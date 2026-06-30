"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";
import { audio } from "@/lib/audio";

export default function Orb({
  position,
  color,
  districtId,
}: {
  position: [number, number, number];
  color: string;
  districtId: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const phase = useRef(Math.random() * 6.28);

  useFrame((_, dt) => {
    if (collected || !ref.current) return;
    phase.current += dt;
    ref.current.rotation.y += dt * 1.8;
    ref.current.position.y = position[1] + Math.sin(phase.current * 1.6) * 0.3;

    const onFoot = useGame.getState().onFoot;
    const t = onFoot ? tracker.hero : tracker.car;
    const d = Math.hypot(t.x - position[0], t.z - position[2]);
    if (d < (onFoot ? 2.2 : 3)) {
      setCollected(true);
      audio.collect();
      useGame.getState().collectOrb(districtId);
    }
  });

  if (collected) return null;

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} metalness={0.3} roughness={0.1} />
      </mesh>
      <pointLight color={color} intensity={3} distance={7} />
    </group>
  );
}
