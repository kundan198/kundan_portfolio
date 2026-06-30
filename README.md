# THE KUNDANVERSE 🌌

An interactive, open-world **3D portfolio** for **Kundan Srinivas Sakkuru** — built as a real-time
game you explore, not a page you scroll. Walk or drive through a living world; every district you
bring back to life reveals part of the story.

> Built with Next.js · React Three Fiber · Rapier physics · WebGL.

---

## ✨ Features

- **Cinematic boot intro** — dark screen → typed AI sequence → "WELCOME, EXPLORER".
- **Walk *and* drive** — a stylized hero (procedural walk/run/jump/double-jump) and a real-physics
  car. Press **E** near the car to drive; **E** again to hop out.
- **World-evolution** (the centerpiece) — the world starts grey, silent and incomplete. Completing
  each district's mission floods color back in, raises its skyline, brightens the music, and lights
  the map. At 100% the world is fully alive and the finale unlocks.
- **6 themed districts**, each a real part of the résumé:
  Home Base · Axiom University (education) · SHIELD Research Lab (research) · Startup District
  (projects) · Skills Forest (stack) · Achievement Summit (awards).
- **Missions** — collect glowing data-orbs scattered around each district to restore it.
- **Day/night cycle + weather** — animated sun arc, sunset, starfield at night, toggleable rain.
- **Real physics (Rapier)** — trimesh terrain that the hero/car follow, knock-around crates, jump
  ramps, vehicle dynamics, rigid bodies.
- **Holographic HUD** — mission tracker, live objective, restoration %, minimap + compass, toasts.
- **Procedural 3D audio** — ambient pad that brightens with vitality, engine, footsteps, collect
  chimes, UI blips, boot drone, finale fanfare (Web Audio — no audio files).
- **Post-processing** — bloom, vignette, and the grey→color saturation ramp tied to world vitality.
- **Cinematic finale** — a "SYSTEM COMPLETE" console with Email / GitHub / LinkedIn.
- **Responsive** — keyboard on desktop, on-screen touch controls on mobile.
- **SEO-friendly** — static landing metadata + `<noscript>` fallback; the heavy 3D bundle is
  code-split and only loads when you enter the world (landing First-Load JS ≈ 104 kB).

## 🎮 Controls

| Action | Keys |
| --- | --- |
| Move / steer | `W A S D` or arrow keys |
| Jump / double-jump | `Space` |
| Sprint / boost | `Shift` |
| Enter / exit vehicle | `E` |
| Sound · Weather | top-right HUD buttons |

## 🧱 Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · three.js · @react-three/fiber ·
@react-three/drei · @react-three/rapier · @react-three/postprocessing · zustand · Tailwind CSS v4.

## 🗂 Architecture

```
app/
  layout.tsx          # SEO metadata + globals
  page.tsx            # client entry; dynamically imports the experience (ssr:false)
  globals.css         # holographic HUD theme + Tailwind
components/
  App.tsx             # phase router: landing → intro → playing → finale
  World.tsx           # <Canvas> + <Physics> composition
  three/              # Environment, Terrain, Hero, Vehicle, Districts, Orb, Props,
                      # CameraRig, Rain, Effects
  ui/                 # Landing, Intro, HUD, DistrictPanel, Finale, TouchControls
lib/
  portfolio.ts        # ⭐ single source of truth — edit ALL content here
  store.ts            # zustand game state (vitality, missions, phases, weather)
  noise.ts            # deterministic terrain height fn (mesh + collider share it)
  input.ts            # unified keyboard + touch input
  audio.ts            # procedural Web-Audio engine
  refs.ts             # per-frame transform trackers (camera follow)
```

## ✏️ Editing your content

Everything personal lives in **`lib/portfolio.ts`** — `profile`, the `districts` array (name,
color, map position, mission, orb count, and content cards), the `finale` links, and the
`bootSequence` intro lines. Change those and the whole world updates.

## 🚀 Develop & deploy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the build
```

Deploy to **Vercel** (zero-config for Next.js): push to GitHub and import the repo.

## 🛣 Roadmap (honest next steps)

This is a deep, working foundation. Toward the full "AAA" vision these are the natural extensions —
each needs *art assets* or *backend infra* beyond pure front-end code:

- Rigged GLB character with motion-captured animation clips (swim/climb/parkour) via Blender.
- Hand-modeled city/vehicle GLBs (Draco/Meshopt compressed) streamed by region (world streaming).
- AI-driven NPCs (LLM backend) with memory + quests; real-time multiplayer (WebSocket/WebRTC).
- Baked global illumination / SSR / volumetric fog for photoreal lighting.

## 🗃 Legacy

The previous Vite + cannon-es driving prototype is preserved under `_legacy_vite/`.

---

© Kundan Srinivas Sakkuru · kundansrinivas377@gmail.com · Tampa, FL
