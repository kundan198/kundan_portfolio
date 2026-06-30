"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download, Github, Linkedin, Zap, Trophy, BookOpen, Users } from "lucide-react";
import { personalInfo } from "@/lib/data";
import { triggerKai, resetKai } from "@/utils/kaiEvents";

/* ─── Photos ──────────────────────────────────────────────────────────────── */
const galleryPhotos = [
  { src: "/photos/photo-fountain.jpeg",               label: "Houston, TX" },
  { src: "/photos/photo-lobby.jpeg",                  label: "Suited up" },
  { src: "/photos/photo-editorial.jpeg",              label: "The engineer" },
  { src: "/photos/hackathon-venue.jpeg",              label: "HackaBull @ USF" },
  { src: "/photos/hackathon-team-mlh.jpeg",           label: "Team hacker 🏆" },
  { src: "/photos/hackathon-hacking.jpeg",            label: "Building at Muma" },
  { src: "/photos/hackathon-team-usf.jpeg",           label: "Post-win vibes" },
  { src: "/photos/project-bayshield-dashboard.jpeg",  label: "BayShield — Command" },
  { src: "/photos/project-bayshield-evacuation.jpeg", label: "BayShield — Live Map" },
  { src: "/photos/project-signbridge.jpeg",           label: "SignBridge — ASL AI" },
  { src: "/photos/project-bayshield-hero.jpeg",       label: "BayShield — v3.0" },
  { src: "/photos/award-gold-cert.jpeg",              label: "🥇 R.S.M. Gold Medal" },
  { src: "/photos/award-ceremony.jpeg",               label: "Award Ceremony 2024" },
  { src: "/photos/award-gold-medal.jpeg",             label: "The gold itself" },
];

/* ─── Stats ────────────────────────────────────────────────────────────────── */
const stats = [
  { icon: <Zap  size={22} />, value: "6+",   label: "Projects Shipped",  color: "text-violet-400", glow: "rgba(124,58,237,0.3)", kaiType: "stat"      },
  { icon: <Trophy size={22} />, value: "2×",  label: "Hackathon Awards", color: "text-yellow-400", glow: "rgba(234,179,8,0.3)",  kaiType: "hackathon" },
  { icon: <BookOpen size={22} />, value: "8", label: "Research Papers",  color: "text-cyan-400",   glow: "rgba(6,182,212,0.3)", kaiType: "research"  },
  { icon: <Users size={22} />, value: "Real", label: "Production Users", color: "text-green-400",  glow: "rgba(34,197,94,0.3)", kaiType: "stat"      },
] as const;

function HoverLetters({
  text,
  className = "",
  gradient = false,
}: {
  text: string;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <span className={className}>
      {text.split("").map((ch, idx) => (
        <motion.span
          key={`${ch}-${idx}`}
          whileHover={{ y: -8 }}
          transition={{ duration: 0.16 }}
          className={`inline-block cursor-default ${gradient ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-400" : ""}`}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── 3D Tilt Photo Card ───────────────────────────────────────────────────── */
function TiltPhotoCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [14, -14]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-14, 14]),  { stiffness: 180, damping: 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width  - 0.5);
    rawY.set((e.clientY - rect.top)  / rect.height - 0.5);
  }
  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    resetKai();
  }

  return (
    /* Perspective wrapper — must NOT be the motion element */
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => triggerKai({ type: "photo" })}
      style={{ perspective: "1000px" }}
      className="relative w-full h-full cursor-pointer select-none"
    >
      {/* Outer glow rings */}
      <div
        className="absolute inset-[-18px] rounded-[36px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(139,92,246,0.35) 0%, transparent 70%)", filter: "blur(2px)" }}
      />
      <div
        className="absolute inset-[-8px] rounded-[32px] pointer-events-none border border-violet-500/20"
        style={{ boxShadow: "0 0 60px rgba(139,92,246,0.25), 0 0 120px rgba(6,182,212,0.12)" }}
      />

      {/* Tilting card */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full h-full rounded-[28px] overflow-hidden border border-violet-500/30"
      >
        {/* Photo */}
        <Image
          src="/photos/photo-lobby.jpeg"
          alt="Kundan Srinivas"
          fill
          className="object-cover"
          style={{ objectPosition: "50% 5%" }}
          priority
          quality={95}
          sizes="(max-width: 768px) 100vw, 45vw"
        />

        {/* Bottom gradient overlay with name */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 flex flex-col justify-end p-7"
          style={{ background: "linear-gradient(to top, rgba(5,6,15,0.92) 0%, rgba(5,6,15,0.55) 60%, transparent 100%)" }}
        >
          <p className="text-white/45 text-xs font-semibold tracking-[0.18em] uppercase mb-1">Full Stack · AI · Research</p>
          <h2 className="text-white text-2xl font-black tracking-tight leading-none">Kundan Srinivas</h2>
        </div>

        {/* Badge — top right: Hackathon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
          className="absolute top-5 right-5 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-yellow-300 border border-yellow-500/30"
          style={{ background: "rgba(234,179,8,0.14)", backdropFilter: "blur(12px)" }}
        >
          🏆 2× Hackathon Winner
        </motion.div>

        {/* Badge — bottom left: Papers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
          className="absolute bottom-[100px] left-5 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-cyan-300 border border-cyan-500/30"
          style={{ background: "rgba(6,182,212,0.14)", backdropFilter: "blur(12px)" }}
        >
          📄 8 Papers Published
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="page-wrapper">

      {/* ══════════════════════════════════════════════════════════
          HERO — full-screen split
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb w-[600px] h-[600px] bg-violet-600/20 top-[-100px] left-[-150px]" />
          <div className="orb w-[400px] h-[400px] bg-cyan-500/12  bottom-[-80px] right-[-100px]" style={{ animationDelay: "3s" }} />
        </div>

        <div className="container-custom w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* ── LEFT: Photo Card (45%) ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full lg:w-[45%] flex-shrink-0"
              style={{ height: "clamp(340px, 58vh, 680px)" }}
            >
              <TiltPhotoCard />
            </motion.div>

            {/* ── RIGHT: Text (55%) ─────────────────────────────────── */}
            <div className="w-full lg:w-[55%] flex flex-col gap-6">

              {/* Available pill */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                onMouseEnter={() => triggerKai({ type: "available" })}
                onMouseLeave={() => resetKai()}
                className="inline-block cursor-default"
              >
                <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-green-400 border border-green-500/25"
                  style={{ background: "rgba(34,197,94,0.10)", backdropFilter: "blur(10px)" }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Available for SWE / AI roles
                </span>
              </motion.div>

              {/* Name block */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.3 }}
                onMouseEnter={() => triggerKai({ type: "name" })}
                onMouseLeave={() => resetKai()}
                whileHover={{ y: -6 }}
                className="cursor-default"
              >
                <p className="text-violet-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3">
                  Hi, I&apos;m
                </p>
                <h1 className="font-black tracking-tight leading-[0.92] text-5xl sm:text-6xl md:text-8xl">
                  <HoverLetters text="KUNDAN" className="block" gradient />
                  <HoverLetters text="SRINIVAS" className="text-white block" />
                </h1>
              </motion.div>

              {/* Typewriter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-2xl text-white/55 font-medium min-h-8"
              >
                <TypeAnimation
                  sequence={[
                    "Full Stack Engineer", 2200,
                    "AI / ML Engineer", 2200,
                    "Mobile App Developer", 2200,
                    "Published Researcher", 2200,
                    "Hackathon Champion", 2200,
                  ]}
                  wrapper="span"
                  speed={55}
                  repeat={Infinity}
                  className="text-violet-300"
                />
              </motion.div>

              {/* Bio */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                className="text-white/50 text-base md:text-lg leading-relaxed max-w-xl"
              >
                I build production AI systems, cross-platform apps, and scalable web applications.
                MS Computer Science @ USF · May 2026.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
              >
                <Link href="/projects">
                  <button className="btn-primary">
                    <span className="flex items-center gap-2">
                      View Projects <ArrowRight size={16} />
                    </span>
                  </button>
                </Link>
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn-secondary">
                    <Linkedin size={16} />
                    LinkedIn
                  </button>
                </a>
                <a href="/Kundan_Srinivas_Resume.pdf" download="Kundan_Srinivas_Resume.pdf">
                  <button className="btn-secondary">
                    <Download size={16} />
                    Download Resume
                  </button>
                </a>
              </motion.div>

              {/* Social icons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex items-center gap-4 pt-1"
              >
                {[
                  { href: personalInfo.github,   icon: <Github   size={18} />, label: "GitHub" },
                  { href: personalInfo.linkedin,  icon: <Linkedin size={18} />, label: "LinkedIn" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 glass glass-hover px-4 py-2.5 rounded-full text-sm font-medium text-white/55 hover:text-white transition-all border border-white/6"
                  >
                    {s.icon} {s.label}
                  </a>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          AUTO-SCROLL PHOTO GALLERY STRIP
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, var(--bg-primary), transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to left, var(--bg-primary), transparent)" }} />

            <div style={{ overflow: "hidden" }}>
              <div
                className="flex gap-5"
                style={{ animation: "marquee 28s linear infinite", width: "max-content" }}
              >
                {[...galleryPhotos, ...galleryPhotos].map((photo, i) => (
                  <div
                    key={i}
                    className="relative flex-shrink-0 rounded-2xl overflow-hidden group"
                    style={{ width: "200px", height: "280px" }}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.label}
                      fill
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      quality={95}
                      sizes="(min-resolution: 2dppx) 420px, 210px"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-1/2 flex items-end p-4"
                      style={{ background: "linear-gradient(to top, rgba(5,6,15,0.85) 0%, transparent 100%)" }}
                    >
                      <p className="text-white/80 text-xs font-semibold leading-tight">{photo.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════════════════ */}
      <section className="section-sm pt-0">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.03 }}
                onMouseEnter={() => triggerKai({ type: s.kaiType })}
                onMouseLeave={() => resetKai()}
                className="glass glass-hover border-animated rounded-2xl p-5 md:p-7 text-center cursor-default"
                style={{ boxShadow: `0 0 40px ${s.glow}` }}
              >
                <div className={`flex justify-center mb-3 ${s.color}`}>{s.icon}</div>
                <div className={`text-4xl font-black mb-2 ${s.color}`}>{s.value}</div>
                <div className="text-white/40 text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          QUICK INTRO
      ══════════════════════════════════════════════════════════ */}
      <section className="section-sm pt-0">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass rounded-3xl p-10 md:p-16 border border-white/6"
          >
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Left — about text */}
              <div>
                <div className="tag mb-4">About Me</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  I turn ambitious ideas into{" "}
                  <span className="gradient-text">production reality</span>
                </h2>
                <p className="text-white/50 text-lg leading-loose mb-8">
                  Full-stack engineer and AI specialist with a knack for shipping real products.
                  From agentic AI disaster response systems to neurocognitive apps used by real
                  study participants — I build things that work in the wild, not just in demos.
                </p>
                <Link href="/about">
                  <button className="btn-secondary text-sm py-2.5 px-5">
                    More About Me <ArrowRight size={14} />
                  </button>
                </Link>
              </div>

              {/* Right — info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {[
                  { label: "Stack",     value: "React · Flutter · Python · AI" },
                  { label: "Education", value: "MS CS @ USF · BE 9.03 GPA" },
                  { label: "Focus",     value: "AI Systems · Full Stack · Mobile" },
                  { label: "Status",    value: "Open to SWE / AI Roles" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl p-6 border border-white/6 bg-white/[0.02]"
                  >
                    <div className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                    <div className="text-white/70 text-sm font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee keyframe ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
