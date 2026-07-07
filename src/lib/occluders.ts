// Building registry shared by the camera rig (view occlusion) and the vehicle
// (solid collision). Each entry approximates a tower as a vertical cylinder:
// `r` is the generous camera-blocking radius, `rc` the tighter physical radius.
export type Occluder = { x: number; z: number; r: number; rc: number; top: number };

const list: Occluder[] = [];

export function registerOccluders(items: Occluder[]): () => void {
  list.push(...items);
  return () => {
    for (const it of items) {
      const i = list.indexOf(it);
      if (i !== -1) list.splice(i, 1);
    }
  };
}

// Largest boom fraction (0..1] along the segment look-target -> desired camera
// position that stays clear of every occluder. Exact 2D ray/circle intersection
// with a height test at the entry point — no allocations, safe to call per frame.
export function clearBoomFraction(
  tx: number, ty: number, tz: number,
  dx: number, dy: number, dz: number
): number {
  let best = 1;
  const rx = dx - tx;
  const rz = dz - tz;
  const len2 = rx * rx + rz * rz;
  if (len2 < 1e-6) return 1;
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    const cx = o.x - tx;
    const cz = o.z - tz;
    const b = (cx * rx + cz * rz) / len2; // centre projected onto the segment
    if (b < -0.25 || b > 1.4) continue;
    const px = cx - rx * b;
    const pz = cz - rz * b;
    const d2 = px * px + pz * pz;
    const rr = o.r * o.r;
    if (d2 >= rr) continue;
    const tHit = b - Math.sqrt((rr - d2) / len2); // entry point
    if (tHit > 0 && tHit < best) {
      const hy = ty + (dy - ty) * tHit;
      if (hy < o.top) best = Math.max(0.14, tHit - 0.05);
    }
  }
  return best;
}

// Resolve a moving disc (the car footprint) against every building cylinder.
// Writes the corrected position into `out` and returns the collision normal
// (unit x/z) when a hit happened, so the caller can kill the velocity component
// pointing into the wall. Returns false when the disc is clear.
const hitNormal = { x: 0, z: 0 };
export function resolveBuildingCollision(
  out: { x: number; z: number },
  radius: number
): { x: number; z: number } | null {
  let hit = false;
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    const dx = out.x - o.x;
    const dz = out.z - o.z;
    const min = o.rc + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min || d2 < 1e-8) continue;
    const d = Math.sqrt(d2);
    const nx = dx / d;
    const nz = dz / d;
    out.x = o.x + nx * min;
    out.z = o.z + nz * min;
    hitNormal.x = nx;
    hitNormal.z = nz;
    hit = true;
  }
  return hit ? hitNormal : null;
}
