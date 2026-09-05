"use client";

import { MapPin, CalendarDays } from "lucide-react";
import { destinations } from "@/data/experiences";

/**
 * The no-WebGL / reduced-motion presentation: the same journey data as a plain,
 * readable vertical timeline. Also what search engines and screen readers get.
 */
export default function ExperienceTimeline({ note }: { note?: string }) {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-3xl px-5 pb-24 pt-[120px] text-white">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="h-px w-7 bg-gradient-to-r from-[#a78bfa] to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.44em] text-white/35">Career Route</span>
      </div>
      <h1 className="text-4xl font-black leading-none md:text-5xl">Experience</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
        A journey through research, industry, and everything in between.
      </p>
      {note && <p className="mt-2 text-[12px] text-white/35">{note}</p>}

      <ol className="mt-10 space-y-5">
        {destinations.map((d) => (
          <li
            key={d.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            style={{ borderTopColor: d.accent, borderTopWidth: 2 }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: d.accent }}>
              {d.district}
            </p>
            <h2 className="mt-1.5 text-xl font-black">{d.title}</h2>
            <p className="text-sm font-semibold" style={{ color: d.accent }}>
              {d.organization}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/45">
              <span className="flex items-center gap-1.5">
                <MapPin size={11} aria-hidden />
                {d.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={11} aria-hidden />
                {d.date}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">{d.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {d.highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/65"
                >
                  {h}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </main>
  );
}
