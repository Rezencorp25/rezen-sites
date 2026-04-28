# REZEN Sites — Audit gap SEO/AEO/GEO + Ads/Domains/Analytics

> Documento di consegna allo sviluppatore/team che proseguirà l'implementazione.
> Scritto dalla prospettiva di un SEO operator senior che gestisce 20-50 siti cliente in produzione.
> Audit iniziale: 2026-04-27 (99 gap). Aggiornato in corso d'opera.

## Cronologia interventi

| Data | Batch | Gap chiusi | Note |
|------|-------|-----------|------|
| 2026-04-27 | R1 — Foundations | service-factory cross-cutting (D.28, E.37, E.38, F.54 abilitati) | `lib/services/*` con switch mock/real |
| 2026-04-27 | R2-A — SEO core editor | A.1, A.2, A.4, A.8 (UI), A.10 | SEO editor reale al posto di ModulePlaceholder |
| 2026-04-27 | R2-B — Schema + technical | A.3, A.6, A.8 (enforcement), A.13, B.19, C.20 | JSON-LD auto-iniettato + robots/sitemap + LocalBusiness editor |
| 2026-04-27 | R3 — Multilingua + Compliance + Audit | A.9, E.39, H.73, H.76, C.23, C.24 | hreflang + alert engine reale + GDPR consent + alt enforcement + reviews/NAP audit |
| 2026-04-28 | R4 — Dashboard refactor + AEO + linking | D.28, E.37, A.5, A.X, B.14, G.62 | Dashboard sul service-factory + llms.txt + internal linking + AEO scorer + spam protection |
| 2026-04-28 | R5 — A11y + SSL + tracking + author + form builder | H.75, F.50, D.30, D.29, B.17, G.61, G.63 | A11y audit + SSL UI + UTM builder + conversion wizard + Author E-E-A-T + form builder + CRM webhook |
| 2026-04-28 | R6 — Infra + RBAC + API + anomaly | F.49, F.51, F.52, F.57, I.83, I.86, E.39 ext | DNS UI + email auth + staging generalizzato + uptime monitor + RBAC team + public REST API + anomaly detection |
| 2026-04-28 | R7 — Operational + lead-gen | D.27, G.64, G.65, G.69, I.84, I.97, I.88 | Campaign UI + lead scoring + abandonment + follow-up sequence + audit log + activity feed + scheduled publishing |

**Stato corrente**: 46 gap chiusi su 99 totali. Restano 53.

## Sommario aggiornato

| Area | Gap aperti | P0 | P1 | P2 |
|------|----:|---:|---:|---:|
| A. SEO classico | 4 | 0 | 3 | 1 |
| B. AEO | 3 | 0 | 3 | 0 |
| C. GEO + Local | 4 | 0 | 3 | 1 |
| D. Ads & Paid Media | 6 | 0 | 5 | 1 |
| E. Analytics & Measurement | 9 | 0 | 6 | 3 |
| F. Domain / Hosting / Infra | 8 | 0 | 6 | 2 |
| G. Forms / Leads / CRM | 6 | 0 | 4 | 2 |
| H. Compliance / Legal / A11y | 7 | 0 | 6 | 1 |
| I. Operational / Agency | 11 | 1 | 8 | 2 |
| **TOTALE** | **53** | **1** | **41** | **11** |

---

## A. SEO classico (on-page + technical + off-page)

> Chiusi: A.1, A.2, A.3, A.4, A.5 (R4), A.6, A.8, A.9, A.10, A.13, A.X (R4 llms.txt).

A.7 **rel=nofollow/sponsored/ugc non gestibili.** **P2** → audit link esterni nel contenuto Puck + bulk attribute apply.

A.11 **Backlink monitoring assente.** Zero integrazione Ahrefs/Moz/Semrush, niente import manuale. **P1** → tracker manuale + opzionale API SEO tool per DA + backlink profile.

A.12 **Competitor SEO benchmarking assente.** **P2** → input URL competitor + keyword overlap/gap analysis.

A.Y **Image SEO automatico.** Vision AI auto-alt + dimensioni + formats moderni (webp/avif). **P1** (alt enforcement chiuso in R3.H.76; manca auto-generation + format moderni).

---

## B. AEO (Answer Engine Optimization)

> Chiusi: B.14, B.16 (R4 AEO scorer + passage-level), B.17 (R5 author/reviewedBy + schemaType per Article/NewsArticle/BlogPosting), B.19 (FAQ).

B.15 **AI overview traffic risk modeling assente.** **P1** → integrare Semrush/Moz AEO API o classifier interno + raccomandazioni difensive.
B.18 **Entity optimization assente.** Nessun linking a entità definite (persone, org, concetti). **P1** → entity recognition + entity schema + linking interno a entity pages.

---

## C. GEO (Generative Engine Optimization + Local SEO)

> Chiusi: C.20 (LocalBusiness editor + auto-inject schema), C.23 (Review/AggregateRating in R3), C.24 (NAP audit in R3 alert engine).

C.21 **Service area / multi-location targeting assente.** **P1** → metadata location-aware + landing page templates per location (SerEvice area UI esiste; manca gestione MULTI-location).
C.22 **LocalBusiness/Place schema esiste ma manca preview Google Local Pack.** **P1** → preview "near me" + breadcrumb geo.
C.25 **Local citations management assente.** Apple Maps, Bing, TripAdvisor, directory di settore. **P2** → submission UI + monitoring NAP consistency.
C.26 **GEO snippet optimization assente.** Zero ottimizzazione per query "near me" / local pack / map snippets. **P1** → schema "near me" intent + map-friendly markup (coords, radius).

---

## D. Ads & Paid Media

> R1 ha messo in piedi `lib/services/ads/*` con interfaccia + mock + Google Ads stub (D.28 architettura).

~~D.27 Campaign creation/management~~ — chiuso in R7 (`/analytics/campaigns` con CRUD: nome/platform/objective/budget/landing/status; pause/play; audit log integrato).
~~D.28 Dashboards Google Ads/AdSense mock~~ — chiuso in R4 (dashboard consumano `useAdsData` / `useAdSenseData` async dal service-factory, swap automatico al go-live).
~~D.29 Conversion tracking setup wizard~~ — chiuso in R5 (`/settings/tracking` ha wizard collassabile con 4 step + validazione formati ID GA4/Meta/Ads/AdSense).
~~D.30 UTM auto-generation/validation~~ — chiuso in R5 (UTM builder card in `/settings/tracking` con normalizzazione, warning, copy URL).
D.31 **Ad copy A/B testing infrastruttura assente.** **P1** → headline/copy testing dashboard + automation variant creation via API.
D.32 **Audience segmentation / lookalike export assente.** **P1** → export audiences a Meta/Google da form submissions, behavior, segmenti.
D.33 **Bid strategy optimization mancante.** Solo CPC manuale, niente target CPA/ROAS/maximize conversions. **P1** → config UI + raccomandazioni basate su conv volume + ROAS target.
D.34 **Landing page quality scoring (per ad campaigns) assente.** **P1** → score CWV + load time + content relevance per pagina, flag poor performers.
D.35 **Budget pacing / spend alerts assenti.** **P2** → pacing UI + auto-pause threshold + Slack/email alert overspend.
D.36 **Pixel debug tools assenti.** Verified/unverified flags solo cosmetici. **P1** → debug UI: fire test events + real-time validation + server-side conversion check.

---

## E. Analytics & Measurement

> R1 ha messo in piedi `lib/services/analytics/*` con interfaccia + mock + GA4 stub (E.37+E.38 architettura).

~~E.37 Layer analytics interamente mock~~ — chiuso in R4 (`/analytics` consuma `useAnalyticsData` async dal factory; swap automatico al go-live).
E.38 **GA4 integration vera assente.** Stub class GA4AnalyticsService pronto da implementare. **P0** (al go-live).
~~E.39 Alert engine reale~~ — chiuso in R3 (`lib/seo/alert-engine.ts`, 9 regole live: meta missing, title length, OG image, alt text, redirect issues, FAQ schema gap, NAP consistency, etc.). Estensioni future P1: anomaly detection, GSC crawl errors, form abandonment.
E.40 **Anomaly detection / forecasting assente.** Trend lineari hardcoded. **P1** → z-score / Isolation Forest + forecast 7/30gg con seasonal decomposition.
E.41 **Cohort/retention analysis mancante.** **P1** → segmentazione per source/behavior/device + curve di retention + LTV + payback.
E.42 **Form conversion rate scollegato da GA4.** **P1** → mapping submissions → GA4 events + funnel + abandonment.
E.43 **Custom event/goal configuration UI assente.** **P1** → GA4 event config + validation + funnel surface.
E.44 **Multi-touch attribution assente.** Solo last-click implicito. **P1** → first-touch/linear/time-decay/data-driven + comparator + recommendation per prodotto.
E.45 **Audience overlap / journey analysis mancante.** **P2** → matrix overlap + user journey flowchart + assisted conversions.
E.46 **Predictive analytics / ML insights assenti.** **P2** → integrare Looker Studio ML o script Python per forecast + churn + LTV.
E.47 **Data retention GA4 non configurabile.** **P2** → property config UI + sampling warning + retention setting.
E.48 **Cross-domain / sub-domain tracking assente.** **P1** → estendere config GA4 + auto-generate gtag.config + validate domain list.

---

## F. Domain / Hosting / Infrastructure

> R1 ha messo in piedi `lib/services/seo/*` con stub PageSpeed (F.54 architettura).

~~F.49 Custom domain DNS UI~~ — chiuso in R6 (`/settings/domains` mostra A/CNAME/TXT records con copy + provider email picker per MX preset).
~~F.50 SSL automation~~ — chiuso in R5 (UI in `/settings/domains` con issuer/issued/expiry, auto-renewal toggle, alert pre-expiry config 7/14/30/60gg, mock force-renewal).
~~F.51 Email deliverability~~ — chiuso in R6 (SPF/DKIM/DMARC editor + MX preset per Google/M365/Fastmail/Infomaniak in `/settings/domains`).
~~F.52 Staging generalizzato~~ — chiuso in R6 (staging settings per progetto: stagingDomain custom, password protection, promote-requires-approval).
F.53 **CDN / edge caching config assente.** **P1** → integrazione Cloudflare/Vercel CDN API + cache rule builder + purge UI.
F.54 **Core Web Vitals / performance monitoring** — mock service in piedi, real PageSpeed da implementare. **P0** (al go-live).
F.55 **Cache headers / compression config mancante.** **P1** → cache-control UI + gzip/brotli toggle + server timing analysis.
F.56 **DDoS / WAF config assente.** **P2** → Cloudflare WAF rule builder + rate limiting + log attacchi.
~~F.57 Uptime monitoring~~ — chiuso in R6 (UI in `/settings/staging` con uptime % 30d, monitor URL, intervallo 1-60min, alert email/slack/sms).
F.58 **HTTP/2 / HTTP/3 enforcement assente.** **P2** → protocol version enforcement + raccomandazione HTTP/3.
F.59 **Backups / disaster recovery non visibili.** **P1** → daily snapshots + retention + point-in-time restore UI + RTO/RPO documentati.
F.60 **DNS records management UI assente.** **P1** → A, CNAME, MX, TXT, SPF/DKIM/DMARC editor + validator.

---

## G. Forms / Leads / CRM

~~G.61 Form builder~~ — chiuso in R5 (ContactForm Puck con field types text/email/tel/textarea/select/checkbox/url/number, required toggle, placeholder, options select, label custom, success message).
~~G.62 Spam protection~~ — chiuso in R4 (ContactForm Puck con honeypot, scelta CAPTCHA v3/hcaptcha/turnstile, rate-limit hint soft/strict).
~~G.63 CRM integration~~ — chiuso in R5 (ContactForm con webhookUrl + CRM selector hubspot/pipedrive/salesforce/mailchimp + email notify; route `/api/forms/submit` con webhook fan-out + CRM stub. Native API call in DOC 3 con credenziali per progetto).
~~G.64 Lead scoring~~ — chiuso in R7 (`lib/seo/lead-scoring.ts` con regole source/medium/email business/company/phone/message/page intent; tier hot/warm/cold con routing suggerito; colonna score in `/forms`).
~~G.65 Form abandonment~~ — chiuso in R7 (KPI abandonment rate in `/forms`; tracking field-level richiede integrazione runtime in DOC 3).
G.66 **Form data encryption in transit/rest non garantito.** **P0** → HTTPS forced + field-level encryption per PII + audit log.
G.67 **Form analytics / heatmap assenti.** **P1** → integrazione Microsoft Clarity / Hotjar + interaction rate per field.
G.68 **Conditional logic / dynamic fields assenti.** **P1** → builder show/hide/skip/auto-fill in form editor.
~~G.69 Email follow-up~~ — chiuso in R7 (ContactForm Puck con autoReplyEnabled + autoReplySubject/Body con placeholder {{name}} + followupDays sequence). Provider esterno (SendGrid/Mailchimp) cabling in DOC 3.
G.70 **Form versioning / A/B testing assente.** **P1** → versioning UI + A/B layout/field-order/CTA + conversion tracking variant.
G.71 **File upload / media handling assente.** **P2** → file field + AV scanning + retention.
G.72 **Progressive profiling / enrichment assenti.** **P2** → hide known fields + suggest high-value questions per engagement history.

---

## H. Compliance / Legal / Accessibility

~~H.73 GDPR consent banner~~ — chiuso in R3 (`lib/seo/consent-banner.ts`, banner self-contained con Consent Mode v2, 4 lingue, gating per categoria; UI editor in `/settings/general`).
H.74 **`robots.txt` builder UI** (vedi A.6) — chiuso in R2 (preview live in settings).
~~H.75 Accessibility audit / WCAG~~ — chiuso in R5 (`lib/seo/a11y-audit.ts` con regole H1 unico, hierarchy no-skip, alt enforcement, descriptive link text; alert engine surface count + severity).
~~H.76 Alt text enforcement~~ — chiuso in R3 (badge "Alt mancante" in editor Puck + alert rule cross-pagine). Estensione P2: auto-generate alt via vision AI.
H.77 **ToS / privacy / disclaimer template assenti.** **P1** → integrare iubenda/Termly/TermsFeed o template interno + sync custom domain.
H.78 **PII masking / data residency config assenti.** **P1** → field-level encryption + PII detection in analytics + residency selection (EU/US/CH).
H.79 **Keyboard nav / screen reader testing mancante.** **P1** → audit keyboard via Axe + ARIA labels + test NVDA/JAWS.
H.80 **Cookie disclosure per third-party scripts assente.** GA4/Meta/Ads/AdSense caricano senza consent gate. **P1** → cookie inventory + script blocking pre-consent + auto-detect cookies.
H.81 **CCPA/LGPD/altre giurisdizioni assenti.** Solo GDPR EU. **P1** → consent regional + privacy policy region-specific + opt-out CCPA "Do Not Sell".
H.82 **ADA compliance statement / accessibility policy assenti.** **P2** → template + contact form + issue tracking.

---

## I. Operational / Agency-Level

~~I.83 RBAC base~~ — chiuso in R6 (`/team` con ruoli Super Admin/Admin/Editor/Viewer + project access + MFA flag + invite dialog + permissions matrix).
~~I.84 Audit log~~ — chiuso in R7 (`lib/stores/audit-store.ts` + `/audit` page con filtri action/actor; log automatico campagne, schedule, pubblicazioni).
I.85 **Bulk operations / batch export assenti.** **P1** → bulk edit pages (status/indexable/slug) + CSV export + project setting copy cross-project.
~~I.86 Public REST API~~ — chiuso in R6 (`/api/public/v1/projects`, `/projects/[id]`, `/projects/[id]/pages`, `/projects/[id]/forms` con auth Bearer rzn_… + scope read/write).
I.87 **Webhooks per integrazioni esterne assenti.** **P1** → form submission, page publish, version live, alert events + delivery log + retry.
~~I.88 Scheduled publishing + approval~~ — chiuso in R7 (`lib/stores/schedule-store.ts` + ScheduledReleases in `/settings/staging` con status draft→review→approved→published e bottoni approve/reject/deploy).
I.89 **Client / white-label mode assente.** Brand REZEN baked-in. **P1** → white-label: hide branding + custom name/logo + color scheme + hide internal settings.
I.90 **Cost allocation / project billing assenti.** **P1** → cost tracking per progetto + hourly/usage rate + report per cliente.
I.91 **Client portal self-serve assente.** **P1** → portal read-only (analytics/forms/version history) + shareable link con expiration.
I.92 **Performance benchmarking cross-client assente.** **P1** → confronto SEO/traffic/conv tra progetti + outliers detection.
I.93 **Task management / workflow automation assenti.** **P1** → task UI (Asana/Monday) o interno + auto-task per alert + completion rate.
I.94 **Custom report builder / data sharing assenti.** **P1** → drag-drop widget + scheduled email delivery + white-label template.
I.95 **Branching content / experiments assenti.** **P1** → branch UI + A/B test branch + traffic split (es. 10% variant).
I.96 **SSO / SAML assenti.** Solo email+password. **P1** → SAML 2.0 + OAuth 2.0 + email domain allowlist + JIT provisioning.
~~I.97 Activity feed / notifications~~ — chiuso in R7 (NotificationsBell nel header con dropdown audit recent + counter unread + link audit log; mark-all-read auto).
I.98 **Onboarding / tutorial flow assente.** **P2** → wizard interattivo + checklist setup + video tutorial.
I.99 **Backup/restore / DR plan documentato assente** (vedi anche F.59). **P1**.

---

## Top 10 priorità rimaste (post R7)

1. **B.18** — Entity linking schema
2. **C.21 + C.26** — Multi-location + GEO snippets
3. **H.78 + H.81** — PII masking + CCPA/LGPD regional consent
4. **I.85 + I.87** — Bulk ops + webhooks esterni
5. **I.94 + I.91** — Custom report builder + client portal
6. **D.31 + D.33** — Ad copy A/B + bid strategy optimization
7. **F.53 + F.55** — CDN config + cache headers
8. **E.41 + E.43** — Cohort/retention + custom event config
9. **A.5 esteso (A.11 + A.12)** — Backlink monitoring + competitor benchmarking
10. **I.92 + I.93** — Performance benchmarking cross-client + task management

## Note sui falsi positivi possibili

Se durante l'implementazione si scopre che alcune di queste features sono già parziali, aggiornare il documento. La precedenza tra P0/P1/P2 può cambiare in base a:

- Cosa decide REZEN nel DOC 2 (interview di validazione)
- Quali integrazioni reali sono prioritarie commercialmente
- Budget AI / hosting / API esterni disponibili
