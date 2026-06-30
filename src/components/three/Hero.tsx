"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useGame } from "@/lib/store";
import { getInput } from "@/lib/input";
import { tracker } from "@/lib/refs";
import { audio } from "@/lib/audio";
import { terrainHeight } from "@/lib/noise";

const SPEED = 7;
const SPRINT = 12;
const TURN = 2.6;
const JUMP_V = 8.5;
const CAPSULE_HALF = 0.55;
const CAPSULE_RADIUS = 0.32;
const BODY_CENTER_Y = CAPSULE_HALF + CAPSULE_RADIUS;
const STEP_HEIGHT = 0.72;
const GROUND_STICK = 0.08;
const SPAWN_X = -46;
const SPAWN_Z = -75;
const SPAWN_HEADING = 0.68;

export default function Hero() {
  const body = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const { rapier, world } = useRapier();

  const heading = useRef(SPAWN_HEADING);
  const jumpCount = useRef(0);
  const jumpLatch = useRef(false);
  const stepT = useRef(0);
  const storeT = useRef(0);
  const bobT = useRef(0);
  const prevOnFoot = useRef(true);
  const blinkT = useRef(0);
  const wetness = useRef(0);
  const travelDust = useRef(0);

  // limb refs for procedural animation
  const spine = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hair = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const hoodieMat = useRef<THREE.MeshStandardMaterial>(null);
  const pantsMat = useRef<THREE.MeshStandardMaterial>(null);
  const skinMat = useRef<THREE.MeshStandardMaterial>(null);
  const hairMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, frameDt) => {
    const dt = Math.min(frameDt, 1 / 30);
    const rb = body.current;
    if (!rb) return;
    const game = useGame.getState();
    const onFoot = game.onFoot;
    const input = getInput();

    // handle enter/exit transitions
    if (onFoot !== prevOnFoot.current) {
      if (onFoot) {
        // exited vehicle — hop out beside the car
        const hx = tracker.car.x + Math.cos(tracker.car.heading) * 2.4;
        const hz = tracker.car.z - Math.sin(tracker.car.heading) * 2.4;
        rb.setTranslation({ x: hx, y: tracker.car.y + 1, z: hz }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        heading.current = tracker.car.heading;
      }
      prevOnFoot.current = onFoot;
    }
    if (group.current) group.current.visible = onFoot;

    const pos = rb.translation();
    const terrainY = terrainHeight(pos.x, pos.z);
    const desiredGroundCenter = terrainY + BODY_CENTER_Y + GROUND_STICK;

    // Ground check combines Rapier raycasts with the same terrain height function
    // used by the collision mesh, so walking remains planted on sloped triangles.
    const originY = pos.y - BODY_CENTER_Y + 0.12;
    const ray = new rapier.Ray({ x: pos.x, y: originY, z: pos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, STEP_HEIGHT, true);
    const groundDelta = desiredGroundCenter - pos.y;
    const grounded = (!!hit && hit.timeOfImpact < STEP_HEIGHT) || (groundDelta <= STEP_HEIGHT && groundDelta > -0.18);
    if (grounded) jumpCount.current = 0;

    const vel = rb.linvel();
    let moving = false;

    if (onFoot) {
      // tank-style steering: A/D rotate, W/S move along heading
      const turn = (input.left - input.right) * TURN * dt;
      heading.current += turn;
      const speed = input.boost ? SPRINT : SPEED;
      const drive = input.forward - input.back;
      const dirX = Math.sin(heading.current);
      const dirZ = Math.cos(heading.current);
      const vx = dirX * drive * speed;
      const vz = dirZ * drive * speed;
      let vy = vel.y;
      if (grounded && !input.jump) {
        if (Math.abs(groundDelta) > 0.015 && Math.abs(groundDelta) < STEP_HEIGHT) {
          rb.setTranslation({ x: pos.x, y: pos.y + groundDelta * Math.min(1, dt * 18), z: pos.z }, true);
        }
        vy = groundDelta > 0.05 ? Math.min(2.8, groundDelta * 12) : Math.min(0, vel.y);
      }
      rb.setLinvel({ x: vx, y: vy, z: vz }, true);
      moving = Math.abs(drive) > 0.1 || Math.abs(turn) > 0.001;
      if (grounded && Math.abs(drive) > 0.1) travelDust.current = Math.min(1, travelDust.current + dt * 0.018 * speed);

      // jump only while grounded, so movement stays physical instead of arcade-floating
      if (input.jump && !jumpLatch.current && grounded) {
        rb.setLinvel({ x: vel.x, y: JUMP_V, z: vel.z }, true);
        jumpCount.current += 1;
        jumpLatch.current = true;
        audio.ui();
      }
      if (!input.jump) jumpLatch.current = false;

      // footsteps
      if (moving && grounded && Math.abs(drive) > 0.1) {
        stepT.current += dt * (input.boost ? 11 : 7);
        if (stepT.current >= 1) {
          stepT.current = 0;
          audio.step(input.boost);
        }
      }
    } else {
      // riding inside the car — follow it, hidden
      rb.setTranslation({ x: tracker.car.x, y: tracker.car.y + 0.5, z: tracker.car.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // visual rotation + procedural bob
    if (group.current) {
      const speed01 = Math.min(1, Math.hypot(vel.x, vel.z) / SPRINT);
      wetness.current += ((game.weather === "rain" ? 1 : 0) - wetness.current) * Math.min(1, dt * 0.45);
      const wet = wetness.current;
      const dust = travelDust.current * (1 - wet * 0.75);
      group.current.rotation.y = heading.current;
      bobT.current += dt * (moving ? 12 : 2);
      const stride = moving ? Math.sin(bobT.current) : 0;
      const bob = moving ? Math.abs(Math.sin(bobT.current)) * 0.035 : Math.sin(bobT.current) * 0.012;
      const breath = Math.sin(bobT.current * 0.22) * 0.018;
      group.current.position.y = bob;
      if (spine.current) {
        spine.current.position.y = breath;
        spine.current.rotation.z = moving ? -stride * 0.035 : Math.sin(bobT.current * 0.19) * 0.01;
        spine.current.rotation.x = input.boost && moving ? -0.06 : 0;
      }
      if (head.current) {
        head.current.rotation.y = Math.sin(bobT.current * 0.29) * 0.08 + (input.left - input.right) * 0.08;
        head.current.rotation.x = moving ? Math.cos(bobT.current) * 0.025 : Math.sin(bobT.current * 0.17) * 0.025;
      }
      if (hair.current) hair.current.rotation.x = -speed01 * 0.08 + Math.sin(bobT.current * 1.6) * 0.015;
      const swing = moving ? stride * (input.boost ? 0.86 : 0.62) : 0;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      if (armL.current) armL.current.rotation.x = -swing * 0.78;
      if (armR.current) armR.current.rotation.x = swing * 0.78;
      if (footL.current) footL.current.rotation.x = moving ? -Math.max(0, -stride) * 0.45 : 0;
      if (footR.current) footR.current.rotation.x = moving ? -Math.max(0, stride) * 0.45 : 0;

      blinkT.current += dt;
      const blink = blinkT.current > 2.8 + Math.sin(bobT.current * 0.31) * 0.9 ? 1 : 0;
      if (blink) blinkT.current = -0.12;
      const lidScale = blinkT.current < 0 ? 1 : blink ? 1 : 0.04;
      if (lidL.current) lidL.current.scale.y = lidScale;
      if (lidR.current) lidR.current.scale.y = lidScale;
      if (eyeL.current) eyeL.current.position.x = -0.055 + Math.sin(bobT.current * 0.37) * 0.006;
      if (eyeR.current) eyeR.current.position.x = 0.055 + Math.sin(bobT.current * 0.37) * 0.006;

      if (hoodieMat.current) {
        hoodieMat.current.color.set("#1f4d5d").lerp(new THREE.Color("#132e38"), wet).lerp(new THREE.Color("#3d4a44"), dust * 0.3);
        hoodieMat.current.roughness = 0.82 - wet * 0.22;
      }
      if (pantsMat.current) pantsMat.current.color.set("#1d2633").lerp(new THREE.Color("#121821"), wet).lerp(new THREE.Color("#4a443a"), dust * 0.35);
      if (skinMat.current) {
        skinMat.current.roughness = 0.66 - wet * 0.16;
        skinMat.current.color.set("#c98f68").lerp(new THREE.Color("#b98263"), wet * 0.35);
      }
      if (hairMat.current) hairMat.current.color.set("#17110d").lerp(new THREE.Color("#090706"), wet * 0.8);
    }

    // publish to trackers
    const sp = Math.hypot(vel.x, vel.z);
    tracker.hero.x = pos.x;
    tracker.hero.y = pos.y;
    tracker.hero.z = pos.z;
    tracker.hero.heading = heading.current;
    tracker.hero.speed = sp;
    tracker.hero.moving = moving;

    // respawn if fallen
    if (pos.y < -20) {
      rb.setTranslation({ x: SPAWN_X, y: terrainHeight(SPAWN_X, SPAWN_Z) + 3, z: SPAWN_Z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      heading.current = SPAWN_HEADING;
    }

    storeT.current += dt;
    if (storeT.current > 0.15) {
      storeT.current = 0;
      if (onFoot) useGame.getState().setHero([pos.x, pos.y, pos.z], heading.current);
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[SPAWN_X, terrainHeight(SPAWN_X, SPAWN_Z) + 2, SPAWN_Z]}
      enabledRotations={[false, false, false]}
      mass={1}
      linearDamping={0.18}
      friction={0}
      ccd
      canSleep={false}
    >
      <CapsuleCollider args={[CAPSULE_HALF, CAPSULE_RADIUS]} friction={0} />
      <group ref={group} scale={[0.92, 0.96, 0.92]}>
        <group ref={spine}>
          {/* blocky Minecraft-inspired portfolio avatar: cube head, rectangular torso, chunky limbs */}
          <mesh castShadow position={[0, 0.28, 0]} scale={[1, 1, 1]}>
            <boxGeometry args={[0.62, 0.86, 0.36]} />
            <meshStandardMaterial ref={hoodieMat} color="#1f4d5d" roughness={0.82} metalness={0.02} />
          </mesh>
          <mesh position={[0, 0.18, 0.31]} scale={[0.78, 1, 1]}>
            <boxGeometry args={[0.018, 0.72, 0.018]} />
            <meshStandardMaterial color="#0a1a20" roughness={0.8} />
          </mesh>
          {[-0.16, 0.16].map((x) => (
            <mesh key={`hood-string-${x}`} position={[x, 0.55, 0.315]} rotation={[0.1, 0, x > 0 ? -0.16 : 0.16]}>
              <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
              <meshStandardMaterial color="#d6e4e6" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, -0.08, 0.325]} scale={[1, 0.32, 1]}>
            <boxGeometry args={[0.46, 0.032, 0.024]} />
            <meshStandardMaterial color="#102733" roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, 0.5, 0.19]} scale={[0.76, 0.48, 0.14]}>
            <boxGeometry args={[0.6, 0.36, 0.2]} />
            <meshStandardMaterial color="#0e171c" roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.54, 0.26]}>
            <boxGeometry args={[0.2, 0.055, 0.02]} />
            <meshStandardMaterial color="#c7f9ff" emissive="#5eead4" emissiveIntensity={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.22, 0.245]}>
            <boxGeometry args={[0.025, 0.58, 0.018]} />
            <meshStandardMaterial color="#0b1f27" roughness={0.9} />
          </mesh>
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} position={[x, 0.54, 0.275]} rotation={[0.2, 0, x > 0 ? -0.18 : 0.18]}>
              <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
              <meshStandardMaterial color="#d7e8e8" roughness={0.72} />
            </mesh>
          ))}
          <mesh castShadow position={[0, -0.12, 0.01]} scale={[0.72, 0.62, 0.55]}>
            <boxGeometry args={[0.58, 0.18, 0.42]} />
            <meshStandardMaterial color="#111820" roughness={0.78} />
          </mesh>
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} castShadow position={[x, 0.58, -0.01]} rotation={[0, 0, x > 0 ? -0.08 : 0.08]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.22, 0.38, 0.28]} />
              <meshStandardMaterial color="#204f5f" roughness={0.84} />
            </mesh>
          ))}

          <group ref={head} position={[0, 0.98, 0.03]}>
            <mesh castShadow scale={[1, 1, 1]}>
              <boxGeometry args={[0.48, 0.48, 0.48]} />
              <meshStandardMaterial ref={skinMat} color="#c98f68" roughness={0.66} metalness={0.01} />
            </mesh>
            <mesh position={[0, -0.32, -0.02]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.2, 0.18, 0.2]} />
              <meshStandardMaterial color="#bd825f" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.035, 0.254]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.18, 0.08, 0.018]} />
              <meshStandardMaterial color="#b77c5d" roughness={0.72} />
            </mesh>
            <mesh ref={eyeL} position={[-0.08, 0.07, 0.252]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.055, 0.04, 0.012]} />
              <meshStandardMaterial color="#f3efe6" roughness={0.08} metalness={0.02} />
            </mesh>
            <mesh ref={eyeR} position={[0.08, 0.07, 0.252]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.055, 0.04, 0.012]} />
              <meshStandardMaterial color="#f3efe6" roughness={0.08} metalness={0.02} />
            </mesh>
            {[-0.08, 0.08].map((x) => (
              <mesh key={x} position={[x, 0.065, 0.262]}>
                <boxGeometry args={[0.018, 0.022, 0.01]} />
                <meshStandardMaterial color="#231815" roughness={0.2} />
              </mesh>
            ))}
            {[-0.08, 0.08].map((x) => (
              <mesh key={`glasses-${x}`} position={[x, 0.07, 0.27]} scale={[1, 1, 1]}>
                <boxGeometry args={[0.075, 0.055, 0.012]} />
                <meshStandardMaterial color="#111827" roughness={0.32} metalness={0.18} />
              </mesh>
            ))}
            <mesh position={[0, 0.072, 0.276]}>
              <boxGeometry args={[0.055, 0.01, 0.01]} />
              <meshStandardMaterial color="#111827" roughness={0.32} metalness={0.18} />
            </mesh>
            {[-0.095, -0.018, 0.082].map((x, i) => (
              <mesh key={x} position={[x, 0.0 + i * 0.018, 0.265]} scale={[1, 1, 1]}>
                <boxGeometry args={[0.014, 0.012, 0.008]} />
                <meshStandardMaterial color="#a86f55" roughness={0.9} />
              </mesh>
            ))}
            <mesh ref={lidL} position={[-0.08, 0.07, 0.282]} scale={[0.055, 0.04, 0.01]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#bd825f" roughness={0.7} />
            </mesh>
            <mesh ref={lidR} position={[0.08, 0.07, 0.282]} scale={[0.055, 0.04, 0.01]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#bd825f" roughness={0.7} />
            </mesh>
            <mesh position={[-0.08, 0.125, 0.266]} rotation={[0, 0, 0.05]}>
              <boxGeometry args={[0.08, 0.014, 0.012]} />
              <meshStandardMaterial color="#1f1712" roughness={0.9} />
            </mesh>
            <mesh position={[0.08, 0.125, 0.266]} rotation={[0, 0, -0.05]}>
              <boxGeometry args={[0.08, 0.014, 0.012]} />
              <meshStandardMaterial color="#1f1712" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.105, 0.262]} scale={[1, 1, 1]}>
              <boxGeometry args={[0.12, 0.028, 0.012]} />
              <meshStandardMaterial color="#8d4d43" roughness={0.55} />
            </mesh>
            <group ref={hair} position={[0, 0.13, -0.01]}>
              <mesh castShadow position={[0, 0.11, 0.02]} scale={[1, 1, 1]}>
                <boxGeometry args={[0.52, 0.2, 0.5]} />
                <meshStandardMaterial ref={hairMat} color="#17110d" roughness={0.88} />
              </mesh>
              {[-0.16, -0.08, 0, 0.08, 0.16].map((x, i) => (
                <mesh key={x} position={[x, 0.005 - (i % 2) * 0.025, 0.245]}>
                  <boxGeometry args={[0.08, 0.12, 0.025]} />
                  <meshStandardMaterial color="#1b120d" roughness={0.9} />
                </mesh>
              ))}
            </group>
            {[-0.22, 0.22].map((x) => (
              <mesh key={x} position={[x, 0.0, 0.005]} scale={[0.35, 0.55, 0.22]}>
                <boxGeometry args={[0.14, 0.16, 0.08]} />
                <meshStandardMaterial color="#bd825f" roughness={0.7} />
              </mesh>
            ))}
          </group>

          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? armL : armR} position={[side * 0.36, 0.46, 0.02]} rotation={[0, 0, side * 0.1]}>
              <mesh castShadow position={[0, -0.2, 0]} rotation={[0, 0, side * 0.03]}>
                <boxGeometry args={[0.16, 0.52, 0.18]} />
                <meshStandardMaterial color="#1f4d5d" roughness={0.82} />
              </mesh>
              <mesh castShadow position={[0, -0.5, 0.018]} rotation={[0, 0, -side * 0.03]}>
                <boxGeometry args={[0.14, 0.42, 0.16]} />
                <meshStandardMaterial color="#c98f68" roughness={0.66} />
              </mesh>
              <mesh castShadow position={[0, -0.73, 0.05]} scale={[1, 1, 1]}>
                <boxGeometry args={[0.16, 0.14, 0.13]} />
                <meshStandardMaterial color="#c98f68" roughness={0.66} />
              </mesh>
              {[-0.045, -0.018, 0.012, 0.04].map((x) => (
                <mesh key={x} position={[x * side, -0.8, 0.085]} rotation={[0.3, 0, x * side]}>
                  <boxGeometry args={[0.018, 0.08, 0.018]} />
                  <meshStandardMaterial color="#c98f68" roughness={0.68} />
                </mesh>
              ))}
              {side > 0 && (
                <mesh position={[0.018, -0.42, 0.072]}>
                  <boxGeometry args={[0.09, 0.045, 0.02]} />
                  <meshStandardMaterial color="#05080c" emissive="#172554" emissiveIntensity={0.45} roughness={0.35} />
                </mesh>
              )}
            </group>
          ))}

          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? legL : legR} position={[side * 0.14, -0.15, 0]}>
              <mesh position={[side * 0.02, -0.04, 0.105]}>
                <boxGeometry args={[0.18, 0.045, 0.028]} />
                <meshStandardMaterial color="#0b0f17" roughness={0.76} />
              </mesh>
              <mesh castShadow position={[0, -0.33, 0]} scale={[0.85, 1, 0.78]}>
                <boxGeometry args={[0.2, 0.58, 0.2]} />
                <meshStandardMaterial ref={side < 0 ? pantsMat : undefined} color="#1d2633" roughness={0.82} />
              </mesh>
              <mesh castShadow position={[0, -0.77, 0.015]} scale={[0.82, 1, 0.74]}>
                <boxGeometry args={[0.18, 0.5, 0.18]} />
                <meshStandardMaterial color="#1b2330" roughness={0.82} />
              </mesh>
              <mesh position={[side * 0.075, -0.34, 0.08]}>
                <boxGeometry args={[0.13, 0.16, 0.035]} />
                <meshStandardMaterial color="#253246" roughness={0.88} />
              </mesh>
              <mesh position={[side * 0.075, -0.74, 0.075]}>
                <boxGeometry args={[0.12, 0.14, 0.032]} />
                <meshStandardMaterial color="#26364b" roughness={0.88} />
              </mesh>
              <group ref={side < 0 ? footL : footR} position={[0, -1.05, 0.115]}>
                <mesh castShadow scale={[0.78, 0.32, 1.34]}>
                  <boxGeometry args={[0.2, 0.13, 0.34]} />
                  <meshStandardMaterial color="#111111" roughness={0.58} />
                </mesh>
                <mesh position={[0, -0.074, 0.045]} scale={[0.74, 0.12, 1.22]}>
                  <boxGeometry args={[0.21, 0.08, 0.34]} />
                  <meshStandardMaterial color="#e5e7eb" roughness={0.72} />
                </mesh>
                <mesh position={[0, -0.028, 0.195]} scale={[1, 1, 1]}>
                  <boxGeometry args={[0.16, 0.05, 0.08]} />
                  <meshStandardMaterial color="#161616" roughness={0.62} />
                </mesh>
                {[-0.045, 0, 0.045].map((x, i) => (
                  <mesh key={`lace-${side}-${i}`} position={[x, 0.006, 0.105 + i * 0.035]} rotation={[0, 0, x * 1.8]}>
                    <boxGeometry args={[0.075, 0.008, 0.012]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.8} />
                  </mesh>
                ))}
              </group>
            </group>
          ))}
        </group>
      </group>
    </RigidBody>
  );
}
