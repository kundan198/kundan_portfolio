"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { JOURNEY_LENGTH, clamp01, curvatureAt, frameAt } from "@/lib/journeyPath";
import { destinationAt } from "@/data/experiences";
import type { JourneyStore } from "@/hooks/useJourneyProgress";

const BACK_DISTANCE = 12.5;
const AHEAD_DISTANCE = 22;
const BASE_HEIGHT = 4.6;
/** Never let the rig drop into the tarmac. */
const MIN_CLEARANCE = 2.1;

interface CameraRigProps {
  store: JourneyStore;
  reducedMotion: boolean;
  /** Phones sit closer to the car so it still reads at a small size. */
  compact: boolean;
}

/**
 * A chase camera that samples the same spline as the car. It is deliberately
 * not parented to the car: position and look-at target are lerped separately so
 * the rig lags into corners and feels heavy.
 */
export default function CameraRig({ store, reducedMotion, compact }: CameraRigProps) {
  const backDistance = compact ? 13 : BACK_DISTANCE;
  const baseHeight = compact ? 4.4 : BASE_HEIGHT;
  const aheadDistance = compact ? 15 : AHEAD_DISTANCE;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const v = useMemo(
    () => ({
      frame: frameAt(0),
      behind: frameAt(0),
      ahead: frameAt(0),
      desired: new THREE.Vector3(),
      target: new THREE.Vector3(),
      smoothTarget: new THREE.Vector3(),
      intro: new THREE.Vector3(),
      initialised: false,
      fov: 52,
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);
    const p = clamp01(store.current);

    const backT = clamp01(p - backDistance / JOURNEY_LENGTH);
    const aheadT = clamp01(p + aheadDistance / JOURNEY_LENGTH);
    frameAt(p, v.frame);
    frameAt(backT, v.behind);
    frameAt(aheadT, v.ahead);

    const atStop = destinationAt(p) >= 0;
    const curve = curvatureAt(p);
    const speed = Math.min(store.speed, 0.35);

    // Compose the chase position: behind the car, lifted, and swung slightly
    // wide of the corner so the road stays in frame.
    const heightBoost = atStop ? -0.45 : 0;
    const lateral = reducedMotion ? 0 : THREE.MathUtils.clamp(curve * 26, -3.4, 3.4);
    v.desired
      .copy(v.behind.position)
      .addScaledVector(v.behind.right, lateral)
      .setY(v.behind.position.y + baseHeight + heightBoost);

    // Pull in a little at destinations so the reveal feels composed.
    if (atStop) v.desired.lerp(v.frame.position, 0.12);

    // Establishing shot: start wide and high, then settle into the chase.
    if (p < 0.08) {
      const k = 1 - clamp01(p / 0.08);
      v.intro
        .copy(v.frame.position)
        .addScaledVector(v.frame.right, compact ? 18 : 26)
        .addScaledVector(v.frame.tangent, compact ? -14 : -20);
      v.intro.y = v.frame.position.y + (compact ? 13 : 19);
      // easeInOutCubic keeps the hand-off from wide shot to chase invisible
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      v.desired.lerp(v.intro, e);
    }

    // On phones the card owns the lower half of the screen, so aim lower: that
    // lifts the car into the visible upper portion of the frame.
    v.target.copy(v.ahead.position).setY(v.ahead.position.y + (compact ? -4.6 : 1.5));

    if (!v.initialised) {
      camera.position.copy(v.desired);
      v.smoothTarget.copy(v.target);
      v.initialised = true;
    } else {
      const posK = 1 - Math.exp(-(reducedMotion ? 12 : 3.6) * dt);
      const aimK = 1 - Math.exp(-(reducedMotion ? 12 : 5.2) * dt);
      camera.position.lerp(v.desired, posK);
      v.smoothTarget.lerp(v.target, aimK);
    }

    // Collision guard: stay above the road surface and never inside the car.
    const floor = Math.max(v.frame.position.y, v.behind.position.y) + MIN_CLEARANCE;
    if (camera.position.y < floor) camera.position.y = floor;
    const gap = camera.position.distanceTo(v.frame.position);
    const minGap = compact ? 4.2 : 5.5;
    if (gap < minGap) {
      camera.position.sub(v.frame.position).setLength(minGap).add(v.frame.position);
    }

    camera.lookAt(v.smoothTarget);

    // Speed opens the lens a touch; destinations close it back down.
    const targetFov = reducedMotion ? 52 : (compact ? 58 : 50) + speed * 46 + (atStop ? -2.5 : 0);
    const nextFov = THREE.MathUtils.clamp(
      v.fov + (targetFov - v.fov) * (1 - Math.exp(-3 * dt)),
      46,
      compact ? 68 : 62,
    );
    if (Math.abs(nextFov - v.fov) > 0.01) {
      v.fov = nextFov;
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
