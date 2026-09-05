"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ExperienceScene, { type Quality } from "@/components/experience/ExperienceScene";
import ExperienceOverlay from "@/components/experience/ExperienceOverlay";
import ExperienceTimeline from "@/components/experience/ExperienceTimeline";
import LoadingScreen from "@/components/experience/LoadingScreen";
import SceneBoundary from "@/components/experience/SceneBoundary";
import { useJourneyStore } from "@/hooks/useJourneyProgress";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { clamp01 } from "@/lib/journeyPath";

/** Scroll length of the journey. Long enough for cinematic pacing. */
const SECTION_VH = 620;

type Support = "checking" | "ok" | "unsupported";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

function detectQuality(): Quality {
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (width < 780 || cores <= 4 || memory <= 4) return "low";
  if (width < 1400 || cores <= 8) return "medium";
  return "high";
}

export default function ExperiencePage() {
  const sectionRef = useRef<HTMLElement>(null);
  const store = useJourneyStore();

  const [support, setSupport] = useState<Support>("checking");
  const [quality, setQuality] = useState<Quality>("medium");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compact, setCompact] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    setSupport(detectWebGL() ? "ok" : "unsupported");
    setQuality(detectQuality());
    setCompact(window.innerWidth < 780);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => setReducedMotion(motionQuery.matches);
    applyMotion();
    motionQuery.addEventListener("change", applyMotion);

    // Quality is re-evaluated on rotation / window resize, but only when the
    // tier actually changes so the scene is not rebuilt on every resize event.
    let resizeTimer: number;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setCompact(window.innerWidth < 780);
        setQuality((q) => {
          const next = detectQuality();
          return next === q ? q : next;
        });
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      motionQuery.removeEventListener("change", applyMotion);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  // The scene has no external assets to stream, so the loader tracks the first
  // painted frames instead of pretending to download something.
  useEffect(() => {
    if (support !== "ok") return;
    let frame = 0;
    let raf = 0;
    const step = () => {
      frame += 1;
      setProgress(Math.min(100, 8 + frame * 6));
      if (frame >= 16) {
        setReady(true);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [support]);

  useSmoothScroll(sectionRef, store, support === "ok");

  const seek = useCallback((target: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.offsetTop;
    const scrollable = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + clamp01(target) * Math.max(scrollable, 1),
      behavior: "smooth",
    });
  }, []);

  if (support === "unsupported") {
    return (
      <ExperienceTimeline note="Your browser does not support WebGL, so here is the journey as a timeline." />
    );
  }

  return (
    <>
      <LoadingScreen progress={progress} visible={support === "checking" || !ready} />
      <section
        ref={sectionRef}
        aria-label="Experience journey"
        className="relative w-full"
        style={{ height: `${SECTION_VH}vh` }}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#04050c]">
          {support === "ok" && (
            <SceneBoundary
              fallback={
                <div className="absolute inset-0 overflow-y-auto">
                  <ExperienceTimeline note="The 3D journey could not start on this device — here it is as a timeline." />
                </div>
              }
            >
              <ExperienceScene store={store} quality={quality} reducedMotion={reducedMotion} compact={compact} />
              <ExperienceOverlay store={store} onSeek={seek} reducedMotion={reducedMotion} />
            </SceneBoundary>
          )}
        </div>
      </section>
    </>
  );
}
