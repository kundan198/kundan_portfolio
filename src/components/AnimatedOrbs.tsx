"use client";
export default function AnimatedOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Orb 1 — large violet, top-left */}
      <div className="orb" style={{
        width: 700, height: 700, left: "-15%", top: "-15%",
        background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(109,40,217,0.08) 50%, transparent 70%)",
        animationDuration: "12s", animationTimingFunction: "ease-in-out",
      }} />
      {/* Orb 2 — blue, top-right */}
      <div className="orb" style={{
        width: 550, height: 550, right: "-10%", top: "5%",
        background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.06) 50%, transparent 70%)",
        animationDuration: "15s", animationDelay: "-4s", animationTimingFunction: "ease-in-out",
      }} />
      {/* Orb 3 — cyan, bottom-center */}
      <div className="orb" style={{
        width: 450, height: 450, left: "30%", bottom: "-8%",
        background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.05) 50%, transparent 70%)",
        animationDuration: "11s", animationDelay: "-7s",
      }} />
      {/* Orb 4 — indigo, center-left */}
      <div className="orb" style={{
        width: 380, height: 380, left: "8%", top: "40%",
        background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
        animationDuration: "14s", animationDelay: "-2s", animationTimingFunction: "ease-in-out",
      }} />
      {/* Orb 5 — purple, center-right */}
      <div className="orb" style={{
        width: 320, height: 320, right: "12%", bottom: "25%",
        background: "radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)",
        animationDuration: "9s", animationDelay: "-5s",
      }} />
      {/* Orb 6 — faint warm violet, center */}
      <div className="orb" style={{
        width: 500, height: 500, left: "42%", top: "35%",
        background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
        animationDuration: "18s", animationDelay: "-9s",
      }} />
    </div>
  );
}
