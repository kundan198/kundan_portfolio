"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useGame, type GraphicsQuality } from "@/lib/store";

// FPS safety net: if the frame rate drops for a sustained period, step the existing
// graphicsQuality tier DOWN (which cascades to DPR, shadows, post-FX and streaming
// radii). It never auto-raises — the manual quality selector stays the ceiling, so
// this only ever rescues a struggling machine, never fights the user's choice.
const TIERS: GraphicsQuality[] = ["low", "medium", "high", "ultra"];

export default function AdaptivePerformance() {
  return (
    <PerformanceMonitor
      bounds={() => [48, 60]}
      flipflops={3}
      onDecline={() => {
        const cur = TIERS.indexOf(useGame.getState().graphicsQuality);
        if (cur > 0) useGame.getState().setGraphicsQuality(TIERS[cur - 1]);
      }}
      onFallback={() => useGame.getState().setGraphicsQuality("low")}
    />
  );
}
