import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Full recipe detail for ONE dish, fetched on demand when the user opens it.
export async function POST(req: Request) {
  const { name, have, diet, people } = (await req.json()) as { name: string; have?: string; diet?: string; people?: number };
  if (!name) return NextResponse.json({ error: "No dish." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY." }, { status: 503 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [{
      name: "recipe",
      description: "Full recipe detail for the dish.",
      input_schema: {
        type: "object",
        properties: {
          ingredients: { type: "array", items: { type: "object", properties: { item: { type: "string" }, qty: { type: "string" }, have: { type: "boolean" } }, required: ["item", "qty", "have"] }, description: "full ingredient list with amounts; have=true for items they already have" },
          steps: { type: "array", items: { type: "string" }, description: "3-7 clear steps; mention timings in the text (e.g. 'simmer 10 min')" },
          nutrition: { type: "object", properties: { calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" } }, required: ["calories", "protein", "carbs", "fat"] },
        },
        required: ["ingredients", "steps", "nutrition"],
      },
    }],
    tool_choice: { type: "tool", name: "recipe" },
    messages: [{ role: "user", content: `Give the full recipe for "${name}" for ${people ?? 2} people${diet && diet !== "Any" ? ` (${diet})` : ""}.${have ? ` They already have: ${have}. Mark those have=true.` : ""}` }],
  });

  const tool = res.content.find((b) => b.type === "tool_use") as { input?: Record<string, unknown> } | undefined;
  if (!tool?.input) return NextResponse.json({ error: "Couldn't load the recipe." }, { status: 500 });
  return NextResponse.json({ recipe: tool.input });
}
