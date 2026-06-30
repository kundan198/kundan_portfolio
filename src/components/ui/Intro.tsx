"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import { bootSequence } from "@/lib/portfolio";
import { audio } from "@/lib/audio";

export default function Intro() {
  const setPhase = useGame((s) => s.setPhase);
  const [lines, setLines] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  const char = useRef(0);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const current = bootSequence[idx.current];
      if (current === undefined) {
        setDone(true);
        setTimeout(() => setPhase("playing"), 320);
        return;
      }
      if (char.current <= current.length) {
        setTyped(current.slice(0, char.current));
        char.current++;
        setTimeout(tick, 10);
      } else {
        setLines((l) => [...l, current]);
        setTyped("");
        char.current = 0;
        idx.current++;
        audio.ui();
        setTimeout(tick, 80);
      }
    };
    const start = setTimeout(tick, 80);
    return () => {
      alive = false;
      clearTimeout(start);
    };
  }, [setPhase]);

  return (
    <div className="scanlines fixed inset-0 z-50 flex items-center justify-center bg-[#03040a]">
      <div className="w-[min(92vw,640px)] px-6 font-mono text-sm md:text-base">
        {lines.map((l, i) => (
          <div key={i} className="text-teal-300/80">
            <span className="text-teal-500/50">{">"} </span>
            {l}
            <span className="float-right text-teal-500/60">OK</span>
          </div>
        ))}
        {!done && (
          <div className="text-teal-200 cursor-blink">
            <span className="text-teal-500/50">{">"} </span>
            {typed}
          </div>
        )}
        {done && (
          <div className="fade-in mt-8 text-center">
            <div className="text-3xl font-black tracking-widest text-white kv-glow md:text-5xl">
              WELCOME, EXPLORER
            </div>
            <div className="mt-3 text-xs tracking-[0.4em] text-teal-300/70">
              ENTERING THE KUNDANVERSE
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
