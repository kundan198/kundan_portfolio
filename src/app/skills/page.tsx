"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import Link from "next/link";
import { projects as allProjects } from "@/lib/data";
import { ArrowRight, X, Zap, ExternalLink, Github, Code2, Rocket, Star, Trophy, BookOpen, Users } from "lucide-react";
import { SkillDef, ROWS } from "./skillsData";
import { BinaryFlow } from "@/components/BinaryFlow";
import dynamic from "next/dynamic";

// Real WebGL/Three.js monitor (client-only)
const Monitor3D = dynamic(() => import("@/components/Monitor3D"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "60vh" }} />,
});

// Static one-screen desktop Skills (monitor + desk + stat cards), no scroll-hijack.
const SkillsUniverse = dynamic(() => import("@/components/SkillsUniverse"), {
  ssr: false,
  loading: () => <div className="h-[100dvh] w-full" />,
});

/* ── achievement stat cards (fade in as the desk assembles) ── */
const STATS = [
  { side: "l", Icon: Code2, value: "15+", label: "Technologies Mastered", color: "#38bdf8" },
  { side: "l", Icon: Rocket, value: "10+", label: "Projects Built", color: "#a78bfa" },
  { side: "l", Icon: Star, value: "3+", label: "Years of Experience", color: "#2dd4bf" },
  { side: "r", Icon: Trophy, value: "5+", label: "Hackathons Participated", color: "#fbbf24" },
  { side: "r", Icon: BookOpen, value: "2+", label: "Research Publications", color: "#60a5fa" },
  { side: "r", Icon: Users, value: "100+", label: "Problems Solved", color: "#34d399" },
] as const;

function StatCard({ s, opacity, x }: { s: (typeof STATS)[number]; opacity: MotionValue<number>; x: MotionValue<number> }) {
  const Icon = s.Icon;
  return (
    <motion.div style={{ opacity, x, boxShadow: `0 0 40px -18px ${s.color}` }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${s.color}1f`, border: `1px solid ${s.color}44`, color: s.color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xl font-black leading-none text-white">{s.value}</div>
        <div className="mt-0.5 text-xs text-white/55">{s.label}</div>
      </div>
    </motion.div>
  );
}

/* ─── Click sound ────────────────────────────────────────────────────────── */
function playClick() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.065);
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    o.start(); o.stop(ctx.currentTime + 0.09);
  } catch { /* silent */ }
}

const PROJECT_COLORS: Record<string, string> = {
  purple: "#7c3aed", cyan: "#0891b2", blue: "#2563eb",
  violet: "#6d28d9", pink: "#db2777", indigo: "#4338ca",
};

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

/* ─── Key component ──────────────────────────────────────────────────────── */
function Key({ skill, isActive, onClick }: { skill: SkillDef; isActive: boolean; onClick: (s: SkillDef) => void }) {
  const [pressed, setPressed] = useState(false);
  const handle = useCallback(() => {
    setPressed(true); playClick();
    setTimeout(() => setPressed(false), 160);
    onClick(skill);
  }, [skill, onClick]);

  return (
    <motion.button
      onClick={handle}
      className="relative select-none cursor-pointer w-full"
      style={{ aspectRatio: "1 / 1.08" }}
      whileHover="hover"
      animate={pressed ? "pressed" : "idle"}
    >
      {/* Neon underglow */}
      <motion.div
        className="absolute inset-0 rounded-[10px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 120%, ${skill.color}95 0%, transparent 65%)`,
          filter: "blur(10px)", bottom: "-6px",
        }}
        variants={{ idle: { opacity: isActive ? 0.80 : 0 }, hover: { opacity: 0.95 }, pressed: { opacity: 1 } }}
      />
      {/* Key housing — provides the 3-D thickness */}
      <motion.div
        className="absolute inset-0 rounded-[10px]"
        style={{
          background: "linear-gradient(to bottom, #100f26 0%, #07061a 100%)",
          boxShadow: `0 5px 0 #020110, 0 8px 16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.045)`,
        }}
        variants={{ idle: { y: 0 }, hover: { y: -2 }, pressed: { y: 4 } }}
        transition={{ type: "spring", stiffness: 640, damping: 30 }}
      />
      {/* Key top face */}
      <motion.div
        className="absolute inset-0 rounded-[10px] flex flex-col items-center justify-center gap-[3px] overflow-hidden"
        style={{
          background: isActive
            ? `linear-gradient(150deg, ${skill.color}28, ${skill.color}0e, #12112a)`
            : "linear-gradient(150deg, #1e1c3c, #141228, #0f0e24)",
          border: isActive ? `1px solid ${skill.color}65` : "1px solid rgba(255,255,255,0.075)",
          boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.16), 0 0 20px ${skill.color}50` : "inset 0 1px 0 rgba(255,255,255,0.09)",
          marginBottom: "5px",
        }}
        variants={{ idle: { y: 0 }, hover: { y: -2 }, pressed: { y: 4, marginBottom: "1px" } }}
        transition={{ type: "spring", stiffness: 640, damping: 30 }}
      >
        {/* Gloss strip */}
        <div className="absolute top-0 left-[6%] right-[6%] h-[36%] rounded-t-[10px] pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.09), transparent)" }} />
        {/* Icon */}
        <motion.div
          variants={{ hover: { scale: 1.2 }, pressed: { scale: 0.84 }, idle: { scale: 1 } }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
        >
          <skill.Icon size={18} color={isActive ? skill.color : "rgba(255,255,255,0.68)"} />
        </motion.div>
        {/* Label */}
        <span className="text-[6.5px] font-bold tracking-wide leading-none text-center px-0.5 truncate w-full"
          style={{ color: isActive ? skill.color : "rgba(255,255,255,0.42)", textShadow: isActive ? `0 0 8px ${skill.color}` : "none" }}>
          {skill.short}
        </span>
        {/* Click ripple */}
        <AnimatePresence>
          {pressed && (
            <motion.div className="absolute inset-0 rounded-[10px] pointer-events-none"
              initial={{ opacity: 0.8, scale: 0.5 }} animate={{ opacity: 0, scale: 1.6 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              style={{ border: `1.5px solid ${skill.color}`, borderRadius: "10px" }} />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

/* ─── Keyboard body (shared by desktop cinematic + mobile) ─────────────────── */
function KeyboardBody({ activeKey, onKey }: { activeKey: SkillDef | null; onKey: (s: SkillDef) => void }) {
  return (
    <div className="relative w-full">
      {/* Keyboard floating glow */}
      <div className="absolute -bottom-2 left-8 right-8 h-6 pointer-events-none"
        style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.30),transparent 70%)", filter: "blur(12px)" }} />

      {/* The keyboard base */}
      <div className="relative rounded-[28px] p-3.5 sm:p-5"
        style={{
          background: "linear-gradient(178deg,#141230 0%,#0a091e 55%,#060514 100%)",
          boxShadow: "0 45px 90px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.058), inset 0 1px 0 rgba(255,255,255,0.11), inset 0 -1px 0 rgba(0,0,0,0.55), 0 0 120px rgba(124,58,237,0.13)",
        }}>
        {/* LED strip — bottom */}
        <div className="absolute bottom-0 left-8 right-8 h-[3px] rounded-b-[28px]"
          style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5,#06b6d4,#10b981,#06b6d4,#4f46e5,#7c3aed)", filter: "blur(2px)", opacity: 0.92 }} />
        {/* LED strips — sides */}
        <div className="absolute left-0 top-7 bottom-7 w-[3px] rounded-l-[28px]"
          style={{ background: "linear-gradient(180deg,#7c3aed55,#3b82f677,#7c3aed55)", filter: "blur(1px)" }} />
        <div className="absolute right-0 top-7 bottom-7 w-[3px] rounded-r-[28px]"
          style={{ background: "linear-gradient(180deg,#7c3aed55,#06b6d477,#7c3aed55)", filter: "blur(1px)" }} />

        {/* Key rows */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {ROWS.map((row, ri) => (
            <div key={ri} className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: "repeat(10,1fr)" }}>
              {row.map((skill, ki) => skill
                ? <Key key={skill.id} skill={skill} isActive={activeKey?.id === skill.id} onClick={onKey} />
                : <div key={`blank-${ri}-${ki}`} /> /* spacer */
              )}
            </div>
          ))}
        </div>

        {/* Surface sheen */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{ background: "linear-gradient(168deg,rgba(255,255,255,0.038) 0%,transparent 38%)" }} />
      </div>
    </div>
  );
}

/* ─── Skill detail panel ─────────────────────────────────────────────────── */
function SkillPanel({ skill, onClose }: { skill: SkillDef | null; onClose: () => void }) {
  return (
    <AnimatePresence mode="wait">
      {skill ? (
        <motion.div key={skill.id}
          initial={{ opacity: 0, y: 16, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative rounded-2xl p-5 border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(16,14,42,0.97), rgba(8,6,26,0.98))",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderColor: `${skill.color}45`,
            boxShadow: `0 0 50px ${skill.color}20, 0 20px 50px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)`,
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${skill.color}35, transparent 70%)`, filter: "blur(18px)" }} />
          {/* Header */}
          <div className="flex items-start gap-3 mb-4 relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${skill.color}18`, border: `1px solid ${skill.color}40`, boxShadow: `0 0 18px ${skill.color}22` }}>
              <skill.Icon size={22} color={skill.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-base leading-none">{skill.name}</h3>
              <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5 inline-block" style={{ color: skill.color }}>
                {skill.category}
              </span>
            </div>
            <button onClick={onClose} className="text-white/25 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/08 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          {/* Years + level */}
          <div className="flex items-center justify-between mb-3 relative">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${skill.color}18`, color: skill.color, border: `1px solid ${skill.color}30` }}>
              Experience: {skill.years}
            </span>
            <span className="text-[11px] font-black" style={{ color: skill.color }}>{skill.level}%</span>
          </div>
          {/* Bar */}
          <div className="h-1.5 rounded-full overflow-hidden mb-4 relative" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: "0%" }} animate={{ width: `${skill.level}%` }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              style={{ background: `linear-gradient(90deg, ${skill.color}bb, ${skill.color})`, boxShadow: `0 0 8px ${skill.color}80` }} />
          </div>
          {/* Desc */}
          <p className="text-white/52 text-xs leading-relaxed mb-4 relative">{skill.desc}</p>
          {/* Projects */}
          <div className="relative">
            <p className="text-white/28 text-[9px] font-bold uppercase tracking-widest mb-2">Used in {skill.projects.length} Projects</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {skill.projects.map(p => (
                <span key={p} className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
                  style={{ background: `${skill.color}12`, border: `1px solid ${skill.color}28`, color: `${skill.color}bb` }}>{p}</span>
              ))}
            </div>
            <Link href="/projects">
              <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold"
                style={{ background: `${skill.color}20`, border: `1px solid ${skill.color}40`, color: skill.color }}>
                View Related Projects →
              </motion.button>
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ─── Monitor project card ────────────────────────────────────────────────── */
function MonitorCard({ p }: { p: typeof allProjects[0] }) {
  const c = PROJECT_COLORS[p.color] ?? "#7c3aed";
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 340, damping: 22 }}
      className="relative rounded-2xl overflow-hidden border flex flex-col h-full"
      style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))", borderColor: "rgba(255,255,255,0.08)", boxShadow: `0 0 28px ${c}22, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${c}, ${c}88)` }} />
      <div className="p-4 flex flex-col flex-1 gap-3">
        {p.badge && (
          <span className="self-start text-[8px] font-black tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: `${c}20`, border: `1px solid ${c}38`, color: c }}>
            {p.badge.text}
          </span>
        )}
        <div>
          <h3 className="text-white font-black text-sm leading-tight">{p.title}</h3>
          <p className="text-white/40 text-[10px] mt-0.5">{p.subtitle}</p>
        </div>
        <p className="text-white/45 text-[10px] leading-relaxed flex-1 line-clamp-2">{p.description}</p>
        <div className="flex flex-wrap gap-1">
          {p.tech.slice(0, 4).map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
              style={{ background: `${c}14`, border: `1px solid ${c}28`, color: `${c}cc` }}>{t}</span>
          ))}
          {p.tech.length > 4 && <span className="text-white/28 text-[8px] py-0.5">+{p.tech.length - 4}</span>}
        </div>
        <div className="flex gap-1.5 pt-1">
          <Link href={p.github} target="_blank" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold"
              style={{ background: `${c}16`, border: `1px solid ${c}30`, color: c }}>
              <Github size={9} /> GitHub
            </button>
          </Link>
          <Link href="/projects" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold text-white/50"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <ExternalLink size={9} /> Details
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── On-screen content (cards live INSIDE the monitor) ───────────────────── */
function ScreenContent({ swipeable = false, interactive = false }: { swipeable?: boolean; interactive?: boolean }) {
  /* Subtle pointer parallax / depth — desktop only, transform-only, rAF-throttled */
  const px = useMotionValue(0), py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 55, damping: 18, mass: 0.4 });
  const gridX = useTransform(sx, [-1, 1], [12, -12]);
  const gridY = useTransform(sy, [-1, 1], [8, -8]);
  const rotX = useTransform(sy, [-1, 1], [-2.5, 2.5]);
  const rotY = useTransform(sx, [-1, 1], [3, -3]);

  useEffect(() => {
    if (!interactive) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        px.set((e.clientX / window.innerWidth) * 2 - 1);
        py.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, [interactive, px, py]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Screen header */}
      <div className="z-10 flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: "rgba(4,3,18,0.92)", backdropFilter: "blur(12px)" }}>
        <div>
          <h2 className="text-white font-black text-xs tracking-wide">Projects</h2>
          <p className="text-cyan-300/55 text-[8px] font-bold tracking-wider uppercase">{allProjects.length} production builds</p>
        </div>
        <Link href="/projects">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold"
            style={{ background: "rgba(56,189,248,0.16)", border: "1px solid rgba(56,189,248,0.4)", color: "#7dd3fc" }}>
            View All <ArrowRight size={8} />
          </motion.button>
        </Link>
      </div>

      {swipeable ? (
        /* Mobile: swipeable horizontal cards (one per view) */
        <div className="flex-1 flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 py-4 no-scrollbar" style={{ scrollbarWidth: "none" }}>
          {allProjects.map((p) => (
            <div key={p.id} className="snap-center shrink-0 w-[80%] max-w-[280px]">
              <MonitorCard p={p} />
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: parallax grid */
        <div className="flex-1 overflow-y-auto" style={{ perspective: 1000, scrollbarWidth: "thin", scrollbarColor: "rgba(56,189,248,0.3) transparent" }}>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4"
            style={interactive ? { x: gridX, y: gridY, rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" } : undefined}
          >
            {allProjects.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: "easeOut" }}>
                <MonitorCard p={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ─── HUD corner bracket ──────────────────────────────────────────────────── */
function HudCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-4 h-4 pointer-events-none";
  const m: Record<string, string> = {
    tl: "top-2 left-2 border-l border-t rounded-tl",
    tr: "top-2 right-2 border-r border-t rounded-tr",
    bl: "bottom-2 left-2 border-l border-b rounded-bl",
    br: "bottom-2 right-2 border-r border-b rounded-br",
  };
  return <div className={`${base} ${m[pos]}`} style={{ borderColor: "rgba(56,189,248,0.5)", boxShadow: "0 0 8px rgba(56,189,248,0.4)" }} />;
}

/* ─── Realistic 3D monitor ────────────────────────────────────────────────── */
function FuturisticMonitor({ screenHeight = "52vh" }: { screenHeight?: string; swipeable?: boolean; interactive?: boolean }) {
  return <Monitor3D screenHeight={screenHeight} />;
}

function FuturisticMonitorOld({ screenHeight = "52vh", swipeable = false, interactive = false }: { screenHeight?: string; swipeable?: boolean; interactive?: boolean }) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* ── METALLIC BEVELED BODY ── */}
      <div className="relative w-full rounded-[26px]"
        style={{
          background: "linear-gradient(155deg,#2c2942 0%,#16131f 44%,#0a0813 100%)",
          padding: "12px 12px 16px",
          boxShadow: [
            "0 55px 120px rgba(0,0,0,0.95)",
            "0 0 0 1px rgba(255,255,255,0.05)",
            "inset 0 1px 0 rgba(255,255,255,0.16)",
            "inset 0 -2px 7px rgba(0,0,0,0.7)",
            "0 0 70px rgba(124,58,237,0.34)",
            "0 0 130px rgba(56,189,248,0.16)",
          ].join(","),
        }}>
        {/* Neon cyan edge frame */}
        <div className="pointer-events-none absolute inset-[3px] rounded-[22px]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.45), inset 0 0 24px rgba(56,189,248,0.18)" }} />

        {/* Lens flares near top corners */}
        <div className="glow-pulse pointer-events-none absolute -top-2 left-6 w-24 h-10"
          style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.5), transparent 70%)", filter: "blur(6px)" }} />
        <div className="glow-pulse pointer-events-none absolute -top-2 right-6 w-24 h-10"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.45), transparent 70%)", filter: "blur(6px)", animationDelay: "1.4s" }} />

        {/* HUD corner brackets */}
        <HudCorner pos="tl" /><HudCorner pos="tr" /><HudCorner pos="bl" /><HudCorner pos="br" />

        {/* Bezel top HUD bar */}
        <div className="flex items-center justify-between mb-2.5 px-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {["#ff5f56","#febc2e","#28c840"].map(c => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 5px ${c}88` }} />
              ))}
            </div>
            <span className="hidden sm:flex items-center gap-1 text-[7px] font-black tracking-[0.2em] text-rose-400/70 uppercase">
              <span className="w-1 h-1 rounded-full bg-rose-500 glow-pulse inline-block" /> REC
            </span>
          </div>
          <span className="text-cyan-300/55 text-[8px] sm:text-[9px] font-black tracking-[0.3em] uppercase">KUNDAN.DEV — PROJECTS</span>
          <span className="text-[7px] font-black tracking-[0.2em] text-cyan-400/45 uppercase tabular-nums">60 FPS</span>
        </div>

        {/* ── SCREEN (curved glass) ── */}
        <div className="relative rounded-[16px] overflow-hidden"
          style={{
            height: screenHeight, minHeight: "260px", maxHeight: "560px",
            background: "radial-gradient(ellipse at 50% -12%, #12102f 0%, #070418 62%, #040210 100%)",
            boxShadow: "inset 0 0 60px rgba(124,58,237,0.10), inset 0 0 140px rgba(0,0,0,0.6)",
          }}>
          {/* Screen bloom from cards */}
          <div className="glow-pulse pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 w-2/3 h-2/3"
            style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.10), transparent 68%)" }} />

          {/* On-screen content */}
          <div className="relative z-[2] h-full">
            <ScreenContent swipeable={swipeable} interactive={interactive} />
          </div>

          {/* Faint grid texture */}
          <div className="pointer-events-none absolute inset-0 z-[3]"
            style={{ backgroundImage: "linear-gradient(rgba(56,189,248,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.05) 1px,transparent 1px)", backgroundSize: "30px 30px", opacity: 0.5 }} />
          {/* Scanlines */}
          <div className="pointer-events-none absolute inset-0 z-[3]"
            style={{ background: "repeating-linear-gradient(rgba(255,255,255,0.022) 0 1px, transparent 1px 3px)" }} />
          {/* Moving scan band */}
          <div className="scan-sweep pointer-events-none absolute left-0 right-0 top-0 h-10 z-[3]"
            style={{ background: "linear-gradient(rgba(56,189,248,0.10), transparent)" }} />
          {/* Curved-glass reflection streak */}
          <div className="pointer-events-none absolute -top-1/3 -left-1/4 w-[85%] h-[80%] z-[4]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10), transparent 55%)", transform: "rotate(-8deg)" }} />
          {/* Vignette / barrel-curve darkening */}
          <div className="pointer-events-none absolute inset-0 z-[4] rounded-[16px]"
            style={{ boxShadow: "inset 0 0 90px 16px rgba(0,0,0,0.55)" }} />
          {/* Inner cyan rim */}
          <div className="pointer-events-none absolute inset-0 z-[4] rounded-[16px]"
            style={{ boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.18)" }} />
        </div>
      </div>

      {/* ── STAND ── */}
      <div style={{ width: "74px", height: "22px", background: "linear-gradient(to bottom,#26233e,#0e0c1c)", borderLeft: "2px solid rgba(56,189,248,0.22)", borderRight: "2px solid rgba(56,189,248,0.22)", borderBottom: "2px solid rgba(56,189,248,0.22)", borderRadius: "0 0 6px 6px" }} />
      <div className="relative" style={{ width: "190px", height: "11px", background: "linear-gradient(to bottom,#272340,#100e22)", border: "1.5px solid rgba(56,189,248,0.24)", borderRadius: "0 0 20px 20px", boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 0 26px rgba(56,189,248,0.18)" }}>
        {/* glowing base underlight */}
        <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-4 rounded-[50%]"
          style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.5), transparent 70%)", filter: "blur(7px)" }} />
      </div>
    </div>
  );
}

/* ─── Neon laser scroll indicator ─────────────────────────────────────────── */
function NeonLaserArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="text-cyan-300/50 text-[9px] font-black uppercase tracking-[0.35em]">{label}</span>
      <div className="relative" style={{ width: 18, height: 54 }}>
        {/* glow halo */}
        <div className="laser-pulse absolute left-1/2 -translate-x-1/2 top-0" style={{ width: 8, height: 44, background: "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.6), transparent 72%)", filter: "blur(4px)" }} />
        {/* beam */}
        <div className="laser-flicker absolute left-1/2 -translate-x-1/2 top-0" style={{ width: 2, height: 42, borderRadius: 2, background: "linear-gradient(to bottom, rgba(56,189,248,0) 0%, #38bdf8 28%, #7dd3fc 72%, rgba(56,189,248,0) 100%)", boxShadow: "0 0 8px #38bdf8, 0 0 16px rgba(56,189,248,0.7)" }} />
        {/* binary digits flowing down the beam */}
        <BinaryFlow vertical length={40} count={5} color="#7dd3fc" speed={1.9} fontSize={8} style={{ left: "50%", marginLeft: -3, top: 0 }} />
        {/* arrow head */}
        <div className="laser-flicker absolute left-1/2" style={{ bottom: 0, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "8px solid #38bdf8", filter: "drop-shadow(0 0 6px #38bdf8)" }} />
      </div>
    </div>
  );
}

/* ─── Stars + ambient particles (CSS-animated, off main thread) ─────────────── */
const STARS = Array.from({ length: 56 }, (_, i) => ({
  x: (i * 17.3 + 5) % 100, y: (i * 13.7 + 8) % 100,
  size: 0.7 + (i % 3) * 0.5, opacity: 0.10 + (i % 5) * 0.06, delay: (i * 0.37) % 4,
}));
const DOTS = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 23.7 + 9) % 100, y: (i * 31.3 + 12) % 100,
  size: 2 + (i % 3), color: i % 2 ? "rgba(56,189,248,0.6)" : "rgba(124,58,237,0.55)",
  dx: ((i % 5) - 2) * 7, dy: -10 - (i % 4) * 5, dur: 7 + (i % 5) * 1.6, delay: (i * 0.5) % 5,
}));

function Backdrop({ particles = false }: { particles?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {STARS.map((s, i) => (
        <span key={i} className="star"
          style={{
            left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            ["--star-min" as string]: s.opacity,
            ["--star-max" as string]: s.opacity * 2.4,
            ["--star-dur" as string]: `${2.5 + s.delay}s`,
            ["--star-delay" as string]: `${s.delay}s`,
          }} />
      ))}
      {/* Glowing ambient particles */}
      {particles && DOTS.map((d, i) => (
        <span key={`d${i}`} className="float-dot"
          style={{
            left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size,
            background: d.color, boxShadow: `0 0 8px ${d.color}`,
            ["--dx" as string]: `${d.dx}px`, ["--dy" as string]: `${d.dy}px`,
            ["--d-dur" as string]: `${d.dur}s`, animationDelay: `${d.delay}s`,
          }} />
      ))}
      <div className="absolute top-[-15%] left-[-8%] w-[700px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute top-[20%] right-[-8%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.035) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MOBILE — scrollable, no scroll-hijack. Monitor sits ABOVE a smaller,
   gently-tilted 3-D keyboard. Cards inside the monitor are swipeable.
════════════════════════════════════════════════════════════════════════════ */
function MobileSkills() {
  const [activeKey, setActiveKey] = useState<SkillDef | null>(null);
  const handleKey = useCallback((s: SkillDef) => setActiveKey(p => p?.id === s.id ? null : s), []);

  return (
    <div className="md:hidden page-wrapper animate-fadeIn overflow-x-hidden"
      style={{ background: "radial-gradient(ellipse 130% 65% at 50% 0%, #0d0b2e 0%, #07061a 42%, #030210 100%)" }}>
      <Backdrop particles />

      {/* Title */}
      <div className="relative text-center pt-24 pb-8 px-4 sm:px-6" style={{ zIndex: 1 }}>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border"
          style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.30)", color: "#a78bfa" }}>
          <Zap size={10} /> Galaxy of Skills
        </span>
        <h1 className="font-black tracking-tight leading-none mb-2"
          style={{
            fontSize: "clamp(2.2rem, 10vw, 3.2rem)",
            background: "linear-gradient(135deg,#ffffff 0%,#c084fc 28%,#38bdf8 62%,#34d399 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
          Tech Universe
        </h1>
        <p className="text-white/38 text-sm font-medium">Tap any key to explore a skill</p>
      </div>

      {/* Monitor — sits above the keyboard with breathing room */}
      <div className="relative px-4 sm:px-6 max-w-[560px] mx-auto" style={{ zIndex: 1 }}>
        <FuturisticMonitor screenHeight="52vh" swipeable />
      </div>

      {/* Keyboard — smaller, gently tilted in 3-D, centered */}
      <div className="relative px-4 sm:px-6 max-w-[560px] mx-auto mt-14" style={{ zIndex: 1 }}>
        <div style={{ perspective: 900 }}>
          <div style={{ transform: "rotateX(14deg) scale(0.97)", transformStyle: "preserve-3d", transformOrigin: "center 70%" }}>
            <KeyboardBody activeKey={activeKey} onKey={handleKey} />
          </div>
        </div>
      </div>

      {/* Inline skill panel */}
      <div className="relative px-4 sm:px-6 max-w-[560px] mx-auto mt-8 pb-24" style={{ zIndex: 1 }}>
        <SkillPanel skill={activeKey} onClose={() => setActiveKey(null)} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DESKTOP — cinematic keyboard → monitor, driven by wheel-hijack + spring.
════════════════════════════════════════════════════════════════════════════ */
function SkillsCinematicOld() {
  const [activeKey, setActiveKey] = useState<SkillDef | null>(null);
  const [percent, setPercent] = useState(0);
  const handleKey = useCallback((s: SkillDef) => setActiveKey(p => p?.id === s.id ? null : s), []);

  const progress = useMotionValue(0);
  const progressRef = useRef(0);
  const isMobileRef = useRef(false);
  const spring = useSpring(progress, { stiffness: 80, damping: 24, mass: 0.6 });

  const setJourney = useCallback((next: number) => {
    const v = clamp(next);
    progressRef.current = v;
    progress.set(v);
  }, [progress]);

  /* Mobile guard so the wheel-hijack never fires on touch layouts */
  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth < 768; };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Wheel / touch / keyboard → drive the timeline (desktop only) */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isMobileRef.current) return;
      e.preventDefault();
      setJourney(progressRef.current + e.deltaY * (e.deltaMode === 1 ? 0.018 : 0.00075));
    };
    let touchLastY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (isMobileRef.current) return;
      touchLastY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isMobileRef.current || touchLastY === null) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchLastY;
      setJourney(progressRef.current + (touchLastY - y) * 0.0038);
      touchLastY = y;
    };
    const onTouchEnd = () => { touchLastY = null; };
    const onKey = (e: KeyboardEvent) => {
      if (isMobileRef.current) return;
      if (["ArrowDown", "PageDown"].includes(e.key)) setJourney(progressRef.current + 0.08);
      if (["ArrowUp", "PageUp"].includes(e.key)) setJourney(progressRef.current - 0.08);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [setJourney]);

  /* Live % for the indicator */
  useMotionValueEvent(spring, "change", (v) => {
    const np = Math.round(clamp(v) * 100);
    setPercent((prev) => (prev === np ? prev : np));
  });

  /* ── Derived timeline transforms ── */
  const kbRotateX = useTransform(spring, [0, 0.45], [16, 44]);
  const kbScale   = useTransform(spring, [0, 0.45], [1.0, 0.5]);
  const kbY       = useTransform(spring, [0, 0.45], ["3vh", "21vh"]);
  const deskOp    = useTransform(spring, [0.18, 0.5], [0, 1]);

  const monY       = useTransform(spring, [0.3, 0.78], ["-100vh", "-9vh"]);
  const monOpacity = useTransform(spring, [0.3, 0.5], [0, 1]);
  const monScale   = useTransform(spring, [0.3, 0.78], [0.82, 0.92]);
  const projectsOpacity = useTransform(spring, [0.78, 1.0], [0, 1]);
  const statXL = useTransform(spring, [0.74, 1.0], [-60, 0]);
  const statXR = useTransform(spring, [0.74, 1.0], [60, 0]);

  /* Ambient light cast from the monitor down onto the keyboard */
  const ambientOp = useTransform(spring, [0.5, 0.85], [0, 0.6]);
  const titleOpacity = useTransform(spring, [0, 0.28], [1, 0.32]);

  return (
    <>
      <MobileSkills />

      {/* ══ DESKTOP CINEMATIC ═══════════════════════════════════════════════ */}
      <main
        className="relative hidden h-[100dvh] w-full overflow-hidden text-white select-none md:block"
        style={{ background: "radial-gradient(ellipse 130% 65% at 50% 0%, #0d0b2e 0%, #07061a 42%, #030210 100%)" }}
      >
        <Backdrop particles />

        {/* Title overlay */}
        <motion.div className="absolute top-[84px] left-0 right-0 text-center px-4 sm:px-6 md:px-8 z-30 pointer-events-none"
          style={{ opacity: titleOpacity }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-3 border"
            style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.30)", color: "#a78bfa", boxShadow: "0 0 20px rgba(124,58,237,0.16)" }}>
            <Zap size={10} /> Galaxy of Skills
          </span>
          <h1 className="font-black tracking-tight leading-none"
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
              background: "linear-gradient(135deg,#ffffff 0%,#c084fc 28%,#38bdf8 62%,#34d399 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 50px rgba(124,58,237,0.4))",
            }}>
            Tech Universe
          </h1>
        </motion.div>

        {/* ── ACHIEVEMENT STAT CARDS (assemble with the desk) ── */}
        <div className="absolute left-[2vw] top-1/2 z-30 hidden w-[17rem] max-w-[22vw] -translate-y-1/2 flex-col gap-3.5 lg:flex">
          {STATS.filter((s) => s.side === "l").map((s) => <StatCard key={s.label} s={s} opacity={projectsOpacity} x={statXL} />)}
        </div>
        <div className="absolute right-[2vw] top-1/2 z-30 hidden w-[17rem] max-w-[22vw] -translate-y-1/2 flex-col gap-3.5 lg:flex">
          {STATS.filter((s) => s.side === "r").map((s) => <StatCard key={s.label} s={s} opacity={projectsOpacity} x={statXR} />)}
        </div>

        {/* ── MONITOR LAYER (behind, z-10) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div style={{ y: monY, scale: monScale, opacity: monOpacity }} className="w-full max-w-[940px] px-4 sm:px-6 md:px-8">
            <motion.div style={{ opacity: projectsOpacity }}>
              <FuturisticMonitor screenHeight="52vh" interactive />
            </motion.div>
          </motion.div>
        </div>

        {/* ── AMBIENT LIGHT cast from monitor onto keyboard (screen blend) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ mixBlendMode: "screen" }}>
          <motion.div style={{ y: "16vh", opacity: ambientOp }} className="w-full max-w-[900px] px-4">
            <div className="mx-auto h-44 w-[72%] rounded-[50%]"
              style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.28), rgba(124,58,237,0.12) 45%, transparent 72%)", filter: "blur(34px)" }} />
          </motion.div>
        </div>

        {/* ── DESK SHADOW under the keyboard ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div style={{ y: "44vh", opacity: deskOp }} className="w-full max-w-[1100px] px-4">
            <div className="mx-auto h-16 w-[78%] rounded-[50%]"
              style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.28), rgba(0,0,0,0.55) 40%, transparent 72%)", filter: "blur(26px)" }} />
          </motion.div>
        </div>

        {/* ── KEYBOARD LAYER (front, z-20) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div style={{ y: kbY }} className="pointer-events-auto w-full max-w-[960px] px-4 sm:px-6 md:px-8 z-20">
            <div style={{ perspective: "1400px", perspectiveOrigin: "50% 40%" }}>
              <motion.div style={{ rotateX: kbRotateX, scale: kbScale, transformStyle: "preserve-3d", transformOrigin: "center 62%" }}>
                <KeyboardBody activeKey={activeKey} onKey={handleKey} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ── Skill detail panel (flat overlay, always crisp) ── */}
        <div className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-[280px] lg:w-[300px] z-40">
          <SkillPanel skill={activeKey} onClose={() => setActiveKey(null)} />
        </div>

        {/* ── Progress indicator + neon laser scroll hint ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border"
            style={{ background: "rgba(8,6,28,0.72)", borderColor: "rgba(56,189,248,0.28)", backdropFilter: "blur(10px)" }}>
            <span className="text-[9px] font-black uppercase tracking-widest transition-colors duration-500"
              style={{ color: percent < 75 ? "#a78bfa" : "rgba(255,255,255,0.25)" }}>Skills</span>
            <div className="w-12 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full"
                style={{ width: `${percent}%`, background: "linear-gradient(90deg,#7c3aed,#38bdf8)" }} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest transition-colors duration-500"
              style={{ color: percent >= 75 ? "#38bdf8" : "rgba(255,255,255,0.25)" }}>Projects</span>
          </div>
          {percent < 5 && <NeonLaserArrow label="Scroll to build the desk" />}
        </div>
      </main>
    </>
  );
}

export default function Skills() {
  // Scroll-driven 3D desk: skills keyboard -> settles onto the desk -> monitor + stat cards.
  return <SkillsUniverse />;
}
