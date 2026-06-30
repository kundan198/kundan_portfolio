"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { Code2, Rocket, Star, Trophy, BookOpen, Users, ChevronRight, ChevronDown, X, LayoutGrid, MonitorPlay } from "lucide-react";
import * as THREE from "three";
import { projects as allProjects } from "@/lib/data";
import { SKILLS, GROUPS, type SkillDef } from "@/app/skills/skillsData";

/* ───────────────────────── bright screen texture ───────────────────────── */
const COLOR: Record<string, string> = {
  purple: "#a78bfa", cyan: "#22d3ee", yellow: "#fbbf24", pink: "#f472b6",
  green: "#34d399", blue: "#60a5fa", orange: "#fb923c", silver: "#cbd5e1",
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function makeScreenTexture() {
  const W = 1664, H = 1040;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#272463"); g.addColorStop(0.5, "#161333"); g.addColorStop(1, "#0d0b27");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cg = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, W * 0.6);
  cg.addColorStop(0, "rgba(99,102,241,0.18)"); cg.addColorStop(1, "rgba(99,102,241,0)");
  ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(129,140,248,0.10)"; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 64);
  ["#ff5f56", "#febc2e", "#28c840"].forEach((d, i) => { ctx.fillStyle = d; ctx.beginPath(); ctx.arc(40 + i * 30, 32, 8, 0, 7); ctx.fill(); });
  ctx.fillStyle = "rgba(125,211,252,0.7)"; ctx.font = "700 22px ui-monospace, monospace"; ctx.textAlign = "center";
  ctx.fillText("KUNDAN.DEV  /  PROJECTS", W / 2, 41);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(167,139,250,0.85)"; ctx.fillText("VIEW ALL  +", W - 28, 41);
  ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "900 56px Inter, system-ui, sans-serif";
  ctx.fillText("Projects", 70, 144);
  ctx.fillStyle = "rgba(125,211,252,0.7)"; ctx.font = "800 18px ui-monospace, monospace";
  ctx.fillText(`${allProjects.length} PRODUCTION BUILDS`, 74, 176);
  const cards = allProjects.slice(0, 4);
  const pad = 70, gap = 40, cw = (W - pad * 2 - gap) / 2, ch = 360, y0 = 214;
  cards.forEach((p, i) => {
    const cx = pad + (i % 2) * (cw + gap);
    const cy = y0 + Math.floor(i / 2) * (ch + 30);
    const accent = COLOR[p.color] || "#22d3ee";
    ctx.fillStyle = "rgba(255,255,255,0.075)"; rr(ctx, cx, cy, cw, ch, 22); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2; rr(ctx, cx, cy, cw, ch, 22); ctx.stroke();
    ctx.save(); ctx.shadowColor = accent; ctx.shadowBlur = 26; ctx.fillStyle = accent; rr(ctx, cx, cy + 18, 7, ch - 36, 4); ctx.fill(); ctx.restore();
    const px = cx + 34; let py = cy + 54;
    ctx.font = "800 16px Inter, sans-serif";
    const cat = (p.category || "").toUpperCase(); const cwid = ctx.measureText(cat).width + 26;
    ctx.fillStyle = accent + "22"; rr(ctx, px, py - 26, cwid, 32, 16); ctx.fill();
    ctx.fillStyle = accent; ctx.fillText(cat, px + 13, py - 4); py += 30;
    ctx.fillStyle = "#fff"; ctx.font = "900 40px Inter, sans-serif"; ctx.fillText(p.title, px, py + 14); py += 50;
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "600 22px Inter, sans-serif"; ctx.fillText(p.subtitle.slice(0, 40), px, py + 6); py += 50;
    ctx.font = "700 18px ui-monospace, monospace"; let tx = px;
    p.tech.slice(0, 5).forEach((t) => {
      const tw = ctx.measureText(t).width + 28; if (tx + tw > cx + cw - 24) return;
      ctx.fillStyle = "rgba(99,102,241,0.24)"; rr(ctx, tx, py, tw, 36, 18); ctx.fill();
      ctx.strokeStyle = "rgba(165,180,252,0.35)"; ctx.lineWidth = 1; rr(ctx, tx, py, tw, 36, 18); ctx.stroke();
      ctx.fillStyle = "rgba(226,232,255,0.96)"; ctx.fillText(t, tx + 14, py + 24); tx += tw + 10;
    });
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
  return tex;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function playMechanicalClick() {
  try {
    const ctx = new AudioContext();
    // Noise burst for plastic clack
    const noiseLength = 0.05;
    const bufferSize = ctx.sampleRate * noiseLength;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 3000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // Low frequency thock
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.04);
    
    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    noise.start();
    osc.start();
    noise.stop(ctx.currentTime + noiseLength);
    osc.stop(ctx.currentTime + 0.05);
  } catch { /* audio is optional */ }
}

function MechanicalKey({ skill, x, z, w, h, active, hovered, pressed, onPointerDown, onPointerUp, onPointerOver, onPointerOut }: any) {
  const group = useRef<THREE.Group>(null);
  const targetY = pressed ? -0.06 : active ? 0.02 : hovered ? 0.01 : 0;
  
  useFrame((_, delta) => {
    if (group.current) {
      // Smooth damp for realistic spring physics
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 25, delta);
    }
  });

  return (
    <group
      position={[x, 0, z]}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Switch stem underneath */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.15, 16]} />
        <meshStandardMaterial color="#880000" roughness={0.4} /> {/* Cherry MX Red style */}
      </mesh>
      
      {/* Moving Keycap Assembly */}
      <group ref={group}>
        {/* Keycap base (skirt) */}
        <RoundedBox
          args={[w * 0.94, 0.16, h * 0.88]}
          radius={0.03}
          smoothness={4}
          position={[0, 0.18, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={active ? "#363748" : hovered ? "#2b2c3b" : "#21222d"}
            metalness={0.15}
            roughness={0.65}
          />
        </RoundedBox>
        
        {/* Keycap top surface (tapered effect simulated with slightly smaller top box) */}
        <RoundedBox
          args={[w * 0.78, 0.06, h * 0.65]}
          radius={0.03}
          smoothness={4}
          position={[0, 0.27, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={active ? "#414256" : hovered ? "#393a4b" : "#303140"}
            metalness={0.1}
            roughness={0.5}
          />
        </RoundedBox>

        {/* Emissive glow inside key surface */}
        <mesh position={[0, 0.301, -h * 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w * 0.25, 0.01]} />
          <meshBasicMaterial
            color={skill.color}
            transparent
            opacity={active ? 0.9 : hovered ? 0.4 : 0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        
        {/* Key Label */}
        <Text
          position={[0, 0.302, h * 0.08]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.075}
          maxWidth={w * 0.64}
          lineHeight={0.92}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={active ? "#ffffff" : hovered ? "#f4f5ff" : "#c8cad7"}
          outlineWidth={0.001}
          outlineColor="#000000"
        >
          {skill.short}
        </Text>
      </group>
    </group>
  );
}

/* ───────────────────────── 3D scene (scroll-assembled) ───────────────────────── */
const KEYBOARD_W = 8.8;
const KEYBOARD_H = 3.75;
const KEY_HOTSPOTS = [
  { y: 154, xs: [205, 330, 455, 580, 705, 830, 955, 1080, 1205, 1330] },
  { y: 260, xs: [172, 298, 424, 550, 676, 802, 928, 1054, 1180, 1306] },
  { y: 375, xs: [138, 265, 392, 519, 646, 773, 900, 1027, 1154, 1281] },
  { y: 496, xs: [106, 233, 360, 487, 614, 741] },
] as const;

function keyboardSpots() {
  const spots: { skill: SkillDef; x: number; z: number; w: number; h: number }[] = [];
  let i = 0;
  for (const row of KEY_HOTSPOTS) {
    for (const px of row.xs) {
      const skill = SKILLS[i++];
      if (!skill) continue;
      spots.push({
        skill,
        x: (px / 1526 - 0.5) * KEYBOARD_W,
        z: (row.y / 650 - 0.5) * KEYBOARD_H,
        w: KEYBOARD_W * 0.072,
        h: KEYBOARD_H * 0.13,
      });
    }
  }
  return spots;
}

function SceneContents({ build, activeSkill, onSkill }: { build: MotionValue<number>; activeSkill: SkillDef | null; onSkill: (skill: SkillDef) => void }) {
  const router = useRouter();
  const tex = useMemo(() => makeScreenTexture(), []);
  const monitor = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const kb = useRef<THREE.Group>(null);
  const extras = useRef<THREE.Group>(null);
  const { camera, pointer, size } = useThree();
  const SW = 7.4, SH = 4.625;
  const screenCenterY = SH / 2 + 1.5;
  const spots = useMemo(keyboardSpots, []);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useFrame(() => {
    const b = clamp01(build.get());

    // ── monitor unfolding cinematic animation ──
    const mb = smooth(clamp01((b - 0.15) / 0.55));
    if (monitor.current) {
      // Hinge from folded back to standing upright
      monitor.current.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.48, 0, mb);
      // Simulate rising from an articulating arm
      monitor.current.position.y = THREE.MathUtils.lerp(-6, 0, mb);
      monitor.current.position.z = THREE.MathUtils.lerp(3.5, 0, mb);
    }
    
    // ── Glitch/flicker power-on effect for screen ──
    if (screenMat.current) {
      const powerProgress = clamp01((b - 0.4) / 0.2);
      if (powerProgress > 0 && powerProgress < 1) {
        // Random flickering while booting up
        screenMat.current.opacity = Math.random() > 0.3 ? powerProgress : 0.1;
      } else {
        screenMat.current.opacity = powerProgress;
      }
    }

    // ── keyboard: hero (big, up front) → settles onto the desk ──
    const kbp = smooth(clamp01(b / 0.55));
    if (kb.current) {
      kb.current.position.set(0, THREE.MathUtils.lerp(2.15, 0.82, kbp), THREE.MathUtils.lerp(4.9, 4.7, kbp));
      kb.current.scale.setScalar(THREE.MathUtils.lerp(1.34, 1.02, kbp));
      kb.current.rotation.x = THREE.MathUtils.lerp(0.28, 0.3, kbp);
    }
    
    // ── mouse + plant slide and scale in ──
    if (extras.current) {
      extras.current.scale.setScalar(mb);
      extras.current.position.x = THREE.MathUtils.lerp(2, 0, mb); // Slide in from right slightly
    }

    // ── camera: gently pull back as the scene assembles, with parallax ──
    const aspect = size.width / size.height;
    const isMobile = aspect < 0.8; // Portrait mobile
    const baseZ = isMobile ? 24 : (aspect < 1.5 ? 18 : 15.5);
    const endZ = isMobile ? 38 : (aspect < 1.5 ? 25 - aspect * 2 : 20.8);
    const z = THREE.MathUtils.lerp(baseZ, endZ, smooth(clamp01(b / 0.7)));
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.05;
    camera.position.y += (6.05 - pointer.y * 0.45 - camera.position.y) * 0.05;
    camera.position.z += (z - camera.position.z) * 0.06;
    
    // On mobile, look LOWER so the keyboard is pushed higher into the center of the screen
    // away from the bottom UI elements like the guide bot.
    const lookY = isMobile ? 0.8 : THREE.MathUtils.lerp(2.75, 2.55, smooth(clamp01(b / 0.6)));
    camera.lookAt(0, lookY, THREE.MathUtils.lerp(0, 2.2, smooth(clamp01(b / 0.6))));
  });

  return (
    <>
      {/* monitor */}
      <group ref={monitor} position={[0, -6, 0]}>
        {/* Pivot hinge point for the animation */}
        <group position={[0, 0, 0]}>
          {/* Detailed Ergonomic Arm */}
          <mesh position={[0, 0.8, -1.2]} rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 1.8, 16]} />
            <meshStandardMaterial color="#1f2026" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.8, -0.6]} rotation={[-0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
            <meshStandardMaterial color="#2d2e34" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, -1.5]} castShadow receiveShadow>
            <cylinderGeometry args={[0.8, 0.9, 0.2, 32]} />
            <meshStandardMaterial color="#0c0a16" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.4, 0]} castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#1f2026" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Screen Body */}
          <group position={[0, screenCenterY, 0.2]}>
            {/* Monitor Chassis / Backplate */}
            <RoundedBox args={[SW + 0.3, SH + 0.3, 0.25]} radius={0.12} smoothness={5} position={[0, 0, -0.15]} castShadow>
              <meshStandardMaterial color="#101016" metalness={0.95} roughness={0.15} />
            </RoundedBox>
            
            {/* RGB Bias Lighting Ring Behind Monitor */}
            <mesh position={[0, 0, -0.28]}>
              <planeGeometry args={[SW + 0.1, SH + 0.1]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            
            {/* Ultra-thin Metallic Bezel */}
            <RoundedBox args={[SW + 0.08, SH + 0.08, 0.1]} radius={0.04} smoothness={4}>
              <meshStandardMaterial color="#050508" metalness={0.7} roughness={0.5} />
            </RoundedBox>

            {/* Screen Content */}
            <mesh position={[0, 0, 0.06]}
              onClick={(e) => { e.stopPropagation(); router.push("/projects"); }}
              onPointerOver={() => (document.body.style.cursor = "pointer")}
              onPointerOut={() => (document.body.style.cursor = "auto")}>
              <planeGeometry args={[SW, SH]} />
              <meshBasicMaterial ref={screenMat} map={tex} toneMapped={false} transparent opacity={0} />
            </mesh>

            {/* Screen Glass Reflection */}
            <mesh position={[0, 0, 0.07]}>
              <planeGeometry args={[SW, SH]} />
              <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} transparent opacity={0.06} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/* keyboard */}
      <group ref={kb} position={[0, 2.7, 6.2]} rotation={[0.34, 0, 0]}>
        {/* Solid Aluminum Base */}
        <RoundedBox args={[9.6, 0.35, 4.2]} radius={0.08} smoothness={8} position={[0, -0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#2d2e34" metalness={0.8} roughness={0.3} />
        </RoundedBox>
        {/* Switch mounting plate (dark metal) */}
        <RoundedBox args={[9.3, 0.05, 3.9]} radius={0.05} smoothness={4} position={[0, -0.05, 0]} receiveShadow>
          <meshStandardMaterial color="#0c0d12" metalness={0.6} roughness={0.7} />
        </RoundedBox>
        
        {/* Base LED Glow under plate */}
        <mesh position={[0, -0.045, 1.92]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.7, 0.035]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        
        {spots.map(({ skill, x, z, w, h }) => {
          const active = activeSkill?.id === skill.id;
          const hovered = hoveredKey === skill.id;
          const pressed = pressedKey === skill.id;
          return (
            <MechanicalKey
              key={skill.id}
              skill={skill}
              x={x}
              z={z}
              w={w}
              h={h}
              active={active}
              hovered={hovered}
              pressed={pressed}
              onPointerDown={(e: any) => {
                e.stopPropagation();
                setPressedKey(skill.id);
                playMechanicalClick();
                document.body.style.cursor = "pointer";
              }}
              onPointerUp={(e: any) => {
                e.stopPropagation();
                setPressedKey(null);
                onSkill(skill);
              }}
              onPointerOver={(e: any) => {
                e.stopPropagation();
                setHoveredKey(skill.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredKey(null);
                setPressedKey(null);
                document.body.style.cursor = "auto";
              }}
            />
          );
        })}
        {/* Bottom Desk Glow */}
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 4.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.6} blending={THREE.NormalBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* extras */}
      <group ref={extras}>
        {/* Large Aesthetic Desk Mat */}
        <RoundedBox args={[14.5, 0.02, 5.5]} radius={0.3} smoothness={8} position={[0, -0.38, 5.2]} receiveShadow>
          <meshStandardMaterial color="#12131c" metalness={0.2} roughness={0.9} />
        </RoundedBox>
        <mesh position={[0, -0.37, 5.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14.6, 5.6]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* High-Tech Gaming Mouse */}
        <group position={[5.4, 0.1, 6.2]} rotation={[0, -0.25, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 0.25, 1.2]} />
            <meshStandardMaterial color="#1a1c23" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.18, -0.1]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.65, 0.15, 0.9]} />
            <meshStandardMaterial color="#282a35" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Scroll Wheel */}
          <mesh position={[0, 0.28, -0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#08080a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Scroll Wheel Glow */}
          <mesh position={[0, 0.28, -0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.04, 16]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          {/* Mouse Underglow */}
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 1.8]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>

        {/* Upgraded Cyber-Bonsai Plant */}
        <group position={[-6.2, 0, 5.2]}>
          {/* Ceramic Pot */}
          <mesh castShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.45, 0.35, 0.6, 24]} />
            <meshStandardMaterial color="#0c0d12" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
            <meshStandardMaterial color="#331e15" roughness={0.9} /> {/* Soil */}
          </mesh>
          {/* Holographic / Glowing Geometric Leaves */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const h = 0.8 + Math.sin(i) * 0.3;
            return (
              <mesh key={i} castShadow position={[Math.cos(a) * 0.2, 0.6 + h / 2, Math.sin(a) * 0.2]} rotation={[0.4, a, 0]}>
                <boxGeometry args={[0.15, h, 0.15]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#14b8a6" emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
              </mesh>
            );
          })}
        </group>
      </group>
    </>
  );
}

function DeskScene({ build, activeSkill, onSkill }: { build: MotionValue<number>; activeSkill: SkillDef | null; onSkill: (skill: SkillDef) => void }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 6.05, 15.5], fov: 36 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.68} />
      <directionalLight position={[2.5, 9, 7]} intensity={1.45} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 2.5, -3]} color="#7c3aed" intensity={60} distance={26} />
      <pointLight position={[-5, 1, 4]} color="#22d3ee" intensity={30} distance={22} />
      <pointLight position={[5, 1, 4]} color="#a855f7" intensity={30} distance={22} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
        <planeGeometry args={[40, 24]} /><meshStandardMaterial color="#0a0913" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2.5]}>
        <planeGeometry args={[14, 8]} /><meshBasicMaterial color="#7c3aed" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <SceneContents build={build} activeSkill={activeSkill} onSkill={onSkill} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

/* ───────────────────────── desktop skill panel ───────────────────────── */

function DesktopSkillPanel({ skill, onClose }: { skill: SkillDef | null; onClose: () => void }) {
  if (!skill) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-6 text-white/55 backdrop-blur-2xl shadow-2xl"
        style={{ boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400/80">Interactive Interface</p>
        <h3 className="mt-3 text-3xl font-black text-white tracking-tight">Select a Module</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/40">
          Engage any mechanical key to initialize its technology core, revealing proficiency data and production deployments.
        </p>
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-1.5 w-8 rounded-full bg-white/10" />
          ))}
        </div>
      </motion.div>
    );
  }

  const Icon = skill.Icon;
  return (
    <motion.div
      key={skill.id}
      initial={{ opacity: 0, y: 30, rotateX: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative overflow-hidden rounded-3xl border p-6 backdrop-blur-3xl shadow-2xl origin-bottom"
      style={{
        borderColor: `${skill.color}44`,
        background: `linear-gradient(145deg, rgba(15,15,25,0.9), rgba(5,5,10,0.95))`,
        boxShadow: `0 30px 60px -20px rgba(0,0,0,0.9), 0 0 80px ${skill.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
        perspective: 1000,
      }}
    >
      {/* Background glowing orbs */}
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[80px]" style={{ background: `${skill.color}40` }} />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full blur-[60px]" style={{ background: `${skill.color}20` }} />
      
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/45 transition hover:bg-white/10 hover:text-white"
        aria-label="Close skill details"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 flex items-start gap-5">
        <div
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border shadow-lg"
          style={{ borderColor: `${skill.color}60`, background: `linear-gradient(135deg, ${skill.color}22, ${skill.color}05)`, color: skill.color }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          <Icon size={32} />
        </div>
        <div className="min-w-0 pr-6 pt-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: skill.color }}>{skill.category}</p>
          <h3 className="mt-1 text-3xl font-black leading-none text-white tracking-tight">{skill.name}</h3>
        </div>
      </div>

      <p className="relative z-10 mt-5 text-sm leading-relaxed text-white/70 font-medium">
        {skill.desc}
      </p>

      <div className="relative z-10 mt-6 rounded-2xl border border-white/5 bg-black/20 p-4">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white/50">
          <span>Proficiency ({skill.years})</span>
          <span style={{ color: skill.color }}>{skill.level}%</span>
        </div>
        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${skill.level}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${skill.color}88, ${skill.color})`, 
              boxShadow: `0 0 20px ${skill.color}80` 
            }}
          />
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-white/20" /> Production Deployments
        </p>
        <div className="flex flex-wrap gap-2">
          {skill.projects.map((project, idx) => (
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              key={project} 
              className="rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md" 
              style={{ borderColor: `${skill.color}30`, color: `#fff`, background: `${skill.color}15` }}
            >
              {project}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── 2d grid layout ───────────────────────── */
function GeneralSkillsGrid() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-32 pt-[15vh]">
      <div className="mb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.30)", color: "#c4b5fd" }}>
          ✦ Technical Arsenal
        </span>
        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl" style={{ background: "linear-gradient(135deg,#ffffff,#c084fc 40%,#38bdf8 75%,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          General Skills Grid
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50 text-sm sm:text-base">
          A traditional, easily scannable layout of all the technologies, frameworks, and tools I use to build scalable digital experiences.
        </p>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label} className="mb-20">
          <h3 className="mb-8 flex items-center gap-3 text-2xl font-black text-white">
            <span className="h-4 w-4 rounded-full shadow-lg" style={{ background: group.color, boxShadow: `0 0 15px ${group.color}80` }} />
            {group.label}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.ids.map(id => {
              const skill = SKILLS.find(s => s.id === id);
              if (!skill) return null;
              const Icon = skill.Icon;
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} key={id}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-2xl"
                  style={{ borderColor: `${skill.color}30`, background: `linear-gradient(145deg, rgba(15,15,25,0.8), rgba(5,5,10,0.9))` }}>
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px] transition-opacity duration-500 group-hover:opacity-100 opacity-20" style={{ background: skill.color }} />
                  
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border" style={{ borderColor: `${skill.color}50`, background: `${skill.color}15`, color: skill.color }}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white leading-tight">{skill.name}</h4>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: skill.color }}>{skill.years}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mt-1">{skill.desc}</p>
                  
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Proficiency</span>
                      <span style={{ color: skill.color }}>{skill.level}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.level}%` }} transition={{ duration: 1, ease: "easeOut" }} viewport={{ once: true }} className="h-full rounded-full shadow-inner" style={{ background: skill.color, boxShadow: `0 0 10px ${skill.color}` }} />
                    </div>
                  </div>

                  {skill.projects.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skill.projects.map(p => (
                        <span key={p} className="rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/60" style={{ borderColor: `${skill.color}40`, background: `${skill.color}10` }}>{p}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileSkillsGrid() {
  const [activeSkill, setActiveSkill] = useState<SkillDef | null>(null);
  const spotlight = activeSkill ?? SKILLS[0];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050312] px-4 pb-20 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(360px 260px at 8% 10%, rgba(56,189,248,0.18), transparent 70%), radial-gradient(380px 300px at 96% 18%, rgba(251,146,60,0.14), transparent 72%), radial-gradient(480px 360px at 52% 4%, rgba(168,85,247,0.16), transparent 68%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[36rem]">
        <div className="mb-7">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em]"
            style={{
              background: "rgba(56,189,248,0.10)",
              borderColor: "rgba(56,189,248,0.28)",
              color: "#67e8f9",
            }}
          >
            <LayoutGrid size={12} /> Skills Grid
          </span>
          <h1
            className="mt-4 text-[2.85rem] font-black leading-[0.9] tracking-tight"
            style={{
              background: "linear-gradient(135deg,#ffffff 0%,#67e8f9 35%,#c084fc 66%,#fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tech
            <br />
            Mosaic
          </h1>
        </div>

        <motion.div
          key={spotlight.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-6 overflow-hidden rounded-[28px] border p-4"
          style={{
            borderColor: `${spotlight.color}55`,
            background: `linear-gradient(135deg, ${spotlight.color}1f, rgba(8,7,24,0.92) 48%, rgba(255,255,255,0.045))`,
            boxShadow: `0 24px 70px rgba(0,0,0,0.46), 0 0 44px ${spotlight.color}25`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border"
              style={{ borderColor: `${spotlight.color}66`, background: `${spotlight.color}1c` }}
            >
              <spotlight.Icon size={32} color={spotlight.color} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black leading-none">{spotlight.name}</h2>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: spotlight.color }}>
                    {spotlight.category}
                  </p>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-xs font-black" style={{ borderColor: `${spotlight.color}44`, color: spotlight.color }}>
                  {spotlight.level}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/64">{spotlight.desc}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          {GROUPS.map((group, groupIndex) => (
            <div key={group.label}>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${group.color}, transparent)` }} />
                <h3 className="shrink-0 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">{group.label}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {group.ids.map((id, index) => {
                  const skill = SKILLS.find((item) => item.id === id);
                  if (!skill) return null;
                  const Icon = skill.Icon;
                  const isActive = activeSkill?.id === skill.id;
                  const isTall = (index + groupIndex) % 5 === 0;

                  return (
                    <motion.button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        playMechanicalClick();
                        setActiveSkill((prev) => prev?.id === skill.id ? null : skill);
                      }}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.96 }}
                      viewport={{ once: true, margin: "-20px" }}
                      className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition ${isTall ? "min-h-[11.5rem]" : "min-h-[9.4rem]"}`}
                      style={{
                        borderColor: isActive ? `${skill.color}88` : `${skill.color}30`,
                        background: `linear-gradient(150deg, ${skill.color}${isActive ? "26" : "15"}, rgba(12,11,30,0.92) 54%, rgba(255,255,255,0.04))`,
                        boxShadow: isActive ? `0 18px 50px rgba(0,0,0,0.42), 0 0 34px ${skill.color}30` : "0 14px 36px rgba(0,0,0,0.26)",
                      }}
                    >
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: skill.color }} />
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="grid h-11 w-11 place-items-center rounded-2xl border"
                            style={{ borderColor: `${skill.color}4d`, background: `${skill.color}18` }}
                          >
                            <Icon size={23} color={skill.color} />
                          </div>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: skill.color }}>{skill.level}</span>
                        </div>
                        <div className="mt-auto pt-5">
                          <h4 className="text-lg font-black leading-none text-white">{skill.short}</h4>
                          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-white/44">{skill.category}</p>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            style={{ background: skill.color, boxShadow: `0 0 12px ${skill.color}` }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── scroll-driven one-screen layout ───────────────────────── */
export default function SkillsUniverse() {
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");

  // Scroll-driven: digital skills keyboard → scroll → it settles onto the desk while
  // the monitor rises and the stat cards fly in. (overflow-x:clip keeps sticky working.)
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  // build completes within the pinned range (section 230vh / pin 100vh → unpin ~0.56)
  const raw = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const build = useSpring(raw, { stiffness: 90, damping: 22, restDelta: 0.001 });
  const [activeSkill, setActiveSkill] = useState<SkillDef | null>(null);

  const toggleOp = useTransform(build, [0.82, 1], [0, 1]);
  const hintOp = useTransform(build, [0, 0.1], [1, 0]);
  const panelOp = useTransform(build, [0.08, 0.22], [1, 0.92]);
  const titleY = useTransform(build, [0, 1], ["0vh", "-3vh"]);
  const titleOp = useTransform(build, [0.1, 0.35], [1, 0]); // Fade out title when scrolling

  return (
    <div className="relative w-full bg-[#050312]">
      <div className="md:hidden">
        <MobileSkillsGrid />
      </div>

      <div className="hidden md:block">
      {/* View Toggle UI */}
      <div className="absolute right-4 top-[12vh] z-50 sm:right-8 sm:top-[14vh] xl:right-16 xl:top-[14vh]">
        <div className="flex items-center rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl shadow-2xl">
          <button onClick={() => setViewMode("3d")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${viewMode === "3d" ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white"}`}>
            <MonitorPlay size={14} /> <span className="hidden sm:inline">3D Desk</span>
          </button>
          <button onClick={() => setViewMode("grid")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${viewMode === "grid" ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white"}`}>
            <LayoutGrid size={14} /> <span className="hidden sm:inline">Grid View</span>
          </button>
        </div>
      </div>

      {viewMode === "3d" ? (
        <section ref={wrap} className="relative h-[230vh] w-full">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden text-white"
        style={{ background: "radial-gradient(ellipse 120% 70% at 50% 0%, #16133a 0%, #0a0820 45%, #050312 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(600px 400px at 12% 40%, rgba(56,189,248,0.10), transparent 70%), radial-gradient(600px 400px at 88% 40%, rgba(168,85,247,0.12), transparent 70%)" }} />

        {/* title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ y: titleY, opacity: titleOp, pointerEvents: "none" }}
          className="absolute left-0 right-0 top-[8vh] z-20 px-4 text-center sm:top-[10vh]">
          <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.30)", color: "#c4b5fd" }}>
            ✦ Galaxy of Skills
          </span>
          <h1 className="mt-3 font-black leading-none tracking-tight"
            style={{ fontSize: "clamp(2.2rem,8vw,5rem)", background: "linear-gradient(135deg,#ffffff,#c084fc 40%,#38bdf8 75%,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 45px rgba(124,58,237,0.4))" }}>
            Tech Universe
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs text-white/55 sm:text-sm md:text-base">
            A universe of technologies, frameworks, and tools I work with to build digital experiences.
          </p>
        </motion.div>

        {/* WebGL-built mechanical keyboard and desk */}
        <div className="absolute inset-0 z-0">
          <DeskScene build={build} activeSkill={activeSkill} onSkill={(skill) => setActiveSkill((prev) => prev?.id === skill.id ? null : skill)} />
        </div>

        {/* Skill Card Overlay - Now fully visible and responsive on mobile */}
        <motion.div style={{ opacity: panelOp }} 
          className="pointer-events-none absolute inset-x-4 top-[22vh] z-30 flex justify-center sm:inset-x-auto sm:right-4 sm:top-[20vh] lg:right-[3vw]"
        >
          <div className="pointer-events-auto w-full max-w-[24rem] sm:w-[22rem] lg:w-[27vw]">
            <DesktopSkillPanel skill={activeSkill} onClose={() => setActiveSkill(null)} />
          </div>
        </motion.div>

        {/* scroll hint (fades as you scroll) */}
        <motion.div style={{ opacity: hintOp }} className="absolute bottom-[3vh] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-cyan-300/70">
          <span className="text-xs font-bold uppercase tracking-[0.3em]">Scroll to build the desk</span>
          <ChevronDown size={18} className="animate-bounce" />
        </motion.div>

        {/* toggle (appears when assembled) */}
        <motion.div style={{ opacity: toggleOp }} className="absolute bottom-[3vh] left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full border border-white/12 bg-black/40 px-6 py-2.5 backdrop-blur">
            <span className="text-sm font-bold tracking-widest text-white">SKILLS</span>
            <div className="h-px w-16 bg-gradient-to-r from-cyan-400 to-violet-500" />
            <a href="/projects" className="flex items-center gap-1 text-sm font-bold tracking-widest text-white/45 transition hover:text-white">
              PROJECTS <ChevronRight size={14} />
            </a>
          </div>
        </motion.div>
      </div>
        </section>
      ) : (
        <section className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: "radial-gradient(ellipse 120% 70% at 50% 0%, #16133a 0%, #0a0820 45%, #050312 100%)" }}>
          <GeneralSkillsGrid />
        </section>
      )}
      </div>
    </div>
  );
}
