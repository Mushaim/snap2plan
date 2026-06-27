import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

type Prefs = { diet?: string; people?: number; days?: number; maxMinutes?: number; notes?: string };

export async function POST(req: Request) {
  const { image, ingredients, prefs } = (await req.json()) as { image?: string; ingredients?: string; prefs?: Prefs };
  if (!image && !ingredients?.trim()) return NextResponse.json({ error: "Add a fridge photo or list some ingredients." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY." }, { status: 503 });

  const p = prefs ?? {};
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const content: Anthropic.MessageParam["content"] = [];
  if (image) {
    const m = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1] as any, data: m[2] } });
  }
  content.push({
    type: "text",
    text:
      (image ? "Look at this fridge/pantry photo and identify the food items you can see. " : "") +
      (ingredients ? `The user also has: ${ingredients}. ` : "") +
      `Plan ${p.days ?? 5} dinners for ${p.people ?? 2} people` +
      (p.diet && p.diet !== "Any" ? `, ${p.diet}` : "") +
      (p.maxMinutes ? `, each under ~${p.maxMinutes} min` : "") +
      (p.notes ? `. Notes: ${p.notes}` : "") +
      `. Prefer meals that mostly use what they ALREADY have; only put truly-needed extras in the grocery list (with rough common quantities). Keep recipes simple and real.`,
  });

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3500,
    tools: [{
      name: "meal_plan",
      description: "Emit detected ingredients, a dinner plan, and a grocery list.",
      input_schema: {
        type: "object",
        properties: {
          detected: { type: "array", items: { type: "string" }, description: "food items seen in the photo / provided" },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                name: { type: "string" },
                minutes: { type: "number" },
                uses: { type: "array", items: { type: "string" }, description: "items they already have, used here" },
                steps: { type: "array", items: { type: "string" }, description: "3-6 short steps" },
              },
              required: ["day", "name", "minutes", "uses", "steps"],
            },
          },
          grocery: { type: "array", items: { type: "string" }, description: "only the missing items to buy, with rough quantities" },
        },
        required: ["detected", "meals", "grocery"],
      },
    }],
    tool_choice: { type: "tool", name: "meal_plan" },
    messages: [{ role: "user", content }],
  });

  const tool = res.content.find((b) => b.type === "tool_use") as { input?: Record<string, unknown> } | undefined;
  if (!tool?.input) return NextResponse.json({ error: "Couldn't build a plan — try a clearer photo." }, { status: 500 });
  return NextResponse.json({ plan: tool.input });
}
