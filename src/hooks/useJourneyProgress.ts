"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clamp01 } from "@/lib/journeyPath";
import { destinationAt, upcomingDestination } from "@/data/experiences";

/**
 * Shared journey state. Progress is damped in one rAF loop and read
 * imperatively by the 3D scene, so scrolling never triggers a React render;
 * only the derived, low-frequency values (active card, rounded percent) do.
 */
export interface JourneyStore {
  /** Raw scroll progress, 0–1. */
  target: number;
  /** Damped progress the scene actually uses. */
  current: number;
  /** Progress units per second — drives the speed-dependent visuals. */
  speed: number;
  setTarget: (v: number) => void;
  start: () => () => void;
  subscribe: (fn: (active: number, percent: number) => void) => () => void;
}

export function createJourneyStore(damping = 4.2): JourneyStore {
  const listeners = new Set<(active: number, percent: number) => void>();
  let raf = 0;
  let last = 0;
  let running = 0;
  let lastActive = -2;
  let lastPercent = -1;

  const store: JourneyStore = {
    target: 0,
    current: 0,
    speed: 0,
    setTarget(v) {
      store.target = clamp01(Number.isFinite(v) ? v : 0);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start() {
      running += 1;
      if (running > 1) return () => stop();

      const tick = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
        last = now;
        const prev = store.current;
        // Frame-rate independent damping: identical motion at 60 and 144Hz.
        const k = 1 - Math.exp(-damping * dt);
        store.current = clamp01(prev + (store.target - prev) * k);
        store.speed = dt > 0 ? Math.abs(store.current - prev) / dt : 0;

        const active = destinationAt(store.current);
        const percent = Math.round(store.current * 100);
        if (active !== lastActive || percent !== lastPercent) {
          lastActive = active;
          lastPercent = percent;
          listeners.forEach((fn) => fn(active, percent));
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => stop();
    },
  };

  function stop() {
    running = Math.max(0, running - 1);
    if (running === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  }

  return store;
}

/** Creates the store, runs its loop for the lifetime of the component. */
export function useJourneyStore(damping?: number): JourneyStore {
  const store = useMemo(() => createJourneyStore(damping), [damping]);
  useEffect(() => store.start(), [store]);
  return store;
}

/** Re-renders only when the active card or whole-percent progress changes. */
export function useJourneyReadout(store: JourneyStore) {
  const [state, setState] = useState({ active: -1, percent: 0 });
  const ref = useRef(state);
  useEffect(
    () =>
      store.subscribe((active, percent) => {
        if (ref.current.active === active && ref.current.percent === percent) return;
        ref.current = { active, percent };
        setState(ref.current);
      }),
    [store],
  );
  return { ...state, upcoming: upcomingDestination(state.percent / 100) };
}
