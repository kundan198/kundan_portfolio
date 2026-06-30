"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import type { KaiTrigger } from "@/utils/kaiEvents";

/* ─── Character states ───────────────────────────────────────────────────── */
type CharState =
  | "entering"
  | "idle"
  | "waving"
  | "talking"
  | "thinking"
  | "celebrating"
  | "camera"
  | "reading"
  | "presenting"
  | "coding";

/* ─── Ollama ─────────────────────────────────────────────────────────────── */
const SYSTEM = `You are Kai, an enthusiastic AI guide on Kundan Srinivas Sakkuru's portfolio.
Kundan: MS CS @ USF (May 2026), Full Stack + AI Engineer, Tampa FL.
Projects: BayShield (2× hackathon winner), SignBridge (ASL AI), CogniX (neuroscience mobile app).
8 research papers (1 Scopus). Gold Medal, CGPA 9.03/10. Stack: React, Flutter, Python, FastAPI, LangChain, RAG, PyTorch, Firebase, GCP.
Open to SWE/AI roles May 2026. Navigation: /about /projects /skills /research /experience /contact
Friendly, concise (≤3 sentences), use emojis.`;

/* ─── Skill descriptions ─────────────────────────────────────────────────── */
const SKILL_DESC: Record<string, string> = {
  "Python": "Kundan's primary language — AI pipelines, backend APIs, everything! 🐍",
  "TypeScript / JavaScript": "Type-safe frontend & Node.js dev. Every UI he ships uses it! ⚛️",
  "Java": "Object-oriented backbone — used for Android and backend systems ☕",
  "Dart": "Powers Flutter — Kundan's cross-platform mobile engine 🎯",
  "SQL": "Data querying across PostgreSQL, MySQL and cloud databases 🗄️",
  "React": "Kundan's go-to for beautiful, interactive UIs — including this portfolio! ✨",
  "Flutter / Dart": "Built CogniX with it — a real neuroscience study app at SHIELD Lab 📱",
  "FastAPI": "Lightning-fast Python APIs powering BayShield's backend ⚡",
  "Django": "Full-featured Python web framework for robust REST backends 🌐",
  "REST APIs / WebSocket": "Real-time data pipes — BayShield uses WebSockets for live alerts! 🔌",
  "PyTorch / TensorFlow / Keras": "Deep learning — computer vision models, NLP research, the works 🔥",
  "LangChain / Agentic AI": "The core of BayShield — 4 autonomous AI agents working in parallel 🤖",
  "RAG / Vector Search": "Retrieval-Augmented Generation — gives AI real memory! 🧠",
  "Generative AI (Gemini, GPT)": "Used across projects for generation, summarisation and reasoning ✨",
  "Computer Vision (MediaPipe, OpenCV)": "Powers SignBridge — real-time hand gesture detection! 👋",
  "NLP (NLTK, Transformers)": "Text classification, sentiment analysis, research extraction 📝",
  "Firebase / Firestore": "Real-time database for CogniX and BayShield cloud sync 🔥",
  "PostgreSQL / MySQL": "Relational data — structured, reliable, production-ready 🗄️",
  "MongoDB": "Flexible document storage for fast prototyping and production 🍃",
  "GCP / Cloud Functions": "Serverless backend triggers, ML model hosting, data pipelines ☁️",
  "AWS": "Cloud infrastructure for scalable AI deployments ☁️",
  "ChromaDB / Vector DBs": "Vector storage for semantic search in RAG pipelines 🔍",
};

/* ─── Skill icon badges ──────────────────────────────────────────────────── */
const SKILL_ICONS: Record<string, { emoji: string; color: string; label: string }> = {
  "Python":                                    { emoji: "🐍", color: "#3b82f6",  label: "Python"     },
  "TypeScript / JavaScript":                   { emoji: "⚡", color: "#f7df1e",  label: "TypeScript"  },
  "Java":                                      { emoji: "☕", color: "#f89820",  label: "Java"        },
  "Dart":                                      { emoji: "🎯", color: "#0175c2",  label: "Dart"        },
  "SQL":                                       { emoji: "🗄️", color: "#00758f",  label: "SQL"         },
  "C":                                         { emoji: "©️", color: "#a8b9cc",  label: "C"           },
  "Bash":                                      { emoji: "⬛", color: "#4eaa25",  label: "Bash"        },
  "Swift":                                     { emoji: "🦅", color: "#f05138",  label: "Swift"       },
  "React":                                     { emoji: "⚛️", color: "#61dafb",  label: "React"       },
  "Flutter / Dart":                            { emoji: "💙", color: "#0175c2",  label: "Flutter"     },
  "FastAPI":                                   { emoji: "⚡", color: "#009688",  label: "FastAPI"     },
  "Django":                                    { emoji: "🌿", color: "#44b78b",  label: "Django"      },
  "REST APIs / WebSocket":                     { emoji: "🔌", color: "#ff6b6b",  label: "REST/WS"     },
  "React Native":                              { emoji: "📱", color: "#61dafb",  label: "RN"          },
  "Android SDK (Java)":                        { emoji: "🤖", color: "#3ddc84",  label: "Android"     },
  "iOS / Swift":                               { emoji: "🍎", color: "#f05138",  label: "iOS"         },
  "PyTorch / TensorFlow / Keras":              { emoji: "🔥", color: "#ee4c2c",  label: "PyTorch"     },
  "LangChain / Agentic AI":                    { emoji: "🤖", color: "#1cd3a2",  label: "LangChain"   },
  "RAG / Vector Search":                       { emoji: "🧠", color: "#8b5cf6",  label: "RAG"         },
  "Generative AI (Gemini, GPT)":               { emoji: "✨", color: "#4285f4",  label: "GenAI"       },
  "Computer Vision (MediaPipe, OpenCV)":       { emoji: "👁️", color: "#ff6f00",  label: "CV"          },
  "NLP (NLTK, Transformers)":                  { emoji: "📝", color: "#ff9900",  label: "NLP"         },
  "Scikit-learn":                              { emoji: "📊", color: "#f7931e",  label: "sklearn"     },
  "LLM Evaluation / Prompt Engineering":       { emoji: "🎯", color: "#10b981",  label: "LLM Eval"   },
  "Firebase / Firestore":                      { emoji: "🔥", color: "#ffca28",  label: "Firebase"    },
  "PostgreSQL / MySQL":                        { emoji: "🐘", color: "#336791",  label: "Postgres"    },
  "MongoDB":                                   { emoji: "🍃", color: "#4db33d",  label: "MongoDB"     },
  "GCP / Cloud Functions":                     { emoji: "☁️", color: "#4285f4",  label: "GCP"         },
  "AWS":                                       { emoji: "🌩️", color: "#ff9900",  label: "AWS"         },
  "CI/CD / GitHub Actions":                    { emoji: "⚙️", color: "#2088ff",  label: "CI/CD"       },
  "ChromaDB / Vector DBs":                     { emoji: "🔍", color: "#8b5cf6",  label: "VectorDB"    },
};

/* ─── Contextual Kai responses ───────────────────────────────────────────── */
interface KaiResponse {
  message: string;
  state: CharState;
  badge?: string;
  icon?: { emoji: string; color: string; label: string };
}

function getResponse(trigger: KaiTrigger): KaiResponse {
  switch (trigger.type) {
    case "photo":
      return { message: "📸 Strike a pose! That's Kundan — Full Stack Engineer & AI specialist. He builds things that work!", state: "camera" };
    case "name":
      return { message: "👋 Hey hey! I'm Kundan Srinivas — engineer, researcher, hackathon winner. Let me show you around!", state: "waving" };
    case "graduation":
      return { message: "🎓 GOLD MEDAL! 9.03 GPA — top of the entire cohort at R.M.D. Engineering College. Hard work pays off!", state: "celebrating" };
    case "research":
      return { message: "📚 8 published papers, 1 indexed in Scopus! AI, computer vision, mobile systems — Kundan loves the science!", state: "reading" };
    case "hackathon":
      return { message: "🏆 2 hackathons, 2 prizes, back-to-back! BayShield (HackUSF) + SignBridge (HackaBull). Unstoppable!", state: "celebrating" };
    case "award":
      return { message: "🥇 Gold Medal recipient — best outgoing student 2020–2024! Also covered in Dinakaran & The Hindu!", state: "celebrating" };
    case "experience":
      return { message: "💼 Research Assistant @ SHIELD Lab USF — engineering a production neuroscience app used in real studies!", state: "coding" };
    case "project":
      return {
        message: trigger.label === "BayShield"
          ? "🛡️ BayShield — 4 autonomous AI agents, real NOAA data, built in 24 hours. It WON a hackathon! 🏆"
          : trigger.label === "SignBridge"
          ? "🤟 SignBridge — real-time bidirectional speech ↔ sign language AI. Accessibility at its finest!"
          : trigger.label === "CogniX"
          ? "🧠 CogniX — a Flutter app built for live neuroscience studies at SHIELD Lab, USF!"
          : `🚀 ${trigger.label || "This project"} is one of Kundan's production builds — check the Projects page!`,
        state: "presenting",
        badge: trigger.label,
      };
    case "skill":
      return {
        message: SKILL_DESC[trigger.label || ""] || `⚡ ${trigger.label} — part of Kundan's production stack!`,
        state: "presenting",
        badge: trigger.label,
        icon: SKILL_ICONS[trigger.label || ""],
      };
    case "contact":
      return { message: "💌 Open to SWE & AI roles from May 2026! Hit the Contact page — Kundan would love to connect!", state: "waving" };
    case "available":
      return { message: "🟢 Available! Kundan graduates May 2026 and is actively looking for full-stack & AI roles. Let's talk!", state: "waving" };
    case "stat":
      return {
        message: trigger.label?.includes("Hack")
          ? "🏆 Two hackathon awards — BayShield and SignBridge both won at major MLH events!"
          : trigger.label?.includes("Paper")
          ? "📄 8 peer-reviewed publications! Head to the Research page for all the details."
          : trigger.label?.includes("Project")
          ? "🚀 6+ shipped projects, all in production! BayShield has real users."
          : "⭐ Real production users — not just demos! Kundan ships things that work.",
        state: trigger.label?.includes("Hack") ? "celebrating" : trigger.label?.includes("Paper") ? "reading" : "presenting",
      };
    default:
      return {
        message: [
          "👋 Hi! I'm Kai — hover over anything on the page and I'll tell you about it!",
          "🚀 Hover over Kundan's photo, name, skills or projects — I react to everything!",
          "💡 Try hovering the stats row or a project card — I've got things to say!",
        ][Math.floor(Math.random() * 3)],
        state: "idle",
      };
  }
}

/* ─── Fallback chat responses ────────────────────────────────────────────── */
function getFallback(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("bay") || l.includes("shield")) return "🛡️ BayShield is Kundan's flagship — 4 autonomous AI agents using LangChain, RAG & real NOAA data, built in 24 hours! Won HackUSF 3rd place 🏆";
  if (l.includes("sign")) return "🤟 SignBridge does real-time speech ↔ sign language AI, using MediaPipe + Gemini. Won HackaBull 2nd place!";
  if (l.includes("skill") || l.includes("tech") || l.includes("stack")) return "💻 Full Stack + AI: React, Flutter, Python, FastAPI, LangChain, RAG, PyTorch, Firebase, GCP — shipped across 6+ production projects!";
  if (l.includes("research") || l.includes("paper")) return "📄 8 published papers in AI, computer vision & mobile systems — 1 indexed in Scopus. Head to the Research page!";
  if (l.includes("hire") || l.includes("contact") || l.includes("job")) return "💼 Kundan's available for SWE & AI roles from May 2026! Head to the Contact page — he'd love to chat!";
  if (l.includes("gold") || l.includes("medal") || l.includes("gpa")) return "🥇 Gold Medal, CGPA 9.03/10 — top of the cohort at R.M.D. Engineering College. Also in The Hindu!";
  return "I'm Kai! Running in fallback mode (Ollama not detected), but I can still guide you. What would you like to know about Kundan? 🤖";
}

const IDLE_TIPS = [
  "👋 Hi! I'm Kai — hover anywhere on the page and I'll react!",
  "📸 Try hovering Kundan's photo — I'll do something fun!",
  "⚡ Hover a skill on the Skills page — I'll explain what it's used for!",
  "🚀 Check out the Projects page — hover a card and I'll present it!",
  "🏆 Ask me about BayShield — Kundan's hackathon-winning AI project!",
];

function inferKaiTrigger(target: Element): KaiTrigger | null {
  const el = target.closest(
    "[data-kai-type], a, button, article, img, h1, h2, [class*='skill'], [class*='project'], [class*='photo'], [class*='card']"
  );
  if (!el || el.closest("[data-kai-ignore='true']")) return null;

  const explicitType = el.getAttribute("data-kai-type") as KaiTrigger["type"] | null;
  const label =
    el.getAttribute("data-kai-label") ||
    el.getAttribute("aria-label") ||
    el.textContent?.replace(/\s+/g, " ").trim().slice(0, 42) ||
    "";

  if (explicitType) return { type: explicitType, label };
  if (el.tagName === "IMG" || label.toLowerCase().includes("photo")) return { type: "photo", label };
  if (label.toLowerCase().includes("resume") || label.toLowerCase().includes("hire") || label.toLowerCase().includes("contact")) {
    return { type: "contact", label };
  }
  if (label.toLowerCase().includes("project") || label.toLowerCase().includes("bayshield") || label.toLowerCase().includes("signbridge") || label.toLowerCase().includes("cognix")) {
    return { type: "project", label };
  }
  if (label.toLowerCase().includes("skill") || /python|react|flutter|fastapi|firebase|langchain|pytorch|tensorflow|typescript/i.test(label)) {
    return { type: "skill", label };
  }
  if (label.toLowerCase().includes("experience") || label.toLowerCase().includes("research software") || label.toLowerCase().includes("youngminds")) {
    return { type: "experience", label };
  }
  if (label.toLowerCase().includes("research") || label.toLowerCase().includes("paper")) return { type: "research", label };
  if (label.toLowerCase().includes("award") || label.toLowerCase().includes("hackathon")) return { type: "hackathon", label };
  if (el.tagName === "H1" || el.tagName === "H2") return { type: "name", label };
  return { type: "stat", label };
}

/* ─── SVG Character ──────────────────────────────────────────────────────── */
interface PoseConfig {
  lArmRot:      number;   // left  arm rotation (deg, CCW = up)
  rArmRot:      number;   // right arm rotation (deg, CCW = up)
  lLegRot:      number;   // left  leg rotation (neg = kick left)
  rLegRot:      number;   // right leg rotation (pos = kick right)
  headTilt:     number;   // head tilt (neg = tilt left)
  headY:        number;   // head vertical offset
  mouthOpen:    boolean;
  eyesUp:       boolean;
  bigSmile:     boolean;
  eyebrowRaise: number;   // positive = raised/happy, negative = furrowed/serious
}

const POSES: Record<CharState, PoseConfig> = {
  //              lArm   rArm   lLeg  rLeg  headT  headY  mouth   eyeUp  smile  brow
  entering:    { lArmRot:  -16, rArmRot:  16,  lLegRot:  -8, rLegRot:  8,  headTilt:  0,  headY:  0, mouthOpen: false, eyesUp: false, bigSmile: true,  eyebrowRaise:  3 },
  idle:        { lArmRot:   10, rArmRot: -10,  lLegRot:  -4, rLegRot:  4,  headTilt:  0,  headY:  0, mouthOpen: false, eyesUp: false, bigSmile: false, eyebrowRaise:  0 },
  waving:      { lArmRot:   36, rArmRot: -88,  lLegRot:   0, rLegRot: 16,  headTilt:  9,  headY:  0, mouthOpen: false, eyesUp: false, bigSmile: true,  eyebrowRaise:  4 },
  talking:     { lArmRot:   12, rArmRot: -42,  lLegRot:   0, rLegRot:  6,  headTilt:  4,  headY:  0, mouthOpen: true,  eyesUp: false, bigSmile: false, eyebrowRaise:  1 },
  thinking:    { lArmRot:    8, rArmRot: -44,  lLegRot:  18, rLegRot:  0,  headTilt: -14, headY: -2, mouthOpen: false, eyesUp: true,  bigSmile: false, eyebrowRaise: -3 },
  celebrating: { lArmRot:  -82, rArmRot: -82,  lLegRot: -32, rLegRot: 32,  headTilt: 12,  headY: -5, mouthOpen: true,  eyesUp: false, bigSmile: true,  eyebrowRaise:  6 },
  camera:      { lArmRot:  -54, rArmRot: -54,  lLegRot:  10, rLegRot: -6,  headTilt:  2,  headY:  0, mouthOpen: false, eyesUp: false, bigSmile: true,  eyebrowRaise:  2 },
  reading:     { lArmRot:   32, rArmRot:  32,  lLegRot:   0, rLegRot:  0,  headTilt: -20, headY: 5, mouthOpen: false, eyesUp: true,  bigSmile: false, eyebrowRaise: -1 },
  presenting:  { lArmRot:   18, rArmRot: -60,  lLegRot: -14, rLegRot: 10,  headTilt:  7,  headY:  0, mouthOpen: false, eyesUp: false, bigSmile: true,  eyebrowRaise:  3 },
  coding:      { lArmRot:   26, rArmRot:  26,  lLegRot:   6, rLegRot: -6,  headTilt: -10, headY: 3, mouthOpen: false, eyesUp: true,  bigSmile: false, eyebrowRaise: -1 },
};

function KaiSVG({
  state,
  pupilOffset = { x: 0, y: 0 },
  isBlinking = false,
}: {
  state: CharState;
  pupilOffset?: { x: number; y: number };
  isBlinking?: boolean;
}) {
  const pose = POSES[state];
  const sp = { type: "spring" as const, stiffness: 200, damping: 20 };

  /* Derived eyebrow paths — arc control point moves with eyebrowRaise */
  const ebY = pose.eyebrowRaise;
  const lBrow = `M19 ${17.5 - ebY} Q23 ${16 - ebY} 27 ${17.5 - ebY}`;
  const rBrow = `M33 ${17.5 - ebY} Q37 ${16 - ebY} 41 ${17.5 - ebY}`;

  /* Eye shape: squint when smiling big, wide when surprised */
  const eyeRY = pose.bigSmile ? 2.2 : pose.eyesUp ? 2 : 3.5;
  const pupilY = pose.eyesUp ? 21 : pose.bigSmile ? 24 : 23.5;

  const currentEyeRY = isBlinking ? 0.2 : eyeRY;

  return (
    <svg viewBox="-8 0 76 124" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        {/* Skin volumetric gradient */}
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3bca2" />
          <stop offset="100%" stopColor="#c8956c" />
        </linearGradient>

        {/* Hair depth gradient */}
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c1a14" />
          <stop offset="60%" stopColor="#180600" />
          <stop offset="100%" stopColor="#0a0200" />
        </linearGradient>

        {/* Suit gradient */}
        <linearGradient id="suitGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        {/* Shadow filter */}
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Ground shadow — shrinks when celebrating (character is jumping) */}
      <motion.ellipse
        cx="30" cy="121"
        animate={{ rx: state === "celebrating" ? 12 : 20, ry: state === "celebrating" ? 2 : 3.5, opacity: state === "celebrating" ? 0.25 : 0.4 }}
        transition={sp}
        fill="rgba(0,0,0,0.45)"
      />

      {/* ══ LEGS ══════════════════════════════════════════════════════════ */}
      {/* Left leg */}
      <motion.g
        style={{ transformOrigin: "22px 76px" }}
        animate={{
          rotate: state === "entering"
            ? [0, -14, 0]
            : pose.lLegRot,
        }}
        transition={state === "entering"
          ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
          : sp}
      >
        <rect x="17" y="74" width="11" height="30" rx="5.5" fill="url(#suitGrad)" />
        {/* Shoe */}
        <rect x="11" y="100" width="18" height="8" rx="4" fill="#0f172a" />
        <rect x="11" y="100" width="18" height="4" rx="3" fill="#1e1b4b" />
      </motion.g>

      {/* Right leg */}
      <motion.g
        style={{ transformOrigin: "38px 76px" }}
        animate={{
          rotate: state === "entering"
            ? [0, 14, 0]
            : pose.rLegRot,
        }}
        transition={state === "entering"
          ? { duration: 0.55, repeat: Infinity, ease: "easeInOut", delay: 0.27 }
          : sp}
      >
        <rect x="32" y="74" width="11" height="30" rx="5.5" fill="url(#suitGrad)" />
        {/* Shoe */}
        <rect x="31" y="100" width="18" height="8" rx="4" fill="#0f172a" />
        <rect x="31" y="100" width="18" height="4" rx="3" fill="#1e1b4b" />
      </motion.g>

      {/* Torso & Arms breathing container (scaleY slightly, origin at bottom) */}
      <motion.g
        style={{ transformOrigin: "30px 76px" }}
        animate={{
          scaleY: state === "idle" || state === "thinking" ? [1, 1.025, 1] : 1,
          y: state === "idle" || state === "thinking" ? [0, -0.5, 0] : 0,
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* ══ Torso ══════════════════════════════════════════════════════════ */}
        <rect x="16" y="44" width="28" height="32" rx="7" fill="url(#suitGrad)" filter="url(#softShadow)" />
        {/* Shirt / collar details */}
        <rect x="25" y="44" width="10" height="32" fill="white" opacity="0.92" />
        <path d="M25 44 L20 55 L30 44Z" fill="#4f46e5" />
        <path d="M35 44 L40 55 L30 44Z" fill="#4f46e5" />
        <path d="M28 51 L30 60 L32 51 L30 48Z" fill="#7c3aed" />
        {/* Pocket */}
        <rect x="17" y="52" width="6" height="5" rx="1.5" fill="rgba(255,255,255,0.28)" />
        <path d="M20 52 L20 57" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* ══ LEFT ARM ══════════════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "11px 48px" }}
          animate={{
            rotate: state === "entering"
              ? [0, 18, 0]
              : state === "celebrating"
              ? [pose.lArmRot - 8, pose.lArmRot + 8, pose.lArmRot - 8]
              : pose.lArmRot,
          }}
          transition={
            state === "entering"
              ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
              : state === "celebrating"
              ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
              : sp
          }
        >
          <rect x="6" y="44" width="11" height="26" rx="5.5" fill="url(#suitGrad)" />
          {/* Hand */}
          <ellipse cx="11.5" cy="72" rx="6" ry="5.5" fill="url(#skinGrad)" />
          {/* Thumb */}
          <ellipse cx="6.5" cy="70" rx="2.5" ry="2" fill="url(#skinGrad)" opacity="0.9" />
        </motion.g>

        {/* ══ RIGHT ARM ══════════════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "49px 48px" }}
          animate={
            state === "waving"
              ? { rotate: [-15, -88, -30, -88, -15] }
              : state === "entering"
              ? { rotate: [0, -18, 0] }
              : state === "celebrating"
              ? { rotate: [pose.rArmRot - 8, pose.rArmRot + 8, pose.rArmRot - 8] }
              : { rotate: pose.rArmRot }
          }
          transition={
            state === "waving"
              ? { duration: 0.75, repeat: Infinity, ease: "easeInOut" }
              : state === "entering"
              ? { duration: 0.55, repeat: Infinity, ease: "easeInOut", delay: 0.27 }
              : state === "celebrating"
              ? { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }
              : sp
          }
        >
          <rect x="43" y="44" width="11" height="26" rx="5.5" fill="url(#suitGrad)" />
          {/* Hand */}
          <ellipse cx="48.5" cy="72" rx="6" ry="5.5" fill="url(#skinGrad)" />
          <ellipse cx="53.5" cy="70" rx="2.5" ry="2" fill="url(#skinGrad)" opacity="0.9" />

          {/* Pointing finger for presenting */}
          {state === "presenting" && (
            <ellipse cx="54" cy="65" rx="2.2" ry="4" fill="url(#skinGrad)" transform="rotate(-20 54 65)" />
          )}
        </motion.g>
      </motion.g>

      {/* ══ NECK ══════════════════════════════════════════════════════════ */}
      <rect x="26" y="36" width="8" height="11" rx="3.5" fill="url(#skinGrad)" />

      {/* ══ HEAD (Breathing out-of-phase container) ══════════════════════════ */}
      <motion.g
        animate={{
          y: state === "idle" || state === "thinking" ? [0, 0.45, 0] : 0
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6, // out of phase with torso
        }}
      >
        <motion.g
          style={{ transformOrigin: "30px 23px" }}
          animate={{ rotate: pose.headTilt, y: pose.headY }}
          transition={sp}
        >
          <circle cx="30" cy="23" r="19" fill="url(#skinGrad)" filter="url(#softShadow)" />

          {/* ── Hair — modern swept pompadour ── */}
          <path d="M11 26 C10 8 14 -1 30 1 C46 -1 50 8 49 26 C47 13 42 8 36 8 C30 3 23 4 19 10 C15 14 12 20 11 26Z" fill="url(#hairGrad)" />
          <path d="M18 12 C20 1 26 -6 33 -3 C41 -2 45 5 43 13 C39 4 34 2 29 4 C24 6 20 9 18 12Z" fill="url(#hairGrad)" />
          {/* Highlight streak */}
          <path d="M21 9 C24 3 28 0 33 1 C29 5 25 7 21 9Z" fill="#582d1c" opacity="0.65" />
          <path d="M27 3 C29 0 32 -1 35 0" stroke="#3e1b0e" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Sideburns */}
          <path d="M11 26 C9 32 10 37 13 35 C11 29 12 22 11 26Z" fill="url(#hairGrad)" />
          <path d="M49 26 C51 32 50 37 47 35 C49 29 48 22 49 26Z" fill="url(#hairGrad)" />

          {/* Ears */}
          <ellipse cx="11" cy="24" rx="3.2" ry="3.8" fill="url(#skinGrad)" />
          <ellipse cx="49" cy="24" rx="3.2" ry="3.8" fill="url(#skinGrad)" />

          {/* ── Eyes (Sclera) ── */}
          <ellipse cx="23" cy="23" rx="4.2" ry={currentEyeRY} fill="white" />
          <ellipse cx="37" cy="23" rx="4.2" ry={currentEyeRY} fill="white" />

          {/* ── Pupils with Cursor Tracking ── */}
          {!isBlinking && (
            <motion.g animate={{ y: pose.eyesUp ? -2 : 0 }} transition={sp}>
              {/* Left Pupil */}
              <circle cx={23.5 + pupilOffset.x} cy={pupilY + pupilOffset.y} r="2.6" fill="#2d1500" />
              <circle cx={24.5 + pupilOffset.x} cy={pupilY - 0.8 + pupilOffset.y} r="1" fill="white" />

              {/* Right Pupil */}
              <circle cx={37.5 + pupilOffset.x} cy={pupilY + pupilOffset.y} r="2.6" fill="#2d1500" />
              <circle cx={38.5 + pupilOffset.x} cy={pupilY - 0.8 + pupilOffset.y} r="1" fill="white" />
            </motion.g>
          )}

          {/* Eyelid crease line when closed (blinking) */}
          {isBlinking && (
            <>
              <path d="M19 23 L27 23" stroke="#2d1500" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M33 23 L41 23" stroke="#2d1500" strokeWidth="1.6" strokeLinecap="round" />
            </>
          )}

          {/* ── Animated eyebrows ── */}
          <motion.path
            animate={{ d: lBrow }}
            transition={sp}
            stroke="#1a0800" strokeWidth="2" strokeLinecap="round" fill="none"
          />
          <motion.path
            animate={{ d: rBrow }}
            transition={sp}
            stroke="#1a0800" strokeWidth="2" strokeLinecap="round" fill="none"
          />

          {/* ── Mouth with Dynamic organic lip-sync when talking ── */}
          <motion.path
            stroke="#8b4513" strokeWidth="2.2" strokeLinecap="round" fill="none"
            animate={
              state === "talking"
                ? {
                    d: [
                      "M25 30 Q30 30 35 30", // Mmm
                      "M24 30 Q30 35 36 30", // Ah
                      "M26 30 Q30 38 34 30", // Oh
                      "M24 30 Q30 32 36 30", // Eh
                      "M25 30 Q30 36 35 30", // Uh
                      "M25 30 Q30 30 35 30"  // Mmm
                    ]
                  }
                : pose.mouthOpen
                ? { d: ["M25 30 Q30 34 35 30", "M25 30 Q30 38 35 30", "M25 30 Q30 34 35 30"] }
                : pose.bigSmile
                ? { d: "M22 30 Q30 38 38 30" }
                : { d: "M26 30 Q30 34 34 30" }
            }
            transition={
              state === "talking"
                ? { duration: 0.95, repeat: Infinity, ease: "easeInOut" }
                : pose.mouthOpen
                ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
                : sp
            }
          />

          {/* ── Blush ── */}
          <motion.ellipse cx="18" cy="28" rx="4.5" ry="3"
            animate={{ opacity: pose.bigSmile || pose.mouthOpen || state === "talking" ? 1 : 0.5 }}
            transition={sp}
            fill="rgba(220,80,60,0.32)" />
          <motion.ellipse cx="42" cy="28" rx="4.5" ry="3"
            animate={{ opacity: pose.bigSmile || pose.mouthOpen || state === "talking" ? 1 : 0.5 }}
            transition={sp}
            fill="rgba(220,80,60,0.32)" />

          {/* ── State overlays ── */}
          {state === "camera" && (
            <>
              <path d="M11 12 L11 8 L15 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M49 12 L49 8 L45 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M11 34 L11 38 L15 38" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M49 34 L49 38 L45 38" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              <motion.circle cx="30" cy="3" r="2.5" fill="#fbbf24"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
            </>
          )}

          {state === "thinking" && (
            <ellipse cx="30" cy="38" rx="5" ry="3" fill="url(#skinGrad)" opacity="0.8" />
          )}

          {state === "celebrating" && (
            <g>
              <rect x="14" y="4" width="32" height="5" rx="1.5" fill="#1e1b4b" />
              <rect x="24" y="0" width="12" height="6" rx="2" fill="#312e81" />
              <path d="M42 6 L46 16" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              <motion.circle cx="46" cy="17" r="3" fill="#fbbf24"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} />
            </g>
          )}

          {state === "reading" && (
            <g>
              <rect x="17" y="34" width="26" height="18" rx="2.5" fill="#f0f9ff" filter="url(#softShadow)" />
              <line x1="30" y1="34" x2="30" y2="52" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="19" y1="38" x2="28" y2="38" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="19" y1="41" x2="28" y2="41" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="19" y1="44" x2="26" y2="44" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="32" y1="38" x2="41" y2="38" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="32" y1="41" x2="41" y2="41" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="32" y1="44" x2="39" y2="44" stroke="#7dd3fc" strokeWidth="1" />
            </g>
          )}

          {state === "coding" && (
            <g>
              <rect x="18" y="33" width="24" height="16" rx="2.5" fill="#1e1b4b" filter="url(#softShadow)" />
              <rect x="20" y="35" width="20" height="12" rx="1.5" fill="#312e81" />
              <motion.rect x="20" y="35" width="20" height="12" rx="1.5"
                fill="rgba(139,92,246,0.3)"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
              <text x="21.5" y="43.5" fontSize="6" fill="#a5f3fc" fontFamily="monospace">&lt;/&gt;</text>
              <rect x="16" y="49" width="28" height="3" rx="1.5" fill="#334155" />
            </g>
          )}
        </motion.g>
      </motion.g>

      {/* ── EXTERNAL STATE EFFECTS ══════════════════════════════════════ */}
      {state === "thinking" && (
        <g>
          <motion.circle cx="8" cy="22" r="2.8" fill="rgba(167,139,250,0.65)"
            animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.8, repeat: Infinity }} />
          <motion.circle cx="4" cy="14" r="4" fill="rgba(167,139,250,0.5)"
            animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }} />
          <motion.circle cx="0" cy="5" r="5.5" fill="rgba(167,139,250,0.4)"
            animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }} />
          <text x="-7" y="9" fontSize="8" fill="rgba(255,255,255,0.9)">🤔</text>
        </g>
      )}

      {state === "celebrating" && (
        <g>
          {([
            [-12, 12,  "⭐", 1.4],
            [ 52,  6,  "✨", 1.1],
            [ -8, 40,  "🌟", 1.6],
            [ 55, 35,  "🎉", 1.3],
          ] as [number, number, string, number][]).map(([x, y, star, dur], i) => (
            <motion.text key={i} x={x} y={y} fontSize="10" textAnchor="middle"
              animate={{ scale: [0.6, 1.3, 0.6], opacity: [0.5, 1, 0.5], y: [y, y - 6, y] }}
              transition={{ duration: dur, repeat: Infinity, delay: i * 0.28 }}>
              {star}
            </motion.text>
          ))}
        </g>
      )}

      {/* WAVING — sparkle near waving hand */}
      {state === "waving" && (
        <motion.text x="54" y="8" fontSize="10" textAnchor="middle"
          animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.4, 1, 0.4], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 1, repeat: Infinity }}>
          👋
        </motion.text>
      )}

      {/* PRESENTING — speech bubble sparkle */}
      {state === "presenting" && (
        <motion.text x="58" y="30" fontSize="8" textAnchor="middle"
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}>
          💡
        </motion.text>
      )}
    </svg>
  );
}

/* ─── Chat Panel ─────────────────────────────────────────────────────────── */
type Msg = { role: "user" | "assistant"; content: string };

function ChatPanel({
  onClose,
  ollamaModel,
  ollamaUrl,
}: {
  onClose: () => void;
  ollamaModel: string | null;
  ollamaUrl: string | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "👋 Hi! I'm Kai — ask me anything about Kundan's work, projects, or how to hire him!" },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    setStreaming(true);
    const newMsgs: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    try {
      let reply: string;
      if (ollamaUrl && ollamaModel) {
        // Direct browser → Ollama (works locally regardless of hosting)
        const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            stream: false,
            messages: [
              { role: "system", content: SYSTEM },
              ...newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 1200) })),
            ],
            options: { temperature: 0.55, num_predict: 220 },
          }),
        });
        const data = await ollamaRes.json();
        reply = data?.message?.content || getFallback(msg);
      } else {
        // Server-side proxy (for self-hosted deployments with OLLAMA_HOST env var)
        const res = await fetch("/api/character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, model: ollamaModel, messages: newMsgs }),
        });
        const data: { reply?: string; offline?: boolean; model?: string } = await res.json();
        reply = data.reply || getFallback(msg);
      }
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops! Try again? 🤔" }]);
    }
    setStreaming(false);
  }, [input, messages, streaming, ollamaModel, ollamaUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.88 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="w-[320px] rounded-3xl border border-violet-500/25 shadow-2xl shadow-violet-500/20 flex flex-col overflow-hidden"
      style={{ background: "rgba(8,6,22,0.96)", backdropFilter: "blur(28px)", maxHeight: 460 }}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.28),rgba(124,58,237,0.18))" }}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-base">🤖</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm">Kai — Portfolio Guide</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${ollamaModel ? "bg-green-400" : "bg-amber-400"}`} />
            <span className={`text-[10px] truncate ${ollamaModel ? "text-green-400/70" : "text-amber-400/70"}`}>
              {ollamaModel ? `Ollama · ${ollamaModel}` : "Smart fallback mode"}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] flex-shrink-0 mr-2 mt-1">🤖</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white/7 text-white/85 rounded-bl-sm border border-white/8"}`}>
              {m.content || <span className="flex gap-1">{[0,1,2].map(i => <motion.span key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} className="text-violet-400 text-base">•</motion.span>)}</span>}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] flex-shrink-0">🤖</div>
            <div className="bg-white/7 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0,1,2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400" animate={{ y: [0,-6,0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.15 }} />)}
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {["Tell me about BayShield 🛡️", "What's Kundan's stack? 💻", "How to hire him? 💼"].map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-[11px] px-3 py-1.5 rounded-xl border border-violet-500/30 text-violet-300/80 hover:text-violet-200 hover:border-violet-500/60 hover:bg-violet-500/10 transition-all">
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-white/8 flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask Kai anything…" disabled={streaming}
            className="flex-1 bg-white/6 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || streaming}
            className="w-10 h-10 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0">
            {streaming ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function KaiAssistant() {
  const [charState, setCharState] = useState<CharState>("entering");
  const [chatOpen, setChatOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [bubble, setBubble] = useState<{ message: string; badge?: string; icon?: { emoji: string; color: string; label: string } } | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [showIdleTip, setShowIdleTip] = useState(false);
  const [ollamaModel, setOllamaModel] = useState<string | null>(null);
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<CharState>("idle");
  const dragRef = useRef(false);           // true while dragging → block click
  const hoverTargetRef = useRef<Element | null>(null);
  const hoverResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Animation states & refs
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);

  /* Gaze Tracking */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const avatarCenterX = rect.left + rect.width / 2;
      const avatarCenterY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - avatarCenterX;
      const deltaY = e.clientY - avatarCenterY;
      const distance = Math.hypot(deltaX, deltaY);
      
      const maxOffset = 2.0; // clamp to +/- 2px for realistic gaze limits
      if (distance === 0) {
        setPupilOffset({ x: 0, y: 0 });
      } else {
        const factor = Math.min(maxOffset, distance / 120);
        setPupilOffset({
          x: (deltaX / distance) * factor,
          y: (deltaY / distance) * factor,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* Natural blink cycle (150ms blink, every 3.0s to 5.5s) */
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        const nextDelay = 3000 + Math.random() * 2500;
        blinkTimeout = setTimeout(triggerBlink, nextDelay);
      }, 150);
    };
    
    const initialDelay = 3000 + Math.random() * 2500;
    blinkTimeout = setTimeout(triggerBlink, initialDelay);
    
    return () => clearTimeout(blinkTimeout);
  }, []);

  /* Check Ollama — direct browser→localhost first, then server-proxy fallback */
  useEffect(() => {
    (async () => {
      // 1. Try direct from the browser (works locally even when site is hosted on Vercel)
      try {
        const res = await fetch("http://localhost:11434/api/tags", {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data: { models?: { name?: string }[] } = await res.json();
          const model = data.models?.find(m => m.name)?.name ?? null;
          if (model) {
            setOllamaModel(model);
            setOllamaUrl("http://localhost:11434");
            return;
          }
        }
      } catch { /* CORS blocked or Ollama not running */ }

      // 2. Server-proxy fallback (for self-hosted deployments with OLLAMA_HOST set)
      try {
        const status = await fetch("/api/character", { signal: AbortSignal.timeout(5000) });
        if (status.ok) {
          const data: { connected?: boolean; model?: string | null } = await status.json();
          if (data.connected && data.model) {
            setOllamaModel(data.model);
            return;
          }
        }
      } catch { /* proxy unavailable */ }

      setOllamaModel(null);
    })();
  }, []);

  /* Entrance */
  useEffect(() => {
    if (dismissed) return;
    const t1 = setTimeout(() => setCharState("waving"), 1600);
    const t2 = setTimeout(() => { setCharState("idle"); setShowIdleTip(true); }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [dismissed]);

  /* Idle tip cycling */
  useEffect(() => {
    if (chatOpen || dismissed) return;
    const id = setInterval(() => {
      setTipIdx(i => (i + 1) % IDLE_TIPS.length);
      if (!bubble) setShowIdleTip(true);
    }, 10000);
    return () => clearInterval(id);
  }, [chatOpen, dismissed, bubble]);

  /* Global kai:trigger listener */
  useEffect(() => {
    if (dismissed) return;
    const handler = (e: Event) => {
      const trigger = (e as CustomEvent<KaiTrigger>).detail;
      if (chatOpen) return;
      if (trigger.type === "reset") {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          setCharState("idle");
          setBubble(null);
          setShowIdleTip(false);
        }, 1800);
        return;
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setShowIdleTip(false);
      const response = getResponse(trigger);
      prevStateRef.current = charState;
      setCharState(response.state);
      setBubble({ message: response.message, badge: response.badge, icon: response.icon });
    };
    window.addEventListener("kai:trigger", handler);
    return () => window.removeEventListener("kai:trigger", handler);
  }, [dismissed, chatOpen, charState]);

  useEffect(() => {
    if (dismissed || minimized || chatOpen) return;

    const selector = "[data-kai-type], a, button, article, img, h1, h2, [class*='skill'], [class*='project'], [class*='photo'], [class*='card']";

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest("[data-kai-ignore='true']")) return;

      const hoverEl = target.closest(selector);
      if (!hoverEl || hoverTargetRef.current === hoverEl) return;

      const trigger = inferKaiTrigger(target);
      if (!trigger) return;

      hoverTargetRef.current = hoverEl;
      if (hoverResetRef.current) clearTimeout(hoverResetRef.current);

      const response = getResponse(trigger);
      setShowIdleTip(false);
      setCharState(response.state);
      setBubble({ message: response.message, badge: response.badge || trigger.label, icon: response.icon });
    };

    const onMouseOut = (event: MouseEvent) => {
      const related = event.relatedTarget;
      if (related instanceof Element && hoverTargetRef.current?.contains(related)) return;
      if (hoverResetRef.current) clearTimeout(hoverResetRef.current);
      hoverResetRef.current = setTimeout(() => {
        hoverTargetRef.current = null;
        setCharState("idle");
        setBubble(null);
      }, 900);
    };

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [dismissed, minimized, chatOpen]);

  if (dismissed) return null;

  if (minimized) {
    return (
      <motion.button
        data-kai-ignore="true"
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-cyan-300/25 bg-black/75 px-4 py-3 text-sm font-bold text-white/80 shadow-2xl shadow-cyan-500/15 backdrop-blur-xl"
      >
        <Maximize2 size={15} className="text-cyan-300" />
        Kai
      </motion.button>
    );
  }

  return (
    <>
      {/* Full-viewport drag constraint layer */}
      <div
        ref={constraintsRef}
        className="fixed pointer-events-none"
        style={{ inset: "8px", zIndex: 49 }}
      />

      <motion.div
        data-kai-ignore="true"
        drag
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.06}
        onDragStart={() => {
          setIsDragging(true);
          dragRef.current = true;
        }}
        onDragEnd={() => {
          setIsDragging(false);
          /* Give a short window so onClick doesn't fire */
          setTimeout(() => { dragRef.current = false; }, 120);
        }}
        whileDrag={{ scale: 1.07 }}
        className="fixed bottom-0 right-3 z-50 flex flex-col items-end gap-2 pb-3 sm:right-6"
        style={{
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "default",
          filter: isDragging
            ? "drop-shadow(0 20px 40px rgba(124,58,237,0.6)) drop-shadow(0 8px 16px rgba(0,0,0,0.5))"
            : "none",
          transition: "filter 0.25s",
        }}
      >
        {/* ── Chat panel ── */}
        <AnimatePresence>
          {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} ollamaModel={ollamaModel} ollamaUrl={ollamaUrl} />}
        </AnimatePresence>

        {/* ── Contextual bubble ── */}
        <AnimatePresence mode="wait">
          {!chatOpen && bubble && (
            <motion.div
              key={bubble.message.slice(0, 30)}
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 12 }}
              transition={{ type: "spring", damping: 18, stiffness: 260 }}
              className="relative rounded-2xl border border-violet-500/35 px-4 py-3 max-w-[230px] shadow-xl shadow-violet-500/15"
              style={{ background: "rgba(8,6,22,0.95)", backdropFilter: "blur(20px)" }}
            >
              {bubble.badge && (
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400/70">Currently looking at</span>
                  <div className="text-xs font-bold text-violet-300 mt-0.5">{bubble.badge}</div>
                </div>
              )}
              <p className="text-white/85 text-sm leading-snug">{bubble.message}</p>
              <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 border-r border-b border-violet-500/35" style={{ background: "rgba(8,6,22,0.95)" }} />
            </motion.div>
          )}

          {/* ── Idle tip ── */}
          {!chatOpen && !bubble && showIdleTip && (
            <motion.div
              key={tipIdx}
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 12 }}
              transition={{ type: "spring", damping: 18, stiffness: 260 }}
              className="relative rounded-2xl border border-violet-500/25 px-4 py-3 max-w-[210px] text-sm text-white/80 cursor-pointer"
              style={{ background: "rgba(8,6,22,0.94)", backdropFilter: "blur(20px)" }}
              onClick={() => { if (!dragRef.current) { setChatOpen(true); setShowIdleTip(false); } }}
            >
              {IDLE_TIPS[tipIdx]}
              <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 border-r border-b border-violet-500/25" style={{ background: "rgba(8,6,22,0.94)" }} />
              <button
                onClick={e => { e.stopPropagation(); setShowIdleTip(false); }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white/12 border border-white/15 text-white/50 flex items-center justify-center text-[10px] hover:bg-white/22 transition-all">×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Drag handle ── */}
        <button
          onClick={() => {
            setChatOpen(false);
            setBubble(null);
            setShowIdleTip(false);
            setMinimized(true);
          }}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/55 text-white/45 transition-colors hover:text-white/80"
          title="Minimize Kai"
        >
          <Minimize2 size={14} />
        </button>

        <motion.div
          onPointerDown={e => dragControls.start(e)}
          animate={{ opacity: isDragging ? 0.7 : 0.25 }}
          whileHover={{ opacity: 0.65, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-1 px-2 py-1 rounded-lg cursor-grab active:cursor-grabbing"
          title="Drag to move Kai"
          style={{ touchAction: "none" }}
        >
          {[0, 1, 2].map(row => (
            <div key={row} className="flex gap-1.5">
              {[0, 1, 2].map(col => (
                <div
                  key={col}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                />
              ))}
            </div>
          ))}
        </motion.div>

        {/* ── Character + skill logo badge ── */}
        <div className="relative">
          {/* Skill logo — floats to the left of the character */}
          <AnimatePresence>
            {!chatOpen && bubble?.icon && (
              <motion.div
                key={bubble.icon.label}
                initial={{ opacity: 0, scale: 0.4, x: 16 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.4, x: 16 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute right-full top-6 mr-3 flex flex-col items-center gap-1.5 pointer-events-none"
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-2xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: `${bubble.icon.color}22`,
                    borderColor: `${bubble.icon.color}70`,
                    boxShadow: `0 0 24px ${bubble.icon.color}50, 0 8px 16px rgba(0,0,0,0.4)`,
                  }}
                >
                  {bubble.icon.emoji}
                </motion.div>
                <span
                  className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full border"
                  style={{
                    color: bubble.icon.color,
                    borderColor: `${bubble.icon.color}50`,
                    background: `${bubble.icon.color}15`,
                  }}
                >
                  {bubble.icon.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ x: 220, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 16, delay: 0.3 }}
            onClick={() => {
              if (dragRef.current) return;
              setChatOpen(o => !o);
              setShowIdleTip(false);
              setBubble(null);
            }}
            whileHover={!isDragging ? { scale: 1.06 } : {}}
            whileTap={!isDragging ? { scale: 0.96 } : {}}
            style={{ cursor: isDragging ? "grabbing" : "pointer" }}
          >
          {/* Body animation — each state has its own personality */}
          <motion.div
            ref={avatarRef}
            animate={
              charState === "idle"
                ? { y: [0, -7, 0], rotate: [0, 1.2, -1.2, 0] }
                : charState === "waving"
                ? { y: [0, -6, 0], rotate: [0, 2, -1, 0] }
                : charState === "talking"
                ? { y: [0, -5, 2, -5, 0], rotate: [0, 1.5, -1.5, 0] }
                : charState === "presenting"
                ? { y: [0, -4, 0], rotate: [0, 0.8, 0] }
                : charState === "celebrating"
                ? { y: [0, -22, -4, -22, 0], rotate: [0, -4, 4, 0] }
                : charState === "thinking"
                ? { y: [0, -3, 0], rotate: [0, -1.5, 0] }
                : charState === "reading"
                ? { y: [0, -2, 0] }
                : charState === "coding"
                ? { y: [0, -2, 0], rotate: [0, -0.5, 0.5, 0] }
                : charState === "camera"
                ? { y: [0, -5, 0], rotate: [0, -1, 1, 0] }
                : {}
            }
            transition={{
              duration:
                charState === "celebrating" ? 0.5
                : charState === "talking"    ? 0.7
                : charState === "waving"     ? 1.2
                : charState === "idle"       ? 3.0
                : 2.0,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-[104px] w-[66px] sm:h-32 sm:w-20"
          >
            <KaiSVG state={charState} isBlinking={isBlinking} pupilOffset={pupilOffset} />
          </motion.div>
          </motion.div>
          </div>

        {/* ── Dismiss ── */}
        <button
          onClick={() => { if (!dragRef.current) setDismissed(true); }}
          className="text-white/15 hover:text-white/40 text-[11px] transition-colors leading-none pb-1"
        >
          dismiss
        </button>
      </motion.div>
    </>
  );
}
