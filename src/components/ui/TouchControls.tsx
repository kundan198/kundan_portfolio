"use client";

import { useRef, useState } from "react";
import { setMove, clearMove, setTouch, type InputState } from "@/lib/input";

const KNOB_R = 46; // max knob travel (px)
const DEADZONE = 0.18;

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: React.PointerEvent) => {
    if (!active.current || !baseRef.current) return;
    const r = baseRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > KNOB_R) {
      dx = (dx / len) * KNOB_R;
      dy = (dy / len) * KNOB_R;
    }
    setKnob({ x: dx, y: dy });
    const nx = dx / KNOB_R;
    const ny = dy / KNOB_R;
    if (Math.hypot(nx, ny) < DEADZONE) clearMove();
    else setMove(nx, -ny); // pushing up = forward
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    active.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    update(e);
  };
  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    clearMove();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={start}
      onPointerMove={update}
      onPointerUp={end}
      onPointerCancel={end}
      className="joy-base pointer-events-auto h-32 w-32 rounded-full"
    >
      <div
        className="joy-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)`, transition: active.current ? "none" : "transform 0.12s ease" }}
      />
    </div>
  );
}

function ActionBtn({
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
    <div className="pointer-events-none fixed inset-x-0 safe-b z-40 flex items-end justify-between px-5 md:px-8 lg:hidden">
      {/* analog joystick (left thumb) — drag to move & steer */}
      <Joystick />

      {/* action cluster (right thumb) */}
      <div className="pointer-events-auto flex flex-col items-end gap-2.5">
        <ActionBtn label="JUMP" dir="jump" accent className="h-[4.6rem] w-[4.6rem] rounded-full text-sm font-semibold md:h-20 md:w-20" />
        <ActionBtn label="BOOST" dir="boost" className="h-11 w-[4.6rem] rounded-2xl text-[11px] tracking-wide md:h-12 md:w-20" />
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onInteract();
          }}
          className="touch-btn touch-btn-accent h-11 w-[4.6rem] rounded-2xl text-[11px] font-semibold tracking-wide md:h-12 md:w-20"
        >
          E
        </button>
      </div>
    </div>
  );
}
