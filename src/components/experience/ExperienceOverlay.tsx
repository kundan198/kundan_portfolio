"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MapPin, CalendarDays, ChevronRight } from "lucide-react";
import { destinations } from "@/data/experiences";
import type { JourneyStore } from "@/hooks/useJourneyProgress";
import { useJourneyReadout } from "@/hooks/useJourneyProgress";

interface OverlayProps {
  store: JourneyStore;
  onSeek: (progress: number) => void;
  reducedMotion: boolean;
}

export default function ExperienceOverlay({ store, onSeek, reducedMotion }: OverlayProps) {
  const { active, percent } = useJourneyReadout(store);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Cards fade and lift in/out as the car enters and leaves each district.
  // These are repeating state tweens, so they are killed on unmount rather than
  // wrapped in a gsap.context — reverting a context would restore the element's
  // pre-tween styles and flash every hidden card back on.
  useEffect(() => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const isActive = i === active;
      gsap.to(el, {
        autoAlpha: isActive ? 1 : 0,
        y: isActive ? 0 : 26,
        duration: reducedMotion ? 0.001 : 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [active, reducedMotion]);

  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;
    gsap.to(el, {
      autoAlpha: percent > 3 ? 0 : 1,
      duration: reducedMotion ? 0.001 : 0.4,
      overwrite: "auto",
    });
  }, [percent, reducedMotion]);

  useEffect(() => {
    const cards = cardRefs.current;
    const hint = hintRef.current;
    return () => {
      cards.forEach((el) => el && gsap.killTweensOf(el));
      if (hint) gsap.killTweensOf(hint);
    };
  }, []);

  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${percent}%`;
  }, [percent]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Scrims: keep the copy readable over a bright skyline without dimming
          the whole scene. */}
      <div
        className="absolute inset-y-0 left-0 w-[46%] md:w-[38%]"
        style={{ background: "linear-gradient(90deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.55) 45%, transparent 100%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(0deg, rgba(3,5,12,0.86) 0%, transparent 100%)" }}
      />

      {/* Heading */}
      <header className="absolute left-5 top-[92px] max-w-md md:left-10 md:top-[104px]">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="h-px w-7 bg-gradient-to-r from-[#a78bfa] to-transparent" />
          <span className="text-[10px] font-black uppercase tracking-[0.44em] text-white/35">Career Route</span>
        </div>
        <h1 className="text-[2.1rem] font-black leading-none text-white md:text-5xl">Experience</h1>
        <p className="mt-2 hidden max-w-sm text-[13px] leading-snug text-white/45 sm:block">
          A journey through research, industry, and everything in between.
        </p>
        <p ref={hintRef} className="mt-3 text-[11px] font-bold uppercase tracking-[0.28em] text-white/30">
          Scroll to drive through my journey
        </p>
      </header>

      {/* Destination cards */}
      {destinations.map((d, i) => (
        <article
          key={d.id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          aria-hidden={active !== i}
          className="pointer-events-auto absolute bottom-[92px] left-3 right-3 max-h-[40dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/75 p-4 opacity-0 backdrop-blur-xl md:bottom-auto md:left-auto md:right-10 md:top-1/2 md:max-h-none md:w-[36%] md:max-w-[460px] md:-translate-y-1/2 md:overflow-visible md:p-6"
          style={{ borderTopColor: d.accent, borderTopWidth: 2, visibility: "hidden" }}
        >
          <div
            className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: d.accent }}
          >
            <ChevronRight size={12} />
            {d.district}
          </div>
          <h2 className="text-[17px] font-black leading-tight text-white md:text-2xl">{d.title}</h2>
          <p className="mt-1 text-[13px] font-semibold md:text-sm" style={{ color: d.accent }}>
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
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/70 md:mt-3 md:text-[13px]">{d.description}</p>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 md:mt-4 md:gap-2">
            {d.highlights.map((h) => (
              <li
                key={h}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10.5px] font-semibold text-white/70 md:px-2.5 md:text-[11px]"
              >
                {h}
              </li>
            ))}
          </ul>
        </article>
      ))}

      {/* HUD */}
      <div className="pointer-events-auto absolute bottom-4 right-3 w-[calc(100vw-6.75rem)] max-w-[540px] rounded-2xl border border-white/10 bg-black/60 px-3 py-2.5 backdrop-blur-xl md:bottom-5 md:left-1/2 md:right-auto md:w-[min(92vw,540px)] md:-translate-x-1/2 md:px-4 md:py-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tabular-nums text-white/40">{percent}%</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              ref={barRef}
              className="h-full rounded-full transition-[width] duration-150 ease-out"
              style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #38bdf8, #fbbf24, #34d399)" }}
            />
          </div>
        </div>
        <nav aria-label="Journey destinations" className="mt-2.5 flex items-center justify-between gap-1">
          {destinations.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSeek((d.progressStart + d.progressEnd) / 2)}
              aria-current={active === i ? "true" : undefined}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
                style={{
                  background: active === i ? d.accent : "rgba(255,255,255,0.24)",
                  boxShadow: active === i ? `0 0 10px ${d.accent}` : "none",
                  transform: active === i ? "scale(1.5)" : "scale(1)",
                }}
              />
              <span
                className="w-full truncate text-center text-[9px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: active === i ? d.accent : "rgba(255,255,255,0.32)" }}
              >
                {d.district}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
