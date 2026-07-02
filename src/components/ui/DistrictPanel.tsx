"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import type { District } from "@/lib/portfolio";

export default function DistrictPanel({ district }: { district: District }) {
  const progress = useGame((s) => s.progress[district.id]);
  const complete = progress?.complete;
  const collected = progress?.orbsCollected ?? 0;

  // On mobile the panel starts collapsed (just a slim header pill) so it never
  // occludes the play area — tap it to read the district content. On desktop the
  // full panel always shows (md:block below).
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [district.id]);

  return (
    <div className="pointer-events-none fixed left-1/2 z-30 -translate-x-1/2 bottom-[calc(11.5rem+env(safe-area-inset-bottom))] w-auto max-w-[92vw] md:bottom-4 md:left-4 md:w-[min(92vw,560px)] md:translate-x-0">
      <div
        className="hud-panel scanlines pointer-events-auto relative overflow-hidden rounded-xl"
        style={{ borderColor: district.color + "88" }}
      >
        {/* header (tap to expand/collapse on mobile) */}
        <button
          onPointerDown={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
          className="flex w-full items-center justify-between gap-3 p-3 text-left md:cursor-default"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-lg">{district.icon}</span>
            <div className="min-w-0">
              <div className="hud-text whitespace-nowrap text-sm font-bold" style={{ color: district.color }}>
                {district.name}
              </div>
              <div className="truncate max-w-[46vw] text-[10px] text-cyan-100/60 md:max-w-none">{district.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {district.orbs > 0 && (
              <div className="text-right text-[11px] text-cyan-100/70">
                {complete ? <span className="text-teal-300">✓ RESTORED</span> : <span>◇ {collected}/{district.orbs}</span>}
              </div>
            )}
            <span className={`text-teal-300/70 transition-transform md:hidden ${expanded ? "rotate-180" : ""}`}>▾</span>
          </div>
        </button>

        {/* content — hidden on mobile until expanded, always shown on desktop */}
        <div className={`${expanded ? "block" : "hidden"} md:block max-h-[34vh] overflow-y-auto px-3 pb-3 md:max-h-[44vh]`}>
          <div className="grid gap-2">
            {district.content.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                <div className="text-xs font-semibold text-white">{c.heading}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-cyan-50/75">{c.body}</div>
              </div>
            ))}
          </div>
          {!complete && district.orbs > 0 && (
            <div className="mt-3 text-[11px] text-teal-200/80">◇ {district.mission}</div>
          )}
        </div>
      </div>
    </div>
  );
}
