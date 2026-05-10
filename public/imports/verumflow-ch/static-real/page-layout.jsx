/* global React, Btn, Icon, Container */
const { useState: useStatePL, useEffect: useEffectPL } = React;

/* Light Nav for inner pages — sits on warm bg, not floating */
const PageNav = () => {
  const [scrolled, setScrolled] = useStatePL(false);
  const [mobileOpen, setMobileOpen] = useStatePL(false);
  useEffectPL(() => {
    const onS = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onS);return () => window.removeEventListener("scroll", onS);
  }, []);
  useEffectPL(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {document.body.style.overflow = "";};
  }, [mobileOpen]);
  const links = [
  { label: "Servizi", href: "servizi.html" },
  { label: "Case studies", href: "case-studies.html" },
  { label: "Contatti", href: "contatti.html" }];

  return (
    <>
    <header style={{
        position: "sticky", top: 0, zIndex: 80,
        background: scrolled ? "rgba(242,242,242,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--vf-border-1)" : "1px solid transparent",
        transition: "all var(--vf-dur-3) var(--vf-ease-out)"
      }}>
      <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "16px 32px",
          display: "flex", alignItems: "center", gap: 32
        }}>
        <a href="index.html" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--vf-ink)" }}>
          <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 30, height: 30, borderRadius: 8, display: "block" }} />
          <span style={{ font: "600 16px/1 var(--vf-font-sans)", letterSpacing: "-0.012em" }}>VerumFlow</span>
        </a>
        <nav className="vf-nav-links-desktop" style={{ display: "flex", gap: 28, marginLeft: "auto" }}>
          {links.map((l) =>
            <a key={l.label} href={l.href} style={{
              font: "500 14px/1 var(--vf-font-sans)",
              color: "var(--vf-fg-2)",
              textDecoration: "none",
              transition: "color var(--vf-dur-2) var(--vf-ease-out)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--vf-ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--vf-fg-2)"}>
              {l.label}
            </a>
            )}
        </nav>
        <div className="vf-nav-cta-desktop">
          <Btn variant="primary" size="sm" pill href="book.html">Prenota VerumAudit →</Btn>
        </div>
        <button
            className="vf-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Apri menu"
            style={{
              marginLeft: "auto",
              width: 44, height: 44, borderRadius: 10,
              background: "var(--vf-bg-warm-2)",
              border: "1px solid var(--vf-border-2)",
              color: "var(--vf-ink)", cursor: "pointer",
              alignItems: "center", justifyContent: "center"
            }}>
          <Icon name="menu" size={22} color="currentColor" />
        </button>
      </div>
    </header>
    <div className={"vf-mobile-menu" + (mobileOpen ? " in" : "")}>
      <button className="vf-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Chiudi menu">
        <Icon name="x" size={20} color="currentColor" />
      </button>
      <a href="index.html" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: "none", padding: 4 }}>
        <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
        VerumFlow
      </a>
      {links.map((l) =>
        <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
        )}
      <div style={{ marginTop: 32 }}>
        <Btn variant="primary" size="lg" pill href="book.html" style={{ width: "100%", justifyContent: "center" }}>
          Prenota VerumAudit →
        </Btn>
      </div>
    </div>
    </>);

};

/* Compact footer for inner pages */
const PageFooter = () =>
<footer style={{ background: "var(--vf-ink)", color: "#F2F2F2", padding: "64px 0 32px", marginTop: 80 }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
      <div className="vf-footer-grid" style={{
      display: "grid", gridTemplateColumns: "minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr)",
      gap: 48, marginBottom: 48
    }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <img src="assets/logo-v.png" alt="VerumFlow" style={{ width: 30, height: 30, borderRadius: 8, display: "block" }} />
            <span style={{ font: "600 16px/1 var(--vf-font-sans)" }}>VerumFlow</span>
          </div>
          <p style={{ font: "400 13px/1.6 var(--vf-font-sans)", color: "rgba(242,242,242,0.6)", margin: 0, maxWidth: 300 }}>
            AI-native agency. Sistemi gestionali su misura per micro-imprese in Ticino e Nord Italia.
          </p>
        </div>
        <FootColPL title="Esplora" links={[
      { l: "Servizi", h: "servizi.html" },
      { l: "Processo", h: "index.html#processo" },
      { l: "Case studies", h: "case-studies.html" },
      { l: "FAQ", h: "index.html#faq" },
      { l: "Contatti", h: "contatti.html" }]
      } />
        <FootColPL title="Legale" links={[
      { l: "Privacy Policy", h: "privacy.html" },
      { l: "Terms", h: "privacy.html" },
      { l: "Cookie Policy", h: "cookie.html" }]
      } />
        <FootColPL title="Contattaci" links={[
      { l: "sales@verumflow.com", h: "mailto:sales@verumflow.com" },
      { l: "Canton Ticino, CH", h: "contatti.html" }]
      } />
      </div>
      <div style={{
      paddingTop: 24, borderTop: "1px solid rgba(242,242,242,0.08)",
      display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      font: "400 12px/1.4 var(--vf-font-sans)", color: "rgba(242,242,242,0.5)"
    }}>
        <div>© 2026  VerumFlow. created by REZEN</div>
        <div>Canton Ticino, Svizzera</div>
      </div>
    </div>
  </footer>;

const FootColPL = ({ title, links }) =>
<div>
    <div style={{ font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {links.map((l) =>
    <a key={l.l} href={l.h} style={{ font: "400 14px/1 var(--vf-font-sans)", color: "rgba(242,242,242,0.7)", textDecoration: "none" }}
    onMouseEnter={(e) => e.currentTarget.style.color = "var(--vf-amber)"}
    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(242,242,242,0.7)"}>
          {l.l}
        </a>
    )}
    </div>
  </div>;


/* Page hero — overline + h1 + sub */
const PageHero = ({ overline, title, sub, children }) =>
<section style={{ padding: "120px 0 64px", background: "var(--vf-bg-warm)" }} className="vf-section">
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
      {overline &&
    <div style={{ marginBottom: 20, font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--vf-fg-3)" }}>
          <span style={{ opacity: 0.6 }}>[ </span>{overline}<span style={{ opacity: 0.6 }}> ]</span>
        </div>
    }
      <h1 className="vf-h1-resp" style={{
      font: "500 clamp(36px, 5vw, 64px)/1.05 var(--vf-font-sans)",
      letterSpacing: "-0.022em", margin: 0, color: "var(--vf-ink)", textWrap: "balance",
      maxWidth: 900
    }}>
        {title}
      </h1>
      {sub &&
    <p style={{ font: "400 clamp(16px, 1.4vw, 19px)/1.55 var(--vf-font-sans)", color: "var(--vf-fg-2)", maxWidth: 640, margin: "24px 0 0", textWrap: "pretty" }}>
          {sub}
        </p>
    }
      {children}
    </div>
  </section>;


window.VFPL = { PageNav, PageFooter, PageHero };
Object.assign(window, window.VFPL);