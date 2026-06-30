import * as THREE from "three";
import * as CANNON from "cannon-es";
import { zones as ZONE_DATA } from "../data/portfolio.js";
import {
  fbm,
  makeGroundTexture,
  makeSkyTexture,
  makeGridTexture,
  makeLabelTexture,
} from "./Textures.js";
import Controls from "./Controls.js";

const smoothstep = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// world / terrain config
const SIZE = 220; // terrain side length
const SEG = 96; // grid resolution
const ES = SIZE / SEG; // element size

// Shared height function (physics + render use the exact same values)
function terrainHeight(wx, wz) {
  const d = Math.hypot(wx, wz);
  const gentle = fbm(wx * 0.02 + 5, wz * 0.02 + 9, 5) * 1.7;
  const mtnMask = Math.pow(smoothstep(72, 108, d), 1.15);
  const mtn = (fbm(wx * 0.05 + 31, wz * 0.05 + 17, 4) * 0.5 + 0.7) * 26 * mtnMask;
  // keep the very center (spawn) almost flat
  const flat = 1 - smoothstep(0, 16, d);
  return gentle * (1 - flat * 0.85) + mtn;
}

export default class Experience {
  constructor({ canvas, audio, onStats, onZone, onReady }) {
    this.canvas = canvas;
    this.audio = audio;
    this.onStats = onStats || (() => {});
    this.onZone = onZone || (() => {});
    this.onReady = onReady || (() => {});

    this.clock = new THREE.Clock();
    this.tmpV = new THREE.Vector3();
    this.disposed = false;
    this.paused = false;
    this.activeZoneId = null;
    this.score = 0;
    this.cameraMode = 0; // 0 chase, 1 far, 2 top
    this._fpsT = 0;
    this._fpsN = 0;
    this._fps = 60;
    this._statT = 0;
    this._lastCollideT = 0;

    this._initRenderer();
    this._initScene();
    this._initPhysics();
    this._initTerrain();
    this._initBoundaries();
    this._initVehicle();
    this._initZones();
    this._initCollectibles();
    this._initProps();
    this._initControls();

    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);
    this._onResize();

    this._loop = this._loop.bind(this);
    this.renderer.setAnimationLoop(this._loop);
  }

  // ---------------------------------------------------------------- renderer
  _initRenderer() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = r;
  }

  // ------------------------------------------------------------------- scene
  _initScene() {
    const scene = new THREE.Scene();
    this.scene = scene;

    const horizon = new THREE.Color("#2a335f");
    scene.fog = new THREE.Fog(horizon, 90, 200);
    scene.background = horizon;

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1000);
    this.camera.position.set(0, 12, 22);

    // sky dome
    const skyTex = makeSkyTexture();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    scene.add(sky);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 380 + Math.random() * 60;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI * 0.42; // upper hemisphere
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) + 40;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })
      )
    );

    // lights
    const hemi = new THREE.HemisphereLight(0xbcd0ff, 0x42342a, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0db, 2.1);
    sun.position.set(-60, 70, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 110;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 260;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);
    this.sun = sun;
  }

  // ----------------------------------------------------------------- physics
  _initPhysics() {
    const world = new CANNON.World();
    world.gravity.set(0, -22, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.defaultContactMaterial.friction = 0.3;
    this.world = world;

    this.matGround = new CANNON.Material("ground");
    this.matWheel = new CANNON.Material("wheel");
    this.matProp = new CANNON.Material("prop");

    world.addContactMaterial(
      new CANNON.ContactMaterial(this.matWheel, this.matGround, {
        friction: 0.8,
        restitution: 0,
        contactEquationStiffness: 1000,
      })
    );
    world.addContactMaterial(
      new CANNON.ContactMaterial(this.matProp, this.matGround, { friction: 0.4, restitution: 0.4 })
    );
  }

  // ----------------------------------------------------------------- terrain
  _initTerrain() {
    // physics heightfield (matrix[i][j] = height at local x=i, y=j)
    const matrix = [];
    for (let i = 0; i <= SEG; i++) {
      matrix.push([]);
      for (let j = 0; j <= SEG; j++) {
        const wx = -SIZE / 2 + i * ES;
        const wz = SIZE / 2 - j * ES;
        matrix[i].push(terrainHeight(wx, wz));
      }
    }
    const hfShape = new CANNON.Heightfield(matrix, { elementSize: ES });
    const hfBody = new CANNON.Body({ mass: 0, material: this.matGround });
    hfBody.addShape(hfShape);
    hfBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    hfBody.position.set(-SIZE / 2, 0, SIZE / 2);
    this.world.addBody(hfBody);

    // render geometry — built to match the matrix exactly
    const geo = new THREE.BufferGeometry();
    const verts = [];
    const uvs = [];
    const idx = [];
    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j <= SEG; j++) {
        const wx = -SIZE / 2 + i * ES;
        const wz = SIZE / 2 - j * ES;
        verts.push(wx, matrix[i][j], wz);
        uvs.push(i / SEG, j / SEG);
      }
    }
    const at = (i, j) => i * (SEG + 1) + j;
    for (let i = 0; i < SEG; i++) {
      for (let j = 0; j < SEG; j++) {
        const a = at(i, j);
        const b = at(i + 1, j);
        const c = at(i + 1, j + 1);
        const d = at(i, j + 1);
        idx.push(a, d, b, b, d, c);
      }
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const groundTex = makeGroundTexture();
    groundTex.repeat.set(10, 10);
    const mat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.95,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  _initBoundaries() {
    // invisible walls just inside the mountains so the car can't escape
    const half = SIZE / 2 - 6;
    const defs = [
      [0, half, SIZE, 4],
      [0, -half, SIZE, 4],
      [half, 0, 4, SIZE],
      [-half, 0, 4, SIZE],
    ];
    for (const [x, z, w, d] of defs) {
      const body = new CANNON.Body({ mass: 0, material: this.matGround });
      body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, 16, d / 2)));
      body.position.set(x, 8, z);
      this.world.addBody(body);
    }
  }

  // ----------------------------------------------------------------- vehicle
  _initVehicle() {
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.0, 0.4, 2.0));
    const chassisBody = new CANNON.Body({ mass: 150 });
    chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0, 0));
    chassisBody.position.set(0, 5, 8);
    chassisBody.angularDamping = 0.4;
    this.chassisBody = chassisBody;

    chassisBody.addEventListener("collide", (e) => {
      const t = this.clock.elapsedTime;
      if (t - this._lastCollideT < 0.12) return;
      let v = 0;
      try {
        v = Math.abs(e.contact.getImpactVelocityAlongNormal());
      } catch {
        v = 0;
      }
      if (v > 2.5) {
        this._lastCollideT = t;
        this.audio?.collision(Math.min(1, v / 18));
      }
    });

    const vehicle = new CANNON.RaycastVehicle({
      chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });
    const opt = {
      radius: 0.45,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 32,
      suspensionRestLength: 0.45,
      frictionSlip: 2.2,
      dampingRelaxation: 2.4,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.03,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(),
      maxSuspensionTravel: 0.35,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    };
    const pts = [
      [1, 0, 1.35], // FL
      [-1, 0, 1.35], // FR
      [1, 0, -1.35], // BL
      [-1, 0, -1.35], // BR
    ];
    for (const [x, y, z] of pts) {
      opt.chassisConnectionPointLocal.set(x, y, z);
      vehicle.addWheel({ ...opt, chassisConnectionPointLocal: new CANNON.Vec3(x, y, z) });
    }
    vehicle.addToWorld(this.world);
    this.vehicle = vehicle;

    for (const w of vehicle.wheelInfos) w.material = this.matWheel;

    // ---- render: car body group ----
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.6, roughness: 0.35 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.4, roughness: 0.25 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.7, roughness: 0.4 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.0), bodyMat);
    base.castShadow = true;
    base.position.y = 0.05;
    car.add(base);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.9), cabinMat);
    cabin.position.set(0, 0.5, -0.1);
    cabin.castShadow = true;
    car.add(cabin);

    // hood wedge
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.0), accent);
    hood.position.set(0, 0.32, 1.4);
    hood.castShadow = true;
    car.add(hood);

    // headlights (emissive + a real spotlight)
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 3 });
    for (const sx of [-0.6, 0.6]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), hlMat);
      hl.position.set(sx, 0.18, 2.02);
      car.add(hl);
    }
    const brakeMat = new THREE.MeshStandardMaterial({ color: 0x440000, emissive: 0xff2222, emissiveIntensity: 2 });
    for (const sx of [-0.6, 0.6]) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), brakeMat);
      bl.position.set(sx, 0.22, -2.02);
      car.add(bl);
    }
    const spot = new THREE.SpotLight(0xfff0d0, 14, 45, Math.PI / 7, 0.4, 1.2);
    spot.position.set(0, 0.6, 1.6);
    spot.target.position.set(0, -0.5, 14);
    car.add(spot);
    car.add(spot.target);

    this.scene.add(car);
    this.carMesh = car;

    // wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 18);
    wheelGeo.rotateZ(Math.PI / 2); // axle along X
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111418, metalness: 0.5, roughness: 0.6 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b2, metalness: 0.9, roughness: 0.25 });
    this.wheelMeshes = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.castShadow = true;
      g.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      g.add(rim);
      this.scene.add(g);
      this.wheelMeshes.push(g);
    }

    this.spawn = { x: 0, z: 8 };
  }

  // ------------------------------------------------------------------- zones
  _initZones() {
    this.zoneObjs = [];
    this.linkPads = [];
    for (const z of ZONE_DATA) {
      const [x, zz] = z.position;
      const y = terrainHeight(x, zz);
      const color = new THREE.Color(z.color);
      const group = new THREE.Group();
      group.position.set(x, y, zz);

      // ground ring pad
      const padTex = makeGridTexture(z.color);
      padTex.repeat.set(3, 3);
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(6.5, 48),
        new THREE.MeshStandardMaterial({
          map: padTex,
          emissive: color,
          emissiveIntensity: 0.5,
          roughness: 0.5,
          metalness: 0.2,
          transparent: true,
          opacity: 0.92,
        })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.06;
      pad.receiveShadow = true;
      group.add(pad);

      // glowing ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6.5, 0.18, 12, 64),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      group.add(ring);

      // central monolith / pillar
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.2, 7, 6),
        new THREE.MeshStandardMaterial({
          color: 0x0b1020,
          emissive: color,
          emissiveIntensity: 0.7,
          metalness: 0.7,
          roughness: 0.3,
        })
      );
      pillar.position.y = 3.6;
      pillar.castShadow = true;
      group.add(pillar);

      // spinning crystal on top
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.1, 0),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.1 })
      );
      crystal.position.y = 8.4;
      group.add(crystal);

      const plight = new THREE.PointLight(color, 6, 22, 2);
      plight.position.y = 7;
      group.add(plight);

      // floating billboard label
      const labelTex = makeLabelTexture(z.label, z.color);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false }));
      sprite.scale.set(8, 2, 1);
      sprite.position.y = 11;
      group.add(sprite);

      this.scene.add(group);
      this.zoneObjs.push({ data: z, group, crystal, ring, light: plight, x, z: zz, visited: false });

      // contact zone: floating link pads you drive into
      if (z.actions) {
        z.actions.forEach((a, i) => {
          const angle = -Math.PI / 2 + (i - 1) * 0.9;
          const px = x + Math.cos(angle) * 11;
          const pz = zz + Math.sin(angle) * 11;
          const py = terrainHeight(px, pz);
          const padColor = new THREE.Color(z.color);
          const pg = new THREE.Group();
          pg.position.set(px, py, pz);
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.4, 3.2),
            new THREE.MeshStandardMaterial({ color: padColor, emissive: padColor, emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.3 })
          );
          box.position.y = 0.4;
          pg.add(box);
          const lt = makeLabelTexture(a.label.toUpperCase(), z.color);
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false }));
          sp.scale.set(5, 1.25, 1);
          sp.position.y = 2.4;
          pg.add(sp);
          this.scene.add(pg);
          this.linkPads.push({ href: a.href, label: a.label, x: px, z: pz, group: pg, used: false });
        });
      }
    }
  }

  // ------------------------------------------------------------ collectibles
  _initCollectibles() {
    this.crystals = [];
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xffd000,
      emissiveIntensity: 1.4,
      metalness: 0.4,
      roughness: 0.1,
    });
    const geo = new THREE.OctahedronGeometry(0.7, 0);
    const placed = [];
    let tries = 0;
    while (placed.length < 18 && tries < 400) {
      tries++;
      const x = (Math.random() * 2 - 1) * 70;
      const z = (Math.random() * 2 - 1) * 70;
      if (Math.hypot(x, z) < 8) continue; // not on spawn
      if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 12)) continue;
      placed.push([x, z]);
      const y = terrainHeight(x, z) + 1.4;
      const m = new THREE.Mesh(geo, mat.clone());
      m.position.set(x, y, z);
      m.castShadow = true;
      const halo = new THREE.PointLight(0xffd000, 2.4, 8, 2);
      m.add(halo);
      this.scene.add(m);
      this.crystals.push({ mesh: m, x, z, baseY: y, collected: false, phase: Math.random() * 6.28 });
    }
    this.totalCrystals = this.crystals.length;
  }

  // ------------------------------------------------------------------- props
  _initProps() {
    this.propMeshes = [];
    this.propBodies = [];
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd8623a, metalness: 0.2, roughness: 0.7 });

    const addBox = (x, y, z, s = 1.1) => {
      const half = s / 2;
      const body = new CANNON.Body({ mass: 6, material: this.matProp });
      body.addShape(new CANNON.Box(new CANNON.Vec3(half, half, half)));
      body.position.set(x, y, z);
      this.world.addBody(body);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), boxMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.propBodies.push(body);
      this.propMeshes.push(mesh);
    };

    // a couple of crash-through stacks
    const stacks = [
      [16, -16],
      [-18, -10],
      [12, 22],
    ];
    for (const [sx, sz] of stacks) {
      const base = terrainHeight(sx, sz);
      for (let l = 0; l < 3; l++)
        for (let c = 0; c < 3 - l; c++) {
          addBox(sx + (c - (2 - l) / 2) * 1.2, base + 0.6 + l * 1.15, sz, 1.1);
        }
    }

    // jump ramps (static)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.3, roughness: 0.5 });
    const addRamp = (x, z, rot) => {
      const y = terrainHeight(x, z);
      const body = new CANNON.Body({ mass: 0, material: this.matGround });
      body.addShape(new CANNON.Box(new CANNON.Vec3(4, 0.3, 3)));
      const q = new CANNON.Quaternion();
      q.setFromEuler(0.32, rot, 0);
      body.quaternion.copy(q);
      body.position.set(x, y + 1.0, z);
      this.world.addBody(body);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 6), rampMat);
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };
    addRamp(-10, 18, 0);
    addRamp(22, 4, Math.PI / 2);
  }

  _initControls() {
    this.controls = new Controls(this.canvas);
    this.controls.onReset = () => this.resetCar();
    this.controls.onCamera = () => {
      this.cameraMode = (this.cameraMode + 1) % 3;
      this.audio?.blip(520, 0.07, "sine", 0.14);
    };
  }

  resetCar() {
    const b = this.chassisBody;
    const y = terrainHeight(this.spawn.x, this.spawn.z) + 3;
    b.position.set(this.spawn.x, y, this.spawn.z);
    b.velocity.set(0, 0, 0);
    b.angularVelocity.set(0, 0, 0);
    b.quaternion.set(0, 0, 0, 1);
    this.audio?.blip(300, 0.12, "sawtooth", 0.18);
  }

  // -------------------------------------------------------------------- loop
  _loop() {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    const t = this.clock.elapsedTime;

    if (!this.paused) {
      this._stepVehicle(dt);
      this.world.step(1 / 60, dt, 3);
      this._syncMeshes();
      this._animateZones(t);
      this._checkZones();
      this._checkCollectibles(t);
      this._updateCamera(dt);
    }

    // fps
    this._fpsN++;
    this._fpsT += dt;
    if (this._fpsT >= 0.5) {
      this._fps = Math.round(this._fpsN / this._fpsT);
      this._fpsN = 0;
      this._fpsT = 0;
    }

    // stats to HUD (~10hz)
    this._statT += dt;
    if (this._statT >= 0.1) {
      this._statT = 0;
      const v = this.chassisBody.velocity;
      const speed = Math.hypot(v.x, v.z);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.carMesh.quaternion);
      const heading = Math.atan2(fwd.x, fwd.z);
      this.onStats({
        speed: Math.round(speed * 3.0), // arbitrary km/h-ish
        score: this.score,
        total: this.totalCrystals,
        fps: this._fps,
        car: { x: this.chassisBody.position.x, z: this.chassisBody.position.z, heading },
      });
    }

    this.renderer.render(this.scene, this.camera);

    if (!this._ready) {
      this._ready = true;
      this.onReady();
    }
  }

  _stepVehicle(dt) {
    const c = this.controls.state;
    const v = this.vehicle;
    const maxSteer = 0.55;
    const boost = c.boost ? 1.7 : 1;
    const engine = 2200 * boost;

    // smooth steering
    const targetSteer = (c.left - c.right) * maxSteer;
    this._steer = (this._steer ?? 0) + (targetSteer - (this._steer ?? 0)) * Math.min(1, dt * 8);
    v.setSteeringValue(this._steer, 0);
    v.setSteeringValue(this._steer, 1);

    let force = 0;
    if (c.forward) force = -engine;
    else if (c.backward) force = engine * 0.6;
    // rear-wheel drive
    v.applyEngineForce(force, 2);
    v.applyEngineForce(force, 3);

    const brake = c.brake ? 28 : 0.6; // light rolling resistance
    for (let i = 0; i < 4; i++) v.setBrake(brake, i);

    // engine audio
    const sp = Math.hypot(this.chassisBody.velocity.x, this.chassisBody.velocity.z);
    this.audio?.updateEngine(Math.min(1, sp / 26), !!c.forward || !!c.backward);
  }

  _syncMeshes() {
    this.carMesh.position.copy(this.chassisBody.position);
    this.carMesh.quaternion.copy(this.chassisBody.quaternion);
    for (let i = 0; i < 4; i++) {
      this.vehicle.updateWheelTransform(i);
      const tr = this.vehicle.wheelInfos[i].worldTransform;
      this.wheelMeshes[i].position.copy(tr.position);
      this.wheelMeshes[i].quaternion.copy(tr.quaternion);
    }
    for (let i = 0; i < this.propBodies.length; i++) {
      this.propMeshes[i].position.copy(this.propBodies[i].position);
      this.propMeshes[i].quaternion.copy(this.propBodies[i].quaternion);
    }
    // headlight target follows ahead
    const fwd = new THREE.Vector3(0, -0.4, 14).applyQuaternion(this.carMesh.quaternion);
    // (spot + target are children of car, so they already follow)
  }

  _animateZones(t) {
    for (const z of this.zoneObjs) {
      z.crystal.rotation.y = t * 0.8;
      z.crystal.rotation.x = Math.sin(t * 0.6) * 0.3;
      z.crystal.position.y = 8.4 + Math.sin(t * 1.5 + z.x) * 0.3;
      z.ring.rotation.z = t * 0.4;
      const pulse = 1.6 + Math.sin(t * 2 + z.x) * 0.8 + (z.visited ? 1 : 0);
      z.light.intensity = pulse * 2;
    }
    for (const lp of this.linkPads) {
      lp.group.children[0].rotation.y = t * 0.6;
    }
  }

  _checkZones() {
    const px = this.chassisBody.position.x;
    const pz = this.chassisBody.position.z;
    let inside = null;
    for (const z of this.zoneObjs) {
      if (Math.hypot(px - z.x, pz - z.z) < 7) {
        inside = z;
        break;
      }
    }
    const id = inside ? inside.data.id : null;
    if (id !== this.activeZoneId) {
      this.activeZoneId = id;
      if (inside) {
        if (!inside.visited) {
          inside.visited = true;
          this.audio?.chime();
        } else {
          this.audio?.blip(680, 0.08, "sine", 0.14);
        }
        this.onZone(inside.data);
      } else {
        this.onZone(null);
      }
    }

    // link pads (contact)
    for (const lp of this.linkPads) {
      if (lp.used) continue;
      if (Math.hypot(px - lp.x, pz - lp.z) < 2.6) {
        lp.used = true;
        this.audio?.pickup();
        window.open(lp.href, "_blank", "noopener,noreferrer");
        setTimeout(() => (lp.used = false), 2500);
      }
    }
  }

  _checkCollectibles(t) {
    const px = this.chassisBody.position.x;
    const pz = this.chassisBody.position.z;
    for (const cr of this.crystals) {
      if (cr.collected) continue;
      cr.mesh.rotation.y = t * 1.6;
      cr.mesh.position.y = cr.baseY + Math.sin(t * 2 + cr.phase) * 0.3;
      if (Math.hypot(px - cr.x, pz - cr.z) < 2.6) {
        cr.collected = true;
        cr.mesh.visible = false;
        this.score++;
        this.audio?.pickup();
      }
    }
  }

  _updateCamera(dt) {
    const carPos = this.tmpV.copy(this.chassisBody.position);
    const q = this.carMesh.quaternion;
    let offset, lookAt, lerp;
    if (this.cameraMode === 0) {
      offset = new THREE.Vector3(0, 4.2, -9).applyQuaternion(q);
      lerp = 1 - Math.pow(0.001, dt);
      lookAt = carPos.clone().add(new THREE.Vector3(0, 1.2, 4).applyQuaternion(q));
    } else if (this.cameraMode === 1) {
      offset = new THREE.Vector3(0, 9, -18).applyQuaternion(q);
      lerp = 1 - Math.pow(0.002, dt);
      lookAt = carPos.clone();
    } else {
      offset = new THREE.Vector3(0, 26, -0.01);
      lerp = 1 - Math.pow(0.0001, dt);
      lookAt = carPos.clone();
    }
    const desired = carPos.clone().add(offset);
    this.camera.position.lerp(desired, lerp);
    this._camLook = this._camLook || lookAt.clone();
    this._camLook.lerp(lookAt, lerp);
    this.camera.lookAt(this._camLook);

    // keep sun shadow centered on car
    this.sun.position.set(carPos.x - 60, 70, carPos.z + 40);
    this.sun.target.position.copy(carPos);
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setPaused(p) {
    this.paused = p;
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this._onResize);
    this.controls?.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        const m = o.material;
        (Array.isArray(m) ? m : [m]).forEach((mm) => {
          mm.map?.dispose?.();
          mm.dispose?.();
        });
      }
    });
    this.renderer.dispose();
  }
}
