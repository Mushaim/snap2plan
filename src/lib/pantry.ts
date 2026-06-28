"use client";
// Pantry memory — staples you always keep + what's currently in your fridge. Merged into
// every request so plans use what you have and the grocery list drops items you own.
export type Pantry = { staples: string[]; fridge: string[] };
const KEY = "snap2plan_pantry";
const empty: Pantry = { staples: [], fridge: [] };

export function loadPantry(): Pantry {
  if (typeof window === "undefined") return empty;
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; }
}
export function savePantry(p: Pantry) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

const norm = (s: string) => s.trim().toLowerCase();
export function addItem(p: Pantry, kind: "staples" | "fridge", item: string): Pantry {
  const v = item.trim(); if (!v || p[kind].some((x) => norm(x) === norm(v))) return p;
  return { ...p, [kind]: [...p[kind], v] };
}
export function removeItem(p: Pantry, kind: "staples" | "fridge", item: string): Pantry {
  return { ...p, [kind]: p[kind].filter((x) => x !== item) };
}
export const allPantry = (p: Pantry) => [...p.fridge, ...p.staples];
