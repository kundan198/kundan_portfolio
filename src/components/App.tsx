"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/store";
import { initInput, onEdge } from "@/lib/input";
import { audio } from "@/lib/audio";
import World from "./World";
import Landing from "./ui/Landing";
import Intro from "./ui/Intro";
import HUD from "./ui/HUD";
import Finale from "./ui/Finale";

export default function App() {
  const phase = useGame((s) => s.phase);
  const vitality = useGame((s) => s.vitality);
  const muted = useGame((s) => s.muted);

  useEffect(() => {
    initInput();
    onEdge({
      onInteract: () => useGame.getState().toggleVehicle(),
    });
    if (typeof window !== "undefined") (window as unknown as { __game: typeof useGame }).__game = useGame;
    // lock page scroll while inside the game (portfolio scrolls; game does not)
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    audio.setVitality(vitality);
  }, [vitality]);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const showWorld = phase !== "landing";

  return (
    <div className="kv-game fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#03040a]">
      {showWorld && <World />}

      {phase === "landing" && <Landing />}
      {phase === "intro" && <Intro />}
      {(phase === "playing" || phase === "finale") && <HUD />}
      {phase === "finale" && <Finale />}
    </div>
  );
}
