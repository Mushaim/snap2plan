"use client";
import { useEffect, useRef, useState } from "react";

type Meal = { day: string; name: string; minutes: number; uses: string[]; steps: string[] };
type Plan = { detected: string[]; meals: Meal[]; grocery: string[] };

const DIETS = ["Any", "Vegetarian", "Vegan", "Halal", "Keto"];
const STEPS = ["📸 Looking inside your fridge", "🍽️ Planning your week of meals", "🛒 Building your grocery list"];

// Downscale a photo to keep the upload small + fast.
function resize(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024, scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

function StepLoader() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, STEPS.length - 1)), 2800); return () => clearInterval(t); }, []);
  return (
    <div className="card mt-5 space-y-3 p-5">
      {STEPS.map((s, idx) => (
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

export default function Home() {
  const [img, setImg] = useState<string>("");
  const [ingredients, setIngredients] = useState("");
  const [diet, setDiet] = useState("Any");
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [quick, setQuick] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function go() {
    setErr(""); setLoading(true); setPlan(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: img || undefined, ingredients, prefs: { diet, people, days, maxMinutes: quick ? 20 : undefined } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data.plan); setOpen(0);
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6">
        <h1 className="serif text-4xl font-bold">Snap2Plan 🥗</h1>
        <p className="mt-1 text-[var(--color-soft)]">Snap your fridge → get a week of dinners + a grocery list. <span className="chip">demo</span></p>
      </div>

      <div className="card space-y-4 p-5">
        {/* photo */}
        <div>
          <label className="label">Your fridge / pantry</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await resize(f)); }} />
          {img ? (
            <div className="relative mt-2">
              <img src={img} alt="" className="max-h-56 w-full rounded-xl object-cover" />
              <button onClick={() => { setImg(""); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">change</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-line)] py-7 text-[var(--color-soft)]">
              📷 Tap to snap or upload a photo
            </button>
          )}
        </div>
        <div className="text-center text-xs text-[var(--color-mute)]">— or —</div>
        <div>
          <label className="label">List what you have (optional)</label>
          <input className="input mt-1" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="eggs, spinach, chicken, rice, tomatoes…" />
        </div>

        {/* prefs */}
        <div className="flex flex-wrap gap-1.5">
          {DIETS.map((d) => <button key={d} className="pill" data-on={diet === d} onClick={() => setDiet(d)}>{d}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">👥 People <input type="number" min={1} max={8} value={people} onChange={(e) => setPeople(+e.target.value)} className="input w-16 py-1.5" /></label>
          <label className="flex items-center gap-2">📅 Days <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(+e.target.value)} className="input w-16 py-1.5" /></label>
          <button className="pill" data-on={quick} onClick={() => setQuick((q) => !q)}>⚡ Quick (&lt;20 min)</button>
        </div>

        <button className="btn w-full" onClick={go} disabled={loading || (!img && !ingredients.trim())}>{loading ? "Cooking up a plan…" : "Plan my week →"}</button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>

      {loading && <StepLoader />}

      {plan && (
        <div className="pop mt-6 space-y-5">
          <div className="card p-5">
            <p className="label mb-2">🧺 Spotted in your kitchen</p>
            <div className="flex flex-wrap gap-1.5">{plan.detected.map((d) => <span key={d} className="chip">{d}</span>)}</div>
          </div>

          <div>
            <p className="label mb-2">🍽️ Your week</p>
            <div className="space-y-2">
              {plan.meals.map((m, i) => (
                <div key={i} className="card overflow-hidden">
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent2)]">{m.day}</span>
                      <p className="font-semibold">{m.name}</p>
                    </div>
                    <span className="text-xs text-[var(--color-mute)]">⏱ {m.minutes}m {open === i ? "▲" : "▼"}</span>
                  </button>
                  {open === i && (
                    <div className="border-t border-[var(--color-line)] p-4 pt-3">
                      <p className="mb-2 text-xs text-[var(--color-soft)]">Uses: {m.uses.join(", ")}</p>
                      <ol className="ml-4 list-decimal space-y-1 text-sm">{m.steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <p className="label mb-2">🛒 Grocery list — only what you’re missing</p>
            {plan.grocery.length === 0 ? <p className="text-sm text-[var(--color-soft)]">Nothing! You have it all 🎉</p> : (
              <ul className="space-y-1.5">{plan.grocery.map((g) => <li key={g} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--color-accent)]" /> {g}</li>)}</ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
