import { useEffect, useRef, useState, useCallback } from "react";
import Experience from "../game/Experience.js";
import Audio from "../game/Audio.js";
import { zones as ZONE_DATA, portfolio } from "../data/portfolio.js";

const MAP_RANGE = 80; // world half-extent shown on minimap

export default function GameMode({ onExit }) {
  const canvasRef = useRef(null);
  const expRef = useRef(null);
  const audioRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [stats, setStats] = useState({ speed: 0, score: 0, total: 0, fps: 0, car: { x: 0, z: 0, heading: 0 } });
  const [zone, setZone] = useState(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const exp = new Experience({
      canvas: canvasRef.current,
      audio,
      onStats: setStats,
      onZone: setZone,
      onReady: () => setReady(true),
    });
    expRef.current = exp;
    if (typeof window !== "undefined") window.__game = exp; // debug handle
    return () => {
      exp.dispose();
      expRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    audioRef.current?.init();
    setStarted(true);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audioRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  // touch button helpers
  const touch = (dir) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      expRef.current?.controls.setTouch(dir, true);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      expRef.current?.controls.setTouch(dir, false);
    },
    onPointerLeave: () => expRef.current?.controls.setTouch(dir, false),
    onPointerCancel: () => expRef.current?.controls.setTouch(dir, false),
  });

  const cycleCamera = () => expRef.current && expRef.current.controls.onCamera?.();
  const resetCar = () => expRef.current?.resetCar();

  const carX = ((stats.car.x + MAP_RANGE) / (MAP_RANGE * 2)) * 100;
  const carY = ((stats.car.z + MAP_RANGE) / (MAP_RANGE * 2)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#070a12] overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* ===== Loading / Start screen ===== */}
      {!started && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070a12]/85 backdrop-blur-sm px-6 text-center">
          <div className="font-mono text-xs tracking-[0.4em] text-cyan-300/80">PORTFOLIO • DRIVE MODE</div>
          <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white">{portfolio.name}</h1>
          <p className="mt-3 max-w-xl text-white/70">{portfolio.headline}</p>
          <p className="mt-2 max-w-lg text-sm text-white/50">
            Drive a real-physics car around the world. Reach the glowing stations to reveal each part of my story,
            collect data-crystals, hit the ramps, and crash through the crates.
          </p>

          <button
            onClick={start}
            disabled={!ready}
            className="mt-8 rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-8 py-4 text-lg font-semibold text-white transition hover:bg-cyan-400/25 disabled:opacity-50"
          >
            {ready ? "▶  START ENGINE" : "Loading world…"}
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-white/55">
            <Kbd>W A S D</Kbd> / <Kbd>↑ ← ↓ →</Kbd> drive
            <Kbd>Space</Kbd> brake
            <Kbd>Shift</Kbd> boost
            <Kbd>R</Kbd> reset
            <Kbd>C</Kbd> camera
          </div>

          <button onClick={onExit} className="mt-8 text-xs text-white/40 underline underline-offset-4 hover:text-white/70">
            skip — view classic portfolio
          </button>
        </div>
      )}

      {/* ===== HUD ===== */}
      {started && (
        <>
          {/* top bar */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-4">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={onExit}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-mono text-white/80 backdrop-blur transition hover:bg-black/60"
              >
                ← CLASSIC SITE
              </button>
              <button
                onClick={toggleMute}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-mono text-white/80 backdrop-blur transition hover:bg-black/60"
              >
                {muted ? "🔇 SOUND" : "🔊 SOUND"}
              </button>
              <button
                onClick={() => setShowHelp((s) => !s)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-mono text-white/80 backdrop-blur transition hover:bg-black/60"
              >
                ? HELP
              </button>
            </div>

            {/* score + fps */}
            <div className="pointer-events-none rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-right font-mono text-xs text-white/80 backdrop-blur">
              <div>
                💎 <span className="text-yellow-300">{stats.score}</span> / {stats.total}
              </div>
              <div className="text-white/45">{stats.fps} fps</div>
            </div>
          </div>

          {/* minimap */}
          <div className="pointer-events-none absolute bottom-4 right-4 z-20 h-40 w-40 rounded-xl border border-white/15 bg-black/45 backdrop-blur">
            <div className="absolute left-2 top-1 font-mono text-[9px] tracking-widest text-white/45">MAP</div>
            {ZONE_DATA.map((z) => {
              const x = ((z.position[0] + MAP_RANGE) / (MAP_RANGE * 2)) * 100;
              const y = ((z.position[1] + MAP_RANGE) / (MAP_RANGE * 2)) * 100;
              return (
                <div
                  key={z.id}
                  className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${x}%`, top: `${y}%`, background: z.color, boxShadow: `0 0 6px ${z.color}` }}
                  title={z.label}
                />
              );
            })}
            {/* car */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${carX}%`, top: `${carY}%` }}
            >
              <div
                className="h-0 w-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: "10px solid #ffffff",
                  transform: `rotate(${stats.car.heading}rad)`,
                  filter: "drop-shadow(0 0 4px #fff)",
                }}
              />
            </div>
          </div>

          {/* speedometer */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl border border-white/15 bg-black/45 px-5 py-3 backdrop-blur">
            <div className="font-mono text-[10px] tracking-widest text-white/45">SPEED</div>
            <div className="font-mono text-3xl font-bold text-cyan-300 tabular-nums">
              {String(stats.speed).padStart(3, "0")}
            </div>
            <div className="font-mono text-[10px] text-white/40">km/h</div>
          </div>

          {/* zone info panel */}
          {zone && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-20 w-[min(92vw,640px)] -translate-x-1/2">
              <div
                className="rounded-2xl border bg-black/65 p-5 backdrop-blur-md shadow-2xl"
                style={{ borderColor: zone.color }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: zone.color, boxShadow: `0 0 8px ${zone.color}` }} />
                  <span className="font-mono text-[11px] tracking-[0.3em]" style={{ color: zone.color }}>
                    {zone.label}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-white">{zone.title}</h2>
                <div className="mt-3 space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                  {zone.lines.map((l, i) => (
                    <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-white/80">
                      {l}
                    </p>
                  ))}
                </div>
                {zone.actions && (
                  <div className="pointer-events-auto mt-4 flex flex-wrap gap-2">
                    {zone.actions.map((a) => (
                      <a
                        key={a.label}
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                      >
                        {a.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* help overlay */}
          {showHelp && (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-6"
              onClick={() => setShowHelp(false)}
            >
              <div className="max-w-md rounded-2xl border border-white/15 bg-[#0b1020] p-6 text-sm text-white/80">
                <h3 className="text-lg font-bold text-white">How to play</h3>
                <ul className="mt-4 space-y-2">
                  <li><b className="text-white">Drive</b> — W/A/S/D or arrow keys</li>
                  <li><b className="text-white">Brake</b> — Space · <b className="text-white">Boost</b> — Shift</li>
                  <li><b className="text-white">Reset car</b> — R · <b className="text-white">Camera</b> — C</li>
                  <li><b className="text-white">Stations</b> — drive into a glowing ring to read that section</li>
                  <li><b className="text-white">Crystals</b> — collect all {stats.total} 💎</li>
                  <li><b className="text-white">Contact</b> — drive onto the floating link pads to open Email / LinkedIn / GitHub</li>
                </ul>
                <button className="mt-5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white" onClick={() => setShowHelp(false)}>
                  Got it
                </button>
              </div>
            </div>
          )}

          {/* touch controls (mobile) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex items-end justify-between px-6 md:hidden">
            <div className="pointer-events-auto grid grid-cols-3 gap-2">
              <span />
              <TouchBtn label="▲" {...touch("forward")} />
              <span />
              <TouchBtn label="◀" {...touch("left")} />
              <TouchBtn label="▼" {...touch("backward")} />
              <TouchBtn label="▶" {...touch("right")} />
            </div>
            <div className="pointer-events-auto flex flex-col gap-2">
              <TouchBtn label="BOOST" small {...touch("boost")} />
              <TouchBtn label="BRAKE" small {...touch("brake")} />
              <button
                onPointerDown={resetCar}
                className="rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs font-mono text-white/80"
              >
                RESET
              </button>
              <button
                onPointerDown={cycleCamera}
                className="rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs font-mono text-white/80"
              >
                CAM
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const Kbd = ({ children }) => (
  <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white/80">{children}</span>
);

const TouchBtn = ({ label, small, ...rest }) => (
  <button
    {...rest}
    className={`flex items-center justify-center rounded-xl border border-white/20 bg-black/50 font-mono text-white/85 backdrop-blur active:bg-white/25 ${
      small ? "h-12 w-20 text-xs" : "h-14 w-14 text-lg"
    }`}
  >
    {label}
  </button>
);
