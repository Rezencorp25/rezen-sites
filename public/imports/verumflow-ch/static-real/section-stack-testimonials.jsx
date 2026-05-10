/* global React, Container, Overline, SerifAccent, Btn, Icon, Reveal */
const { useState: useStateST, useEffect: useEffectST, useRef: useRefST } = React;

/* ============================================================ Section 6 — STACK & INTEGRAZIONI (orbital, Cassis-style) */
const Stack = () => {
  // Each ring: list of integrations placed at uniform angles, with a CSS rotation period.
  // Rings are CLIPPED to the upper half so nodes never travel below the horizon.
  // PLACEHOLDER — replace logos with the user's licensed brand SVGs as they're delivered.
  const rings = [
    {
      r: 0.40,                   // radius as % of width
      duration: 90,              // seconds per full rotation (very subtle)
      direction: 1,              // 1 cw, -1 ccw
      stroke: "rgba(255,158,90,0.55)",
      glow: "rgba(255,158,90,0.18)",
      nodes: [
        { id: "anthropic",  bg: "#FFF1EA", color: "#D97757", glyph: "anthropic", label: "Claude" },
        { id: "openai",     bg: "#FFFFFF", color: "#10A37F", glyph: "openai",    label: "OpenAI" },
        { id: "elevenlabs", bg: "#0F1113", color: "#FFFFFF", glyph: "elevenlabs",label: "11Labs" },
        { id: "make",       bg: "#FFFFFF", color: "#6D00CC", glyph: "make",      label: "Make" },
        { id: "clickup",    bg: "#FFFFFF", color: "#7B68EE", glyph: "clickup",   label: "ClickUp" },
        { id: "notion",     bg: "#FFFFFF", color: "#0F1113", glyph: "notion",    label: "Notion" },
      ],
    },
    {
      r: 0.27,
      duration: 70,
      direction: -1,
      stroke: "rgba(255,122,26,0.5)",
      glow: "rgba(255,122,26,0.20)",
      nodes: [
        { id: "google",   bg: "#FFFFFF", color: "#4285F4", glyph: "google",   label: "Google" },
        { id: "ms365",    bg: "#FFFFFF", color: "#0F1113", glyph: "ms365",    label: "M365" },
        { id: "whatsapp", bg: "#25D366", color: "#FFFFFF", glyph: "whatsapp", label: "WhatsApp" },
        { id: "stripe",   bg: "#635BFF", color: "#FFFFFF", glyph: "stripe",   label: "Stripe" },
        { id: "shopify",  bg: "#95BF47", color: "#FFFFFF", glyph: "shopify",  label: "Shopify" },
      ],
    },
  ];

  // Recognizable brand-inspired glyphs (stylized — not exact logos).
  const Glyph = ({ kind, color }) => {
    const s = { width: 30, height: 30 };
    switch (kind) {
      case "anthropic":
        // Anthropic "A" — two slanted bars meeting at apex
        return <svg {...s} viewBox="0 0 32 32"><path d="M11 26 L16 6 L21 26 L17.7 26 L16.7 22.5 L15.3 22.5 L14.3 26 Z M15.7 19.8 L16.3 19.8 L16 18.4 Z" fill={color}/><path d="M21 6 L26 26 L22 26 L17 6 Z" fill={color} opacity="0.85"/></svg>;
      case "openai":
        // OpenAI hex knot — six-petal interlock
        return <svg {...s} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2"><path d="M16 6 L24 10 L24 22 L16 26 L8 22 L8 10 Z"/><circle cx="16" cy="16" r="3" fill={color} stroke="none"/></svg>;
      case "elevenlabs":
        // 11 — two tall bars
        return <svg {...s} viewBox="0 0 32 32"><rect x="9" y="6" width="4" height="20" rx="1" fill={color}/><rect x="19" y="6" width="4" height="20" rx="1" fill={color}/></svg>;
      case "make":
        // Make.com — three rotated bars
        return <svg {...s} viewBox="0 0 32 32"><path d="M8 8 L12 24" stroke={color} strokeWidth="3.2" strokeLinecap="round"/><path d="M16 4 L16 28" stroke={color} strokeWidth="3.2" strokeLinecap="round"/><path d="M24 8 L20 24" stroke={color} strokeWidth="3.2" strokeLinecap="round"/></svg>;
      case "clickup":
        // ClickUp — chevron / mountain
        return <svg {...s} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"><path d="M5 21 L16 11 L27 21"/></svg>;
      case "notion":
        // Notion — N letterform
        return <svg {...s} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="20" height="20" rx="2"/><path d="M11 22 L11 10 L21 22 L21 10"/></svg>;
      case "google":
        // Google G — multicolor approximation in single accent + arc
        return <svg {...s} viewBox="0 0 32 32"><path d="M16 6 a10 10 0 1 0 9.5 13 H16 v-3 h7 a7 7 0 1 1 -7-7 v-3z" fill={color}/></svg>;
      case "ms365":
        // Microsoft — four squares
        return <svg {...s} viewBox="0 0 32 32"><rect x="5" y="5" width="10" height="10" fill="#F25022"/><rect x="17" y="5" width="10" height="10" fill="#7FBA00"/><rect x="5" y="17" width="10" height="10" fill="#00A4EF"/><rect x="17" y="17" width="10" height="10" fill="#FFB900"/></svg>;
      case "whatsapp":
        // WhatsApp — phone in chat bubble
        return <svg {...s} viewBox="0 0 32 32" fill={color}><path d="M16 4 C9.4 4 4 9.4 4 16 c0 2.1 .6 4.1 1.6 5.9 L4 28 l6.3-1.6 C12 27.4 14 28 16 28 c6.6 0 12-5.4 12-12 S22.6 4 16 4z M21.5 19.4 c-.3.7-1.4 1.3-2 1.4 -.5.1-1.2.1-1.9-.1 -.4-.1-1-.3-1.7-.6 -2.9-1.3-4.8-4.2-5-4.4 -.1-.2-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1-2.5 .3-.3.6-.4.8-.4 .2 0 .4 0 .6 0 .2 0 .5-.1.7.5 .3.6.9 2.2 1 2.4 .1.2.1.4 0 .6 -.1.2-.2.3-.4.5 -.2.2-.4.4-.5.5 -.2.2-.3.4-.2.7 .2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.5 2.8 1.7 .3.1.5.1.6-.1 .2-.2.7-.8.9-1.1 .2-.3.4-.2.7-.1 .3.1 1.8.8 2.1 1 .3.1.5.2.6.3 .1.2.1.9-.2 1.7z"/></svg>;
      case "stripe":
        // Stripe — S
        return <svg {...s} viewBox="0 0 32 32" fill={color}><path d="M19 14.5 c-2-0.7-3-1.1-3-2.1 0-0.8.7-1.3 2-1.3 2 0 4 0.7 5.5 1.5 V 8.4 c-1.6-0.6-3.2-0.9-5.5-0.9 -4.5 0-7.5 2.3-7.5 5.7 0 5.4 7.4 4.5 7.4 6.8 0 1-.8 1.5-2.3 1.5 -2.2 0-5-.9-6.6-2.1 v 4.3 c1.8 0.8 3.7 1.1 6.6 1.1 4.6 0 7.8-2.2 7.8-5.7 0-5.7-7.4-4.7-7.4-6.6z"/></svg>;
      case "shopify":
        // Shopify bag with S
        return <svg {...s} viewBox="0 0 32 32" fill={color}><path d="M22 9 L25 26 L8 28 L6 12 L10 11 C 10 8 12 5 15 5 c 2.5 0 3.8 1.7 4.4 3.5 L 22 9 z M 15 7 c -1.6 0 -3 1.7 -3 3.8 L 16 10 C 16 8.5 15.7 7 15 7 z" /><path d="M14 17 c 0-1 1-1.5 2-1.5 c 1.5 0 2 0.7 2.5 1.4 l 1.4-1 c -0.5-1-1.7-2.2-3.9-2.2 c -2.6 0-4.4 1.6-4.4 3.6 c 0 3 4 2.7 4 4.2 c 0 0.7-0.7 1-1.5 1 c -1.4 0-2.6-.7-3.2-1.5 l-1 1.5 c 0.7 0.9 2.2 1.8 4.1 1.8 c 2.7 0 4.5-1.3 4.5-3.5 c 0-3.2-4.5-2.8-4.5-3.8 z" fill="#fff" opacity="0.95"/></svg>;
      default:
        return <svg {...s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill={color}/></svg>;
    }
  };

  return (
    <section id="stack" style={{ background: "var(--vf-bg-warm)", padding: "120px 0 100px", position: "relative", overflow: "hidden" }}>
      <Container max={1280} style={{ position: "relative" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ marginBottom: 14, font: "400 italic 13px/1 var(--vf-font-serif)", color: "var(--vf-fg-2)", letterSpacing: "0.02em" }}>
              <span style={{ opacity: 0.6 }}>[ </span>Integrazioni<span style={{ opacity: 0.6 }}> ]</span>
            </div>
            <h2 style={{ font: "500 clamp(36px,4.4vw,56px)/1.12 var(--vf-font-sans)", letterSpacing: "-0.022em", margin: 0, maxWidth: 780, marginInline: "auto", textWrap: "balance" }}>
              Integrazioni native con<br />
              i tuoi <SerifAccent>strumenti preferiti</SerifAccent>.
            </h2>
          </div>
        </Reveal>

        {/* Single unified orbital stage — both rings rotate together as one composition */}
        <Orbital rings={rings} Glyph={Glyph} />
      </Container>
    </section>
  );
};

/* ============================================================
   Orbital — unified component containing all rings + nodes.
   Both rings live in the same coordinate space with the same horizon mask
   so they read as ONE animation, not two layered copies.
   The mask fades nodes well before the visible bottom edge — no clipping. */
const Orbital = ({ rings, Glyph }) => {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: 1100,
      marginInline: "auto",
      marginTop: 24,
      aspectRatio: "1100 / 520",
      // Soft horizon: full opacity up to 70%, fades smoothly to 0 by 92%.
      // The 8% transparent strip at the bottom guarantees no node ever sits
      // against a hard clip line — they all dissolve into the warm bg.
      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 92%)",
      maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 92%)",
    }}>
      {/* glow blooms — part of the stage */}
      <div style={{ position: "absolute", left: "12%", bottom: "0%", width: "50%", height: "100%", background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,200,80,0.28), transparent 65%)", filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: "8%", bottom: "0%", width: "55%", height: "85%", background: "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(255,140,90,0.22), transparent 65%)", filter: "blur(18px)", pointerEvents: "none" }} />

      {rings.map((ring, ri) => (
        <RingArc key={ri} ring={ring} Glyph={Glyph} />
      ))}
    </div>
  );
};

/* RingArc: one ring within the unified stage. Each is anchored to the bottom
   of the same parent (so concentric); the parent's mask handles the horizon fade. */
const RingArc = ({ ring, Glyph }) => {
  // Diameter as % of the stage WIDTH. Stage is wider than tall so circles
  // anchored at the bottom appear as half-arcs in the visible space.
  const sizePct = ring.r * 200;
  const rotKey = `vfRingSpin_${ring.duration}_${ring.direction > 0 ? "cw" : "ccw"}`;
  return (
    <div style={{
      position: "absolute",
      left: "50%", bottom: 0,
      width: `${sizePct}%`, aspectRatio: "1 / 1",
      transform: "translate(-50%, 50%)",
      pointerEvents: "none",
    }}>
      {/* rotating wrapper */}
      <div style={{
        position: "absolute", inset: 0,
        animation: `${rotKey} ${ring.duration}s linear infinite`,
      }}>
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <filter id={`glow-${ring.duration}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="50" fill="none" stroke={ring.glow} strokeWidth="2" filter={`url(#glow-${ring.duration})`} />
          <circle cx="50" cy="50" r="50" fill="none" stroke={ring.stroke} strokeWidth="0.4" />
        </svg>

        {ring.nodes.map((n, i) => {
          const a = (i * 360) / ring.nodes.length - 90;
          const rad = (a * Math.PI) / 180;
          const x = 50 + 50 * Math.cos(rad);
          const y = 50 + 50 * Math.sin(rad);
          return (
            <div key={n.id} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              transform: "translate(-50%, -50%)",
              animation: `${rotKey}Counter ${ring.duration}s linear infinite`,
              pointerEvents: "auto",
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: n.bg,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.04), inset 0 -2px 4px rgba(0,0,0,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Glyph kind={n.glyph} color={n.color} />
                </div>
                {n.label && (
                  <div style={{
                    font: "500 12px/1 var(--vf-font-sans)",
                    color: "var(--vf-fg-2)",
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                  }}>{n.label}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ${rotKey} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(${ring.direction * 360}deg); }
        }
        @keyframes ${rotKey}Counter {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(${-ring.direction * 360}deg); }
        }
      `}</style>
    </div>
  );
};

/* ============================================================ Section 7 — TESTIMONIALS (Cassis-replica grid) */
// PLACEHOLDER CONTENT — content marked `placeholder` is illustrative and to be replaced before launch.
const TESTIMONIALS = [
  { client: "A&F Real Estate", mark: "asterisk", rating: 5,
    quote: "Finalmente vista d'insieme su tutta la pipeline commerciale, in tempo reale.",
    name: "Marco F.", role: "Co-founder, A&F Real Estate", avatarTone: "warm" },
  { client: "StanzaSemplice", mark: "circle", rating: 5,
    quote: "Abbiamo sostituito tre tool con un sistema solo. Costi e complessità ridotti dall'oggi al domani.",
    name: "Samuele G.", role: "Founder, StanzaSemplice", avatarTone: "cool" },
  { client: "Studio Bianchi", mark: "dots", rating: 4, placeholder: true,
    quote: "L'onboarding di nuovi collaboratori è passato da giorni a minuti.",
    name: "Laura B.", role: "Managing Partner, Studio Bianchi", avatarTone: "warm" },
  { client: "Tessil-Tre", mark: "square", rating: 5, placeholder: true,
    quote: "La produttività del team è schizzata in pochi giorni.",
    name: "Giacomo R.", role: "Direttore Operativo, Tessil-Tre", avatarTone: "cool" },
  { client: "Ristoranti Lucchese", mark: "spark", rating: 4, placeholder: true,
    quote: "Affidabili, flessibili, e il supporto è davvero umano.",
    name: "Davide L.", role: "Owner, Ristoranti Lucchese", avatarTone: "warm" },
];

/* Tiny client glyph to stand in for a logomark */
const ClientMark = ({ kind }) => {
  const base = { width: 18, height: 18, color: "rgba(242,242,242,0.78)" };
  switch (kind) {
    case "asterisk":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={base}>
          <path d="M12 2v20M4.2 5.5l15.6 13M4.2 18.5l15.6-13" />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M16.5 8a6 6 0 1 0 0 8" />
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={base}>
          {[[6,6],[6,12],[6,18],[12,6],[12,12],[12,18]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1.6" />)}
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={base}>
          <rect x="3.5" y="3.5" width="8" height="8" rx="1.5" />
          <rect x="12.5" y="12.5" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "spark":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={base}>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4.2 4.2M14.3 14.3l4.2 4.2M5.5 18.5l4.2-4.2M14.3 9.7l4.2-4.2" />
        </svg>
      );
  }
};

const Stars = ({ n }) => (
  <div style={{ display: "inline-flex", gap: 2 }}>
    {[0,1,2,3,4].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24"
        fill={i < n ? "var(--vf-amber)" : "none"}
        stroke={i < n ? "var(--vf-amber)" : "rgba(242,242,242,0.32)"}
        strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 2.5l3 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6.1 3.3L7.2 14.2l-5-4.7 6.8-.8L12 2.5z" />
      </svg>
    ))}
  </div>
);

const TestimonialCard = ({ t }) => {
  const avatarBg = t.avatarTone === "warm"
    ? "linear-gradient(135deg, #C8956D 0%, #8B6243 100%)"
    : "linear-gradient(135deg, #6B7B95 0%, #3F4D63 100%)";
  return (
    <article style={{
      background: "#0F1113",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 18,
      padding: "26px 28px 24px",
      display: "flex", flexDirection: "column", gap: 22,
      minHeight: 220,
      transition: "border-color var(--vf-dur-2) var(--vf-ease-out)",
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,122,26,0.22)"}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
    >
      {/* Top row: brand mark + name | stars */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <ClientMark kind={t.mark} />
          <span style={{ font: "600 15px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.92)", letterSpacing: "-0.005em" }}>
            {t.client}
          </span>
          {t.placeholder && (
            <span style={{
              padding: "2px 6px", borderRadius: 4,
              background: "rgba(58,92,255,0.14)", color: "rgba(150,170,255,0.85)",
              font: "500 9px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>demo</span>
          )}
        </div>
        <Stars n={t.rating} />
      </header>

      {/* Quote */}
      <p style={{
        font: "400 15px/1.5 var(--vf-font-sans)",
        color: "rgba(242,242,242,0.86)",
        margin: 0, textWrap: "pretty",
        flex: 1,
      }}>
        {t.quote}
      </p>

      {/* Author */}
      <footer style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: avatarBg,
          border: "1px solid rgba(255,255,255,0.08)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          font: "600 12px/1 var(--vf-font-sans)", color: "#fff",
          flexShrink: 0,
        }}>{t.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ font: "500 13px/1.1 var(--vf-font-sans)", color: "rgba(242,242,242,0.92)" }}>{t.name}</span>
          <span style={{ font: "400 11px/1.1 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)" }}>{t.role}</span>
        </div>
      </footer>
    </article>
  );
};

const Testimonials = () => {
  const top = TESTIMONIALS.slice(0, 2);
  const bottom = TESTIMONIALS.slice(2, 5);
  return (
    <section id="testimonials" style={{ background: "#000", padding: "120px 0 140px", color: "#F2F2F2", position: "relative", overflow: "hidden" }}>
      {/* very faint amber wash for warmth */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,122,26,0.04), transparent 70%)", pointerEvents: "none" }} />

      <Container style={{ position: "relative" }} max={1240}>
        <Reveal>
          <div style={{ marginBottom: 32 }}>
            <span style={{
              display: "inline-flex", padding: "5px 12px", borderRadius: "var(--vf-radius-pill)",
              background: "rgba(255,122,26,0.12)", color: "var(--vf-amber)",
              font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 18,
            }}>I nostri clienti</span>
            <h2 style={{
              font: "500 clamp(32px,3.6vw,46px)/1.1 var(--vf-font-sans)",
              letterSpacing: "-0.022em",
              margin: 0, color: "#F2F2F2",
              maxWidth: 720, textWrap: "balance",
            }}>
              Storie reali da imprese reali.
            </h2>
          </div>
        </Reveal>

        {/* Top row: 2 wider cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, marginBottom: 20 }}>
          {top.map((t, i) => (
            <Reveal key={t.client} delay={i * 60}><TestimonialCard t={t} /></Reveal>
          ))}
        </div>
        {/* Bottom row: 3 equal cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {bottom.map((t, i) => (
            <Reveal key={t.client} delay={i * 60}><TestimonialCard t={t} /></Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
};

window.VFStackTest = { Stack, Testimonials };
Object.assign(window, window.VFStackTest);
