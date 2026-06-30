"use client";
import { motion } from "framer-motion";
import { GraduationCap, MapPin, Trophy, BookOpen, Zap, Heart, Code2, Brain } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { education, achievements, personalInfo } from "@/lib/data";
import { triggerKai, resetKai } from "@/utils/kaiEvents";

const clr: Record<string, string> = {
  cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  gold: "text-yellow-300 bg-yellow-300/10 border-yellow-300/20",
  orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  purple: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

const passions = [
  { icon: <Brain size={20} />, title: "AI & ML", desc: "Building intelligent systems that solve real problems at scale" },
  { icon: <Code2 size={20} />, title: "Full Stack", desc: "End-to-end ownership from system design to production deployment" },
  { icon: <Zap size={20} />, title: "Hackathons", desc: "Shipping complete, polished products in 24 hours under pressure" },
  { icon: <BookOpen size={20} />, title: "Research", desc: "8 published papers across ML, computer vision, and mobile systems" },
];

export default function About() {
  const passionTrigger = (title: string) => {
    if (title === "AI & ML") return () => triggerKai({ type: "skill", label: "LangChain / Agentic AI" });
    if (title === "Full Stack") return () => triggerKai({ type: "skill", label: "React" });
    if (title === "Hackathons") return () => triggerKai({ type: "hackathon" });
    if (title === "Research") return () => triggerKai({ type: "research" });
    return () => triggerKai({ type: "stat" });
  };

  const achieveTrigger = (title: string) => {
    if (title.toLowerCase().includes("hack")) return () => triggerKai({ type: "hackathon" });
    if (title.toLowerCase().includes("gold") || title.toLowerCase().includes("medal")) return () => triggerKai({ type: "award" });
    if (title.toLowerCase().includes("research") || title.toLowerCase().includes("publish")) return () => triggerKai({ type: "research" });
    return () => triggerKai({ type: "award" });
  };

  return (
    <div className="page-wrapper pt-24">
      <div className="container-custom section">
        <SectionHeader
          eyebrow="Get to Know Me"
          title="About Kundan"
          subtitle="Full-stack engineer who ships production AI systems, wins hackathons, and publishes research."
        />

        {/* Hero bio */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-3xl p-10 md:p-16 border border-white/6 mb-16"
        >
          <div className="grid md:grid-cols-3 gap-12 items-start">
            {/* Avatar placeholder */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-cyan-600/20 border border-white/10 flex items-center justify-center text-6xl font-black gradient-text">
                KS
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">Kundan Srinivas</h3>
                <p className="text-white/40 text-sm">Sakkuru</p>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <MapPin size={12} />
                Tampa, FL · Open to Relocation
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/25 bg-green-500/10 text-green-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Available for Roles
              </div>
            </div>

            {/* Bio */}
            <div className="md:col-span-2 space-y-7">
              <p className="text-white/70 leading-relaxed">
                I&apos;m a full-stack software engineer completing my{" "}
                <span className="text-violet-300 font-semibold">MS in Computer Science at USF</span> (May 2026),
                specializing in production AI systems, cross-platform mobile development, and scalable web applications.
              </p>
              <p className="text-white/60 leading-relaxed">
                I thrive on full end-to-end ownership — from the first system design sketch all the way to
                deployment and iteration with real users. Whether it&apos;s an agentic AI disaster response
                system built in 24 hackathon hours, a neurocognitive Flutter app deployed in live research labs,
                or a Scopus-published CNN — I build things that actually work.
              </p>
              <p className="text-white/60 leading-relaxed">
                Before USF, I graduated with a{" "}
                <span className="text-cyan-300 font-semibold">Gold Medal as Best Outgoing Student</span> (CGPA 9.03/10)
                from R.M.D Engineering College. My background in both academic research and production engineering
                gives me a rare ability to bridge the gap between cutting-edge AI techniques and robust,
                maintainable software systems.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Full Stack", "Agentic AI", "Mobile Dev", "NLP", "Computer Vision", "Production Systems"].map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Passions */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            What I <span className="gradient-text">Love Building</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {passions.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                onMouseEnter={passionTrigger(p.title)}
                onMouseLeave={() => resetKai()}
                className="glass glass-hover border-animated rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
                  {p.icon}
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">{p.title}</h4>
                <p className="text-white/50 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            <span className="gradient-text">Education</span>
          </h3>
          <div className="space-y-6">
            {education.map((edu, i) => (
              <motion.div
                key={edu.school}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                onMouseEnter={() => triggerKai({ type: "graduation" })}
                onMouseLeave={() => resetKai()}
                className="glass glass-hover rounded-2xl p-8 md:p-10 border border-white/6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <GraduationCap size={22} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg mb-0.5">{edu.degree}</h4>
                      <p className="text-violet-300 font-medium mb-1">{edu.school}</p>
                      <div className="flex items-center gap-1.5 text-white/40 text-sm">
                        <MapPin size={12} />
                        {edu.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tag mb-2">{edu.period}</div>
                    <p className="text-yellow-400 text-sm font-semibold">{edu.highlight}</p>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-white/6">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Coursework</p>
                  <div className="flex flex-wrap gap-2">
                    {edu.courses.map((c) => (
                      <span key={c} className="tag tag-blue text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            Awards & <span className="gradient-text">Achievements</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                onMouseEnter={achieveTrigger(a.title)}
                onMouseLeave={() => resetKai()}
                className={`glass glass-hover border-animated rounded-2xl p-8 border ${clr[a.color]?.split(" ").slice(2).join(" ") || "border-white/6"}`}
              >
                <div className="text-4xl mb-5">{a.icon}</div>
                <h4 className={`font-bold mb-3 ${clr[a.color]?.split(" ")[0] || "text-white"}`}>
                  {a.title}
                </h4>
                <p className="text-white/50 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
