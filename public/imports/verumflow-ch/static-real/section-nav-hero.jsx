/* global React, Container, Overline, SerifAccent, Btn, Icon, Reveal */
const { useState: useStateNH, useEffect: useEffectNH, useRef: useRefNH } = React;

/* ============================================================ Section 0 — Floating Glass Nav (responsive + hamburger) */
const Nav = ({ onCta }) => {
  const [scrolled, setScrolled] = useStateNH(false);
  const [mobileOpen, setMobileOpen] = useStateNH(false);
  useEffectNH(() => {
    const onS = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onS);return () => window.removeEventListener("scroll", onS);
  }, []);
  useEffectNH(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);
  const links = [
    { label: "Servizi", href: "servizi.html" },
    { label: "Case studies", href: "case-studies.html" },
    { label: "Chi siamo", href: "#chi-siamo" },
    { label: "Contatti", href: "contatti.html" }
  ];
  return (
    <>
    <div style={{
      position: "fixed", top: 16, left: 0, right: 0, zIndex: 80,
      display: "flex", justifyContent: "center", padding: "0 16px",
      pointerEvents: "none"
    }}>
      <nav style={{
        pointerEvents: "auto",
        display: "flex", alignItems: "center", gap: 32,
        maxWidth: 1100, width: "100%",
        padding: "10px 12px 10px 20px",

        background: scrolled ? "rgba(15,17,19,0.28)" : "rgba(15,17,19,0.14)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.14)" : "0 4px 20px rgba(0,0,0,0.08)",
        transition: "all var(--vf-dur-3) var(--vf-ease-out)", borderRadius: "10px"
      }}>
        <a href="index.html" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
          <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 28, height: 28, borderRadius: 8, display: "block" }} />
          <span style={{ font: "600 16px/1 var(--vf-font-sans)", letterSpacing: "-0.012em", color: "#fff" }}>VerumFlow</span>
        </a>
        <div className="vf-nav-links-desktop" style={{ display: "flex", gap: 26, marginLeft: "auto" }}>
          {links.map((l) =>
          <a key={l.label} href={l.href} style={{
            font: "500 13.5px/1 var(--vf-font-sans)",
            color: "rgba(242,242,242,0.78)",
            textDecoration: "none", cursor: "pointer",
            transition: "color var(--vf-dur-2) var(--vf-ease-out)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(242,242,242,0.78)"}>
            {l.label}</a>
          )}
        </div>
        <div className="vf-nav-cta-desktop">
          <Btn variant="primary" size="sm" pill href="book.html">Prenota VerumAudit →</Btn>
        </div>
        {/* Hamburger — mobile only */}
        <button
          className="vf-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Apri menu"
          style={{
            marginLeft: "auto",
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#fff", cursor: "pointer",
            alignItems: "center", justifyContent: "center"
          }}>
          <Icon name="menu" size={22} color="currentColor" />
        </button>
      </nav>
    </div>
    {/* Mobile drawer */}
    <div className={"vf-mobile-menu" + (mobileOpen ? " in" : "")} role="dialog" aria-hidden={!mobileOpen}>
      <button className="vf-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Chiudi menu">
        <Icon name="x" size={20} color="currentColor" />
      </button>
      <a href="index.html" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, borderBottom: "none", padding: 4, fontSize: 18 }}>
        <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
        VerumFlow
      </a>
      {links.map((l) => (
        <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
      ))}
      <div style={{ marginTop: 32 }}>
        <Btn variant="primary" size="lg" pill href="book.html" style={{ width: "100%", justifyContent: "center" }}>
          Prenota VerumAudit →
        </Btn>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 24, font: "400 13px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)" }}>
        Canton Ticino, Svizzera<br />
        <a href="mailto:hello@verumflow.com" style={{ color: "rgba(242,242,242,0.7)", borderBottom: "none", padding: "4px 0", fontSize: 14, display: "inline-block" }}>hello@verumflow.com</a>
      </div>
    </div>
    </>);

};

/* ============================================================ Section 1 — HERO (Tello-replica layout) */
const Hero = ({ onCta }) => {
  const industries = [
  "Real Estate.",
  "Hospitality.",
  "Servizi pro.",
  "Manifattura.",
  "Retail locale."];

  const [idx, setIdx] = useStateNH(0);
  useEffectNH(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % industries.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="top" style={{
      position: "relative", minHeight: "min(100vh, 820px)", height: "min(100vh, 820px)",
      background: "var(--vf-ink)",
      color: "#F2F2F2", overflow: "hidden"
    }}>
      {/* Plasma-lamp animated gradient background */}
      <PlasmaBackdrop />

      {/* Hero content — anchored to lower-third like Tello (title block sits ~52% down) */}
      <div className="vf-hero-bottom" style={{
        position: "absolute", left: 0, right: 0, bottom: 150, zIndex: 2,
        padding: "0 56px"
      }}>
        <div className="vf-grid-7-5" style={{
          maxWidth: 1440, width: "100%", margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
          columnGap: 64, alignItems: "end"
        }}>
          {/* LEFT — H1 + sub */}
          <div>
            <Reveal>
              <h1 style={{
                font: "500 clamp(40px, 4.6vw, 68px)/1.06 var(--vf-font-sans)",
                letterSpacing: "-0.02em",
                margin: "0 0 24px",
                color: "#FFFFFF",
                textWrap: "balance",
                maxWidth: 640
              }}>
                Sistemi gestionali su misura<br />
                per <SerifAccent>micro-imprese</SerifAccent> moderne
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p style={{
                font: "400 14px/1.65 var(--vf-font-sans)",
                color: "rgba(255,255,255,0.72)",
                margin: 0, maxWidth: 420
              }}>
                Il nostro team di designer e sviluppatori AI-native costruisce
                pipeline gestionali che centralizzano i tuoi dati e automatizzano
                le operazioni — in 14 giorni, su misura per come lavora la tua azienda.
              </p>
            </Reveal>
          </div>

          {/* RIGHT — "for [Industry]" with thin underline */}
          <Reveal delay={200}>
            <div style={{ paddingBottom: 8 }}>
              <div style={{
                font: "400 italic 18px/1 var(--vf-font-serif)",
                color: "rgba(255,255,255,0.78)",
                marginBottom: 4
              }}>
                per
              </div>
              <div style={{ position: "relative", height: 64, overflow: "hidden" }}>
                {industries.map((ind, i) =>
                <div key={ind} style={{
                  position: "absolute", inset: 0,
                  font: "500 clamp(36px, 3.6vw, 52px)/1 var(--vf-font-sans)",
                  letterSpacing: "-0.02em",
                  color: "#FFFFFF",
                  opacity: i === idx ? 1 : 0,
                  transform: i === idx ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 600ms var(--vf-ease-out), transform 600ms var(--vf-ease-out)",
                  display: "flex", alignItems: "flex-start"
                }}>
                    {ind}
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.32)", marginTop: 12, width: "100%" }} />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Bottom row — Trusted by + logos + chat bubble + CONTACT US (Tello-replica) */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 36, zIndex: 3,
        padding: "0 56px"
      }}>
        <div style={{
          maxWidth: 1440, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "nowrap", minWidth: 0
        }}>
          {/* Trusted by + logos pill */}
          <div className="vf-hero-trustpill" style={{
            display: "inline-flex", alignItems: "center", gap: 22,
            padding: "14px 22px",

            background: "rgba(20,18,16,0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            minWidth: 0, flexShrink: 1, overflow: "hidden", borderRadius: "20px 20px 0px"
          }}>
            <span style={{
              font: "500 12px/1 var(--vf-font-sans)",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.02em", whiteSpace: "nowrap", flexShrink: 0
            }}>Trusted by:</span>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 1, minWidth: 0, overflow: "hidden" }}>
              {/* 6 logo placeholders — embossed grey, like Tello's grey logo strip */}
              {[
              <LogoMark key="l1" label="A&F" />,
              <LogoMark key="l2" label="LOGO" boxed />,
              <LogoMark key="l3" label="LOGOIPSUM" small />,
              <LogoMark key="l4" label="logoipsum" italic />,
              <LogoMark key="l5" label="N" mono />,
              <LogoMark key="l6" label="∞" symbol />]
              }
            </div>
          </div>

        </div>
      </div>
    </section>);

};

/* Logo placeholder — embossed/grey style matching Tello's logo strip */
const LogoMark = ({ label, boxed, small, italic, mono, symbol }) => {
  const base = {
    color: "rgba(255,255,255,0.42)",
    fontFamily: "var(--vf-font-sans)",
    fontWeight: 700,
    letterSpacing: "0.06em",
    fontSize: 14,
    textShadow: "0 1px 0 rgba(0,0,0,0.25), 0 -1px 0 rgba(255,255,255,0.06)"
  };
  if (boxed) return (
    <span style={{
      ...base,
      padding: "4px 10px",
      border: "1px solid rgba(255,255,255,0.32)",
      borderRadius: 4,
      fontSize: 13,
      letterSpacing: "0.12em"
    }}>{label}</span>);

  if (small) return <span style={{ ...base, fontSize: 11, letterSpacing: "0.16em" }}>{label}</span>;
  if (italic) return <span style={{ ...base, fontStyle: "italic", fontSize: 13, letterSpacing: "0.04em" }}>{label}</span>;
  if (mono) return (
    <span style={{ ...base, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4,
        background: "rgba(255,255,255,0.22)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "rgba(20,18,16,0.7)", fontSize: 11, fontWeight: 800
      }}>N</span>
    </span>);

  if (symbol) return <span style={{ ...base, fontSize: 22, letterSpacing: 0 }}>{label}</span>;
  return <span style={base}>{label}</span>;
};

/* ============================================================ Plasma-lamp animated gradient backdrop */
const PlasmaBackdrop = () => {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", background: "var(--vf-ink)" }}>
      {/* Base warm-dark wash */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 90% 70% at 50% 50%, #1A1410 0%, #0F0D0B 70%, #08070A 100%)"
      }} />
      {/* Plasma blobs — heavy blur + screen blend, very slow drift */}
      <div className="vf-plasma-stage" style={{ position: "absolute", inset: "-15%", filter: "blur(80px) saturate(1.4)" }}>
        <span className="vf-plasma vf-plasma--a" />
        <span className="vf-plasma vf-plasma--b" />
        <span className="vf-plasma vf-plasma--c" />
        <span className="vf-plasma vf-plasma--d" />
        <span className="vf-plasma vf-plasma--e" />
      </div>
      {/* Grain + vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 30%, rgba(8,7,10,0.55) 100%)"
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06, mixBlendMode: "overlay",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")"
      }} />
      <style>{`
        .vf-plasma-stage { mix-blend-mode: screen; }
        .vf-plasma {
          position: absolute; display: block;
          border-radius: 50%;
          will-change: transform, opacity;
          opacity: 0.85;
        }
        .vf-plasma--a {
          width: 56vw; height: 56vw;
          left: -10%; top: -15%;
          background: radial-gradient(circle, #FF7A1A 0%, rgba(255,122,26,0.55) 35%, transparent 70%);
          animation: vfPlasmaA 22s ease-in-out infinite alternate;
        }
        .vf-plasma--b {
          width: 50vw; height: 50vw;
          right: -12%; top: -20%;
          background: radial-gradient(circle, #B83C7E 0%, rgba(184,60,126,0.45) 40%, transparent 70%);
          animation: vfPlasmaB 28s ease-in-out infinite alternate;
        }
        .vf-plasma--c {
          width: 60vw; height: 60vw;
          left: 10%; bottom: -25%;
          background: radial-gradient(circle, #3A5CFF 0%, rgba(58,92,255,0.4) 40%, transparent 70%);
          animation: vfPlasmaC 26s ease-in-out infinite alternate;
        }
        .vf-plasma--d {
          width: 44vw; height: 44vw;
          right: -8%; bottom: -10%;
          background: radial-gradient(circle, #FF9E5A 0%, rgba(255,158,90,0.45) 40%, transparent 70%);
          animation: vfPlasmaD 24s ease-in-out infinite alternate;
        }
        .vf-plasma--e {
          width: 38vw; height: 38vw;
          left: 30%; top: 20%;
          background: radial-gradient(circle, #6B3FCC 0%, rgba(107,63,204,0.35) 45%, transparent 70%);
          animation: vfPlasmaE 30s ease-in-out infinite alternate;
        }
        @keyframes vfPlasmaA {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(8vw,6vh) scale(1.15); }
          100% { transform: translate(-4vw,12vh) scale(0.95); }
        }
        @keyframes vfPlasmaB {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-10vw,8vh) scale(1.2); }
          100% { transform: translate(-4vw,18vh) scale(0.9); }
        }
        @keyframes vfPlasmaC {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-6vw,-8vh) scale(1.1); }
          100% { transform: translate(8vw,-4vh) scale(1.25); }
        }
        @keyframes vfPlasmaD {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-12vw,-10vh) scale(1.15); }
          100% { transform: translate(-4vw,-2vh) scale(0.95); }
        }
        @keyframes vfPlasmaE {
          0%   { transform: translate(0,0) scale(1); opacity: 0.7; }
          50%  { transform: translate(10vw,-12vh) scale(1.2); opacity: 0.9; }
          100% { transform: translate(-6vw,8vh) scale(1.05); opacity: 0.6; }
        }
      `}</style>
    </div>);

};

window.VFNavHero = { Nav, Hero, PlasmaBackdrop };
Object.assign(window, window.VFNavHero);