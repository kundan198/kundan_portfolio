"use client";

import { useGame } from "@/lib/store";
import type { District } from "@/lib/portfolio";

export default function DistrictPanel({ district }: { district: District }) {
  const progress = useGame((s) => s.progress[district.id]);
  const complete = progress?.complete;
  const collected = progress?.orbsCollected ?? 0;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 w-[min(94vw,560px)] -translate-x-1/2 md:left-4 md:translate-x-0">
      <div
        className="hud-panel scanlines relative max-h-[44vh] overflow-y-auto rounded-xl p-4"
        style={{ borderColor: district.color + "88" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{district.icon}</span>
            <div>
              <div className="hud-text text-sm font-bold" style={{ color: district.color }}>
                {district.name}
              </div>
              <div className="text-[10px] text-cyan-100/60">{district.subtitle}</div>
            </div>
          </div>
          {district.orbs > 0 && (
            <div className="text-right text-[11px] text-cyan-100/70">
              {complete ? (
                <span className="text-teal-300">✓ RESTORED</span>
              ) : (
                <span>
                  ◇ {collected}/{district.orbs}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-2">
          {district.content.map((c, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="text-xs font-semibold text-white">{c.heading}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-cyan-50/75">{c.body}</div>
            </div>
          ))}
        </div>

        {!complete && district.orbs > 0 && (
          <div className="mt-3 text-[11px] text-teal-200/80">
            ◇ {district.mission}
          </div>
        )}
      </div>
    </div>
  );
}
