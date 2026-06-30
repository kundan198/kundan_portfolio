"use client";

import Link from "next/link";
import { audio } from "@/lib/audio";
import { useGame } from "@/lib/store";

const clickZones = [
  { label: "Home District", left: "9%", top: "61%", width: "13%", height: "8%" },
  { label: "University District", left: "17%", top: "39%", width: "15%", height: "8%" },
  { label: "AI Research Campus", left: "45%", top: "27%", width: "17%", height: "8%" },
  { label: "Startup District", left: "69%", top: "27%", width: "17%", height: "8%" },
  { label: "Downtown City", left: "45%", top: "48%", width: "15%", height: "8%" },
  { label: "Waterfront", left: "77%", top: "52%", width: "13%", height: "8%" },
  { label: "Technology Forest", left: "23%", top: "18%", width: "17%", height: "8%" },
  { label: "Mountain Observatory", left: "44%", top: "1%", width: "19%", height: "8%" },
  { label: "Space Center", left: "75%", top: "10%", width: "15%", height: "8%" },
];

export default function Landing() {
  const setPhase = useGame((s) => s.setPhase);

  const enter = () => {
    audio.init();
    audio.boot();
    setPhase("intro");
  };

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-[#07131b] text-cyan-50">
      <button
        type="button"
        onClick={enter}
        className="absolute inset-0 cursor-pointer bg-center bg-no-repeat text-left"
        style={{
          backgroundImage: "url('/images/kundanverse-world-map.png')",
          backgroundSize: "100% 100%",
        }}
        aria-label="Enter the Kundanverse world map"
      />

      {clickZones.map((zone) => (
        <button
          key={zone.label}
          type="button"
          onClick={enter}
          className="absolute z-10 rounded-full border border-transparent bg-transparent transition focus-visible:border-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
          style={{
            left: zone.left,
            top: zone.top,
            width: zone.width,
            height: zone.height,
          }}
          aria-label={`Fast travel to ${zone.label}`}
        />
      ))}

      <button
        type="button"
        onClick={enter}
        className="absolute bottom-[3.5%] right-[2.5%] z-20 h-[5.5%] w-[13.5%] min-w-36 rounded border border-transparent bg-transparent transition focus-visible:border-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
        aria-label="Open world"
      />

      <Link
        href="/"
        className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-950/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-50/55 opacity-0 backdrop-blur transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
      >
        Main Portfolio
      </Link>
    </main>
  );
}
