"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_WIDTH, frameAt } from "@/lib/journeyPath";
import type { Destination } from "@/data/experiences";
import type { JourneyStore } from "@/hooks/useJourneyProgress";

interface JourneyMarkerProps {
  destination: Destination;
  store: JourneyStore;
  reducedMotion: boolean;
}

/**
 * A gateway straddling the road at a destination's anchor. It brightens as the
 * car arrives, giving each career stop a physical place in the city.
 */
export default function JourneyMarker({ destination, store, reducedMotion }: JourneyMarkerProps) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const materials = useRef<THREE.MeshStandardMaterial[]>([]);

  const { position, yaw } = useMemo(() => {
    const f = frameAt(destination.anchor);
    return { position: f.position.clone(), yaw: f.yaw };
  }, [destination.anchor]);

  const half = ROAD_WIDTH / 2 + 1.4;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = store.current;
    const span = destination.progressEnd - destination.progressStart;
    const distance = Math.abs(p - destination.anchor);
    // 1 at the anchor, falling off across roughly the card's window.
    const proximity = THREE.MathUtils.clamp(1 - distance / (span * 1.4), 0, 1);
    const pulse = reducedMotion ? 0 : Math.sin(performance.now() * 0.0016) * 0.14;

    materials.current.forEach((m) => {
      if (!m) return;
      const target = 0.55 + proximity * 1.5 + pulse * proximity;
      m.emissiveIntensity += (target - m.emissiveIntensity) * (1 - Math.exp(-5 * dt));
    });

    if (halo.current) {
      const material = halo.current.material as THREE.MeshBasicMaterial;
      material.opacity += (0.05 + proximity * 0.3 - material.opacity) * (1 - Math.exp(-5 * dt));
      const scale = 1 + proximity * 0.16;
      halo.current.scale.setScalar(scale);
    }
  });

  const register = (index: number) => (m: THREE.MeshStandardMaterial | null) => {
    if (m) materials.current[index] = m;
  };

  return (
    <group ref={group} position={position} rotation={[0, yaw, 0]}>
      {/* pylons */}
      {[-1, 1].map((side, i) => (
        <mesh key={side} position={[side * half, 4.4, 0]}>
          <boxGeometry args={[0.5, 9, 0.5]} />
          <meshStandardMaterial
            ref={register(i)}
            color="#0c1020"
            emissive={destination.accent}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* overhead beam */}
      <mesh position={[0, 8.7, 0]}>
        <boxGeometry args={[half * 2 + 0.5, 0.6, 0.42]} />
        <meshStandardMaterial
          ref={register(2)}
          color="#0c1020"
          emissive={destination.accent}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* signage panel above the beam */}
      <mesh position={[0, 9.9, 0]}>
        <boxGeometry args={[8.4, 1.7, 0.24]} />
        <meshStandardMaterial
          ref={register(3)}
          color="#080b16"
          emissive={destination.accent}
          emissiveIntensity={0.45}
          toneMapped={false}
        />
      </mesh>

      {/* light spilled across the carriageway */}
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[half + 2, 24]} />
        <meshBasicMaterial
          color={destination.accent}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
