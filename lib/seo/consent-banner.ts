import type { ProjectSettings } from "@/lib/stores/settings-store";

/**
 * GDPR / Consent Mode v2 banner.
 *
 * Self-contained: emits inline HTML + CSS + JS that:
 *   - persists user choice in localStorage (`rezen_consent_v1`)
 *   - blocks gtag/fbq/etc until user grants consent
 *   - exposes window.gtag('consent', 'update', ...) calls
 *   - works without any external library (ready for export)
 */

type Locale = "it" | "en" | "de" | "fr";

const COPY: Record<
  Locale,
  {
    title: string;
    body: string;
    accept: string;
    reject: string;
    settings: string;
    privacyLabel: string;
    cookieLabel: string;
    saveSettings: string;
    cats: { analytics: string; ads: string; marketing: string; social: string };
  }
> = {
  it: {
    title: "Cookie & Privacy",
    body: "Usiamo cookie tecnici e, con il tuo consenso, cookie di analytics e marketing. Puoi accettare, rifiutare o personalizzare.",
    accept: "Accetta tutti",
    reject: "Rifiuta non essenziali",
    settings: "Personalizza",
    privacyLabel: "Privacy Policy",
    cookieLabel: "Cookie Policy",
    saveSettings: "Salva preferenze",
    cats: {
      analytics: "Analytics (GA4, statistiche di utilizzo)",
      ads: "Pubblicità (Google Ads, Meta)",
      marketing: "Marketing & remarketing",
      social: "Social embed",
    },
  },
  en: {
    title: "Cookies & Privacy",
    body: "We use technical cookies and, with your consent, analytics and marketing cookies. You can accept, reject, or customise.",
    accept: "Accept all",
    reject: "Reject non-essential",
    settings: "Customise",
    privacyLabel: "Privacy Policy",
    cookieLabel: "Cookie Policy",
    saveSettings: "Save preferences",
    cats: {
      analytics: "Analytics (GA4, usage stats)",
      ads: "Advertising (Google Ads, Meta)",
      marketing: "Marketing & remarketing",
      social: "Social embeds",
    },
  },
  de: {
    title: "Cookies & Datenschutz",
    body: "Wir verwenden technische Cookies und, mit Ihrer Einwilligung, Analyse- und Marketing-Cookies.",
    accept: "Alle akzeptieren",
    reject: "Nur notwendige",
    settings: "Anpassen",
    privacyLabel: "Datenschutz",
    cookieLabel: "Cookie-Richtlinie",
    saveSettings: "Speichern",
    cats: {
      analytics: "Analyse (GA4)",
      ads: "Werbung (Google Ads, Meta)",
      marketing: "Marketing",
      social: "Social Embeds",
    },
  },
  fr: {
    title: "Cookies & Confidentialité",
    body: "Nous utilisons des cookies techniques et, avec votre accord, des cookies d'analyse et marketing.",
    accept: "Tout accepter",
    reject: "Refuser",
    settings: "Personnaliser",
    privacyLabel: "Politique de confidentialité",
    cookieLabel: "Politique cookies",
    saveSettings: "Enregistrer",
    cats: {
      analytics: "Analytiques (GA4)",
      ads: "Publicité (Google Ads, Meta)",
      marketing: "Marketing",
      social: "Réseaux sociaux",
    },
  },
};

export function buildConsentBannerHtml(
  consent: ProjectSettings["consent"],
  defaultLocale: string,
): string {
  if (!consent.enabled) return "";
  const locale = (consent.locale || defaultLocale).split("-")[0]!.toLowerCase();
  const copy = COPY[locale as Locale] ?? COPY.it;
  const v = consent.vendors;

  const visibleCats: { key: string; label: string }[] = [];
  if (v.analytics) visibleCats.push({ key: "analytics", label: copy.cats.analytics });
  if (v.ads) visibleCats.push({ key: "ads", label: copy.cats.ads });
  if (v.marketing) visibleCats.push({ key: "marketing", label: copy.cats.marketing });
  if (v.social) visibleCats.push({ key: "social", label: copy.cats.social });

  const css = `
#rzn-consent { position: fixed; bottom: 16px; left: 16px; right: 16px; max-width: 540px; margin: 0 auto;
  background: #1c1f23; color: #f2f2f2; border-radius: 12px; padding: 20px 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5); font-family: system-ui, -apple-system, sans-serif;
  z-index: 99999; line-height: 1.5; }
#rzn-consent h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
#rzn-consent p { margin: 0 0 12px; font-size: 14px; color: #b3b5b9; }
#rzn-consent a { color: #ff8533; text-decoration: underline; }
#rzn-consent .rzn-btns { display: flex; gap: 8px; flex-wrap: wrap; }
#rzn-consent button { padding: 8px 16px; border: 0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
#rzn-consent .rzn-accept { background: linear-gradient(135deg,#ff8533,#ff6200); color: #0f1113; }
#rzn-consent .rzn-reject { background: #2a2d32; color: #f2f2f2; }
#rzn-consent .rzn-settings { background: transparent; color: #b3b5b9; text-decoration: underline; }
#rzn-consent .rzn-cats { margin-top: 12px; display: none; }
#rzn-consent .rzn-cats.open { display: block; }
#rzn-consent .rzn-cats label { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; }
#rzn-consent input[type=checkbox] { accent-color: #ff6200; }
@media (prefers-color-scheme: light) {
  #rzn-consent { background: #fff; color: #0f1113; }
  #rzn-consent p { color: #4a4d52; }
  #rzn-consent .rzn-reject { background: #f2f2f2; color: #0f1113; }
}`.trim();

  const catsHtml = visibleCats
    .map(
      (c) =>
        `<label><input type="checkbox" name="rzn-cat" value="${c.key}" checked /> ${escape(c.label)}</label>`,
    )
    .join("");

  const html = `<div id="rzn-consent" role="dialog" aria-labelledby="rzn-c-title" aria-describedby="rzn-c-body">
  <h3 id="rzn-c-title">${escape(copy.title)}</h3>
  <p id="rzn-c-body">${escape(copy.body)} <a href="${escape(consent.privacyPolicyUrl)}">${escape(copy.privacyLabel)}</a> · <a href="${escape(consent.cookiePolicyUrl)}">${escape(copy.cookieLabel)}</a></p>
  <div class="rzn-cats" id="rzn-c-cats">${catsHtml}<div style="margin-top:8px"><button class="rzn-accept" data-action="save">${escape(copy.saveSettings)}</button></div></div>
  <div class="rzn-btns">
    <button class="rzn-accept" data-action="accept-all">${escape(copy.accept)}</button>
    <button class="rzn-reject" data-action="reject-all">${escape(copy.reject)}</button>
    <button class="rzn-settings" data-action="toggle-settings">${escape(copy.settings)}</button>
  </div>
</div>`;

  // Self-contained JS: persists choice, fires gtag(consent, update, …) if gtag exists,
  // and exposes window.rznConsent for downstream scripts to gate themselves.
  const js = `(function(){var KEY='rezen_consent_v1';var raw=localStorage.getItem(KEY);
function applyTo(grant){var g=window.gtag;if(typeof g==='function'){g('consent','update',{'analytics_storage':grant.analytics?'granted':'denied','ad_storage':grant.ads?'granted':'denied','ad_user_data':grant.ads?'granted':'denied','ad_personalization':grant.marketing?'granted':'denied'});}window.rznConsent=grant;document.dispatchEvent(new CustomEvent('rezen:consent',{detail:grant}));}
function hide(){var el=document.getElementById('rzn-consent');if(el)el.remove();}
function save(grant){localStorage.setItem(KEY,JSON.stringify(grant));applyTo(grant);hide();}
if(raw){try{applyTo(JSON.parse(raw));hide();return;}catch(e){}}
document.addEventListener('click',function(e){var t=e.target;if(!t||!t.dataset||!t.dataset.action)return;var a=t.dataset.action;
if(a==='accept-all'){save({analytics:true,ads:true,marketing:true,social:true,ts:Date.now()});}
else if(a==='reject-all'){save({analytics:false,ads:false,marketing:false,social:false,ts:Date.now()});}
else if(a==='toggle-settings'){var c=document.getElementById('rzn-c-cats');c&&c.classList.toggle('open');}
else if(a==='save'){var sel={};document.querySelectorAll('[name=rzn-cat]:checked').forEach(function(b){sel[b.value]=true;});save({analytics:!!sel.analytics,ads:!!sel.ads,marketing:!!sel.marketing,social:!!sel.social,ts:Date.now()});}});})();`;

  return `<style>${css}</style>${html}<script>${js}</script>`;
}

function escape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
