"use client";

import { useGame } from "@/lib/store";
import { districts } from "@/lib/portfolio";
import { fireInteract } from "@/lib/input";
import DistrictPanel from "./DistrictPanel";
import TouchControls from "./TouchControls";
import { roadBranches, smoothRingRoad, smoothRoadPath } from "@/lib/roads";

const MAP_R = 130;
const toPct = (v: number) => ((v + MAP_R) / (MAP_R * 2)) * 100;
const mapPath = (points: [number, number][]) =>
  points.map(([x, z], i) => `${i === 0 ? "M" : "L"} ${toPct(x)} ${toPct(z)}`).join(" ");

export default function HUD() {
  const vitality = useGame((s) => s.vitality);
  const progress = useGame((s) => s.progress);
  const activeDistrict = useGame((s) => s.activeDistrict);
  const heroPos = useGame((s) => s.heroPos);
  const heroHeading = useGame((s) => s.heroHeading);
  const onFoot = useGame((s) => s.onFoot);
  const nearVehicle = useGame((s) => s.nearVehicle);
  const toast = useGame((s) => s.toast);
  const muted = useGame((s) => s.muted);
  const weather = useGame((s) => s.weather);
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  const toggleMuted = useGame((s) => s.toggleMuted);
  const setWeather = useGame((s) => s.setWeather);
  const setGraphicsQuality = useGame((s) => s.setGraphicsQuality);

  const missionable = districts.filter((d) => d.orbs > 0);
  const done = missionable.filter((d) => progress[d.id]?.complete).length;
  const active = districts.find((d) => d.id === activeDistrict);

  return (
    <>
      {/* top-left: mission tracker */}
      <div className="pointer-events-none fixed left-4 top-4 z-40 w-72">
        <div className="hud-panel rounded-lg p-3">
          <div className="hud-text text-[10px] text-teal-300/80">WORLD RESTORATION</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all duration-700"
              style={{ width: `${Math.round(vitality * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-cyan-100/60">
            <span>{done}/{missionable.length} districts online</span>
            <span>{Math.round(vitality * 100)}%</span>
          </div>

          <div className="mt-3 hud-text text-[10px] text-teal-300/80">OBJECTIVE</div>
          <div className="mt-1 text-xs text-cyan-50/90">
            {active
              ? progress[active.id]?.complete
                ? `✓ ${active.name} restored`
                : active.mission
              : "Explore — approach a glowing district to begin a mission."}
          </div>
        </div>
      </div>

      {/* top-right: controls */}
      <div className="fixed right-4 top-4 z-40 flex gap-2">
        <button onClick={toggleMuted} className="hud-panel rounded-lg px-3 py-2 text-xs text-teal-200 hover:text-white">
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={() => setWeather(weather === "rain" ? "clear" : "rain")}
          className="hud-panel rounded-lg px-3 py-2 text-xs text-teal-200 hover:text-white"
          title="Toggle weather"
        >
          {weather === "rain" ? "🌧" : "☀"}
        </button>
        <select
          value={graphicsQuality}
          onChange={(e) => setGraphicsQuality(e.target.value as typeof graphicsQuality)}
          className="hud-panel rounded-lg bg-slate-950/80 px-2 py-2 text-xs uppercase tracking-wider text-teal-200 outline-none hover:text-white"
          title="Graphics quality"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>

      {/* bottom-right: minimap + compass */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40">
        <div className="hud-panel relative h-40 w-40 overflow-hidden rounded-lg">
          <div className="hud-text absolute left-2 top-1 text-[9px] text-teal-300/60">MAP</div>
          <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={mapPath(smoothRingRoad)} fill="none" stroke="#5eead4" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
            {roadBranches.map((branch) => (
              <path
                key={branch.to}
                d={mapPath(smoothRoadPath(branch.points, false, 8))}
                fill="none"
                stroke="#8bd8ff"
                strokeWidth="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
              />
            ))}
            {districts.map((d) => (
              <path
                key={`route-${d.id}`}
                d={mapPath([[26, 7], d.position])}
                fill="none"
                stroke={d.color}
                strokeWidth="0.3"
                strokeLinecap="round"
                strokeDasharray="1 1.5"
                opacity="0.55"
              />
            ))}
          </svg>
          {districts.map((d) => (
            <div
              key={d.id}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${toPct(d.position[0])}%`,
                top: `${toPct(d.position[1])}%`,
                background: progress[d.id]?.complete ? d.color : "#556",
                boxShadow: progress[d.id]?.complete ? `0 0 8px ${d.color}` : "none",
              }}
            />
          ))}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${toPct(heroPos[0])}%`, top: `${toPct(heroPos[2])}%` }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: `10px solid ${onFoot ? "#5eead4" : "#fca5a5"}`,
                transform: `rotate(${heroHeading}rad)`,
                filter: "drop-shadow(0 0 4px #5eead4)",
              }}
            />
          </div>
        </div>
      </div>

      {/* bottom-center: enter vehicle prompt */}
      {nearVehicle && onFoot && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-40 -translate-x-1/2">
          <div className="hud-panel animate-pulse rounded-full px-5 py-2 text-sm text-teal-200">
            Press <b className="text-white">E</b> to drive
          </div>
        </div>
      )}
      {!onFoot && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-40 -translate-x-1/2">
          <div className="hud-panel rounded-full px-5 py-2 text-sm text-teal-200">
            Press <b className="text-white">E</b> to exit vehicle
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-20 z-40 -translate-x-1/2">
          <div className="hud-panel fade-in rounded-full px-5 py-2 text-sm text-teal-100">{toast}</div>
        </div>
      )}

      {/* district content panel */}
      {active && <DistrictPanel district={active} />}

      {/* mobile controls */}
      <TouchControls onInteract={() => fireInteract()} />
    </>
  );
}
