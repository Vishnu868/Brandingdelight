import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminRoute } from "@/lib/admin-api";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5-5";

const SYSTEM = `You read one page of a supplier's product catalogue (an image) for an Indian corporate-gifting store and list every product on it.

Rules:
- Only use what is printed on the page. Never invent specs, prices, materials or capacities.
- One entry per distinct product. Colour variants of the same product shown together are one entry (mention the colours in features).
- name: the product's printed name, in normal title case (not ALL CAPS). Add the product type if the printed name is only a model word (e.g. "Trailblazer" -> "Trailblazer Backpack").
- code: the printed model / product / item code, exactly as printed, or "" if none.
- price: the printed selling price or MRP in rupees as a plain number (e.g. "Rs. 1,199/-" -> 1199). null if no price is printed for this product.
- description: one or two plain sentences based on the page text; "" if the page has no descriptive text.
- features: short bullet points copied or tightly paraphrased from the page (capacity, material, battery, what is included...), at most 8.
- category: pick the closest from the store categories given in the user message, or "" if none fits.
- photo: the bounding box of this product's main photo on the page as fractions of page width/height (0 to 1, x0 < x1, y0 < y1), tight around the product photo, excluding text blocks. null if the product has no photo of its own.
- If the page is a cover, index, contact page or lifestyle page with no product details, return an empty products list and say so in page_kind.`;

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["page_kind", "products"],
  properties: {
    page_kind: { type: "string", enum: ["products", "cover", "index", "contact", "lifestyle", "other"] },
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "brand", "code", "price", "description", "features", "category", "photo"],
        properties: {
          name: { type: "string" },
          brand: { type: "string" },
          code: { type: "string" },
          price: nullable({ type: "number" }),
          description: { type: "string" },
          features: { type: "array", items: { type: "string" } },
          category: { type: "string" },
          photo: nullable({
            type: "object",
            additionalProperties: false,
            required: ["x0", "y0", "x1", "y1"],
            properties: { x0: { type: "number" }, y0: { type: "number" }, x1: { type: "number" }, y1: { type: "number" } },
          }),
        },
      },
    },
  },
} as const;

/**
 * Admin-only: extracts the products on one catalogue page image with Claude.
 * The browser renders the PDF page and sends it here as a JPEG; nothing is saved until the admin reviews and publishes.
 */
export const POST = adminRoute(async (req) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "PDF import needs an Anthropic API key. Add ANTHROPIC_API_KEY to the environment variables (see SETUP.md)." }, { status: 501 });
  }
  const body = await req.json().catch(() => null);
  const image: unknown = body?.image;
  if (typeof image !== "string" || !image.startsWith("data:image/jpeg;base64,") || image.length > 6_000_000) {
    return NextResponse.json({ error: "Send the page as a JPEG data URL under 4 MB" }, { status: 400 });
  }
  const categories = Array.isArray(body?.categories) ? (body.categories as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 60) : [];
  const brandHint = typeof body?.brand === "string" ? body.brand.slice(0, 80) : "";

  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image.slice("data:image/jpeg;base64,".length) } },
          {
            type: "text",
            text: `Store categories: ${categories.join(" | ") || "(none given)"}\n${brandHint ? `Catalogue brand: ${brandHint} (use it as the brand unless the page prints a different one)` : "Brand: use the brand printed on the page, or \"\" if none."}\nList the products on this page.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "The model declined this page. Add its products manually." }, { status: 422 });
  }
  if (response.stop_reason === "max_tokens") {
    return NextResponse.json({ error: "This page has too many products to read in one go. Add them manually." }, { status: 422 });
  }
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Could not read this page. Try again." }, { status: 502 });
  }
});
