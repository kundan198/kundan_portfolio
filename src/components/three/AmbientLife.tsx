"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/lib/noise";
import { districts } from "@/lib/portfolio";
import { useGame } from "@/lib/store";

// ---- a single wandering pedestrian with procedural walk animation ----
function Walker({ home, radius, color, speed }: { home: [number, number]; radius: number; color: string; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);

  const state = useRef({
    x: home[0],
    z: home[1],
    tx: home[0],
    tz: home[1],
    heading: Math.random() * 6.28,
    phase: Math.random() * 6.28,
  });

  const pickTarget = () => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    state.current.tx = home[0] + Math.cos(a) * r;
    state.current.tz = home[1] + Math.sin(a) * r;
  };

  useFrame((_, dt) => {
    const s = state.current;
    const dx = s.tx - s.x;
    const dz = s.tz - s.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.6) {
      pickTarget();
    } else {
      const step = Math.min(dist, speed * dt);
      s.x += (dx / dist) * step;
      s.z += (dz / dist) * step;
      s.heading = Math.atan2(dx, dz);
      s.phase += dt * speed * 1.6;
    }
    if (group.current) {
      group.current.position.set(s.x, terrainHeight(s.x, s.z) + 0.9, s.z);
      group.current.rotation.y = s.heading;
      const sw = Math.sin(s.phase) * 0.6;
      if (legL.current) legL.current.rotation.x = sw;
      if (legR.current) legR.current.rotation.x = -sw;
      if (armL.current) armL.current.rotation.x = -sw * 0.8;
      if (armR.current) armR.current.rotation.x = sw * 0.8;
    }
  });

  return (
    <group ref={group}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.32, 0.34, 0.32]} />
        <meshStandardMaterial color="#e6b48c" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.38, 0.5, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={armL} castShadow position={[-0.26, 0.18, 0]}>
        <boxGeometry args={[0.1, 0.42, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={armR} castShadow position={[0.26, 0.18, 0]}>
        <boxGeometry args={[0.1, 0.42, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={legL} castShadow position={[-0.1, -0.32, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshStandardMaterial color="#26303f" roughness={0.7} />
      </mesh>
      <mesh ref={legR} castShadow position={[0.1, -0.32, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshStandardMaterial color="#26303f" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ---- a flock of birds slowly circling the sky ----
function Birds() {
  const flock = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Mesh[]>([]);
  const N = 26;

  const birds = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        r: 30 + Math.random() * 70,
        a: Math.random() * Math.PI * 2,
        y: 28 + Math.random() * 26,
        phase: Math.random() * 6.28,
        scale: 0.6 + Math.random() * 0.8,
      })),
    []
  );

  useFrame((state, dt) => {
    if (flock.current) flock.current.rotation.y += dt * 0.04;
    const t = state.clock.elapsedTime;
    wings.current.forEach((w, i) => {
      if (w) w.rotation.z = Math.sin(t * 8 + birds[Math.floor(i / 2)].phase) * 0.7 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={flock}>
      {birds.map((b, i) => (
        <group key={i} position={[Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r]} rotation={[0, -b.a, 0]} scale={b.scale}>
          <mesh>
            <coneGeometry args={[0.18, 0.7, 4]} />
            <meshStandardMaterial color="#1b2230" />
          </mesh>
          <mesh ref={(m) => { if (m) wings.current[i * 2] = m; }} position={[0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.28]} />
            <meshStandardMaterial color="#2a3344" />
          </mesh>
          <mesh ref={(m) => { if (m) wings.current[i * 2 + 1] = m; }} position={[-0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.28]} />
            <meshStandardMaterial color="#2a3344" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function AmbientLife() {
  const streamKey = useGame((s) => {
    const cx = Math.floor(s.heroPos[0] / 42);
    const cz = Math.floor(s.heroPos[2] / 42);
    return `${s.graphicsQuality}:${cx}:${cz}`;
  });
  // spread pedestrians around each district + a few near spawn
  const walkers = useMemo(() => {
    const palette = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#06b6d4"];
    const arr: { home: [number, number]; radius: number; color: string; speed: number }[] = [];
    districts.forEach((d, di) => {
      for (let k = 0; k < 2; k++) {
        arr.push({
          home: [d.position[0], d.position[1]],
          radius: 9,
          color: palette[(di + k) % palette.length],
          speed: 1.4 + Math.random() * 1.2,
        });
      }
    });
    // a couple near home base
    arr.push({ home: [-72, -54], radius: 7, color: "#06b6d4", speed: 1.6 });
    arr.push({ home: [-66, -50], radius: 7, color: "#a855f7", speed: 1.3 });
    return arr;
  }, []);

  const visibleWalkers = useMemo(() => {
    const [hx, , hz] = useGame.getState().heroPos;
    const q = useGame.getState().graphicsQuality;
    const radius = q === "low" ? 58 : q === "medium" ? 82 : q === "high" ? 110 : 150;
    return walkers.filter((w) => Math.hypot(w.home[0] - hx, w.home[1] - hz) < radius);
  }, [walkers, streamKey]);

  return (
    <group>
      {visibleWalkers.map((w, i) => (
        <Walker key={i} {...w} />
      ))}
      <Birds />
    </group>
  );
}
