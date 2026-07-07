"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";

/* -------------------------------------------------------------------------- */
/*  Higgs Field — the world boundary made visible.                             */
/*                                                                            */
/*  A cylindrical energy barrier at the playable rim (R = 116). A hex-lattice */
/*  interference pattern with rising energy bands, fading in only when the    */
/*  player approaches the edge, and rippling outward from the contact point   */
/*  when the car or hero presses against it (the physics writes the impact    */
/*  into tracker.field). Additive, no depth write, and the whole mesh is      */
/*  culled when the player is far away — near-zero cost in normal play.       */
/* -------------------------------------------------------------------------- */

const RADIUS = 116.5;
const HEIGHT = 130;
const CENTER_Y = 40;

const vert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
varying vec3 vWorld;
uniform float uTime;
uniform float uNear;     // 0..1 — player proximity to the rim
uniform float uStrength; // 0..1 — impact ripple strength
uniform float uRing;     // ripple radius (m) since impact
uniform vec3 uImpact;    // world-space impact point

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, vec2(0.5, 0.8660254)), p.x);
}
// distance to the nearest edge of a unit hex grid
float hexEdge(vec2 uv) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return 0.5 - hexDist(g);
}

void main() {
  // unroll the cylinder: x = arc length along the wall, y = height
  vec2 p = vec2(atan(vWorld.x, vWorld.z) * 116.0, vWorld.y);
  float e = hexEdge(p * 0.55);
  float line = smoothstep(0.09, 0.0, e);                    // glowing hex borders
  float cells = smoothstep(0.45, 0.05, e) * 0.05;           // faint cell fill
  float scan = pow(fract(vWorld.y * 0.03 - uTime * 0.1), 6.0) * 0.6; // rising bands
  float flicker = 0.9 + 0.1 * sin(uTime * 3.0 + p.x * 0.05);
  float hFade = smoothstep(105.0, 34.0, vWorld.y) * smoothstep(-26.0, -2.0, vWorld.y);

  float ring = 0.0;
  if (uStrength > 0.003) {
    float d = distance(vWorld, uImpact);
    ring = exp(-pow((d - uRing) * 0.35, 2.0)) * uStrength * 1.6;
  }

  vec3 base = mix(vec3(0.15, 0.75, 1.0), vec3(0.55, 0.4, 1.0), smoothstep(0.0, 60.0, vWorld.y));
  float a = (line * 0.5 + cells + scan * 0.3) * flicker * hFade * uNear + ring;
  gl_FragColor = vec4(base * (0.6 + ring * 1.5), a);
}`;

export default function HiggsField() {
  const mesh = useRef<THREE.Mesh>(null);
  const ring = useRef(0);
  const strength = useRef(0);
  const lastImpact = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNear: { value: 0 },
      uStrength: { value: 0 },
      uRing: { value: 0 },
      uImpact: { value: new THREE.Vector3() },
    }),
    []
  );

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const onFoot = useGame.getState().onFoot;
    const t = onFoot ? tracker.hero : tracker.car;
    const playerR = Math.hypot(t.x, t.z);

    // fresh contact? restart the ripple from the impact point
    const f = tracker.field;
    if (f.impact > lastImpact.current + 0.01) {
      ring.current = 1.5;
      uniforms.uImpact.value.set(f.x, t.y + 1, f.z);
    }
    lastImpact.current = f.impact;
    strength.current += (f.impact - strength.current) * Math.min(1, dt * 10);
    f.impact *= Math.exp(-1.8 * dt);
    if (strength.current > 0.003) ring.current += 55 * dt;

    const near = THREE.MathUtils.smoothstep(playerR, 72, 112);
    uniforms.uNear.value = near;
    uniforms.uStrength.value = strength.current;
    uniforms.uRing.value = ring.current;
    uniforms.uTime.value = state.clock.elapsedTime;

    // skip the draw entirely when the field would be invisible
    m.visible = near > 0.01 || strength.current > 0.02;
  });

  return (
    <mesh ref={mesh} position={[0, CENTER_Y, 0]} visible={false} frustumCulled={false}>
      <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 96, 1, true]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
