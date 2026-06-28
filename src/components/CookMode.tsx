"use client";
import { useEffect, useRef, useState } from "react";

type Meal = { name: string; steps?: string[]; minutes: number };

// detect "10 min", "5 minutes", "2-3 min" → seconds for a quick timer on that step
function stepMinutes(step: string): number | null {
  const m = step.match(/(\d+)\s*(?:-\s*\d+\s*)?(?:min|minute)/i);
  return m ? parseInt(m[1], 10) : null;
}

export default function CookMode({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [ringing, setRinging] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const steps = meal.steps ?? [];
  const total = steps.length;
  const mins = stepMinutes(steps[i] || "");

  useEffect(() => { setLeft(null); setRinging(false); if (tick.current) clearInterval(tick.current); }, [i]);

  function startTimer(seconds: number) {
    setRinging(false); setLeft(seconds);
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => {
      setLeft((s) => {
        if (s === null) return null;
        if (s <= 1) { clearInterval(tick.current!); setRinging(true); try { navigator.vibrate?.([300, 150, 300]); } catch {} return 0; }
        return s - 1;
      });
    }, 1000);
  }
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
        <div>
          <p className="text-xs text-[var(--color-mute)]">Cooking</p>
          <p className="font-semibold leading-tight">{meal.name}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm">✕ Done</button>
      </div>

      {/* progress */}
      <div className="px-5 pt-4">
        <div className="flex justify-between text-xs text-[var(--color-mute)]"><span>Step {i + 1} of {total}</span><span>⏱ ~{meal.minutes}m total</span></div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-line)]"><div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${((i + 1) / total) * 100}%` }} /></div>
      </div>

      {/* current step — big, hands-free readable */}
      <div className="flex flex-1 items-center justify-center px-7 text-center">
        <div>
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)] text-xl font-bold text-white">{i + 1}</div>
          <p className="serif text-2xl leading-relaxed text-[var(--color-ink)]">{steps[i]}</p>

          {mins && left === null && (
            <button onClick={() => startTimer(mins * 60)} className="btn mt-7 inline-block">⏲ Start {mins}-min timer</button>
          )}
          {left !== null && (
            <div className={`mt-7 ${ringing ? "animate-bounce" : ""}`}>
              <p className="font-display text-5xl font-bold" style={{ color: ringing ? "var(--color-accent2)" : "var(--color-accent)" }}>{mmss(left)}</p>
              <p className="mt-1 text-sm text-[var(--color-soft)]">{ringing ? "⏰ Time's up!" : "timer running…"}</p>
            </div>
          )}
        </div>
      </div>

      {/* nav */}
      <div className="flex gap-3 border-t border-[var(--color-line)] p-5">
        <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="btn-soft flex-1 rounded-xl py-3.5 font-semibold disabled:opacity-40">← Back</button>
        {i < total - 1
          ? <button onClick={() => setI((x) => x + 1)} className="btn flex-[2] rounded-xl py-3.5 text-base">Next step →</button>
          : <button onClick={onClose} className="btn flex-[2] rounded-xl py-3.5 text-base">🎉 Finish</button>}
      </div>
    </div>
  );
}
