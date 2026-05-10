/* global React */
const { useState, useEffect, useRef } = React;

const Icon = ({ name, size = 20, className = "", style = {}, color }) => (
  <i data-lucide={name} style={{ width: size, height: size, color, ...style }} className={className}></i>
);

const Container = ({ children, style = {}, max = 1280 }) => (
  <div style={{ maxWidth: max, margin: "0 auto", padding: "0 32px", ...style }}>{children}</div>
);

const Overline = ({ children, dark = false, color }) => (
  <span style={{
    font: "500 12px/1 var(--vf-font-sans)", letterSpacing: "0.05em",
    textTransform: "uppercase", color: color || (dark ? "var(--vf-fg-on-dark-3)" : "var(--vf-fg-3)"),
    display: "inline-block",
  }}>
    <span style={{ opacity: 0.6 }}>[ </span>{children}<span style={{ opacity: 0.6 }}> ]</span>
  </span>
);

const SerifAccent = ({ children, color = "var(--vf-amber)" }) => (
  <span style={{
    fontFamily: "var(--vf-font-serif)", fontStyle: "italic", fontWeight: 400,
    color, fontSize: "1.08em", lineHeight: 1, letterSpacing: 0,
  }}>{children}</span>
);

/* Pill-style button (for CTAs that want pill radius). */
const Btn = ({ children, variant = "primary", size = "md", onClick, style = {}, pill = false, href }) => {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const palettes = {
    primary: { bg: hover ? "var(--vf-amber-700)" : "var(--vf-amber)", color: "#fff", border: "transparent" },
    secondary: { bg: hover ? "var(--vf-bg-warm-2)" : "var(--vf-bg-warm)", color: "var(--vf-fg-1)", border: hover ? "var(--vf-border-3)" : "var(--vf-border-2)" },
    ghost: { bg: hover ? "var(--vf-bg-warm-2)" : "transparent", color: "var(--vf-fg-1)", border: hover ? "var(--vf-border-3)" : "var(--vf-border-2)" },
    dark: { bg: hover ? "var(--vf-ink-2)" : "var(--vf-ink)", color: "var(--vf-bg-warm)", border: "transparent" },
    "dark-ghost": { bg: hover ? "rgba(255,255,255,0.06)" : "transparent", color: "var(--vf-bg-warm)", border: hover ? "rgba(255,122,26,0.5)" : "rgba(242,242,242,0.2)" },
  };
  const p = palettes[variant] || palettes.primary;
  const heights = { sm: 36, md: 44, lg: 52 };
  const fontSize = { sm: 13, md: 14, lg: 15 };
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        height: heights[size], padding: `0 ${size === "sm" ? 16 : size === "lg" ? 24 : 20}px`,
        background: p.bg, color: p.color, border: `1px solid ${p.border}`,
        borderRadius: pill ? "var(--vf-radius-pill)" : "var(--vf-radius-2)",
        cursor: "pointer", textDecoration: "none",
        font: `500 ${fontSize[size]}px/1 var(--vf-font-sans)`, letterSpacing: "-0.005em",
        display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: variant === "primary" && hover ? "0 8px 24px rgba(255,122,26,0.35)" : (variant === "primary" ? "var(--vf-shadow-1)" : "none"),
        transform: press ? "translateY(1px)" : "translateY(0)",
        transition: "all var(--vf-dur-2) var(--vf-ease-out)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >{children}</Tag>
  );
};

/* Reveal-on-scroll wrapper */
const Reveal = ({ children, delay = 0, style = {} }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={"vf-reveal" + (visible ? " in" : "")} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
};

/* Count-up number */
const CountUp = ({ to, suffix = "", duration = 1400, format }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - k, 3);
          setN(to * eased);
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  const display = format ? format(n) : Math.round(n);
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{display}{suffix}</span>;
};

window.VFP = { Icon, Container, Overline, SerifAccent, Btn, Reveal, CountUp };
Object.assign(window, window.VFP);
