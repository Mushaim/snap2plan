# Snap2Plan — your fridge, planned

Snap a photo of your fridge (or just list what you have) and Snap2Plan plans a week of dinners around it — then gives you a grocery list of **only the things you're missing**.

🔗 **Live:** https://snap2plan-mushaim-s-projects.vercel.app

## Why it exists
"What's for dinner?" is a decision people make 365 times a year — and most meal-planning apps ignore what you *already have*, so you over-buy and waste food. Snap2Plan starts from your actual fridge: it sees your ingredients, builds meals that use them up, and only sends you shopping for the gaps.

## What makes it interesting (engineering)
- **Multimodal vision → structured plan in one call.** A photo of your fridge goes straight to Claude with a JSON-schema tool, which identifies the food items *and* returns a structured `{ detected, meals, grocery }` — vision + planning fused, not bolted together.
- **"Use what you have" optimization.** The prompt biases meals toward existing ingredients and puts only genuinely-missing items (with rough quantities) on the grocery list — the core value.
- **Real constraints.** Diet (veg/vegan/halal/keto), people, days, and a "quick (<20 min)" toggle all shape the plan.
- **Fast + light.** Photos are downscaled client-side before upload; a stepped loader ("looking in your fridge → planning → grocery list") keeps the wait alive.
- **No-camera fallback.** Type your ingredients instead of snapping — so it works instantly, anywhere.

## Stack
Next.js (App Router) · Anthropic Claude (vision + structured tool use) · TypeScript · Tailwind · Vercel.

## Run locally
```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

## What I'd add next
Pantry memory (so it learns staples you always have), nutrition/macros per meal, one-tap export to a grocery-delivery cart, and a "cook mode" with timers.
