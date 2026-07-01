"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
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
import Grass from "./three/Grass";
import AmbientLife from "./three/AmbientLife";
import Streetlights from "./three/Streetlights";
import CameraRig from "./three/CameraRig";
import Rain from "./three/Rain";
import Effects from "./three/Effects";
import AdaptivePerformance from "./three/AdaptivePerformance";
import { useGame } from "@/lib/store";

const QUALITY = {
  low: { dpr: [0.7, 1] as [number, number], shadows: false as const },
  medium: { dpr: [1, 1.15] as [number, number], shadows: "soft" as const },
  high: { dpr: [1, 1.5] as [number, number], shadows: "soft" as const },
  ultra: { dpr: [1.25, 2] as [number, number], shadows: "soft" as const },
};

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
        <Grass />
        <Streetlights />
        <AmbientLife />
        <CameraRig />
        <Rain />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
