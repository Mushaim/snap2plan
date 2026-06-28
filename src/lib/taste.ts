"use client";
// Persistent taste profile — likes/dislikes/excluded ingredients. Fed into every request
// so it learns and never re-suggests what you rejected. No backend (localStorage).
export type Taste = { likes: string[]; dislikes: string[]; excluded: string[] };
const KEY = "snap2plan_taste";
const empty: Taste = { likes: [], dislikes: [], excluded: [] };

export function loadTaste(): Taste {
  if (typeof window === "undefined") return empty;
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; }
}
export function saveTaste(t: Taste) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} }

const add = (arr: string[], v: string) => (arr.includes(v) ? arr : [...arr, v]);
const rm = (arr: string[], v: string) => arr.filter((x) => x !== v);

export function like(t: Taste, dish: string): Taste {
  return { ...t, likes: add(t.likes, dish), dislikes: rm(t.dislikes, dish) };
}
export function dislike(t: Taste, dish: string): Taste {
  return { ...t, dislikes: add(t.dislikes, dish), likes: rm(t.likes, dish) };
}
export function exclude(t: Taste, ingredient: string): Taste {
  return { ...t, excluded: add(t.excluded, ingredient.trim().toLowerCase()) };
}
export function unexclude(t: Taste, ingredient: string): Taste {
  return { ...t, excluded: rm(t.excluded, ingredient) };
}
