"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Linkedin, Github, MapPin, Send, CheckCircle2, ExternalLink } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

const socials = [
  {
    icon: <Mail size={20} />,
    label: "Email",
    value: "kundansrinivas377@gmail.com",
    href: "mailto:kundansrinivas377@gmail.com",
    color: "violet",
  },
  {
    icon: <Linkedin size={20} />,
    label: "LinkedIn",
    value: "kundan-srinivas-sakkuru",
    href: "https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/",
    color: "blue",
  },
  {
    icon: <Github size={20} />,
    label: "GitHub",
    value: "kundan198",
    href: "https://github.com/kundan198",
    color: "cyan",
  },
  {
    icon: <MapPin size={20} />,
    label: "Location",
    value: "Tampa, FL · Open to Relocation",
    href: null,
    color: "green",
  },
];

const colorMap: Record<string, string> = {
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  green: "bg-green-500/10 border-green-500/20 text-green-400",
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Message could not be sent.");
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper pt-24">
      <div className="container-custom section">
        <SectionHeader
          eyebrow="Get In Touch"
          title="Let's Connect"
          subtitle="Open to SWE, AI Engineering, and research roles. Always happy to discuss interesting projects."
        />

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Left: contact info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass rounded-2xl p-8 border border-green-500/20 bg-green-500/3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-semibold text-sm">Available Now</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Completing MS CS at USF (May 2026). Open to full-time SWE, AI/ML, and Software Engineering roles. Ready to start immediately or after graduation.
              </p>
            </motion.div>

            {/* Socials */}
            <div className="space-y-3">
              {socials.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {s.href ? (
                    <a
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`flex items-center gap-4 glass glass-hover rounded-xl p-5 border group transition-all ${colorMap[s.color]}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorMap[s.color]}`}>
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-0.5">{s.label}</p>
                        <p className="text-white/80 text-sm font-medium truncate group-hover:text-white transition-colors">{s.value}</p>
                      </div>
                      <ExternalLink size={14} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                    </a>
                  ) : (
                    <div className={`flex items-center gap-4 glass rounded-xl p-4 border ${colorMap[s.color]}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorMap[s.color]}`}>
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-0.5">{s.label}</p>
                        <p className="text-white/80 text-sm font-medium">{s.value}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl p-10 border border-white/6">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-2xl mb-2">Message Sent!</h3>
                  <p className="text-white/50">Thank you for reaching out. I&apos;ll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Job opportunity / Collaboration / Hello"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell me about the role, project, or just say hi..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center"
                  >
                    <span className="flex items-center gap-2">
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Message
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
