"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { tracker } from "@/lib/refs";
import { useGame } from "@/lib/store";

const GRASS_COUNT = 430;
const DISTRICT_PEBBLES = 24;
const PATH_PEBBLES = 130;
const PUDDLE_COUNT = 10;
const BUTTERFLY_COUNT = 8;

const rand = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hash = (x: number, z: number, salt = 0) => rand(Math.floor(x * 73856093) ^ Math.floor(z * 19349663) ^ salt);

const groundY = (x: number, z: number, lift = 0.03) => terrainHeight(x, z) + lift;

function avoidCore(x: number, z: number) {
  if (Math.hypot(x, z) < 9) return false;
  return districts.every((d) => Math.hypot(x - d.position[0], z - d.position[1]) > 4.5);
}

function angleToCenter(x: number, z: number) {
  return Math.atan2(-x, -z);
}

function MicroFlora() {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const pebbleRef = useRef<THREE.InstancedMesh>(null);
  const mushroomStemRef = useRef<THREE.InstancedMesh>(null);
  const mushroomCapRef = useRef<THREE.InstancedMesh>(null);
  const grassShader = useRef<THREE.WebGLProgramParametersWithUniforms | null>(null);

  const data = useMemo(() => {
    const grass: { x: number; z: number; s: number; rot: number; tint: THREE.Color }[] = [];
    const flowers: { x: number; z: number; s: number; color: THREE.Color }[] = [];
    const pebbles: { x: number; z: number; s: number; rot: number; color: THREE.Color }[] = [];
    const mushrooms: { x: number; z: number; s: number; rot: number }[] = [];

    for (let i = 0; i < GRASS_COUNT; i++) {
      const a = rand(2000 + i) * Math.PI * 2;
      const r = 12 + Math.sqrt(rand(3000 + i)) * 104;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!avoidCore(x, z)) continue;
      const lush = hash(x * 0.18, z * 0.18, 11);
      grass.push({
        x,
        z,
        s: 0.55 + lush * 1.25,
        rot: rand(4000 + i) * Math.PI,
        tint: new THREE.Color().setHSL(0.25 + lush * 0.08, 0.43 + lush * 0.2, 0.24 + lush * 0.15),
      });
      if (i % 16 === 0 && lush > 0.34) {
        const cluster = 2 + Math.floor(lush * 3);
        for (let j = 0; j < cluster; j++) {
          const offA = rand(5000 + i * 13 + j) * Math.PI * 2;
          const offR = rand(6000 + i * 17 + j) * 1.15;
          const fx = x + Math.cos(offA) * offR;
          const fz = z + Math.sin(offA) * offR;
          flowers.push({
            x: fx,
            z: fz,
            s: 0.45 + rand(7000 + i + j) * 0.55,
            color: new THREE.Color(["#f7d66d", "#d96cff", "#ff8aa1", "#9be66f", "#73d7ff"][Math.floor(rand(7100 + i + j) * 5)]),
          });
        }
      }
      if (i % 31 === 0 && lush > 0.45) mushrooms.push({ x, z, s: 0.45 + lush * 0.75, rot: rand(8000 + i) * 6.28 });
    }

    districts.forEach((d, di) => {
      const [cx, cz] = d.position;
      for (let i = 0; i < DISTRICT_PEBBLES; i++) {
        const a = rand(9000 + di * 100 + i) * Math.PI * 2;
        const r = 6.6 + rand(9100 + di * 100 + i) * 7;
        const x = cx + Math.cos(a) * r;
        const z = cz + Math.sin(a) * r;
        pebbles.push({
          x,
          z,
          s: 0.12 + rand(9200 + di * 100 + i) * 0.28,
          rot: rand(9300 + di * 100 + i) * 6.28,
          color: new THREE.Color().setHSL(0.08, 0.08, 0.32 + rand(9400 + i) * 0.22),
        });
      }
    });

    for (let i = 0; i < PATH_PEBBLES; i++) {
      const a = (i / PATH_PEBBLES) * Math.PI * 2 + rand(10000 + i) * 0.18;
      const r = 19 + rand(10100 + i) * 5;
      pebbles.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        s: 0.1 + rand(10200 + i) * 0.35,
        rot: rand(10300 + i) * 6.28,
        color: new THREE.Color().setHSL(0.1, 0.08, 0.28 + rand(10400 + i) * 0.24),
      });
    }

    return { grass, flowers, pebbles, mushrooms };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (grassRef.current) {
      data.grass.forEach((g, i) => {
        dummy.position.set(g.x, groundY(g.x, g.z, 0.16 * g.s), g.z);
        dummy.rotation.set(0, g.rot, 0.1 - hash(g.x, g.z, 21) * 0.2);
        dummy.scale.set(0.26 * g.s, 0.32 * g.s, 1);
        dummy.updateMatrix();
        grassRef.current!.setMatrixAt(i, dummy.matrix);
        grassRef.current!.setColorAt(i, g.tint);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
      if (grassRef.current.instanceColor) grassRef.current.instanceColor.needsUpdate = true;
    }
    if (flowerRef.current) {
      data.flowers.forEach((f, i) => {
        dummy.position.set(f.x, groundY(f.x, f.z, 0.12 * f.s), f.z);
        dummy.rotation.set(0, hash(f.x, f.z, 30) * 6.28, 0);
        dummy.scale.setScalar(f.s);
        dummy.updateMatrix();
        flowerRef.current!.setMatrixAt(i, dummy.matrix);
        flowerRef.current!.setColorAt(i, f.color);
      });
      flowerRef.current.instanceMatrix.needsUpdate = true;
      if (flowerRef.current.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
    }
    if (pebbleRef.current) {
      data.pebbles.forEach((p, i) => {
        dummy.position.set(p.x, groundY(p.x, p.z, 0.04), p.z);
        dummy.rotation.set(hash(p.x, p.z, 40) * 0.5, p.rot, hash(p.x, p.z, 41) * 0.5);
        dummy.scale.set(p.s * 1.7, p.s * 0.45, p.s);
        dummy.updateMatrix();
        pebbleRef.current!.setMatrixAt(i, dummy.matrix);
        pebbleRef.current!.setColorAt(i, p.color);
      });
      pebbleRef.current.instanceMatrix.needsUpdate = true;
      if (pebbleRef.current.instanceColor) pebbleRef.current.instanceColor.needsUpdate = true;
    }
    if (mushroomStemRef.current && mushroomCapRef.current) {
      data.mushrooms.forEach((m, i) => {
        dummy.position.set(m.x, groundY(m.x, m.z, 0.16 * m.s), m.z);
        dummy.rotation.set(0, m.rot, 0);
        dummy.scale.setScalar(m.s);
        dummy.updateMatrix();
        mushroomStemRef.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(m.x, groundY(m.x, m.z, 0.34 * m.s), m.z);
        dummy.updateMatrix();
        mushroomCapRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mushroomStemRef.current.instanceMatrix.needsUpdate = true;
      mushroomCapRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [data]);

  const onGrassCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 1 };
    shader.vertexShader = "uniform float uTime;\nuniform float uWind;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float blade = clamp(position.y + 0.5, 0.0, 1.0);
       float phase = instanceMatrix[3].x * 0.71 + instanceMatrix[3].z * 0.43;
       transformed.x += sin(uTime * 2.1 + phase) * 0.11 * blade * uWind;
       transformed.z += cos(uTime * 1.7 + phase) * 0.08 * blade * uWind;`
    );
    grassShader.current = shader;
  };

  useFrame((state) => {
    if (!grassShader.current) return;
    grassShader.current.uniforms.uTime.value = state.clock.elapsedTime;
    grassShader.current.uniforms.uWind.value = useGame.getState().weather === "rain" ? 1.9 : 1;
  });

  return (
    <group>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, data.flowers.length]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial roughness={0.78} vertexColors emissive="#111111" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={pebbleRef} args={[undefined, undefined, data.pebbles.length]} receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} vertexColors flatShading />
      </instancedMesh>
      <instancedMesh ref={mushroomStemRef} args={[undefined, undefined, data.mushrooms.length]}>
        <cylinderGeometry args={[0.07, 0.09, 0.32, 6]} />
        <meshStandardMaterial color="#d7c7a3" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mushroomCapRef} args={[undefined, undefined, data.mushrooms.length]}>
        <sphereGeometry args={[0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b84239" roughness={0.82} />
      </instancedMesh>
    </group>
  );
}

function WeatheredGround() {
  const puddles = useMemo(() => {
    const spots: { x: number; z: number; s: number; rot: number }[] = [];
    for (let i = 0; i < PUDDLE_COUNT; i++) {
      const a = rand(13000 + i) * Math.PI * 2;
      const r = 11 + rand(13100 + i) * 58;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (terrainHeight(x, z) < 1.8) spots.push({ x, z, s: 0.8 + rand(13200 + i) * 2.3, rot: rand(13300 + i) * 6.28 });
    }
    return spots;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, terrainHeight(0, 0) + 0.065, 0]} receiveShadow>
        <ringGeometry args={[17.5, 21.5, 48]} />
        <meshStandardMaterial color="#262b34" roughness={0.92} metalness={0.02} />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = 19.5 + (i % 3) * 0.55;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[x, groundY(x, z, 0.085), z]}>
            <boxGeometry args={[0.06 + (i % 2) * 0.035, 1.1 + (i % 4) * 0.16, 0.01]} />
            <meshStandardMaterial color="#69707c" roughness={0.96} transparent opacity={0.45} />
          </mesh>
        );
      })}
      {puddles.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, p.rot]} position={[p.x, groundY(p.x, p.z, 0.075), p.z]} scale={[p.s * 1.7, p.s, 1]}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial
            color="#8fc7ff"
            roughness={0.05}
            metalness={0.15}
            transparent
            opacity={useGame.getState().weather === "rain" ? 0.34 : 0.16}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function StoryVignette({ d, index }: { d: (typeof districts)[number]; index: number }) {
  const [cx, cz] = d.position;
  const y = terrainHeight(cx, cz);
  const rot = angleToCenter(cx, cz);
  const color = new THREE.Color(d.color);
  const isForest = d.id === "forest";

  return (
    <group position={[cx, y, cz]} rotation={[0, rot, 0]}>
      <group position={[7.6, 0.1, -6.8]}>
        <mesh receiveShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[2.8, 0.18, 1.1]} />
          <meshStandardMaterial color="#5b3822" roughness={0.88} />
        </mesh>
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} position={[x, 0.05, -0.38]}>
            <cylinderGeometry args={[0.08, 0.09, 0.7, 6]} />
            <meshStandardMaterial color="#352417" roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0.2, 0.51, 0]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[1.1, 0.04, 0.72]} />
          <meshStandardMaterial color="#efe7ce" roughness={0.72} />
        </mesh>
        <mesh position={[-0.22, 0.555, 0.04]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.52, 0.015, 0.035]} />
          <meshStandardMaterial color={isForest ? "#4b6f3b" : d.color} roughness={0.8} />
        </mesh>
        <mesh position={[0.32, 0.557, -0.08]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.36, 0.015, 0.03]} />
          <meshStandardMaterial color="#273449" roughness={0.8} />
        </mesh>
        <mesh position={[-0.9, 0.57, 0.24]}>
          <cylinderGeometry args={[0.14, 0.12, 0.22, 12]} />
          <meshStandardMaterial color="#f2f0df" roughness={0.5} />
        </mesh>
      </group>

      <group position={[-7.4, 0, 6.4]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[2.2, 1.7, 1.2]} />
          <meshStandardMaterial color="#18202d" emissive={color} emissiveIntensity={0.09} roughness={0.62} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.15, -0.62]}>
          <planeGeometry args={[1.38, 0.72]} />
          <meshStandardMaterial color={d.color} emissive={color} emissiveIntensity={1.3} roughness={0.4} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[-0.7 + i * 0.35, 0.45, -0.66]}>
            <boxGeometry args={[0.16, 0.05 + (i % 3) * 0.08, 0.04]} />
            <meshStandardMaterial color={["#59f5d6", "#f8dd77", "#ff8a8a"][i % 3]} emissive={["#59f5d6", "#f8dd77", "#ff8a8a"][i % 3]} emissiveIntensity={0.9} />
          </mesh>
        ))}
        <mesh position={[1.55, 0.55, -0.1]} rotation={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.08, 0.08, 1.3, 8]} />
          <meshStandardMaterial color="#343b47" metalness={0.75} roughness={0.38} />
        </mesh>
        <mesh position={[1.82, 0.18, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.035, 8, 18]} />
          <meshStandardMaterial color="#202630" metalness={0.65} roughness={0.44} />
        </mesh>
      </group>

      <group position={[0, 0.05, -10.8]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.16, 2.2, 0.16]} />
          <meshStandardMaterial color="#303741" roughness={0.72} metalness={0.35} />
        </mesh>
        <mesh position={[0.74, 2.05, 0]}>
          <boxGeometry args={[1.45, 0.18, 0.22]} />
          <meshStandardMaterial color="#303741" roughness={0.72} metalness={0.35} />
        </mesh>
        <mesh position={[1.38, 1.95, 0]}>
          <boxGeometry args={[0.32, 0.18, 0.36]} />
          <meshStandardMaterial color="#f6e5a8" emissive="#f6c45f" emissiveIntensity={0.55} roughness={0.38} />
        </mesh>
        {index < 2 && <pointLight position={[1.38, 1.8, 0]} color="#ffd991" intensity={0.22} distance={5} />}
      </group>
    </group>
  );
}

function LivingWater() {
  const water = useRef<THREE.Mesh>(null);
  const dragon = useRef<THREE.Group>(null);
  const fish = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (water.current) {
      water.current.rotation.z = Math.sin(t * 0.08) * 0.015;
      const mat = water.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.36 + Math.sin(t * 0.7) * 0.04;
    }
    if (dragon.current) {
      const a = t * 1.35;
      dragon.current.position.set(-26 + Math.cos(a) * 6, groundY(-26, 22, 1.6) + Math.sin(t * 3) * 0.35, 22 + Math.sin(a * 1.4) * 4);
      dragon.current.rotation.y = -a;
    }
    if (fish.current) {
      fish.current.rotation.y += dt * 0.7;
      fish.current.children.forEach((child, i) => {
        child.position.y = Math.sin(t * 2.2 + i) * 0.04;
      });
    }
  });

  return (
    <group position={[-26, groundY(-26, 22, 0.05), 22]}>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 40]} />
        <meshStandardMaterial color="#5eb3d8" roughness={0.08} metalness={0.2} transparent opacity={0.36} depthWrite={false} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[Math.cos(a) * 3.8, 0.04, Math.sin(a) * 3.8]}>
            <torusGeometry args={[0.35 + (i % 3) * 0.18, 0.01, 5, 24]} />
            <meshStandardMaterial color="#c7f4ff" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        );
      })}
      <group ref={fish}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * (1.5 + i * 0.35), 0.08, Math.sin(a) * (1.5 + i * 0.35)]} rotation={[0, -a, 0]}>
              <coneGeometry args={[0.12, 0.55, 5]} />
              <meshStandardMaterial color={i % 2 ? "#f6b65d" : "#7dd3fc"} roughness={0.35} />
            </mesh>
          );
        })}
      </group>
      <group ref={dragon}>
        <mesh>
          <boxGeometry args={[0.55, 0.08, 0.09]} />
          <meshStandardMaterial color="#61f3dc" emissive="#1cd6ba" emissiveIntensity={0.3} />
        </mesh>
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, 0, 0.16]} rotation={[0.25, 0, 0]}>
            <planeGeometry args={[0.42, 0.18]} />
            <meshStandardMaterial color="#bffaf0" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ButterfliesAndLeaves() {
  const group = useRef<THREE.Group>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const butterflies = useMemo(
    () =>
      Array.from({ length: BUTTERFLY_COUNT }, (_, i) => ({
        home: new THREE.Vector3(Math.cos(i * 2.1) * (28 + (i % 4) * 12), 2.2 + (i % 5) * 0.35, Math.sin(i * 1.7) * (26 + (i % 3) * 14)),
        phase: rand(16000 + i) * 6.28,
        color: ["#ffd166", "#ff7aaa", "#77e6ff", "#b7f071"][i % 4],
      })),
    []
  );

  useEffect(() => {
    if (!leaves.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 24; i++) {
      const a = rand(17000 + i) * Math.PI * 2;
      const r = 20 + rand(17100 + i) * 88;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      dummy.position.set(x, groundY(x, z, 3 + rand(17200 + i) * 12), z);
      dummy.rotation.set(rand(17300 + i) * Math.PI, rand(17400 + i) * Math.PI, rand(17500 + i) * Math.PI);
      dummy.scale.set(0.24, 0.04, 0.42);
      dummy.updateMatrix();
      leaves.current.setMatrixAt(i, dummy.matrix);
      leaves.current.setColorAt(i, new THREE.Color(["#b9873e", "#d4aa47", "#748f45", "#9b5c31"][i % 4]));
    }
    leaves.current.instanceMatrix.needsUpdate = true;
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const hero = new THREE.Vector3(tracker.hero.x, tracker.hero.y, tracker.hero.z);
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const b = butterflies[i];
        const avoid = child.position.distanceTo(hero) < 8 ? child.position.clone().sub(hero).normalize().multiplyScalar(5) : new THREE.Vector3();
        child.position.set(
          b.home.x + Math.sin(t * 0.8 + b.phase) * 3.5 + avoid.x,
          groundY(b.home.x, b.home.z, b.home.y + Math.sin(t * 2.1 + b.phase) * 0.7),
          b.home.z + Math.cos(t * 0.7 + b.phase) * 3 + avoid.z
        );
        child.rotation.y = t * 1.2 + b.phase;
        child.children.forEach((wing, wi) => (wing.rotation.z = Math.sin(t * 12 + b.phase) * 0.75 * (wi === 0 ? 1 : -1)));
      });
    }
  });

  return (
    <group>
      <group ref={group}>
        {butterflies.map((b, i) => (
          <group key={i}>
            <mesh position={[-0.09, 0, 0]}>
              <planeGeometry args={[0.22, 0.16]} />
              <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.18} side={THREE.DoubleSide} transparent opacity={0.82} />
            </mesh>
            <mesh position={[0.09, 0, 0]}>
              <planeGeometry args={[0.22, 0.16]} />
              <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.18} side={THREE.DoubleSide} transparent opacity={0.82} />
            </mesh>
          </group>
        ))}
      </group>
      <instancedMesh ref={leaves} args={[undefined, undefined, 24]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial vertexColors roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

export default function WorldDetails() {
  return (
    <group>
      <WeatheredGround />
      <MicroFlora />
      <LivingWater />
      <ButterfliesAndLeaves />
      {districts.filter((d) => d.id !== "home").map((d, i) => (
        <StoryVignette key={d.id} d={d} index={i} />
      ))}
    </group>
  );
}
