"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { terrainHeight } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { renderRoads, smoothRingRoad, type RoadKind, type RenderRoad } from "@/lib/roads";

type P = [number, number];
const LIFT = 0.09;
const districtPos = Object.fromEntries(districts.map((d) => [d.id, d.position])) as Record<string, P>;
const yAt = (x: number, z: number, lift = 0.05) => terrainHeight(x, z) + lift;

// ---------------------------------------------------------------- markings tex
type Style = { base: string; edge?: string; center?: string; tile: number };
const STYLE: Record<RoadKind, Style> = {
  asphalt: { base: "#2e3238", edge: "#e8edf2", center: "#f3c24b", tile: 10 },
  boulevard: { base: "#33373e", edge: "#eef2f6", center: "#eef2f6", tile: 10 },
  smart: { base: "#262c34", edge: "#38bdf8", center: "#7dd3fc", tile: 9 },
  coastal: { base: "#37474f", edge: "#67e8f9", center: "#a5f3fc", tile: 9 },
  service: { base: "#383d45", edge: "#cbd5e1", center: "#cbd5e1", tile: 9 },
  brick: { base: "#7c5440", tile: 6 },
  mountain: { base: "#3b4048", edge: "#d7dee6", tile: 8 },
  trail: { base: "#6b5836", tile: 6 },
};

const texCache: Partial<Record<RoadKind, THREE.CanvasTexture>> = {};
function roadTexture(kind: RoadKind) {
  if (texCache[kind]) return texCache[kind]!;
  const st = STYLE[kind];
  const w = 128;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = st.base;
  ctx.fillRect(0, 0, w, h);
  const base = new THREE.Color(st.base);
  for (let i = 0; i < 2600; i++) {
    const l = (Math.random() - 0.5) * 0.06;
    const col = base.clone().offsetHSL(0, 0, l);
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  if (kind === "brick") {
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 16) ctx.strokeRect(x + ((y / 12) % 2) * 8, y, 16, 12);
  }
  if (st.edge) {
    ctx.fillStyle = st.edge;
    ctx.fillRect(w * 0.07, 0, 4, h);
    ctx.fillRect(w * 0.93 - 4, 0, 4, h);
  }
  if (st.center) {
    ctx.fillStyle = st.center;
    ctx.fillRect(w / 2 - 2.5, h * 0.12, 5, h * 0.46);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache[kind] = tex;
  return tex;
}

// ------------------------------------------------------------- ribbon geometry
function buildRibbon(points: P[], width: number, tile: number) {
  const half = width / 2;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const N = points.length;
  let cum = 0;
  for (let i = 0; i < N; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(N - 1, i + 1)];
    let tx = next[0] - prev[0];
    let tz = next[1] - prev[1];
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const nx = -tz;
    const nz = tx;
    if (i > 0) cum += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
    const y = terrainHeight(p[0], p[1]) + LIFT;
    verts.push(p[0] + nx * half, y, p[1] + nz * half);
    verts.push(p[0] - nx * half, y, p[1] - nz * half);
    const v = cum / tile;
    uvs.push(0, v, 1, v);
    if (i < N - 1) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function RoadRibbon({ road }: { road: RenderRoad }) {
  const geo = useMemo(() => buildRibbon(road.points, road.width, STYLE[road.kind].tile), [road]);
  const tex = useMemo(() => roadTexture(road.kind), [road.kind]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.85} metalness={0.04} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

// --------------------------------------------------------------------- props
function Sign({ pos, label, color = "#0f172a" }: { pos: P; label: string; color?: string }) {
  const [x, z] = pos;
  return (
    <group position={[x, yAt(x, z), z]} rotation={[0, Math.atan2(-x, -z), 0]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.5, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[1.4, 0.42, 0.06]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.5} />
      </mesh>
      <Text position={[0, 1.46, 0.04]} fontSize={0.12} color="#e0f2fe" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function LandmarkBeacon({ pos, color, height }: { pos: P; color: string; height: number }) {
  const [x, z] = pos;
  return (
    <group position={[x, yAt(x, z), z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.04, height, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={0.28} />
      </mesh>
      <pointLight position={[0, height, 0]} color={color} intensity={0.22} distance={18} />
    </group>
  );
}

type RoadItem = {
  x: number;
  z: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
  edge: number;
  kind: RoadKind;
  i: number;
};

function roadItems(step = 14): RoadItem[] {
  const out: RoadItem[] = [];
  for (const road of renderRoads) {
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      const tx = dx / len;
      const tz = dz / len;
      const nx = -tz;
      const nz = tx;
      const n = Math.max(1, Math.round(len / step));
      for (let s = 0; s < n; s++) {
        const t = s / n;
        out.push({
          x: THREE.MathUtils.lerp(a[0], b[0], t),
          z: THREE.MathUtils.lerp(a[1], b[1], t),
          nx,
          nz,
          tx,
          tz,
          edge: road.width / 2,
          kind: road.kind,
          i: out.length,
        });
      }
    }
  }
  return out;
}

function RoadEngineering() {
  const items = useMemo(() => roadItems(), []);
  const reflectors = items.filter((p) => p.i % 2 === 0);
  const lights = items.filter((p) => (p.kind === "boulevard" || p.kind === "smart" || p.kind === "coastal" || p.kind === "service") && p.i % 5 === 0);
  const rails = items.filter((p) => (p.kind === "mountain" || p.kind === "coastal") && p.i % 2 === 0);
  const drains = items.filter((p) => p.kind !== "trail" && p.i % 4 === 1);
  return (
    <group>
      {reflectors.map((p) => (
        [-1, 1].map((side) => {
          const x = p.x + p.nx * side * (p.edge + 0.42);
          const z = p.z + p.nz * side * (p.edge + 0.42);
          return (
            <mesh key={`${p.i}-${side}`} position={[x, yAt(x, z, 0.12), z]} rotation={[0, Math.atan2(p.tx, p.tz), 0]}>
              <boxGeometry args={[0.12, 0.1, 0.34]} />
              <meshStandardMaterial color={p.kind === "smart" ? "#38bdf8" : "#f8fafc"} emissive={p.kind === "smart" ? "#0ea5e9" : "#fef3c7"} emissiveIntensity={0.45} roughness={0.42} />
            </mesh>
          );
        })
      ))}
      {drains.map((p) => {
        const side = p.i % 8 < 4 ? -1 : 1;
        const x = p.x + p.nx * side * (p.edge + 0.9);
        const z = p.z + p.nz * side * (p.edge + 0.9);
        return (
          <mesh key={p.i} position={[x, yAt(x, z, 0.045), z]} rotation={[-Math.PI / 2, 0, Math.atan2(p.tx, p.tz)]}>
            <boxGeometry args={[0.72, 0.28, 0.035]} />
            <meshStandardMaterial color="#2f343b" roughness={0.8} metalness={0.2} />
          </mesh>
        );
      })}
      {lights.map((p) => {
        const side = p.i % 10 < 5 ? -1 : 1;
        const x = p.x + p.nx * side * (p.edge + 1.7);
        const z = p.z + p.nz * side * (p.edge + 1.7);
        return (
          <group key={p.i} position={[x, yAt(x, z), z]} rotation={[0, Math.atan2(p.tx, p.tz), 0]}>
            <mesh castShadow position={[0, 1.65, 0]}>
              <cylinderGeometry args={[0.045, 0.065, 3.3, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.38} roughness={0.45} />
            </mesh>
            <mesh position={[0.28 * side, 3.32, 0]}>
              <boxGeometry args={[0.52, 0.12, 0.16]} />
              <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.1} roughness={0.35} />
            </mesh>
            <pointLight position={[0.28 * side, 3.2, 0]} color="#ffd69a" intensity={0.34} distance={10} />
          </group>
        );
      })}
      {rails.map((p) => (
        [-1, 1].map((side) => {
          const x = p.x + p.nx * side * (p.edge + 0.85);
          const z = p.z + p.nz * side * (p.edge + 0.85);
          return (
            <group key={`${p.i}-${side}`} position={[x, yAt(x, z, 0.42), z]} rotation={[0, Math.atan2(p.tx, p.tz), 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.1, 0.12, 2.6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.4} />
              </mesh>
              <mesh castShadow position={[0, -0.32, -0.75]}>
                <cylinderGeometry args={[0.035, 0.04, 0.72, 6]} />
                <meshStandardMaterial color="#64748b" metalness={0.25} roughness={0.55} />
              </mesh>
              <mesh castShadow position={[0, -0.32, 0.75]}>
                <cylinderGeometry args={[0.035, 0.04, 0.72, 6]} />
                <meshStandardMaterial color="#64748b" metalness={0.25} roughness={0.55} />
              </mesh>
            </group>
          );
        })
      ))}
      {renderRoads.filter((r) => r.label && districtPos[r.id]).map((r, i) => {
        const p = r.points[Math.max(1, r.points.length - 5)];
        const x = p[0] + (i % 2 ? 3.2 : -3.2);
        const z = p[1] + (i % 2 ? -2.2 : 2.2);
        return (
          <group key={r.id} position={[x, yAt(x, z, 0.08), z]} rotation={[0, i * 0.4, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[3.2, 0.08, 1.35]} />
              <meshStandardMaterial color="#3f4650" roughness={0.8} />
            </mesh>
            <mesh position={[0.9, 0.32, 0]}>
              <boxGeometry args={[0.14, 0.64, 1.0]} />
              <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.55, 0.18, 0]}>
              <boxGeometry args={[1.2, 0.18, 0.42]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.55} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Traffic() {
  const refs = useRef<THREE.Group[]>([]);
  const route = useMemo(() => smoothRingRoad.slice(0, -1), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.03;
    refs.current.forEach((car, i) => {
      if (!car) return;
      const f = (t + i / refs.current.length) % 1;
      const scaled = f * route.length;
      const idx = Math.floor(scaled) % route.length;
      const next = (idx + 1) % route.length;
      const local = scaled - Math.floor(scaled);
      const a = route[idx];
      const b = route[next];
      let tx = b[0] - a[0];
      let tz = b[1] - a[1];
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl;
      tz /= tl;
      const x = THREE.MathUtils.lerp(a[0], b[0], local) + -tz * 1.6;
      const z = THREE.MathUtils.lerp(a[1], b[1], local) + tx * 1.6;
      car.position.set(x, yAt(x, z, 0.32), z);
      car.rotation.y = Math.atan2(tx, tz);
    });
  });
  return (
    <group>
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i} ref={(g) => { if (g) refs.current[i] = g; }}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.34, 1.7]} />
            <meshStandardMaterial color={["#2563eb", "#f97316", "#e5e7eb", "#dc2626"][i]} roughness={0.42} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.3, -0.08]}>
            <boxGeometry args={[0.7, 0.3, 0.85]} />
            <meshStandardMaterial color="#0b1220" roughness={0.2} metalness={0.3} />
          </mesh>
          {[-0.32, 0.32].map((sx) => (
            <mesh key={sx} position={[sx, 0.02, 0.86]}>
              <boxGeometry args={[0.18, 0.12, 0.05]} />
              <meshStandardMaterial color="#fff" emissive="#fff3c4" emissiveIntensity={2} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function RoadNetwork() {
  return (
    <group>
      {renderRoads.map((road) => (
        <RoadRibbon key={road.id} road={road} />
      ))}

      {renderRoads
        .filter((r) => r.id !== "ring" && r.label && districtPos[r.id])
        .map((r) => (
          <Sign
            key={r.id}
            pos={r.points[Math.max(0, r.points.length - 2)]}
            label={r.label!}
            color={r.kind === "smart" ? "#1e3a8a" : "#0f172a"}
          />
        ))}

      <LandmarkBeacon pos={districtPos.summit ?? [0, 74]} color="#f472b6" height={20} />
      <LandmarkBeacon pos={districtPos.space ?? [64, 48]} color="#c7d2fe" height={24} />
      <LandmarkBeacon pos={districtPos.downtown ?? [10, -20]} color="#ef4444" height={18} />
      <RoadEngineering />
      <Traffic />
    </group>
  );
}
