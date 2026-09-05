"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { JOURNEY_LENGTH, clamp01, curvatureAt, frameAt, safe } from "@/lib/journeyPath";
import type { JourneyStore } from "@/hooks/useJourneyProgress";

const WHEEL_RADIUS = 0.42;
const LOOK_AHEAD = 0.008;

interface CarProps {
  store: JourneyStore;
  quality: "low" | "medium" | "high";
  reducedMotion: boolean;
}

/**
 * The car is driven purely by damped journey progress. Orientation comes from a
 * yaw/pitch frame slerped toward its target, never from a per-frame lookAt, so
 * it cannot snap or flip on a curve.
 */
export default function Car({ store, quality, reducedMotion }: CarProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const brakeMat = useRef<THREE.MeshStandardMaterial>(null);

  const state = useMemo(
    () => ({
      quat: new THREE.Quaternion(),
      target: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      frame: frameAt(0),
      ahead: frameAt(0),
      lastProgress: 0,
      wheelSpin: 0,
      roll: 0,
      squat: 0,
      initialised: false,
    }),
    [],
  );

  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;
    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);
    const p = clamp01(store.current);

    frameAt(p, state.frame);
    frameAt(clamp01(p + LOOK_AHEAD), state.ahead);

    const { position } = state.frame;
    if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return;

    // Yaw from the look-ahead point, pitch from the local slope: a stable frame
    // built on world up rather than a Frenet normal.
    const dx = state.ahead.position.x - position.x;
    const dz = state.ahead.position.z - position.z;
    const dy = state.ahead.position.y - position.y;
    const horizontal = Math.hypot(dx, dz);
    const yaw = horizontal > 1e-5 ? Math.atan2(dx, dz) : state.frame.yaw;
    const pitch = horizontal > 1e-5 ? -Math.atan2(dy, horizontal) : 0;

    const curve = curvatureAt(p);
    const targetRoll = reducedMotion ? 0 : THREE.MathUtils.clamp(-curve * 3.4, -0.16, 0.16);
    state.roll += (targetRoll - state.roll) * (1 - Math.exp(-6 * dt));

    state.euler.set(safe(pitch), safe(yaw), safe(state.roll));
    state.target.setFromEuler(state.euler);

    if (!state.initialised) {
      state.quat.copy(state.target);
      state.lastProgress = p;
      state.initialised = true;
    } else {
      // Frame-rate independent slerp toward the target orientation.
      state.quat.slerp(state.target, 1 - Math.exp(-9 * dt));
    }

    group.position.set(position.x, position.y + 0.44, position.z);
    group.quaternion.copy(state.quat);

    // Wheels turn by distance travelled, not by clock time.
    const deltaProgress = p - state.lastProgress;
    state.lastProgress = p;
    const distance = deltaProgress * JOURNEY_LENGTH;
    state.wheelSpin += distance / WHEEL_RADIUS;
    const steer = THREE.MathUtils.clamp(-curve * 5, -0.4, 0.4);
    wheels.current.forEach((wheel, i) => {
      if (!wheel) return;
      wheel.rotation.x = state.wheelSpin;
      wheel.rotation.y = i < 2 ? steer : 0;
    });

    // Suspension: squat under acceleration, dip under braking, idle float.
    const speed = store.speed;
    const accel = (Math.abs(distance) / dt) * 0.0008;
    state.squat += (accel - state.squat) * (1 - Math.exp(-4 * dt));
    if (body.current) {
      const float = reducedMotion ? 0 : Math.sin(performance.now() * 0.0022) * 0.012;
      body.current.position.y = safe(float - state.squat * 0.05, 0);
      body.current.rotation.x = safe(THREE.MathUtils.clamp(state.squat * 0.02, -0.05, 0.05), 0);
    }

    // Brake lights glow when the journey slows or reverses.
    if (brakeMat.current) {
      const braking = deltaProgress < 0 || speed < 0.006 ? 1 : 0.28;
      brakeMat.current.emissiveIntensity += (braking * 3.4 - brakeMat.current.emissiveIntensity) * (1 - Math.exp(-8 * dt));
    }
  }, -1);

  const headlightTarget = useMemo(() => new THREE.Object3D(), []);
  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 16), []);
  const castShadow = quality !== "low";

  return (
    <group ref={root}>
      <group ref={body}>
        {/* chassis */}
        <mesh position={[0, 0.24, 0]} castShadow={castShadow} receiveShadow={castShadow}>
          <boxGeometry args={[1.86, 0.46, 4.3]} />
          <meshStandardMaterial color="#12172b" roughness={0.28} metalness={0.86} envMapIntensity={1.1} />
        </mesh>
        {/* nose + tail tapers */}
        <mesh position={[0, 0.3, 2.16]} castShadow={castShadow}>
          <boxGeometry args={[1.66, 0.34, 0.5]} />
          <meshStandardMaterial color="#0d1120" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.36, -2.18]} castShadow={castShadow}>
          <boxGeometry args={[1.78, 0.4, 0.42]} />
          <meshStandardMaterial color="#0d1120" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* cabin */}
        <mesh position={[0, 0.68, -0.2]} castShadow={castShadow}>
          <boxGeometry args={[1.5, 0.44, 2.1]} />
          <meshStandardMaterial
            color="#8ab4ff"
            roughness={0.12}
            metalness={0.4}
            transparent
            opacity={0.55}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* rear wing */}
        <mesh position={[0, 0.78, -2.05]} castShadow={castShadow}>
          <boxGeometry args={[1.7, 0.07, 0.42]} />
          <meshStandardMaterial color="#0b0f1c" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* side sills catching the street lights */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.96, 0.18, 0]}>
            <boxGeometry args={[0.06, 0.1, 3.2]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
        {/* headlights */}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0.34, 2.24]}>
            <boxGeometry args={[0.42, 0.14, 0.1]} />
            <meshStandardMaterial color="#ffffff" emissive="#dbeafe" emissiveIntensity={5} toneMapped={false} />
          </mesh>
        ))}
        {/* tail light bar */}
        <mesh position={[0, 0.42, -2.36]}>
          <boxGeometry args={[1.5, 0.1, 0.06]} />
          <meshStandardMaterial
            ref={brakeMat}
            color="#7f1d1d"
            emissive="#ff2d2d"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* wheels — front pair first so they can steer */}
      {[
        [-0.92, 0, 1.42],
        [0.92, 0, 1.42],
        [-0.92, 0, -1.42],
        [0.92, 0, -1.42],
      ].map(([x, y, z], i) => (
        <group
          key={i}
          position={[x, y, z]}
          ref={(el) => {
            if (el) wheels.current[i] = el;
          }}
        >
          <mesh geometry={wheelGeo} rotation={[0, 0, Math.PI / 2]} castShadow={castShadow}>
            <meshStandardMaterial color="#0a0d16" roughness={0.85} metalness={0.25} />
          </mesh>
        </group>
      ))}

      {/* one real light so the road ahead is genuinely lit. The target has to
          be an object in the graph — `target-position` alone aims the beam at
          the world origin. */}
      <primitive object={headlightTarget} position={[0, -0.6, 20]} />
      {quality !== "low" && (
        <spotLight
          position={[0, 0.8, 2.1]}
          target={headlightTarget}
          angle={0.5}
          penumbra={0.7}
          distance={54}
          decay={1.6}
          intensity={95}
          color="#cfe0ff"
          castShadow={false}
        />
      )}

      {/* glow pooled under the car */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]}>
        <circleGeometry args={[2.4, 20]} />
        <meshBasicMaterial
          color="#7c8cff"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
