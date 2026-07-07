"use client";
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setIsCoarse(coarse);
    if (coarse) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -999;
    let my = -999;
    let ringX = -999;
    let ringY = -999;
    let rafId: number;
    let hovering = false;
    let visible = false;

    const setVisible = (next: boolean) => {
      if (visible === next) return;
      visible = next;
      dot.classList.toggle("visible", next);
      ring.classList.toggle("visible", next);
    };

    const setInteractive = (next: boolean) => {
      if (hovering === next) return;
      hovering = next;
      dot.classList.toggle("hover", next);
      ring.classList.toggle("hover", next);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      setVisible(true);
      const target = e.target instanceof Element ? e.target : null;
      setInteractive(Boolean(target?.closest("a, button, [data-cursor], input, textarea, select, [role='button']")));
      // dot tracks the pointer 1:1 for a crisp, lag-free feel
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    };

    const tick = () => {
      // ring eases toward the pointer — snappy enough to feel connected, soft enough to read as a trail
      ringX += (mx - ringX) * 0.35;
      ringY += (my - ringY) * 0.35;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    const onDown = () => { dot.classList.add("clicking"); ring.classList.add("clicking"); };
    const onUp = () => { dot.classList.remove("clicking"); ring.classList.remove("clicking"); };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (isCoarse) return null;

  return (
    <>
      <div ref={dotRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
