"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import Environment from "./three/Environment";
import Terrain from "./three/Terrain";
import Hero from "./three/Hero";
import Vehicle from "./three/Vehicle";
import Props from "./three/Props";
import Districts from "./three/Districts";
import CitySkyline from "./three/CitySkyline";
import RoadNetwork from "./three/RoadNetwork";
import Roadside from "./three/Roadside";
import DistrictIdentity from "./three/DistrictIdentity";
import HomeDistrict from "./three/HomeDistrict";
import Scenery from "./three/Scenery";
// import Grass from "./three/Grass"; // grass disabled for now
import AmbientLife from "./three/AmbientLife";
import Streetlights from "./three/Streetlights";
import CameraRig from "./three/CameraRig";
import Rain from "./three/Rain";
import Effects from "./three/Effects";
import AdaptivePerformance from "./three/AdaptivePerformance";
import { useGame } from "@/lib/store";

const QUALITY = {
  // dpr (pixel count) and shadows are the heaviest levers — kept lean per tier
  low: { dpr: [0.55, 0.8] as [number, number], shadows: false as const },
  medium: { dpr: [0.85, 1.05] as [number, number], shadows: "soft" as const },
  high: { dpr: [1, 1.3] as [number, number], shadows: "soft" as const },
  ultra: { dpr: [1, 1.6] as [number, number], shadows: "soft" as const },
};

// Widen the field of view on narrow / portrait phones so more of the world fits.
function AdaptiveFov() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = aspect < 0.7 ? 74 : aspect < 1 ? 66 : 58;
    cam.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

export default function World() {
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  const quality = QUALITY[graphicsQuality];
  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{
        antialias: false, // SMAA in the post stack handles edges cheaper than MSAA
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.7,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 58, near: 0.1, far: 1200, position: [0, 8, 20] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.7;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <AdaptiveFov />
        <AdaptivePerformance />
        <Environment />
        <Physics gravity={[0, -22, 0]} timeStep="vary">
          <Terrain />
          <Hero />
          <Vehicle />
          <Props />
        </Physics>
        <Districts />
        <CitySkyline />
        <RoadNetwork />
        <Roadside />
        <DistrictIdentity />
        <HomeDistrict />
        <Scenery />
        {/* <Grass /> */}
        <Streetlights />
        <AmbientLife />
        <CameraRig />
        <Rain />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
