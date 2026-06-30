// Deterministic value-noise + fBm, shared by terrain mesh and gameplay placement.
import { renderRoads } from "./roads";

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const perm = new Uint8Array(512);
{
  const rand = mulberry32(20240611);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + t * (b - a);
function grad(h: number, x: number, y: number) {
  const u = (h & 1) === 0 ? x : -x;
  const v = (h & 2) === 0 ? y : -y;
  return u + v;
}
export function noise2(x: number, y: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];
  return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u), lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
}
export function fbm(x: number, y: number, oct = 5) {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise2(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return v;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const WORLD_SIZE = 240;
const HALF = WORLD_SIZE / 2;

// ---------------------------------------------------------------- base terrain
// Rolling hills + crest ridges in the playable basin, big mountains at the rim.
export function baseHeight(wx: number, wz: number): number {
  const d = Math.hypot(wx, wz);
  let h = fbm(wx * 0.013 + 5, wz * 0.013 + 9, 4) * 5.5; // broad rolling hills
  h += fbm(wx * 0.05 + 20, wz * 0.05 + 41, 3) * 1.2; // medium detail
  h += (0.5 - Math.abs(fbm(wx * 0.022 + 60, wz * 0.022 + 80, 3))) * 5 * smoothstep(24, 70, d); // ridges
  const riverCut = Math.exp(-Math.pow((wz + wx * 0.32 + 18 + fbm(wx * 0.025 + 8, wz * 0.025 - 3, 3) * 12) / 9, 2));
  const ravine = Math.exp(-Math.pow((wz - wx * 0.58 - 22 + fbm(wx * 0.035 - 4, wz * 0.035 + 9, 3) * 7) / 6, 2));
  h -= riverCut * 4.2 * smoothstep(18, 88, d);
  h -= ravine * 3.4 * smoothstep(44, 112, d);
  h += Math.max(0, fbm(wx * 0.11 + 33, wz * 0.11 + 71, 3) - 0.12) * 5.6 * smoothstep(56, 112, d); // rocky outcrops
  const calm = 1 - smoothstep(0, 26, d); // calmer near the hub
  h *= 1 - calm * 0.55;
  const mtnMask = Math.pow(smoothstep(76, 120, d), 1.25);
  h += (fbm(wx * 0.03 + 31, wz * 0.03 + 17, 4) * 0.5 + 0.75) * 40 * mtnMask;
  const terrace = Math.round(h / 2.4) * 2.4;
  h = lerp(h, terrace, mtnMask * 0.22);
  return h;
}

// ---------------------------------------------- baked road-corridor flatten grid
// terrainHeight = base terrain, blended toward a smooth road grade inside corridors,
// so roads never float or clip. Baked once into a coarse grid for O(1) lookups.
const GRID = 168;
const CELL = WORLD_SIZE / GRID;
const influence = new Float32Array(GRID * GRID);
const target = new Float32Array(GRID * GRID);

function smoothArray(a: number[], win: number) {
  const n = a.length;
  const out = new Array<number>(n);
  const h = Math.floor(win / 2);
  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let j = -h; j <= h; j++) {
      const k = i + j;
      if (k >= 0 && k < n) {
        s += a[k];
        c++;
      }
    }
    out[i] = s / c;
  }
  return out;
}

(function bakeRoads() {
  // default target = base terrain everywhere (no artifacts where roads are absent)
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID; gx++) {
      target[gz * GRID + gx] = baseHeight(-HALF + gx * CELL, -HALF + gz * CELL);
    }
  }
  for (const road of renderRoads) {
    const pts = road.points;
    if (pts.length < 2) continue;
    const grade = smoothArray(pts.map((p) => baseHeight(p[0], p[1])), 13);
    const halfFlat = road.width / 2 + 0.7;
    const shoulder = halfFlat + 5;
    const rad = Math.ceil(shoulder / CELL);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const cgx = Math.round((p[0] + HALF) / CELL);
      const cgz = Math.round((p[1] + HALF) / CELL);
      for (let oz = -rad; oz <= rad; oz++) {
        for (let ox = -rad; ox <= rad; ox++) {
          const gx = cgx + ox;
          const gz = cgz + oz;
          if (gx < 0 || gz < 0 || gx >= GRID || gz >= GRID) continue;
          const dist = Math.hypot(-HALF + gx * CELL - p[0], -HALF + gz * CELL - p[1]);
          if (dist > shoulder) continue;
          const infl = smoothstep(shoulder, halfFlat, dist);
          const k = gz * GRID + gx;
          if (infl > influence[k]) {
            influence[k] = infl;
            target[k] = grade[i];
          }
        }
      }
    }
  }
})();

function bilerp(arr: Float32Array, fx: number, fz: number) {
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const tx = fx - x0;
  const tz = fz - z0;
  const i00 = z0 * GRID + x0;
  const a = arr[i00];
  const b = arr[i00 + 1];
  const c = arr[i00 + GRID];
  const d = arr[i00 + GRID + 1];
  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

// Height used by the terrain mesh + collider + every object placement + road ribbons.
export function terrainHeight(wx: number, wz: number): number {
  const base = baseHeight(wx, wz);
  const fx = (wx + HALF) / CELL;
  const fz = (wz + HALF) / CELL;
  if (fx < 0 || fz < 0 || fx >= GRID - 1 || fz >= GRID - 1) return base;
  const infl = bilerp(influence, fx, fz);
  if (infl < 0.003) return base;
  return base * (1 - infl) + bilerp(target, fx, fz) * infl;
}

// How far (m) a point is from the nearest flattened road corridor surface (>= 0 off-road).
export function roadFlatten(wx: number, wz: number): number {
  const fx = (wx + HALF) / CELL;
  const fz = (wz + HALF) / CELL;
  if (fx < 0 || fz < 0 || fx >= GRID - 1 || fz >= GRID - 1) return 0;
  return bilerp(influence, fx, fz);
}
