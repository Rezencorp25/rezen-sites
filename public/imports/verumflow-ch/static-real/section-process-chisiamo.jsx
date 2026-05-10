/* global React, Container, Overline, SerifAccent, Btn, Icon, Reveal, CountUp */

/* ============================================================ Section 2 — IL NOSTRO PROCESSO (LIGHT Palantir editorial) */
const Processo = () => {
  const glowRef = React.useRef(null);
  React.useEffect(() => {
    const node = glowRef.current;
    if (!node) return;
    const onScroll = () => {
      const r = node.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Progress: 0 when h2 is at bottom of viewport, 1 when at top.
      // Glow ramps up as the user scrolls the heading into view.
      const raw = 1 - (r.top / vh);
      const p = Math.max(0, Math.min(1, raw));
      node.style.setProperty("--vf-glow-progress", p.toFixed(3));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const rows = [
  {
    n: "/01",
    title: "VerumAudit",
    icon: "mic",
    desc: "Capiamo come lavori davvero, prima di scrivere una riga di codice. Tre voice agent specializzati conducono un audit progressivo della tua impresa."
  },
  {
    n: "/02",
    title: "Blueprint",
    icon: "file-text",
    desc: "Architettura, design e prototipo navigabile. Vedi e tocchi il tuo sistema prima che venga costruito, non dopo."
  },
  {
    n: "/03",
    title: "Deploy",
    icon: "rocket",
    desc: "Sviluppo, test e messa in produzione. Il sistema è online entro 14 giorni dall'inizio dell'audit."
  }];

  return (
    <section id="processo" style={{ background: "var(--vf-bg-warm)", padding: "160px 0 120px" }}>
      <Container max={1280}>
        <Reveal>
          <div style={{ marginBottom: 80 }}>
            <div style={{
              font: "400 clamp(28px,3.4vw,46px)/1.1 var(--vf-font-sans)",
              letterSpacing: "-0.01em",
              color: "var(--vf-fg-1)", marginBottom: 64
            }}>
              <span style={{ color: "var(--vf-fg-3)" }}>/ </span>Il nostro Processo
            </div>
            <h2 ref={glowRef} className="vf-glow-h2" style={{
              font: "500 clamp(48px,6vw,80px)/1.02 var(--vf-font-sans)",
              letterSpacing: "-0.022em",
              margin: 0, textWrap: "balance", maxWidth: 1100
            }}>
              <span style={{ color: "var(--vf-fg-1)" }}>Tre fasi.</span>{" "}
              <span className="vf-glow-text" data-glow="amber">Quattordici giorni.</span><br />
              <span style={{ color: "var(--vf-fg-1)" }}>Un sistema</span>{" "}
              <span className="vf-glow-text" data-glow="amber">progettato attorno al tuo modo di lavorare.</span><br />
              <span style={{ color: "var(--vf-fg-1)" }}></span>
            </h2>
          </div>
        </Reveal>

        <div>
          {rows.map((r, i) =>
          <Reveal key={r.title} delay={i * 80}>
              <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 3fr) minmax(0, 4fr) minmax(0, 5fr)",
              gap: 32, alignItems: "center",
              padding: "56px 0",
              borderTop: "1px solid var(--vf-border-1)",
              borderBottom: i === rows.length - 1 ? "1px solid var(--vf-border-1)" : "none"
            }}>
                {/* LEFT — number + description */}
                <div>
                  <div style={{
                  font: "500 18px/1 var(--vf-font-sans)",
                  color: "var(--vf-amber)", letterSpacing: "0.04em",
                  marginBottom: 20,
                  fontVariantNumeric: "tabular-nums"
                }}>{r.n}</div>
                  <p style={{
                  font: "400 16px/1.55 var(--vf-font-sans)",
                  color: "var(--vf-fg-2)", margin: 0, maxWidth: 320,
                  textWrap: "pretty"
                }}>{r.desc}</p>
                </div>
                {/* CENTER — ghost icon */}
                <div style={{ display: "flex", justifyContent: "center", opacity: 0.12 }}>
                  <Icon name={r.icon} size={140} color="var(--vf-fg-1)" style={{ strokeWidth: 1 }} />
                </div>
                {/* RIGHT — giant service name */}
                <div style={{
                textAlign: "right",
                font: "400 clamp(72px,11vw,148px)/0.92 var(--vf-font-sans)",
                letterSpacing: "-0.03em",
                color: "var(--vf-fg-1)"
              }}>
                  {r.title}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </section>);

};

/* ============================================================ Section 3 — CHI SIAMO (LIGHT warm Anthropic) */
const ChiSiamo = ({ onCta }) => {
  return (
    <section id="chi-siamo" style={{ background: "var(--vf-bg-warm)", padding: "120px 0 160px" }}>
      <Container max={1280}>
        {/* Top block */}
        <Reveal>
          <div style={{ marginBottom: 24 }}>
            <span style={{
              display: "inline-flex", padding: "6px 14px", borderRadius: "var(--vf-radius-pill)",
              background: "var(--vf-amber-tint)", color: "var(--vf-amber-700)",
              font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase"
            }}>[ Chi siamo ]</span>
          </div>
          <h2 style={{
            font: "500 clamp(40px,5vw,68px)/1.08 var(--vf-font-sans)",
            letterSpacing: "-0.022em", margin: "0 0 80px", textWrap: "balance", maxWidth: 980
          }}>
            AI-native agency.<br />
            Costruiamo software <SerifAccent>su misura</SerifAccent> per le micro-imprese<br />
            in Ticino e Nord Italia.
          </h2>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 6fr) minmax(0, 6fr)",
          gap: 64, alignItems: "flex-start"
        }}>
          {/* LEFT — workspace placeholder */}
          <Reveal>
            <div style={{
              aspectRatio: "5/6",
              borderRadius: "var(--vf-radius-4)",
              overflow: "hidden", position: "relative",
              background: "linear-gradient(135deg, #2A1810 0%, #4A2C1A 35%, #6B3F22 70%, #8A4F2A 100%)",
              border: "1px solid var(--vf-border-2)",
              boxShadow: "var(--vf-shadow-3)"
            }}>
              {/* Workspace abstraction — desk silhouette + dashboard glow */}
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(255,158,90,0.35) 0%, rgba(255,158,90,0) 60%)"
              }} />
              {/* Floating dashboard mock */}
              <div style={{
                position: "absolute", left: "12%", top: "32%", right: "12%",
                aspectRatio: "16/10", borderRadius: 10,
                background: "rgba(15,17,19,0.85)", border: "1px solid rgba(255,158,90,0.2)",
                backdropFilter: "blur(8px)",
                padding: 16, display: "grid", gridTemplateRows: "auto 1fr", gap: 10,
                boxShadow: "0 30px 80px rgba(0,0,0,0.4)"
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,158,90,0.5)" }} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {[0, 1, 2].map((i) =>
                  <div key={i} style={{ background: "rgba(255,158,90,0.08)", borderRadius: 4, padding: 8 }}>
                      <div style={{ height: 4, width: "60%", background: "rgba(255,158,90,0.4)", borderRadius: 2, marginBottom: 6 }} />
                      <div style={{ height: 12, width: "80%", background: "rgba(242,242,242,0.6)", borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              </div>
              {/* Caption pill */}
              <div style={{
                position: "absolute", bottom: 20, left: 20, right: 20,
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(15,17,19,0.55)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(242,242,242,0.08)"
              }}>
                <Icon name="map-pin" size={14} color="rgba(255,158,90,0.9)" />
                <span style={{ font: "500 12px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.85)", letterSpacing: "0.02em" }}>
                  Lugano · workspace, mattina
                </span>
              </div>
              {/* Subtle warm tint overlay */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,122,26,0.04)", pointerEvents: "none" }} />
            </div>
          </Reveal>

          {/* RIGHT */}
          <div style={{ paddingTop: 8 }}>
            <Reveal>
              <p style={{ font: "400 19px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: "0 0 48px", maxWidth: 480, textWrap: "pretty" }}>
                Siamo un'agenzia ibrida tra studio di design e laboratorio di engineering.
                Pochi clienti, tutti seguiti dal team al completo, dal voice-AI audit fino al go-live.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--vf-border-1)" }}>
                <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 12 }}>
                  La nostra missione
                </div>
                <p style={{ font: "400 16px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: 0, maxWidth: 440 }}>
                  Rendere il software custom accessibile alle imprese da 5 a 20 persone — senza il prezzo, i tempi e la complessità del modello enterprise.
                </p>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div style={{ marginBottom: 48 }}>
                <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 12 }}>
                  Il nostro approccio
                </div>
                <p style={{ font: "400 16px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: 0, maxWidth: 440 }}>
                  Pipeline multi-agent: AI fa il pesante (analisi, scaffolding, test); i designer e gli engineer fanno il lavoro che richiede gusto e giudizio.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginBottom: 40 }}>
                {[
                { v: 45, suffix: " min", label: "audit AI completo" },
                { v: 14, suffix: " gg", label: "dall'audit al go-live" },
                { v: 0, suffix: "", label: "template, sistemi 100% custom" }].
                map((s, i) =>
                <div key={s.label} style={{
                  paddingLeft: i === 0 ? 0 : 20,
                  paddingRight: i === 2 ? 0 : 20,
                  borderLeft: i > 0 ? "1px solid var(--vf-border-2)" : "none"
                }}>
                    <div style={{
                    font: "500 clamp(36px,3.4vw,48px)/1 var(--vf-font-sans)",
                    letterSpacing: "-0.022em", color: "var(--vf-fg-1)",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                      <CountUp to={s.v} suffix={s.suffix} />
                    </div>
                    <div style={{ font: "400 13px/1.4 var(--vf-font-sans)", color: "var(--vf-fg-3)", marginTop: 10, maxWidth: 140 }}>
                      {s.label}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={260}>
              <Btn variant="dark" size="md" pill onClick={() => onCta && onCta("Apriamo Chi Siamo…")}>
                Scopri di più →
              </Btn>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>);

};

window.VFProcessoChisiamo = { Processo, ChiSiamo };
Object.assign(window, window.VFProcessoChisiamo);