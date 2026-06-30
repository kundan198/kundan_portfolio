"use client";
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setIsCoarse(coarse);
    if (coarse) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -999, my = -999;   // mouse target
    let rx = -999, ry = -999;   // ring lerp position
    let hasInit = false;
    let rafId: number;

    /* Ring lerps; dot is constrained to stay inside ring boundary */
    const RING_R = 14; // half the ring diameter — dot never exits this radius

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!hasInit) {
        rx = mx;
        ry = my;
        hasInit = true;
      }
    };

    const tick = () => {
      rx += (mx - rx) * 0.28;
      ry += (my - ry) * 0.28;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";

      /* Constrain dot: if cursor is within ring, dot follows cursor exactly;
         otherwise dot sits on the ring edge closest to cursor */
      const dx   = mx - rx;
      const dy   = my - ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= RING_R) {
        dot.style.left = mx + "px";
        dot.style.top  = my + "px";
      } else {
        dot.style.left = (rx + (dx / dist) * RING_R) + "px";
        dot.style.top  = (ry + (dy / dist) * RING_R) + "px";
      }

      rafId = requestAnimationFrame(tick);
    };

    /* Hover: classList only — no React re-renders */
    const onEnter = () => { dot.classList.add("hover");    ring.classList.add("hover"); };
    const onLeave = () => { dot.classList.remove("hover"); ring.classList.remove("hover"); };
    const onDown  = () => { dot.classList.add("clicking");    ring.classList.add("clicking"); };
    const onUp    = () => { dot.classList.remove("clicking"); ring.classList.remove("clicking"); };

    const attachHover = (el: Element) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    };

    document.querySelectorAll("a, button, [data-cursor]").forEach(attachHover);

    /* Pick up interactive elements added after mount */
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("a, button, [data-cursor]")) attachHover(node);
          node.querySelectorAll("a, button, [data-cursor]").forEach(attachHover);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {!isCoarse && <div ref={dotRef}  className="cursor" />}
      {!isCoarse && <div ref={ringRef} className="cursor-ring" />}
    </>
  );
}
