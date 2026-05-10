"use client";

import {
  useCmsBinding,
  compatibleFieldOptions,
  COMPATIBLE_FIELDS_FOR,
} from "./cms-binding";

/**
 * Custom Puck field per il binding Webflow-style "Get text from {Title}".
 * Renderizzato nel right-panel dell'editor Puck per i Bindable components.
 * Legge lo schema della collection tramite CmsBindingContext (settato dal preview wrapper).
 */
export function BindingPicker({
  value,
  onChange,
  semantic,
  label,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  semantic: keyof typeof COMPATIBLE_FIELDS_FOR;
  label: string;
}) {
  const ctx = useCmsBinding();
  const options = compatibleFieldOptions(ctx?.collection.fields, semantic);

  if (!ctx) {
    return (
      <div
        style={{
          padding: "8px 12px",
          fontSize: 12,
          color: "var(--puck-color-grey-04)",
          background: "var(--puck-color-grey-12)",
          borderRadius: 6,
        }}
      >
        Collection Page template required to bind a CMS field.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--puck-color-grey-05)",
        }}
      >
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{
          height: 32,
          padding: "0 8px",
          borderRadius: 6,
          border: "1px solid var(--puck-color-grey-09)",
          background: "var(--puck-color-white)",
          fontSize: 13,
        }}
      >
        <option value="">Static value</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {value && (
        <span style={{ fontSize: 11, color: "var(--puck-color-grey-05)" }}>
          Pesca da <strong>{value}</strong> dell&apos;item corrente
        </span>
      )}
    </div>
  );
}
