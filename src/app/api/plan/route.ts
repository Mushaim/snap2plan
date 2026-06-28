import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

type Prefs = { diet?: string; people?: number; days?: number; maxMinutes?: number; flavor?: string; moods?: string[]; cuisine?: string };
type Taste = { likes?: string[]; dislikes?: string[]; excluded?: string[] };

const mealProps = {
  name: { type: "string" },
  flavor: { type: "string", enum: ["sweet", "savory"], description: "is this a sweet or savory dish" },
  minutes: { type: "number" },
  difficulty: { type: "string", enum: ["easy", "medium"] },
  uses: { type: "array", items: { type: "string" }, description: "items they already have, used here" },
  missing: { type: "array", items: { type: "string" }, description: "items they'd need to buy (empty if none)" },
  steps: { type: "array", items: { type: "string" }, description: "3-6 short steps" },
  note: { type: "string", description: "one short enticing line about the dish" },
};
const meal = { type: "object", properties: mealProps, required: ["name", "flavor", "minutes", "difficulty", "uses", "missing", "steps", "note"] };

export async function POST(req: Request) {
  const { mode, image, ingredients, prefs, taste } = (await req.json()) as
    { mode: "now" | "week"; image?: string; ingredients?: string; prefs?: Prefs; taste?: Taste };
  if (!image && !ingredients?.trim()) return NextResponse.json({ error: "Add a fridge photo or list some ingredients." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY." }, { status: 503 });

  const p = prefs ?? {}, t = taste ?? {};
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // taste/mood constraints injected into every request
  const rules = [
    p.diet && p.diet !== "Any" ? `Diet: ${p.diet}.` : "",
    p.flavor && p.flavor !== "Any" ? `The user is craving ${p.flavor.toUpperCase()} food right now — bias toward that.` : "",
    p.moods?.length ? `Mood/vibe: ${p.moods.join(", ")}.` : "",
    p.cuisine && p.cuisine !== "Any" ? `Cuisine lean: ${p.cuisine}.` : "",
    t.excluded?.length ? `NEVER use these ingredients: ${t.excluded.join(", ")}.` : "",
    t.dislikes?.length ? `NEVER suggest these dishes (the user disliked them): ${t.dislikes.join("; ")}.` : "",
    t.likes?.length ? `The user LIKES dishes like: ${t.likes.join("; ")} — offer things in that spirit.` : "",
  ].filter(Boolean).join(" ");

  const content: Anthropic.MessageParam["content"] = [];
  if (image) {
    const m = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1] as any, data: m[2] } });
  }

  const haveLine = (image ? "Identify the food items in this fridge/pantry photo. " : "") + (ingredients ? `They also have: ${ingredients}. ` : "");

  let toolSchema: any, instruction: string;
  if (mode === "now") {
    instruction = `${haveLine}Give the user ${4} DIFFERENT options for ONE meal they can make RIGHT NOW — fast, mostly from what they have. Make the options genuinely varied (different styles), so they can choose. ${rules} Prioritize speed and minimal missing items.`;
    toolSchema = { type: "object", properties: { detected: { type: "array", items: { type: "string" } }, options: { type: "array", items: meal, description: "4 distinct meal options to choose from" } }, required: ["detected", "options"] };
  } else {
    instruction = `${haveLine}Plan ${p.days ?? 5} days of dinner for ${p.people ?? 2} people. For EACH day, give ${3} OPTIONS to choose from (varied), mostly using what they have. ${rules}`;
    toolSchema = { type: "object", properties: { detected: { type: "array", items: { type: "string" } }, days: { type: "array", items: { type: "object", properties: { day: { type: "string" }, options: { type: "array", items: meal, description: "3 options for this day" } }, required: ["day", "options"] } } }, required: ["detected", "days"] };
  }
  content.push({ type: "text", text: instruction });

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4500,
    tools: [{ name: "suggest", description: "Suggest meal OPTIONS for the user to choose from.", input_schema: toolSchema }],
    tool_choice: { type: "tool", name: "suggest" },
    messages: [{ role: "user", content }],
  });

  const tool = res.content.find((b) => b.type === "tool_use") as { input?: Record<string, unknown> } | undefined;
  if (!tool?.input) return NextResponse.json({ error: "Couldn't come up with options — try a clearer photo." }, { status: 500 });
  return NextResponse.json({ result: tool.input });
}
