/* global React, Btn, Icon, PageNav, PageFooter, PageHero, Reveal */
const SERVICES = [
  {
    id: "gestionali",
    icon: "layout-dashboard",
    title: "Sistemi gestionali su misura",
    sub: "Il tuo ERP, costruito per il tuo modo di lavorare.",
    body: "Centralizziamo i tuoi dati — clienti, fatture, prenotazioni, magazzino, contratti — in un unico sistema costruito sui tuoi processi reali, non su template generici. Nessuna licenza ricorrente: il software è tuo.",
    deliverables: [
      "Database normalizzato + schema custom",
      "UI web responsive (desktop + mobile)",
      "Ruoli, permessi, audit log",
      "Export CSV / PDF / API REST",
      "Hosting in Svizzera o EU"
    ],
    timeline: "14–21 giorni",
    accent: "var(--vf-amber)"
  },
  {
    id: "audit",
    icon: "headphones",
    title: "VerumAudit",
    sub: "45 minuti di voice-AI discovery con il tuo team.",
    body: "Tre voice agent specializzati su business, tech e dati conducono l'audit con te. Entro 72 ore ricevi un blueprint tecnico con preventivo fisso, mockup, e timeline. Gratuito, nessun contratto vincolante.",
    deliverables: [
      "45 minuti di sessione voice-AI in italiano",
      "Trascrizione + audio della call",
      "Blueprint tecnico (~30 pagine)",
      "Mockup UI 3–5 schermate chiave",
      "Preventivo fisso, non a ore"
    ],
    timeline: "72 ore dal kickoff",
    accent: "var(--vf-neural)"
  },
  {
    id: "automazioni",
    icon: "workflow",
    title: "Automazioni & agent AI",
    sub: "Riduci da 6 ore a 12 minuti i task ripetitivi.",
    body: "Costruiamo agent specializzati sui tuoi workflow: email automatiche con contesto reale, generazione contratti, follow-up clienti, sintesi dati. Non è ChatGPT incollato a un form — sono agent con accesso ai tuoi dati e processi.",
    deliverables: [
      "Multi-agent orchestration custom",
      "Trigger su eventi (email, form, deadline)",
      "Integrazione con i tuoi tool esistenti",
      "Dashboard di monitoraggio",
      "Guardrail + revisione umana opzionale"
    ],
    timeline: "7–14 giorni",
    accent: "var(--vf-amber)"
  },
  {
    id: "integrazioni",
    icon: "git-merge",
    title: "Integrazioni & migrazioni",
    sub: "Connetti tutto quello che già usi.",
    body: "Google Workspace, Microsoft 365, WhatsApp Business, Stripe, Fatture in Cloud, Shopify, MailChimp. Costruiamo connettori bidirezionali sopra il tuo stack — l'obiettivo è centralizzare i dati, non sostituire ogni strumento.",
    deliverables: [
      "Connettori API bidirezionali",
      "Sync real-time o schedulato",
      "Migrazione dati legacy",
      "Webhook + retry logic robusta",
      "Documentazione tecnica completa"
    ],
    timeline: "5–10 giorni",
    accent: "var(--vf-amber)"
  }
];

const Servizi = () => {
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
        overline="I nostri servizi"
        title={<>Quattro modi di costruire il tuo <span style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)" }}>sistema</span></>}
        sub="Ogni progetto inizia da un VerumAudit gratuito. Il preventivo è fisso, dichiarato dopo l'audit, mai a ore. Il codice è tuo, documentato, e puoi farlo evolvere con altri sviluppatori se preferisci."
      />
      <section style={{ paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <article id={s.id} style={{
                background: "var(--vf-bg-warm-2)",
                border: "1px solid var(--vf-border-2)",
                borderRadius: 16,
                padding: 40,
                display: "grid",
                gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)",
                gap: 48
              }} className="vf-grid-2 vf-cta-pad">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: s.accent === "var(--vf-neural)" ? "var(--vf-neural-tint)" : "var(--vf-amber-tint)",
                      color: s.accent,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Icon name={s.icon} size={24} color="currentColor" />
                    </div>
                    <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-fg-3)", fontVariantNumeric: "tabular-nums" }}>
                      0{i + 1} · {s.timeline}
                    </div>
                  </div>
                  <h2 className="vf-h2-resp" style={{ font: "500 clamp(28px, 3.4vw, 38px)/1.1 var(--vf-font-sans)", letterSpacing: "-0.02em", margin: "0 0 12px", color: "var(--vf-ink)" }}>
                    {s.title}
                  </h2>
                  <p style={{ font: "400 17px/1.5 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: "0 0 24px", fontStyle: "italic", fontFamily: "var(--vf-font-serif)" }}>
                    {s.sub}
                  </p>
                  <p style={{ font: "400 15px/1.6 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: 0 }}>
                    {s.body}
                  </p>
                </div>
                <div>
                  <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 16 }}>
                    [ Cosa ricevi ]
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {s.deliverables.map((d) => (
                      <li key={d} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--vf-border-1)" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--vf-amber-tint)", color: "var(--vf-amber)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <Icon name="check" size={12} color="currentColor" />
                        </div>
                        <span style={{ font: "400 15px/1.5 var(--vf-font-sans)", color: "var(--vf-ink)" }}>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Btn variant="primary" size="md" pill href="book.html">Inizia con un audit →</Btn>
                    <Btn variant="ghost" size="md" pill href="case-studies.html">Vedi casi reali</Btn>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA banda */}
      <section style={{ padding: "80px 32px" }} className="vf-section">
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          background: "var(--vf-ink)", color: "#F2F2F2",
          borderRadius: 24, padding: "56px 48px",
          display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
          gap: 48, alignItems: "center"
        }} className="vf-grid-2 vf-cta-pad">
          <div>
            <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,158,90,0.9)", marginBottom: 16 }}>
              [ Pronto a iniziare? ]
            </div>
            <h2 className="vf-h2-resp" style={{ font: "500 clamp(28px, 3.6vw, 44px)/1.1 var(--vf-font-sans)", letterSpacing: "-0.02em", margin: "0 0 16px", textWrap: "balance" }}>
              45 minuti per capire se possiamo aiutarti.
            </h2>
            <p style={{ font: "400 16px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", margin: 0, maxWidth: 480 }}>
              Audit gratuito, blueprint in 72 ore, preventivo fisso. Decidi tu se andare avanti.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" pill href="book.html">Prenota VerumAudit →</Btn>
            <Btn variant="dark-ghost" size="lg" pill href="contatti.html">Scrivici</Btn>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
};

window.Servizi = Servizi;
