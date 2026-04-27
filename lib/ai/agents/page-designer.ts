import { getAnthropic, hasApiKey, MODELS } from "@/lib/ai/client";
import { heroLandingTemplate } from "@/lib/mocks/puck-templates";
import type { PuckData } from "@/types";

const SYSTEM = `You are Page Designer, a component-level web page architect.
You ONLY output valid JSON matching @measured/puck Data schema.
The allowed component types are: Hero, Section, Heading, Paragraph, Image, Button, Grid, CTA, FeatureList, PricingCard, Testimonial, FAQ, ContactForm, Footer.
Every content entry MUST have shape: { "type": "<Type>", "props": { "id": "<unique-id>", ...typedProps } }.
Output language: Italian copy.
Design style: dark UI, Luminous Engine (molten gradient CTAs).
Respond with raw JSON only — no markdown fences, no prose.`;

export type PageBrief = {
  goal: string;
  audience?: string;
  tone?: string;
  siteName?: string;
};

export async function generatePuckPage(brief: PageBrief): Promise<{
  data: PuckData;
  mode: "ai" | "stub";
}> {
  if (!hasApiKey()) {
    return { data: stubPage(brief), mode: "stub" };
  }
  const client = getAnthropic()!;
  const msg = await client.messages.create({
    model: MODELS.opus,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Genera una pagina per:\nObiettivo: ${brief.goal}\nAudience: ${brief.audience ?? "generale"}\nTono: ${brief.tone ?? "professionale"}\nNome sito: ${brief.siteName ?? "Sito"}`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const data = JSON.parse(text) as PuckData;
  return { data, mode: "ai" };
}

function stubPage(brief: PageBrief): PuckData {
  const siteName = brief.siteName?.trim() || "Il tuo progetto";
  const headline = composeHeadline(siteName, brief.goal);
  const subheadline = composeSubheadline(brief.goal, brief.audience);
  return heroLandingTemplate({
    siteName,
    headline,
    subheadline,
    ctaText: "Scopri di più",
    ctaHref: "#",
  });
}

/**
 * Turn a raw brief fragment into a proper hero headline.
 * Stub-only heuristic: capitalizes, trims, ensures a period-less sentence.
 */
function composeHeadline(siteName: string, goal: string): string {
  const clean = goal.trim().replace(/[.!?]+$/g, "");
  if (!clean) return `Benvenuti su ${siteName}`;
  const capitalized = clean[0].toUpperCase() + clean.slice(1);
  // If the goal is short (< 6 words) use a pattern "SiteName — Goal"
  const words = capitalized.split(/\s+/);
  if (words.length <= 4) return `${siteName} — ${capitalized}`;
  return capitalized;
}

function composeSubheadline(goal: string, audience?: string): string {
  const g = goal.trim().replace(/[.!?]+$/g, "");
  if (audience) {
    return `Pensato per ${audience}. ${g[0]?.toUpperCase() ?? ""}${g.slice(1)}.`;
  }
  if (g.length < 40) {
    return `Una presenza online curata: performance, SEO e contenuti allineati.`;
  }
  return `${g[0].toUpperCase()}${g.slice(1)}.`;
}
