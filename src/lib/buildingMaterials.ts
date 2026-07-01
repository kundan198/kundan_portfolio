// Shared PBR glass curtain-wall material with a procedural window shader.
//
// One material drives every tower: window cells are derived from WORLD position in
// the fragment shader, so each building gets a unique, consistent-scale window grid
// with random lit/unlit panes, warm interior glow, mullion framing and reflective
// glass (via the scene's HDR environment). Windows light up at dusk/night and as the
// world's vitality rises — no per-window meshes, so it stays one draw call per tower.

import * as THREE from "three";

type ShaderRef = THREE.WebGLProgramParametersWithUniforms;
const registry: ShaderRef[] = [];

const HASH = `
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}`;

export type GlassOptions = {
  tint?: string;      // glass colour
  accent?: string;    // interior/lit-window colour
  colW?: number;      // window cell width (m)
  colH?: number;      // window cell height (m)
  frame?: number;     // mullion thickness (0..0.5)
  metalness?: number;
  roughness?: number;
};

export function makeGlassMaterial(opts: GlassOptions = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(opts.tint ?? "#20313f"),
    metalness: opts.metalness ?? 0.68,
    roughness: opts.roughness ?? 0.1,
    envMapIntensity: 1.6,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNight = { value: 0.1 };
    shader.uniforms.uVitality = { value: 0 };
    shader.uniforms.uWinColor = { value: new THREE.Color(opts.accent ?? "#ffd39a") };
    shader.uniforms.uColW = { value: opts.colW ?? 1.5 };
    shader.uniforms.uColH = { value: opts.colH ?? 1.9 };
    shader.uniforms.uFrame = { value: opts.frame ?? 0.14 };

    shader.vertexShader =
      "varying vec3 vWPos;\nvarying vec3 vWNorm;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
       vWNorm = normalize(mat3(modelMatrix) * normal);`
    );

    shader.fragmentShader =
      "uniform float uTime;\nuniform float uNight;\nuniform float uVitality;\nuniform vec3 uWinColor;\nuniform float uColW;\nuniform float uColH;\nuniform float uFrame;\nvarying vec3 vWPos;\nvarying vec3 vWNorm;\n" +
      HASH +
      "\n" +
      shader.fragmentShader;

    // window grid + mullions on the vertical facades
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       vec3 an = abs(vWNorm);
       float side = step(an.y, 0.7);                       // 1 on walls, 0 on roof/floor
       float horiz = an.x > an.z ? vWPos.z : vWPos.x;      // run windows along the facade
       vec2 cell = vec2(horiz / uColW, vWPos.y / uColH);
       vec2 fpos = fract(cell);
       vec2 idc = floor(cell) + step(0.0, vWNorm.x + vWNorm.z) * 7.0; // vary front/back
       float fr = uFrame;
       float pane = step(fr, fpos.x) * step(fpos.x, 1.0 - fr) * step(fr, fpos.y) * step(fpos.y, 1.0 - fr) * side;
       float rnd = hash21(idc + 0.5);
       float litThresh = mix(0.7, 0.22, clamp(uNight + uVitality * 0.55, 0.0, 1.0));
       float lit = step(litThresh, rnd) * pane;
       float furn = step(0.62, hash21(idc * 1.7 + 3.1)) * step(fpos.y, 0.45); // furniture silhouette
       float gWinLit = lit * (1.0 - furn * 0.55);
       // mullions darken the base glass; panes keep the tint
       diffuseColor.rgb = mix(diffuseColor.rgb * 0.32, diffuseColor.rgb, pane);`
    );

    // emissive interior glow for lit windows
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       totalEmissiveRadiance += uWinColor * gWinLit * (0.4 + uNight * 1.5 + uVitality * 0.5);`
    );

    registry.push(shader);
  };

  return mat;
}

// Simple emissive material for neon signage / LED accents.
export function makeNeonMaterial(color: string, intensity = 1.6) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    metalness: 0.2,
    roughness: 0.4,
    toneMapped: true,
  });
}

// Called once per frame from a live component (Districts) to drive all glass shaders.
export function updateCityMaterials(time: number, night: number, vitality: number) {
  for (const s of registry) {
    s.uniforms.uTime.value = time;
    s.uniforms.uNight.value = night;
    s.uniforms.uVitality.value = vitality;
  }
}
