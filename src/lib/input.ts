// Unified input singleton — merges keyboard + on-screen touch controls.
export type InputState = {
  forward: number; // 0..1
  back: number;
  left: number;
  right: number;
  jump: boolean;
  boost: boolean;
};

const state: InputState = {
  forward: 0,
  back: 0,
  left: 0,
  right: 0,
  jump: false,
  boost: false,
};

const keys: Record<string, boolean> = {};
let initialized = false;

type EdgeHandlers = {
  onInteract?: () => void;
  onCamera?: () => void;
};
const edge: EdgeHandlers = {};

function sync() {
  state.forward = keys["w"] || keys["arrowup"] ? 1 : 0;
  state.back = keys["s"] || keys["arrowdown"] ? 1 : 0;
  state.left = keys["a"] || keys["arrowleft"] ? 1 : 0;
  state.right = keys["d"] || keys["arrowright"] ? 1 : 0;
  state.jump = !!keys[" "];
  state.boost = !!keys["shift"];
}

export function initInput() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (keys[k]) return;
    keys[k] = true;
    if (k === "e") edge.onInteract?.();
    if (k === "c") edge.onCamera?.();
    sync();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
    sync();
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
    sync();
  });
}

export function getInput(): InputState {
  return state;
}

export function setTouch(dir: keyof InputState, on: boolean) {
  if (dir === "jump" || dir === "boost") state[dir] = on;
  else state[dir] = on ? 1 : 0;
}

export function onEdge(h: EdgeHandlers) {
  Object.assign(edge, h);
}

export function fireInteract() {
  edge.onInteract?.();
}
