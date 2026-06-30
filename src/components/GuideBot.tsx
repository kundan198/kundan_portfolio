"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";

type ChatMessage = { role: "user" | "kai"; text: string };

type ActionState = {
  emoji: string;
  label: string;
  fx: string;
};

const quickPrompts = ["Show top projects", "Present skills", "Hiring summary"];

function getElementText(el: Element | null) {
  if (!el) return "";
  const text = (el.textContent || "").trim().toLowerCase();
  const id = (el as HTMLElement).id?.toLowerCase() || "";
  const cls = (el as HTMLElement).className?.toString().toLowerCase() || "";
  const alt = ((el as HTMLImageElement).alt || "").toLowerCase();
  return `${text} ${id} ${cls} ${alt}`;
}

function inferAction(el: Element | null): ActionState {
  const t = getElementText(el);

  if (!el) return { emoji: "🧍", label: "Standing by", fx: "✨" };
  if (el.tagName.toLowerCase() === "img" || t.includes("photo") || t.includes("image")) {
    return { emoji: "📸", label: "Taking photo", fx: "📷" };
  }
  if (t.includes("python")) {
    return { emoji: "🐍", label: "Python mode", fx: "⚡" };
  }
  if (t.includes("skill")) {
    return { emoji: "🧠", label: "Presenting skills", fx: "👉" };
  }
  if (t.includes("project")) {
    return { emoji: "🚀", label: "Presenting project", fx: "🛰️" };
  }
  if (t.includes("research") || t.includes("paper")) {
    return { emoji: "📄", label: "Showing research", fx: "🔎" };
  }
  if (t.includes("contact") || t.includes("email") || t.includes("linkedin")) {
    return { emoji: "🤝", label: "Networking", fx: "💬" };
  }
  if (el.tagName.toLowerCase() === "button" || el.tagName.toLowerCase() === "a") {
    return { emoji: "🫡", label: "Ready for action", fx: "✅" };
  }

  return { emoji: "👀", label: "Inspecting element", fx: "✨" };
}

export default function GuideBot() {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "kai", text: "I am emoji Kai. Point anywhere and I will act on that element." },
  ]);

  const [action, setAction] = useState<ActionState>({ emoji: "🧍", label: "Standing by", fx: "✨" });
  const [pos, setPos] = useState({ x: 80, y: 220 });
  const target = useRef({ x: 80, y: 220 });
  const elRef = useRef<Element | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const clicked = document.elementFromPoint(e.clientX, e.clientY);
      if (!clicked || clicked === elRef.current) return;

      elRef.current = clicked;
      const rect = (clicked as HTMLElement).getBoundingClientRect();
      const candidateX = rect.right + 28;
      const candidateY = rect.top + rect.height / 2;

      const clampedX = Math.max(38, Math.min(window.innerWidth - 38, candidateX));
      const clampedY = Math.max(90, Math.min(window.innerHeight - 120, candidateY));

      target.current = { x: clampedX, y: clampedY };
      setAction(inferAction(clicked));
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPos((prev) => {
        const nx = prev.x + (target.current.x - prev.x) * 0.12;
        const ny = prev.y + (target.current.y - prev.y) * 0.16;
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  async function askKai(text: string) {
    if (!text.trim()) return;
    const userText = text.trim();
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "kai", text: data?.reply || "I am here." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "kai", text: "Offline guide mode active." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-40 hidden md:block">
        <motion.div
          className="absolute"
          animate={{ x: pos.x, y: pos.y }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-4, 4, -4], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl select-none"
          >
            {action.emoji}
          </motion.div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-lg">{action.fx}</div>
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-[10px] bg-slate-900/90 border border-cyan-400/30 text-cyan-200 whitespace-nowrap">
            {action.label}
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[94vw]">
        <button onClick={() => setOpen((v) => !v)} className="mb-2 ml-auto block rounded-xl border border-cyan-400/30 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-cyan-300">
          {open ? "Hide Kai" : "Talk to Kai"}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="glass rounded-2xl border border-cyan-400/25 overflow-hidden" style={{ background: "rgba(6, 12, 25, 0.95)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="text-sm font-bold text-cyan-300">Kai · Emoji Actor</p>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
              </div>
              <div className="p-3 h-52 overflow-y-auto space-y-2">
                {messages.map((m, i) => (
                  <div key={`${m.role}-${i}`} className={`text-sm leading-relaxed rounded-xl px-3 py-2 ${m.role === "kai" ? "bg-cyan-500/12 text-cyan-100 border border-cyan-500/20" : "bg-white/10 text-white"}`}>
                    {m.text}
                  </div>
                ))}
                {loading && <div className="text-xs text-cyan-300">Kai is thinking...</div>}
              </div>
              <div className="px-3 pb-2 flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <button key={q} onClick={() => askKai(q)} className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/25 text-cyan-200 hover:bg-cyan-500/10">{q}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); askKai(input); }} className="p-3 border-t border-white/10 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Kai anything..." className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-400/50" />
                <button type="submit" disabled={!canSend} className="rounded-xl px-3 py-2 bg-cyan-500 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"><Send size={14} /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
