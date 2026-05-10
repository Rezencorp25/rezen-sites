/* global React, Btn, Icon, PageNav, PageFooter, PageHero, Reveal */
const CASES = [
  {
    id: "af-real-estate",
    sector: "Real Estate",
    company: "A&F Real Estate",
    location: "Ticino, CH",
    headline: "Pipeline mandati centralizzata in un unico sistema",
    summary: "CRM custom centralizzato in 14 giorni: pipeline mandati, scheda immobile, calendario visite, automazione follow-up. Integrato con il loro stack mail e con il portale immobiliare ticinese.",
    metrics: [
      { v: "14 gg", l: "kickoff → go-live" },
      { v: "1", l: "sistema unico" },
      { v: "100%", l: "dati centralizzati" }
    ],
    duration: "14 giorni",
    year: "2025",
    ghost: false,
    bg: "linear-gradient(135deg, #2A1810 0%, #1A0F0A 100%)"
  },
  {
    id: "stanzasemplice",
    sector: "Hospitality · Property Rental",
    company: "StanzaSemplice",
    location: "Ticino, CH",
    headline: "5 tool consolidati in una webapp real-time",
    summary: "Webapp completa per gestire 47 stanze: KPI dashboard, kanban a 6 stadi sui contratti, planning visivo, modulo finanziario integrato. Un solo posto, dati real-time.",
    metrics: [
      { v: "6", l: "stadi pipeline" },
      { v: "1", l: "dashboard real-time" },
      { v: "5→1", l: "tool consolidati" }
    ],
    duration: "18 giorni",
    year: "2025",
    ghost: false,
    bg: "linear-gradient(135deg, #102A20 0%, #0A1A12 100%)"
  },
  {
    id: "coming-soon-q2",
    sector: "Manifatturiero",
    company: "Coming Soon",
    location: "Disponibile Q2 2026",
    ghost: true,
    bg: "linear-gradient(135deg, #1A1810 0%, #0F0E0A 100%)"
  },
  {
    id: "coming-soon-q3",
    sector: "Servizi Professionali",
    company: "Coming Soon",
    location: "Disponibile Q3 2026",
    ghost: true,
    bg: "linear-gradient(135deg, #1A1828 0%, #0F0D1A 100%)"
  }
];

const CaseStudies = () => {
  React.useEffect(() => {
    const tick = () => window.lucide && window.lucide.createIcons();
    tick();
    const id = setInterval(tick, 500);
    setTimeout(() => clearInterval(id), 4000);
  }, []);
  return (
    <div>
      <PageNav />
      <PageHero
        overline="Case studies"
        title={<>Sistemi reali, <span style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)" }}>misurabili</span></>}
        sub="Quattro micro-imprese in Ticino e Nord Italia. Quattro sistemi su misura. Numeri concreti, niente marketing."
      />
      <section style={{ paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="vf-grid-2">
          {CASES.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              {c.ghost ? (
                <div style={{
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  background: c.bg, color: "rgba(242,242,242,0.55)",
                  borderRadius: 20, padding: 36, minHeight: 420,
                  border: "1px dashed rgba(255,255,255,0.12)",
                  position: "relative", overflow: "hidden", textAlign: "center"
                }}>
                  <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-amber)", marginBottom: 16 }}>
                    {c.sector}
                  </div>
                  <div style={{ font: "500 28px/1.2 var(--vf-font-sans)", color: "#F2F2F2", marginBottom: 12, letterSpacing: "-0.018em" }}>{c.company}</div>
                  <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", font: "500 12px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)" }}>
                    {c.location}
                  </div>
                </div>
              ) : (
              <a href={`case-${c.id}.html`} style={{
                display: "block",
                textDecoration: "none",
                background: c.bg, color: "#F2F2F2",
                borderRadius: 20, padding: 36, minHeight: 420,
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "transform var(--vf-dur-3) var(--vf-ease-out), box-shadow var(--vf-dur-3) var(--vf-ease-out)",
                position: "relative", overflow: "hidden",
                cursor: "pointer"
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  <div>
                    <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-amber)", marginBottom: 8 }}>
                      {c.sector}
                    </div>
                    <div style={{ font: "600 18px/1.2 var(--vf-font-sans)" }}>{c.company}</div>
                    <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", marginTop: 4 }}>
                      {c.location} · {c.year}
                    </div>
                  </div>
                  <div style={{ font: "400 12px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.4)", fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")} / {String(CASES.length).padStart(2, "0")}
                  </div>
                </div>
                <h3 style={{ font: "500 clamp(22px, 2.6vw, 30px)/1.2 var(--vf-font-sans)", letterSpacing: "-0.018em", margin: "0 0 16px", textWrap: "balance" }}>
                  {c.headline}
                </h3>
                <p style={{ font: "400 14px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.65)", margin: "0 0 28px", maxWidth: 460 }}>
                  {c.summary}
                </p>
                <div style={{ display: "flex", gap: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
                  {c.metrics.map((m) => (
                    <div key={m.l}>
                      <div style={{ font: "600 22px/1 var(--vf-font-sans)", color: "#F2F2F2", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>{m.v}</div>
                      <div style={{ font: "400 11px/1.3 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", letterSpacing: "0.02em" }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ position: "absolute", bottom: 24, right: 24, display: "inline-flex", alignItems: "center", gap: 6, font: "500 13px/1 var(--vf-font-sans)", color: "var(--vf-amber)" }}>
                  Leggi il case <Icon name="arrow-right" size={14} color="currentColor" />
                </div>
              </a>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 32px 100px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h2 className="vf-h2-resp" style={{ font: "500 clamp(28px, 3.6vw, 42px)/1.15 var(--vf-font-sans)", letterSpacing: "-0.02em", margin: "0 0 16px", color: "var(--vf-ink)", textWrap: "balance" }}>
            Il tuo case study sarà il prossimo?
          </h2>
          <p style={{ font: "400 17px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: "0 0 32px", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            45 minuti gratuiti per capire cosa potresti automatizzare nella tua impresa.
          </p>
          <Btn variant="primary" size="lg" pill href="book.html">Prenota VerumAudit →</Btn>
        </div>
      </section>

      <PageFooter />
    </div>
  );
};

window.CaseStudies = CaseStudies;
