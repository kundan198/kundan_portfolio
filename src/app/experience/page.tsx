"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { experience } from "@/lib/data";

/* ─── Route config ─────────────────────────────────────────── */
const VH    = 260;
const SCALE = 2.9;
const PATH  =
  "M 50 6 C 84 26, 86 52, 52 70 C 18 88, 16 114, 50 132 " +
  "C 84 150, 86 176, 52 194 C 22 210, 20 236, 50 254";

/* Marker coordinates are read off the path at runtime (see stopPts), so the
   route can be reshaped without hand-placing every stop. */
const STOPS = [
  { trigger: 0,    label: "Research",   accent: "#a78bfa" },
  { trigger: 0.29, label: "Healthcare", accent: "#38bdf8" },
  { trigger: 0.57, label: "FinTech",    accent: "#fbbf24" },
  { trigger: 0.85, label: "Hire Me",    accent: "#34d399" },
];

const SWIPE_DISTANCE    = 58;
const SWIPE_AXIS_RATIO  = 1.2;
const TOUCH_AXIS_DEADZONE = 10;

interface Milestone {
  role:     string;
  org:      string;
  location: string;
  period:   string;
  type:     string;
  accent:   string;
  signal:   string;
  bullets:  readonly string[];
}

const DESTINATION_IDX = experience.length;

const MILESTONES: Milestone[] = [
  ...experience.map((e, i) => ({ ...e, accent: STOPS[i].accent })),
  {
    role:     "Open to Opportunities",
    org:      "Full Stack SWE · AI / ML Engineering",
    location: "Tampa, FL · Open to Relocation",
    period:   "May 2026",
    type:     "Destination",
    accent:   STOPS[DESTINATION_IDX].accent,
    signal:   "Ready for the next build",
    bullets: [
      "Seeking high-impact roles across full-stack systems, applied AI, and research software.",
      "Strong fit for teams building production AI products, real-time data tools, and mobile-first platforms.",
      "Ships end-to-end: research prototype → deployed product, clean UX, reliable systems.",
    ],
  },
];

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}
function getIdx(p: number) {
  for (let i = STOPS.length - 1; i > 0; i--) {
    if (p >= STOPS[i].trigger) return i;
  }
  return 0;
}

/* ─────────────────────────────────────────────────────────────
   MOBILE — scrollable timeline
───────────────────────────────────────────────────────────── */
function MobileCard({ m, stop, index }: { m: Milestone; stop: typeof STOPS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{
        background: "rgba(255,255,255,0.028)",
        backdropFilter: "blur(22px)",
        boxShadow: `0 4px 44px ${stop.accent}16, inset 0 1px 0 rgba(255,255,255,0.055)`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-[2px]"
        style={{ background: `linear-gradient(90deg, ${stop.accent}, ${stop.accent}00 72%)` }}
      />

      {/* Ghost number */}
      <div
        className="pointer-events-none absolute right-3 top-2 select-none text-[68px] font-black leading-none tabular-nums"
        style={{ color: stop.accent, opacity: 0.065 }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Background glow */}
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full"
        style={{
          background: `radial-gradient(circle, ${stop.accent}24, transparent 68%)`,
          filter: "blur(30px)",
        }}
      />

      <div className="relative p-5">
        {/* Type badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: stop.accent, borderColor: `${stop.accent}35`, background: `${stop.accent}10` }}
        >
          <Briefcase size={9} />
          {m.type}
        </motion.div>

        {/* Role + org */}
        <h2 className="text-[1.3rem] font-black leading-tight text-white">{m.role}</h2>
        <p className="mt-0.5 text-[13px] font-semibold" style={{ color: stop.accent }}>
          {m.org}
        </p>

        {/* Meta */}
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/38">
          <span className="flex items-center gap-1"><MapPin size={9} />{m.location}</span>
          <span className="flex items-center gap-1"><Calendar size={9} />{m.period}</span>
        </div>

        {/* Signal */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="mt-3 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/45"
        >
          <Radar size={9} style={{ color: stop.accent }} />
          {m.signal}
        </motion.div>

        {/* Bullets */}
        <div className="mt-4 flex flex-col gap-2">
          {m.bullets.map((b, bi) => (
            <motion.div
              key={bi}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14 + bi * 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.022] px-3 py-2 text-[12px] leading-relaxed text-white/58"
            >
              <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: stop.accent }} />
              <span>{b}</span>
            </motion.div>
          ))}
        </div>

        {/* Hire Me CTAs */}
        {index === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.38, duration: 0.5 }}
            className="mt-5 flex flex-col gap-2.5"
          >
            <a
              href="https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-black transition-opacity active:opacity-75"
              style={{ background: stop.accent }}
            >
              <ExternalLink size={14} /> Connect on LinkedIn
            </a>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition-opacity active:opacity-75"
              style={{ borderColor: `${stop.accent}55`, color: stop.accent }}
            >
              <Mail size={14} /> Get in Touch
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function MobileExperience() {
  return (
    <div className="md:hidden min-h-dvh bg-[#05060f] text-white">
      {/* Fixed background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="orb"
          style={{ width: 520, height: 520, left: "-18%", top: "-12%", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", animationDuration: "12s" }}
        />
        <div
          className="orb"
          style={{ width: 420, height: 420, right: "-14%", top: "28%", background: "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 70%)", animationDuration: "15s", animationDelay: "-5s" }}
        />
        <div
          className="orb"
          style={{ width: 380, height: 380, left: "8%", bottom: "-8%", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)", animationDuration: "11s", animationDelay: "-8s" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(124,58,237,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 px-5 pb-24 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span className="h-px w-7 bg-gradient-to-r from-violet-400 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-[0.44em] text-white/30">
              Career Route
            </span>
          </div>
          <h1 className="text-[2.4rem] font-black leading-none text-white">Experience</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/35">
            Research · Industry · What&apos;s Next
          </p>

          {/* Stop chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="mt-5 flex flex-wrap gap-2"
          >
            {STOPS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                style={{ borderColor: `${s.accent}40`, color: s.accent, background: `${s.accent}10` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.accent }} />
                {s.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical spine */}
          <div className="absolute bottom-4 left-[7px] top-4 w-px overflow-hidden">
            {/* Ghost track */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, #a78bfa 0%, #38bdf8 50%, #34d399 100%)",
                opacity: 0.18,
              }}
            />
            {/* Animated fill */}
            <motion.div
              className="absolute left-0 right-0 top-0"
              style={{ background: "linear-gradient(to bottom, #a78bfa 0%, #38bdf8 50%, #34d399 100%)" }}
              initial={{ height: "0%" }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 2.4, ease: "easeInOut", delay: 0.35 }}
            />
          </div>

          {/* Cards + dots */}
          <div className="flex flex-col gap-8 pl-9">
            {MILESTONES.map((m, i) => (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <motion.div
                  className="absolute -left-[34px] top-[22px] flex h-[15px] w-[15px] items-center justify-center rounded-full"
                  style={{ border: `2px solid ${STOPS[i].accent}`, background: `${STOPS[i].accent}18` }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 340, damping: 22 }}
                >
                  <div className="h-[5px] w-[5px] rounded-full" style={{ background: STOPS[i].accent }} />
                  {/* Ripple ring */}
                  <motion.div
                    className="absolute inset-[-3px] rounded-full"
                    style={{ border: `1.5px solid ${STOPS[i].accent}` }}
                    animate={{ scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.85, ease: "easeOut" }}
                  />
                </motion.div>

                <MobileCard m={m} stop={STOPS[i]} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DESKTOP — cinematic GPS map (unchanged)
───────────────────────────────────────────────────────────── */
export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef      = useRef<SVGPathElement>(null);
  const pathLenRef   = useRef(1);
  const progressRef  = useRef(0);
  const isMobileRef  = useRef(false);
  const pointerSwipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const touchStateRef = useRef<{
    startX: number; startY: number; lastY: number; axis: "x" | "y" | null;
  } | null>(null);

  const progress  = useMotionValue(0);
  const routeY    = useMotionValue(0);
  const navRotate = useMotionValue(0);
  const strokeOff = useMotionValue(1);
  const spring    = useSpring(progress, { stiffness: 78, damping: 23, mass: 0.65 });

  const [activeIdx, setActiveIdx] = useState(0);
  const [pathLen,   setPathLen]   = useState(1);
  const [stopPts,   setStopPts]   = useState<{ x: number; y: number }[]>([]);
  const [percent,   setPercent]   = useState(0);
  const [vpH,       setVpH]       = useState(720);

  const current     = MILESTONES[activeIdx];
  const currentStop = STOPS[activeIdx];
  const nextStop    = STOPS[Math.min(activeIdx + 1, STOPS.length - 1)];

  /* Track whether we're on mobile so the GPS listeners don't fire */
  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth < 768; };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Camera update ── */
  const updateRoute = useCallback(
    (val: number, h = vpH) => {
      const path = pathRef.current;
      if (!path) return;
      const p   = clamp(val);
      const len = pathLenRef.current;
      const rH  = h * SCALE;
      const d   = clamp(p * len, 0, len - 0.01);
      const pt  = path.getPointAtLength(d);
      const fwd = path.getPointAtLength(Math.min(len, d + 2));
      routeY.set(h / 2 - (pt.y / VH) * rH);
      navRotate.set(Math.atan2(fwd.x - pt.x, fwd.y - pt.y) * (180 / Math.PI));
      strokeOff.set(len * (1 - p));
      const np = Math.round(p * 100);
      setPercent((prev) => (prev === np ? prev : np));
      const ni = getIdx(p);
      setActiveIdx((prev) => (prev === ni ? prev : ni));
    },
    [navRotate, routeY, strokeOff, vpH],
  );

  const setJourney = useCallback(
    (next: number) => { const v = clamp(next); progressRef.current = v; progress.set(v); },
    [progress],
  );

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= STOPS.length) return;
    const next = clamp(STOPS[idx].trigger + 0.04);
    setActiveIdx(idx);
    setPercent(Math.round(next * 100));
    setJourney(next);
  }, [setJourney]);

  const handlePointerSwipeStart = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest("a, button, input, textarea, select, [role='button']")) return;
    pointerSwipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  }, []);

  const handlePointerSwipeEnd = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const start = pointerSwipeStartRef.current;
    pointerSwipeStartRef.current = null;
    if (!start || start.pointerId !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;
    goTo(activeIdx + (dx < 0 ? 1 : -1));
  }, [activeIdx, goTo]);

  /* ── Measure path ── */
  useEffect(() => {
    const measure = () => {
      const h = containerRef.current?.clientHeight ?? window.innerHeight;
      setVpH(h);
      if (pathRef.current) {
        const len = pathRef.current.getTotalLength();
        pathLenRef.current = len;
        setPathLen(len);
        setStopPts(
          STOPS.map((st) => {
            const pt = pathRef.current!.getPointAtLength(st.trigger * len);
            return { x: pt.x, y: pt.y };
          }),
        );
        strokeOff.set(len);
        updateRoute(progressRef.current, h);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [strokeOff, updateRoute]);

  /* ── Input events — desktop only (guarded by isMobileRef) ── */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isMobileRef.current) return;
      e.preventDefault();
      setJourney(progressRef.current + e.deltaY * (e.deltaMode === 1 ? 0.018 : 0.00075));
    };
    const onTouchStart = (e: TouchEvent) => {
      if (isMobileRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      touchStateRef.current = { startX: t.clientX, startY: t.clientY, lastY: t.clientY, axis: null };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isMobileRef.current) return;
      e.preventDefault();
      const t = e.touches[0]; const s = touchStateRef.current;
      if (!t || !s) return;
      const dx = t.clientX - s.startX; const dy = t.clientY - s.startY;
      if (!s.axis && (Math.abs(dx) > TOUCH_AXIS_DEADZONE || Math.abs(dy) > TOUCH_AXIS_DEADZONE))
        s.axis = Math.abs(dx) > Math.abs(dy) * SWIPE_AXIS_RATIO ? "x" : "y";
      if (s.axis === "x") return;
      setJourney(progressRef.current + (s.lastY - t.clientY) * 0.0038);
      s.lastY = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (isMobileRef.current) return;
      const s = touchStateRef.current; const t = e.changedTouches[0];
      touchStateRef.current = null;
      if (!s || !t) return;
      const dx = t.clientX - s.startX; const dy = t.clientY - s.startY;
      if (s.axis === "y") return;
      if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;
      goTo(activeIdx + (dx < 0 ? 1 : -1));
    };
    const onKey = (e: KeyboardEvent) => {
      if (isMobileRef.current) return;
      if (["ArrowDown", "PageDown"].includes(e.key)) setJourney(progressRef.current + 0.08);
      if (["ArrowUp",   "PageUp"  ].includes(e.key)) setJourney(progressRef.current - 0.08);
    };
    window.addEventListener("wheel",       onWheel,      { passive: false });
    window.addEventListener("touchstart",  onTouchStart, { passive: true  });
    window.addEventListener("touchmove",   onTouchMove,  { passive: false });
    window.addEventListener("touchend",    onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("keydown",     onKey);
    return () => {
      window.removeEventListener("wheel",       onWheel);
      window.removeEventListener("touchstart",  onTouchStart);
      window.removeEventListener("touchmove",   onTouchMove);
      window.removeEventListener("touchend",    onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown",     onKey);
    };
  }, [activeIdx, goTo, setJourney]);

  useMotionValueEvent(spring, "change", updateRoute);

  return (
    <>
      {/* ══ MOBILE ══════════════════════════════════════════════ */}
      <MobileExperience />

      {/* ══ DESKTOP ═════════════════════════════════════════════ */}
      <main
        ref={containerRef}
        className="relative hidden h-[100dvh] overflow-hidden bg-[#05060f] text-white select-none md:block"
        onPointerDown={handlePointerSwipeStart}
        onPointerUp={handlePointerSwipeEnd}
        onPointerCancel={() => { pointerSwipeStartRef.current = null; }}
      >
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb" style={{ width: 660, height: 660, left: "-14%", top: "-14%", background: "radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(109,40,217,0.07) 50%, transparent 70%)", animationDuration: "12s" }} />
          <div className="orb" style={{ width: 500, height: 500, right: "-10%", top: "4%", background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(37,99,235,0.05) 50%, transparent 70%)", animationDuration: "15s", animationDelay: "-4s" }} />
          <div className="orb" style={{ width: 420, height: 420, left: "28%", bottom: "-8%", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, rgba(16,185,129,0.04) 50%, transparent 70%)", animationDuration: "11s", animationDelay: "-7s" }} />
          <div className="orb" style={{ width: 360, height: 360, left: "6%", top: "38%", background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)", animationDuration: "14s", animationDelay: "-2s" }} />
          <div className="orb" style={{ width: 300, height: 300, right: "10%", bottom: "22%", background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)", animationDuration: "9s", animationDelay: "-5s" }} />
        </div>

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(rgba(124,58,237,0.055) 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />

        {/* Grid lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
        />

        {/* Header */}
        <div className="absolute left-5 right-5 top-[76px] z-30 flex items-center justify-between gap-4 md:left-10 md:right-10">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="h-px w-7 bg-gradient-to-r from-[#a78bfa] to-transparent" />
              <span className="text-[10px] font-black uppercase tracking-[0.44em] text-white/30">Career Route</span>
            </div>
            <h1 className="text-[2rem] font-black leading-none text-white md:text-5xl">Experience</h1>
            <p className="mt-1 hidden max-w-xs text-[12px] leading-snug text-white/38 sm:block">
              A guided route through research, industry, and the next destination.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-2.5 backdrop-blur-xl sm:flex">
            <Radar size={12} style={{ color: currentStop.accent }} />
            <div className="min-w-0">
              <div className="mb-1 text-[9px] font-black uppercase tracking-[0.30em] text-white/38">{currentStop.label}</div>
              <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full" style={{ width: `${percent}%`, background: "linear-gradient(90deg, #a78bfa, #38bdf8, #34d399)" }} />
              </div>
            </div>
            <span className="text-[11px] font-black tabular-nums text-white/42">{percent}%</span>
          </div>
        </div>

        {/* Moving route layer */}
        <motion.div className="pointer-events-none absolute left-0 top-0 w-full" style={{ height: `${SCALE * 100}%`, y: routeY }}>
          <svg viewBox={`0 0 100 ${VH}`} preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="xpRouteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#a78bfa" />
                <stop offset="50%"  stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="xpGlow">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path id="xpRoutePath" d={PATH} stroke="rgba(255,255,255,0.075)" strokeWidth="17" fill="none" strokeLinecap="round" />
            <path d={PATH} stroke="rgba(6,8,20,0.97)"      strokeWidth="11"  fill="none" strokeLinecap="round" />
            <path d={PATH} stroke="rgba(255,255,255,0.17)" strokeWidth="1" fill="none" strokeDasharray="2 5" strokeLinecap="round" />
            {/* lane markings drifting along the asphalt */}
            <path d={PATH} stroke="rgba(255,255,255,0.34)" strokeWidth="0.8" fill="none" strokeDasharray="1.4 7" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="0" to="-8.4" dur="1.1s" repeatCount="indefinite" />
            </path>
            <motion.path
              ref={pathRef}
              d={PATH}
              stroke="url(#xpRouteGrad)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={pathLen}
              style={{ strokeDashoffset: strokeOff, filter: "url(#xpGlow)" }}
            />
            {/* sparks running the full route */}
            {[0, 1, 2].map((i) => (
              <circle key={`spark-${i}`} r="1.5" fill="#e2e8f0" opacity="0.75" filter="url(#xpGlow)">
                <animateMotion dur="7s" begin={`${i * 2.33}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href="#xpRoutePath" />
                </animateMotion>
                <animate attributeName="opacity" values="0;0.85;0.85;0" dur="7s" begin={`${i * 2.33}s`} repeatCount="indefinite" />
              </circle>
            ))}
            {stopPts.map((pt, i) => {
              const stop = STOPS[i];
              const reached = i <= activeIdx;
              return (
                <g key={stop.label}>
                  <circle cx={pt.x} cy={pt.y} r="7.5" fill="none" stroke={stop.accent} opacity="0.18" />
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill={stop.accent} opacity={reached ? 0.95 : 0.45} />
                  <circle cx={pt.x} cy={pt.y} r="11" fill="none" stroke={stop.accent} opacity="0.28">
                    <animate attributeName="r"       values="6;14;6"      dur="2.6s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.32;0;0.32" dur="2.6s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Navigator arrow */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ rotate: navRotate }}
        >
          <div className="relative grid h-[116px] w-[116px] place-items-center">
            {/* radar sweep */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 262deg, ${current.accent}42 332deg, ${current.accent}9c 356deg, transparent 360deg)`,
                maskImage: "radial-gradient(circle, #000 32%, transparent 72%)",
                WebkitMaskImage: "radial-gradient(circle, #000 32%, transparent 72%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
            />

            {/* staggered sonar echoes */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${current.accent}55` }}
                animate={{ scale: [0.42, 1.15], opacity: [0.65, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 1.2 }}
              />
            ))}

            {/* counter-rotating dashed bezel */}
            <motion.svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="50" cy="50" r="41" fill="none" stroke={current.accent} strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2.5 7" />
              {[0, 90, 180, 270].map((deg) => (
                <rect key={deg} x="49.4" y="4" width="1.2" height="6" rx="0.6" fill={current.accent} opacity="0.6" transform={`rotate(${deg} 50 50)`} />
              ))}
            </motion.svg>

            {/* heading cone */}
            <div
              className="absolute left-1/2 top-[3px] h-[34px] w-[34px] -translate-x-1/2"
              style={{
                background: `linear-gradient(to bottom, ${current.accent}3d, transparent 78%)`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              }}
            />

            {/* dark disc so the arrow stays legible over the bright road */}
            <div
              className="absolute h-[52px] w-[52px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(3,5,14,0.95) 0%, rgba(3,5,14,0.72) 62%, transparent 100%)",
                border: `1px solid ${current.accent}66`,
                boxShadow: `0 0 26px ${current.accent}3a, inset 0 0 18px ${current.accent}1f`,
              }}
            />

            {/* core arrow — breathes and bobs forward */}
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.1, 1], y: [1.5, -2.5, 1.5] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <Navigation
                size={34}
                strokeWidth={2.2}
                style={{
                  color: "#ffffff",
                  fill: current.accent,
                  filter: `drop-shadow(0 0 10px ${current.accent}) drop-shadow(0 4px 22px ${current.accent}aa)`,
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Experience card */}
        <AnimatePresence mode="wait">
          <motion.article
            key={activeIdx}
            initial={{ opacity: 0, y: 18,  scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.30, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[70px] left-3 right-3 z-40 mx-auto max-h-[40dvh] max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-[0_20px_72px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:bottom-[68px] md:left-6 md:max-h-[38dvh] md:right-6"
          >
            <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${current.accent}, ${current.accent}00 68%)` }} />
            <div className="grid gap-3 p-4 md:grid-cols-[1fr_1.25fr] md:gap-4 md:p-5">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.30em]" style={{ color: current.accent }}>
                  <Briefcase size={11} />{current.type}
                </div>
                <h2 className="text-[1.2rem] font-black leading-tight text-white md:text-[1.55rem]">{current.role}</h2>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: current.accent }}>{current.org}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/40">
                  <span className="flex items-center gap-1"><MapPin size={10} />{current.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} />{current.period}</span>
                </div>
                <div className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                  <Radar size={10} style={{ color: current.accent }} />{current.signal}
                </div>
                {activeIdx === DESTINATION_IDX && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-3 flex flex-wrap gap-2">
                    <a href="https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-black transition-opacity hover:opacity-85" style={{ background: current.accent }}>
                      <ExternalLink size={11} />LinkedIn
                    </a>
                    <Link href="/contact" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-white/[0.07]" style={{ borderColor: `${current.accent}55`, color: current.accent }}>
                      <Mail size={11} />Get in Touch
                    </Link>
                  </motion.div>
                )}
              </div>
              <div className="grid auto-rows-min gap-1.5 overflow-y-auto pr-0.5 md:grid-cols-2 md:gap-2" style={{ maxHeight: "22dvh" }}>
                {current.bullets.map((b) => (
                  <div key={b} className="flex items-start gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-[12px] leading-relaxed text-white/65">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: current.accent }} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>

        {/* Bottom nav bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t border-white/[0.08] bg-black/80 px-5 backdrop-blur-2xl md:px-8">
          <motion.button onClick={() => goTo(activeIdx - 1)} disabled={activeIdx === 0} whileTap={{ scale: 0.85 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/50 transition-all disabled:cursor-not-allowed disabled:opacity-20 enabled:hover:border-white/25 enabled:hover:bg-white/10 enabled:hover:text-white"
            aria-label="Previous stop">
            <ChevronLeft size={17} />
          </motion.button>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2.5">
              {STOPS.map((s, i) => (
                <motion.button key={s.label} onClick={() => goTo(i)} aria-label={`Go to ${s.label}`} whileTap={{ scale: 0.82 }} className="flex items-center justify-center">
                  <motion.div className="rounded-full"
                    animate={{ width: activeIdx === i ? 28 : 8, height: 8, backgroundColor: activeIdx === i ? s.accent : "rgba(255,255,255,0.18)", boxShadow: activeIdx === i ? `0 0 12px ${s.accent}72` : "none" }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  />
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span key={activeIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.18 }}
                  className="text-[11px] font-bold tracking-wide" style={{ color: currentStop.accent }}>
                  {currentStop.label}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] font-black tabular-nums text-white/28">{percent}%</span>
            </div>
          </div>
          <motion.button onClick={() => goTo(activeIdx + 1)} disabled={activeIdx === STOPS.length - 1} whileTap={{ scale: 0.85 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-20 enabled:hover:bg-white/10 enabled:hover:text-white"
            style={{ borderColor: activeIdx < STOPS.length - 1 ? `${nextStop.accent}55` : "rgba(255,255,255,0.12)", color: activeIdx < STOPS.length - 1 ? nextStop.accent : "rgba(255,255,255,0.42)" }}
            aria-label="Next stop">
            <ChevronRight size={17} />
          </motion.button>
        </nav>

        {/* Mobile progress badge */}
        <div className="absolute right-4 top-[80px] z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/52 px-2.5 py-1 backdrop-blur-xl sm:hidden">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: current.accent }} />
          <span className="text-[10px] font-black tabular-nums text-white/40">{percent}%</span>
        </div>
      </main>
    </>
  );
}
