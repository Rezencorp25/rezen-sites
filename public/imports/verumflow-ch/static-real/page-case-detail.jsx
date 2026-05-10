/* global React, Btn, Icon, PageNav, PageFooter, PageHero, Reveal */

const CASE_DETAILS = {
  "af-real-estate": {
    sector: "Real Estate",
    company: "A&F Real Estate",
    location: "Ticino, CH",
    year: "2025",
    duration: "14 giorni",
    headline: <>Pipeline mandati centralizzata in un <em style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)", fontWeight: 400 }}>unico sistema</em></>,
    summary: "CRM custom centralizzato in 14 giorni: pipeline mandati, scheda immobile, calendario visite, automazione follow-up. Integrato con il loro stack mail e con il portale immobiliare ticinese.",
    bg: "linear-gradient(135deg, #2A1810 0%, #1A0F0A 100%)",
    accent: "#FF9E5A",
    metrics: [
      { v: "14 gg", l: "kickoff → go-live" },
      { v: "1", l: "sistema unico" },
      { v: "100%", l: "dati centralizzati" }
    ],
    challenge: [
      "Mandati gestiti tra Excel, email e WhatsApp.",
      "Pipeline frammentata: ogni agente con la propria fonte di verità.",
      "Dati duplicati, contatti aggiornati a mano in più posti.",
      "Nessuna visione d'insieme sulla priorità commerciale."
    ],
    solution: [
      "CRM custom con pipeline mandati visiva, kanban su fasi reali del processo.",
      "Scheda immobile con galleria, documenti, storico visite e offerte.",
      "Calendario visite condiviso con sync iCal verso i calendari personali.",
      "Automazione follow-up: email transazionali, reminder, scadenze.",
      "Integrazione con il portale immobiliare ticinese e con lo stack mail."
    ],
    stack: ["Next.js", "Postgres", "Resend", "iCal sync", "Webhook portale"],
    quote: {
      text: "Finalmente vista d'insieme su tutta la pipeline commerciale, in tempo reale.",
      author: "Marco F.",
      role: "Co-founder @ A&F Real Estate"
    }
  },
  "stanzasemplice": {
    sector: "Hospitality · Property Rental",
    company: "StanzaSemplice",
    location: "Ticino, CH",
    year: "2025",
    duration: "18 giorni",
    headline: <>5 tool consolidati in una <em style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)", fontWeight: 400 }}>webapp real-time</em></>,
    summary: "Webapp completa per gestire 47 stanze: KPI dashboard, kanban a 6 stadi sui contratti, planning visivo, modulo finanziario integrato. Un solo posto, dati real-time.",
    bg: "linear-gradient(135deg, #102A20 0%, #0A1A12 100%)",
    accent: "#5ACFA0",
    metrics: [
      { v: "6", l: "stadi pipeline" },
      { v: "1", l: "dashboard real-time" },
      { v: "5→1", l: "tool consolidati" }
    ],
    challenge: [
      "5 tool diversi per gestire 47 stanze.",
      "Excel per i contratti, Notion per i task, Google Calendar.",
      "Stripe per i pagamenti, WhatsApp per gli inquilini.",
      "Visione frammentata, errori frequenti, tempo perso a riconciliare."
    ],
    solution: [
      "KPI dashboard con occupazione, churn, incassi mese su mese.",
      "Kanban a 6 stadi sui contratti: dalla richiesta al rinnovo.",
      "Planning visivo per stanze, con stato e prossime scadenze.",
      "Modulo finanziario: pagamenti, scadenze, riconciliazione automatica.",
      "Centro comunicazioni con thread per inquilino e template."
    ],
    stack: ["React", "Postgres", "Stripe", "WhatsApp Business API", "Recharts"],
    quote: {
      text: "Vedo davvero come gira l'attività, senza assemblare report a mano.",
      author: "Samuele G.",
      role: "Founder @ StanzaSemplice"
    }
  }
};

const CaseDetail = ({ slug }) => {
  const c = CASE_DETAILS[slug];
  React.useEffect(() => {
    const tick = () => window.lucide && window.lucide.createIcons();
    tick();
    const id = setInterval(tick, 500);
    setTimeout(() => clearInterval(id), 4000);
  }, []);
  if (!c) return null;

  return (
    <div>
      <PageNav />

      {/* Hero */}
      <section style={{ background: c.bg, color: "#F2F2F2", padding: "80px 32px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, background: `radial-gradient(circle, ${c.accent}33 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <a href="case-studies.html" style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "500 13px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.65)", textDecoration: "none", marginBottom: 40 }}>
            <Icon name="arrow-left" size={14} color="currentColor" /> Tutti i case studies
          </a>
          <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: c.accent, marginBottom: 16 }}>
            {c.sector}
          </div>
          <div style={{ font: "600 18px/1.2 var(--vf-font-sans)", marginBottom: 8 }}>{c.company}</div>
          <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", marginBottom: 32 }}>
            {c.location} · {c.year} · {c.duration}
          </div>
          <h1 style={{ font: "500 clamp(34px, 5vw, 60px)/1.05 var(--vf-font-sans)", letterSpacing: "-0.024em", margin: "0 0 24px", textWrap: "balance", maxWidth: 920 }}>
            {c.headline}
          </h1>
          <p style={{ font: "400 18px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", margin: 0, maxWidth: 720, textWrap: "pretty" }}>
            {c.summary}
          </p>
          <div style={{ display: "flex", gap: 40, marginTop: 56, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.10)", flexWrap: "wrap" }}>
            {c.metrics.map((m) => (
              <div key={m.l}>
                <div style={{ font: "600 36px/1 var(--vf-font-sans)", color: "#F2F2F2", fontVariantNumeric: "tabular-nums", marginBottom: 6, letterSpacing: "-0.018em" }}>{m.v}</div>
                <div style={{ font: "400 12px/1.3 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge / Solution */}
      <section style={{ padding: "100px 32px", background: "var(--vf-bg-warm)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="vf-grid-2">
          <Reveal>
            <div>
              <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-amber)", marginBottom: 16 }}>
                Il problema
              </div>
              <h2 className="vf-h2-resp" style={{ font: "500 clamp(26px, 3vw, 36px)/1.15 var(--vf-font-sans)", letterSpacing: "-0.020em", margin: "0 0 24px", color: "var(--vf-ink)", textWrap: "balance" }}>
                Cosa <em style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)", fontWeight: 400 }}>non funzionava</em>
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {c.challenge.map((line, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, font: "400 16px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)" }}>
                    <span style={{ color: "var(--vf-amber)", flexShrink: 0, marginTop: 4 }}>—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-amber)", marginBottom: 16 }}>
                La soluzione
              </div>
              <h2 className="vf-h2-resp" style={{ font: "500 clamp(26px, 3vw, 36px)/1.15 var(--vf-font-sans)", letterSpacing: "-0.020em", margin: "0 0 24px", color: "var(--vf-ink)", textWrap: "balance" }}>
                Cosa <em style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)", fontWeight: 400 }}>abbiamo costruito</em>
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {c.solution.map((line, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, font: "400 16px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)" }}>
                    <Icon name="check" size={18} color="var(--vf-amber)" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stack */}
      <section style={{ padding: "60px 32px", background: "var(--vf-bg-warm-2)", borderTop: "1px solid var(--vf-border-1)", borderBottom: "1px solid var(--vf-border-1)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-fg-3)" }}>
            Stack tecnologico
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {c.stack.map((tag) => (
              <span key={tag} style={{ display: "inline-flex", padding: "8px 14px", borderRadius: 999, background: "var(--vf-bg-warm)", border: "1px solid var(--vf-border-2)", font: "500 13px/1 var(--vf-font-sans)", color: "var(--vf-ink)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{ padding: "100px 32px", background: "var(--vf-bg-warm)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Reveal>
            <div style={{ borderLeft: "3px solid var(--vf-amber)", paddingLeft: 32 }}>
              <p style={{ font: "400 clamp(22px, 2.4vw, 30px)/1.4 var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-ink)", margin: "0 0 24px", textWrap: "balance" }}>
                "{c.quote.text}"
              </p>
              <div style={{ font: "500 14px/1.4 var(--vf-font-sans)", color: "var(--vf-ink)" }}>
                {c.quote.author}
              </div>
              <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "var(--vf-fg-2)", marginTop: 4 }}>
                {c.quote.role}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 32px 100px", background: "var(--vf-bg-warm)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center", padding: "64px 32px", background: "var(--vf-ink)", borderRadius: 24, color: "#F2F2F2", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 320, height: 320, background: "radial-gradient(circle, rgba(255,122,26,0.30) 0%, transparent 60%)", pointerEvents: "none" }} />
          <h2 className="vf-h2-resp" style={{ position: "relative", font: "500 clamp(28px, 3.6vw, 40px)/1.15 var(--vf-font-sans)", letterSpacing: "-0.022em", margin: "0 0 16px", textWrap: "balance" }}>
            Vuoi un sistema così, <em style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)", fontWeight: 400 }}>su misura</em>?
          </h2>
          <p style={{ position: "relative", font: "400 16px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", margin: "0 0 32px", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            45 minuti gratuiti per capire cosa potresti automatizzare nella tua impresa.
          </p>
          <div style={{ position: "relative" }}>
            <Btn variant="primary" size="lg" pill href="book.html">Prenota VerumAudit →</Btn>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
};

window.CaseDetail = CaseDetail;
