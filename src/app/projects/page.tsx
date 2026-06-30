"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, Trophy, BookOpen, Smartphone, Globe, Brain } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { projects } from "@/lib/data";
import { triggerKai, resetKai } from "@/utils/kaiEvents";

const categories = ["All", "AI/ML", "Full Stack", "Mobile", "Research"];

const colorMap: Record<string, string> = {
  purple: "from-violet-600/20 to-violet-600/5 border-violet-500/20",
  cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-500/20",
  blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20",
  violet: "from-violet-500/20 to-indigo-600/5 border-violet-400/20",
  pink: "from-pink-600/20 to-pink-600/5 border-pink-500/20",
  indigo: "from-indigo-600/20 to-indigo-600/5 border-indigo-500/20",
};

const badgeColorMap: Record<string, string> = {
  yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  silver: "bg-slate-400/15 text-slate-300 border-slate-400/25",
  green: "bg-green-500/15 text-green-300 border-green-500/25",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  orange: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  purple: "bg-violet-500/15 text-violet-300 border-violet-500/25",
};

const catIconMap: Record<string, React.ReactNode> = {
  "AI/ML": <Brain size={12} />,
  "Full Stack": <Globe size={12} />,
  "Mobile": <Smartphone size={12} />,
  "Research": <BookOpen size={12} />,
};

export default function Projects() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div className="page-wrapper pt-24">
      <div className="container-custom section">
        <SectionHeader
          eyebrow="My Work"
          title="Featured Projects"
          subtitle="Production-grade systems and research — from 24-hour hackathon builds to Scopus-published papers."
        />

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActive(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-300 ${
                active === cat
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "glass border-white/8 text-white/55 hover:text-white hover:border-white/15"
              }`}
            >
              {catIconMap[cat] && <span>{catIconMap[cat]}</span>}
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((proj, i) => (
              <motion.div
                key={proj.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -8 }}
                onMouseEnter={() => triggerKai({ type: "project", label: proj.title })}
                onMouseLeave={() => resetKai()}
                className={`glass glass-hover border-animated rounded-2xl p-8 flex flex-col bg-gradient-to-br border ${colorMap[proj.color]}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColorMap[proj.badge.color] || "bg-white/5 text-white/60 border-white/10"}`}
                      >
                        {proj.badge.text}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">{proj.title}</h3>
                    <p className="text-white/45 text-xs font-medium">{proj.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/60 leading-relaxed mb-6 flex-1">
                  {proj.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2.5 mb-6">
                  {proj.highlights.slice(0, 3).map((h) => (
                    <div key={h} className="flex items-start gap-2 text-xs text-white/45">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.tech.slice(0, 5).map((t) => (
                    <span key={t} className="tag text-xs py-0.5">{t}</span>
                  ))}
                  {proj.tech.length > 5 && (
                    <span className="tag text-xs py-0.5">+{proj.tech.length - 5}</span>
                  )}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-6 border-t border-white/6">
                  <a
                    href={proj.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    <Github size={14} /> Source
                  </a>
                  <span className="text-white/10">·</span>
                  <span className="flex items-center gap-1.5 text-xs text-white/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {proj.badge.text.includes("Place") || proj.badge.text.includes("Deployed") ? "Production" : "Research"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center text-white/30 py-20 text-sm">
            No projects in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
