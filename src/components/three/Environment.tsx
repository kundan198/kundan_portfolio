"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment as DreiEnvironment, Lightformer } from "@react-three/drei";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";

const skyVert = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Adds a soft golden sun disc + warm gradient band near the horizon so the dome
// itself reads as a real golden-hour sky, not a flat gradient.
const skyFrag = `
varying vec3 vWorldPos;
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 bottom;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float sunStrength;
void main() {
  vec3 dir = normalize(vWorldPos);
  float h = dir.y;
  vec3 col;
  if (h > 0.0) col = mix(horizon, top, pow(h, 0.55));
  else col = mix(horizon, bottom, pow(-h, 0.5));
  // warm halo around the sun + crisp disc
  float sd = max(dot(dir, normalize(sunDir)), 0.0);
  float halo = pow(sd, 6.0) * 0.55 + pow(sd, 64.0) * 0.9;
  float disc = smoothstep(0.9975, 0.9991, sd);
  col += sunColor * (halo * sunStrength);
  col = mix(col, sunColor * 1.4 + 0.25, disc * sunStrength);
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Environment() {
  const { scene } = useThree();
  const quality = useGame((s) => s.graphicsQuality);
  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const stars = useRef<THREE.Points>(null);
  const clouds = useRef<THREE.Group>(null);
  const sunDisc = useRef<THREE.Mesh>(null);
  const sunMat = useRef<THREE.MeshBasicMaterial>(null);
  const shadowSize = quality === "ultra" ? 2048 : quality === "high" ? 2048 : 1024;

  const skyUniforms = useMemo(
    () => ({
      top: { value: new THREE.Color("#3f72b8") },
      horizon: { value: new THREE.Color("#f6c89a") },
      bottom: { value: new THREE.Color("#1b1a22") },
      sunDir: { value: new THREE.Vector3(0, 0.2, -1) },
      sunColor: { value: new THREE.Color("#ffd9a0") },
      sunStrength: { value: 1 },
    }),
    []
  );

  const fog = useMemo(() => new THREE.FogExp2("#e8c89c", 0.0042), []);
  scene.fog = fog;

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 1200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 380;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random());
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // --- golden-hour biased palette -----------------------------------------
  const cDayTop = new THREE.Color("#5b93cf");
  const cDayHorizon = new THREE.Color("#dce8e6"); // pale cool daytime horizon (not sepia)
  const cGoldHorizon = new THREE.Color("#ffb869");
  const cNightTop = new THREE.Color("#060a1c");
  const cNightHorizon = new THREE.Color("#142149");
  const cBottom = new THREE.Color("#15131a");
  const cSunHigh = new THREE.Color("#fff4dc");
  const cSunGold = new THREE.Color("#ffbf78");
  const _a = new THREE.Color();
  const _b = new THREE.Color();
  const _dir = new THREE.Vector3();

  useFrame((state, dt) => {
    const g = useGame.getState();
    // slow day cycle (~10 min) so the world lingers in golden hour
    if (g.phase === "playing") g.setTimeOfDay(g.timeOfDay + dt / 600);
    const tod = g.timeOfDay;

    const az = tod * Math.PI * 2;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    // daylight amount ramps up fast so even a low golden sun lights the world brightly
    const lum = THREE.MathUtils.clamp(elev * 2.7, 0, 1);
    const night = THREE.MathUtils.clamp(-elev * 3, 0, 1);
    // warm golden tint, strongest when the sun sits low above the horizon
    const gold = elev > -0.05 ? THREE.MathUtils.clamp(1.1 - elev * 1.9, 0, 1) : 0;
    const rain = g.weather === "rain" ? 0.55 : 1;

    _dir.set(Math.cos(az), Math.max(elev, -0.05), Math.sin(az)).normalize();
    skyUniforms.sunDir.value.copy(_dir);

    if (sun.current) {
      // lift the key light off the horizon so flat ground still receives warm light
      const sunY = Math.max(26, elev * 95 + 30);
      sun.current.position.set(tracker.hero.x + _dir.x * 95, sunY, tracker.hero.z + _dir.z * 95);
      sun.current.target.position.set(tracker.hero.x, 0, tracker.hero.z);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = (1.8 + lum * 2.1 + gold * 0.9) * rain;
      _a.copy(cSunHigh).lerp(cSunGold, gold * 0.55);
      sun.current.color.copy(_a);
      skyUniforms.sunColor.value.copy(_a);
      skyUniforms.sunStrength.value = THREE.MathUtils.clamp(lum * 0.9 + gold * 0.6, 0, 1) * rain;
    }
    if (fill.current) {
      // cool sky-bounce fill from the opposite side so shadows never crush to black
      fill.current.position.set(tracker.hero.x - _dir.x * 60, 55, tracker.hero.z - _dir.z * 60);
      fill.current.target.position.set(tracker.hero.x, 0, tracker.hero.z);
      fill.current.target.updateMatrixWorld();
      fill.current.intensity = (0.32 + lum * 0.34) * rain;
    }
    if (ambient.current) ambient.current.intensity = (0.62 + lum * 0.42) * rain;
    if (hemi.current) hemi.current.intensity = (0.95 + lum * 0.55) * rain;

    // sky dome colors
    _a.copy(cNightTop).lerp(cDayTop, lum);
    skyUniforms.top.value.copy(_a);
    _b.copy(cNightHorizon).lerp(cDayHorizon, lum).lerp(cGoldHorizon, gold * 0.8);
    skyUniforms.horizon.value.copy(_b);
    skyUniforms.bottom.value.copy(cBottom);

    // light fog matching the horizon, warmed only when the sun is genuinely low
    fog.color.copy(_b).multiplyScalar(0.95 * rain + 0.12).lerp(cGoldHorizon, gold * 0.22);
    fog.density = g.weather === "rain" ? 0.0085 : 0.0023 + night * 0.0016;

    if (stars.current) {
      const mat = stars.current.material as THREE.PointsMaterial;
      mat.opacity = night;
      stars.current.position.set(tracker.hero.x, 0, tracker.hero.z);
    }
    if (sunDisc.current && sunMat.current) {
      sunDisc.current.position.set(tracker.hero.x + _dir.x * 320, _dir.y * 320 + 6, tracker.hero.z + _dir.z * 320);
      sunDisc.current.lookAt(tracker.hero.x, _dir.y * 320, tracker.hero.z);
      sunMat.current.color.copy(skyUniforms.sunColor.value);
      sunMat.current.opacity = THREE.MathUtils.clamp(lum * 1.2 + gold, 0, 0.95);
    }
    if (clouds.current) {
      clouds.current.position.set(tracker.hero.x + Math.sin(state.clock.elapsedTime * 0.012) * 16, 70, tracker.hero.z + Math.cos(state.clock.elapsedTime * 0.01) * 14);
      clouds.current.rotation.y = state.clock.elapsedTime * 0.006;
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.42} color="#eef2ff" />
      <hemisphereLight ref={hemi} args={["#e2efff", "#7e8a52", 0.8]} />
      <directionalLight ref={fill} intensity={0.32} color="#bcd2ff" />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.6}
        color="#ffd9a0"
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* HDR-style image-based lighting built in-engine from Lightformers (no network fetch) */}
      <DreiEnvironment resolution={quality === "low" ? 64 : 256} frames={1} environmentIntensity={0.32}>
        <color attach="background" args={["#222230"]} />
        <Lightformer intensity={1.4} color="#f4f7ff" position={[0, 6, -10]} scale={[16, 10, 1]} />
        <Lightformer intensity={1.3} color="#cfe0ff" position={[0, 10, 8]} scale={[20, 12, 1]} rotation={[Math.PI, 0, 0]} />
        <Lightformer intensity={0.6} color="#90a060" position={[0, -6, 0]} scale={[24, 24, 1]} rotation={[-Math.PI / 2, 0, 0]} />
      </DreiEnvironment>

      {/* visible warm sun disc with soft halo */}
      <mesh ref={sunDisc}>
        <circleGeometry args={[16, 40]} />
        <meshBasicMaterial ref={sunMat} color="#ffe1b0" transparent opacity={0.85} fog={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group ref={clouds}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = -90 + i * 15;
          const z = Math.sin(i * 1.7) * 46;
          return (
            <mesh key={i} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, i * 0.31]}>
              <circleGeometry args={[12 + (i % 4) * 5, 24]} />
              <meshBasicMaterial color="#fbeede" transparent opacity={0.1} depthWrite={false} fog={false} />
            </mesh>
          );
        })}
      </group>

      {/* sky dome */}
      <mesh>
        <sphereGeometry args={[450, 32, 16]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={skyUniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>

      {/* stars */}
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial color="#ffffff" size={1.5} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} />
      </points>
    </>
  );
}
