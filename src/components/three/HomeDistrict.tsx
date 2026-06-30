"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { roadFlatten, terrainHeight } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { distanceToRoad, renderRoads } from "@/lib/roads";
import { useGame } from "@/lib/store";

// A fully-detailed Home District vertical slice: a Scandinavian house (stone base,
// wood cladding, glass), attached garage + driveway to the road, garden with hedges,
// flower beds, paved path, picket fence, mailbox and a lamp. Windows glow at night.

const M = {
  stone: new THREE.MeshStandardMaterial({ color: "#8c887f", roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: "#b87a46", roughness: 0.8 }),
  woodDark: new THREE.MeshStandardMaterial({ color: "#6e4a2c", roughness: 0.8 }),
  trim: new THREE.MeshStandardMaterial({ color: "#eef1f4", roughness: 0.6 }),
  roof: new THREE.MeshStandardMaterial({ color: "#2d333d", roughness: 0.55, metalness: 0.1 }),
  garage: new THREE.MeshStandardMaterial({ color: "#cfd4d9", roughness: 0.5, metalness: 0.2 }),
  drive: new THREE.MeshStandardMaterial({ color: "#3a3d42", roughness: 0.9 }),
  paver: new THREE.MeshStandardMaterial({ color: "#9a958b", roughness: 0.85 }),
  hedge: new THREE.MeshStandardMaterial({ color: "#3f6b3a", roughness: 0.9 }),
  fence: new THREE.MeshStandardMaterial({ color: "#e8e6df", roughness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: "#454b54", roughness: 0.5, metalness: 0.6 }),
};

function GableRoof({ w, d, h, y, mat }: { w: number; d: number; h: number; y: number; mat: THREE.Material }) {
  // two slanted slabs meeting at a ridge along Z
  const slabLen = Math.hypot(w / 2, h);
  const ang = Math.atan2(h, w / 2);
  return (
    <group position={[0, y, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[(s * w) / 4, h / 2, 0]} rotation={[0, 0, -s * ang]}>
          <boxGeometry args={[slabLen, 0.18, d + 0.6]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
      {/* gable end fills */}
      {[-1, 1].map((s) => (
        <mesh key={"g" + s} position={[0, h / 2 - 0.1, (s * d) / 2]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0]), 3]}
            />
          </bufferGeometry>
          <meshStandardMaterial color="#a07a52" roughness={0.85} side={THREE.DoubleSide} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function HomeDistrict() {
  const winRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const lampRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const lampLight = useRef<THREE.PointLight[]>([]);

  const home = districts.find((d) => d.id === "home")!;
  const [hx, hz] = home.position;
  const baseY = terrainHeight(hx, hz);

  // face the approaching road
  const facing = useMemo(() => {
    const road = renderRoads.find((r) => r.id === "home");
    const ap = road && road.points.length > 1 ? road.points[road.points.length - 2] : [hx + 8, hz];
    return Math.atan2(ap[0] - hx, ap[1] - hz);
  }, [hx, hz]);

  const isLocalOnRoad = (x: number, z: number, clearance = 2.4) => {
    const wx = hx + x * Math.cos(facing) + z * Math.sin(facing);
    const wz = hz - x * Math.sin(facing) + z * Math.cos(facing);
    return distanceToRoad(wx, wz) < clearance || roadFlatten(wx, wz) > 0.035;
  };

  const flowers = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: -5.5 + (i % 12) * 0.9 + (Math.random() - 0.5) * 0.3,
        z: 5.6 + Math.floor(i / 12) * 0.55,
        c: ["#f43f5e", "#fbbf24", "#a855f7", "#f9fafb", "#fb7185"][i % 5],
        s: 0.18 + Math.random() * 0.12,
      })).filter((f) => !isLocalOnRoad(f.x, f.z, 2.2)),
    [facing, hx, hz]
  );

  useFrame(() => {
    const tod = useGame.getState().timeOfDay;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    const night = THREE.MathUtils.clamp(0.5 - elev * 2.2, 0, 1);
    winRef.current.forEach((m) => m && (m.emissiveIntensity = 0.15 + night * 1.5));
    lampRef.current.forEach((m) => m && (m.emissiveIntensity = night * 3));
    lampLight.current.forEach((l) => l && (l.intensity = night * 4));
  });

  const Window = ({ pos, w = 1.1, h = 1.3, idx }: { pos: [number, number, number]; w?: number; h?: number; idx: number }) => (
    <group position={pos}>
      <mesh>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.08]} />
        <primitive object={M.trim} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial
          ref={(m) => { if (m) winRef.current[idx] = m; }}
          color="#16242c"
          emissive="#ffe6a8"
          emissiveIntensity={0.2}
          metalness={0.2}
          roughness={0.08}
        />
      </mesh>
    </group>
  );

  return (
    <group position={[hx, baseY, hz]} rotation={[0, facing, 0]}>
      {/* foundation plinth (buries into any slope) */}
      <mesh position={[-1, -1.0, 0]} receiveShadow>
        <boxGeometry args={[20, 2.6, 20]} />
        <primitive object={M.stone} attach="material" />
      </mesh>

      {/* ===== MAIN HOUSE (L-shape) ===== */}
      {/* stone ground floor */}
      <mesh castShadow receiveShadow position={[-2, 1.4, -1]}>
        <boxGeometry args={[8, 2.8, 7]} />
        <primitive object={M.stone} attach="material" />
      </mesh>
      {/* wood upper floor */}
      <mesh castShadow receiveShadow position={[-2, 4.1, -1]}>
        <boxGeometry args={[8.2, 2.6, 7.2]} />
        <primitive object={M.wood} attach="material" />
      </mesh>
      <GableRoof w={8.8} d={7.6} h={2.4} y={5.4} mat={M.roof} />

      {/* side wing (wood) */}
      <mesh castShadow receiveShadow position={[4.4, 1.7, 1.5]}>
        <boxGeometry args={[5, 3.4, 6]} />
        <primitive object={M.woodDark} attach="material" />
      </mesh>
      <group position={[4.4, 0, 1.5]}>
        <GableRoof w={5.6} d={6.4} h={1.8} y={3.4} mat={M.roof} />
      </group>

      {/* chimney */}
      <mesh castShadow position={[-4, 7.2, -1]}>
        <boxGeometry args={[0.8, 2.4, 0.8]} />
        <primitive object={M.stone} attach="material" />
      </mesh>

      {/* windows */}
      <Window pos={[-4, 1.6, 2.55]} idx={0} />
      <Window pos={[0, 1.6, 2.55]} idx={1} />
      <Window pos={[-4, 4.1, 2.7]} idx={2} />
      <Window pos={[0, 4.1, 2.7]} idx={3} />
      {/* big living-room glass */}
      <Window pos={[-2, 1.6, -4.55]} w={3.4} h={2} idx={4} />
      <Window pos={[4.4, 1.9, 4.55]} w={2.4} h={1.8} idx={5} />

      {/* front door + porch */}
      <mesh castShadow position={[1.9, 1.2, 2.6]}>
        <boxGeometry args={[1.1, 2.4, 0.14]} />
        <primitive object={M.woodDark} attach="material" />
      </mesh>
      <mesh position={[2.25, 1.2, 2.68]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <primitive object={M.metal} attach="material" />
      </mesh>
      <mesh castShadow position={[1.9, 2.55, 3.1]}>
        <boxGeometry args={[2, 0.16, 1.2]} />
        <primitive object={M.trim} attach="material" />
      </mesh>

      {/* ===== GARAGE ===== */}
      <mesh castShadow receiveShadow position={[8.8, 1.5, 4]}>
        <boxGeometry args={[4.4, 3, 5.4]} />
        <primitive object={M.wood} attach="material" />
      </mesh>
      <group position={[8.8, 0, 4]}>
        <GableRoof w={5} d={5.8} h={1.4} y={3} mat={M.roof} />
      </group>
      <mesh position={[8.8, 1.2, 6.75]}>
        <boxGeometry args={[3.4, 2.2, 0.12]} />
        <primitive object={M.garage} attach="material" />
      </mesh>

      {/* driveway from garage toward the road (local +z) */}
      <mesh receiveShadow position={[8.8, 0.06, 13]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 13]} />
        <primitive object={M.drive} attach="material" />
      </mesh>

      {/* paved path: driveway -> front door */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} receiveShadow position={[6.6 - i * 0.8, 0.07, 6.2 - i * 0.2]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[1.1, 0.8]} />
          <primitive object={M.paver} attach="material" />
        </mesh>
      ))}

      {/* hedges bordering the front garden */}
      {[
        [-6, 0.5, 6.5, 8, 1],
        [-6, 0.5, 0, 1, 12],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <boxGeometry args={[w, 1, d]} />
          <primitive object={M.hedge} attach="material" />
        </mesh>
      ))}

      {/* flower bed */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0.2, f.z]}>
          <mesh>
            <icosahedronGeometry args={[f.s, 0]} />
            <meshStandardMaterial color={f.c} roughness={0.7} emissive={f.c} emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}

      {/* picket fence along the front (local +z edge) */}
      {Array.from({ length: 18 }, (_, i) => (
        isLocalOnRoad(-8 + i * 1.05, 11, 2.2) ? null : <mesh key={i} castShadow position={[-8 + i * 1.05, 0.6, 11]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <primitive object={M.fence} attach="material" />
        </mesh>
      ))}
      {!isLocalOnRoad(-0.5, 11, 2.2) && <mesh position={[-0.5, 0.95, 11]}>
        <boxGeometry args={[18, 0.1, 0.08]} />
        <primitive object={M.fence} attach="material" />
      </mesh>}

      {/* mailbox */}
      {!isLocalOnRoad(10.8, 11.5, 2.3) && <group position={[10.8, 0, 11.5]}>
        <mesh castShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
          <primitive object={M.woodDark} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[0.3, 0.25, 0.45]} />
          <primitive object={M.metal} attach="material" />
        </mesh>
      </group>}

      {/* garden lamps (glow at night) */}
      {[[-7, 8], [9.5, 9]].map(([x, z], i) => (
        isLocalOnRoad(x, z, 2.2) ? null : <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 2.2, 6]} />
            <primitive object={M.metal} attach="material" />
          </mesh>
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial
              ref={(m) => { if (m) lampRef.current[i] = m; }}
              color="#fff4d0"
              emissive="#ffdf9e"
              emissiveIntensity={0}
            />
          </mesh>
          <pointLight ref={(l) => { if (l) lampLight.current[i] = l; }} position={[0, 2.3, 0]} color="#ffe6ab" distance={12} decay={2} intensity={0} />
        </group>
      ))}
    </group>
  );
}
