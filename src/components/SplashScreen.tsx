"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* Deterministic particles — avoids Math.random() SSR mismatch */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id:       i,
  x:        (i * 3.7 + 1.5) % 100,
  size:     1.2 + (i % 4) * 0.7,
  delay:    (i * 0.55) % 6,
  duration: 7 + (i % 6) * 1.4,
  opacity:  0.10 + (i % 5) * 0.07,
}));

/* Floating orbs config */
const ORBS = [
  { w: 680, h: 680, color: "rgba(124,58,237,0.24)",  l: "8%",  t: "5%",  xK: [-6, 5, -6],   yK: [-8, 7, -8],  dur: 14 },
  { w: 520, h: 520, color: "rgba(56,189,248,0.18)",   l: "55%", t: "48%", xK: [7, -5, 7],    yK: [5, -8, 5],   dur: 18 },
  { w: 460, h: 460, color: "rgba(52,211,153,0.15)",   l: "18%", t: "62%", xK: [-5, 7, -5],   yK: [9, -5, 9],   dur: 16 },
  { w: 380, h: 380, color: "rgba(167,139,250,0.20)",  l: "68%", t: "12%", xK: [6, -8, 6],    yK: [-5, 6, -5],  dur: 12 },
  { w: 280, h: 280, color: "rgba(239,68,68,0.09)",    l: "42%", t: "80%", xK: [-4, 4, -4],   yK: [4, -6, 4],   dur: 20 },
];

export default function SplashScreen() {
  const [visible,  setVisible]  = useState(false);
  const [started,  setStarted]  = useState(false); // true after user taps "enter"
  const [exiting,  setExiting]  = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("splashSeen")) return;
    setVisible(true);
  }, []);

  /* Smooth progress tracking — only once video is playing */
  useEffect(() => {
    if (!started) return;
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration) setProgress(v.currentTime / v.duration);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started]);

  const enter = () => {
    if (started) return;
    setStarted(true);
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      /* Browser still blocked — fall back to muted */
      v.muted = true;
      v.play();
    });
  };

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    sessionStorage.setItem("splashSeen", "1");
    setTimeout(() => setVisible(false), 700);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          className="fixed inset-0 z-[300] overflow-hidden bg-[#05060f]"
        >

          {/* ── 1. Drifting colour orbs ──────────────────────────── */}
          <div className="pointer-events-none absolute inset-0">
            {ORBS.map((o, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: o.w, height: o.h,
                  left: o.l, top: o.t,
                  transform: "translate(-50%,-50%)",
                  background: `radial-gradient(circle, ${o.color}, transparent 68%)`,
                  filter: "blur(52px)",
                }}
                animate={{
                  x: o.xK.map(v => `${v}%`),
                  y: o.yK.map(v => `${v}%`),
                }}
                transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>

          {/* ── 2. Dot grid ──────────────────────────────────────── */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(124,58,237,0.065) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          {/* ── 3. Expanding pulse rings from centre ─────────────── */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{ border: `1px solid rgba(167,139,250,${0.18 - i * 0.03})` }}
                animate={{
                  width:   ["10vmin", "100vmin"],
                  height:  ["10vmin", "100vmin"],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1.0,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* ── 4. Horizontal scan-line sweep ────────────────────── */}
          <motion.div
            className="pointer-events-none absolute left-0 right-0 h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.0) 10%, rgba(167,139,250,0.9) 40%, rgba(56,189,248,0.9) 60%, rgba(167,139,250,0.0) 90%, transparent 100%)",
              boxShadow: "0 0 14px 3px rgba(167,139,250,0.35)",
            }}
            animate={{ top: ["-1%", "101%"] }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              repeatDelay: 6,
              ease: "linear",
              delay: 1.5,
            }}
          />

          {/* Second scan line, offset */}
          <motion.div
            className="pointer-events-none absolute left-0 right-0 h-[1px] opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent 20%, rgba(56,189,248,0.7) 50%, transparent 80%)",
            }}
            animate={{ top: ["-1%", "101%"] }}
            transition={{
              duration: 5.2,
              repeat: Infinity,
              repeatDelay: 8,
              ease: "linear",
              delay: 4.5,
            }}
          />

          {/* ── 5. Rising particles ───────────────────────────────── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {PARTICLES.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `${p.x}%`,
                  bottom: "-6px",
                  background: p.id % 3 === 0 ? "#a78bfa" : p.id % 3 === 1 ? "#38bdf8" : "#ffffff",
                  opacity: p.opacity,
                }}
                animate={{
                  y: [0, "-110vh"],
                  opacity: [p.opacity, p.opacity * 0.6, 0],
                  x: [0, (p.id % 2 === 0 ? 1 : -1) * (p.id % 20 + 5)],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* ── 6. Corner accent lines ────────────────────────────── */}
          {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((pos, i) => (
            <motion.div
              key={i}
              className={`pointer-events-none absolute ${pos}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <div className="relative h-7 w-7">
                <div
                  className={`absolute h-[2px] w-full rounded-full ${i < 2 ? "top-0" : "bottom-0"}`}
                  style={{ background: "linear-gradient(90deg, #a78bfa, #38bdf8)" }}
                />
                <div
                  className={`absolute h-full w-[2px] rounded-full ${i % 2 === 0 ? "left-0" : "right-0"}`}
                  style={{ background: "linear-gradient(180deg, #a78bfa, #38bdf8)" }}
                />
              </div>
            </motion.div>
          ))}

          {/* ── Enter gate (shown before user taps) ──────────────── */}
          <AnimatePresence>
            {!started && (
              <motion.div
                key="enter-gate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
              >
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-12 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/28">
                    Portfolio of
                  </p>
                  <h1 className="mt-1 text-4xl font-black text-white sm:text-5xl">
                    Kundan<span className="text-violet-400">.</span>
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-white/35 tracking-wide">
                    Full Stack · AI Engineer
                  </p>
                </motion.div>

                {/* Enter Options */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 22 }}
                  className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mt-4"
                >
                  {/* Option 1: Watch Intro */}
                  <button
                    onClick={enter}
                    className="group relative flex flex-col items-center gap-3 w-28"
                  >
                    {/* Outer pulse ring for the primary action */}
                    <motion.div
                      className="absolute top-0 rounded-full border border-violet-500/20"
                      style={{ width: "64px", height: "64px" }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-md transition-all group-hover:border-violet-500/60 group-hover:bg-violet-500/15 group-hover:scale-110 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M7 4.5L18 11L7 17.5V4.5Z" fill="white" fillOpacity="0.9" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors group-hover:text-white">
                      Watch Video
                    </span>
                  </button>

                  {/* Option 2: Main Page */}
                  <button
                    onClick={dismiss}
                    className="group relative flex flex-col items-center gap-3 w-28"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-md transition-all group-hover:border-cyan-500/60 group-hover:bg-cyan-500/15 group-hover:scale-110 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors group-hover:text-cyan-300">
                      Main Page
                    </span>
                  </button>

                  {/* Option 3: Game Mode */}
                  <Link
                    href="/game"
                    className="group relative flex flex-col items-center gap-3 w-28"
                    onClick={() => sessionStorage.setItem("splashSeen", "1")}
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-md transition-all group-hover:border-emerald-500/60 group-hover:bg-emerald-500/15 group-hover:scale-110 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><path d="M15 13h.01"></path><path d="M18 11h.01"></path>
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors group-hover:text-emerald-400">
                      Game Mode
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Video + breathing glow ────────────────────────────── */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            {/* Hidden until started; preloaded in background */}
            <motion.div
              animate={{ opacity: started ? 1 : 0, scale: started ? 1 : 0.9 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Breathing glow behind video */}
              <motion.div
                className="absolute -inset-10 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(56,189,248,0.30) 45%, transparent 70%)",
                }}
                animate={{ scale: [1, 1.14, 1], opacity: [0.38, 0.58, 0.38] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              />

              <video
                ref={videoRef}
                src="/splash.mp4"
                playsInline
                preload="auto"
                onEnded={dismiss}
                className="relative z-10 h-[70dvh] w-auto max-w-[92vw] rounded-2xl object-contain"
                style={{
                  filter:
                    "drop-shadow(0 0 36px rgba(124,58,237,0.45)) drop-shadow(0 20px 48px rgba(0,0,0,0.85))",
                }}
              />
            </motion.div>

            {/* Name — shown once video starts */}
            <AnimatePresence>
              {started && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: 0.3, duration: 0.55 }}
                  className="mt-5 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/28">
                    Portfolio of
                  </p>
                  <p className="mt-0.5 text-lg font-black text-white">
                    Kundan <span className="text-violet-400">Srinivas</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Progress bar ─────────────────────────────────────── */}
          <motion.div
            animate={{ opacity: started ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-10 left-1/2 z-20 w-48 -translate-x-1/2"
          >
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, #a78bfa, #38bdf8, #34d399)",
                  transition: "width 0.12s linear",
                  boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                }}
              />
            </div>
          </motion.div>

          {/* ── Skip ─────────────────────────────────────────────── */}
          <motion.button
            animate={{ opacity: started ? 1 : 0 }}
            transition={{ delay: started ? 1.4 : 0, duration: 0.4 }}
            onClick={started ? dismiss : undefined}
            style={{ pointerEvents: started ? "auto" : "none" }}
            className="absolute bottom-[34px] right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold text-white/35 backdrop-blur-md transition-all hover:border-violet-500/40 hover:text-white/70"
          >
            Skip
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
