"use client";

import type { ComponentConfig } from "@measured/puck";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResolveBinding, useCmsBinding } from "./cms-binding";
import { BindingPicker } from "./binding-picker";
import { TiptapEditable } from "./tiptap-editable";

type Align = "left" | "center" | "right";
type Level = "h1" | "h2" | "h3" | "h4";

// ───────────────────────── BindableHeading ─────────────────────────

export type BindableHeadingProps = {
  text: string;
  bindingKey?: string;
  level: Level;
  alignment: Align;
};

function HeadingRender({
  text,
  bindingKey,
  level,
  alignment,
}: BindableHeadingProps) {
  const Tag = level as keyof React.JSX.IntrinsicElements;
  const ctx = useCmsBinding();
  const resolved = useResolveBinding<string>(bindingKey, text);
  const sizeClass = {
    h1: "text-display-sm",
    h2: "text-headline-lg",
    h3: "text-headline-md",
    h4: "text-title-lg",
  }[level];
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment];
  const isEditable = ctx?.editable && bindingKey;
  return (
    <div className="mx-auto max-w-7xl px-10 py-4">
      <Tag
        className={cn(
          sizeClass,
          alignClass,
          "font-bold text-on-surface",
          isEditable &&
            "rounded-md outline outline-1 outline-dashed outline-transparent transition-colors hover:outline-molten-primary/60 focus:outline-molten-primary",
        )}
        contentEditable={isEditable ? true : undefined}
        suppressContentEditableWarning
        onBlur={
          isEditable
            ? (e) => ctx.patch(bindingKey, e.currentTarget.textContent ?? "")
            : undefined
        }
      >
        {resolved}
      </Tag>
    </div>
  );
}

export const BindableHeading: ComponentConfig<BindableHeadingProps> = {
  label: "Heading (CMS)",
  fields: {
    text: { type: "text", label: "Static fallback" },
    bindingKey: {
      type: "custom",
      label: "Source",
      render: ({ value, onChange }) => (
        <BindingPicker
          value={value as string | undefined}
          onChange={onChange}
          semantic="text"
          label="Source"
        />
      ),
    },
    level: {
      type: "select",
      label: "Livello",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4", value: "h4" },
      ],
    },
    alignment: {
      type: "select",
      label: "Allineamento",
      options: [
        { label: "Sinistra", value: "left" },
        { label: "Centro", value: "center" },
        { label: "Destra", value: "right" },
      ],
    },
  },
  defaultProps: {
    text: "Heading",
    level: "h1",
    alignment: "left",
  },
  render: (props) => <HeadingRender {...props} />,
};

// ───────────────────────── BindableParagraph ─────────────────────────

export type BindableParagraphProps = {
  text: string;
  bindingKey?: string;
  alignment: Align;
};

function ParagraphRender({
  text,
  bindingKey,
  alignment,
}: BindableParagraphProps) {
  const ctx = useCmsBinding();
  const resolved = useResolveBinding<string>(bindingKey, text);
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment];
  const isEditable = ctx?.editable && bindingKey;

  // Decide se Tiptap (rich-text) o plain contentEditable.
  const targetField = ctx?.collection.fields.find((f) => f.id === bindingKey);
  const isRichText = targetField?.type === "rich-text";

  if (isEditable && isRichText) {
    return (
      <div
        className={cn(
          "mx-auto max-w-3xl px-10 py-3 text-body-md text-secondary-text",
          alignClass,
        )}
      >
        <TiptapEditable
          value={resolved}
          onChange={(html) => ctx.patch(bindingKey, html)}
          className="rounded-md outline-none ring-1 ring-transparent focus-within:ring-molten-primary/40"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-10 py-3">
      <p
        className={cn(
          "text-body-md text-secondary-text",
          alignClass,
          isEditable &&
            "rounded-md outline outline-1 outline-dashed outline-transparent transition-colors hover:outline-molten-primary/60 focus:outline-molten-primary",
        )}
        contentEditable={isEditable ? true : undefined}
        suppressContentEditableWarning
        onBlur={
          isEditable
            ? (e) => ctx.patch(bindingKey, e.currentTarget.textContent ?? "")
            : undefined
        }
      >
        {resolved}
      </p>
    </div>
  );
}

export const BindableParagraph: ComponentConfig<BindableParagraphProps> = {
  label: "Paragraph (CMS)",
  fields: {
    text: { type: "textarea", label: "Static fallback" },
    bindingKey: {
      type: "custom",
      label: "Source",
      render: ({ value, onChange }) => (
        <BindingPicker
          value={value as string | undefined}
          onChange={onChange}
          semantic="text"
          label="Source"
        />
      ),
    },
    alignment: {
      type: "select",
      label: "Allineamento",
      options: [
        { label: "Sinistra", value: "left" },
        { label: "Centro", value: "center" },
        { label: "Destra", value: "right" },
      ],
    },
  },
  defaultProps: {
    text: "Paragrafo bindable. Setta Source per pescare da un field della collection.",
    alignment: "left",
  },
  render: (props) => <ParagraphRender {...props} />,
};

// ───────────────────────── BindableImage ─────────────────────────

type ImageRefValue = { url?: string } | string | null | undefined;

function imageUrl(v: ImageRefValue, fallback: string): string {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.url === "string") return v.url;
  return fallback;
}

export type BindableImageProps = {
  src: string;
  bindingKey?: string;
  alt: string;
  aspectRatio: "16/9" | "4/3" | "1/1" | "auto";
};

function ImageRender({
  src,
  bindingKey,
  alt,
  aspectRatio,
}: BindableImageProps) {
  const ctx = useCmsBinding();
  const resolved = useResolveBinding<ImageRefValue>(bindingKey, src);
  const url = imageUrl(resolved, src);
  const isEditable = ctx?.editable && bindingKey;

  function replace() {
    const next = window.prompt(
      "URL immagine (S7.5 — upload Storage in arrivo)",
      url,
    );
    if (!next) return;
    ctx?.patch(bindingKey!, { fileId: `mock-${Date.now()}`, url: next });
  }

  return (
    <div className="mx-auto max-w-7xl px-10 py-4">
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-xl bg-cover bg-center",
        )}
        style={{
          backgroundImage: `url(${url})`,
          aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio,
        }}
        aria-label={alt}
        role="img"
      >
        {isEditable && (
          <button
            type="button"
            onClick={replace}
            className="absolute right-3 top-3 hidden items-center gap-1.5 rounded-lg bg-surface-container-highest px-3 py-1.5 text-label-md text-on-surface shadow-lg ring-1 ring-outline-variant/40 group-hover:flex"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Replace
          </button>
        )}
      </div>
    </div>
  );
}

export const BindableImage: ComponentConfig<BindableImageProps> = {
  label: "Image (CMS)",
  fields: {
    src: { type: "text", label: "Static fallback URL" },
    bindingKey: {
      type: "custom",
      label: "Source",
      render: ({ value, onChange }) => (
        <BindingPicker
          value={value as string | undefined}
          onChange={onChange}
          semantic="image"
          label="Source"
        />
      ),
    },
    alt: { type: "text", label: "Alt text" },
    aspectRatio: {
      type: "select",
      label: "Aspect ratio",
      options: [
        { label: "16/9", value: "16/9" },
        { label: "4/3", value: "4/3" },
        { label: "1/1", value: "1/1" },
        { label: "Auto", value: "auto" },
      ],
    },
  },
  defaultProps: {
    src: "/mock-images/placeholder.svg",
    alt: "",
    aspectRatio: "16/9",
  },
  render: (props) => <ImageRender {...props} />,
};

