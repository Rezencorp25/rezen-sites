/* global React, Btn, Icon, PageNav, PageFooter, PageHero */
const { useState: useStateBK } = React;

const SECTORS = ["Real Estate / Immobiliare", "Hospitality / Affitti", "Servizi professionali", "Manifattura", "Retail / E-commerce", "Altro"];
const SIZES = ["1–4 dipendenti", "5–10 dipendenti", "11–20 dipendenti", "21+ dipendenti"];
const GOALS = [
  { id: "centralize", icon: "database", title: "Centralizzare i dati", sub: "Unificare CRM, fatturazione, prenotazioni, magazzino." },
  { id: "automate", icon: "workflow", title: "Automatizzare task ripetitivi", sub: "Email, contratti, follow-up, report." },
  { id: "kpi", icon: "bar-chart-3", title: "Visibilità KPI", sub: "Dashboard real-time su revenue, costi, performance." },
  { id: "ai", icon: "sparkles", title: "Integrare AI nei workflow", sub: "Agent specializzati sui tuoi processi." },
  { id: "replace", icon: "replace", title: "Sostituire SaaS rigidi", sub: "Costruire un sistema su misura, niente licenze ricorrenti." },
  { id: "discovery", icon: "compass", title: "Sto ancora esplorando", sub: "Voglio capire cosa potresti fare per la mia impresa." }
];

const TIMES = ["09:00", "10:30", "14:00", "15:30", "17:00"];

const Booking = () => {
  const [step, setStep] = useStateBK(1);
  const [data, setData] = useStateBK({
    company: "", name: "", email: "", phone: "",
    sector: "", size: "",
    goals: [],
    notes: "",
    date: "", time: ""
  });
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const toggleGoal = (id) => {
    setData((d) => ({ ...d, goals: d.goals.includes(id) ? d.goals.filter((g) => g !== id) : [...d.goals, id] }));
  };

  const stepValid = () => {
    if (step === 1) return data.company && data.name && data.email && data.sector && data.size;
    if (step === 2) return data.goals.length > 0;
    if (step === 3) return data.date && data.time;
    return true;
  };

  /* Generate next 14 days, skip Sundays */
  const days = [];
  const today = new Date();
  for (let i = 1; days.length < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue;
    days.push(d);
  }
  const fmtDay = (d) => d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div>
      <PageNav />
      <PageHero
        overline="VerumAudit · 45 minuti, voice-AI"
        title={<>Prenota un audit <span style={{ fontFamily: "var(--vf-font-serif)", fontStyle: "italic", color: "var(--vf-amber)" }}>gratuito</span></>}
        sub="Tre voice agent specializzati conducono l'audit con te e il tuo team. Entro 72 ore ricevi il blueprint con preventivo fisso. Nessun contratto vincolante prima."
      />

      <section style={{ padding: "32px 0 120px" }} className="vf-section">
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 32px" }}>
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
            {[1, 2, 3, 4].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px",
                  background: step === s ? "var(--vf-ink)" : (s < step ? "var(--vf-amber-tint)" : "var(--vf-bg-warm-2)"),
                  border: `1px solid ${step === s ? "var(--vf-ink)" : (s < step ? "var(--vf-amber)" : "var(--vf-border-2)")}`,
                  color: step === s ? "var(--vf-bg-warm)" : (s < step ? "var(--vf-amber-700)" : "var(--vf-fg-3)"),
                  borderRadius: 999,
                  font: "500 13px/1 var(--vf-font-sans)",
                  transition: "all var(--vf-dur-3) var(--vf-ease-out)"
                }}>
                  {s < step ? <Icon name="check" size={14} color="currentColor" /> : <span style={{ fontVariantNumeric: "tabular-nums" }}>0{s}</span>}
                  <span>{["Azienda", "Obiettivi", "Data", "Conferma"][i]}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, minWidth: 12, height: 1, background: s < step ? "var(--vf-amber)" : "var(--vf-border-1)" }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{
            background: "var(--vf-bg-warm-2)",
            border: "1px solid var(--vf-border-2)",
            borderRadius: 16,
            padding: "40px"
          }} className="vf-cta-pad">

            {step === 1 && <Step1 data={data} set={set} />}
            {step === 2 && <Step2 data={data} set={set} toggleGoal={toggleGoal} />}
            {step === 3 && <Step3 data={data} set={set} days={days} fmtDay={fmtDay} />}
            {step === 4 && <Step4 data={data} fmtDay={fmtDay} />}

            {/* Nav */}
            <div style={{
              marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--vf-border-1)",
              display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap"
            }}>
              {step > 1 && step < 4 ? (
                <button onClick={() => setStep(step - 1)} style={btnGhost}>← Indietro</button>
              ) : <span />}

              {step < 4 ? (
                <button
                  onClick={() => stepValid() && setStep(step + 1)}
                  disabled={!stepValid()}
                  style={{
                    ...btnPrimary,
                    opacity: stepValid() ? 1 : 0.45,
                    cursor: stepValid() ? "pointer" : "not-allowed"
                  }}>
                  {step === 3 ? "Conferma prenotazione →" : "Continua →"}
                </button>
              ) : (
                <Btn variant="primary" size="lg" pill href="index.html" style={{ marginLeft: "auto" }}>
                  Torna alla home →
                </Btn>
              )}
            </div>
          </div>

          {/* What happens next */}
          {step < 4 && (
            <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="vf-grid-2">
              <NextStep n="01" t="Voice-AI Audit" d="45 minuti, in italiano, con il tuo team. Tre agent specializzati su business, tech e dati." />
              <NextStep n="02" t="Blueprint" d="Entro 72 ore: documento tecnico, mockup, preventivo fisso, timeline." />
              <NextStep n="03" t="Go-live" d="14 giorni dopo l'approvazione. Codice tuo, documentato." />
            </div>
          )}
        </div>
      </section>

      <PageFooter />
    </div>
  );
};

const NextStep = ({ n, t, d }) => (
  <div style={{ background: "var(--vf-bg-warm)", border: "1px solid var(--vf-border-1)", borderRadius: 12, padding: 20 }}>
    <div style={{ font: "500 11px/1 var(--vf-font-sans)", letterSpacing: "0.08em", color: "var(--vf-amber)", marginBottom: 8 }}>{n}</div>
    <div style={{ font: "600 15px/1.3 var(--vf-font-sans)", color: "var(--vf-ink)", marginBottom: 6 }}>{t}</div>
    <div style={{ font: "400 13px/1.5 var(--vf-font-sans)", color: "var(--vf-fg-2)" }}>{d}</div>
  </div>
);

const Step1 = ({ data, set }) => (
  <div>
    <h2 style={stepTitle}>Parlami della tua impresa</h2>
    <p style={stepSub}>Sentiti libero di essere conciso — durante l'audit andiamo nei dettagli.</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="vf-grid-2">
      <Field label="Nome dell'azienda" required>
        <input value={data.company} onChange={(e) => set("company", e.target.value)} placeholder="Es. Studio Rossi SA" style={inputStyle} />
      </Field>
      <Field label="Il tuo nome" required>
        <input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome e cognome" style={inputStyle} />
      </Field>
      <Field label="Email di lavoro" required>
        <input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@azienda.com" style={inputStyle} />
      </Field>
      <Field label="Telefono (opzionale)">
        <input value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+41 …" style={inputStyle} />
      </Field>
      <Field label="Settore" required>
        <select value={data.sector} onChange={(e) => set("sector", e.target.value)} style={inputStyle}>
          <option value="">Seleziona settore…</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Dimensione team" required>
        <select value={data.size} onChange={(e) => set("size", e.target.value)} style={inputStyle}>
          <option value="">Seleziona…</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
    </div>
  </div>
);

const Step2 = ({ data, set, toggleGoal }) => (
  <div>
    <h2 style={stepTitle}>Cosa vuoi ottenere?</h2>
    <p style={stepSub}>Seleziona uno o più obiettivi. Ci serve per preparare i giusti agent per l'audit.</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="vf-grid-2">
      {GOALS.map((g) => {
        const sel = data.goals.includes(g.id);
        return (
          <button key={g.id} onClick={() => toggleGoal(g.id)} style={{
            textAlign: "left", padding: 20,
            background: sel ? "var(--vf-amber-tint)" : "var(--vf-bg-warm)",
            border: `1.5px solid ${sel ? "var(--vf-amber)" : "var(--vf-border-2)"}`,
            borderRadius: 12, cursor: "pointer",
            transition: "all var(--vf-dur-2) var(--vf-ease-out)",
            fontFamily: "inherit"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: sel ? "var(--vf-amber)" : "var(--vf-bg-warm-3)",
                color: sel ? "#fff" : "var(--vf-fg-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <Icon name={g.icon} size={18} color="currentColor" />
              </div>
              <div>
                <div style={{ font: "600 14px/1.3 var(--vf-font-sans)", color: "var(--vf-ink)", marginBottom: 4 }}>{g.title}</div>
                <div style={{ font: "400 13px/1.5 var(--vf-font-sans)", color: "var(--vf-fg-2)" }}>{g.sub}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
    <Field label="Note aggiuntive (opzionale)" style={{ marginTop: 24 }}>
      <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)}
        rows={3} placeholder="Hai un problema specifico in mente? Tool che già usi e vorresti integrare?"
        style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical", minHeight: 80 }} />
    </Field>
  </div>
);

const Step3 = ({ data, set, days, fmtDay }) => (
  <div>
    <h2 style={stepTitle}>Quando vuoi fare l'audit?</h2>
    <p style={stepSub}>Slot di 45 minuti. Fuso CET (Europa/Zurigo). Confermiamo via email entro 2 ore.</p>
    <div style={{ marginBottom: 24 }}>
      <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 12 }}>
        Scegli il giorno
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {days.map((d) => {
          const v = d.toISOString().slice(0, 10);
          const sel = data.date === v;
          return (
            <button key={v} onClick={() => set("date", v)} style={{
              padding: "10px 14px",
              background: sel ? "var(--vf-ink)" : "var(--vf-bg-warm)",
              border: `1.5px solid ${sel ? "var(--vf-ink)" : "var(--vf-border-2)"}`,
              color: sel ? "var(--vf-bg-warm)" : "var(--vf-ink)",
              borderRadius: 10, cursor: "pointer",
              font: "500 13px/1.2 var(--vf-font-sans)", fontFamily: "inherit",
              minWidth: 92, textAlign: "center"
            }}>
              {fmtDay(d)}
            </button>
          );
        })}
      </div>
    </div>
    {data.date && (
      <div>
        <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)", marginBottom: 12 }}>
          Scegli l'orario
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TIMES.map((t) => {
            const sel = data.time === t;
            return (
              <button key={t} onClick={() => set("time", t)} style={{
                padding: "10px 18px",
                background: sel ? "var(--vf-amber)" : "var(--vf-bg-warm)",
                border: `1.5px solid ${sel ? "var(--vf-amber)" : "var(--vf-border-2)"}`,
                color: sel ? "#fff" : "var(--vf-ink)",
                borderRadius: 10, cursor: "pointer",
                font: "500 14px/1 var(--vf-font-sans)", fontFamily: "inherit",
                fontVariantNumeric: "tabular-nums"
              }}>{t}</button>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

const Step4 = ({ data, fmtDay }) => {
  const date = data.date ? new Date(data.date) : null;
  return (
    <div>
      <div style={{
        width: 64, height: 64, borderRadius: 999,
        background: "var(--vf-amber-tint)", color: "var(--vf-amber)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24
      }}>
        <Icon name="check" size={32} color="currentColor" />
      </div>
      <h2 style={stepTitle}>Prenotazione confermata</h2>
      <p style={stepSub}>
        Grazie {data.name}. Riceverai un'email a <strong style={{ color: "var(--vf-ink)" }}>{data.email}</strong> con i dettagli della call e una breve checklist da compilare prima dell'audit.
      </p>
      <div style={{ background: "var(--vf-bg-warm)", border: "1px solid var(--vf-border-1)", borderRadius: 12, padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--vf-border-1)" }}>
          <span style={{ color: "var(--vf-fg-2)" }}>Azienda</span>
          <span style={{ fontWeight: 600 }}>{data.company}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--vf-border-1)" }}>
          <span style={{ color: "var(--vf-fg-2)" }}>Settore</span>
          <span style={{ fontWeight: 600 }}>{data.sector}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--vf-border-1)" }}>
          <span style={{ color: "var(--vf-fg-2)" }}>Quando</span>
          <span style={{ fontWeight: 600 }}>{date && fmtDay(date)} · {data.time}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <span style={{ color: "var(--vf-fg-2)" }}>Durata</span>
          <span style={{ fontWeight: 600 }}>45 minuti</span>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children, style = {} }) => (
  <label style={{ display: "block", ...style }}>
    <div style={{ font: "500 13px/1 var(--vf-font-sans)", color: "var(--vf-fg-2)", marginBottom: 8 }}>
      {label} {required && <span style={{ color: "var(--vf-amber)" }}>*</span>}
    </div>
    {children}
  </label>
);

const inputStyle = {
  width: "100%", padding: "12px 14px",
  background: "var(--vf-bg-warm)",
  border: "1.5px solid var(--vf-border-2)",
  borderRadius: 8,
  font: "400 14px/1.4 var(--vf-font-sans)",
  fontFamily: "inherit",
  color: "var(--vf-ink)",
  outline: "none",
  transition: "border-color var(--vf-dur-2) var(--vf-ease-out), box-shadow var(--vf-dur-2) var(--vf-ease-out)"
};

const stepTitle = {
  font: "500 clamp(24px, 3vw, 32px)/1.2 var(--vf-font-sans)",
  letterSpacing: "-0.018em", color: "var(--vf-ink)",
  margin: "0 0 8px"
};
const stepSub = {
  font: "400 15px/1.55 var(--vf-font-sans)",
  color: "var(--vf-fg-2)", margin: "0 0 32px", maxWidth: 560
};

const btnPrimary = {
  padding: "12px 24px",
  background: "var(--vf-amber)", color: "#fff", border: "none",
  borderRadius: 999, cursor: "pointer",
  font: "500 14px/1 var(--vf-font-sans)", fontFamily: "inherit",
  marginLeft: "auto"
};
const btnGhost = {
  padding: "12px 18px",
  background: "transparent", color: "var(--vf-ink)",
  border: "1px solid var(--vf-border-2)",
  borderRadius: 999, cursor: "pointer",
  font: "500 14px/1 var(--vf-font-sans)", fontFamily: "inherit"
};

window.Booking = Booking;
