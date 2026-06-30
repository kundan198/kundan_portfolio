"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";

const skyVert = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const skyFrag = `
varying vec3 vWorldPos;
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 bottom;
void main() {
  float h = normalize(vWorldPos).y;
  vec3 col;
  if (h > 0.0) col = mix(horizon, top, pow(h, 0.55));
  else col = mix(horizon, bottom, pow(-h, 0.5));
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Environment() {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const stars = useRef<THREE.Points>(null);
  const clouds = useRef<THREE.Group>(null);

  const skyUniforms = useMemo(
    () => ({
      top: { value: new THREE.Color("#0a1a3a") },
      horizon: { value: new THREE.Color("#24385e") },
      bottom: { value: new THREE.Color("#05060c") },
    }),
    []
  );

  const fog = useMemo(() => new THREE.FogExp2("#b7c7cf", 0.0062), []);
  scene.fog = fog;

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 1200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 380;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random()); // upper hemisphere bias
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const cDayTop = new THREE.Color("#6ea7d3");
  const cDayHorizon = new THREE.Color("#dbe7ec");
  const cDuskHorizon = new THREE.Color("#f2a66c");
  const cNightTop = new THREE.Color("#04060f");
  const cNightHorizon = new THREE.Color("#0c1430");
  const cBottom = new THREE.Color("#05060c");
  const cSunDay = new THREE.Color("#fff4e0");
  const cSunDusk = new THREE.Color("#ff8a4c");
  const _a = new THREE.Color();
  const _b = new THREE.Color();

  useFrame((state, dt) => {
    const g = useGame.getState();
    // advance time slowly (full day ~ 5 min); rain darkens
    if (g.phase === "playing") g.setTimeOfDay(g.timeOfDay + dt / 300);
    const tod = g.timeOfDay;

    const az = tod * Math.PI * 2;
    const elev = Math.sin(tod * Math.PI * 2 - Math.PI / 2);
    const day = THREE.MathUtils.clamp(elev, 0, 1);
    const dusk = THREE.MathUtils.clamp(1 - Math.abs(elev) * 3, 0, 1); // near horizon
    const rain = g.weather === "rain" ? 0.45 : 1;

    const dir = new THREE.Vector3(Math.cos(az), elev, Math.sin(az)).normalize();

    if (sun.current) {
      sun.current.position.set(
        tracker.hero.x + dir.x * 80,
        Math.max(4, dir.y * 90),
        tracker.hero.z + dir.z * 80
      );
      sun.current.target.position.set(tracker.hero.x, 0, tracker.hero.z);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = (1.05 + day * 1.9 + dusk * 0.45) * rain;
      _a.copy(cSunDay).lerp(cSunDusk, dusk);
      sun.current.color.copy(_a);
    }
    if (ambient.current) ambient.current.intensity = (0.22 + day * 0.28) * rain;
    if (hemi.current) hemi.current.intensity = (0.5 + day * 0.34) * rain;

    // sky colors
    _a.copy(cNightTop).lerp(cDayTop, day);
    skyUniforms.top.value.copy(_a);
    _b.copy(cNightHorizon).lerp(cDayHorizon, day).lerp(cDuskHorizon, dusk * 0.8);
    skyUniforms.horizon.value.copy(_b);
    skyUniforms.bottom.value.copy(cBottom);

    // fog matches horizon
    fog.color.copy(_b).multiplyScalar(0.9 * rain + 0.12);
    fog.density = g.weather === "rain" ? 0.012 : 0.0062 + dusk * 0.0015;

    // stars fade in at night
    if (stars.current) {
      const mat = stars.current.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.clamp(1 - day * 2.2, 0, 1);
      stars.current.position.set(tracker.hero.x, 0, tracker.hero.z);
    }
    if (clouds.current) {
      clouds.current.position.set(tracker.hero.x + Math.sin(state.clock.elapsedTime * 0.012) * 16, 64, tracker.hero.z + Math.cos(state.clock.elapsedTime * 0.01) * 14);
      clouds.current.rotation.y = state.clock.elapsedTime * 0.006;
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.34} />
      <hemisphereLight ref={hemi} args={["#dbeafe", "#5d533d", 0.64]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-72}
        shadow-camera-right={72}
        shadow-camera-top={72}
        shadow-camera-bottom={-72}
        shadow-bias={-0.0004}
      />
      <mesh position={[0, 72, -110]} rotation={[0, 0, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial color="#fff0c6" transparent opacity={0.62} fog={false} />
      </mesh>
      <group ref={clouds}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = -90 + i * 15;
          const z = Math.sin(i * 1.7) * 46;
          return (
            <mesh key={i} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, i * 0.31]}>
              <circleGeometry args={[12 + (i % 4) * 5, 24]} />
              <meshBasicMaterial color="#e8eef2" transparent opacity={0.12} depthWrite={false} fog={false} />
            </mesh>
          );
        })}
      </group>
      {/* sky dome */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[450, 32, 16]} />
        <shaderMaterial
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* stars */}
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial color="#ffffff" size={1.5} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} />
      </points>
    </>
  );
}
