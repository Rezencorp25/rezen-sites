import { getAnthropic, hasApiKey, MODELS } from "@/lib/ai/client";
import type { PuckData, AIEdit } from "@/types";

const SYSTEM = `You are Copywriter, an expert editorial agent for web pages.
Given the current page JSON (Puck Data) and an instruction, return ONE of these JSON shapes:
- {"type":"modify","targetId":"<id>","newProps":{...only-changed-props}}
- {"type":"replace","targetId":"<id>","component":{"type":"<Type>","props":{...}}}
- {"type":"insert","afterId":"<id-or-null>","components":[{"type":"<Type>","props":{...}}]}
- {"type":"delete","targetId":"<id>"}
Output raw JSON. No prose, no code fences.
Write copy in Italian unless instructed otherwise.`;

export async function editSection(args: {
  page: PuckData;
  selectedId: string | null;
  instruction: string;
}): Promise<{ edit: AIEdit; mode: "ai" | "stub" }> {
  if (!hasApiKey()) {
    return { edit: stubEdit(args), mode: "stub" };
  }
  const client = getAnthropic()!;
  const ctx = {
    selectedId: args.selectedId,
    content: args.page.content,
  };
  const msg = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Pagina:\n${JSON.stringify(ctx, null, 2)}\n\nIstruzione: ${args.instruction}`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const edit = JSON.parse(text) as AIEdit;
  return { edit, mode: "ai" };
}

function stubEdit(args: {
  page: PuckData;
  selectedId: string | null;
  instruction: string;
}): AIEdit {
  // Naive stub: if selectedId points to a component with a text-y prop, bump it.
  const target = args.selectedId
    ? args.page.content.find((c) => (c.props as { id?: string }).id === args.selectedId)
    : null;
  if (!target) {
    return {
      type: "insert",
      afterId: null,
      components: [
        {
          type: "Paragraph",
          props: {
            id: `para-${Date.now()}`,
            text: `[Stub AI] "${args.instruction}" — aggiungi ANTHROPIC_API_KEY per output reale.`,
            alignment: "left",
            size: "md",
          },
        },
      ],
    };
  }
  const props = target.props as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof props.title === "string") patch.title = `${props.title} · ${args.instruction}`;
  else if (typeof props.text === "string") patch.text = `${props.text} · ${args.instruction}`;
  else if (typeof props.headline === "string") patch.headline = `${props.headline} · ${args.instruction}`;
  else patch._stub = args.instruction;
  return {
    type: "modify",
    targetId: (props.id as string) ?? "",
    newProps: patch,
  };
}
