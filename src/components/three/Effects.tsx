"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGame } from "@/lib/store";

export default function Effects() {
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  if (graphicsQuality === "low") return null;
  if (graphicsQuality === "medium") {
    return (
      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.36} darkness={0.32} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.22}
        luminanceThreshold={1.15}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.36} darkness={0.32} />
    </EffectComposer>
  );
}
