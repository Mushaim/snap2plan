// Lightweight dish "thumbnail" — a food emoji + gradient picked from the dish name.
// Reliable & instant (no external image calls); a stand-in for full AI image-gen.
const EMOJI: [RegExp, string][] = [
  [/pasta|spaghetti|noodle|mac/i, "🍝"], [/pizza/i, "🍕"], [/burger/i, "🍔"], [/taco|quesadilla|wrap|burrito/i, "🌮"],
  [/salad/i, "🥗"], [/soup|stew|broth/i, "🍲"], [/rice|pilaf|biryani|risotto|bowl/i, "🍚"], [/curry|masala|tikka/i, "🍛"],
  [/egg|shakshuka|omelet|frittata/i, "🍳"], [/chicken/i, "🍗"], [/fish|salmon|shrimp|prawn|seafood/i, "🐟"], [/steak|beef|meat/i, "🥩"],
  [/sandwich|toast|melt|panini/i, "🥪"], [/pancake|waffle|french toast/i, "🥞"], [/cake|brownie|cookie|dessert|sweet|pudding|muffin/i, "🍰"],
  [/smoothie|shake|juice/i, "🥤"], [/oat|porridge|cereal|granola/i, "🥣"], [/bread|sandwich|bun/i, "🍞"], [/veg|stir.?fry|tofu/i, "🥦"],
];
const GRADS = [
  "linear-gradient(135deg,#fde68a,#fca5a5)", "linear-gradient(135deg,#bbf7d0,#86efac)", "linear-gradient(135deg,#fed7aa,#fdba74)",
  "linear-gradient(135deg,#bfdbfe,#a5b4fc)", "linear-gradient(135deg,#fecaca,#fda4af)", "linear-gradient(135deg,#d9f99d,#bef264)",
];

export function dishEmoji(name: string): string {
  for (const [rx, e] of EMOJI) if (rx.test(name)) return e;
  return "🍽️";
}
export function dishGradient(name: string): string {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
}
