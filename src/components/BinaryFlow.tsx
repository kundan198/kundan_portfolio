"use client";

import { useMemo, type CSSProperties } from "react";

/**
 * Tiny stream of animated 0s / 1s that flow along one axis. Pure CSS keyframes
 * (transform + opacity only) so it stays off the main thread and pauses when
 * its tree is display:none. Used by the Skills laser arrow and the Experience
 * Flow-view connection lines.
 *
 * Horizontal by default; pass a `style.transform: rotate(...)` to aim it along
 * an angled connector. Pass `vertical` for a straight downward stream.
 */
export function BinaryFlow({
  length,
  count = 8,
  color = "#38bdf8",
  speed = 2.4,
  vertical = false,
  fontSize = 9,
  style,
}: {
  length: number;
  count?: number;
  color?: string;
  speed?: number;
  vertical?: boolean;
  fontSize?: number;
  style?: CSSProperties;
}) {
  const digits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        ch: (i * 7 + 3) % 2 ? "1" : "0",
        delay: (i / count) * speed,
        dur: speed * (0.82 + (i % 3) * 0.12),
      })),
    [count, speed],
  );

  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        ...(vertical
          ? { width: fontSize + 4, height: length }
          : { width: length, height: fontSize + 5 }),
        ...style,
      }}
    >
      {digits.map((d, i) => (
        <span
          key={i}
          className={vertical ? "binflow-y" : "binflow-x"}
          style={{
            ["--bf-len" as string]: `${vertical ? length : length}px`,
            color,
            fontSize,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
            textShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
          }}
        >
          {d.ch}
        </span>
      ))}
    </div>
  );
}

export default BinaryFlow;
