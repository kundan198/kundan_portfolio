import { create } from "zustand";
import { districts } from "./portfolio";

export type Phase = "landing" | "intro" | "playing" | "finale";
export type Vehicle = "none" | "car";
export type GraphicsQuality = "low" | "medium" | "high" | "ultra";

type DistrictProgress = {
  orbsCollected: number;
  complete: boolean;
};

type GameState = {
  phase: Phase;
  setPhase: (p: Phase) => void;

  // world evolution: 0 (grey/dead) -> 1 (fully alive)
  vitality: number;

  // per-district progress
  progress: Record<string, DistrictProgress>;
  collectOrb: (districtId: string) => void;
  completedCount: () => number;

  // active district panel (proximity)
  activeDistrict: string | null;
  setActiveDistrict: (id: string | null) => void;

  // control / hero
  onFoot: boolean; // true = walking, false = driving
  toggleVehicle: () => void;
  nearVehicle: boolean;
  setNearVehicle: (b: boolean) => void;

  // environment
  timeOfDay: number; // 0..1 (0 = midnight, 0.5 = noon)
  setTimeOfDay: (t: number) => void;
  weather: "clear" | "rain";
  setWeather: (w: "clear" | "rain") => void;

  // hero transform (for minimap/compass HUD)
  heroPos: [number, number, number];
  heroHeading: number;
  setHero: (pos: [number, number, number], heading: number) => void;

  // toasts / notifications
  toast: string | null;
  pushToast: (msg: string) => void;

  // audio
  muted: boolean;
  toggleMuted: () => void;

  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (q: GraphicsQuality) => void;

  reset: () => void;
};

const initialProgress = (): Record<string, DistrictProgress> =>
  Object.fromEntries(
    districts.map((d) => [d.id, { orbsCollected: 0, complete: d.orbs === 0 }])
  );

const computeVitality = (progress: Record<string, DistrictProgress>) => {
  const missionable = districts.filter((d) => d.orbs > 0);
  if (missionable.length === 0) return 1;
  const done = missionable.filter((d) => progress[d.id]?.complete).length;
  return done / missionable.length;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useGame = create<GameState>((set, get) => ({
  phase: "landing",
  setPhase: (p) => set({ phase: p }),

  vitality: 0,

  progress: initialProgress(),
  collectOrb: (districtId) => {
    const d = districts.find((x) => x.id === districtId);
    if (!d) return;
    const prev = get().progress[districtId] ?? { orbsCollected: 0, complete: false };
    if (prev.complete) return;
    const orbsCollected = Math.min(d.orbs, prev.orbsCollected + 1);
    const complete = orbsCollected >= d.orbs;
    const progress = { ...get().progress, [districtId]: { orbsCollected, complete } };
    const vitality = computeVitality(progress);
    set({ progress, vitality });
    if (complete) {
      get().pushToast(`${d.name} ONLINE — district restored ✦`);
      // all done?
      const allDone = districts.filter((x) => x.orbs > 0).every((x) => progress[x.id]?.complete);
      if (allDone) setTimeout(() => set({ phase: "finale" }), 1800);
    } else {
      get().pushToast(`Orb collected — ${orbsCollected}/${d.orbs}`);
    }
  },
  completedCount: () =>
    districts.filter((d) => d.orbs > 0 && get().progress[d.id]?.complete).length,

  activeDistrict: null,
  setActiveDistrict: (id) => set({ activeDistrict: id }),

  onFoot: true,
  toggleVehicle: () => {
    const { onFoot, nearVehicle } = get();
    if (onFoot && !nearVehicle) return;
    set({ onFoot: !onFoot });
    get().pushToast(onFoot ? "Entered vehicle — drive with WASD" : "On foot");
  },
  nearVehicle: false,
  setNearVehicle: (b) => set({ nearVehicle: b }),

  timeOfDay: 0.32,
  setTimeOfDay: (t) => set({ timeOfDay: ((t % 1) + 1) % 1 }),
  weather: "clear",
  setWeather: (w) => set({ weather: w }),

  heroPos: [-46, 1, -75],
  heroHeading: 0.68,
  setHero: (pos, heading) => set({ heroPos: pos, heroHeading: heading }),

  toast: null,
  pushToast: (msg) => {
    set({ toast: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 3200);
  },

  muted: false,
  toggleMuted: () => set({ muted: !get().muted }),
  graphicsQuality: "medium",
  setGraphicsQuality: (q) => set({ graphicsQuality: q }),

  reset: () =>
    set({
      phase: "landing",
      vitality: 0,
      progress: initialProgress(),
      activeDistrict: null,
      onFoot: true,
      nearVehicle: false,
      timeOfDay: 0.32,
      weather: "clear",
      heroPos: [-46, 1, -75],
      heroHeading: 0.68,
    }),
}));
