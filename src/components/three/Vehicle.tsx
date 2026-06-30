"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { useGame } from "@/lib/store";
import { getInput } from "@/lib/input";
import { tracker } from "@/lib/refs";
import { audio } from "@/lib/audio";
import { terrainHeight } from "@/lib/noise";

const ACCEL = 22;
const MAX_SPEED = 32;
const REVERSE_SPEED = 12;
const TURN_RATE = 2.1;
const CAR_X = -66;
const CAR_Z = -50;
const CAR_HEADING = 0.55;

export default function Vehicle() {
  const body = useRef<RapierRigidBody>(null);
  const wheelFL = useRef<THREE.Group>(null);
  const wheelFR = useRef<THREE.Group>(null);
  const wheelBL = useRef<THREE.Group>(null);
  const wheelBR = useRef<THREE.Group>(null);

  const heading = useRef(CAR_HEADING);
  const speed = useRef(0);
  const wheelSpin = useRef(0);
  const wasNear = useRef(false);

  useFrame((_, dt) => {
    const rb = body.current;
    if (!rb) return;
    const g = useGame.getState();
    const driving = !g.onFoot;
    const pos = rb.translation();

    // proximity to hero for enter prompt
    const near = Math.hypot(pos.x - tracker.hero.x, pos.z - tracker.hero.z) < 4.5;
    if (g.onFoot && near !== wasNear.current) {
      wasNear.current = near;
      g.setNearVehicle(near);
    }
    if (!g.onFoot) wasNear.current = false;

    const input = getInput();
    const vel = rb.linvel();

    if (driving) {
      const throttle = input.forward - input.back;
      const steer = input.left - input.right;
      const boost = input.boost ? 1.5 : 1;

      if (throttle > 0) speed.current += ACCEL * throttle * boost * dt;
      else if (throttle < 0) speed.current += ACCEL * throttle * dt;
      else speed.current *= 1 - Math.min(1, dt * 1.2); // coast

      speed.current = THREE.MathUtils.clamp(speed.current, -REVERSE_SPEED, MAX_SPEED * boost);

      // steer scales with speed, reverse flips
      const speedFactor = THREE.MathUtils.clamp(Math.abs(speed.current) / 6, 0, 1);
      heading.current += steer * TURN_RATE * dt * speedFactor * Math.sign(speed.current || 1);

      const dir = new THREE.Vector3(Math.sin(heading.current), 0, Math.cos(heading.current));
      rb.setLinvel({ x: dir.x * speed.current, y: vel.y, z: dir.z * speed.current }, true);
      rb.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, heading.current, 0)), true);

      audio.updateEngine(Math.min(1, Math.abs(speed.current) / MAX_SPEED), Math.abs(throttle) > 0.1);
      wheelSpin.current += speed.current * dt * 1.4;

      // wheel steer visual
      const steerAngle = steer * 0.4;
      if (wheelFL.current) wheelFL.current.rotation.y = steerAngle;
      if (wheelFR.current) wheelFR.current.rotation.y = steerAngle;
    } else {
      // parked: bleed speed, gentle damping
      speed.current *= 1 - Math.min(1, dt * 3);
      rb.setLinvel({ x: vel.x * 0.9, y: vel.y, z: vel.z * 0.9 }, true);
      audio.engineOff();
    }

    // spin wheels
    [wheelBL, wheelBR].forEach((w) => {
      if (w.current) w.current.rotation.x = wheelSpin.current;
    });
    if (wheelFL.current) wheelFL.current.rotation.x = wheelSpin.current;
    if (wheelFR.current) wheelFR.current.rotation.x = wheelSpin.current;

    tracker.car.x = pos.x;
    tracker.car.y = pos.y;
    tracker.car.z = pos.z;
    tracker.car.heading = heading.current;
    tracker.car.speed = Math.abs(speed.current);

    if (pos.y < -20) {
      rb.setTranslation({ x: CAR_X, y: terrainHeight(CAR_X, CAR_Z) + 3, z: CAR_Z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      speed.current = 0;
      heading.current = CAR_HEADING;
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[CAR_X, terrainHeight(CAR_X, CAR_Z) + 1.5, CAR_Z]}
      rotation={[0, CAR_HEADING, 0]}
      enabledRotations={[false, true, false]}
      mass={4}
      linearDamping={0.2}
      angularDamping={1}
      canSleep={false}
    >
      <CuboidCollider args={[1.0, 0.5, 2.0]} />
      {/* body */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2, 0.7, 4]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* cabin */}
      <mesh castShadow position={[0, 0.6, -0.1]}>
        <boxGeometry args={[1.6, 0.55, 1.9]} />
        <meshStandardMaterial color="#101522" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* headlights */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.15, 2.02]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#fff" emissive="#fff2cc" emissiveIntensity={3} />
        </mesh>
      ))}
      {/* wheels */}
      {(
        [
          [wheelFL, -1.05, -0.3, 1.3],
          [wheelFR, 1.05, -0.3, 1.3],
          [wheelBL, -1.05, -0.3, -1.3],
          [wheelBR, 1.05, -0.3, -1.3],
        ] as const
      ).map(([ref, x, y, z], i) => (
        <group key={i} ref={ref} position={[x, y, z]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}
