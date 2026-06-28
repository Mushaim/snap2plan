"use client";

export type Ingredient = { item: string; qty: string; have: boolean };
export type Nutrition = { calories: number; protein: number; carbs: number; fat: number };
export type Meal = {
  name: string; flavor: "sweet" | "savory"; minutes: number; difficulty: string;
  uses: string[]; missing: string[]; ingredients: Ingredient[]; steps: string[]; nutrition: Nutrition; cost?: number; note: string;
};

function Macro({ v, label, color }: { v: number; label: string; color: string }) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--color-line)] p-2 text-center">
      <div className="font-display text-lg font-bold" style={{ color }}>{v}{label === "Cal" ? "" : "g"}</div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-mute)]">{label}</div>
    </div>
  );
}

export default function RecipeModal({ meal, onClose, onCook }: { meal: Meal; onClose: () => void; onCook: () => void }) {
  const n = meal.nutrition;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--color-bg)] p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="chip">{meal.flavor === "sweet" ? "🍬 sweet" : "🧂 savory"}</span>
              <span className="text-xs text-[var(--color-mute)]">⏱ {meal.minutes}m · {meal.difficulty}</span>
            </div>
            <h2 className="serif text-2xl font-bold leading-tight">{meal.name}</h2>
            <p className="mt-0.5 text-sm text-[var(--color-soft)]">{meal.note}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm">✕</button>
        </div>

        <p className="label mb-1.5">Per serving</p>
        <div className="mb-4 flex gap-2">
          <Macro v={n.calories} label="Cal" color="var(--color-ink)" />
          <Macro v={n.protein} label="Protein" color="var(--color-accent)" />
          <Macro v={n.carbs} label="Carbs" color="var(--color-accent2)" />
          <Macro v={n.fat} label="Fat" color="#a16207" />
        </div>

        <p className="label mb-1.5">Ingredients</p>
        <ul className="mb-4 space-y-1.5 text-sm">
          {meal.ingredients.map((g, i) => (
            <li key={i} className="flex items-center justify-between gap-2" style={{ opacity: g.have ? 0.6 : 1 }}>
              <span>{g.have ? "✓ " : "🛒 "}{g.item}</span>
              <span className="text-[var(--color-mute)]">{g.qty}</span>
            </li>
          ))}
        </ul>
        {meal.missing.length > 0 && <p className="mb-4 rounded-xl bg-[var(--color-blush)] p-2.5 text-sm text-[var(--color-accent2)]"><b>Grab:</b> {meal.missing.join(", ")}</p>}

        <p className="label mb-1.5">Steps</p>
        <ol className="mb-5 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">{meal.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>

        <button onClick={onCook} className="btn w-full rounded-xl py-3.5 text-base">👨‍🍳 Start cooking — Cook Mode</button>
      </div>
    </div>
  );
}
