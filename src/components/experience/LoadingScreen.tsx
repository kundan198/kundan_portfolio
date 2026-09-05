"use client";

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
}

export default function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[#04050c] transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden" }}
    >
      <div className="w-[min(78vw,320px)] text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.44em] text-white/40">Loading Journey</p>
        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${Math.round(progress)}%`,
              background: "linear-gradient(90deg, #818cf8, #38bdf8, #34d399)",
            }}
          />
        </div>
        <p className="mt-3 text-[13px] font-black tabular-nums text-white/55" role="status" aria-live="polite">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
