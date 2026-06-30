"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/lib/store";
import { tracker } from "@/lib/refs";

export default function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const onFoot = useGame.getState().onFoot;
    const t = onFoot ? tracker.hero : tracker.car;

    const dist = onFoot ? 5.8 : 10;
    const height = onFoot ? 2.45 : 4.6;
    const shoulder = onFoot ? 1.05 : 0;
    const h = t.heading;

    // position behind the heading
    desired.current.set(
      t.x - Math.sin(h) * dist + Math.cos(h) * shoulder,
      t.y + height,
      t.z - Math.cos(h) * dist - Math.sin(h) * shoulder
    );

    const walkBob = onFoot && t.speed > 0.2 ? Math.sin(performance.now() * 0.012) * 0.025 : 0;
    desired.current.y += walkBob - (onFoot ? Math.min(0.35, t.speed * 0.018) : 0);

    const lerp = 1 - Math.pow(onFoot ? 0.0025 : 0.0012, dt);
    camera.position.lerp(desired.current, lerp);

    const target = new THREE.Vector3(
      t.x + Math.sin(h) * (onFoot ? 1.2 : 0),
      t.y + (onFoot ? 1.15 : 1.0),
      t.z + Math.cos(h) * (onFoot ? 1.2 : 0)
    );
    look.current.lerp(target, lerp);
    camera.lookAt(look.current);
  });

  return null;
}
