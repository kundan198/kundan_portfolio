"use client";

import { setTouch, type InputState } from "@/lib/input";

function Btn({
  label,
  dir,
  className = "",
  accent = false,
}: {
  label: string;
  dir: keyof InputState;
  className?: string;
  accent?: boolean;
}) {
  const press = (on: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    setTouch(dir, on);
  };
  return (
    <button
      onPointerDown={press(true)}
      onPointerUp={press(false)}
      onPointerLeave={press(false)}
      onPointerCancel={press(false)}
      className={`touch-btn ${accent ? "touch-btn-accent" : ""} ${className}`}
    >
      {label}
    </button>
  );
}

export default function TouchControls({ onInteract }: { onInteract: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 safe-b z-40 flex items-end justify-between px-4 md:hidden">
      {/* movement d-pad (left thumb) */}
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-2">
        <span />
        <Btn label="▲" dir="forward" className="h-[3.4rem] w-[3.4rem] rounded-2xl text-lg" />
        <span />
        <Btn label="◀" dir="left" className="h-[3.4rem] w-[3.4rem] rounded-2xl text-lg" />
        <Btn label="▼" dir="back" className="h-[3.4rem] w-[3.4rem] rounded-2xl text-lg" />
        <Btn label="▶" dir="right" className="h-[3.4rem] w-[3.4rem] rounded-2xl text-lg" />
      </div>

      {/* action cluster (right thumb) */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <Btn label="JUMP" dir="jump" accent className="h-[4.4rem] w-[4.4rem] rounded-full text-sm font-semibold" />
        <Btn label="BOOST" dir="boost" className="h-11 w-[4.4rem] rounded-2xl text-[11px] tracking-wide" />
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onInteract();
          }}
          className="touch-btn touch-btn-accent h-11 w-[4.4rem] rounded-2xl text-[11px] font-semibold tracking-wide"
        >
          E
        </button>
      </div>
    </div>
  );
}
