"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Float, PresentationControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { projects as allProjects } from "@/lib/data";

const COLOR: Record<string, string> = {
  purple: "#a78bfa",
  cyan: "#22d3ee",
  yellow: "#fbbf24",
  pink: "#f472b6",
  green: "#34d399",
  blue: "#60a5fa",
  orange: "#fb923c",
  silver: "#cbd5e1",
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeScreenTexture() {
  const W = 1664;
  const H = 1040;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#272463");
  g.addColorStop(0.5, "#161333");
  g.addColorStop(1, "#0d0b27");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // soft center glow so the screen reads as "lit"
  const cg = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, W * 0.6);
  cg.addColorStop(0, "rgba(99,102,241,0.18)");
  cg.addColorStop(1, "rgba(99,102,241,0)");
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(129,140,248,0.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // top bar
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, W, 64);
  ["#ff5f56", "#febc2e", "#28c840"].forEach((d, i) => {
    ctx.fillStyle = d;
    ctx.beginPath();
    ctx.arc(40 + i * 30, 32, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(125,211,252,0.7)";
  ctx.font = "700 22px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("KUNDAN.DEV  —  PROJECTS", W / 2, 41);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(244,63,94,0.8)";
  ctx.fillText("● REC", W - 150, 41);
  ctx.fillStyle = "rgba(56,189,248,0.55)";
  ctx.fillText("60 FPS", W - 28, 41);

  // heading
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 60px Inter, system-ui, sans-serif";
  ctx.fillText("Projects", 70, 150);
  ctx.fillStyle = "rgba(56,189,248,0.65)";
  ctx.font = "800 18px ui-monospace, monospace";
  ctx.fillText(`${allProjects.length} PRODUCTION BUILDS`, 74, 184);
  // view all
  ctx.fillStyle = "rgba(124,58,237,0.28)";
  rr(ctx, W - 250, 110, 180, 52, 26);
  ctx.fill();
  ctx.strokeStyle = "rgba(167,139,250,0.8)";
  ctx.lineWidth = 2;
  rr(ctx, W - 250, 110, 180, 52, 26);
  ctx.stroke();
  ctx.fillStyle = "#ddd6fe";
  ctx.font = "800 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VIEW ALL  ↗", W - 160, 143);
  ctx.textAlign = "left";

  // cards 2x2
  const cards = allProjects.slice(0, 4);
  const pad = 70;
  const gap = 40;
  const cw = (W - pad * 2 - gap) / 2;
  const ch = 350;
  const y0 = 224;
  cards.forEach((p, i) => {
    const cx = pad + (i % 2) * (cw + gap);
    const cy = y0 + Math.floor(i / 2) * (ch + 36);
    const accent = COLOR[p.color] || "#22d3ee";

    ctx.fillStyle = "rgba(255,255,255,0.075)";
    rr(ctx, cx, cy, cw, ch, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    rr(ctx, cx, cy, cw, ch, 22);
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 26;
    ctx.fillStyle = accent;
    rr(ctx, cx, cy + 18, 7, ch - 36, 4);
    ctx.fill();
    ctx.restore();

    const px = cx + 34;
    let py = cy + 50;
    if (p.badge) {
      ctx.font = "800 18px Inter, sans-serif";
      const bw = ctx.measureText(p.badge.text).width;
      const bww = Math.min(cw - 68, bw + 28);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      rr(ctx, px, py - 24, bww, 36, 18);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      rr(ctx, px, py - 24, bww, 36, 18);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillText(p.badge.text, px + 14, py + 2);
      py += 50;
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 40px Inter, sans-serif";
    ctx.fillText(p.title, px, py + 14);
    py += 52;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 23px Inter, sans-serif";
    ctx.fillText(p.subtitle.slice(0, 40), px, py + 8);
    py += 52;
    ctx.font = "700 18px ui-monospace, monospace";
    let tx = px;
    p.tech.slice(0, 5).forEach((t) => {
      const tw = ctx.measureText(t).width + 28;
      if (tx + tw > cx + cw - 24) return;
      ctx.fillStyle = "rgba(99,102,241,0.24)";
      rr(ctx, tx, py, tw, 36, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(165,180,252,0.35)";
      ctx.lineWidth = 1;
      rr(ctx, tx, py, tw, 36, 18);
      ctx.stroke();
      ctx.fillStyle = "rgba(226,232,255,0.96)";
      ctx.fillText(t, tx + 14, py + 24);
      tx += tw + 10;
    });
  });

  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

const SW = 7.0; // screen width
const SH = 4.375; // screen height (16:10)

function ScanLine() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const t = (s.clock.elapsedTime * 0.5) % 1;
      ref.current.position.y = SH / 2 - t * SH;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * Math.PI) * 0.08;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.2]}>
      <planeGeometry args={[SW, 0.22]} />
      <meshBasicMaterial color="#7dd3fc" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function MonitorModel() {
  const router = useRouter();
  const tex = useMemo(() => makeScreenTexture(), []);
  return (
    <group position={[0, 0.15, 0]}>
      {/* bezel */}
      <RoundedBox args={[SW + 0.5, SH + 0.5, 0.34]} radius={0.16} smoothness={5} position={[0, 0, -0.12]} castShadow>
        <meshStandardMaterial color="#17141f" metalness={0.92} roughness={0.26} />
      </RoundedBox>
      {/* neon rim */}
      <RoundedBox args={[SW + 0.18, SH + 0.18, 0.14]} radius={0.12} smoothness={5} position={[0, 0, 0.0]}>
        <meshStandardMaterial color="#06040f" emissive="#2563eb" emissiveIntensity={0.6} metalness={0.6} roughness={0.4} />
      </RoundedBox>
      {/* screen */}
      <mesh
        position={[0, 0, 0.12]}
        onClick={(e) => { e.stopPropagation(); router.push("/projects"); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[SW, SH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* glass sheen */}
      <mesh position={[0, 0, 0.15]} raycast={() => null}>
        <planeGeometry args={[SW, SH]} />
        <meshPhysicalMaterial transparent opacity={0.05} roughness={0.04} clearcoat={1} clearcoatRoughness={0.04} color="#ffffff" depthWrite={false} />
      </mesh>
      <ScanLine />

      {/* neck + base */}
      <mesh position={[0, -(SH / 2 + 0.7), -0.25]} castShadow>
        <boxGeometry args={[0.55, 1.0, 0.4]} />
        <meshStandardMaterial color="#1b1826" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -(SH / 2 + 1.2), 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.5, 0.2, 56]} />
        <meshStandardMaterial color="#15131d" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, -(SH / 2 + 1.1), 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.2, 1.45, 56]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Pull the camera back so the WHOLE monitor fits in both width & height — on any
// aspect ratio (portrait phones included), so it's never cut off.
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const fov = (cam.fov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const fitW = 7.7; // monitor width + margin
    const fitH = 6.1; // monitor height (incl. base) + margin
    const distH = fitH / 2 / Math.tan(fov / 2);
    const distW = fitW / 2 / (Math.tan(fov / 2) * aspect);
    cam.position.set(0, 0, Math.max(distH, distW) * 1.0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function Monitor3D({ screenHeight = "60vh" }: { screenHeight?: string }) {
  return (
    <div style={{ width: "100%", height: `calc(${screenHeight} + 80px)`, minHeight: "320px" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 9.4], fov: 38 }} gl={{ alpha: true, antialias: true }}>
        <FitCamera />
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 7]} intensity={1.5} castShadow />
        <pointLight position={[-6, 2, 5]} color="#22d3ee" intensity={55} distance={26} />
        <pointLight position={[6, -2, 5]} color="#a855f7" intensity={48} distance={26} />
        <PresentationControls
          global
          cursor
          snap
          polar={[-0.35, 0.35]}
          azimuth={[-0.7, 0.7]}
        >
          <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.22}>
            <MonitorModel />
          </Float>
        </PresentationControls>
        <EffectComposer>
          <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.85} mipmapBlur />
          <Vignette eskil={false} offset={0.45} darkness={0.28} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
