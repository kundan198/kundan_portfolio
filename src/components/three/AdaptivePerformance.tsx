"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useGame, type GraphicsQuality } from "@/lib/store";

// FPS safety net: if the frame rate drops for a sustained period, step the existing
// graphicsQuality tier DOWN. Everyone gets Medium by default, and the auto-monitor is
// floored at Medium — it may drop Ultra/High down to Medium but never below it, so the
// world always looks its intended "medium" best. Users can still pick Low manually.
const TIERS: GraphicsQuality[] = ["low", "medium", "high", "ultra"];
const FLOOR = 1; // = "medium"

export default function AdaptivePerformance() {
  return (
    <PerformanceMonitor
      bounds={() => [48, 60]}
      flipflops={3}
      onDecline={() => {
        const cur = TIERS.indexOf(useGame.getState().graphicsQuality);
        if (cur > FLOOR) useGame.getState().setGraphicsQuality(TIERS[cur - 1]);
      }}
      onFallback={() => useGame.getState().setGraphicsQuality("medium")}
    />
  );
}
