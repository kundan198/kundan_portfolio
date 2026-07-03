"use client";

import { EffectComposer, Bloom, Vignette, N8AO, SMAA, HueSaturation, BrightnessContrast } from "@react-three/postprocessing";
import { useGame } from "@/lib/store";

// Tiered post stack. The renderer already applies ACES tone mapping (set in
// World.tsx), so we do NOT add a ToneMapping effect here. A light colour grade
// (saturation + contrast) is applied on every tier — it's a cheap full-screen
// pass and gives the whole world a richer, more premium look.
export default function Effects() {
  const quality = useGame((s) => s.graphicsQuality);

  if (quality === "low") return null;

  // Medium (default): skip the expensive SSAO pass — cheap AA + grade + vignette.
  if (quality === "medium") {
    return (
      <EffectComposer multisampling={0}>
        <HueSaturation hue={0} saturation={0.06} />
        <BrightnessContrast brightness={0.015} contrast={0.07} />
        <SMAA />
        <Vignette eskil={false} offset={0.35} darkness={0.3} />
      </EffectComposer>
    );
  }

  // high + ultra: half-res SSAO (contact AO) + bloom + richer grade.
  return (
    <EffectComposer multisampling={0}>
      <N8AO halfRes aoRadius={1.0} intensity={1.4} distanceFalloff={1.1} color="#241c12" />
      <Bloom intensity={0.62} luminanceThreshold={0.88} luminanceSmoothing={0.32} mipmapBlur radius={0.72} />
      <HueSaturation hue={0} saturation={0.1} />
      <BrightnessContrast brightness={0.02} contrast={0.09} />
      <SMAA />
      <Vignette eskil={false} offset={0.33} darkness={0.32} />
    </EffectComposer>
  );
}
