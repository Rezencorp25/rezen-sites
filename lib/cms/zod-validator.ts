import { z, type ZodTypeAny } from "zod";
import type { CMSField, CMSItemFieldData } from "@/types";

function applyText(s: z.ZodString, f: CMSField): ZodTypeAny {
  let r: z.ZodString = s;
  if (f.validation?.minLength != null) r = r.min(f.validation.minLength);
  if (f.validation?.maxLength != null) r = r.max(f.validation.maxLength);
  if (f.validation?.pattern) r = r.regex(new RegExp(f.validation.pattern));
  return f.required ? r : r.optional().or(z.literal(""));
}

function applyNumber(n: z.ZodNumber, f: CMSField): ZodTypeAny {
  let r: z.ZodNumber = n;
  if (f.validation?.min != null) r = r.min(f.validation.min);
  if (f.validation?.max != null) r = r.max(f.validation.max);
  return f.required ? r : r.optional();
}

function nullable<T extends ZodTypeAny>(schema: T, required: boolean): ZodTypeAny {
  return required ? schema : schema.nullable().optional();
}

function imageRefSchema() {
  return z.object({
    fileId: z.string(),
    url: z.string().url(),
    alt: z.string().optional(),
  });
}

function fileRefSchema() {
  return z.object({
    fileId: z.string(),
    url: z.string().url(),
    name: z.string().optional(),
  });
}

export function fieldSchema(field: CMSField): ZodTypeAny {
  switch (field.type) {
    case "plain-text":
      return applyText(z.string(), field);
    case "rich-text":
      return applyText(z.string(), field);
    case "image":
      return nullable(imageRefSchema(), field.required);
    case "multi-image":
      return z.array(imageRefSchema()).default([]);
    case "video-link":
    case "link":
      return field.required
        ? z.string().url()
        : z.string().url().or(z.literal("")).optional();
    case "email":
      return field.required
        ? z.string().email()
        : z.string().email().or(z.literal("")).optional();
    case "phone":
      return applyText(z.string(), field);
    case "number":
      return applyNumber(z.number(), field);
    case "datetime":
      // Accetta sia date-only ("2026-04-10") che datetime ISO completo o Date object.
      return nullable(
        z.union([
          z.string().regex(
            /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/,
            "Formato data non valido",
          ),
          z.date(),
        ]),
        field.required,
      );
    case "switch":
      return z.boolean().default(false);
    case "color":
      return applyText(
        z.string().regex(
          /^(#[0-9a-f]{3,8}|rgb|rgba|hsl|hsla|[a-z]+).*/i,
          "Colore non valido",
        ),
        field,
      );
    case "option": {
      const choices = field.optionChoices?.map((c) => c.id) ?? [];
      if (choices.length === 0) return z.string().optional();
      const values = choices as [string, ...string[]];
      const e = z.enum(values);
      return field.required ? e : e.optional();
    }
    case "file":
      return nullable(fileRefSchema(), field.required);
    case "reference":
      return nullable(z.string(), field.required);
    case "multi-reference":
      return z.array(z.string()).default([]);
  }
}

export function buildItemSchema(fields: CMSField[]) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const f of fields) shape[f.id] = fieldSchema(f);
  return z.object(shape);
}

export function validateItemData(
  fields: CMSField[],
  data: CMSItemFieldData,
): { ok: true; data: CMSItemFieldData } | { ok: false; errors: ZodIssue[] } {
  const schema = buildItemSchema(fields);
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, data: r.data as CMSItemFieldData };
  return { ok: false, errors: r.error.issues };
}

export type ZodIssue = z.ZodIssue;
