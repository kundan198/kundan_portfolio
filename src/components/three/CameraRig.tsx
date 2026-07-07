"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";
import { terrainHeight } from "@/lib/noise";
import { clearBoomFraction } from "@/lib/occluders";

/* -------------------------------------------------------------------------- */
/*  Spring-arm chase camera with occlusion detection.                          */
/*                                                                            */
/*  Every frame the boom from the look-target back to the desired camera spot */
/*  is tested against the building registry (exact ray/cylinder hits) and the */
/*  terrain. When something blocks the view the boom snaps in fast, then      */
/*  relaxes back out slowly — the standard AAA chase-cam feel. On top: a      */
/*  speed-based FOV kick while driving, look-ahead toward travel direction,   */
/*  walk bob on foot and a micro-shake at high speed. Zero per-frame          */
/*  allocations — everything below lives in module temps or refs.             */
/* -------------------------------------------------------------------------- */

const _desired = new THREE.Vector3();
const _target = new THREE.Vector3();

const MAX_CAR_SPEED = 30;

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const boom = useRef(1); // smoothed clear-boom fraction (occlusion)
  const fov = useRef(58);

  useFrame((state, dt) => {
    const onFoot = useGame.getState().onFoot;
    const t = onFoot ? tracker.hero : tracker.car;
    const h = t.heading;
    const speed01 = onFoot ? 0 : Math.min(1, t.speed / MAX_CAR_SPEED);

    // boom stretches slightly with speed so velocity reads on screen
    const dist = onFoot ? 7.4 : 9.6 + speed01 * 1.8;
    const height = onFoot ? 3.85 : 4.4 + speed01 * 0.5;
    const shoulder = onFoot ? 0.95 : 0;

    // ---- look target with travel look-ahead ----
    const ahead = onFoot ? 2.0 : Math.min(4.2, t.speed * 0.14);
    const targetY = Math.max(t.y + (onFoot ? 1.35 : 1.1), terrainHeight(t.x, t.z) + (onFoot ? 1.55 : 1.1));
    _target.set(t.x + Math.sin(h) * ahead, targetY, t.z + Math.cos(h) * ahead);

    // ---- desired camera position at full boom ----
    _desired.set(
      t.x - Math.sin(h) * dist + Math.cos(h) * shoulder,
      t.y + height,
      t.z - Math.cos(h) * dist - Math.sin(h) * shoulder
    );
    _desired.y = Math.max(_desired.y, terrainHeight(_desired.x, _desired.z) + (onFoot ? 2.45 : 3.6));

    // ---- occlusion: shorten the boom when a building blocks the view ----
    const clear = clearBoomFraction(_target.x, _target.y, _target.z, _desired.x, _desired.y, _desired.z);
    const rate = clear < boom.current ? Math.min(1, dt * 11) : Math.min(1, dt * 2.2);
    boom.current += (clear - boom.current) * rate;
    _desired.lerpVectors(_target, _desired, boom.current);
    // keep the pulled-in camera above the ground too
    _desired.y = Math.max(_desired.y, terrainHeight(_desired.x, _desired.z) + 1.2);

    // walk bob / speed crouch
    const walkBob = onFoot && t.speed > 0.2 ? Math.sin(performance.now() * 0.012) * 0.025 : 0;
    _desired.y += walkBob - (onFoot ? Math.min(0.35, t.speed * 0.018) : 0);

    // frame-rate-independent smoothing
    const lerp = 1 - Math.pow(onFoot ? 0.0025 : 0.0012, dt);
    camera.position.lerp(_desired, lerp);

    // micro-shake at high speed (driving only) — sells the sense of velocity
    if (!onFoot && speed01 > 0.4) {
      const amp = (speed01 - 0.4) * (speed01 - 0.4) * 0.16;
      const tt = state.clock.elapsedTime;
      camera.position.x += Math.sin(tt * 31.7) * amp;
      camera.position.y += Math.sin(tt * 47.3 + 1.7) * amp * 0.6;
    }

    look.current.lerp(_target, lerp);
    camera.lookAt(look.current);

    // ---- FOV: responsive base (portrait phones see more) + speed kick ----
    const aspect = size.width / Math.max(1, size.height);
    const base = aspect < 0.7 ? 74 : aspect < 1 ? 66 : 58;
    const targetFov = base + speed01 * speed01 * 11;
    fov.current += (targetFov - fov.current) * Math.min(1, dt * 4);
    if (Math.abs(camera.fov - fov.current) > 0.01) {
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
