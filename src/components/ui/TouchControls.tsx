"use client";

import { setTouch, type InputState } from "@/lib/input";

function Btn({
  label,
  dir,
  small,
  className = "",
}: {
  label: string;
  dir: keyof InputState;
  small?: boolean;
  className?: string;
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
      className={`hud-panel flex items-center justify-center rounded-xl font-mono text-teal-100 active:bg-teal-400/25 ${
        small ? "h-12 w-16 text-[11px]" : "h-14 w-14 text-lg"
      } ${className}`}
    >
      {label}
    </button>
  );
}

export default function TouchControls({ onInteract }: { onInteract: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-44 z-40 flex items-end justify-between px-4 md:hidden">
      {/* d-pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
        <span />
        <Btn label="▲" dir="forward" />
        <span />
        <Btn label="◀" dir="left" />
        <Btn label="▼" dir="back" />
        <Btn label="▶" dir="right" />
      </div>
      {/* actions */}
      <div className="pointer-events-auto flex flex-col items-end gap-1.5">
        <Btn label="JUMP" dir="jump" small />
        <Btn label="BOOST" dir="boost" small />
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onInteract();
          }}
          className="hud-panel flex h-12 w-16 items-center justify-center rounded-xl font-mono text-[11px] text-teal-100 active:bg-teal-400/25"
        >
          E
        </button>
      </div>
    </div>
  );
}
