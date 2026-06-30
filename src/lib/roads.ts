import { districts } from "./portfolio";

export type RoadPoint = [number, number];
export type RoadKind = "asphalt" | "brick" | "smart" | "boulevard" | "trail" | "mountain" | "coastal" | "service";

const districtPos = Object.fromEntries(districts.map((d) => [d.id, d.position])) as Record<string, RoadPoint>;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function catmull(points: RoadPoint[], i: number, t: number, closed = false): RoadPoint {
  const count = points.length;
  const get = (idx: number) => {
    if (closed) return points[(idx + count) % count];
    return points[Math.max(0, Math.min(count - 1, idx))];
  };
  const p0 = get(i - 1);
  const p1 = get(i);
  const p2 = get(i + 1);
  const p3 = get(i + 2);
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

export function smoothRoadPath(points: RoadPoint[], closed = false, step = 4.5): RoadPoint[] {
  const last = points[points.length - 1];
  const src = closed && points.length > 1 && points[0][0] === last[0] && points[0][1] === last[1]
    ? points.slice(0, -1)
    : points;
  const out: RoadPoint[] = [];
  const max = closed ? src.length : src.length - 1;
  for (let i = 0; i < max; i++) {
    const a = src[i];
    const b = src[(i + 1) % src.length];
    const samples = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let s = 0; s < samples; s++) out.push(catmull(src, i, s / samples, closed));
  }
  out.push(closed ? out[0] : src[src.length - 1]);
  return out.map((p, i, arr) => i === 0 ? p : [lerp(arr[i - 1][0], p[0], 0.92), lerp(arr[i - 1][1], p[1], 0.92)]);
}

export const ringRoad: RoadPoint[] = [
  [-88, -58],
  [-70, -34],
  [-66, -8],
  [-58, 26],
  [-34, 58],
  [-4, 76],
  [32, 66],
  [78, 52],
  [86, 18],
  [70, -18],
  [70, -58],
  [38, -72],
  [5, -46],
  [-32, -60],
  [-72, -62],
  [-88, -58],
];

export const roadBranches: { to: string; kind: RoadKind; points: RoadPoint[]; label: string }[] = [
  { to: "home", kind: "asphalt", label: "HOME", points: [[-88, -58], [-80, -60], districtPos.home] },
  { to: "campus", kind: "brick", label: "UNIVERSITY", points: [[-70, -34], [-62, -30], districtPos.campus] },
  { to: "lab", kind: "smart", label: "AI CAMPUS", points: [[-20, -20], [-10, -8], districtPos.lab] },
  { to: "startup", kind: "boulevard", label: "STARTUP", points: [[70, -18], [62, -4], districtPos.startup] },
  { to: "downtown", kind: "boulevard", label: "DOWNTOWN", points: [[-10, -38], districtPos.downtown] },
  { to: "waterfront", kind: "coastal", label: "WATERFRONT", points: [[58, -54], districtPos.waterfront] },
  { to: "forest", kind: "trail", label: "TECH FOREST", points: [[-70, 18], districtPos.forest] },
  { to: "summit", kind: "mountain", label: "OBSERVATORY", points: [[-34, 58], [-18, 70], districtPos.summit] },
  { to: "space", kind: "service", label: "SPACE CENTER", points: [[64, 48], districtPos.space] },
  { to: "central-avenue", kind: "boulevard", label: "CENTRAL", points: [[-54, -28], [-30, -18], [0, 0], [30, 4], [54, 10]] },
  { to: "downtown-spur", kind: "boulevard", label: "CITY LOOP", points: [[0, 0], [6, -22], districtPos.downtown, [34, -48], [70, -58]] },
  { to: "north-scenic", kind: "mountain", label: "SCENIC ROUTE", points: [[0, 0], [10, 28], [32, 66], districtPos.space] },
];

export const smoothRingRoad = smoothRoadPath(ringRoad, true, 7);

export const roadSegments = [
  ...smoothRingRoad.slice(0, -1).map((point, i) => ({ a: point, b: smoothRingRoad[i + 1], width: 5.2, kind: "asphalt" as RoadKind })),
  ...roadBranches.flatMap((branch) => {
    const width = roadWidth(branch.kind);
    const smooth = smoothRoadPath(branch.points, false, branch.kind === "trail" ? 5 : 7);
    return smooth.slice(0, -1).map((point, i) => ({ a: point, b: smooth[i + 1], width, kind: branch.kind }));
  }),
];

export function roadWidth(kind: RoadKind) {
  if (kind === "boulevard") return 4.1;
  if (kind === "coastal") return 3.4;
  if (kind === "service") return 3.2;
  if (kind === "smart") return 3.4;
  if (kind === "brick") return 3.0;
  if (kind === "mountain") return 2.4;
  if (kind === "trail") return 1.8;
  return 3.2;
}

export function distanceToSegment(x: number, z: number, a: RoadPoint, b: RoadPoint) {
  const ax = a[0];
  const az = a[1];
  const bx = b[0];
  const bz = b[1];
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
  const px = ax + dx * t;
  const pz = az + dz * t;
  return Math.hypot(x - px, z - pz);
}

export function distanceToRoad(x: number, z: number) {
  let best = Infinity;
  for (const s of roadSegments) best = Math.min(best, distanceToSegment(x, z, s.a, s.b) - s.width / 2);
  return best;
}

export function inDrivingCorridor(x: number, z: number, buffer = 1.2) {
  return distanceToRoad(x, z) < buffer;
}

// ---- Milestone 1: one continuous, ring-connected centerline per road ----
function nearestRingPoint(p: RoadPoint): RoadPoint {
  let best = smoothRingRoad[0];
  let bd = Infinity;
  for (const r of smoothRingRoad) {
    const d = Math.hypot(r[0] - p[0], r[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best;
}

export type RenderRoad = {
  id: string;
  kind: RoadKind;
  width: number;
  label?: string;
  points: RoadPoint[]; // dense, smoothed centerline
  loop: boolean;
};

// Every secondary road snaps to start exactly on the main ring (no abrupt mid-field
// starts) — except the interior "avenue" roads that intentionally cross the hub.
export const renderRoads: RenderRoad[] = [
  { id: "ring", kind: "asphalt", width: 6.0, points: smoothRingRoad, loop: true },
  ...roadBranches.map((b) => {
    const interior = Math.hypot(b.points[0][0], b.points[0][1]) < 10;
    const raw = interior ? b.points : [nearestRingPoint(b.points[0]), ...b.points];
    return {
      id: b.to,
      kind: b.kind,
      width: roadWidth(b.kind) + 1.6,
      label: b.label,
      points: smoothRoadPath(raw, false, b.kind === "trail" ? 4 : 6),
      loop: false,
    };
  }),
];
