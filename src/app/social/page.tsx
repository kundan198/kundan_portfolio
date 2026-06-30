"use client";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { Linkedin, Github, Mail, ExternalLink, MapPin, GraduationCap, ArrowLeft, ArrowRight } from "lucide-react";
import { triggerKai, resetKai } from "@/utils/kaiEvents";

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
type KaiType = "graduation" | "hackathon" | "research" | "award" | "photo";

interface Chapter {
  num: string;
  year: string;
  label: string;
  title: string[];
  pullQuote: string;
  story: string[];
  photo?: string;
  kai: KaiType;
  accent: string;
  photoFocus?: string;
}

const CHAPTERS: Chapter[] = [
  {
    num: "01",
    year: "Pre-2020",
    label: "The Spark",
    title: ["Born into", "the AI era."],
    pullQuote: "Programming is the language of computers — and computers were going to rule the coming decades. I needed to master it.",
    story: [
      "Growing up as a millennial, I watched artificial intelligence reshape everything around me. Long before my first class, I was already obsessed with how machines learn — drawn to the elegance of logic and the power of mathematics.",
      "The decision to pursue Computer Science at R.M.D. Engineering College, Chennai, was made not by opportunity or default — but by a deep-seated conviction that this was exactly where I was supposed to be.",
    ],
    kai: "graduation",
    accent: "#818cf8",
  },
  {
    num: "02",
    year: "2020 – 2022",
    label: "First Build",
    title: ["Teaching myself", "at midnight."],
    pullQuote: "When my first voice assistant worked, something locked into place. I had gone from fascination to execution.",
    story: [
      "My curriculum didn't include machine learning. So I built my own. I enrolled in a Udemy ML course on my own time, taught myself regression and classification algorithms, and applied them in projects far beyond the syllabus.",
      "Every failure sharpened the instinct. An unsuccessful mushroom classification project taught me more than any lecture. An anomaly detection experiment gave me my first real taste of production-grade thinking.",
    ],
    photo: "/photos/photo-lobby.jpeg",
    photoFocus: "center 20%",
    kai: "graduation",
    accent: "#a78bfa",
  },
  {
    num: "03",
    year: "2022",
    label: "National Stage",
    title: ["Thousands of", "teams. One goal."],
    pullQuote: "We were runners-up. What I took home was bigger than a trophy — a permanent shift in how I think about building.",
    story: [
      "The Smart India Hackathon — organized by India's Ministry of Education — was my first national proving ground. I assembled a team, built 'Learn4growth': an adaptive education platform for personalized learning at scale.",
      "Competing against thousands of teams nationwide, we finished as runners-up. For the first time I understood that shipping under real pressure — to real judges, real stakes — creates a fundamentally different kind of engineer.",
    ],
    photo: "/photos/hackathon-venue.jpeg",
    photoFocus: "center 40%",
    kai: "hackathon",
    accent: "#34d399",
  },
  {
    num: "04",
    year: "Jan – Jun 2023",
    label: "Industry",
    title: ["Real pipelines.", "Real stakes."],
    pullQuote: "\"A master's program at a reputed university — that's what will close the gap between what you know and what the industry demands.\" — Mr. Vamsi",
    story: [
      "Selected for an internship at YoungMinds, I owned production ML pipelines end-to-end: NLP text classification, predictive analytics, rigorous evaluation across precision, recall, F1, and ROC-AUC.",
      "My mentor Mr. Vamsi pushed me toward what would become the pivotal decision of my early career: pursuing an MS abroad. For the first time, I was building something real users depended on.",
    ],
    kai: "research",
    accent: "#60a5fa",
  },
  {
    num: "05",
    year: "May 2024",
    label: "Four Years of Proof",
    title: ["Gold Medal.", "8 Papers."],
    pullQuote: "The number that mattered most wasn't the GPA. It was the certainty that I had spent four years building something real — and that the best was still ahead.",
    story: [
      "Graduated ranked first across my entire Computer Science cohort — CGPA 9.03 / 10. The university's Gold Medal for Best Outgoing Student. Co-authored 8 peer-reviewed publications spanning ML, computer vision, and mobile systems — one indexed in Scopus.",
      "I walked off the stage in May 2024 with a degree, a medal, 8 papers, and a one-way ticket to Tampa, Florida.",
    ],
    photo: "/photos/award-ceremony.jpeg",
    photoFocus: "center 30%",
    kai: "award",
    accent: "#fbbf24",
  },
  {
    num: "06",
    year: "Aug 2024 →",
    label: "SHIELD Lab · USF",
    title: ["Something scientists", "depend on."],
    pullQuote: "Sub-millisecond precision. Zero data loss across 50+ sessions. Real participants. Real neuroscience.",
    story: [
      "Arrived at USF for an MS in Computer Science and immediately joined SHIELD Lab as the sole Research Software Engineer — building CogniX, a production Flutter app (Android & iOS) used in live neuroscience studies.",
      "100% of manual data entry eliminated. Sub-millisecond Dart isolate timing. A serverless pipeline auto-delivering CSV and PDF reports. 50+ sessions. Zero data loss. This was the first time I built something scientists genuinely depend on.",
    ],
    photo: "/photos/photo-usf.jpeg",
    photoFocus: "center 35%",
    kai: "research",
    accent: "#22d3ee",
  },
  {
    num: "07",
    year: "Feb 2025",
    label: "HackaBull — 2nd Place",
    title: ["24 hours.", "70 million users."],
    pullQuote: "Sub-second end-to-end latency. Two real-time pipelines. A gap that 70M+ people face every day. Built in one day.",
    story: [
      "HackaBull 2025. We built SignBridge — bidirectional real-time speech ↔ sign language. Speech-to-Sign uses NLTK NLP grammar restructuring for ASL/English syntax. Sign-to-Speech uses MediaPipe landmark tracking + Google Gemini + ElevenLabs TTS.",
      "2nd place at HackaBull 2025. We built something that doesn't exist anywhere else in this form — and that's what a 24-hour hackathon is supposed to produce.",
    ],
    photo: "/photos/hackathon-hacking.jpeg",
    photoFocus: "center 25%",
    kai: "hackathon",
    accent: "#f472b6",
  },
  {
    num: "08",
    year: "Apr 2026",
    label: "HackUSF — 3rd Place",
    title: ["Four agents.", "One disaster."],
    pullQuote: "Live Hurricane Helene data. Four autonomous agents in parallel. Real incident command output. Built in 24 hours.",
    story: [
      "HackUSF 2026. BayShield: four autonomous AI agents in parallel — real-time NOAA data ingestion, shelter-capacity optimization, cross-zone resource allocation, synthesized incident command reports. RAG pipeline + live React dashboard over FastAPI WebSocket.",
      "3rd place. Two consecutive MLH hackathons. Two podium finishes. I don't just build under pressure — I build best under it.",
    ],
    photo: "/photos/hackathon-team-mlh.jpeg",
    photoFocus: "center 30%",
    kai: "hackathon",
    accent: "#fb923c",
  },
];

const STATS = [
  { value: 8,    suffix: "",  label: "Research Papers", gradient: "from-violet-400 to-indigo-400" },
  { value: 2,    suffix: "×", label: "MLH Wins",        gradient: "from-emerald-400 to-cyan-400" },
  { value: 9.03, suffix: "",  label: "Undergrad GPA",   gradient: "from-yellow-400 to-amber-400" },
  { value: 4.0,  suffix: "",  label: "GPA at USF",      gradient: "from-cyan-400 to-blue-400" },
];

const GALLERY = [
  { src: "/photos/hackathon-hacking.jpeg",  alt: "Deep in the build",     cls: "row-span-2" },
  { src: "/photos/award-gold-medal.jpeg",   alt: "Gold Medal",            cls: "" },
  { src: "/photos/hackathon-team-usf.jpeg", alt: "Team at USF",           cls: "" },
  { src: "/photos/award-annual-day.jpeg",   alt: "Annual Day ceremony",   cls: "row-span-2" },
  { src: "/photos/news-hindu.jpeg",         alt: "Featured in The Hindu", cls: "" },
  { src: "/photos/photo-fountain.jpeg",     alt: "USF campus",            cls: "" },
];

/* ═══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════════════ */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const isFloat = !Number.isInteger(value);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1800, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(isFloat ? parseFloat((eased * value).toFixed(2)) : Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   DECORATIVE PANEL  (chapters with no photo)
═══════════════════════════════════════════════════════════════ */
function DecorativePanel({ ch }: { ch: Chapter }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: "#030410" }}>
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 480, height: 480, background: `radial-gradient(circle, ${ch.accent}28 0%, transparent 70%)`, filter: "blur(70px)", top: "10%", left: "10%" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 300, height: 300, background: `radial-gradient(circle, ${ch.accent}18 0%, transparent 70%)`, filter: "blur(60px)", bottom: "15%", right: "5%" }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute select-none pointer-events-none font-black leading-none"
        style={{ fontSize: "clamp(200px, 30vw, 380px)", color: ch.accent, opacity: 0.05, bottom: "-5%", right: "-2%" }}>
        {ch.num}
      </div>
      <div className="relative z-10 text-center px-12">
        <motion.p className="font-black leading-none mb-4"
          style={{ fontSize: "clamp(48px, 6vw, 80px)", color: `${ch.accent}18` }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          {ch.label}
        </motion.p>
        <div className="w-16 h-0.5 mx-auto rounded-full" style={{ background: `${ch.accent}50` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TECH OVERLAY  (animated HUD on top of hero photo)
═══════════════════════════════════════════════════════════════ */
function TechOverlay() {
  const DOTS = [0.15, 0.32, 0.52, 0.68, 0.82, 0.24, 0.44, 0.72];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>

      {/* Dot-grid texture */}
      <div className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.45) 1px, transparent 1px)",
          backgroundSize: "38px 38px", opacity: 0.10 }} />

      {/* Corner brackets — top-right */}
      <motion.div className="absolute" style={{ top: 28, right: 28 }}
        initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-10 h-10 border-t-[1.5px] border-r-[1.5px]" style={{ borderColor: "rgba(34,211,238,0.7)" }} />
      </motion.div>
      {/* Corner brackets — bottom-right */}
      <motion.div className="absolute" style={{ bottom: 28, right: 28 }}
        initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <div className="w-10 h-10 border-b-[1.5px] border-r-[1.5px]" style={{ borderColor: "rgba(34,211,238,0.7)" }} />
      </motion.div>
      {/* Corner brackets — top-left */}
      <motion.div className="absolute" style={{ top: 28, left: 28 }}
        initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <div className="w-8 h-8 border-t border-l" style={{ borderColor: "rgba(129,140,248,0.55)" }} />
      </motion.div>

      {/* Floating data particles */}
      {DOTS.map((x, i) => (
        <motion.div key={i}
          className="absolute w-[3px] h-[3px] rounded-full"
          style={{ background: i % 2 === 0 ? "rgba(34,211,238,0.9)" : "rgba(168,139,250,0.9)", left: `${x * 100}%`, bottom: "12%" }}
          animate={{ y: [0, -70, -140], opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 2.8 + i * 0.35, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }} />
      ))}

      {/* Data readout labels */}
      <motion.div className="absolute font-mono select-none"
        style={{ top: 40, left: 36, fontSize: 9, letterSpacing: "0.18em", color: "rgba(34,211,238,0.55)" }}
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 3.2, repeat: Infinity, delay: 0.8 }}>
        USF // SHIELD LAB
      </motion.div>
      <motion.div className="absolute font-mono select-none"
        style={{ bottom: 100, right: 40, fontSize: 9, letterSpacing: "0.18em", color: "rgba(129,140,248,0.55)" }}
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 3.8, repeat: Infinity, delay: 1.5 }}>
        MS CS // 2026
      </motion.div>
      <motion.div className="absolute font-mono select-none"
        style={{ bottom: 116, right: 40, fontSize: 8, letterSpacing: "0.15em", color: "rgba(34,211,238,0.35)" }}
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 2 }}>
        AI / ML ENGINEER
      </motion.div>

      {/* Pulsing center crosshair ring */}
      <motion.div className="absolute rounded-full border"
        style={{ width: 64, height: 64, top: "28%", left: "55%", borderColor: "rgba(34,211,238,0.3)", translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER CAROUSEL  — animation variants
═══════════════════════════════════════════════════════════════ */
/* Photo panel — cinematic opacity+scale crossfade */
const photoVariants = {
  enter:  { opacity: 0, scale: 1.06 },
  center: { opacity: 1, scale: 1,   transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.38, ease: "easeIn" as const } },
};
/* Text container — fade + gentle y lift */
const containerVariants = {
  enter:  { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0,  transition: { staggerChildren: 0.09, delayChildren: 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.22, ease: "easeIn" as const } },
};
/* Individual items — fade + blur + y */
const itemVariants = {
  enter:  { opacity: 0, y: 14, filter: "blur(5px)" },
  center: { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   { opacity: 0,        filter: "blur(2px)", transition: { duration: 0.16 } },
};
const mobileStoryVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 84 : -84, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -84 : 84,
    scale: 0.98,
    transition: { duration: 0.24, ease: "easeIn" as const },
  }),
};

const SWIPE_DISTANCE = 56;
const SWIPE_AXIS_RATIO = 1.2;

function isControlTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, textarea, select, [role='button']"));
}

function isInteractiveSwipeTarget(target: EventTarget | null) {
  return target instanceof Element && (isControlTarget(target) || Boolean(target.closest("[data-mobile-story-deck]")));
}

/* ═══════════════════════════════════════════════════════════════
   STORY CAROUSEL
═══════════════════════════════════════════════════════════════ */
function StoryCarousel() {
  const NAV_OFFSET = 72;
  const sectionRef = useRef<HTMLElement>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const wheelLockRef = useRef(false);
  const releaseUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const ch = CHAPTERS[idx];

  const goTo = useCallback((i: number) => {
    if (i === idx) return;
    setDirection(i > idx ? 1 : -1);
    setIdx(i);
    triggerKai({ type: CHAPTERS[i].kai });
  }, [idx]);
  const next = useCallback(() => { if (idx < CHAPTERS.length - 1) goTo(idx + 1); }, [idx, goTo]);
  const prev = useCallback(() => { if (idx > 0) goTo(idx - 1); }, [idx, goTo]);
  const handleSwipeStart = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" || e.pointerType === "touch" || e.button !== 0 || isInteractiveSwipeTarget(e.target)) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  }, []);

  const handleSwipeEnd = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.pointerId !== e.pointerId) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;

    if (dx < 0) next();
    else prev();
  }, [next, prev]);

  const handleMouseSwipeStart = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    if (e.button !== 0 || isInteractiveSwipeTarget(e.target)) return;
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseSwipeEnd = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    const start = mouseStartRef.current;
    mouseStartRef.current = null;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;

    if (dx < 0) next();
    else prev();
  }, [next, prev]);

  const jumpToAdjacentSection = useCallback((direction: "down" | "up") => {
    const section = sectionRef.current;
    if (!section) return;
    const target = direction === "down" ? section.nextElementSibling : section.previousElementSibling;
    if (!target || !(target instanceof HTMLElement)) return;
    const y = window.scrollY + target.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Date.now() < releaseUntilRef.current) return;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.5;
      const activeZone = rect.top <= viewportMid && rect.bottom >= viewportMid;
      if (!activeZone) return;
      if (Math.abs(e.deltaY) < 1) return;
      if (wheelResetTimerRef.current) window.clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = window.setTimeout(() => { wheelAccumRef.current = 0; }, 140);
      const fullyFocused = rect.top <= 8 && rect.bottom >= window.innerHeight - 8;
      if (!fullyFocused) {
        e.preventDefault();
        if (wheelLockRef.current) return;
        wheelLockRef.current = true;
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top), behavior: "smooth" });
        window.setTimeout(() => { wheelLockRef.current = false; }, 620);
        return;
      }
      if (wheelLockRef.current) { e.preventDefault(); return; }
      wheelAccumRef.current += e.deltaY > 0 ? 1 : -1;
      if (Math.abs(wheelAccumRef.current) < 2) { e.preventDefault(); return; }
      const dirDown = wheelAccumRef.current > 0;
      wheelAccumRef.current = 0;
      if (dirDown && idx < CHAPTERS.length - 1) {
        e.preventDefault(); wheelLockRef.current = true; next();
        window.setTimeout(() => { wheelLockRef.current = false; }, 560); return;
      }
      if (!dirDown && idx > 0) {
        e.preventDefault(); wheelLockRef.current = true; prev();
        window.setTimeout(() => { wheelLockRef.current = false; }, 560); return;
      }
      if (dirDown && idx === CHAPTERS.length - 1) {
        e.preventDefault(); wheelLockRef.current = true;
        jumpToAdjacentSection("down"); releaseUntilRef.current = Date.now() + 900;
        window.setTimeout(() => { wheelLockRef.current = false; }, 620); return;
      }
      if (!dirDown && idx === 0) {
        e.preventDefault(); wheelLockRef.current = true;
        jumpToAdjacentSection("up"); releaseUntilRef.current = Date.now() + 900;
        window.setTimeout(() => { wheelLockRef.current = false; }, 620);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (wheelResetTimerRef.current) window.clearTimeout(wheelResetTimerRef.current);
    };
  }, [idx, next, prev, jumpToAdjacentSection]);

  /* Auto-snap section into full view using IntersectionObserver */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let fired = false;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.intersectionRatio >= 0.45 && !fired) {
          fired = true;
          const r = section.getBoundingClientRect();
          if (r.top > 6) window.scrollTo({ top: window.scrollY + r.top, behavior: "smooth" });
        }
        if (e.intersectionRatio < 0.15) fired = false;
      });
    }, { threshold: [0.15, 0.45] });
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={() => { swipeStartRef.current = null; }}
      onMouseDown={handleMouseSwipeStart}
      onMouseUp={handleMouseSwipeEnd}
      onMouseLeave={() => { mouseStartRef.current = null; }}
      style={{ minHeight: "100vh", paddingTop: `${NAV_OFFSET}px`, touchAction: "pan-y" }}
    >

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-30 bg-white/5">
        <motion.div className="h-full rounded-full" style={{ background: ch.accent }}
          animate={{ width: `${((idx + 1) / CHAPTERS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }} />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex" style={{ minHeight: `calc(100vh - ${NAV_OFFSET}px)` }}>

        {/* LEFT TEXT PANEL */}
        <div className="relative z-10 flex flex-col justify-center flex-shrink-0 overflow-hidden"
          style={{ width: "46%", background: "#030410", padding: "6vh clamp(48px,5vw,88px) 6vh clamp(40px,4vw,72px)" }}>

          {/* Accent glow */}
          <AnimatePresence mode="wait">
            <motion.div key={ch.accent} className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 0% 100%, ${ch.accent}20 0%, transparent 60%)` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }} />
          </AnimatePresence>
          {/* Top-right secondary glow */}
          <AnimatePresence mode="wait">
            <motion.div key={`tr-${ch.accent}`} className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 100% 0%, ${ch.accent}0e 0%, transparent 55%)` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }} />
          </AnimatePresence>

          {/* Chapter counter */}
          <div className="flex items-center gap-3 mb-10">
            <motion.span key={idx} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="font-black text-3xl tabular-nums" style={{ color: ch.accent }}>
              {ch.num}
            </motion.span>
            <div className="h-px flex-1 max-w-[32px] bg-white/12" />
            <span className="text-white/18 font-bold text-sm tabular-nums">08</span>
          </div>

          {/* Animated text */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={idx} variants={containerVariants} initial="enter" animate="center" exit="exit">
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-7">
                  <div className="h-px w-7 flex-shrink-0" style={{ background: ch.accent }} />
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase" style={{ color: ch.accent }}>{ch.label}</span>
                  <span className="text-[10px] text-white/18 tracking-[0.4em] uppercase">{ch.year}</span>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <h2 className="font-black text-white leading-[0.88] mb-8"
                    style={{ fontSize: "clamp(34px, 4vw, 62px)" }}>
                    {ch.title.map((line, i) => <div key={i}>{line}</div>)}
                  </h2>
                </motion.div>
                <motion.div variants={itemVariants} className="border-l-2 pl-5 mb-8"
                  style={{ borderColor: `${ch.accent}55` }}>
                  <p className="italic leading-[1.75]"
                    style={{ fontSize: "clamp(13px, 1.1vw, 15px)", color: `${ch.accent}dd` }}>
                    {ch.pullQuote}
                  </p>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-4">
                  {ch.story.map((para, i) => (
                    <p key={i} className="text-white/42 leading-[1.9]"
                      style={{ fontSize: "clamp(12px, 0.88vw, 13.5px)" }}>
                      {para}
                    </p>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* NAVIGATION */}
          <div className="flex items-center justify-between pt-10 mt-auto">
            <motion.button onClick={prev} disabled={idx === 0}
              className="group flex items-center gap-2.5 disabled:opacity-20"
              whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
              <motion.div className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
                whileHover={{ borderColor: ch.accent, boxShadow: `0 0 14px ${ch.accent}50` }}>
                <ArrowLeft size={13} className="text-white/50 group-hover:text-white transition-colors" />
              </motion.div>
              <span className="text-[10px] font-black tracking-[0.4em] text-white/25 group-hover:text-white/60 uppercase transition-colors">Prev</span>
            </motion.button>

            <div className="flex items-center gap-1.5">
              {CHAPTERS.map((_, i) => (
                <motion.button key={i} onClick={() => goTo(i)} className="rounded-full flex-shrink-0"
                  animate={{ width: i === idx ? 22 : 5, height: 5,
                    backgroundColor: i === idx ? ch.accent : "rgba(255,255,255,0.12)",
                    opacity: i === idx ? 1 : (Math.abs(i - idx) === 1 ? 0.6 : 0.3) }}
                  whileHover={{ opacity: 1, scale: 1.3 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  title={CHAPTERS[i].label} />
              ))}
            </div>

            <motion.button onClick={next} disabled={idx === CHAPTERS.length - 1}
              className="group flex items-center gap-2.5 disabled:opacity-20"
              whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
              <span className="text-[10px] font-black tracking-[0.4em] text-white/25 group-hover:text-white/60 uppercase transition-colors">Next</span>
              <motion.div className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
                whileHover={{ borderColor: ch.accent, boxShadow: `0 0 14px ${ch.accent}50` }}>
                <ArrowRight size={13} className="text-white/50 group-hover:text-white transition-colors" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* RIGHT PHOTO PANEL */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #030410 0%, transparent 100%)" }} />

          <AnimatePresence mode="wait">
            <motion.div key={`tint-${idx}`} className="absolute inset-0 z-[1] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 65% 40%, ${ch.accent}18 0%, transparent 60%)` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }} />
          </AnimatePresence>

          <div className="absolute right-0 top-0 bottom-0 w-10 z-20 flex items-center justify-center pointer-events-none">
            <p className="font-black tracking-[0.5em] uppercase text-[9px] select-none"
              style={{ writingMode: "vertical-rl", color: `${ch.accent}40` }}>
              {ch.label}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={idx} variants={photoVariants} initial="enter" animate="center" exit="exit"
              className="absolute inset-0">
              {ch.photo ? (
                <Image src={ch.photo} alt={ch.title.join(" ")} fill className="object-cover"
                  style={{ objectPosition: ch.photoFocus ?? "center center" }}
                  sizes="54vw" priority={idx === 0} />
              ) : (
                <DecorativePanel ch={ch} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MOBILE */}
      <div className="relative flex flex-col md:hidden overflow-hidden" style={{ minHeight: `calc(100vh - ${NAV_OFFSET}px)` }}>
        <div className="absolute left-4 right-4 top-3 z-30 flex gap-1.5">
          {CHAPTERS.map((chapter, i) => (
            <button key={chapter.num} onClick={() => goTo(i)} aria-label={`Open ${chapter.label}`}
              className="h-3 flex-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45">
              <motion.span className="block h-1 rounded-full"
                animate={{ backgroundColor: i <= idx ? (i === idx ? ch.accent : "rgba(255,255,255,0.46)") : "rgba(255,255,255,0.14)" }}
                transition={{ duration: 0.25 }} />
            </button>
          ))}
        </div>

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div key={idx} custom={direction} variants={mobileStoryVariants}
            initial="enter" animate="center" exit="exit"
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50 || info.velocity.x < -500) next();
              else if (info.offset.x > 50 || info.velocity.x > 500) prev();
            }}
            data-mobile-story-deck
            className="flex flex-1 flex-col cursor-grab active:cursor-grabbing"
            style={{ minHeight: `calc(100vh - ${NAV_OFFSET}px)`, touchAction: "pan-y" }}
            aria-live="polite">
            <div className="relative h-[35vh] min-h-[250px] max-h-[300px] overflow-hidden flex-shrink-0">
              {ch.photo
                ? <Image src={ch.photo} alt={ch.title.join(" ")} fill className="object-cover"
                    style={{ objectPosition: ch.photoFocus ?? "center" }} sizes="100vw" priority={idx === 0} />
                : <DecorativePanel ch={ch} />}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#030410] to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#030410]/70 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#030410]/70 to-transparent pointer-events-none" />
            </div>

            <div className="flex-1 flex flex-col px-5 pb-6 pt-7" style={{ background: "#030410" }}>
              <motion.div variants={containerVariants} initial="enter" animate="center" className="flex-1">
                <motion.div variants={itemVariants} className="mb-5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="h-px w-5 flex-shrink-0" style={{ background: ch.accent }} />
                    <span className="truncate text-[10px] font-black tracking-[0.32em] uppercase" style={{ color: ch.accent }}>{ch.label}</span>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-white/24 tracking-[0.24em] uppercase">{ch.year}</span>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <h2 className="font-black text-white text-[1.9rem] leading-[0.96] mb-5">
                    {ch.title.map((line, i) => <div key={i}>{line}</div>)}
                  </h2>
                </motion.div>
                <motion.div variants={itemVariants} className="border-l pl-4 mb-5"
                  style={{ borderColor: `${ch.accent}55` }}>
                  <p className="italic text-[0.93rem] leading-relaxed" style={{ color: `${ch.accent}d8` }}>{ch.pullQuote}</p>
                </motion.div>
                <motion.div variants={itemVariants} className="max-h-[25vh] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {ch.story.map((para, i) => (
                    <p key={i} className="text-white/48 text-[0.92rem] leading-relaxed mb-3">{para}</p>
                  ))}
                </motion.div>
              </motion.div>

              <div className="flex items-center justify-between gap-4 pt-5 mt-3 border-t border-white/6">
                <button onClick={prev} disabled={idx === 0}
                  className="flex h-10 min-w-0 items-center gap-2 text-white/38 disabled:opacity-20 active:text-white transition-colors">
                  <ArrowLeft size={16} />
                  <span className="text-[10px] font-black tracking-widest uppercase">Prev</span>
                </button>
                <div className="flex min-w-0 flex-1 justify-center gap-1.5">
                  {CHAPTERS.map((chapter, i) => (
                    <motion.button key={chapter.num} onClick={() => goTo(i)} aria-label={`Open ${chapter.label}`}
                      className="h-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
                      animate={{ width: i === idx ? 20 : 8 }}
                      transition={{ duration: 0.3 }}>
                      <motion.span className="block h-1 rounded-full"
                        animate={{ backgroundColor: i === idx ? ch.accent : "rgba(255,255,255,0.16)" }}
                        transition={{ duration: 0.3 }} />
                    </motion.button>
                  ))}
                </div>
                <button onClick={next} disabled={idx === CHAPTERS.length - 1}
                  className="flex h-10 min-w-0 items-center gap-2 text-white/38 disabled:opacity-20 active:text-white transition-colors">
                  <span className="text-[10px] font-black tracking-widest uppercase">Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hint */}
      <motion.div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <div className="flex gap-1">
          {["←", "→"].map((k) => (
            <span key={k} className="text-[9px] font-bold text-white/15 border border-white/8 rounded px-1.5 py-0.5">{k}</span>
          ))}
        </div>
        <span className="text-[9px] text-white/12 tracking-wider uppercase font-semibold">Navigate</span>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Social() {
  return (
    <div className="relative min-h-screen"
      style={{ background: "linear-gradient(160deg, #030410 0%, #05071a 45%, #030511 100%)" }}>

      {/* ══ PAGE-LEVEL BACKGROUND BLOBS ══════════════════════════ */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        {/* Violet — top left, primary */}
        <motion.div className="absolute rounded-full"
          style={{ width: 860, height: 760, top: "-12%", left: "-14%",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.30) 0%, transparent 65%)",
            filter: "blur(130px)" }}
          animate={{ x: [0, 70, -22, 0], y: [0, 44, -12, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
        {/* Cyan — mid right */}
        <motion.div className="absolute rounded-full"
          style={{ width: 640, height: 580, top: "18%", right: "-12%",
            background: "radial-gradient(ellipse, rgba(34,211,238,0.22) 0%, transparent 65%)",
            filter: "blur(110px)" }}
          animate={{ x: [0, -48, 22, 0], y: [0, 58, -16, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
        {/* Pink — bottom left */}
        <motion.div className="absolute rounded-full"
          style={{ width: 720, height: 520, bottom: "4%", left: "-10%",
            background: "radial-gradient(ellipse, rgba(236,72,153,0.16) 0%, transparent 65%)",
            filter: "blur(120px)" }}
          animate={{ x: [0, 52, -14, 0], y: [0, -44, 22, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 8 }} />
        {/* Amber — lower right */}
        <motion.div className="absolute rounded-full"
          style={{ width: 480, height: 420, bottom: "22%", right: "10%",
            background: "radial-gradient(ellipse, rgba(251,191,36,0.12) 0%, transparent 65%)",
            filter: "blur(95px)" }}
          animate={{ x: [0, -32, 18, 0], y: [0, 38, -24, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 12 }} />
      </div>

      {/* Grid texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.038]" style={{ zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.12) 1px,transparent 1px)",
        backgroundSize: "44px 44px" }} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ══════════════════════════════════════════════════════
            HERO  — full-bleed photo with blur-seam merge
        ══════════════════════════════════════════════════════ */}
        <section
          className="relative min-h-screen overflow-hidden"
          onMouseEnter={() => triggerKai({ type: "photo" })}
          onMouseLeave={() => resetKai()}
        >
          {/* Full-bleed photo */}
          <div className="absolute inset-0">
            <Image src="/photos/photo-story-hero.jpeg" alt="Kundan Srinivas" fill priority
              className="object-cover" style={{ objectPosition: "55% 12%" }} sizes="100vw" />

            {/* Subtle overall darkening so the bright brick wall blends into the dark theme */}
            <div className="absolute inset-0" style={{ background: "rgba(3,4,16,0.38)" }} />

            {/* Left dark gradient — text lives here */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to right, #030410 0%, #030410 26%, rgba(3,4,16,0.97) 38%, rgba(3,4,16,0.78) 50%, rgba(3,4,16,0.42) 66%, rgba(3,4,16,0.12) 82%, transparent 100%)"
            }} />
            {/* Top vignette */}
            <div className="absolute top-0 inset-x-0 h-36" style={{ background: "linear-gradient(to bottom, #030410, transparent)" }} />
            {/* Bottom vignette */}
            <div className="absolute bottom-0 inset-x-0 h-64" style={{ background: "linear-gradient(to top, #030410 0%, rgba(3,4,16,0.65) 52%, transparent 100%)" }} />

            {/* ── BLUR SEAM ── creates the name↔photo merge */}
            <div className="absolute top-0 bottom-0 hidden md:block pointer-events-none"
              style={{
                left: "27%", width: "22%",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                background: "linear-gradient(to right, transparent, rgba(3,4,16,0.10) 50%, transparent)",
                maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 28%, rgba(0,0,0,0.9) 72%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 28%, rgba(0,0,0,0.9) 72%, transparent 100%)",
              }} />
          </div>

          {/* ── TECH HUD OVERLAY — right photo side only ── */}
          <div className="absolute top-0 bottom-0 right-0 hidden md:block pointer-events-none"
            style={{ left: "46%" }}>
            <TechOverlay />
          </div>

          {/* ── TEXT PANEL ── */}
          <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 md:px-14 xl:px-24 py-24 md:py-0 w-full md:max-w-[52%]">

            {/* Available badge */}
            <motion.div
              className="inline-flex items-center gap-2 self-start mb-10 px-3.5 py-1.5 rounded-full border border-green-500/28 bg-green-500/[0.07] backdrop-blur-sm cursor-default"
              initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}
              whileHover={{ scale: 1.05, borderColor: "rgba(34,197,94,0.55)", backgroundColor: "rgba(34,197,94,0.12)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-[11px] font-bold tracking-wide">Available · Graduating May 2026</span>
            </motion.div>

            {/* Name — bleeds into the blur seam */}
            <motion.h1 className="font-black text-white leading-[0.86] mb-7"
              style={{ fontSize: "clamp(54px, 7.5vw, 108px)" }}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}>
              Kundan<br />
              <motion.span
                style={{
                  background: "linear-gradient(135deg, #818cf8 0%, #22d3ee 52%, #a855f7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                }}
                animate={{ opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                Srinivas
              </motion.span>
            </motion.h1>

            {/* Tags */}
            <motion.div className="flex flex-wrap gap-2 mb-8"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.7 }}>
              {["Full Stack Engineer", "AI / ML", "Published Researcher"].map((t, i) => (
                <motion.span key={t}
                  className="text-xs font-semibold text-white/52 px-3.5 py-1 rounded-full border border-cyan-300/18 bg-cyan-300/[0.05] backdrop-blur-sm cursor-default"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.33 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                  whileHover={{ scale: 1.08, borderColor: "rgba(103,232,249,0.52)", color: "rgba(255,255,255,0.9)", backgroundColor: "rgba(103,232,249,0.12)" }}>
                  {t}
                </motion.span>
              ))}
            </motion.div>

            {/* Bio */}
            <motion.div className="space-y-3.5 mb-10 max-w-[420px]"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.75 }}>
              <p className="text-white/56 leading-[1.88]" style={{ fontSize: "clamp(14px, 1.05vw, 16px)" }}>
                I build production AI systems, ship full-stack products, and solve hard engineering problems end-to-end — from first design sketch to real users in production.
              </p>
              <p className="text-white/30 leading-[1.88]" style={{ fontSize: "clamp(12.5px, 0.9vw, 14px)" }}>
                Two-time MLH hackathon winner. Gold Medal graduate. Research Software Engineer at SHIELD Lab, USF. Eight published papers.
              </p>
            </motion.div>

            {/* Meta */}
            <motion.div className="flex flex-wrap gap-x-6 gap-y-2 mb-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}>
              {[
                { icon: <MapPin size={12} />, text: "Tampa, FL · Open to Relocation" },
                { icon: <GraduationCap size={12} />, text: "MS CS · USF · May 2026" },
              ].map(({ icon, text }) => (
                <motion.span key={text}
                  className="flex items-center gap-1.5 text-sm text-white/26 cursor-default"
                  whileHover={{ color: "rgba(255,255,255,0.62)" }}
                  transition={{ duration: 0.2 }}>
                  {icon} {text}
                </motion.span>
              ))}
            </motion.div>

            {/* Social buttons */}
            <motion.div className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
              <motion.a href="https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#0A66C2] text-white"
                whileHover={{ scale: 1.07, y: -3, boxShadow: "0 16px 48px rgba(10,102,194,0.58)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Linkedin size={15} /> LinkedIn
              </motion.a>
              <motion.a href="https://github.com/kundan198"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-white/12 bg-white/[0.05] text-white/68 backdrop-blur-sm"
                whileHover={{ scale: 1.07, y: -3, borderColor: "rgba(255,255,255,0.32)", color: "white", boxShadow: "0 12px 38px rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Github size={15} /> GitHub
              </motion.a>
              <motion.a href="mailto:kundansrinivas377@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-white/12 bg-white/[0.05] text-white/68 backdrop-blur-sm"
                whileHover={{ scale: 1.07, y: -3, borderColor: "rgba(129,140,248,0.5)", color: "white", boxShadow: "0 12px 38px rgba(129,140,248,0.24)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Mail size={15} /> Email
              </motion.a>
            </motion.div>
          </div>

          {/* Stat badges */}
          <motion.div className="absolute bottom-24 right-6 z-10 hidden md:flex flex-col gap-3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.92, duration: 0.85, ease: [0.22, 1, 0.36, 1] as const }}>
            {[
              { label: "Research Papers", value: "8",    color: "#818cf8" },
              { label: "Hackathon Wins",  value: "2×",   color: "#34d399" },
              { label: "Undergrad GPA",   value: "9.03", color: "#fbbf24" },
            ].map((s) => (
              <motion.div key={s.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl bg-black/55 cursor-default"
                style={{ borderColor: `${s.color}38`, boxShadow: `0 8px 28px ${s.color}14` }}
                whileHover={{ y: -5, scale: 1.06, boxShadow: `0 20px 56px ${s.color}45`, borderColor: `${s.color}80` }}
                transition={{ type: "spring", stiffness: 340, damping: 22 }}>
                <span className="font-black text-xl" style={{ color: s.color }}>{s.value}</span>
                <span className="text-white/38 text-xs font-semibold tracking-wide">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 group cursor-default">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/22 to-white/10 group-hover:via-white/55 transition-colors duration-500" />
            <span className="text-[9px] tracking-[0.45em] font-bold uppercase text-white/16 group-hover:text-white/40 transition-colors duration-500">Scroll</span>
          </motion.div>
        </section>

        {/* ══ SECTION LABEL ═══════════════════════════════════════ */}
        <div className="px-8 md:px-14 xl:px-24 py-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65 }}
            className="flex items-center gap-5">
            <div className="h-px w-10 bg-gradient-to-r from-violet-500/60 to-transparent" />
            <p className="text-[10px] font-black tracking-[0.55em] text-white/20 uppercase">Eight Chapters</p>
          </motion.div>
        </div>

        {/* ══ CHAPTER CAROUSEL ════════════════════════════════════ */}
        <StoryCarousel />

        {/* ══ STATS ═══════════════════════════════════════════════ */}
        <section className="px-8 md:px-20 py-28 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="flex items-center justify-center gap-5 mb-16">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-violet-500/45" />
            <p className="text-[10px] font-black tracking-[0.55em] text-white/18 uppercase">By the Numbers</p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-violet-500/45" />
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {STATS.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.09 }}
                whileHover={{ y: -10, scale: 1.05, boxShadow: "0 24px 64px rgba(103,232,249,0.18)", transition: { type: "spring", stiffness: 320, damping: 24 } }}
                className="rounded-2xl border border-cyan-300/14 bg-gradient-to-b from-white/[0.058] to-white/[0.015] backdrop-blur-md p-8 text-center cursor-default">
                <p className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-white/24 text-xs font-semibold mt-4 tracking-wide">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ GALLERY ═════════════════════════════════════════════ */}
        <section className="px-8 md:px-20 pb-28 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-6 h-px bg-gradient-to-r from-violet-500/45 to-transparent" />
              <p className="text-[10px] font-black tracking-[0.55em] text-white/18 uppercase">In the Moment</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Real Moments</h2>
          </motion.div>
          <div className="md:hidden -mx-8 overflow-x-auto px-8 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3">
              {GALLERY.map((g, i) => (
                <motion.div key={g.src}
                  initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.06 }}
                  className="relative h-72 w-[78vw] flex-none snap-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <Image src={g.src} alt={g.alt} fill
                    className="object-cover"
                    sizes="78vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="truncate text-[11px] font-bold tracking-wide text-white">{g.alt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-3" style={{ height: "clamp(280px, 40vw, 460px)" }}>
            {GALLERY.map((g, i) => (
              <motion.div key={g.src}
                initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.07 }}
                whileHover={{ scale: 1.03, zIndex: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}
                className={`relative rounded-2xl overflow-hidden group cursor-pointer ${g.cls}`}>
                <Image src={g.src} alt={g.alt} fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 20vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/14 rounded-2xl transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <p className="text-white text-[11px] font-bold tracking-wide truncate">{g.alt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ CTA ═════════════════════════════════════════════════ */}
        <section className="px-8 md:px-20 py-32 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(99,102,241,0.09) 0%, transparent 55%)" }} />
          <motion.div initial={{ opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
            className="max-w-xl relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-10 bg-gradient-to-r from-violet-500 to-cyan-500" />
              <p className="text-[10px] font-black tracking-[0.55em] text-white/18 uppercase">Next Chapter</p>
            </div>
            <h2 className="font-black text-white leading-[0.88] mb-6"
              style={{ fontSize: "clamp(42px, 5.5vw, 80px)" }}>
              Let&apos;s build<br />
              <span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                something great.
              </span>
            </h2>
            <p className="text-white/28 leading-[1.88] mb-12 max-w-md" style={{ fontSize: "clamp(14px, 1vw, 15px)" }}>
              Open to full-stack, AI/ML, and research engineering roles. I ship fast, think in systems, and care deeply about quality at every layer.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.a href="https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #0A66C2)" }}
                whileHover={{ scale: 1.06, y: -3, boxShadow: "0 18px 52px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}>
                <Linkedin size={17} /> LinkedIn Profile <ExternalLink size={13} className="opacity-70" />
              </motion.a>
              <motion.a href="mailto:kundansrinivas377@gmail.com"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold border border-white/10 bg-white/[0.04] text-white/60"
                whileHover={{ scale: 1.06, y: -3, borderColor: "rgba(255,255,255,0.26)", color: "white", boxShadow: "0 14px 44px rgba(255,255,255,0.09)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}>
                <Mail size={17} /> Get In Touch
              </motion.a>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
