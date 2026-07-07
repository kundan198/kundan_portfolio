// Lightweight mutable trackers shared between physics bodies and the camera rig
// (avoids routing per-frame transforms through React state).
export const tracker = {
  hero: { x: -72, y: 1, z: -54, heading: 0.55, speed: 0, moving: false },
  car: { x: -66, y: 1, z: -50, heading: 0.55, speed: 0 },
  // Higgs-field boundary feedback: impact strength + last contact point,
  // written by hero/vehicle when they press against the world-edge barrier.
  field: { impact: 0, x: 0, z: 0 },
};
