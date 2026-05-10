/* global React, Container, Overline, SerifAccent, Btn, Icon, Reveal */
const { useState: useStateSC, useEffect: useEffectSC } = React;

/* ============================================================ Section 4 — I NOSTRI SERVIZI (DARK Plat-form interactive cards) */
const Servizi = ({ onCta }) => {
  const cards = [
  { n: "/01", title: "Automazione di processi ripetitivi", icon: "workflow", category: "Automation",
    blurb: "Bot e agent che gestiscono in autonomia i task ricorrenti — fatturazione, follow-up, riconciliazione.",
    mockup: "automation" },
  { n: "/02", title: "Workflow centralizzati", icon: "layout-dashboard", category: "Workflow",
    blurb: "Un'unica dashboard per pipeline, calendario, contratti. Niente più 5 tool da tenere allineati a mano.",
    mockup: "workflow" },
  { n: "/03", title: "Intelligence in tempo reale", icon: "bar-chart-3", category: "Data",
    blurb: "KPI sempre aggiornati, alert proattivi, report che si scrivono da soli ogni lunedì mattina.",
    mockup: "data" },
  { n: "/04", title: "Sviluppo di Agent AI custom", icon: "bot", category: "AI Agent",
    blurb: "Agent specializzati sui dati e i processi della tua impresa — non ChatGPT generico.",
    mockup: "agent" },
  { n: "/05", title: "Consulenza strategica AI", icon: "lightbulb", category: "Consulting",
    blurb: "Mappatura processi, prioritizzazione dei casi d'uso, roadmap AI a 12 mesi con KPI misurabili.",
    mockup: "consulting" }];

  const [active, setActive] = useStateSC(0);

  const Mockup = ({ kind }) => {
    if (kind === "automation") return (
      <div style={{ width: "100%", height: "100%", padding: 14, display: "grid", gridTemplateRows: "auto 1fr", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, font: "500 10px/1 var(--vf-font-mono)", color: "rgba(15,17,19,0.6)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vf-success)" }} /> active · 3 agents
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          {[
          { l: "Fatture → riconciliazione", v: "auto" },
          { l: "Lead → CRM enrichment", v: "auto" },
          { l: "Contratti → reminder", v: "auto" }].
          map((r, i) =>
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(15,17,19,0.06)", borderRadius: 6, font: "500 11px/1 var(--vf-font-sans)", color: "var(--vf-ink)" }}>
              <span>{r.l}</span>
              <span style={{ padding: "2px 6px", background: "rgba(15,17,19,0.85)", color: "var(--vf-amber)", borderRadius: 3, font: "500 9px/1 var(--vf-font-mono)", textTransform: "uppercase" }}>{r.v}</span>
            </div>
          )}
        </div>
      </div>);

    if (kind === "workflow") return (
      <div style={{ width: "100%", height: "100%", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ font: "500 10px/1 var(--vf-font-mono)", color: "rgba(15,17,19,0.6)" }}>Q1 2026 · pipeline</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, flex: 1 }}>
          {["Lead", "Audit", "Build", "Live"].map((c, i) =>
          <div key={c} style={{ background: "rgba(15,17,19,0.06)", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ font: "500 9px/1 var(--vf-font-sans)", color: "rgba(15,17,19,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c}</div>
              {[0, 1, 2].slice(0, 3 - i).map((j) =>
            <div key={j} style={{ height: 14, background: i === 1 ? "var(--vf-ink)" : "rgba(15,17,19,0.15)", borderRadius: 3 }} />
            )}
            </div>
          )}
        </div>
      </div>);

    if (kind === "data") return (
      <div style={{ width: "100%", height: "100%", padding: 14, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 8 }}>
        <div style={{ font: "500 10px/1 var(--vf-font-mono)", color: "rgba(15,17,19,0.6)" }}>MRR · ultimi 12 mesi</div>
        <div style={{ font: "500 26px/1 var(--vf-font-sans)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "var(--vf-ink)" }}>CHF 47'820</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
          {[24, 32, 28, 38, 42, 48, 46, 58, 62, 68, 72, 84].map((h, i) =>
          <div key={i} style={{ flex: 1, height: `${h}%`, background: "var(--vf-ink)", borderRadius: "2px 2px 0 0", opacity: 0.3 + i * 0.05 }} />
          )}
        </div>
      </div>);

    if (kind === "agent") return (
      <div style={{ width: "100%", height: "100%", padding: 14, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "rgba(58,92,255,0.08)", border: "1px solid rgba(58,92,255,0.25)", borderRadius: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--vf-neural)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i data-lucide="cpu" style={{ width: 12, height: 12, color: "#fff" }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "500 10px/1.2 var(--vf-font-sans)", color: "var(--vf-ink)" }}>Agent · stanze.disponibili</div>
            <div style={{ font: "400 9px/1.2 var(--vf-font-mono)", color: "rgba(15,17,19,0.55)" }}>checking calendario…</div>
          </div>
        </div>
        <div style={{ padding: 10, background: "rgba(15,17,19,0.06)", borderRadius: 6, font: "400 10px/1.4 var(--vf-font-mono)", color: "rgba(15,17,19,0.75)" }}>
          → 4 stanze libere<br />→ 2 in check-out oggi<br />→ next booking · 18:30
        </div>
      </div>);

    return (/* consulting */
      <div style={{ width: "100%", height: "100%", padding: 14, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
        {[
        { l: "Fase 1 · audit processi", w: "100%" },
        { l: "Fase 2 · pilot agent", w: "70%" },
        { l: "Fase 3 · scale & integrate", w: "35%" },
        { l: "Fase 4 · ROI review", w: "15%" }].
        map((r, i) =>
        <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", font: "500 10px/1.2 var(--vf-font-sans)", color: "var(--vf-ink)", marginBottom: 4 }}>
              <span>{r.l}</span><span style={{ fontVariantNumeric: "tabular-nums", color: "rgba(15,17,19,0.6)" }}>Q{i + 1}</span>
            </div>
            <div style={{ height: 6, background: "rgba(15,17,19,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: r.w, height: "100%", background: "var(--vf-ink)" }} />
            </div>
          </div>
        )}
      </div>);

  };

  return (
    <section id="servizi" style={{ background: "var(--vf-ink)", padding: "140px 0 120px", color: "#F2F2F2", position: "relative", overflow: "hidden" }}>
      {/* Subtle amber halo */}
      <div style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,122,26,0.06), transparent 70%)", pointerEvents: "none" }} />

      <Container style={{ position: "relative" }} max={1440}>
        {/* Top header */}
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 5fr) minmax(0, 1fr)", gap: 32, alignItems: "flex-start", marginBottom: 64 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ font: "500 14px/1 var(--vf-font-sans)", color: "var(--vf-amber)", fontVariantNumeric: "tabular-nums" }}>002</span>
              <span style={{ font: "500 11px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>I Nostri Servizi</span>
            </div>
            <h2 style={{
              font: "500 clamp(28px,3.4vw,52px)/1.15 var(--vf-font-sans)",
              letterSpacing: "-0.018em", margin: 0, color: "rgba(242,242,242,0.7)",
              textWrap: "balance"
            }}>
              Soluzioni AI-native, modulari e flessibili per <span style={{ color: "#F2F2F2" }}>micro-imprese che vogliono crescere</span>.
            </h2>
            <div style={{ textAlign: "right", font: "500 14px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>
              {String(active + 1).padStart(2, "0")} / 05
            </div>
          </div>
        </Reveal>

        {/* Cards row */}
        <div style={{ display: "flex", gap: 12, height: 580 }}>
          {cards.map((c, i) => {
            const isActive = i === active;
            return (
              <div
                key={c.n}
                onClick={() => setActive(i)}
                style={{
                  flex: isActive ? 4 : 1,
                  minWidth: 0,
                  background: isActive ? "var(--vf-amber)" : "var(--vf-ink-3)",
                  border: isActive ? "1px solid var(--vf-amber)" : "1px solid var(--vf-border-on-dark)",
                  borderRadius: "var(--vf-radius-3)",
                  padding: 28,
                  cursor: isActive ? "default" : "pointer",
                  transition: "flex 600ms var(--vf-ease-out), background var(--vf-dur-3) var(--vf-ease-out)",
                  display: "flex", flexDirection: "column",
                  position: "relative", overflow: "hidden"
                }}>
                
                {/* TOP */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Icon name={isActive ? "arrow-up-right" : "arrow-down"} size={22} color={isActive ? "var(--vf-ink)" : "rgba(242,242,242,0.7)"} />
                  <span style={{ font: "500 14px/1 var(--vf-font-sans)", color: isActive ? "var(--vf-ink)" : "rgba(242,242,242,0.7)", fontVariantNumeric: "tabular-nums" }}>{c.n}</span>
                </div>

                {/* MIDDLE */}
                {isActive ?
                <>
                    <div style={{ marginTop: 28 }}>
                      <h3 style={{
                      font: "500 clamp(22px,2vw,30px)/1.15 var(--vf-font-sans)",
                      letterSpacing: "-0.018em", margin: "0 0 14px",
                      color: "var(--vf-ink)", textWrap: "balance"
                    }}>
                        {c.title}
                      </h3>
                      <p style={{ font: "400 15px/1.5 var(--vf-font-sans)", color: "rgba(15,17,19,0.78)", margin: 0, maxWidth: 420 }}>
                        {c.blurb}
                      </p>
                    </div>
                    {/* Mockup */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "24px 0" }}>
                      <div style={{
                      width: "100%", maxWidth: 380, aspectRatio: "16/10",
                      background: "var(--vf-bg-warm)",
                      borderRadius: 10, border: "1px solid rgba(15,17,19,0.12)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
                      overflow: "hidden"
                    }}>
                        <Mockup kind={c.mockup} />
                      </div>
                    </div>
                    {/* BOTTOM */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <Icon name={c.icon} size={22} color="var(--vf-ink)" />
                      <span style={{ font: "500 11px/1 var(--vf-font-sans)", color: "rgba(15,17,19,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {c.category}
                      </span>
                    </div>
                  </> :

                <div style={{ marginTop: "auto", writingMode: "vertical-rl", transform: "rotate(180deg)", font: "400 15px/1.2 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", letterSpacing: "0.01em" }}>
                    {c.title.toLowerCase()}
                  </div>
                }
              </div>);

          })}
        </div>

        {/* CTA */}
        <Reveal>
          <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
            <Btn variant="dark-ghost" size="lg" pill href="servizi.html">
              Esplora i servizi in dettaglio →
            </Btn>
          </div>
        </Reveal>
      </Container>
    </section>);

};

/* ============================================================ Section 5 — CASE STUDIES (LIGHT Tello accordion) */
const CaseStudies = () => {
  const items = [
  {
    n: "(01)", client: "A&F Real Estate", sector: "Real Estate",
    ghost: false,
    challenge: "Mandati gestiti tra Excel, email, WhatsApp. Pipeline frammentata, dati duplicati, nessuna visione d'insieme sulla priorità commerciale.",
    solution: "CRM custom centralizzato in 14 giorni: pipeline mandati, scheda immobile, calendario visite, automazione follow-up. Integrato con il loro stack mail e con il portale immobiliare ticinese.",
    stats: [{ v: "14 gg", l: "kickoff → go-live" }, { v: "1", l: "sistema unico" }, { v: "100%", l: "dati centralizzati" }],
    quote: "Finalmente vista d'insieme su tutta la pipeline commerciale, in tempo reale.",
    attribution: "— Marco F., Co-founder @ A&F Real Estate",
    img: "real-estate"
  },
  {
    n: "(02)", client: "StanzaSemplice", sector: "Hospitality · Property Rental",
    ghost: false,
    challenge: "5 tool diversi per gestire 47 stanze: Excel per i contratti, Notion per i task, calendario Google, Stripe per i pagamenti, WhatsApp per gli inquilini. Visione frammentata, errori frequenti.",
    solution: "Webapp completa: KPI dashboard, kanban a 6 stadi sui contratti, planning visivo, modulo finanziario integrato. Un solo posto, dati real-time.",
    stats: [{ v: "6", l: "stadi pipeline" }, { v: "1", l: "dashboard real-time" }, { v: "5→1", l: "tool consolidati" }],
    quote: "Vedo davvero come gira l'attività, senza assemblare report a mano.",
    attribution: "— Samuele G., Founder @ StanzaSemplice",
    img: "hospitality"
  },
  {
    n: "(03)", client: "Coming Soon", sector: "Manifatturiero",
    ghost: true, badge: "Disponibile Q2 2026"
  },
  {
    n: "(04)", client: "Coming Soon", sector: "Servizi Professionali",
    ghost: true, badge: "Disponibile Q3 2026"
  }];

  const [open, setOpen] = useStateSC(0);

  const ImageBlock = ({ kind }) =>
  <div style={{
    aspectRatio: "4/5", borderRadius: "var(--vf-radius-3)",
    background: kind === "real-estate" ?
    "linear-gradient(160deg, #2A1810 0%, #4A2C1A 50%, #6B3F22 100%)" :
    "linear-gradient(160deg, #1A2030 0%, #243042 50%, #2E3D52 100%)",
    position: "relative", overflow: "hidden",
    border: "1px solid var(--vf-border-2)"
  }}>
      <div style={{
      position: "absolute", inset: 0,
      background: kind === "real-estate" ?
      "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,158,90,0.30), transparent 60%)" :
      "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,158,90,0.18), transparent 60%)"
    }} />
      {/* Mock dashboard */}
      <div style={{
      position: "absolute", left: "10%", top: "22%", right: "10%",
      background: "rgba(15,17,19,0.85)", borderRadius: 8,
      border: "1px solid rgba(255,158,90,0.18)",
      padding: 14, backdropFilter: "blur(6px)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.4)"
    }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,158,90,0.5)" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 8 }}>
          {[0, 1, 2].map((i) =>
        <div key={i} style={{ height: 36, background: "rgba(255,158,90,0.08)", borderRadius: 4, padding: 6 }}>
              <div style={{ height: 3, width: "60%", background: "rgba(255,158,90,0.5)", borderRadius: 2, marginBottom: 4 }} />
              <div style={{ height: 8, width: "80%", background: "rgba(242,242,242,0.7)", borderRadius: 2 }} />
            </div>
        )}
        </div>
        <div style={{ height: 4, background: "rgba(242,242,242,0.1)", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 4, width: "70%", background: "rgba(242,242,242,0.1)", borderRadius: 2 }} />
      </div>
    </div>;


  return (
    <section id="case-studies" style={{ background: "var(--vf-bg-warm)", padding: "160px 0 140px" }}>
      <Container max={1280}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 64, alignItems: "flex-end", marginBottom: 80 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: "inline-flex", padding: "6px 14px", borderRadius: "var(--vf-radius-pill)",
                  background: "var(--vf-amber-tint)", color: "var(--vf-amber-700)",
                  font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase"
                }}>[ I nostri case studies ]</span>
              </div>
              <h2 style={{ font: "500 clamp(40px,5.4vw,72px)/1.05 var(--vf-font-sans)", letterSpacing: "-0.022em", margin: 0, textWrap: "balance" }}>
                Case <SerifAccent>studies</SerifAccent>.
              </h2>
            </div>
            <div>
              <p style={{ font: "400 17px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: "0 0 24px", maxWidth: 440 }}>
                Sistemi reali, in produzione, con clienti reali. Ogni progetto è documentato:
                sfida, approccio, risultati misurati a 90 giorni dal go-live.
              </p>
              <Btn variant="dark" size="md" pill>Parliamone →</Btn>
            </div>
          </div>
        </Reveal>

        <div style={{ borderTop: "1px solid var(--vf-border-2)" }}>
          {items.map((it, i) => {
            const isOpen = !it.ghost && open === i;
            return (
              <div key={i} style={{
                borderBottom: "1px solid var(--vf-border-2)",
                background: isOpen ? "var(--vf-bg-paper)" : "transparent",
                borderLeft: isOpen ? "3px solid var(--vf-amber)" : "3px solid transparent",
                transition: "all var(--vf-dur-3) var(--vf-ease-out)"
              }}>
                <button
                  onClick={() => !it.ghost && setOpen(isOpen ? -1 : i)}
                  disabled={it.ghost}
                  style={{
                    width: "100%", padding: "36px 24px",
                    display: "grid", gridTemplateColumns: "120px 1fr 56px", gap: 24,
                    alignItems: "center",
                    background: "transparent", border: "none",
                    cursor: it.ghost ? "not-allowed" : "pointer",
                    textAlign: "left", color: "inherit",
                    fontFamily: "inherit"
                  }}>
                  
                  <span style={{ font: "400 22px/1 var(--vf-font-sans)", color: "var(--vf-fg-3)", fontVariantNumeric: "tabular-nums" }}>{it.n}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ font: "500 clamp(28px,2.4vw,38px)/1.1 var(--vf-font-sans)", letterSpacing: "-0.018em", color: it.ghost ? "var(--vf-fg-3)" : "var(--vf-fg-1)" }}>
                      {it.client}
                    </span>
                    {it.ghost &&
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 12px", borderRadius: "var(--vf-radius-pill)",
                      background: "rgba(58,92,255,0.10)", color: "var(--vf-neural)",
                      font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.04em", textTransform: "uppercase"
                    }}>
                        <Icon name="lock" size={11} /> {it.badge}
                      </span>
                    }
                  </div>
                  <div style={{ justifySelf: "end" }}>
                    <div style={{
                      width: 48, height: 48,
                      background: isOpen ? "var(--vf-amber)" : "transparent",
                      border: isOpen ? "1px solid var(--vf-amber)" : "1px solid var(--vf-border-2)",
                      color: isOpen ? "#fff" : "var(--vf-fg-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all var(--vf-dur-3) var(--vf-ease-out)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", borderRadius: "50px"
                    }}>
                      <Icon name={it.ghost ? "lock" : "plus"} size={20} />
                    </div>
                  </div>
                </button>

                {/* Sector tag inline */}
                <div style={{ padding: "0 24px 0 144px", marginTop: -24, marginBottom: 24 }}>
                  <span style={{ font: "500 12px/1 var(--vf-font-sans)", color: "var(--vf-fg-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {it.sector}
                  </span>
                </div>

                {isOpen && !it.ghost &&
                <div style={{
                  padding: "0 24px 48px 144px",
                  display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
                  gap: 64, alignItems: "flex-start",
                  animation: "vfFadeSlide 400ms var(--vf-ease-out)"
                }}>
                    <div>
                      {[
                    { l: "La sfida", v: it.challenge },
                    { l: "La soluzione", v: it.solution }].
                    map((b) =>
                    <div key={b.l} style={{ marginBottom: 28 }}>
                          <div style={{ font: "500 11px/1 var(--vf-font-sans)", color: "var(--vf-amber)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                            {b.l}
                          </div>
                          <p style={{ font: "400 16px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: 0, maxWidth: 540 }}>
                            {b.v}
                          </p>
                        </div>
                    )}
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ font: "500 11px/1 var(--vf-font-sans)", color: "var(--vf-amber)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                          Risultati
                        </div>
                        <div style={{ display: "flex", gap: 32 }}>
                          {it.stats.map((s) =>
                        <div key={s.l}>
                              <div style={{ font: "500 32px/1 var(--vf-font-sans)", letterSpacing: "-0.022em", color: "var(--vf-fg-1)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                              <div style={{ font: "400 12px/1.4 var(--vf-font-sans)", color: "var(--vf-fg-3)", marginTop: 6 }}>{s.l}</div>
                            </div>
                        )}
                        </div>
                      </div>
                      <div style={{ paddingLeft: 16, borderLeft: "2px solid var(--vf-amber)", marginTop: 20 }}>
                        <p style={{
                        font: "400 italic 19px/1.45 var(--vf-font-serif)",
                        color: "var(--vf-fg-1)", margin: "0 0 8px", maxWidth: 480
                      }}>"{it.quote}"</p>
                        <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "var(--vf-fg-3)" }}>{it.attribution}</div>
                      </div>
                      <a style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 28, font: "500 14px/1 var(--vf-font-sans)", color: "var(--vf-amber)", textDecoration: "none", cursor: "pointer" }}>
                        Leggi il case study completo →
                      </a>
                    </div>
                    <ImageBlock kind={it.img} />
                  </div>
                }
              </div>);

          })}
        </div>
      </Container>
    </section>);

};

window.VFServiziCases = { Servizi, CaseStudies };
Object.assign(window, window.VFServiziCases);