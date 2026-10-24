import panel from "./panel.js";

export const held = panel;

export function render(label: string): string {
  return panel(label);
}
