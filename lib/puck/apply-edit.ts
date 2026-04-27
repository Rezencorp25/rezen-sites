import type { Data as PuckDataType } from "@measured/puck";
import type { AIEdit } from "@/types";

type PuckItem = PuckDataType["content"][number];

/**
 * Apply an AIEdit to Puck data, returning a new PuckData.
 * Does not mutate input. Safe for stub + real AI outputs.
 */
export function applyAIEdit(data: PuckDataType, edit: AIEdit): PuckDataType {
  const content = [...data.content];
  const findIndex = (id: string) =>
    content.findIndex((c) => (c.props as { id?: string }).id === id);

  switch (edit.type) {
    case "modify": {
      const idx = findIndex(edit.targetId);
      if (idx < 0) return data;
      const prev = content[idx];
      content[idx] = {
        ...prev,
        props: { ...prev.props, ...edit.newProps },
      } as PuckItem;
      return { ...data, content };
    }
    case "replace": {
      const idx = findIndex(edit.targetId);
      if (idx < 0) return data;
      content[idx] = edit.component as PuckItem;
      return { ...data, content };
    }
    case "insert": {
      const items = edit.components as PuckItem[];
      if (edit.afterId === null) {
        return { ...data, content: [...items, ...content] };
      }
      const idx = findIndex(edit.afterId);
      if (idx < 0) return { ...data, content: [...content, ...items] };
      const next = [...content];
      next.splice(idx + 1, 0, ...items);
      return { ...data, content: next };
    }
    case "delete": {
      const idx = findIndex(edit.targetId);
      if (idx < 0) return data;
      const next = [...content];
      next.splice(idx, 1);
      return { ...data, content: next };
    }
    case "full_replace": {
      return edit.root as PuckDataType;
    }
    default:
      return data;
  }
}
