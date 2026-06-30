"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { finale, profile } from "@/lib/portfolio";
import { audio } from "@/lib/audio";

export default function Finale() {
  const reset = useGame((s) => s.reset);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    audio.finale();
    const timers = finale.lines.map((_, i) => setTimeout(() => setShown(i + 1), 900 + i * 1100));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="scanlines fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#03040a]/92 px-6 text-center backdrop-blur-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(1000px 700px at 50% 110%, rgba(45,212,191,0.22), transparent 60%), radial-gradient(800px 500px at 50% -10%, rgba(168,139,250,0.18), transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-2xl">
        <div className="hud-text text-xs tracking-[0.5em] text-teal-300/70">SYSTEM COMPLETE</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
          {finale.title}
        </h1>

        <div className="mt-8 space-y-2">
          {finale.lines.map((l, i) => (
            <p
              key={i}
              className={`text-base text-cyan-50/90 transition-all duration-700 md:text-lg ${
                i < shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {l}
            </p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {finale.actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target={a.kind === "link" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="hud-panel rounded-xl px-6 py-3 text-sm font-semibold text-teal-200 transition hover:scale-105 hover:text-white"
            >
              {a.label} →
            </a>
          ))}
        </div>

        <div className="mt-8 text-xs text-cyan-100/50">
          {profile.email} · {profile.location}
        </div>

        <button
          onClick={reset}
          className="mt-8 text-[11px] text-cyan-100/40 underline underline-offset-4 hover:text-cyan-100/80"
        >
          ⟲ explore the world again
        </button>
      </div>
    </div>
  );
}
