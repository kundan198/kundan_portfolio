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
import { resolveBuildingCollision } from "@/lib/occluders";

/* -------------------------------------------------------------------------- */
/*  Physically-modelled car.                                                   */
/*                                                                            */
/*  Longitudinal: engine force, service brakes, aero drag (∝ v²), rolling     */
/*  resistance and the gravity component along the slope — hills genuinely    */
/*  slow the car down and pull it back.                                       */
/*  Lateral: velocity is a real 2D vector; each frame it is decomposed into   */
/*  the car's new frame and the sideways component decays with tyre grip.     */
/*  Space is a handbrake — grip drops and the rear steps out (drift).        */
/*  Steering: speed-sensitive bicycle model (yaw rate = v/L · tan δ).         */
/*  Suspension: each wheel samples the terrain; the body rides a spring-      */
/*  damper on the average contact height, with weight-transfer pitch/roll.    */
/*  Buildings are solid — the car collides and slides along their walls.      */
/* -------------------------------------------------------------------------- */

const ENGINE_ACCEL = 23; // peak drive acceleration, m/s²
const BOOST_MULT = 1.45;
const BRAKE_DECEL = 30;
const HANDBRAKE_DECEL = 15;
const ROLL_RESIST = 1.6; // m/s², constant while rolling
const DRAG = 0.024; // m/s² per (m/s)² -> ~29 m/s top speed on the flat
const REVERSE_ACCEL = 12;
const MAX_REVERSE = 9;
const GRAVITY = 9.81;
const WHEELBASE = 2.6;
const TRACK = 1.96;
const WHEEL_R = 0.4;
const MAX_STEER = 0.6; // rad at standstill
const STEER_RATE = 7; // steering slew, rad/s
const GRIP = 7.5; // lateral slip decay (1/s)
const DRIFT_GRIP = 1.9; // grip while the handbrake is pulled
const SUSP_STIFF = 105; // body heave spring
const SUSP_DAMP = 13;
const CAR_BODY_R = 1.5; // collision footprint vs buildings
const RIDE = 0.55;
const MAX_R = 116;
const CAR_X = -66;
const CAR_Z = -50;
const CAR_HEADING = 0.55;

// wheel anchor offsets in car space (x = right, z = forward)
const WHEELS = [
  { ox: -0.98, oz: 1.28 }, // FL
  { ox: 0.98, oz: 1.28 }, // FR
  { ox: -0.98, oz: -1.32 }, // BL
  { ox: 0.98, oz: -1.32 }, // BR
];

const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _pos = { x: 0, z: 0 };
const contacts = [0, 0, 0, 0];

export default function Vehicle() {
  const body = useRef<RapierRigidBody>(null);
  const wheelFL = useRef<THREE.Group>(null);
  const wheelFR = useRef<THREE.Group>(null);
  const wheelBL = useRef<THREE.Group>(null);
  const wheelBR = useRef<THREE.Group>(null);
  const suspRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const chassis = useRef<THREE.Group>(null);
  const brakeL = useRef<THREE.MeshStandardMaterial>(null);
  const brakeR = useRef<THREE.MeshStandardMaterial>(null);

  const heading = useRef(CAR_HEADING);
  const vx = useRef(0);
  const vz = useRef(0);
  const steer = useRef(0);
  const wheelSpin = useRef(0);
  const bodyY = useRef(terrainHeight(CAR_X, CAR_Z) + RIDE);
  const bodyVy = useRef(0);
  const prevVF = useRef(0);
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

  useFrame((_, frameDt) => {
    const dt = Math.min(frameDt, 1 / 30);
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
    let braking = false;
    let handbrake = false;

    // frame axes from the CURRENT heading (updated below, then re-derived)
    let fx = Math.sin(heading.current);
    let fz = Math.cos(heading.current);

    // signed forward speed drives steering feel and the yaw model
    let vF = vx.current * fx + vz.current * fz;

    if (driving) {
      const throttle = input.forward - input.back;
      handbrake = input.jump;

      // steering wheel slews toward the input; usable angle shrinks with speed
      const steerLimit = MAX_STEER / (1 + Math.abs(vF) * 0.055);
      const steerTarget = (input.left - input.right) * steerLimit;
      steer.current += THREE.MathUtils.clamp(steerTarget - steer.current, -STEER_RATE * dt, STEER_RATE * dt);

      // yaw from the bicycle model — no yaw when the car isn't rolling
      const yawRate = Math.abs(vF) > 0.05 ? (vF / WHEELBASE) * Math.tan(steer.current) * (handbrake ? 1.4 : 1) : 0;
      heading.current += yawRate * dt;

      audio.updateEngine(Math.min(1, Math.abs(vF) / 30), Math.abs(throttle) > 0.1);
    } else {
      steer.current += (0 - steer.current) * Math.min(1, dt * 6);
      audio.engineOff();
    }

    // re-derive axes after the yaw step; the old velocity decomposed in the NEW
    // frame naturally produces lateral slip that the tyres then bite down on
    fx = Math.sin(heading.current);
    fz = Math.cos(heading.current);
    const rx = Math.cos(heading.current);
    const rz = -Math.sin(heading.current);
    vF = vx.current * fx + vz.current * fz;
    let vLat = vx.current * rx + vz.current * rz;

    // ---- longitudinal forces ----
    let aF = 0;
    if (driving) {
      const throttle = input.forward - input.back;
      const boost = input.boost ? BOOST_MULT : 1;
      if (throttle > 0.01) {
        if (vF < -0.3) { aF += BRAKE_DECEL * throttle; braking = true; }
        else aF += ENGINE_ACCEL * throttle * boost;
      } else if (throttle < -0.01) {
        if (vF > 0.3) { aF += BRAKE_DECEL * throttle; braking = true; }
        else aF += REVERSE_ACCEL * throttle;
      }
      if (handbrake && Math.abs(vF) > 0.2) { aF -= Math.sign(vF) * HANDBRAKE_DECEL; braking = true; }
    } else if (Math.abs(vF) > 0.2) {
      aF -= Math.sign(vF) * BRAKE_DECEL * 0.4; // parked — brakes hold it
    }

    // resistances always oppose motion
    if (Math.abs(vF) > 0.05) aF -= Math.sign(vF) * (ROLL_RESIST + DRAG * vF * vF);

    // gravity along the slope: sample the grade under the axles
    const hAhead = terrainHeight(pos.x + fx * 1.3, pos.z + fz * 1.3);
    const hBehind = terrainHeight(pos.x - fx * 1.3, pos.z - fz * 1.3);
    const gradeF = (hAhead - hBehind) / 2.6;
    aF -= GRAVITY * gradeF * 0.9;

    vF += aF * dt;
    vF = THREE.MathUtils.clamp(vF, -MAX_REVERSE, 60);
    // don't let brakes push the car backwards through zero
    if (braking && !driving) vF = Math.abs(vF) < 0.15 ? 0 : vF;

    // ---- lateral: tyre grip bleeds sideways velocity; camber pulls downhill ----
    const grip = handbrake ? DRIFT_GRIP : GRIP;
    vLat *= Math.exp(-grip * dt);
    const hRight = terrainHeight(pos.x + rx * 1.1, pos.z + rz * 1.1);
    const hLeft = terrainHeight(pos.x - rx * 1.1, pos.z - rz * 1.1);
    const gradeR = (hRight - hLeft) / 2.2;
    vLat -= GRAVITY * gradeR * 0.35 * dt;

    vx.current = fx * vF + rx * vLat;
    vz.current = fz * vF + rz * vLat;

    // ---- integrate position ----
    let nx = pos.x + vx.current * dt;
    let nz = pos.z + vz.current * dt;

    // Higgs-field boundary: slide along the barrier, keep tangential speed
    const dc = Math.hypot(nx, nz);
    if (dc > MAX_R) {
      const ux = nx / dc;
      const uz = nz / dc;
      nx = ux * MAX_R;
      nz = uz * MAX_R;
      const vRad = vx.current * ux + vz.current * uz;
      if (vRad > 0) {
        vx.current -= ux * vRad;
        vz.current -= uz * vRad;
        tracker.field.impact = Math.min(1, tracker.field.impact + 0.3 + vRad * 0.03);
        tracker.field.x = nx;
        tracker.field.z = nz;
      }
    }

    // buildings are solid: push out and kill the velocity into the wall
    _pos.x = nx;
    _pos.z = nz;
    const n = resolveBuildingCollision(_pos, CAR_BODY_R);
    if (n) {
      nx = _pos.x;
      nz = _pos.z;
      const vInto = vx.current * -n.x + vz.current * -n.z;
      if (vInto > 0) {
        vx.current += n.x * vInto;
        vz.current += n.z * vInto;
      }
      vF = vx.current * fx + vz.current * fz;
    }

    // ---- suspension: each wheel finds its contact, body rides a spring ----
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      const w = WHEELS[i];
      const wxw = nx + rx * w.ox + fx * w.oz;
      const wzw = nz + rz * w.ox + fz * w.oz;
      contacts[i] = terrainHeight(wxw, wzw);
      sum += contacts[i];
    }
    const targetY = sum / 4 + RIDE;
    bodyVy.current += (targetY - bodyY.current) * SUSP_STIFF * dt - bodyVy.current * SUSP_DAMP * dt;
    bodyY.current += bodyVy.current * dt;
    // hard limits so the body can never sink into the ground or float away
    bodyY.current = THREE.MathUtils.clamp(bodyY.current, targetY - 0.28, targetY + 0.4);
    bodyY.current = Math.max(bodyY.current, terrainHeight(nx, nz) + 0.22);

    rb.setTranslation({ x: nx, y: bodyY.current, z: nz }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    _euler.set(0, heading.current, 0);
    rb.setRotation(_quat.setFromEuler(_euler), true);

    // ---- body attitude: terrain pitch/roll + dynamic weight transfer ----
    if (chassis.current) {
      const hF = (contacts[0] + contacts[1]) / 2;
      const hB = (contacts[2] + contacts[3]) / 2;
      const hL = (contacts[0] + contacts[2]) / 2;
      const hR = (contacts[1] + contacts[3]) / 2;
      const longAccel = (vF - prevVF.current) / Math.max(dt, 1e-4);
      const yawNow = Math.abs(vF) > 0.05 ? (vF / WHEELBASE) * Math.tan(steer.current) : 0;
      const latAccel = vF * yawNow;
      const pitch = THREE.MathUtils.clamp((hB - hF) / WHEELBASE, -0.4, 0.4)
        + THREE.MathUtils.clamp(-longAccel * 0.0055, -0.05, 0.075); // brake dive / launch squat
      const roll = THREE.MathUtils.clamp((hR - hL) / TRACK, -0.3, 0.3)
        + THREE.MathUtils.clamp(-latAccel * 0.004, -0.09, 0.09); // lean out of the turn
      chassis.current.rotation.x += (pitch - chassis.current.rotation.x) * Math.min(1, dt * 8);
      chassis.current.rotation.z += (roll - chassis.current.rotation.z) * Math.min(1, dt * 8);
    }
    prevVF.current = vF;

    // ---- wheels: conform to the ground, roll with true speed, steer up front ----
    for (let i = 0; i < 4; i++) {
      const s = suspRefs[i].current;
      if (s) s.position.y = THREE.MathUtils.clamp(contacts[i] + WHEEL_R - bodyY.current, -0.33, 0.05);
    }
    wheelSpin.current += (vF / WHEEL_R) * dt;
    if (wheelFL.current) { wheelFL.current.rotation.y = steer.current; wheelFL.current.rotation.x = wheelSpin.current; }
    if (wheelFR.current) { wheelFR.current.rotation.y = steer.current; wheelFR.current.rotation.x = wheelSpin.current; }
    if (wheelBL.current) wheelBL.current.rotation.x = wheelSpin.current;
    if (wheelBR.current) wheelBR.current.rotation.x = wheelSpin.current;

    // brake-light glow when braking / handbraking
    const bi = braking || handbrake ? 3 : 1.2;
    if (brakeL.current) brakeL.current.emissiveIntensity = bi;
    if (brakeR.current) brakeR.current.emissiveIntensity = bi;

    tracker.car.x = nx;
    tracker.car.y = bodyY.current;
    tracker.car.z = nz;
    tracker.car.heading = heading.current;
    tracker.car.speed = Math.hypot(vx.current, vz.current);
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

      {/* wheels (kept level, outside the tilting chassis; each rides its own contact) */}
      <group ref={suspRefs[0]} position={[-0.98, -0.15, 1.28]}><Wheel refObj={wheelFL} /></group>
      <group ref={suspRefs[1]} position={[0.98, -0.15, 1.28]}><Wheel refObj={wheelFR} /></group>
      <group ref={suspRefs[2]} position={[-0.98, -0.15, -1.32]}><Wheel refObj={wheelBL} /></group>
      <group ref={suspRefs[3]} position={[0.98, -0.15, -1.32]}><Wheel refObj={wheelBR} /></group>
    </RigidBody>
  );
}
