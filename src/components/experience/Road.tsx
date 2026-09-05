"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ROAD_WIDTH, frameAt, journeyCurve } from "@/lib/journeyPath";

/** A flat ribbon swept along the spline using a world-up frame (never twists). */
function buildRibbon(segments: number, halfWidth: number, lift: number, vRepeat: number) {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices: number[] = [];
  const f = frameAt(0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    frameAt(t, f);
    const base = i * 6;
    positions[base + 0] = f.position.x - f.right.x * halfWidth;
    positions[base + 1] = f.position.y - f.right.y * halfWidth + lift;
    positions[base + 2] = f.position.z - f.right.z * halfWidth;
    positions[base + 3] = f.position.x + f.right.x * halfWidth;
    positions[base + 4] = f.position.y + f.right.y * halfWidth + lift;
    positions[base + 5] = f.position.z + f.right.z * halfWidth;

    const uvBase = i * 4;
    uvs[uvBase + 0] = 0;
    uvs[uvBase + 1] = t * vRepeat;
    uvs[uvBase + 2] = 1;
    uvs[uvBase + 3] = t * vRepeat;

    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

interface RoadProps {
  quality: "low" | "medium" | "high";
}

export default function Road({ quality }: RoadProps) {
  const segments = quality === "low" ? 200 : quality === "medium" ? 320 : 460;
  const lampStep = quality === "low" ? 90 : 55;
  const dashStep = quality === "low" ? 26 : 16;

  const asphalt = useMemo(() => buildRibbon(segments, ROAD_WIDTH / 2, 0, 1), [segments]);
  const shoulder = useMemo(() => buildRibbon(segments, ROAD_WIDTH / 2 + 3.4, -0.16, 1), [segments]);
  const edgeL = useMemo(() => buildRibbon(segments, 0.001, 0.02, 1), [segments]);
  const glowRibbon = useMemo(() => buildRibbon(segments, ROAD_WIDTH / 2 + 0.25, 0.015, 1), [segments]);

  useLayoutEffect(
    () => () => {
      [asphalt, shoulder, edgeL, glowRibbon].forEach((g) => g.dispose());
    },
    [asphalt, shoulder, edgeL, glowRibbon],
  );

  const length = useMemo(() => journeyCurve.getLength(), []);
  const dashCount = Math.max(1, Math.floor(length / dashStep));
  const lampCount = Math.max(1, Math.floor(length / lampStep));
  const railCount = Math.max(1, Math.floor(length / 14));

  const dashRef = useRef<THREE.InstancedMesh>(null);
  const lampPoleRef = useRef<THREE.InstancedMesh>(null);
  const lampHeadRef = useRef<THREE.InstancedMesh>(null);
  const lampPoolRef = useRef<THREE.InstancedMesh>(null);
  const railRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const f = frameAt(0);

    // Centre-line dashes
    const dash = dashRef.current;
    if (dash) {
      for (let i = 0; i < dashCount; i++) {
        const t = (i + 0.5) / dashCount;
        frameAt(t, f);
        euler.set(f.pitch, f.yaw, 0, "YXZ");
        q.setFromEuler(euler);
        pos.copy(f.position);
        pos.y += 0.03;
        m.compose(pos, q, scale);
        dash.setMatrixAt(i, m);
      }
      dash.instanceMatrix.needsUpdate = true;
      dash.computeBoundingSphere();
    }

    // Street lamps, alternating sides
    const pole = lampPoleRef.current;
    const head = lampHeadRef.current;
    const pool = lampPoolRef.current;
    if (pole && head && pool) {
      for (let i = 0; i < lampCount; i++) {
        const t = (i + 0.5) / lampCount;
        const side = i % 2 === 0 ? 1 : -1;
        frameAt(t, f);
        euler.set(0, f.yaw, 0, "YXZ");
        q.setFromEuler(euler);

        pos.copy(f.position).addScaledVector(f.right, side * (ROAD_WIDTH / 2 + 1.6));
        pos.y += 4;
        m.compose(pos, q, scale);
        pole.setMatrixAt(i, m);

        pos.copy(f.position).addScaledVector(f.right, side * (ROAD_WIDTH / 2 - 0.4));
        pos.y += 7.9;
        m.compose(pos, q, scale);
        head.setMatrixAt(i, m);

        pos.copy(f.position).addScaledVector(f.right, side * (ROAD_WIDTH / 2 - 1.6));
        pos.y += 0.05;
        euler.set(-Math.PI / 2, 0, f.yaw, "XYZ");
        q.setFromEuler(euler);
        m.compose(pos, q, scale);
        pool.setMatrixAt(i, m);
      }
      [pole, head, pool].forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      });
    }

    // Guard-rail posts on both shoulders
    const rail = railRef.current;
    if (rail) {
      for (let i = 0; i < railCount; i++) {
        const t = (i + 0.5) / railCount;
        const side = i % 2 === 0 ? 1 : -1;
        frameAt(t, f);
        euler.set(0, f.yaw, 0, "YXZ");
        q.setFromEuler(euler);
        pos.copy(f.position).addScaledVector(f.right, side * (ROAD_WIDTH / 2 + 0.9));
        pos.y += 0.55;
        m.compose(pos, q, scale);
        rail.setMatrixAt(i, m);
      }
      rail.instanceMatrix.needsUpdate = true;
      rail.computeBoundingSphere();
    }
  }, [dashCount, lampCount, railCount]);

  return (
    <group>
      <mesh geometry={shoulder} receiveShadow={quality !== "low"}>
        <meshStandardMaterial color="#0a0c16" roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh geometry={asphalt} receiveShadow={quality !== "low"}>
        {/* Slightly metallic so the street lamps and signage smear along the
            surface — a cheap stand-in for real road reflections. */}
        <meshStandardMaterial color="#101425" roughness={0.42} metalness={0.55} envMapIntensity={0.7} />
      </mesh>

      <mesh geometry={glowRibbon} renderOrder={1}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={edgeL} renderOrder={2}>
        <meshBasicMaterial color="#1e293b" transparent opacity={0.25} depthWrite={false} />
      </mesh>

      <instancedMesh ref={dashRef} args={[undefined, undefined, dashCount]} frustumCulled={false}>
        <boxGeometry args={[0.34, 0.02, 4.2]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.45} roughness={0.6} />
      </instancedMesh>

      <instancedMesh ref={railRef} args={[undefined, undefined, railCount]} frustumCulled={false}>
        <boxGeometry args={[0.16, 1.1, 0.16]} />
        <meshStandardMaterial color="#1e2438" roughness={0.55} metalness={0.7} />
      </instancedMesh>

      <instancedMesh ref={lampPoleRef} args={[undefined, undefined, lampCount]} frustumCulled={false}>
        <boxGeometry args={[0.22, 8, 0.22]} />
        <meshStandardMaterial color="#161c2e" roughness={0.6} metalness={0.5} />
      </instancedMesh>

      <instancedMesh ref={lampHeadRef} args={[undefined, undefined, lampCount]} frustumCulled={false}>
        <boxGeometry args={[2.4, 0.22, 0.5]} />
        <meshStandardMaterial color="#0f1424" emissive="#a5b4fc" emissiveIntensity={2.4} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={lampPoolRef} args={[undefined, undefined, lampCount]} frustumCulled={false}>
        <circleGeometry args={[4.2, 12]} />
        <meshBasicMaterial
          color="#8ea2ff"
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
