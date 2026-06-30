/* ─── Kai Global Event Bus ───────────────────────────────────────────────────
   Any component on any page can call triggerKai() to push a contextual
   interaction to the Kai character. The character reacts with a matching
   pose + speech bubble without needing props or context wiring.
────────────────────────────────────────────────────────────────────────────── */

export type KaiTriggerType =
  | "photo"
  | "name"
  | "skill"
  | "graduation"
  | "research"
  | "project"
  | "experience"
  | "contact"
  | "award"
  | "hackathon"
  | "available"
  | "stat"
  | "reset";

export interface KaiTrigger {
  type: KaiTriggerType;
  /** Specific label — e.g. skill name, project name */
  label?: string;
}

export function triggerKai(detail: KaiTrigger): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kai:trigger", { detail }));
}

export function resetKai(): void {
  triggerKai({ type: "reset" });
}

/* ─── Convenience hook ──────────────────────────────────────────────────── */
/** Returns { onMouseEnter, onMouseLeave } props that trigger/reset Kai */
export function kaiHoverProps(trigger: KaiTrigger) {
  return {
    onMouseEnter: () => triggerKai(trigger),
    onMouseLeave: () => resetKai(),
  };
}
