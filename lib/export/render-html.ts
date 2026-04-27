import type { PuckData, Page, Project } from "@/types";
import type { LocalBusinessSettings } from "@/lib/stores/settings-store";
import {
  articleSchema,
  organizationSchema,
  faqSchema,
  localBusinessSchema,
} from "@/lib/seo/schema-generator";

/**
 * Server-safe HTML renderer for Puck data. Maps each Luminous component
 * type to inline-styled HTML so the output is self-contained (no Tailwind
 * runtime required on the exported page).
 */
export type RenderOptions = {
  title: string;
  /** When provided, full SEO + schema.org head injection */
  page?: Page;
  project?: Project;
  localBusiness?: LocalBusinessSettings;
};

export function renderPuckToHtml(data: PuckData, opts: RenderOptions): string {
  const body = (data.content ?? []).map(renderItem).join("\n");
  const head = renderHead(data, opts);
  return `<!doctype html>
<html lang="it">
  <head>
${head}
    <style data-rezen-styles="true">
      :root {
        --bg: #12121d; --surface: #1d1d29; --surface-high: #292935;
        --surface-highest: #33333f; --surface-lowest: #16161f;
        --fg: #f3f2f0; --muted: #9594a2; --secondary: #c9c8cd;
        --outline: rgba(106,106,122,0.25);
        --molten-from: #ffb599; --molten-to: #f56117; --on-molten: #1a1a26;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
      a { color: inherit; text-decoration: none; }
      .section { padding: 80px 0; }
      .container { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
      .narrow { max-width: 768px; margin: 0 auto; padding: 0 40px; }
      .btn-molten { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
        background: linear-gradient(135deg, var(--molten-from), var(--molten-to));
        color: var(--on-molten); border-radius: 12px; font-weight: 600; }
      .card { background: var(--surface-high); border-radius: 16px; padding: 24px; }
      .muted { color: var(--muted); }
      .secondary { color: var(--secondary); }
      .hero { position: relative; border-radius: 16px; padding: 80px 40px; overflow: hidden; }
      .grid { display: grid; gap: 20px; }
      @media (min-width: 768px) {
        .grid.cols-2 { grid-template-columns: 1fr 1fr; }
        .grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid.cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
      }
      details { background: var(--surface-high); border-radius: 12px; padding: 16px; }
      details > summary { cursor: pointer; font-weight: 600; }
      form.contact { background: var(--surface-high); border-radius: 16px; padding: 32px; display: flex; flex-direction: column; gap: 16px; max-width: 640px; margin: 0 auto; }
      form.contact label { color: var(--muted); font-size: 12px; text-transform: capitalize; }
      form.contact input, form.contact textarea { background: var(--surface-lowest); color: var(--fg); border: 0; padding: 10px 14px; border-radius: 8px; font: inherit; }
      footer.site { background: var(--surface-lowest); padding: 48px 0; }
      footer.site .cols { display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      footer.site .copy { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--outline); color: var(--muted); font-size: 14px; }
    </style>
  </head>
  <body>
${body}
  </body>
</html>`;
}

function renderHead(data: PuckData, opts: RenderOptions): string {
  const lines: string[] = [
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
  ];

  const seo = opts.page?.seo;
  const project = opts.project;
  const title = seo?.metaTitle?.trim() || opts.title;
  lines.push(`    <title>${escapeHtml(title)}</title>`);

  if (seo?.metaDescription) {
    lines.push(`    <meta name="description" content="${escapeAttr(seo.metaDescription)}" />`);
  }

  // Robots meta — enforce indexable flag
  if (seo) {
    const directives = [
      seo.indexable ? "index" : "noindex",
      "follow",
    ];
    if (!seo.internalSearch) directives.push("nositelinkssearchbox");
    lines.push(`    <meta name="robots" content="${directives.join(", ")}" />`);
  }

  // Canonical
  const canonical =
    seo?.canonicalUrl ||
    (project && opts.page
      ? `https://${project.domain}/${opts.page.slug}`.replace(/\/+$/, "")
      : "");
  if (canonical) {
    lines.push(`    <link rel="canonical" href="${escapeAttr(canonical)}" />`);
  }

  // OpenGraph
  if (seo) {
    const ogTitle = seo.og?.title || title;
    const ogDesc = seo.og?.description || seo.metaDescription;
    lines.push(`    <meta property="og:type" content="website" />`);
    lines.push(`    <meta property="og:title" content="${escapeAttr(ogTitle)}" />`);
    if (ogDesc) lines.push(`    <meta property="og:description" content="${escapeAttr(ogDesc)}" />`);
    if (canonical) lines.push(`    <meta property="og:url" content="${escapeAttr(canonical)}" />`);
    if (seo.og?.image) {
      lines.push(`    <meta property="og:image" content="${escapeAttr(seo.og.image)}" />`);
      lines.push(`    <meta name="twitter:card" content="summary_large_image" />`);
    } else {
      lines.push(`    <meta name="twitter:card" content="summary" />`);
    }
    lines.push(`    <meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`);
    if (ogDesc) lines.push(`    <meta name="twitter:description" content="${escapeAttr(ogDesc)}" />`);
  }

  // JSON-LD schema.org auto-injection
  if (project && opts.page) {
    const schemas: Record<string, unknown>[] = [
      organizationSchema(project),
      articleSchema(project, opts.page),
    ];
    // Auto-detect FAQ blocks in puck content and append FAQPage schema
    const faqItems = extractFaqItems(data);
    if (faqItems.length > 0) schemas.push(faqSchema(faqItems));
    // LocalBusiness schema if enabled in settings
    if (opts.localBusiness?.enabled) {
      const lb = opts.localBusiness;
      schemas.push(
        localBusinessSchema({
          name: lb.legalName || project.name,
          url: `https://${project.domain}`,
          telephone: lb.telephone || undefined,
          priceRange: lb.priceRange || undefined,
          address: lb.streetAddress
            ? {
                streetAddress: lb.streetAddress,
                addressLocality: lb.addressLocality,
                postalCode: lb.postalCode,
                addressCountry: lb.addressCountry,
                addressRegion: lb.addressRegion || undefined,
              }
            : undefined,
          geo:
            lb.geoLat && lb.geoLng
              ? { latitude: lb.geoLat, longitude: lb.geoLng }
              : undefined,
          openingHours: lb.openingHours.length > 0 ? lb.openingHours : undefined,
          serviceArea: lb.serviceArea.length > 0 ? lb.serviceArea : undefined,
          sameAs: lb.sameAs.length > 0 ? lb.sameAs : undefined,
        }),
      );
    }
    for (const s of schemas) {
      lines.push(
        `    <script type="application/ld+json">${JSON.stringify(s)}</script>`,
      );
    }
  }

  return lines.join("\n");
}

function extractFaqItems(
  data: PuckData,
): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  for (const item of data.content ?? []) {
    if (item.type === "FAQ") {
      const items = (item.props as Record<string, unknown>).items as
        | Array<{ question: string; answer: string }>
        | undefined;
      if (Array.isArray(items)) {
        for (const it of items) {
          if (it.question && it.answer) out.push(it);
        }
      }
    }
  }
  return out;
}

type Item = PuckData["content"][number] & { type: string };

function renderItem(item: Item): string {
  const props = item.props as Record<string, unknown>;
  switch (item.type) {
    case "Hero":
      return renderHero(props);
    case "Section":
      return `<div class="section"><div class="container"><div style="height:1px;background:var(--outline)"></div></div></div>`;
    case "Heading":
      return renderHeading(props);
    case "Paragraph":
      return renderParagraph(props);
    case "Image":
      return renderImage(props);
    case "Button":
      return renderButton(props);
    case "Grid":
      return renderGrid(props);
    case "CTA":
      return renderCTA(props);
    case "FeatureList":
      return renderFeatures(props);
    case "PricingCard":
      return renderPricing(props);
    case "Testimonial":
      return renderTestimonial(props);
    case "FAQ":
      return renderFAQ(props);
    case "ContactForm":
      return renderContactForm(props);
    case "Footer":
      return renderFooter(props);
    default:
      return "";
  }
}

function renderHero(p: Record<string, unknown>): string {
  const { title, subtitle, ctaText, ctaHref, backgroundImage, alignment } = p as {
    title: string; subtitle: string; ctaText: string; ctaHref: string;
    backgroundImage: string; alignment: "left" | "center" | "right";
  };
  return `<section class="container"><div class="hero" style="text-align:${alignment};background:linear-gradient(135deg,rgba(18,18,29,0.6),rgba(41,41,53,0.4)),url(${escapeAttr(backgroundImage)}) center/cover">
    <div style="max-width:720px;${alignment === "center" ? "margin:0 auto;" : ""}">
      <h1 style="font-size:48px;font-weight:700;margin:0 0 16px">${escapeHtml(title)}</h1>
      <p class="secondary" style="font-size:18px;margin:0 0 24px">${escapeHtml(subtitle)}</p>
      <a class="btn-molten" href="${escapeAttr(ctaHref)}">${escapeHtml(ctaText)}</a>
    </div>
  </div></section>`;
}

function renderHeading(p: Record<string, unknown>): string {
  const { text, level, alignment, color } = p as {
    text: string; level: "h1" | "h2" | "h3" | "h4"; alignment: string; color: string;
  };
  const sizes: Record<string, string> = { h1: "48px", h2: "36px", h3: "28px", h4: "22px" };
  const colors: Record<string, string> = {
    "on-surface": "var(--fg)", "secondary-text": "var(--secondary)", "molten-primary": "var(--molten-from)",
  };
  return `<div class="container"><${level} style="font-size:${sizes[level]};font-weight:700;text-align:${alignment};color:${colors[color] ?? "var(--fg)"};margin:16px 0">${escapeHtml(text)}</${level}></div>`;
}

function renderParagraph(p: Record<string, unknown>): string {
  const { text, alignment, size } = p as {
    text: string; alignment: string; size: "sm" | "md" | "lg";
  };
  const sizes = { sm: "14px", md: "16px", lg: "18px" };
  return `<div class="narrow"><p class="secondary" style="font-size:${sizes[size]};text-align:${alignment};margin:12px 0">${escapeHtml(text)}</p></div>`;
}

function renderImage(p: Record<string, unknown>): string {
  const { src, alt, aspectRatio, fit } = p as {
    src: string; alt: string; aspectRatio: string; fit: "cover" | "contain";
  };
  const ar = aspectRatio === "auto" ? "" : `aspect-ratio:${aspectRatio};`;
  return `<div class="container" style="padding-top:24px;padding-bottom:24px">
    <div style="background:var(--surface);border-radius:12px;overflow:hidden;${ar}">
      <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="width:100%;height:100%;object-fit:${fit}" />
    </div>
  </div>`;
}

function renderButton(p: Record<string, unknown>): string {
  const { text, href, variant, size } = p as {
    text: string; href: string; variant: "primary" | "secondary" | "ghost"; size: "sm" | "md" | "lg";
  };
  const pad = { sm: "8px 16px", md: "12px 24px", lg: "16px 32px" }[size];
  const variants = {
    primary: `background:linear-gradient(135deg,var(--molten-from),var(--molten-to));color:var(--on-molten)`,
    secondary: `background:var(--surface-high);color:var(--fg)`,
    ghost: `color:var(--fg)`,
  };
  return `<div class="container" style="padding:16px 40px"><a href="${escapeAttr(href)}" style="display:inline-flex;padding:${pad};border-radius:12px;font-weight:600;${variants[variant]}">${escapeHtml(text)}</a></div>`;
}

function renderGrid(p: Record<string, unknown>): string {
  const { columns, gap, items } = p as {
    columns: 2 | 3 | 4; gap: "sm" | "md" | "lg";
    items: Array<{ title: string; description: string }>;
  };
  const gaps = { sm: "12px", md: "20px", lg: "32px" };
  return `<div class="container" style="padding:40px 40px">
    <div class="grid cols-${columns}" style="gap:${gaps[gap]}">
      ${items.map((it) => `<div class="card">
        <h3 style="font-size:18px;font-weight:600;margin:0 0 8px">${escapeHtml(it.title)}</h3>
        <p class="secondary" style="font-size:14px;margin:0">${escapeHtml(it.description)}</p>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderCTA(p: Record<string, unknown>): string {
  const { headline, description, buttonText, buttonHref, style } = p as {
    headline: string; description: string; buttonText: string; buttonHref: string;
    style: "gradient" | "outline" | "minimal";
  };
  const bg = style === "gradient"
    ? "background:linear-gradient(135deg,var(--molten-from),var(--molten-to));color:var(--on-molten);"
    : "background:var(--surface);color:var(--fg);";
  const btnBg = style === "gradient"
    ? "background:var(--on-molten);color:var(--molten-to);"
    : "background:linear-gradient(135deg,var(--molten-from),var(--molten-to));color:var(--on-molten);";
  return `<div class="container" style="padding:48px 40px">
    <div style="${bg}border-radius:16px;padding:56px 40px;text-align:center">
      <h2 style="font-size:36px;font-weight:700;margin:0 0 12px">${escapeHtml(headline)}</h2>
      <p style="font-size:18px;margin:0 auto 24px;max-width:640px;opacity:0.9">${escapeHtml(description)}</p>
      <a href="${escapeAttr(buttonHref)}" style="display:inline-flex;padding:12px 24px;border-radius:12px;font-weight:600;${btnBg}">${escapeHtml(buttonText)}</a>
    </div>
  </div>`;
}

function renderFeatures(p: Record<string, unknown>): string {
  const { items, layout } = p as {
    items: Array<{ icon: string; title: string; description: string }>;
    layout: "grid" | "stack";
  };
  const cls = layout === "grid" ? "grid cols-3" : "grid";
  return `<div class="container" style="padding:48px 40px">
    <div class="${cls}" style="gap:20px">
      ${items.map((it) => `<div class="card">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--surface-lowest);display:flex;align-items:center;justify-content:center;margin-bottom:12px;color:var(--molten-from)">◆</div>
        <h3 style="font-size:18px;font-weight:600;margin:0 0 4px">${escapeHtml(it.title)}</h3>
        <p class="secondary" style="font-size:14px;margin:0">${escapeHtml(it.description)}</p>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderPricing(p: Record<string, unknown>): string {
  const { name, price, period, features, ctaText, ctaHref, featured } = p as {
    name: string; price: string; period: string;
    features: Array<{ label: string }>; ctaText: string; ctaHref: string; featured: boolean;
  };
  return `<div style="max-width:420px;margin:24px auto;padding:0 24px">
    <div style="background:var(--surface-high);border-radius:16px;padding:32px;${featured ? "box-shadow:0 0 0 2px var(--molten-from);" : ""}display:flex;flex-direction:column;gap:16px">
      <p class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0">${escapeHtml(name)}</p>
      <div style="display:flex;align-items:baseline;gap:4px">
        <span style="font-size:40px;font-weight:700">${escapeHtml(price)}</span>
        <span class="muted" style="font-size:16px">${escapeHtml(period)}</span>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
        ${features.map((f) => `<li class="secondary" style="font-size:14px">✓ ${escapeHtml(f.label)}</li>`).join("")}
      </ul>
      <a class="btn-molten" href="${escapeAttr(ctaHref)}" style="justify-content:center">${escapeHtml(ctaText)}</a>
    </div>
  </div>`;
}

function renderTestimonial(p: Record<string, unknown>): string {
  const { quote, author, role, avatar } = p as {
    quote: string; author: string; role: string; avatar: string;
  };
  return `<div class="narrow" style="padding:40px 40px">
    <div class="card" style="padding:32px">
      <p style="font-size:18px;margin:0 0 24px">&ldquo;${escapeHtml(quote)}&rdquo;</p>
      <div style="display:flex;align-items:center;gap:12px">
        <img src="${escapeAttr(avatar)}" alt="${escapeAttr(author)}" style="width:40px;height:40px;border-radius:50%;background:var(--surface-lowest)" />
        <div><p style="margin:0;font-weight:600">${escapeHtml(author)}</p><p class="muted" style="margin:0;font-size:14px">${escapeHtml(role)}</p></div>
      </div>
    </div>
  </div>`;
}

function renderFAQ(p: Record<string, unknown>): string {
  const { items } = p as { items: Array<{ question: string; answer: string }> };
  return `<div class="narrow" style="padding:40px 40px">
    <div style="display:flex;flex-direction:column;gap:12px">
      ${items.map((it) => `<details><summary>${escapeHtml(it.question)}</summary><p class="secondary" style="margin:12px 0 0;font-size:14px">${escapeHtml(it.answer)}</p></details>`).join("")}
    </div>
  </div>`;
}

function renderContactForm(p: Record<string, unknown>): string {
  const { title, fields, submitText } = p as {
    title: string; fields: Array<{ value: string }> | string[]; submitText: string;
  };
  const fieldNames = Array.isArray(fields)
    ? (fields as Array<{ value: string } | string>).map((f) => (typeof f === "string" ? f : f.value))
    : [];
  return `<div class="container" style="padding:40px 40px">
    <form class="contact">
      <h3 style="font-size:28px;font-weight:700;margin:0 0 16px">${escapeHtml(title)}</h3>
      ${fieldNames.map((f) => `
        <div style="display:flex;flex-direction:column;gap:6px">
          <label>${escapeHtml(f)}</label>
          ${f === "message" ? `<textarea rows="4"></textarea>` : `<input type="${f === "email" ? "email" : "text"}" />`}
        </div>
      `).join("")}
      <button type="button" class="btn-molten" style="justify-content:center">${escapeHtml(submitText)}</button>
    </form>
  </div>`;
}

function renderFooter(p: Record<string, unknown>): string {
  const { columns, copyright } = p as {
    columns: Array<{ title: string; links: Array<{ label: string }> | string[] }>;
    copyright: string;
  };
  return `<footer class="site"><div class="container">
    <div class="cols">
      ${columns.map((col) => {
        const links = Array.isArray(col.links)
          ? (col.links as Array<{ label: string } | string>).map((l) => (typeof l === "string" ? l : l.label))
          : [];
        return `<div>
          <p class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">${escapeHtml(col.title)}</p>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            ${links.map((l) => `<li class="secondary" style="font-size:14px">${escapeHtml(l)}</li>`).join("")}
          </ul>
        </div>`;
      }).join("")}
    </div>
    <div class="copy">${escapeHtml(copyright)}</div>
  </div></footer>`;
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: unknown): string {
  return escapeHtml(s);
}
