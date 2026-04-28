"use client";

import * as LucideIcons from "lucide-react";
import type { ComponentConfig } from "@measured/puck";
import { cn } from "@/lib/utils";

type IconName = keyof typeof LucideIcons;

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Cmp = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!Cmp) return null;
  return <Cmp className={className} />;
}

// ───────────────────────── Hero ─────────────────────────
export type HeroProps = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  backgroundImage: string;
  alignment: "left" | "center" | "right";
};

export const Hero: ComponentConfig<HeroProps> = {
  label: "Hero",
  fields: {
    title: { type: "text", label: "Titolo" },
    subtitle: { type: "textarea", label: "Sottotitolo" },
    ctaText: { type: "text", label: "Testo CTA" },
    ctaHref: { type: "text", label: "Link CTA" },
    backgroundImage: { type: "text", label: "Immagine sfondo (URL)" },
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
    title: "Titolo ad effetto",
    subtitle: "Descrizione breve che spiega il valore della pagina.",
    ctaText: "Inizia ora",
    ctaHref: "#",
    backgroundImage: "/mock-images/hero-gradient.svg",
    alignment: "left",
  },
  render: ({ title, subtitle, ctaText, ctaHref, backgroundImage, alignment }) => (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl px-10 py-20 text-on-surface",
        alignment === "center" && "text-center",
        alignment === "right" && "text-right",
      )}
      style={{
        background: `linear-gradient(135deg, rgba(18,18,29,0.6), rgba(41,41,53,0.4)), url(${backgroundImage}) center/cover`,
      }}
    >
      <div className={cn("mx-auto max-w-3xl flex flex-col gap-4", alignment === "center" && "items-center")}>
        <h1 className="text-display-sm font-bold">{title}</h1>
        <p className="text-body-lg text-secondary-text">{subtitle}</p>
        <div className={cn("mt-2", alignment === "center" && "mx-auto")}>
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-body-md font-semibold text-on-molten"
            style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  ),
};

// ───────────────────────── Section (wrapper) ─────────────────────────
export type SectionProps = {
  padding: "small" | "medium" | "large";
  background: "surface" | "container-low" | "container-high" | "transparent";
  maxWidth: "container" | "narrow" | "full";
};

export const Section: ComponentConfig<SectionProps> = {
  label: "Section",
  fields: {
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
    background: {
      type: "select",
      label: "Sfondo",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Container low", value: "container-low" },
        { label: "Container high", value: "container-high" },
        { label: "Trasparente", value: "transparent" },
      ],
    },
    maxWidth: {
      type: "select",
      label: "Max width",
      options: [
        { label: "Container (1280)", value: "container" },
        { label: "Narrow (768)", value: "narrow" },
        { label: "Full", value: "full" },
      ],
    },
  },
  defaultProps: { padding: "large", background: "surface", maxWidth: "container" },
  render: ({ padding, background, maxWidth }) => {
    const bgClass = {
      surface: "bg-surface",
      "container-low": "bg-surface-container-low",
      "container-high": "bg-surface-container-high",
      transparent: "bg-transparent",
    }[background];
    const padClass = { small: "py-8", medium: "py-14", large: "py-20" }[padding];
    const widthClass = { container: "max-w-7xl", narrow: "max-w-3xl", full: "max-w-none" }[maxWidth];
    return (
      <div className={cn(bgClass, padClass)}>
        <div className={cn("mx-auto px-10", widthClass)}>
          <div className="h-px w-full bg-outline-variant/25" />
        </div>
      </div>
    );
  },
};

// ───────────────────────── Heading ─────────────────────────
export type HeadingProps = {
  text: string;
  level: "h1" | "h2" | "h3" | "h4";
  alignment: "left" | "center" | "right";
  color: "on-surface" | "secondary-text" | "molten-primary";
};

export const Heading: ComponentConfig<HeadingProps> = {
  label: "Heading",
  fields: {
    text: { type: "text", label: "Testo" },
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
    color: {
      type: "select",
      label: "Colore",
      options: [
        { label: "On surface", value: "on-surface" },
        { label: "Secondary", value: "secondary-text" },
        { label: "Molten", value: "molten-primary" },
      ],
    },
  },
  defaultProps: { text: "Heading", level: "h2", alignment: "left", color: "on-surface" },
  render: ({ text, level, alignment, color }) => {
    const Tag = level as keyof React.JSX.IntrinsicElements;
    const sizeClass = {
      h1: "text-display-sm",
      h2: "text-headline-lg",
      h3: "text-headline-md",
      h4: "text-title-lg",
    }[level];
    const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[alignment];
    return (
      <div className="mx-auto max-w-7xl px-10 py-4">
        <Tag className={cn(sizeClass, alignClass, `text-${color}`, "font-bold")}>{text}</Tag>
      </div>
    );
  },
};

// ───────────────────────── Paragraph ─────────────────────────
export type ParagraphProps = {
  text: string;
  alignment: "left" | "center" | "right";
  size: "sm" | "md" | "lg";
};

export const Paragraph: ComponentConfig<ParagraphProps> = {
  label: "Paragraph",
  fields: {
    text: { type: "textarea", label: "Testo" },
    alignment: {
      type: "select",
      label: "Allineamento",
      options: [
        { label: "Sinistra", value: "left" },
        { label: "Centro", value: "center" },
        { label: "Destra", value: "right" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  defaultProps: { text: "Paragrafo di esempio.", alignment: "left", size: "md" },
  render: ({ text, alignment, size }) => {
    const sizeClass = { sm: "text-body-sm", md: "text-body-md", lg: "text-body-lg" }[size];
    const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[alignment];
    return (
      <div className="mx-auto max-w-3xl px-10 py-3">
        <p className={cn(sizeClass, alignClass, "text-secondary-text")}>{text}</p>
      </div>
    );
  },
};

// ───────────────────────── Image ─────────────────────────
export type ImageBlockProps = {
  src: string;
  alt: string;
  aspectRatio: "16/9" | "4/3" | "1/1" | "auto";
  fit: "cover" | "contain";
};

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  label: "Image",
  fields: {
    src: { type: "text", label: "URL immagine" },
    alt: { type: "text", label: "Testo alternativo" },
    aspectRatio: {
      type: "select",
      label: "Aspect ratio",
      options: [
        { label: "16 / 9", value: "16/9" },
        { label: "4 / 3", value: "4/3" },
        { label: "1 / 1", value: "1/1" },
        { label: "Auto", value: "auto" },
      ],
    },
    fit: {
      type: "select",
      label: "Fit",
      options: [
        { label: "Cover", value: "cover" },
        { label: "Contain", value: "contain" },
      ],
    },
  },
  defaultProps: { src: "/mock-images/hero-gradient.svg", alt: "Immagine", aspectRatio: "16/9", fit: "cover" },
  render: ({ src, alt, aspectRatio, fit }) => {
    const altMissing = !alt || !String(alt).trim();
    return (
      <div className="mx-auto max-w-7xl px-10 py-6">
        <div
          className="relative overflow-hidden rounded-xl bg-surface-container-low"
          style={{ aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            className="h-full w-full"
            style={{ objectFit: fit }}
          />
          {altMissing && (
            <span
              className="pointer-events-none absolute right-2 top-2 rounded-md bg-error px-2 py-0.5 text-label-sm font-bold uppercase tracking-wider text-on-surface"
              title="Alt mancante: bloccante per accessibilità (WCAG) e SEO immagini"
            >
              Alt mancante
            </span>
          )}
        </div>
      </div>
    );
  },
};

// ───────────────────────── Button ─────────────────────────
export type ButtonProps = {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "ghost";
  size: "sm" | "md" | "lg";
};

export const ButtonBlock: ComponentConfig<ButtonProps> = {
  label: "Button",
  fields: {
    text: { type: "text", label: "Testo" },
    href: { type: "text", label: "Link" },
    variant: {
      type: "select",
      label: "Variante",
      options: [
        { label: "Primary (gradient)", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  defaultProps: { text: "Call to action", href: "#", variant: "primary", size: "md" },
  render: ({ text, href, variant, size }) => {
    const sizeClass = { sm: "px-4 py-2 text-body-sm", md: "px-6 py-3 text-body-md", lg: "px-8 py-4 text-body-lg" }[size];
    return (
      <div className="mx-auto max-w-7xl px-10 py-4">
        <a
          href={href}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl font-semibold transition-all",
            sizeClass,
            variant === "primary" && "text-on-molten",
            variant === "secondary" && "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
            variant === "ghost" && "text-on-surface hover:bg-surface-container-high",
          )}
          style={variant === "primary" ? { background: "linear-gradient(135deg,#ffb599,#f56117)" } : undefined}
        >
          {text}
        </a>
      </div>
    );
  },
};

// ───────────────────────── Grid ─────────────────────────
export type GridProps = {
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  items: Array<{ title: string; description: string }>;
};

export const Grid: ComponentConfig<GridProps> = {
  label: "Grid",
  fields: {
    columns: {
      type: "select",
      label: "Colonne",
      options: [
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    items: {
      type: "array",
      label: "Elementi",
      arrayFields: {
        title: { type: "text", label: "Titolo" },
        description: { type: "textarea", label: "Descrizione" },
      },
      defaultItemProps: { title: "Elemento", description: "Descrizione breve." },
    },
  },
  defaultProps: {
    columns: 3,
    gap: "md",
    items: [
      { title: "Primo", description: "Descrizione del primo elemento." },
      { title: "Secondo", description: "Descrizione del secondo elemento." },
      { title: "Terzo", description: "Descrizione del terzo elemento." },
    ],
  },
  render: ({ columns, gap, items }) => {
    const gapClass = { sm: "gap-3", md: "gap-5", lg: "gap-8" }[gap];
    const colClass = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns];
    return (
      <div className="mx-auto max-w-7xl px-10 py-10">
        <div className={cn("grid grid-cols-1", colClass, gapClass)}>
          {items.map((it, i) => (
            <div key={i} className="rounded-xl bg-surface-container-high p-6">
              <h3 className="mb-2 text-title-md font-semibold text-on-surface">{it.title}</h3>
              <p className="text-body-sm text-secondary-text">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ───────────────────────── CTA ─────────────────────────
export type CTAProps = {
  headline: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  style: "gradient" | "outline" | "minimal";
};

export const CTA: ComponentConfig<CTAProps> = {
  label: "CTA",
  fields: {
    headline: { type: "text", label: "Headline" },
    description: { type: "textarea", label: "Descrizione" },
    buttonText: { type: "text", label: "Testo bottone" },
    buttonHref: { type: "text", label: "Link" },
    style: {
      type: "select",
      label: "Stile",
      options: [
        { label: "Gradient", value: "gradient" },
        { label: "Outline", value: "outline" },
        { label: "Minimal", value: "minimal" },
      ],
    },
  },
  defaultProps: {
    headline: "Pronto a iniziare?",
    description: "Prenota una demo gratuita di 15 minuti.",
    buttonText: "Prenota demo",
    buttonHref: "#",
    style: "gradient",
  },
  render: ({ headline, description, buttonText, buttonHref, style }) => (
    <div className="mx-auto max-w-7xl px-10 py-12">
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl px-10 py-14 text-center",
          style === "gradient" && "text-on-molten",
          style === "outline" && "border border-outline-variant bg-surface-container-low text-on-surface",
          style === "minimal" && "bg-surface-container-low text-on-surface",
        )}
        style={style === "gradient" ? { background: "linear-gradient(135deg,#ffb599,#f56117)" } : undefined}
      >
        <h2 className="text-headline-lg font-bold">{headline}</h2>
        <p className={cn("max-w-2xl text-body-lg", style === "gradient" ? "text-on-molten/90" : "text-secondary-text")}>
          {description}
        </p>
        <a
          href={buttonHref}
          className={cn(
            "mt-2 rounded-xl px-6 py-3 text-body-md font-semibold",
            style === "gradient" && "bg-on-molten text-molten-primary-container",
            style !== "gradient" && "text-on-molten",
          )}
          style={style !== "gradient" ? { background: "linear-gradient(135deg,#ffb599,#f56117)" } : undefined}
        >
          {buttonText}
        </a>
      </div>
    </div>
  ),
};

// ───────────────────────── FeatureList ─────────────────────────
export type FeatureListProps = {
  items: Array<{ icon: string; title: string; description: string }>;
  layout: "grid" | "stack";
};

export const FeatureList: ComponentConfig<FeatureListProps> = {
  label: "Feature List",
  fields: {
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Stack", value: "stack" },
      ],
    },
    items: {
      type: "array",
      label: "Feature",
      arrayFields: {
        icon: { type: "text", label: "Icona (lucide)" },
        title: { type: "text", label: "Titolo" },
        description: { type: "textarea", label: "Descrizione" },
      },
      defaultItemProps: { icon: "Sparkles", title: "Feature", description: "Descrivi la feature." },
    },
  },
  defaultProps: {
    layout: "grid",
    items: [
      { icon: "Rocket", title: "Veloce", description: "Performance di primo livello." },
      { icon: "ShieldCheck", title: "Sicuro", description: "Security by default." },
      { icon: "Sparkles", title: "AI-first", description: "Orchestrato con Claude." },
    ],
  },
  render: ({ items, layout }) => (
    <div className="mx-auto max-w-7xl px-10 py-12">
      <div className={cn("grid gap-5", layout === "grid" ? "md:grid-cols-3" : "grid-cols-1")}>
        {items.map((it, i) => (
          <div key={i} className="rounded-xl bg-surface-container-high p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-lowest">
              <Icon name={it.icon} className="h-5 w-5 text-molten-primary" />
            </div>
            <h3 className="mb-1 text-title-md font-semibold text-on-surface">{it.title}</h3>
            <p className="text-body-sm text-secondary-text">{it.description}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ───────────────────────── PricingCard ─────────────────────────
export type PricingCardProps = {
  name: string;
  price: string;
  period: string;
  features: Array<{ label: string }>;
  ctaText: string;
  ctaHref: string;
  featured: boolean;
};

export const PricingCard: ComponentConfig<PricingCardProps> = {
  label: "Pricing Card",
  fields: {
    name: { type: "text", label: "Nome piano" },
    price: { type: "text", label: "Prezzo" },
    period: { type: "text", label: "Periodo" },
    features: {
      type: "array",
      label: "Features",
      arrayFields: { label: { type: "text", label: "Label" } },
      defaultItemProps: { label: "Feature inclusa" },
    },
    ctaText: { type: "text", label: "CTA" },
    ctaHref: { type: "text", label: "Link CTA" },
    featured: { type: "radio", label: "In evidenza", options: [{ label: "Sì", value: true }, { label: "No", value: false }] },
  },
  defaultProps: {
    name: "Pro",
    price: "CHF 49",
    period: "/mese",
    features: [{ label: "Tutto di Starter" }, { label: "AI illimitata" }, { label: "Priority support" }],
    ctaText: "Scegli Pro",
    ctaHref: "#",
    featured: true,
  },
  render: ({ name, price, period, features, ctaText, ctaHref, featured }) => (
    <div className="mx-auto max-w-md px-6 py-6">
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl p-8",
          featured ? "bg-surface-container-high ring-2 ring-molten-primary" : "bg-surface-container-high",
        )}
      >
        <div>
          <p className="text-label-md uppercase tracking-widest text-text-muted">{name}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-display-sm font-bold text-on-surface">{price}</span>
            <span className="text-body-md text-text-muted">{period}</span>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-body-sm text-secondary-text">
              <Icon name="Check" className="h-4 w-4 text-molten-primary" />
              {f.label}
            </li>
          ))}
        </ul>
        <a
          href={ctaHref}
          className="mt-2 rounded-xl px-6 py-3 text-center text-body-md font-semibold text-on-molten"
          style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
        >
          {ctaText}
        </a>
      </div>
    </div>
  ),
};

// ───────────────────────── Testimonial ─────────────────────────
export type TestimonialProps = {
  quote: string;
  author: string;
  role: string;
  avatar: string;
};

export const Testimonial: ComponentConfig<TestimonialProps> = {
  label: "Testimonial",
  fields: {
    quote: { type: "textarea", label: "Citazione" },
    author: { type: "text", label: "Autore" },
    role: { type: "text", label: "Ruolo" },
    avatar: { type: "text", label: "Avatar URL" },
  },
  defaultProps: {
    quote: "Ha cambiato il modo in cui rilasciamo siti. Velocità e qualità senza compromessi.",
    author: "Mario Rossi",
    role: "CEO, Azienda SRL",
    avatar: "/mock-images/thumb-bio.svg",
  },
  render: ({ quote, author, role, avatar }) => (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="rounded-2xl bg-surface-container-high p-8">
        <Icon name="Quote" className="mb-4 h-6 w-6 text-molten-primary" />
        <p className="mb-6 text-body-lg text-on-surface">&ldquo;{quote}&rdquo;</p>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={author} className="h-10 w-10 rounded-full bg-surface-container-lowest" />
          <div>
            <p className="text-body-md font-semibold text-on-surface">{author}</p>
            <p className="text-body-sm text-text-muted">{role}</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ───────────────────────── FAQ ─────────────────────────
export type FAQProps = {
  items: Array<{ question: string; answer: string }>;
};

export const FAQ: ComponentConfig<FAQProps> = {
  label: "FAQ",
  fields: {
    items: {
      type: "array",
      label: "Domande",
      arrayFields: {
        question: { type: "text", label: "Domanda" },
        answer: { type: "textarea", label: "Risposta" },
      },
      defaultItemProps: { question: "Domanda?", answer: "Risposta." },
    },
  },
  defaultProps: {
    items: [
      { question: "Quanto costa?", answer: "Dipende dal piano scelto. Vedi la pagina prezzi." },
      { question: "Posso disdire in qualsiasi momento?", answer: "Sì, nessun vincolo di durata." },
    ],
  },
  render: ({ items }) => (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <details key={i} className="rounded-xl bg-surface-container-high p-5">
            <summary className="cursor-pointer text-body-md font-semibold text-on-surface">{it.question}</summary>
            <p className="mt-3 text-body-sm text-secondary-text">{it.answer}</p>
          </details>
        ))}
      </div>
    </div>
  ),
};

// ───────────────────────── ContactForm ─────────────────────────
export type ContactFormFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "checkbox"
  | "url"
  | "number";

export type ContactFormField = {
  /** Internal name (no spaces) */
  value: string;
  /** Visible label */
  label?: string;
  /** Field type */
  fieldType?: ContactFormFieldType;
  /** Required toggle */
  required?: boolean;
  /** Placeholder/example */
  placeholder?: string;
  /** For select: comma-separated options */
  options?: string;
};

export type ContactFormProps = {
  title: string;
  fields: ContactFormField[];
  submitText: string;
  /** Honeypot: bot-trap hidden field */
  honeypot: boolean;
  /** Show reCAPTCHA v3 placeholder (configured at deploy time) */
  recaptcha: "off" | "v3" | "hcaptcha" | "turnstile";
  /** Submit-rate hint shown to user when blocked */
  rateLimit: "off" | "soft" | "strict";
  /** Webhook URL for CRM/Slack/Zapier */
  webhookUrl: string;
  /** Native CRM connector */
  crm: "none" | "hubspot" | "pipedrive" | "salesforce" | "mailchimp";
  /** Email notification recipient */
  notifyEmail: string;
  /** Confirmation message after submit */
  successMessage: string;
  /** Auto-reply confirmation email to user */
  autoReplyEnabled: boolean;
  autoReplySubject: string;
  autoReplyBody: string;
  /** Nurture sequence: comma-separated days from submission, e.g. "1,3,7,14" */
  followupDays: string;
};

export const ContactForm: ComponentConfig<ContactFormProps> = {
  label: "Contact Form",
  fields: {
    title: { type: "text", label: "Titolo" },
    submitText: { type: "text", label: "Testo bottone" },
    successMessage: { type: "text", label: "Messaggio di conferma" },
    fields: {
      type: "array",
      label: "Campi",
      arrayFields: {
        value: { type: "text", label: "Nome interno (no spazi)" },
        label: { type: "text", label: "Label visibile" },
        fieldType: {
          type: "select",
          label: "Tipo",
          options: [
            { label: "Testo", value: "text" },
            { label: "Email", value: "email" },
            { label: "Telefono", value: "tel" },
            { label: "Textarea", value: "textarea" },
            { label: "Select", value: "select" },
            { label: "Checkbox", value: "checkbox" },
            { label: "URL", value: "url" },
            { label: "Numero", value: "number" },
          ],
        },
        required: {
          type: "radio",
          label: "Required",
          options: [
            { label: "Sì", value: true },
            { label: "No", value: false },
          ],
        },
        placeholder: { type: "text", label: "Placeholder" },
        options: {
          type: "text",
          label: "Opzioni (solo select, separate da ,)",
        },
      },
      defaultItemProps: {
        value: "nuovo_campo",
        label: "Nuovo campo",
        fieldType: "text",
        required: false,
        placeholder: "",
        options: "",
      },
      getItemSummary: (item) =>
        `${item?.label ?? item?.value ?? "campo"}${item?.required ? " *" : ""}`,
    },
    honeypot: {
      type: "radio",
      label: "Honeypot anti-bot",
      options: [
        { label: "Sì (hidden field, raccomandato)", value: true },
        { label: "No", value: false },
      ],
    },
    recaptcha: {
      type: "select",
      label: "CAPTCHA",
      options: [
        { label: "Nessuno", value: "off" },
        { label: "Google reCAPTCHA v3", value: "v3" },
        { label: "hCaptcha", value: "hcaptcha" },
        { label: "Cloudflare Turnstile", value: "turnstile" },
      ],
    },
    rateLimit: {
      type: "select",
      label: "Rate limit",
      options: [
        { label: "Off", value: "off" },
        { label: "Soft (3/min/IP)", value: "soft" },
        { label: "Strict (1/min/IP)", value: "strict" },
      ],
    },
    webhookUrl: { type: "text", label: "Webhook URL (Zapier/Make/Slack)" },
    crm: {
      type: "select",
      label: "CRM connector",
      options: [
        { label: "Nessuno", value: "none" },
        { label: "HubSpot", value: "hubspot" },
        { label: "Pipedrive", value: "pipedrive" },
        { label: "Salesforce", value: "salesforce" },
        { label: "Mailchimp", value: "mailchimp" },
      ],
    },
    notifyEmail: { type: "text", label: "Email per notifica submission" },
    autoReplyEnabled: {
      type: "radio",
      label: "Auto-reply al lead",
      options: [
        { label: "Sì", value: true },
        { label: "No", value: false },
      ],
    },
    autoReplySubject: {
      type: "text",
      label: "Oggetto auto-reply",
    },
    autoReplyBody: {
      type: "textarea",
      label: "Testo auto-reply (placeholders: {{name}})",
    },
    followupDays: {
      type: "text",
      label: "Sequenza nurture (giorni separati da virgola, es. 3,7,14)",
    },
  },
  defaultProps: {
    title: "Scrivici",
    submitText: "Invia",
    successMessage: "Grazie! Ti ricontattiamo entro 24h.",
    fields: [
      {
        value: "name",
        label: "Nome",
        fieldType: "text",
        required: true,
        placeholder: "Mario Rossi",
        options: "",
      },
      {
        value: "email",
        label: "Email",
        fieldType: "email",
        required: true,
        placeholder: "tuo@email.it",
        options: "",
      },
      {
        value: "message",
        label: "Messaggio",
        fieldType: "textarea",
        required: false,
        placeholder: "Come possiamo aiutarti?",
        options: "",
      },
    ],
    honeypot: true,
    recaptcha: "off",
    rateLimit: "soft",
    webhookUrl: "",
    crm: "none",
    notifyEmail: "",
    autoReplyEnabled: true,
    autoReplySubject: "Grazie per averci scritto",
    autoReplyBody:
      "Ciao {{name}},\n\nabbiamo ricevuto il tuo messaggio. Ti rispondiamo entro 24h.\n\nA presto,\nIl team",
    followupDays: "3,7,14",
  },
  resolveData: ({ props }) => {
    // legacy mock templates may send string[]; normalize to ContactFormField[]
    const raw = props.fields as unknown;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      return {
        props: {
          ...props,
          fields: (raw as string[]).map((v) => ({
            value: v,
            label: v.charAt(0).toUpperCase() + v.slice(1),
            fieldType:
              v === "email"
                ? ("email" as const)
                : v === "message"
                  ? ("textarea" as const)
                  : ("text" as const),
            required: v === "name" || v === "email",
            placeholder: "",
            options: "",
          })),
        },
      };
    }
    return { props };
  },
  render: ({
    title,
    fields,
    submitText,
    honeypot,
    recaptcha,
    rateLimit,
    crm,
    webhookUrl,
    autoReplyEnabled,
    followupDays,
  }) => (
    <div className="mx-auto max-w-2xl px-10 py-10">
      <div className="rounded-2xl bg-surface-container-high p-8">
        <h3 className="mb-6 text-headline-md font-bold text-on-surface">{title}</h3>
        <form className="flex flex-col gap-4" data-rate-limit={rateLimit}>
          {fields.map((field) => {
            const f = field.value;
            const lbl = field.label || f;
            const ph = field.placeholder ?? "";
            const req = !!field.required;
            const ft = field.fieldType ?? "text";
            return (
              <div key={f} className="flex flex-col gap-1.5">
                <label className="text-label-md text-text-muted">
                  {lbl}
                  {req && <span className="ml-1 text-error">*</span>}
                </label>
                {ft === "textarea" ? (
                  <textarea
                    rows={4}
                    placeholder={ph}
                    required={req}
                    className="rounded-lg bg-surface-container-lowest px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-molten-primary"
                  />
                ) : ft === "select" ? (
                  <select
                    required={req}
                    className="rounded-lg bg-surface-container-lowest px-4 py-2.5 text-body-sm text-on-surface outline-none"
                  >
                    {(field.options ?? "")
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean)
                      .map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                  </select>
                ) : ft === "checkbox" ? (
                  <label className="flex items-center gap-2 text-body-sm text-on-surface">
                    <input type="checkbox" required={req} className="accent-molten-primary" />
                    {ph || lbl}
                  </label>
                ) : (
                  <input
                    type={ft}
                    placeholder={ph}
                    required={req}
                    className="rounded-lg bg-surface-container-lowest px-4 py-2.5 text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-molten-primary"
                  />
                )}
              </div>
            );
          })}
          {honeypot && (
            // Hidden bot trap (off-screen + aria-hidden + tabIndex -1)
            <div
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
            >
              <label>
                Lascia vuoto:
                <input
                  type="text"
                  name="rzn_hp_field"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
          )}
          {recaptcha !== "off" && (
            <div className="flex items-center gap-2 rounded-md bg-surface-container-lowest px-3 py-2 text-label-sm text-text-muted">
              <span className="rounded bg-success-container px-1.5 py-0.5 font-mono text-label-sm font-bold text-success">
                {recaptcha.toUpperCase()}
              </span>
              <span>
                Validazione automatica al submit (no UI utente). Configurare la
                site key al deploy.
              </span>
            </div>
          )}
          <button
            type="button"
            className="mt-2 rounded-xl px-6 py-3 text-body-md font-semibold text-on-molten"
            style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          >
            {submitText}
          </button>
          {(crm !== "none" || webhookUrl || autoReplyEnabled || followupDays) && (
            <div className="mt-1 flex flex-wrap items-center gap-1 text-label-sm text-text-muted">
              <span>Submission inviata a:</span>
              {crm !== "none" && (
                <span className="rounded bg-success-container px-1.5 py-0.5 font-mono text-success">
                  {crm}
                </span>
              )}
              {webhookUrl && (
                <span className="rounded bg-info-container px-1.5 py-0.5 font-mono text-info">
                  webhook
                </span>
              )}
              {autoReplyEnabled && (
                <span className="rounded bg-info-container px-1.5 py-0.5 font-mono text-info">
                  auto-reply
                </span>
              )}
              {followupDays && (
                <span className="rounded bg-warning-container px-1.5 py-0.5 font-mono text-warning">
                  nurture {followupDays}gg
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  ),
};

// ───────────────────────── Footer ─────────────────────────
export type FooterProps = {
  columns: Array<{ title: string; links: Array<{ label: string }> | string[] }>;
  copyright: string;
};

export const Footer: ComponentConfig<FooterProps> = {
  label: "Footer",
  fields: {
    copyright: { type: "text", label: "Copyright" },
    columns: {
      type: "array",
      label: "Colonne",
      arrayFields: {
        title: { type: "text", label: "Titolo colonna" },
        links: {
          type: "array",
          label: "Link",
          arrayFields: { label: { type: "text", label: "Label" } },
          defaultItemProps: { label: "Link" },
        },
      },
      defaultItemProps: { title: "Colonna", links: [{ label: "Link 1" }] },
    },
  },
  defaultProps: {
    copyright: "© 2026 REZEN Sites",
    columns: [
      { title: "Prodotto", links: [{ label: "Home" }, { label: "Prezzi" }] },
      { title: "Azienda", links: [{ label: "Contatti" }, { label: "Privacy" }] },
    ],
  },
  resolveData: ({ props }) => {
    const cols = (props.columns ?? []).map((c) => {
      const links = c.links as unknown;
      if (Array.isArray(links) && links.length > 0 && typeof links[0] === "string") {
        return { ...c, links: (links as string[]).map((l) => ({ label: l })) };
      }
      return c;
    });
    return { props: { ...props, columns: cols } };
  },
  render: ({ columns, copyright }) => (
    <footer className="bg-surface-container-lowest">
      <div className="mx-auto max-w-7xl px-10 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {columns.map((col, i) => (
            <div key={i}>
              <p className="mb-3 text-label-md uppercase tracking-widest text-text-muted">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {(col.links as Array<{ label: string }>).map((l, j) => (
                  <li key={j} className="text-body-sm text-secondary-text">
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-outline-variant/25 pt-6 text-body-sm text-text-muted">
          {copyright}
        </div>
      </div>
    </footer>
  ),
};

// ───────────────────────── MapEmbed ─────────────────────────
export type MapEmbedProps = {
  title: string;
  /** Address or place name; used as label on map */
  address: string;
  latitude: number;
  longitude: number;
  zoom: number;
  /** Optional caption shown below */
  caption: string;
};

export const MapEmbed: ComponentConfig<MapEmbedProps> = {
  label: "Map Embed",
  fields: {
    title: { type: "text", label: "Titolo (sopra mappa)" },
    address: { type: "text", label: "Indirizzo" },
    latitude: { type: "number", label: "Latitudine" },
    longitude: { type: "number", label: "Longitudine" },
    zoom: { type: "number", label: "Zoom (1-19)", min: 1, max: 19 },
    caption: { type: "text", label: "Caption (sotto mappa)" },
  },
  defaultProps: {
    title: "Trova le nostre sedi",
    address: "Lugano, Ticino, Svizzera",
    latitude: 46.0037,
    longitude: 8.951,
    zoom: 14,
    caption: "Apri in Google Maps per indicazioni stradali.",
  },
  render: ({ title, address, latitude, longitude, zoom, caption }) => {
    // OpenStreetMap embed — no API key required, privacy-friendly.
    // GEO snippet helper (C.22): paired with LocalBusiness schema, this
    // helps Google Local Pack visibility for "near me" queries.
    const bbox = [
      longitude - 0.01,
      latitude - 0.005,
      longitude + 0.01,
      latitude + 0.005,
    ].join("%2C");
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    return (
      <div className="mx-auto max-w-5xl px-10 py-10">
        {title && (
          <h2 className="mb-4 text-headline-sm font-bold text-on-surface">
            {title}
          </h2>
        )}
        <div className="overflow-hidden rounded-2xl border border-outline/30 bg-surface-container-lowest">
          <iframe
            title={`Mappa di ${address}`}
            src={src}
            style={{ width: "100%", height: 360, border: 0 }}
            data-zoom={zoom}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-body-sm text-secondary-text">
            <span className="font-mono text-label-sm text-text-muted">📍</span>{" "}
            {address}
          </p>
          <a
            href={gmapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-sm font-medium text-molten-primary hover:text-molten-accent-hover"
          >
            Apri in Google Maps →
          </a>
        </div>
        {caption && (
          <p className="mt-2 text-label-md text-text-muted">{caption}</p>
        )}
      </div>
    );
  },
};
