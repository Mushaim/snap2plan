"use client";
import { useEffect, useRef, useState } from "react";
import { loadTaste, saveTaste, like, dislike, type Taste } from "@/lib/taste";
import { loadPantry, savePantry, addItem, removeItem, allPantry, type Pantry } from "@/lib/pantry";
import RecipeModal, { type Meal } from "@/components/RecipeModal";
import CookMode from "@/components/CookMode";
import { buildGrocery, groceryText } from "@/lib/grocery";
import { dishEmoji, dishGradient } from "@/lib/dish";

type DayPlan = { day: string; options: Meal[] };

function GroceryList({ meals }: { meals: Meal[] }) {
  const groups = buildGrocery(meals);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const total = meals.reduce((s, m) => s + (m.cost || 0), 0);
  async function share() {
    const text = groceryText(groups);
    try { if (navigator.share) { await navigator.share({ title: "Grocery list", text }); return; } } catch { /* fall through */ }
    try { await navigator.clipboard.writeText(text); alert("Grocery list copied!"); } catch { /* noop */ }
  }
  if (!groups.length) return <div className="card p-5 text-sm text-[var(--color-soft)]">Nothing to buy — your picks use what you already have 🎉</div>;
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">🛒 Grocery list <span className="text-xs font-normal text-[var(--color-mute)]">(only what you’re missing)</span></p>
        <button onClick={share} className="btn-soft rounded-xl px-3 py-1.5 text-sm">↗ Share</button>
      </div>
      {total > 0 && <p className="mb-3 text-sm text-[var(--color-soft)]">Estimated meals cost: <b>~${Math.round(total)}</b></p>}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.aisle}>
            <p className="label mb-1.5">{g.aisle}</p>
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li key={it}>
                  <label className="flex items-center gap-2 text-sm" style={{ opacity: checked.has(it) ? 0.45 : 1, textDecoration: checked.has(it) ? "line-through" : "none" }}>
                    <input type="checkbox" className="accent-[var(--color-accent)]" checked={checked.has(it)}
                      onChange={() => setChecked((c) => { const n = new Set(c); n.has(it) ? n.delete(it) : n.add(it); return n; })} />
                    {it}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIETS = ["Any", "Vegetarian", "Vegan", "Halal", "Keto"];
const MOODS = ["Quick", "Light", "Hearty", "Comfort", "Healthy", "Spicy"];
const STEPS_NOW = ["📸 Checking what you have", "💡 Coming up with options", "🍽️ Almost ready"];
const STEPS_WEEK = ["📸 Checking your fridge", "🍽️ Planning options for each day", "🛒 Finishing up"];

function resize(file: File): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

function StepLoader({ steps }: { steps: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 2400); return () => clearInterval(t); }, [steps]);
  return (
    <div className="card mt-5 space-y-3 p-5">
      {steps.map((s, idx) => (
        <div key={s} className="flex items-center gap-3 text-sm" style={{ opacity: idx <= i ? 1 : 0.35 }}>
          {idx < i ? <span className="text-[var(--color-accent)]">✓</span>
            : idx === i ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
              : <span className="inline-block h-4 w-4 rounded-full border-2 border-[var(--color-line)]" />}
          <span style={{ fontWeight: idx === i ? 700 : 400 }}>{s}{idx === i ? "…" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function MealCard({ m, picked, onPick, onOpen, onLike, onDislike, liked }:
  { m: Meal; picked?: boolean; onPick?: () => void; onOpen: () => void; onLike: () => void; onDislike: () => void; liked: boolean }) {
  return (
    <div className="card pop p-4" style={picked ? { borderColor: "var(--color-accent)", borderWidth: 2 } : {}}>
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-3xl" style={{ background: dishGradient(m.name) }}>{dishEmoji(m.name)}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="chip">{m.flavor === "sweet" ? "🍬 sweet" : "🧂 savory"}</span>
            <span className="text-xs text-[var(--color-mute)]">⏱ {m.minutes}m · {m.nutrition.calories} cal · {m.nutrition.protein}g protein{m.cost ? ` · ~$${m.cost}` : ""}</span>
          </div>
          <p className="font-semibold leading-snug">{m.name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-soft)]">{m.note}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button onClick={onLike} title="More like this" className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm" style={liked ? { background: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" } : {}}>👍</button>
          <button onClick={onDislike} title="Never suggest again" className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm">👎</button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onOpen} className="btn-soft rounded-xl px-3 py-2 text-sm">👀 See recipe</button>
        {onPick && <button onClick={onPick} className="btn rounded-xl px-3 py-2 text-sm">{picked ? "✓ Picked" : "Pick this"}</button>}
      </div>
    </div>
  );
}

function PantryEditor({ pantry, setP }: { pantry: Pantry; setP: (p: Pantry) => void }) {
  const [open, setOpen] = useState(false);
  const Row = ({ kind, label, ph }: { kind: "fridge" | "staples"; label: string; ph: string }) => {
    const [v, setV] = useState("");
    return (
      <div>
        <p className="label mb-1.5">{label}</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {pantry[kind].map((it) => (
            <span key={it} className="chip">{it} <button onClick={() => { const np = removeItem(pantry, kind, it); setP(np); savePantry(np); }} className="ml-1">✕</button></span>
          ))}
          {pantry[kind].length === 0 && <span className="text-xs text-[var(--color-mute)]">nothing yet</span>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const np = addItem(pantry, kind, v); setP(np); savePantry(np); setV(""); }} className="flex gap-2">
          <input className="input py-2 text-sm" value={v} onChange={(e) => setV(e.target.value)} placeholder={ph} />
          <button className="btn-soft rounded-xl px-3 text-sm">+ Add</button>
        </form>
      </div>
    );
  };
  return (
    <div className="card mb-4 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="font-semibold">🧺 My Pantry <span className="text-xs font-normal text-[var(--color-mute)]">({allPantry(pantry).length} items remembered)</span></span>
        <span className="text-[var(--color-mute)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-[var(--color-soft)]">Saved on this device and used in every plan — so meals use what you have and the shopping list drops what you own.</p>
          <Row kind="fridge" label="In my fridge now" ph="e.g. leftover rice, half an onion" />
          <Row kind="staples" label="Staples I always have" ph="e.g. salt, oil, garlic, eggs" />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"now" | "week">("now");
  const [img, setImg] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [flavor, setFlavor] = useState("Any");
  const [moods, setMoods] = useState<string[]>([]);
  const [diet, setDiet] = useState("Any");
  const [budget, setBudget] = useState(false);
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState("");
  const [detected, setDetected] = useState<string[]>([]);
  const [options, setOptions] = useState<Meal[]>([]);
  const [week, setWeek] = useState<DayPlan[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [taste, setTaste] = useState<Taste>({ likes: [], dislikes: [], excluded: [] });
  const [pantry, setPantry] = useState<Pantry>({ staples: [], fridge: [] });
  const [recipe, setRecipe] = useState<Meal | null>(null);
  const [cooking, setCooking] = useState<Meal | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTaste(loadTaste()); setPantry(loadPantry()); }, []);

  const combinedIngredients = () => [ingredients, ...allPantry(pantry)].filter(Boolean).join(", ");

  async function go(append = false) {
    setErr(""); append ? setMore(true) : setLoading(true);
    if (!append) { setOptions([]); setWeek([]); setPicks({}); }
    try {
      const res = await fetch("/api/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, image: img || undefined, ingredients: combinedIngredients(), prefs: { diet, budget, people, days, flavor, moods, maxMinutes: mode === "now" ? 25 : undefined }, taste }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetected(data.result.detected ?? []);
      if (mode === "now") {
        const fresh: Meal[] = (data.result.options ?? []).filter((m: Meal) => !taste.dislikes.includes(m.name));
        setOptions((prev) => append ? Object.values(Object.fromEntries([...prev, ...fresh].map((m) => [m.name, m]))) : fresh);
      } else setWeek(data.result.days ?? []);
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); setMore(false); }
  }

  function doLike(name: string) { const nt = like(taste, name); setTaste(nt); saveTaste(nt); }
  function doDislike(name: string) {
    const nt = dislike(taste, name); setTaste(nt); saveTaste(nt);
    setOptions((o) => o.filter((m) => m.name !== name));
    setWeek((w) => w.map((d) => ({ ...d, options: d.options.filter((m) => m.name !== name) })));
    if (recipe?.name === name) setRecipe(null);
  }
  const canGo = !!img || !!combinedIngredients().trim();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-5">
        <h1 className="serif text-4xl font-bold">Snap2Plan 🥗</h1>
        <p className="mt-1 text-[var(--color-soft)]">Snap your fridge → get options, you choose. <span className="chip">demo</span></p>
      </div>

      <PantryEditor pantry={pantry} setP={setPantry} />

      <div className="mb-4 grid grid-cols-2 gap-2">
        {([["now", "⚡ Eat now"], ["week", "📅 Plan my week"]] as const).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} className="rounded-xl border py-2.5 font-semibold transition-colors"
            style={mode === m ? { background: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" } : { borderColor: "var(--color-line)", background: "#fff" }}>{label}</button>
        ))}
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await resize(f)); }} />
          {img ? (
            <div className="relative">
              <img src={img} alt="" className="max-h-52 w-full rounded-xl object-cover" />
              <button onClick={() => { setImg(""); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">change</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-line)] py-6 text-[var(--color-soft)]">📷 Snap or upload your fridge</button>
          )}
        </div>
        <input className="input" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="…or type extra: tomatoes, bread, cheese" />

        <div className="flex items-center gap-2">
          <span className="label">Craving</span>
          {["Any", "Savory", "Sweet"].map((f) => <button key={f} className="pill" data-on={flavor === f} onClick={() => setFlavor(f)}>{f === "Sweet" ? "🍬 Sweet" : f === "Savory" ? "🧂 Savory" : f}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5">{MOODS.map((m) => <button key={m} className="pill" data-on={moods.includes(m)} onClick={() => setMoods((x) => x.includes(m) ? x.filter((y) => y !== m) : [...x, m])}>{m}</button>)}</div>
        <div className="flex flex-wrap gap-1.5">
          {DIETS.map((d) => <button key={d} className="pill" data-on={diet === d} onClick={() => setDiet(d)}>{d}</button>)}
          <button className="pill" data-on={budget} onClick={() => setBudget((b) => !b)}>💸 Budget</button>
        </div>
        {mode === "week" && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">👥 <input type="number" min={1} max={8} value={people} onChange={(e) => setPeople(+e.target.value)} className="input w-16 py-1.5" /></label>
            <label className="flex items-center gap-2">📅 <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(+e.target.value)} className="input w-16 py-1.5" /></label>
          </div>
        )}

        <button className="btn w-full" onClick={() => go(false)} disabled={loading || !canGo}>{loading ? "Thinking…" : mode === "now" ? "Show me options →" : "Plan my week →"}</button>
        {(taste.likes.length > 0 || taste.dislikes.length > 0) && <p className="text-xs text-[var(--color-mute)]">Learning your taste: 👍 {taste.likes.length} liked · 👎 {taste.dislikes.length} avoided</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>

      {loading && <StepLoader steps={mode === "now" ? STEPS_NOW : STEPS_WEEK} />}

      {detected.length > 0 && !loading && (
        <div className="card mt-5 p-4"><p className="label mb-2">🧺 Spotted</p><div className="flex flex-wrap gap-1.5">{detected.map((d) => <span key={d} className="chip">{d}</span>)}</div></div>
      )}

      {mode === "now" && options.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="label">Pick what sounds good 👇</p>
          {options.map((m) => <MealCard key={m.name} m={m} onOpen={() => setRecipe(m)} onLike={() => doLike(m.name)} onDislike={() => doDislike(m.name)} liked={taste.likes.includes(m.name)} />)}
          <button className="btn-soft w-full rounded-xl py-3 font-semibold" onClick={() => go(true)} disabled={more}>{more ? "Finding more…" : "↻ Show me other options"}</button>
        </div>
      )}

      {mode === "week" && week.length > 0 && (
        <div className="mt-5 space-y-5">
          {week.map((d) => (
            <div key={d.day}>
              <p className="label mb-2">{d.day} — choose one</p>
              <div className="space-y-2">
                {d.options.map((m) => <MealCard key={m.name} m={m} picked={picks[d.day] === m.name} onPick={() => setPicks((p) => ({ ...p, [d.day]: m.name }))} onOpen={() => setRecipe(m)} onLike={() => doLike(m.name)} onDislike={() => doDislike(m.name)} liked={taste.likes.includes(m.name)} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "week" && Object.keys(picks).length > 0 && (
        <div className="mt-6">
          <p className="label mb-2">📅 Your week ({Object.keys(picks).length} picked) + shopping</p>
          <GroceryList meals={week.flatMap((d) => d.options.filter((o) => picks[d.day] === o.name))} />
        </div>
      )}

      {recipe && <RecipeModal meal={recipe} onClose={() => setRecipe(null)} onCook={() => { setCooking(recipe); setRecipe(null); }} />}
      {cooking && <CookMode meal={cooking} onClose={() => setCooking(null)} />}
    </main>
  );
}
