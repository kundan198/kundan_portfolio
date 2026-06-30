"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { terrainHeight } from "@/lib/noise";

function Crate({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody position={position} colliders="cuboid" mass={1} restitution={0.2} friction={0.6}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshStandardMaterial color="#c2703a" roughness={0.8} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}

export default function Props() {
  const stacks: [number, number][] = [
    [-78, -50],
    [-84, -58],
    [-62, -66],
  ];
  return (
    <>
      {stacks.map(([sx, sz], s) => {
        const base = terrainHeight(sx, sz);
        const boxes = [];
        for (let l = 0; l < 3; l++)
          for (let c = 0; c < 3 - l; c++)
            boxes.push(
              <Crate
                key={`${s}-${l}-${c}`}
                position={[sx + (c - (2 - l) / 2) * 1.2, base + 0.65 + l * 1.15, sz]}
              />
            );
        return boxes;
      })}

      {/* a jump ramp */}
      <RampPiece x={-82} z={-44} />
      <RampPiece x={-58} z={-58} rot={Math.PI / 2} />
    </>
  );
}

function RampPiece({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const y = terrainHeight(x, z);
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y + 1, z]}
      rotation={[0.32, rot, 0]}
    >
      <CuboidCollider args={[4, 0.3, 3]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[8, 0.6, 6]} />
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}
