/* global React, Container, Overline, SerifAccent, Btn, Icon, Reveal */
const { useState: useStateFC, useEffect: useEffectFC } = React;

/* ============================================================ Section 8 — FAQ (DARK Cassis 2-column) */
const FAQ = () => {
  const faqs = [
  { q: "Quanto dura davvero un progetto VerumFlow?",
    a: "Dal kickoff dell'audit al go-live in produzione: 14 giorni di calendario, in media. La fase di VerumAudit dura 45 minuti; il blueprint arriva entro 72 ore; il sistema è online entro la seconda settimana. Progetti più complessi arrivano a 21 giorni — lo dichiariamo prima dell'audit, mai dopo." },
  { q: "Sono micro-impresa, posso permettermi un sistema custom?",
    a: "Sì. La pipeline multi-agent ci permette di lavorare a costi enterprise — ma ad un quinto. Il preventivo è fisso e dichiarato dopo l'audit, non a ore. Nessuna licenza ricorrente: il software è tuo." },
  { q: "Devo cambiare i tool che già uso?",
    a: "No. Costruiamo sopra il tuo stack esistente — Google Workspace, Microsoft 365, WhatsApp Business, Stripe, Fatture in Cloud, Shopify. L'obiettivo è centralizzare i dati, non sostituire ogni strumento." },
  { q: "Cosa significa esattamente 'AI-native'?",
    a: "Significa che AI fa il pesante (analisi, scaffolding, test, documentazione) durante lo sviluppo, e che il sistema finale include agent specializzati sui tuoi processi. Non è ChatGPT incollato a un form: sono agent con accesso ai tuoi dati e ai tuoi workflow reali." },
  { q: "I miei dati sono al sicuro?",
    a: "Conformità GDPR e nFADP svizzera. Hosting in Svizzera o EU a tua scelta. Crittografia at-rest e in-transit, audit log completo, possibilità di deployment on-premise. I tuoi dati non vengono usati per training di modelli esterni." },
  { q: "Cosa succede dopo il go-live? Mi lasciate soli?",
    a: "No. Tre mesi di support incluso (bug-fix, micro-iterazioni, training del team). Dopo, retainer mensile opzionale o pay-per-change. Il codice è tuo, documentato, e puoi farlo evolvere con altri sviluppatori se preferisci." },
  { q: "Come iniziamo?",
    a: "Prenoti un VerumAudit gratuito di 45 minuti. Tre voice agent specializzati conducono l'audit con te e il tuo team. Entro 72 ore ricevi il blueprint con preventivo fisso. Da lì decidi se andare avanti — nessun contratto vincolante prima." }];

  const [open, setOpen] = useStateFC(new Set([0]));
  const toggle = (i) => {
    const next = new Set(open);
    next.has(i) ? next.delete(i) : next.add(i);
    setOpen(next);
  };
  return (
    <section id="faq" style={{ background: "var(--vf-ink)", padding: "140px 0", color: "#F2F2F2" }}>
      <Container max={1280}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 80, alignItems: "flex-start" }}>
          <Reveal>
            <div style={{ position: "sticky", top: 100 }}>
              <span style={{
                display: "inline-flex", padding: "6px 14px", borderRadius: "var(--vf-radius-pill)",
                background: "rgba(255,122,26,0.10)", color: "var(--vf-amber)",
                font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
                marginBottom: 24
              }}>Domande frequenti</span>
              <h2 style={{ font: "500 clamp(36px,4.4vw,60px)/1.05 var(--vf-font-sans)", letterSpacing: "-0.022em", margin: 0, maxWidth: 480, color: "#F2F2F2", textWrap: "balance" }}>
                Tutto quello che<br />vuoi <SerifAccent>davvero</SerifAccent> sapere.
              </h2>
              <p style={{ font: "400 16px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.6)", margin: "32px 0 0", maxWidth: 380 }}>
                Non hai trovato la tua domanda?{" "}
                <a style={{ color: "var(--vf-amber)", textDecoration: "none", cursor: "pointer" }}>Scrivici direttamente →</a>
              </p>
            </div>
          </Reveal>
          <div>
            {faqs.map((f, i) => {
              const isOpen = open.has(i);
              return (
                <Reveal key={i} delay={i * 40}>
                  <div style={{
                    background: isOpen ? "rgba(34,38,43,1)" : "rgba(26,29,33,1)",
                    border: isOpen ? "1px solid rgba(255,122,26,0.25)" : "1px solid var(--vf-border-on-dark)",
                    borderRadius: "var(--vf-radius-3)",
                    marginBottom: 12,
                    transition: "all var(--vf-dur-3) var(--vf-ease-out)",
                    overflow: "hidden"
                  }}>
                    <button onClick={() => toggle(i)} style={{
                      width: "100%", padding: "22px 28px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                      background: "transparent", border: "none", color: "#F2F2F2",
                      font: "500 17px/1.4 var(--vf-font-sans)", letterSpacing: "-0.005em",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit"
                    }}>
                      <span>{f.q}</span>
                      <Icon name="chevron-down" size={20} color="rgba(242,242,242,0.6)" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform var(--vf-dur-3) var(--vf-ease-out)", flexShrink: 0 }} />
                    </button>
                    {isOpen &&
                    <div style={{ padding: "0 28px 24px", animation: "vfFadeSlide 320ms var(--vf-ease-out)" }}>
                        <p style={{ font: "400 15px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.72)", margin: 0, maxWidth: 640 }}>{f.a}</p>
                      </div>
                    }
                  </div>
                </Reveal>);

            })}
          </div>
        </div>
      </Container>
    </section>);

};

/* ============================================================ Section 9 — CTA FINALE (DARK Lunora + 3D Robot placeholder) */
const FinalCTA = ({ onCta }) => {
  const [mouse, setMouse] = useStateFC({ x: 0.5, y: 0.5 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };
  return (
    <section id="cta" style={{ background: "var(--vf-bg-warm)", padding: "120px 0", color: "#F2F2F2", position: "relative", overflow: "hidden" }}>
      <Container max={1280} style={{ position: "relative" }}>
        <div style={{
          position: "relative",
          background: "linear-gradient(160deg, #1A1D21 0%, #0F1113 100%)",
          borderRadius: 28,
          padding: "56px 64px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.18)"
        }}>
        {/* Sphere/halo bg right */}
        <div style={{ position: "absolute", right: -120, top: "50%", transform: "translateY(-50%)", width: 720, height: 720, background: "radial-gradient(circle, rgba(40,46,56,0.9) 0%, rgba(15,17,19,0) 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 6fr) minmax(0, 6fr)", gap: 48, alignItems: "center", minHeight: 460 }}>
          <Reveal>
            <div>
              <div style={{ marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 8, font: "500 11px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>

                </div>
              <h2 style={{ font: "500 clamp(36px,4.4vw,56px)/1.08 var(--vf-font-sans)", letterSpacing: "-0.022em", margin: "0 0 24px", color: "#F2F2F2", textWrap: "balance", maxWidth: 480 }}>
                Costruisci il tuo sistema<br />
                <SerifAccent>su misura</SerifAccent>, in 14 giorni.
              </h2>
              <p style={{ font: "400 15px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.6)", margin: "0 0 32px", maxWidth: 380 }}>
                Quarantacinque minuti di voice-AI audit. Settantadue ore per il blueprint con preventivo fisso. Da lì, in due settimane, il sistema è online.
              </p>
              <Btn variant="primary" size="lg" pill href="book.html">Prenota VerumAudit →</Btn>
            </div>
          </Reveal>

          {/* Abstract 3D — orbital rings + drifting particles */}
          <Reveal delay={120}>
            <div className="vf-orb-stage" style={{
                position: "relative", height: 460,
                display: "flex", alignItems: "center", justifyContent: "center",
                perspective: "1400px"
              }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(255,158,90,0.22) 0%, rgba(255,122,26,0.06) 32%, transparent 68%)", pointerEvents: "none" }} />
              <div className="vf-orb" style={{ position: "relative", width: 340, height: 340, transformStyle: "preserve-3d", animation: "vfOrbSpin 22s linear infinite" }}>
                {/* concentric rings on different axes */}
                <div className="vf-ring vf-ring--1" />
                <div className="vf-ring vf-ring--2" />
                <div className="vf-ring vf-ring--3" />
                <div className="vf-ring vf-ring--4" />
                {/* core glow */}
                <div style={{
                    position: "absolute", inset: "42% 42% 42% 42%",
                    background: "radial-gradient(circle, #FF9E5A 0%, #FF7A1A 45%, transparent 75%)",
                    borderRadius: "50%", filter: "blur(8px)",
                    animation: "vfOrbPulse 3.4s ease-in-out infinite"
                  }} />
                {/* orbiting dots */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) =>
                  <div key={i} className="vf-orb-dot" style={{ animationDelay: `${i * -1.2}s`, transform: `rotateY(${deg}deg) translateZ(170px)` }} />
                  )}
              </div>
            </div>
          </Reveal>
        </div>
        {/* Trust logos row removed per feedback */}
        </div>
      </Container>
    </section>);

};

/* ============================================================ Section 10 — FOOTER (DARK) */
const Footer = ({ onCta }) => {
  return (
    <footer style={{ background: "var(--vf-ink)", color: "#F2F2F2", borderTop: "1px solid rgba(242,242,242,0.06)", padding: "80px 0 40px" }}>
      <Container max={1280}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 4fr) minmax(0, 3fr) minmax(0, 2fr) minmax(0, 3fr)", gap: 48, marginBottom: 64 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
              <span style={{ font: "600 18px/1 var(--vf-font-sans)", color: "#F2F2F2" }}>VerumFlow</span>
            </div>
            <p style={{ font: "400 14px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.6)", margin: "0 0 24px", maxWidth: 280 }}>
              AI-native agency. Sistemi gestionali su misura per micro-imprese in Ticino e Nord Italia.
            </p>
            <div style={{ display: "none" }}>
              {/* social row removed per feedback */}
              {[].map((s) =>
              <a key={s}>
                <Icon name={s} size={16} color="currentColor" /></a>
              )}
            </div>
          </div>
          {/* Esplora */}
          <FootCol title="Esplora" links={[
          { l: "Servizi", h: "servizi.html" },
          { l: "Processo", h: "index.html#processo" },
          { l: "Case studies", h: "case-studies.html" },
          { l: "Stack tecnico", h: "index.html#stack" },
          { l: "Chi siamo", h: "index.html#chi-siamo" }]
          } />
          <FootCol title="Risorse" links={[
          { l: "FAQ", h: "index.html#faq" },
          { l: "Prenota audit", h: "book.html" },
          { l: "Contatti", h: "contatti.html" }]
          } />
          {/* Contatti */}
          <div>
            <div style={{ font: "500 12px/1 var(--vf-font-sans)", color: "#F2F2F2", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>Contattaci</div>
            <div style={{ font: "400 14px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", marginBottom: 8 }}>Canton Ticino, Svizzera</div>
            <a href="mailto:sales@verumflow.com" style={{ display: "block", font: "400 14px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", textDecoration: "none", marginBottom: 24, cursor: "pointer" }}>sales@verumflow.com</a>
            <Btn variant="dark-ghost" size="sm" pill href="book.html">Prenota Audit →</Btn>
          </div>
        </div>
        <div style={{
          paddingTop: 32, borderTop: "1px solid rgba(242,242,242,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap"
        }}>
          <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)" }}>© 2026 VerumFlow. Tutti i diritti riservati.  Created by REZEN

          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
            { l: "Privacy Policy", h: "privacy.html" },
            { l: "Terms", h: "privacy.html" },
            { l: "Cookie Policy", h: "cookie.html" }].
            map((x) =>
            <a key={x.l} href={x.h} style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)", textDecoration: "none", cursor: "pointer", transition: "color var(--vf-dur-2) var(--vf-ease-out)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--vf-amber)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(242,242,242,0.5)"}>{x.l}</a>
            )}
          </div>
          <div style={{ font: "400 11px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.4)", maxWidth: 280, textAlign: "right" }}>
            I marchi mostrati sono di proprietà dei rispettivi proprietari.
          </div>
        </div>
      </Container>
    </footer>);

};
const FootCol = ({ title, links }) =>
<div>
    <div style={{ font: "500 12px/1 var(--vf-font-sans)", color: "#F2F2F2", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {links.map((l) =>
    <a key={l.l} href={l.h} style={{ font: "400 14px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", textDecoration: "none", cursor: "pointer", transition: "color var(--vf-dur-2) var(--vf-ease-out)" }}
    onMouseEnter={(e) => e.currentTarget.style.color = "var(--vf-amber)"}
    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(242,242,242,0.7)"}>
      {l.l}</a>
    )}
    </div>
  </div>;


window.VFFaqCta = { FAQ, FinalCTA, Footer };
Object.assign(window, window.VFFaqCta);