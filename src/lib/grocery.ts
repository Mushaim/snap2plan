import type { Meal } from "@/components/RecipeModal";

const AISLES: [string, RegExp][] = [
  ["🥬 Produce", /lettuce|spinach|tomato|onion|garlic|pepper|carrot|potato|cucumber|broccoli|apple|banana|lemon|lime|herb|cilantro|coriander|parsley|ginger|mushroom|avocado|corn|peas|cabbage|chil(i|li)|fruit|veg|scallion|spring onion|zucchini|eggplant/i],
  ["🍗 Meat & Seafood", /chicken|beef|pork|lamb|mince|fish|salmon|shrimp|prawn|turkey|bacon|sausage|\bmeat\b|tofu/i],
  ["🧀 Dairy & Eggs", /milk|cheese|butter|yogurt|yoghurt|cream|\begg/i],
  ["🍞 Bakery", /bread|bun|tortilla|pita|naan|flatbread|roll|bagel|wrap/i],
  ["🥫 Pantry & Spices", /rice|pasta|flour|oil|\bsalt\b|spice|cumin|paprika|turmeric|sauce|vinegar|sugar|stock|broth|bean|lentil|\bcan\b|noodle|honey|soy|seasoning|stock cube|coconut|oats|cereal/i],
  ["❄️ Frozen", /frozen|ice cream/i],
];

const norm = (s: string) => s.replace(/\(.*?\)/g, "").replace(/\b(\d+[\d./]*)\s*(g|kg|ml|l|oz|lb|cup|cups|tbsp|tsp|cloves?|pieces?|handfuls?|small|large|pack)\b/gi, "").trim().toLowerCase();

export function categorize(item: string): string {
  for (const [aisle, rx] of AISLES) if (rx.test(item)) return aisle;
  return "🛒 Other";
}

// Consolidate the "missing" items across chosen meals, deduped + grouped by aisle.
export function buildGrocery(meals: Meal[]): { aisle: string; items: string[] }[] {
  const seen = new Set<string>();
  const byAisle: Record<string, string[]> = {};
  for (const m of meals) {
    for (const raw of m.missing) {
      const key = norm(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const a = categorize(raw);
      (byAisle[a] ??= []).push(raw);
    }
  }
  const order = ["🥬 Produce", "🍗 Meat & Seafood", "🧀 Dairy & Eggs", "🍞 Bakery", "🥫 Pantry & Spices", "❄️ Frozen", "🛒 Other"];
  return order.filter((a) => byAisle[a]?.length).map((a) => ({ aisle: a, items: byAisle[a] }));
}

export function groceryText(groups: { aisle: string; items: string[] }[]): string {
  return "🛒 Grocery list (Snap2Plan)\n\n" + groups.map((g) => `${g.aisle}\n` + g.items.map((i) => `  • ${i}`).join("\n")).join("\n\n");
}
