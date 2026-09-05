"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { clamp01 } from "@/lib/journeyPath";
import type { JourneyStore } from "./useJourneyProgress";

let registered = false;

/**
 * Binds the tall journey section to a single ScrollTrigger and writes raw
 * progress into the shared store. Damping happens in the store's own rAF loop,
 * so the value the scene reads is always smoothed — scrollbar drags and
 * mouse-wheel flicks included.
 */
export function useSmoothScroll(
  sectionRef: RefObject<HTMLElement | null>,
  store: JourneyStore,
  enabled = true,
) {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !enabled) return;

    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        // A refresh can fire before layout settles; clamping keeps the car on
        // the road if that happens.
        onUpdate: (self) => store.setTarget(clamp01(self.progress)),
        onRefresh: (self) => store.setTarget(clamp01(self.progress)),
      });
    }, el);

    // Reloading halfway down the page restores scroll *after* mount.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      ctx.revert();
    };
  }, [sectionRef, store, enabled]);
}
