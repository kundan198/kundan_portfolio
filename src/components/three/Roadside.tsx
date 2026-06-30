"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/lib/noise";
import { renderRoads } from "@/lib/roads";

// Tiered roadside generated FROM the road splines, so it's always aligned to the
// road and there's never bare ground beside one: trimmed grass hugging the asphalt,
// then shrubs/ferns, then scattered stones. Instanced + wind, terrain-conforming.

type Station = { x: number; z: number; nx: number; nz: number; edge: number };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function buildStations(step: number): Station[] {
  const out: Station[] = [];
  for (const road of renderRoads) {
    const pts = road.points;
    const edge = road.width / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      let dx = b[0] - a[0];
      let dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.001) continue;
      dx /= len;
      dz /= len;
      const nx = -dz;
      const nz = dx;
      const n = Math.max(1, Math.round(len / step));
      for (let s = 0; s < n; s++) {
        const t = s / n;
        out.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, nx, nz, edge });
      }
    }
  }
  return out;
}

// inject a gentle wind sway into an instanced material (sways the upper vertices)
function windCompile(store: { current: THREE.WebGLProgramParametersWithUniforms | null }, amp: number) {
  return (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float ph = instanceMatrix[3].x * 0.5 + instanceMatrix[3].z * 0.5;
       float hh = clamp(position.y + 0.5, 0.0, 1.5);
       transformed.x += sin(uTime * 2.1 + ph) * ${amp.toFixed(3)} * hh;
       transformed.z += cos(uTime * 1.7 + ph) * ${(amp * 0.7).toFixed(3)} * hh;`
    );
    store.current = shader;
  };
}

export default function Roadside() {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const shrubRef = useRef<THREE.InstancedMesh>(null);
  const stoneRef = useRef<THREE.InstancedMesh>(null);
  const grassShader = useRef<THREE.WebGLProgramParametersWithUniforms | null>(null);
  const shrubShader = useRef<THREE.WebGLProgramParametersWithUniforms | null>(null);

  const data = useMemo(() => {
    const stations = buildStations(1.5);
    const rnd = rng(7321);
    const grass: { x: number; z: number; s: number; hue: number }[] = [];
    const shrub: { x: number; z: number; s: number; hue: number }[] = [];
    const stone: { x: number; z: number; s: number; rot: number }[] = [];
    const GRASS_MAX = 11000;

    stations.forEach((st, i) => {
      for (const side of [-1, 1] as const) {
        // trimmed grass band: 0.3 .. 2.4 m off the edge
        if (grass.length < GRASS_MAX) {
          const tufts = 2;
          for (let k = 0; k < tufts; k++) {
            const off = st.edge + 0.3 + rnd() * 2.1;
            const jit = (rnd() - 0.5) * 1.2;
            const x = st.x + st.nx * side * off + st.nz * jit;
            const z = st.z + st.nz * side * off - st.nx * jit;
            grass.push({ x, z, s: 0.5 + rnd() * 0.7, hue: rnd() });
          }
        }
        // shrubs / ferns: 2.4 .. 4.5 m off, sparser
        if (i % 4 === 0 && rnd() < 0.7) {
          const off = st.edge + 2.4 + rnd() * 2.1;
          const x = st.x + st.nx * side * off;
          const z = st.z + st.nz * side * off;
          shrub.push({ x, z, s: 0.6 + rnd() * 0.8, hue: rnd() });
        }
        // stones near the kerb
        if (i % 7 === 0 && rnd() < 0.5) {
          const off = st.edge + 0.5 + rnd() * 1.2;
          const x = st.x + st.nx * side * off;
          const z = st.z + st.nz * side * off;
          stone.push({ x, z, s: 0.25 + rnd() * 0.5, rot: rnd() * 6.28 });
        }
      }
    });
    return { grass, shrub, stone };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    if (grassRef.current) {
      data.grass.forEach((g, i) => {
        dummy.position.set(g.x, terrainHeight(g.x, g.z) + 0.045, g.z);
        dummy.rotation.set(-Math.PI / 2, 0, g.hue * Math.PI * 2);
        dummy.scale.set(g.s * (0.45 + g.hue * 0.25), g.s * (0.14 + g.hue * 0.1), 1);
        dummy.updateMatrix();
        grassRef.current!.setMatrixAt(i, dummy.matrix);
        col.setHSL(0.25 + g.hue * 0.06, 0.28 + g.hue * 0.18, 0.28 + g.hue * 0.13);
        grassRef.current!.setColorAt(i, col);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
      if (grassRef.current.instanceColor) grassRef.current.instanceColor.needsUpdate = true;
    }
    if (shrubRef.current) {
      data.shrub.forEach((g, i) => {
        dummy.position.set(g.x, terrainHeight(g.x, g.z) + g.s * 0.4, g.z);
        dummy.rotation.set(0, g.hue * 6.28, 0);
        dummy.scale.set(g.s, g.s * 0.8, g.s);
        dummy.updateMatrix();
        shrubRef.current!.setMatrixAt(i, dummy.matrix);
        col.setHSL(0.27 + g.hue * 0.06, 0.45, 0.26 + g.hue * 0.1);
        shrubRef.current!.setColorAt(i, col);
      });
      shrubRef.current.instanceMatrix.needsUpdate = true;
      if (shrubRef.current.instanceColor) shrubRef.current.instanceColor.needsUpdate = true;
    }
    if (stoneRef.current) {
      data.stone.forEach((g, i) => {
        dummy.position.set(g.x, terrainHeight(g.x, g.z) + g.s * 0.2, g.z);
        dummy.rotation.set(g.rot * 0.3, g.rot, g.rot * 0.2);
        dummy.scale.set(g.s, g.s * 0.8, g.s);
        dummy.updateMatrix();
        stoneRef.current!.setMatrixAt(i, dummy.matrix);
      });
      stoneRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [data]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (grassShader.current) grassShader.current.uniforms.uTime.value = t;
    if (shrubShader.current) shrubShader.current.uniforms.uTime.value = t;
  });

  return (
    <group>
      <instancedMesh ref={grassRef} args={[undefined, undefined, data.grass.length]} receiveShadow>
        <circleGeometry args={[0.32, 7]} />
        <meshBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={shrubRef} args={[undefined, undefined, data.shrub.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial roughness={0.85} flatShading onBeforeCompile={windCompile(shrubShader, 0.04)} />
      </instancedMesh>

      <instancedMesh ref={stoneRef} args={[undefined, undefined, data.stone.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#6f6a62" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}
