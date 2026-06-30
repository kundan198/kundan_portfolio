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
import RoadNetwork from "./three/RoadNetwork";
import Roadside from "./three/Roadside";
import DistrictIdentity from "./three/DistrictIdentity";
import HomeDistrict from "./three/HomeDistrict";
import Scenery from "./three/Scenery";
import AmbientLife from "./three/AmbientLife";
import Streetlights from "./three/Streetlights";
import CameraRig from "./three/CameraRig";
import Rain from "./three/Rain";
import Effects from "./three/Effects";
import AdaptivePerformance from "./three/AdaptivePerformance";
import { useGame } from "@/lib/store";

const QUALITY = {
  low: { dpr: [0.75, 1] as [number, number], shadows: false },
  medium: { dpr: [1, 1.15] as [number, number], shadows: true },
  high: { dpr: [1, 1.5] as [number, number], shadows: true },
  ultra: { dpr: [1.25, 2] as [number, number], shadows: true },
};

export default function World() {
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  const quality = QUALITY[graphicsQuality];
  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 8, 20] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
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
        <RoadNetwork />
        <Roadside />
        <DistrictIdentity />
        <HomeDistrict />
        <Scenery />
        <Streetlights />
        <AmbientLife />
        <CameraRig />
        <Rain />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
