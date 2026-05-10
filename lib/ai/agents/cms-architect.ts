import { getAnthropic, hasApiKey, MODELS } from "@/lib/ai/client";
import type { CMSField } from "@/types";

const SYSTEM = `You are CMS Architect. Given a description, design a Webflow-style collection schema.
Output JSON: { "fields": [ { "id": "camelCase", "name": "Human", "type": "<one of: plain-text|rich-text|image|multi-image|video-link|link|email|phone|number|datetime|switch|color|option|file|reference|multi-reference>", "required": boolean } ] }
Always include "name" (plain-text, required) and "slug" (plain-text, required) as the first two fields.
Use "rich-text" only for long-form body content. Use "switch" for booleans (Webflow-style). Use "datetime" for dates.
Raw JSON, no fences.`;

export type SchemaBrief = { description: string };

export async function generateCMSchema(
  brief: SchemaBrief,
): Promise<{ fields: CMSField[]; mode: "ai" | "stub" }> {
  if (!hasApiKey()) {
    return { fields: stubFields(brief), mode: "stub" };
  }
  const client = getAnthropic()!;
  const msg = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: brief.description }],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const parsed = JSON.parse(text) as { fields: CMSField[] };
  return { fields: parsed.fields, mode: "ai" };
}

function stubFields(brief: SchemaBrief): CMSField[] {
  const q = brief.description.toLowerCase();
  const fields: CMSField[] = [
    { id: "name", name: "Name", type: "plain-text", required: true },
    { id: "slug", name: "Slug", type: "plain-text", required: true },
    { id: "excerpt", name: "Excerpt", type: "plain-text", required: false },
    { id: "body", name: "Body", type: "rich-text", required: true },
  ];
  if (/blog|articol|post|news/.test(q)) {
    fields.push(
      { id: "coverImage", name: "Cover Image", type: "image", required: false },
      {
        id: "publishedAt",
        name: "Published At",
        type: "datetime",
        required: true,
      },
      { id: "author", name: "Author", type: "plain-text", required: false },
    );
  }
  if (/prodott|shop|e-commerce|catalogo/.test(q)) {
    fields.push(
      { id: "price", name: "Price", type: "number", required: true },
      { id: "sku", name: "SKU", type: "plain-text", required: true },
      { id: "featured", name: "Featured", type: "switch", required: false },
    );
  }
  return fields;
}
