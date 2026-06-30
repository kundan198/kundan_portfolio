"use client";

import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { districts } from "@/lib/portfolio";
import { roadFlatten, terrainHeight } from "@/lib/noise";
import { distanceToRoad } from "@/lib/roads";
import { useGame } from "@/lib/store";

type Vec2 = [number, number];

const yAt = (x: number, z: number, lift = 0.04) => terrainHeight(x, z) + lift;
const STREAM_CELL = 38;

function blocksRoad(x: number, z: number, clearance = 4.2) {
  return distanceToRoad(x, z) < clearance || roadFlatten(x, z) > 0.035;
}

function nearestBuildableSpot(x: number, z: number, clearance = 4.2): Vec2 {
  if (!blocksRoad(x, z, clearance)) return [x, z];
  for (let radius = clearance; radius <= clearance + 14; radius += 2) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const px = x + Math.cos(a) * radius;
      const pz = z + Math.sin(a) * radius;
      if (!blocksRoad(px, pz, clearance)) return [px, pz];
    }
  }
  return [x, z];
}

function PlacedGroup({
  x,
  z,
  rotation = 0,
  clearance = 4.2,
  children,
}: {
  x: number;
  z: number;
  rotation?: number;
  clearance?: number;
  children: ReactNode;
}) {
  const [px, pz] = nearestBuildableSpot(x, z, clearance);
  return <group position={[px, yAt(px, pz, 0), pz]} rotation={[0, rotation, 0]}>{children}</group>;
}

function Box({
  pos,
  size,
  color,
  emissive,
  metalness = 0.05,
  roughness = 0.72,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh castShadow receiveShadow position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 0.55 : 0} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function GroundStrip({ center, rot, length, width, color }: { center: Vec2; rot: number; length: number; width: number; color: string }) {
  const [x, z] = center;
  return (
    <mesh rotation={[-Math.PI / 2, 0, rot]} position={[x, yAt(x, z, 0.06), z]} receiveShadow>
      <boxGeometry args={[width, length, 0.02]} />
      <meshStandardMaterial color={color} roughness={0.94} />
    </mesh>
  );
}

function WindowGrid({ x, y, z, color = "#bfe7ff", rows = 3 }: { x: number; y: number; z: number; color?: string; rows?: number }) {
  return (
    <group>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: 3 }, (_, c) => (
          <mesh key={`${r}-${c}`} position={[x - 0.55 + c * 0.55, y + r * 0.58, z]}>
            <boxGeometry args={[0.24, 0.18, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.35} />
          </mesh>
        ))
      )}
    </group>
  );
}

function HomeDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx - 8, cz + 2]} rot={0.38} length={24} width={2.3} color="#34373a" />
      <GroundStrip center={[cx + 6, cz - 4]} rot={-0.74} length={17} width={1.15} color="#7b756a" />
      <PlacedGroup x={cx - 4} z={cz - 5} rotation={0.52}>
        <Box pos={[0, 1.1, 0]} size={[4.7, 2.2, 3.4]} color="#d8d0be" roughness={0.82} />
        <Box pos={[0, 2.38, 0]} size={[5.1, 0.32, 3.8]} color="#4b6c42" roughness={0.9} />
        <Box pos={[0, 0.85, 1.73]} size={[2.2, 0.9, 0.06]} color="#bfe7ff" emissive="#87d7ff" metalness={0.1} roughness={0.25} />
        <Box pos={[-1.7, 0.72, 1.78]} size={[0.42, 1.0, 0.08]} color="#5b3822" roughness={0.78} />
        <Box pos={[2.9, 0.55, -0.1]} size={[1.3, 1.1, 2.1]} color="#6b655b" roughness={0.86} />
        <Box pos={[0.9, 2.66, 0]} size={[1.1, 0.08, 1.4]} color="#16202a" metalness={0.25} roughness={0.34} />
      </PlacedGroup>
      <PlacedGroup x={cx + 2} z={cz + 4} rotation={-0.4}>
        <Box pos={[0, 0.26, 0]} size={[2.3, 0.15, 0.86]} color="#6b4226" roughness={0.85} />
        {[-0.85, 0.85].map((x) => <Box key={x} pos={[x, -0.16, 0]} size={[0.12, 0.62, 0.12]} color="#3a2718" />)}
        <Box pos={[-1.8, 0.36, -0.7]} size={[0.3, 0.7, 0.18]} color="#294f3b" />
        <Box pos={[2.1, 0.55, 0.1]} size={[0.36, 0.72, 0.22]} color="#c8b891" roughness={0.8} />
      </PlacedGroup>
      {[-12, -9, -6, 8].map((x, i) => (
        <group key={x} position={[cx + x, yAt(cx + x, cz + 7 + i), cz + 7 + i]}>
          <mesh castShadow position={[0, 0.9, 0]}><cylinderGeometry args={[0.08, 0.11, 1.8, 8]} /><meshStandardMaterial color="#33251b" /></mesh>
          <pointLight position={[0, 1.55, 0]} color="#ffd6a0" intensity={0.45} distance={7} />
        </group>
      ))}
    </group>
  );
}

function CampusDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx, cz]} rot={0.12} length={34} width={3.8} color="#8b5f45" />
      <GroundStrip center={[cx - 2, cz + 8]} rot={Math.PI / 2} length={22} width={2.6} color="#9a7155" />
      <PlacedGroup x={cx - 7} z={cz - 4} rotation={-0.2}>
        <Box pos={[0, 1.8, 0]} size={[6.4, 3.6, 3.1]} color="#9fb8c5" metalness={0.1} roughness={0.48} />
        <WindowGrid x={0} y={0.7} z={1.57} rows={4} />
        <Box pos={[0, 3.82, 0]} size={[7.0, 0.24, 3.6]} color="#475569" />
      </PlacedGroup>
      <PlacedGroup x={cx + 6} z={cz + 2} rotation={0.38}>
        <Box pos={[0, 1.15, 0]} size={[4.8, 2.3, 2.8]} color="#d7c49e" roughness={0.78} />
        <Box pos={[0, 2.45, 0]} size={[5.1, 0.25, 3.1]} color="#6b4f38" />
        <WindowGrid x={0} y={0.55} z={1.42} color="#fff1b7" rows={3} />
      </PlacedGroup>
      <mesh position={[cx, yAt(cx, cz + 4, 0.12), cz + 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.1, 0.08, 8, 48]} />
        <meshStandardMaterial color="#8ecae6" emissive="#4cc9f0" emissiveIntensity={0.28} roughness={0.12} />
      </mesh>
      {[-5, -3.5, -2, 2, 3.5, 5].map((x) => <Box key={x} pos={[cx + x, yAt(cx + x, cz - 9, 0.12), cz - 9]} size={[0.12, 0.24, 1.1]} color="#f8fafc" />)}
      <PlacedGroup x={cx + 10} z={cz - 7}><Box pos={[0, 0.75, 0]} size={[1.8, 1.5, 1.0]} color="#ef4444" /><Box pos={[0, 1.65, 0]} size={[2.1, 0.18, 1.2]} color="#fbbf24" /></PlacedGroup>
    </group>
  );
}

function LabDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx, cz]} rot={-0.05} length={34} width={4.3} color="#cfd8df" />
      <GroundStrip center={[cx - 8, cz + 2]} rot={Math.PI / 2} length={16} width={2.4} color="#dce6ec" />
      <PlacedGroup x={cx - 6} z={cz - 2} rotation={0.28}>
        <Box pos={[0, 2.0, 0]} size={[5.8, 4.0, 3.2]} color="#edf4f7" metalness={0.05} roughness={0.38} />
        <Box pos={[0, 2.1, 1.64]} size={[4.8, 2.6, 0.07]} color="#96d8ff" emissive="#38bdf8" metalness={0.2} roughness={0.18} />
        <Box pos={[0, 4.15, 0]} size={[6.4, 0.22, 3.8]} color="#c7d2da" />
      </PlacedGroup>
      <PlacedGroup x={cx + 5.5} z={cz + 3} rotation={-0.42}>
        <Box pos={[0, 1.15, 0]} size={[5.0, 2.3, 2.5]} color="#1f2937" metalness={0.4} roughness={0.32} />
        {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => <Box key={x} pos={[x, 2.55, 0]} size={[0.16, 0.7, 2.8]} color="#60a5fa" emissive="#38bdf8" />)}
      </PlacedGroup>
      {[-9, -6, 8, 11].map((x, i) => (
        <group key={x} position={[cx + x, yAt(cx + x, cz + 9 - i), cz + 9 - i]}>
          <mesh castShadow position={[0, 1.4, 0]}><cylinderGeometry args={[0.08, 0.12, 2.8, 8]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 2.9, 0]}><boxGeometry args={[2.6, 0.08, 0.08]} /><meshStandardMaterial color="#f8fafc" /></mesh>
        </group>
      ))}
      {[-4, 2, 6].map((x) => <Box key={x} pos={[cx + x, yAt(cx + x, cz - 10, 0.12), cz - 10]} size={[1.4, 0.08, 2.0]} color="#111827" metalness={0.35} roughness={0.3} />)}
    </group>
  );
}

function StartupDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx, cz]} rot={0.18} length={32} width={4.7} color="#4b5563" />
      <GroundStrip center={[cx + 4, cz - 4]} rot={Math.PI / 2.7} length={19} width={2.2} color="#5b6471" />
      {([[-7, -3, 4.4, "#f8fafc"], [1, 2, 7.2, "#334155"], [8, -4, 5.8, "#0f172a"]] as const).map(([x, z, h, color], i) => (
        <PlacedGroup key={i} x={cx + x} z={cz + z} rotation={i * 0.28}>
          <Box pos={[0, h / 2, 0]} size={[3.4, h, 2.8]} color={color} metalness={0.18} roughness={0.42} />
          <WindowGrid x={0} y={0.8} z={1.43} color={i === 1 ? "#facc15" : "#93c5fd"} rows={Math.min(6, Math.floor(h))} />
          <Box pos={[0, h + 0.22, 0]} size={[3.6, 0.18, 3.0]} color="#4ade80" roughness={0.82} />
        </PlacedGroup>
      ))}
      <PlacedGroup x={cx - 3} z={cz + 8}>
        <Box pos={[0, 0.46, 0]} size={[3.8, 0.18, 1.5]} color="#7c4a2d" />
        {[-1.2, 0, 1.2].map((x) => <Box key={x} pos={[x, 0.84, 0.25]} size={[0.34, 0.34, 0.22]} color="#f5efe4" />)}
      </PlacedGroup>
      {[-9, -5, 5, 9].map((x) => <Box key={x} pos={[cx + x, yAt(cx + x, cz + 6, 0.18), cz + 6]} size={[0.24, 0.18, 1.1]} color="#fde68a" emissive="#fbbf24" />)}
      <Box pos={[cx + 10, yAt(cx + 10, cz + 3, 1.25), cz + 3]} size={[2.2, 1.4, 0.12]} color="#111827" emissive="#fbbf24" />
    </group>
  );
}

function DowntownDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  const towers = [
    [-8, -2, 11, 3.0, "#0f172a", "#38bdf8"],
    [-3, 4, 15, 3.4, "#1f2937", "#f472b6"],
    [3, -3, 18, 3.8, "#111827", "#60a5fa"],
    [8, 3, 12, 3.2, "#334155", "#fbbf24"],
    [0, 8, 9, 2.7, "#475569", "#22d3ee"],
  ] as const;
  return (
    <group>
      <mesh position={[cx, yAt(cx, cz, 0.08), cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[17, 64]} />
        <meshStandardMaterial color="#343941" roughness={0.82} />
      </mesh>
      <mesh position={[cx, yAt(cx, cz - 11, 0.1), cz - 11]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.2, 6.4, 64]} />
        <meshStandardMaterial color="#6b7280" roughness={0.86} />
      </mesh>
      {towers.map(([x, z, h, w, color, glow], i) => (
        <PlacedGroup key={i} x={cx + x} z={cz + z} rotation={i * 0.22}>
          <Box pos={[0, h / 2, 0]} size={[w, h, w * 0.86]} color={color} metalness={0.26} roughness={0.38} />
          <Box pos={[0, h + 0.22, 0]} size={[w * 0.86, 0.2, w * 0.7]} color="#e5e7eb" emissive={glow} />
          {Array.from({ length: Math.min(9, Math.floor(h / 1.7)) }, (_, r) => (
            <Box key={r} pos={[0, 1.2 + r * 1.45, w * 0.44 + 0.02]} size={[w * 0.62, 0.22, 0.03]} color={glow} emissive={glow} metalness={0.2} roughness={0.24} />
          ))}
        </PlacedGroup>
      ))}
      <group position={[cx, yAt(cx, cz - 11, 0.12), cz - 11]}>
        <mesh castShadow position={[0, 0.36, 0]}>
          <cylinderGeometry args={[1.1, 1.35, 0.72, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.18} roughness={0.48} />
        </mesh>
        <pointLight position={[0, 2.2, 0]} color="#38bdf8" intensity={0.8} distance={16} />
      </group>
    </group>
  );
}

function WaterfrontDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <mesh position={[cx + 6, yAt(cx + 6, cz - 7, -0.04), cz - 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color="#0e7490" emissive="#075985" emissiveIntensity={0.2} roughness={0.34} metalness={0.05} />
      </mesh>
      <GroundStrip center={[cx - 2, cz - 2]} rot={-0.74} length={30} width={2.8} color="#d6c7a5" />
      {[0, 1, 2, 3].map((i) => (
        <GroundStrip key={i} center={[cx + 1 + i * 4, cz - 8 - i * 1.5]} rot={Math.PI / 2.4} length={8} width={1.0} color="#7c5f3e" />
      ))}
      {[-8, -3, 2, 7].map((x, i) => (
        <PlacedGroup key={x} x={cx + x} z={cz + 5 + (i % 2) * 2} rotation={-0.35 + i * 0.18}>
          <Box pos={[0, 1.2, 0]} size={[3.6, 2.4, 2.4]} color={i % 2 ? "#e0f2fe" : "#f8fafc"} roughness={0.7} />
          <WindowGrid x={0} y={0.5} z={1.22} color="#38bdf8" rows={3} />
          <Box pos={[0, 2.54, 0]} size={[3.9, 0.22, 2.7]} color="#0891b2" />
        </PlacedGroup>
      ))}
      {[0, 1, 2].map((i) => (
        <PlacedGroup key={i} x={cx + 7 + i * 4} z={cz - 13 - i * 2} rotation={-0.4 + i * 0.2}>
          <Box pos={[0, 0.16, 0]} size={[2.6, 0.18, 0.72]} color="#f8fafc" />
          <Box pos={[0.35, 0.75, 0]} size={[0.05, 1.2, 0.05]} color="#e5e7eb" />
          <mesh position={[0.62, 0.8, 0]} rotation={[0, 0, -0.28]}>
            <coneGeometry args={[0.58, 1.4, 3]} />
            <meshStandardMaterial color="#dbeafe" roughness={0.72} side={THREE.DoubleSide} />
          </mesh>
        </PlacedGroup>
      ))}
    </group>
  );
}

function ForestDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx, cz]} rot={-0.4} length={30} width={2.1} color="#6b5a3a" />
      <GroundStrip center={[cx + 5, cz - 4]} rot={0.62} length={16} width={1.6} color="#7a653d" />
      <PlacedGroup x={cx - 7} z={cz - 3} rotation={0.56}>
        <Box pos={[0, 0.85, 0]} size={[3.5, 1.7, 2.4]} color="#7a4d2a" roughness={0.9} />
        <Box pos={[0, 1.82, 0]} size={[3.9, 0.32, 2.8]} color="#335c3b" roughness={0.92} />
        <Box pos={[0, 0.78, 1.22]} size={[1.2, 0.72, 0.06]} color="#a7f3d0" emissive="#34d399" />
      </PlacedGroup>
      <PlacedGroup x={cx + 6} z={cz + 4} rotation={-0.62}>
        {[-3, -1.5, 0, 1.5, 3].map((x) => <Box key={x} pos={[x, 0.18, 0]} size={[1.1, 0.16, 1.8]} color="#8b6a3d" />)}
        {[-3.2, 3.2].map((x) => <Box key={x} pos={[x, 0.55, 0]} size={[0.16, 0.65, 2.1]} color="#5a3a22" />)}
      </PlacedGroup>
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        const x = cx + Math.cos(a) * (7 + (i % 3));
        const z = cz + Math.sin(a) * (7 + (i % 2));
        if (blocksRoad(x, z, 3.4)) return null;
        return <Box key={i} pos={[x, yAt(x, z, 0.1), z]} size={[0.75, 0.12, 0.55]} color="#9ca3af" roughness={0.96} />;
      })}
      {[-4, 0, 4].map((x) => <pointLight key={x} position={[cx + x, base + 1.4, cz + 8]} color="#86efac" intensity={0.35} distance={7} />)}
    </group>
  );
}

function SpaceDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <mesh position={[cx, yAt(cx, cz, 0.08), cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#d8dee8" roughness={0.78} metalness={0.12} />
      </mesh>
      {[0, 8, -8].map((x, i) => (
        <PlacedGroup key={x} x={cx + x} z={cz + (i === 0 ? 0 : 4)} clearance={5.2}>
          <mesh castShadow position={[0, 5.2, 0]}>
            <cylinderGeometry args={[0.58, 0.88, 10.4, 20]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.16} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 10.8, 0]}>
            <coneGeometry args={[0.72, 1.9, 20]} />
            <meshStandardMaterial color={i === 0 ? "#ef4444" : "#cbd5e1"} metalness={0.2} roughness={0.34} />
          </mesh>
          <Box pos={[0, 2.2, 0.9]} size={[1.7, 2.4, 0.12]} color={i === 0 ? "#2563eb" : "#f97316"} emissive={i === 0 ? "#60a5fa" : "#f97316"} />
        </PlacedGroup>
      ))}
      {[-5, 5].map((x) => (
        <PlacedGroup key={x} x={cx + x} z={cz - 7}>
          <Box pos={[0, 4.0, 0]} size={[0.28, 8.0, 0.28]} color="#64748b" metalness={0.45} roughness={0.35} />
          <Box pos={[0, 7.5, 0]} size={[4.6, 0.28, 0.28]} color="#64748b" metalness={0.45} roughness={0.35} />
        </PlacedGroup>
      ))}
      <PlacedGroup x={cx - 11} z={cz - 5} rotation={0.24}>
        <Box pos={[0, 1.4, 0]} size={[8, 2.8, 4.0]} color="#94a3b8" metalness={0.22} roughness={0.48} />
        <Box pos={[0, 3.0, 0]} size={[8.8, 0.28, 4.5]} color="#e2e8f0" />
      </PlacedGroup>
      <pointLight position={[cx, base + 12, cz]} color="#c7d2fe" intensity={1.1} distance={28} />
    </group>
  );
}

function SummitDistrict({ cx, cz }: { cx: number; cz: number }) {
  const base = yAt(cx, cz);
  return (
    <group>
      <GroundStrip center={[cx, cz - 2]} rot={0} length={24} width={2.2} color="#4b5563" />
      <mesh position={[cx, yAt(cx, cz + 2, 0.12), cz + 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.2, 48]} />
        <meshStandardMaterial color="#6b7280" roughness={0.88} />
      </mesh>
      <PlacedGroup x={cx} z={cz + 1} clearance={5.2}>
        <mesh castShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[2.6, 2.8, 2.0, 24]} />
          <meshStandardMaterial color="#c7c1b4" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0, 2.1, 0]}>
          <sphereGeometry args={[2.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a5f3fc" emissive="#67e8f9" emissiveIntensity={0.22} metalness={0.18} roughness={0.16} transparent opacity={0.78} />
        </mesh>
        <group rotation={[0.55, 0.38, -0.2]} position={[1.0, 2.8, 0.2]}>
          <mesh castShadow><cylinderGeometry args={[0.22, 0.28, 3.2, 16]} /><meshStandardMaterial color="#1f2937" metalness={0.45} roughness={0.34} /></mesh>
          <mesh position={[0, 1.78, 0]}><cylinderGeometry args={[0.42, 0.42, 0.35, 16]} /><meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.24} /></mesh>
        </group>
      </PlacedGroup>
      {[-5, -2.5, 2.5, 5].map((x) => <Box key={x} pos={[cx + x, yAt(cx + x, cz - 7, 0.4), cz - 7]} size={[0.2, 0.8, 0.2]} color="#f8fafc" emissive="#f472b6" />)}
    </group>
  );
}

function districtRadius() {
  const q = useGame.getState().graphicsQuality;
  return q === "low" ? 78 : q === "medium" ? 105 : q === "high" ? 140 : 180;
}

function StreamedDistrict({
  id,
  children,
}: {
  id: string;
  children: (cx: number, cz: number) => ReactNode;
}) {
  const positions = useMemo(() => Object.fromEntries(districts.map((d) => [d.id, d.position])) as Record<string, Vec2>, []);
  const pos = positions[id];
  const streamKey = useGame((s) => {
    const cx = Math.floor(s.heroPos[0] / STREAM_CELL);
    const cz = Math.floor(s.heroPos[2] / STREAM_CELL);
    return `${s.graphicsQuality}:${cx}:${cz}`;
  });
  const visible = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    return Math.hypot(pos[0] - hx, pos[1] - hz) < districtRadius();
  }, [pos, streamKey]);

  if (!visible) return null;
  return <>{children(pos[0], pos[1])}</>;
}

export default function DistrictIdentity() {
  const shimmer = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (shimmer.current) shimmer.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
  });

  return (
    <group>
      <StreamedDistrict id="home">{(cx, cz) => <HomeDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="campus">{(cx, cz) => <CampusDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="lab">{(cx, cz) => <LabDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="startup">{(cx, cz) => <StartupDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="downtown">{(cx, cz) => <DowntownDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="waterfront">{(cx, cz) => <WaterfrontDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="forest">{(cx, cz) => <ForestDistrict cx={cx} cz={cz} />}</StreamedDistrict>
      <StreamedDistrict id="summit">
        {(cx, cz) => (
          <group ref={shimmer}>
            <SummitDistrict cx={cx} cz={cz} />
          </group>
        )}
      </StreamedDistrict>
      <StreamedDistrict id="space">{(cx, cz) => <SpaceDistrict cx={cx} cz={cz} />}</StreamedDistrict>
    </group>
  );
}
