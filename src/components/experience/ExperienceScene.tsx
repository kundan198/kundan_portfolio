"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import Road from "./Road";
import City from "./City";
import Car from "./Car";
import CameraRig from "./CameraRig";
import JourneyMarker from "./JourneyMarker";
import { destinations } from "@/data/experiences";
import { frameAt } from "@/lib/journeyPath";
import type { JourneyStore } from "@/hooks/useJourneyProgress";

export type Quality = "low" | "medium" | "high";

/** Soft radial falloff so glow discs have no visible rim. */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Atmosphere lives in its own component so it can touch the scene directly. */
function Atmosphere({ quality }: { quality: Quality }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const previousFog = scene.fog;
    const previousBg = scene.background;
    scene.fog = new THREE.FogExp2("#05070f", quality === "low" ? 0.0034 : 0.0026);
    scene.background = new THREE.Color("#04050c");
    return () => {
      scene.fog = previousFog;
      scene.background = previousBg;
    };
  }, [scene, quality]);
  return null;
}

interface SceneProps {
  store: JourneyStore;
  quality: Quality;
  reducedMotion: boolean;
  compact: boolean;
}

function SceneContents({ store, quality, reducedMotion, compact }: SceneProps) {
  // A cold key light standing in for moonlight, plus a warm bounce so the
  // asphalt never reads as flat black.
  const finaleGlow = useMemo(() => frameAt(0.98).position.clone(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);

  return (
    <>
      <Atmosphere quality={quality} />
      <hemisphereLight args={["#2a3566", "#05060d", 0.65]} />
      <directionalLight position={[80, 120, -60]} intensity={0.5} color="#8fa4ff" />
      <ambientLight intensity={0.16} color="#4b5b96" />

      {/* the brighter horizon the journey drives toward — a soft glow disc plus
          a gentle key light, rather than one blinding point light */}
      <pointLight
        position={[finaleGlow.x, finaleGlow.y + 46, finaleGlow.z - 120]}
        intensity={520}
        distance={520}
        decay={1.9}
        color="#5eead4"
      />
      <mesh position={[finaleGlow.x, finaleGlow.y + 26, finaleGlow.z - 210]}>
        <planeGeometry args={[520, 380]} />
        <meshBasicMaterial
          map={glowTex}
          color="#2dd4bf"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[finaleGlow.x, finaleGlow.y + 16, finaleGlow.z - 205]}>
        <planeGeometry args={[240, 170]} />
        <meshBasicMaterial
          map={glowTex}
          color="#a7f3d0"
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Stars radius={620} depth={120} count={quality === "low" ? 500 : 1300} factor={7} saturation={0} fade speed={0.6} />

      <Road quality={quality} />
      <City quality={quality} />
      {destinations.map((d) => (
        <JourneyMarker key={d.id} destination={d} store={store} reducedMotion={reducedMotion} />
      ))}
      <Car store={store} quality={quality} reducedMotion={reducedMotion} />
      <CameraRig store={store} reducedMotion={reducedMotion} compact={compact} />

      {quality !== "low" && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.42} luminanceThreshold={0.82} luminanceSmoothing={0.28} mipmapBlur radius={0.62} />
          <Vignette eskil={false} offset={0.32} darkness={0.42} />
        </EffectComposer>
      )}
    </>
  );
}

export default function ExperienceScene({ store, quality, reducedMotion, compact }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={quality === "high"}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 52, near: 0.5, far: 2400, position: [30, 26, 60] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <SceneContents store={store} quality={quality} reducedMotion={reducedMotion} compact={compact} />
      </Suspense>
    </Canvas>
  );
}
