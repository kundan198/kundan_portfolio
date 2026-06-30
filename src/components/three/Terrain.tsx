"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { noise2, roadFlatten, terrainHeight, WORLD_SIZE } from "@/lib/noise";

const SEG = 150;

export default function Terrain() {
  const terrainTexture = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size * 3);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 3;
        const nx = x / size;
        const ny = y / size;
        const grain =
          Math.sin(nx * 84.0 + Math.sin(ny * 17.0) * 2.1) * 0.5 +
          Math.sin(ny * 71.0 + nx * 19.0) * 0.32 +
          Math.sin((nx + ny) * 145.0) * 0.18;
        const soft = 0.5 + grain * 0.5;
        const fiber = Math.max(0, Math.sin(nx * 210.0 + ny * 36.0)) * 0.18;
        const dot =
          Math.sin(nx * 620.0 + Math.sin(ny * 71.0) * 3.0) *
          Math.sin(ny * 540.0 + Math.cos(nx * 63.0) * 2.4);
        const grassDot = dot > 0.74 ? 1 : 0;
        const soilDot = dot < -0.82 ? 1 : 0;
        data[i] = 138 + soft * 24 + fiber * 8 - grassDot * 30 - soilDot * 18;
        data[i + 1] = 198 + soft * 38 + fiber * 16 + grassDot * 18 - soilDot * 12;
        data[i + 2] = 104 + soft * 16 - grassDot * 24 - soilDot * 16;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(28, 28);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    const cLow = new THREE.Color("#8fbf5f");
    const cGrass = new THREE.Color("#7fbd55");
    const cMoss = new THREE.Color("#5f9844");
    const cDirt = new THREE.Color("#7c7045");
    const cRock = new THREE.Color("#747a66");
    const cSnow = new THREE.Color("#dbe3e8");
    const cRoadShoulder = new THREE.Color("#62563e");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      const c = new THREE.Color();
      const broad = noise2(x * 0.035 + 11, z * 0.035 - 4);
      const fine = noise2(x * 0.16 - 8, z * 0.16 + 19);
      const micro = noise2(x * 0.42 + 5, z * 0.42 - 9);
      const slope = Math.abs(terrainHeight(x + 1.2, z) - terrainHeight(x - 1.2, z)) + Math.abs(terrainHeight(x, z + 1.2) - terrainHeight(x, z - 1.2));

      const lowToGrass = THREE.MathUtils.smoothstep(h, -0.4, 2.6);
      const mossMask = THREE.MathUtils.clamp(0.1 + Math.max(0, broad) * 0.22 + (1 - lowToGrass) * 0.08, 0, 0.32);
      const dirtMask = THREE.MathUtils.clamp(Math.max(0, fine - 0.16) * 0.08 + Math.max(0, micro - 0.32) * 0.04, 0, 0.14);
      const rockMask = THREE.MathUtils.smoothstep(h + slope * 3.2, 14.0, 25.0);
      const snowMask = THREE.MathUtils.smoothstep(h + broad * 2.2, 18.0, 31.0);
      const roadMask = THREE.MathUtils.smoothstep(roadFlatten(x, z), 0.025, 0.18);

      c.copy(cLow)
        .lerp(cGrass, lowToGrass)
        .lerp(cMoss, mossMask)
        .lerp(cDirt, dirtMask)
        .lerp(cRock, Math.min(0.48, rockMask * 0.58 + slope * 0.055))
        .lerp(cSnow, snowMask)
        .lerp(cRoadShoulder, roadMask * 0.82);

      c.offsetHSL(broad * 0.018 + fine * 0.01, 0.01, fine * 0.025 + micro * 0.012);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <RigidBody type="fixed" colliders="trimesh" friction={1}>
        <mesh geometry={geometry} receiveShadow>
          <meshStandardMaterial vertexColors map={terrainTexture} roughness={0.96} metalness={0} />
        </mesh>
      </RigidBody>

      <mesh position={[78, -0.08, -72]} rotation={[-Math.PI / 2, 0, -0.38]} receiveShadow>
        <circleGeometry args={[42, 96]} />
        <meshStandardMaterial color="#0b6f8f" emissive="#075985" emissiveIntensity={0.16} roughness={0.22} metalness={0.04} transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {[
        [-34, -34, 15],
        [-20, -24, 14],
        [-8, -14, 13],
        [2, -2, 12],
        [8, 14, 10],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -0.06, z]} rotation={[-Math.PI / 2, 0, i * 0.28]} receiveShadow>
          <circleGeometry args={[r, 48]} />
          <meshStandardMaterial color="#0e7490" emissive="#0c4a6e" emissiveIntensity={0.08} roughness={0.28} metalness={0.02} transparent opacity={0.26} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
