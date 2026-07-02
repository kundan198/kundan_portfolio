"use client";

import { useMemo, useRef } from "react";
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
const RIDE = 0.55; // origin height above the terrain so the wheels rest on the ground

export default function Vehicle() {
  const body = useRef<RapierRigidBody>(null);
  const wheelFL = useRef<THREE.Group>(null);
  const wheelFR = useRef<THREE.Group>(null);
  const wheelBL = useRef<THREE.Group>(null);
  const wheelBR = useRef<THREE.Group>(null);
  const chassis = useRef<THREE.Group>(null);
  const brakeL = useRef<THREE.MeshStandardMaterial>(null);
  const brakeR = useRef<THREE.MeshStandardMaterial>(null);

  const heading = useRef(CAR_HEADING);
  const speed = useRef(0);
  const wheelSpin = useRef(0);
  const wasNear = useRef(false);

  // shared materials (defined once)
  const M = useMemo(() => ({
    paint: new THREE.MeshStandardMaterial({ color: "#c62636", metalness: 0.7, roughness: 0.32, envMapIntensity: 1.2 }),
    paintDark: new THREE.MeshStandardMaterial({ color: "#8f1b28", metalness: 0.7, roughness: 0.36 }),
    glass: new THREE.MeshStandardMaterial({ color: "#0d141d", metalness: 0.5, roughness: 0.08, envMapIntensity: 1.4, transparent: true, opacity: 0.86 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#d5dbe2", metalness: 0.95, roughness: 0.22, envMapIntensity: 1.5 }),
    trim: new THREE.MeshStandardMaterial({ color: "#1a1d24", metalness: 0.5, roughness: 0.4 }),
    tire: new THREE.MeshStandardMaterial({ color: "#141519", roughness: 0.85, metalness: 0.05 }),
    rim: new THREE.MeshStandardMaterial({ color: "#c2c8cf", metalness: 0.9, roughness: 0.28 }),
    head: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#fff2cc", emissiveIntensity: 3 }),
    tail: new THREE.MeshStandardMaterial({ color: "#ff2a2a", emissive: "#ff1a1a", emissiveIntensity: 1.4 }),
  }), []);

  useFrame((_, dt) => {
    const rb = body.current;
    if (!rb) return;
    const g = useGame.getState();
    const driving = !g.onFoot;
    const pos = rb.translation();

    // proximity to hero for the enter prompt
    const near = Math.hypot(pos.x - tracker.hero.x, pos.z - tracker.hero.z) < 4.5;
    if (g.onFoot && near !== wasNear.current) {
      wasNear.current = near;
      g.setNearVehicle(near);
    }
    if (!g.onFoot) wasNear.current = false;

    const input = getInput();
    let steer = 0;
    let braking = false;

    if (driving) {
      const throttle = input.forward - input.back;
      steer = input.left - input.right;
      const boost = input.boost ? 1.5 : 1;

      if (throttle > 0) speed.current += ACCEL * throttle * boost * dt;
      else if (throttle < 0) { speed.current += ACCEL * throttle * dt; braking = speed.current > 0; }
      else speed.current *= 1 - Math.min(1, dt * 1.2); // coast

      speed.current = THREE.MathUtils.clamp(speed.current, -REVERSE_SPEED, MAX_SPEED * boost);

      // steer scales with speed; reverse flips direction
      const speedFactor = THREE.MathUtils.clamp(Math.abs(speed.current) / 6, 0, 1);
      heading.current += steer * TURN_RATE * dt * speedFactor * Math.sign(speed.current || 1);

      audio.updateEngine(Math.min(1, Math.abs(speed.current) / MAX_SPEED), Math.abs(throttle) > 0.1);
      wheelSpin.current += speed.current * dt * 1.4;
    } else {
      speed.current *= 1 - Math.min(1, dt * 3);
      audio.engineOff();
    }

    // --- move in X/Z, then GLUE the car to the terrain surface. Setting the height
    //     from terrainHeight() every frame (with gravity disabled) means the car can
    //     never tunnel through the collision mesh or fall into a gap, so it never
    //     drops out of the world and teleports back home. ---
    const dir = new THREE.Vector3(Math.sin(heading.current), 0, Math.cos(heading.current));
    let nx = pos.x + dir.x * speed.current * dt;
    let nz = pos.z + dir.z * speed.current * dt;
    // keep the car inside the world so it can't drive off the terrain mesh
    const MAX_R = 116;
    const dist = Math.hypot(nx, nz);
    if (dist > MAX_R) {
      nx = (nx / dist) * MAX_R;
      nz = (nz / dist) * MAX_R;
      speed.current *= 0.3; // bleed off speed at the boundary
    }
    const gy = terrainHeight(nx, nz) + RIDE;
    rb.setTranslation({ x: nx, y: gy, z: nz }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);

    // pitch the body to follow the slope + a little lean into turns, for a natural ride
    if (chassis.current) {
      const ahead = terrainHeight(nx + dir.x * 1.6, nz + dir.z * 1.6);
      const behind = terrainHeight(nx - dir.x * 1.6, nz - dir.z * 1.6);
      const pitch = THREE.MathUtils.clamp((behind - ahead) / 3.2, -0.35, 0.35);
      const roll = THREE.MathUtils.clamp(-steer * (Math.abs(speed.current) / MAX_SPEED) * 0.12, -0.12, 0.12);
      chassis.current.rotation.x += (pitch - chassis.current.rotation.x) * Math.min(1, dt * 6);
      chassis.current.rotation.z += (roll - chassis.current.rotation.z) * Math.min(1, dt * 6);
    }
    rb.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, heading.current, 0)), true);

    // wheels: roll (around X) + front steer (around Y)
    const steerAngle = steer * 0.42;
    if (wheelFL.current) { wheelFL.current.rotation.y = steerAngle; wheelFL.current.rotation.x = wheelSpin.current; }
    if (wheelFR.current) { wheelFR.current.rotation.y = steerAngle; wheelFR.current.rotation.x = wheelSpin.current; }
    if (wheelBL.current) wheelBL.current.rotation.x = wheelSpin.current;
    if (wheelBR.current) wheelBR.current.rotation.x = wheelSpin.current;
    // brake-light glow when reversing/braking
    const bi = braking ? 3 : 1.2;
    if (brakeL.current) brakeL.current.emissiveIntensity = bi;
    if (brakeR.current) brakeR.current.emissiveIntensity = bi;

    tracker.car.x = nx;
    tracker.car.y = gy;
    tracker.car.z = nz;
    tracker.car.heading = heading.current;
    tracker.car.speed = Math.abs(speed.current);
  });

  const Wheel = ({ refObj }: { refObj: React.RefObject<THREE.Group | null> }) => (
    <group ref={refObj}>
      {/* tyre */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 20]} />
        <primitive object={M.tire} attach="material" />
      </mesh>
      {/* rim + hub */}
      <mesh position={[0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 12]} />
        <primitive object={M.rim} attach="material" />
      </mesh>
      <mesh position={[0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
        <primitive object={M.chrome} attach="material" />
      </mesh>
    </group>
  );

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[CAR_X, terrainHeight(CAR_X, CAR_Z) + RIDE, CAR_Z]}
      rotation={[0, CAR_HEADING, 0]}
      enabledRotations={[false, true, false]}
      gravityScale={0}
      mass={4}
      canSleep={false}
    >
      <CuboidCollider args={[0.95, 0.5, 2.0]} />

      {/* chassis group — tilts with slope/turns; wheels stay level below it */}
      <group ref={chassis}>
        {/* main body */}
        <mesh castShadow position={[0, 0.12, 0]}>
          <boxGeometry args={[1.9, 0.5, 3.9]} />
          <primitive object={M.paint} attach="material" />
        </mesh>
        {/* sculpted hood + trunk (a touch lower than the doors) */}
        <mesh castShadow position={[0, 0.34, 1.35]}>
          <boxGeometry args={[1.82, 0.26, 1.15]} />
          <primitive object={M.paint} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 0.36, -1.45]}>
          <boxGeometry args={[1.82, 0.3, 0.95]} />
          <primitive object={M.paint} attach="material" />
        </mesh>
        {/* rocker/belt-line trim */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.96, 0.16, 3.6]} />
          <primitive object={M.trim} attach="material" />
        </mesh>

        {/* glass greenhouse (cabin) + painted roof */}
        <mesh castShadow position={[0, 0.72, -0.05]}>
          <boxGeometry args={[1.62, 0.5, 1.9]} />
          <primitive object={M.glass} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 1.0, -0.1]}>
          <boxGeometry args={[1.5, 0.16, 1.55]} />
          <primitive object={M.paint} attach="material" />
        </mesh>
        {/* A/C pillars (thin) */}
        {([[-0.83, 0.9], [0.83, 0.9], [-0.83, -1.02], [0.83, -1.02]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.74, z]}>
            <boxGeometry args={[0.08, 0.5, 0.1]} />
            <primitive object={M.paintDark} attach="material" />
          </mesh>
        ))}

        {/* bumpers + grille */}
        <mesh position={[0, 0.1, 1.98]}><boxGeometry args={[1.9, 0.34, 0.28]} /><primitive object={M.trim} attach="material" /></mesh>
        <mesh position={[0, 0.1, -1.98]}><boxGeometry args={[1.9, 0.34, 0.28]} /><primitive object={M.trim} attach="material" /></mesh>
        <mesh position={[0, 0.26, 2.0]}><boxGeometry args={[0.9, 0.2, 0.06]} /><primitive object={M.chrome} attach="material" /></mesh>

        {/* headlights */}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0.3, 1.98]}>
            <boxGeometry args={[0.34, 0.16, 0.06]} />
            <primitive object={M.head} attach="material" />
          </mesh>
        ))}
        {/* tail-lights (brake glow) */}
        <mesh position={[-0.68, 0.34, -1.97]}>
          <boxGeometry args={[0.32, 0.16, 0.06]} />
          <meshStandardMaterial ref={brakeL} color="#ff2a2a" emissive="#ff1a1a" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0.68, 0.34, -1.97]}>
          <boxGeometry args={[0.32, 0.16, 0.06]} />
          <meshStandardMaterial ref={brakeR} color="#ff2a2a" emissive="#ff1a1a" emissiveIntensity={1.2} />
        </mesh>

        {/* wing mirrors */}
        {[-1.0, 1.0].map((x) => (
          <mesh key={x} castShadow position={[x, 0.74, 0.7]}>
            <boxGeometry args={[0.22, 0.12, 0.1]} />
            <primitive object={M.paint} attach="material" />
          </mesh>
        ))}
      </group>

      {/* wheels (kept level, outside the tilting chassis) */}
      <group position={[-0.98, -0.15, 1.28]}><Wheel refObj={wheelFL} /></group>
      <group position={[0.98, -0.15, 1.28]}><Wheel refObj={wheelFR} /></group>
      <group position={[-0.98, -0.15, -1.32]}><Wheel refObj={wheelBL} /></group>
      <group position={[0.98, -0.15, -1.32]}><Wheel refObj={wheelBR} /></group>
    </RigidBody>
  );
}
