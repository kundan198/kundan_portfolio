"use client";

import { EffectComposer, Bloom, Vignette, N8AO, SMAA } from "@react-three/postprocessing";
import { useGame } from "@/lib/store";

// Tiered post stack. The renderer already applies ACES tone mapping (set in
// World.tsx), so we do NOT add a ToneMapping effect here (that would double up
// and crush the image to black). N8AO derives normals from depth, so it needs
// no separate normal pass.
export default function Effects() {
  const quality = useGame((s) => s.graphicsQuality);

  if (quality === "low") return null;

  if (quality === "medium") {
    return (
      <EffectComposer multisampling={0}>
        <N8AO halfRes aoRadius={0.9} intensity={1.2} distanceFalloff={1.0} color="#2a2114" />
        <SMAA />
        <Vignette eskil={false} offset={0.36} darkness={0.28} />
      </EffectComposer>
    );
  }

  // high + ultra: contact AO kept tight so the dense grass doesn't self-occlude
  // into mud; bloom on the bright golden highlights.
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        halfRes={quality === "high"}
        aoRadius={1.0}
        intensity={1.5}
        distanceFalloff={1.1}
        color="#241c12"
      />
      <Bloom intensity={0.5} luminanceThreshold={0.92} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
      <SMAA />
      <Vignette eskil={false} offset={0.34} darkness={0.3} />
    </EffectComposer>
  );
}
