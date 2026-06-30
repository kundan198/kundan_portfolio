"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Sparkles, Code2, ArrowLeft, Layers, Trophy } from "lucide-react";
import { SKILLS, GROUPS, SkillDef } from "../skillsData";

export default function SkillsCards() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter skills based on search query and category
  const filteredSkills = useMemo(() => {
    return SKILLS.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        skill.category.toLowerCase().includes(search.toLowerCase()) ||
        skill.desc.toLowerCase().includes(search.toLowerCase());

      if (selectedCategory === "All") return matchesSearch;

      const group = GROUPS.find((g) => g.label === selectedCategory);
      const matchesCategory = group ? group.ids.includes(skill.id) : false;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#050414] text-white pt-28 pb-24 relative overflow-hidden">
      {/* Sci-Fi Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute top-[40%] right-[15%] w-[450px] h-[450px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        {/* Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-custom px-4 relative z-10">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link href="/skills" className="group flex items-center gap-1 text-xs font-bold text-violet-400/80 hover:text-violet-400 transition-colors">
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Back to 3D View
              </Link>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Engineering Inventory
            </motion.h1>
            <p className="text-white/40 text-sm mt-2 max-w-xl">
              An interactive database of languages, frameworks, developer tools, and cloud platforms in my tech stack.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 md:p-5">
            <div className="text-center min-w-[70px]">
              <div className="text-2xl font-black text-violet-400">40</div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Total Techs</div>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center min-w-[70px]">
              <div className="text-2xl font-black text-cyan-400">6</div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Categories</div>
            </div>
          </div>
        </div>

        {/* Controls: Search + Categories */}
        <div className="flex flex-col gap-5 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                placeholder="Search technologies, tools, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/10 hover:border-white/15 focus:border-violet-500/50 rounded-2xl text-sm placeholder-white/25 focus:outline-none transition-all"
              />
            </div>

            {/* Filter buttons label */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/30 font-bold uppercase tracking-wider">
              <Layers size={12} /> Filter Category
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {["All", ...GROUPS.map((g) => g.label)].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border whitespace-nowrap"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(56,189,248,0.15) 100%)"
                      : "rgba(255,255,255,0.02)",
                    borderColor: isActive ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "#a78bfa" : "rgba(255,255,255,0.5)",
                    boxShadow: isActive ? "0 0 15px rgba(124,58,237,0.15)" : "none",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill, index) => (
              <motion.div
                layout
                key={skill.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25) }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl p-5 border overflow-hidden flex flex-col justify-between transition-all duration-300"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Glow underglow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle 120px at 50% 120%, ${skill.color}15, transparent)`,
                  }}
                />

                {/* Top: Header Info */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon Container */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors"
                      style={{
                        background: `${skill.color}0c`,
                        borderColor: `${skill.color}25`,
                      }}
                    >
                      <skill.Icon size={20} color={skill.color} />
                    </div>

                    {/* Level Badge */}
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        background: `${skill.color}12`,
                        borderColor: `${skill.color}25`,
                        color: skill.color,
                      }}
                    >
                      {skill.level}%
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base group-hover:text-violet-300 transition-colors">
                    {skill.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-white/40">{skill.category}</span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-[10px] font-semibold text-white/30">{skill.years}</span>
                  </div>

                  <p className="text-white/45 text-xs mt-3 leading-relaxed">
                    {skill.desc}
                  </p>
                </div>

                {/* Bottom: Progress Bar + Project Badges */}
                <div className="mt-5">
                  {/* Progress Meter */}
                  <div className="h-[3px] w-full rounded-full overflow-hidden bg-white/5 mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${skill.level}%`,
                        background: `linear-gradient(90deg, ${skill.color}88, ${skill.color})`,
                        boxShadow: `0 0 8px ${skill.color}60`,
                      }}
                    />
                  </div>

                  {/* Projects */}
                  {skill.projects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skill.projects.map((proj) => (
                        <span
                          key={proj}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold border"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            borderColor: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {proj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredSkills.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center py-20 px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-white/20" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">No technologies match</h3>
            <p className="text-white/45 text-sm max-w-xs">
              Try adjusting your keywords or selecting another category filter.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
