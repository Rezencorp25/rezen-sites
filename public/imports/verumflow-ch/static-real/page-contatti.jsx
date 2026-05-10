/* global React, Btn, Icon, PageNav, PageFooter, PageHero */
const { useState: useStateCT } = React;

const Contatti = () => {
  const [sent, setSent] = useStateCT(false);
  const [form, setForm] = useStateCT({ name: "", email: "", company: "", message: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name && form.email && form.message;
  React.useEffect(() => {
    const tick = () => window.lucide && window.lucide.createIcons();
    tick();
    const id = setInterval(tick, 500);
    setTimeout(() => clearInterval(id), 4000);
  }, [sent]);

  return (
    <div>
      <PageNav />
      <PageHero
        overline="Contatti"
        title={<>Parliamone <span style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)" }}>direttamente</span></>}
        sub="Per un audit gratuito usa il form di booking. Per tutto il resto — domande, partnership, stampa — scrivici qui o via email."
      />
      <section style={{ padding: "32px 0 100px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)", gap: 48 }} className="vf-grid-2">
          <div style={{
            background: "var(--vf-bg-warm-2)",
            border: "1px solid var(--vf-border-2)",
            borderRadius: 16, padding: 40
          }} className="vf-cta-pad">
            {!sent ? (
              <>
                <h2 style={{ font: "500 clamp(24px, 3vw, 32px)/1.2 var(--vf-font-sans)", letterSpacing: "-0.018em", margin: "0 0 8px", color: "var(--vf-ink)" }}>Scrivici</h2>
                <p style={{ font: "400 15px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: "0 0 32px" }}>
                  Risposta entro 1 giorno lavorativo. Per audit, vai su <a href="book.html" style={{ color: "var(--vf-amber)", textDecoration: "none" }}>book.html</a>.
                </p>
                <div style={{ display: "grid", gap: 16 }}>
                  <Field label="Il tuo nome" required>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} placeholder="Nome e cognome" />
                  </Field>
                  <Field label="Email" required>
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} placeholder="nome@azienda.com" />
                  </Field>
                  <Field label="Azienda (opzionale)">
                    <input value={form.company} onChange={(e) => set("company", e.target.value)} style={inputStyle} placeholder="Nome azienda" />
                  </Field>
                  <Field label="Messaggio" required>
                    <textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical", minHeight: 120 }} placeholder="Raccontaci…" />
                  </Field>
                  <button onClick={() => valid && setSent(true)} disabled={!valid}
                    style={{
                      padding: "14px 28px", marginTop: 8,
                      background: "var(--vf-amber)", color: "#fff", border: "none",
                      borderRadius: 999, cursor: valid ? "pointer" : "not-allowed",
                      opacity: valid ? 1 : 0.45,
                      font: "500 14px/1 var(--vf-font-sans)", fontFamily: "inherit",
                      alignSelf: "flex-start", width: "fit-content"
                    }}>
                    Invia messaggio →
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--vf-amber-tint)", color: "var(--vf-amber)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <Icon name="check" size={32} color="currentColor" />
                </div>
                <h2 style={{ font: "500 28px/1.2 var(--vf-font-sans)", letterSpacing: "-0.018em", margin: "0 0 12px", color: "var(--vf-ink)" }}>Messaggio inviato</h2>
                <p style={{ font: "400 15px/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", margin: 0 }}>Ti rispondiamo entro 1 giorno lavorativo a <strong>{form.email}</strong>.</p>
              </div>
            )}
          </div>
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InfoCard icon="mail" title="Email" lines={["sales@verumflow.com"]} link="mailto:sales@verumflow.com" />
            <InfoCard icon="map-pin" title="Sede" lines={["Canton Ticino", "Svizzera"]} />
            <InfoCard icon="clock" title="Orari" lines={["Lun–Ven · 09:00–18:00 CET"]} />
            <div style={{
              background: "var(--vf-ink)", color: "#F2F2F2",
              borderRadius: 16, padding: 28
            }}>
              <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vf-amber)", marginBottom: 12 }}>VerumAudit</div>
              <p style={{ font: "400 14px/1.55 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", margin: "0 0 20px" }}>Per richieste commerciali, prenota direttamente l'audit gratuito.</p>
              <Btn variant="primary" size="md" pill href="book.html">Prenota →</Btn>
            </div>
          </aside>
        </div>
      </section>
      <PageFooter />
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label style={{ display: "block" }}>
    <div style={{ font: "500 13px/1 var(--vf-font-sans)", color: "var(--vf-fg-2)", marginBottom: 8 }}>
      {label} {required && <span style={{ color: "var(--vf-amber)" }}>*</span>}
    </div>
    {children}
  </label>
);
const InfoCard = ({ icon, title, lines, link }) => {
  const Tag = link ? "a" : "div";
  return (
    <Tag href={link} style={{
      background: "var(--vf-bg-warm-2)", border: "1px solid var(--vf-border-2)",
      borderRadius: 12, padding: 20, display: "flex", alignItems: "flex-start", gap: 14,
      textDecoration: "none", color: "inherit", cursor: link ? "pointer" : "default"
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--vf-bg-warm)", color: "var(--vf-fg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={18} color="currentColor" />
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 6 }}>{title}</div>
        {lines.map((l, i) => <div key={i} style={{ font: "400 14px/1.5 var(--vf-font-sans)", color: "var(--vf-ink)" }}>{l}</div>)}
      </div>
    </Tag>
  );
};

const inputStyle = {
  width: "100%", padding: "12px 14px",
  background: "var(--vf-bg-warm)", border: "1.5px solid var(--vf-border-2)",
  borderRadius: 8, font: "400 14px/1.4 var(--vf-font-sans)", fontFamily: "inherit",
  color: "var(--vf-ink)", outline: "none"
};

window.Contatti = Contatti;
