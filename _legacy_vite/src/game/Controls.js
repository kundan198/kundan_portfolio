// Keyboard + on-screen touch controls. Exposes a normalized input state.
export default class Controls {
  constructor(domElement) {
    this.dom = domElement;
    this.state = {
      forward: 0, // 0..1
      backward: 0,
      left: 0, // -1..1 steer
      right: 0,
      brake: false,
      reset: false,
      boost: false,
      camera: false, // toggle camera mode (edge-triggered handled outside)
    };
    this.keys = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // edge events
    this.onReset = null;
    this.onCamera = null;
    this.onHelp = null;
  }

  _onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (this.keys[k]) return; // ignore repeat
    this.keys[k] = true;
    if (k === "r" && this.onReset) this.onReset();
    if (k === "c" && this.onCamera) this.onCamera();
    if (k === "h" && this.onHelp) this.onHelp();
    this._sync();
  }

  _onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
    this._sync();
  }

  _sync() {
    const k = this.keys;
    this.state.forward = k["w"] || k["arrowup"] ? 1 : 0;
    this.state.backward = k["s"] || k["arrowdown"] ? 1 : 0;
    this.state.left = k["a"] || k["arrowleft"] ? 1 : 0;
    this.state.right = k["d"] || k["arrowright"] ? 1 : 0;
    this.state.brake = !!k[" "];
    this.state.boost = !!k["shift"];
  }

  // Called by React touch buttons. dir: 'forward'|'backward'|'left'|'right'|'brake'|'boost'
  setTouch(dir, on) {
    if (dir === "brake") this.state.brake = on;
    else if (dir === "boost") this.state.boost = on;
    else this.state[dir] = on ? 1 : 0;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}
