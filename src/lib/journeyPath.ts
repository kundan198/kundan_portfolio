import * as THREE from "three";

/**
 * The road spline is the single source of truth for the journey: the car's
 * position and orientation, the camera rig, the district placement and the
 * traffic all sample this curve. Nothing in the scene hard-codes a position.
 */
const CONTROL_POINTS: [number, number, number][] = [
  [0, 0, 40],
  [0, 0, -30],
  [14, 0.6, -110],
  [40, 1.4, -180],
  [46, 1.8, -260],
  [22, 1.2, -330],
  [-18, 0.6, -390],
  [-52, 1, -460],
  [-56, 2.2, -545],
  [-30, 3, -620],
  [12, 3.4, -685],
  [56, 3, -750],
  [78, 2.4, -830],
  [64, 3.2, -915],
  [22, 5, -985],
  [-16, 8, -1050],
  [-30, 14, -1120],
  [-24, 22, -1195],
  [0, 32, -1265],
];

export const journeyCurve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "catmullrom",
  0.5,
);

export const ROAD_WIDTH = 13;
export const JOURNEY_LENGTH = journeyCurve.getLength();

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Guards against NaN/undefined leaking into the scene graph. */
export const safe = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export interface Frame {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  yaw: number;
  pitch: number;
}

/**
 * A stable frame at `t`. The right vector comes from the world up rather than a
 * Frenet normal, so the road never twists and the car can never flip on a
 * curve.
 */
export function frameAt(t: number, out?: Frame): Frame {
  const p = clamp01(t);
  const target: Frame = out ?? {
    position: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    right: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
  };
  journeyCurve.getPointAt(p, target.position);
  // getTangentAt is undefined exactly at 1, so sample just inside the end.
  journeyCurve.getTangentAt(Math.min(p, 0.99999), target.tangent).normalize();
  target.right.crossVectors(target.tangent, WORLD_UP).normalize();
  target.yaw = Math.atan2(target.tangent.x, target.tangent.z);
  const horizontal = Math.hypot(target.tangent.x, target.tangent.z);
  target.pitch = Math.atan2(target.tangent.y, horizontal || 1e-6);
  return target;
}

/** Signed horizontal curvature at `t`, used for body roll and camera easing. */
export function curvatureAt(t: number, delta = 0.006): number {
  const a = frameAt(clamp01(t - delta));
  const b = frameAt(clamp01(t + delta));
  let d = b.yaw - a.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return safe(d);
}

/** World position offset sideways from the road centre at `t`. */
export function offsetPoint(t: number, lateral: number, height = 0, out = new THREE.Vector3()): THREE.Vector3 {
  const f = frameAt(t);
  out.copy(f.position).addScaledVector(f.right, lateral);
  out.y += height;
  return out;
}
