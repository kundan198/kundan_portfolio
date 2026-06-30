"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

export default function TechParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    /* ── Create particles ── */
    const COUNT = 90;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      hue: Math.random() * 60 + 240, // 240-300: blue to violet
      opacity: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
    }));

    /* ── Water-flow oscillators (make it feel like flowing aura) ── */
    let t = 0;

    function draw() {
      t += 0.008;
      ctx!.clearRect(0, 0, W, H);

      /* ── Flowing aura streams (water feel) ── */
      for (let i = 0; i < 5; i++) {
        const x0 = (W * 0.1) + (W * 0.18 * i) + Math.sin(t + i * 1.2) * 80;
        const y0 = H * 0.5 + Math.cos(t * 0.7 + i) * H * 0.3;
        const grad = ctx!.createRadialGradient(x0, y0, 0, x0, y0, 200 + Math.sin(t + i) * 60);
        const alpha = 0.04 + Math.abs(Math.sin(t * 0.5 + i)) * 0.03;
        grad.addColorStop(0, `hsla(${260 + i * 15}, 80%, 65%, ${alpha})`);
        grad.addColorStop(1, "transparent");
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.ellipse(x0, y0, 280, 160, Math.sin(t * 0.3 + i) * 0.5, 0, Math.PI * 2);
        ctx!.fill();
      }

      /* ── Connections ── */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.12;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }

      /* ── Particles ── */
      for (const p of particles) {
        p.pulse += p.pulseSpeed;
        const r = p.r + Math.sin(p.pulse) * 0.5;
        const alpha = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);

        /* Mouse repulsion */
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const mdx = p.x - mx;
        const mdy = p.y - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 100) {
          const force = (100 - md) / 100;
          p.vx += (mdx / md) * force * 0.15;
          p.vy += (mdy / md) * force * 0.15;
        }

        /* Speed limit */
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.2) { p.vx *= 0.96; p.vy *= 0.96; }

        /* Glow dot */
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        glow.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha})`);
        glow.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx!.fillStyle = glow;
        ctx!.fill();

        /* Core dot */
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 90%, 80%, ${alpha + 0.1})`;
        ctx!.fill();

        /* Move */
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.65 }}
    />
  );
}
