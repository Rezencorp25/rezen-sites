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

**Stato corrente**: 13 gap chiusi su 99 totali. Restano 86.

## Sommario aggiornato

| Area | Gap aperti | P0 | P1 | P2 |
|------|----:|---:|---:|---:|
| A. SEO classico | 7 | 1 | 5 | 1 |
| B. AEO | 5 | 1 | 4 | 0 |
| C. GEO + Local | 6 | 0 | 5 | 1 |
| D. Ads & Paid Media | 10 | 2 | 7 | 1 |
| E. Analytics & Measurement | 12 | 3 | 6 | 3 |
| F. Domain / Hosting / Infra | 12 | 2 | 8 | 2 |
| G. Forms / Leads / CRM | 12 | 3 | 7 | 2 |
| H. Compliance / Legal / A11y | 10 | 2 | 7 | 1 |
| I. Operational / Agency | 17 | 2 | 13 | 2 |
| **TOTALE** | **86** | **16** | **62** | **13** |

---

## A. SEO classico (on-page + technical + off-page)

> Chiusi in R2: A.1 (editor on-page), A.2 (AI fill wire), A.3 (Schema.org auto-inject), A.4 (canonical override), A.6 (robots.txt + sitemap.xml), A.8 (indexable enforcement), A.10 (counter live), A.13 (redirect chain/loop validator).

A.5 **Internal linking suggestions assenti.** Nessuna analisi orphan pages, anchor text, link suggeriti. **P1** → crawl pagine, estrai keyword, suggerisci anchor + target.

A.7 **rel=nofollow/sponsored/ugc non gestibili.** **P2** → audit link esterni nel contenuto Puck + bulk attribute apply.

A.9 **hreflang / multilingua zero.** UI è tutta italiana ma nessuna infrastruttura locale. **P0** → hreflang generation + sitemap variants per lingua.

A.11 **Backlink monitoring assente.** Zero integrazione Ahrefs/Moz/Semrush, niente import manuale. **P1** → tracker manuale + opzionale API SEO tool per DA + backlink profile.

A.12 **Competitor SEO benchmarking assente.** **P2** → input URL competitor + keyword overlap/gap analysis.

A.X **llms.txt builder.** **P1** (post-2024) → file standard per AI engines, builder con consent crawler AI.

A.Y **Image SEO automatico.** Alt text mandatory + dimensioni + formats moderni (webp/avif). **P1** → enforcement + vision AI auto-alt.

---

## B. AEO (Answer Engine Optimization)

> Chiuso in R2: B.19 (FAQ Puck component + auto FAQPage schema in export).

B.14 **Tooling AEO totalmente assente.** Zero ottimizzazione FAQ/featured snippet/AI overview. **P0** → answer snippet optimizer con token counting per ChatGPT/Claude/Perplexity.
B.15 **AI overview traffic risk modeling assente.** **P1** → integrare Semrush/Moz AEO API o classifier interno + raccomandazioni difensive.
B.16 **Passage-level optimization mancante.** **P1** → analizza blocchi Puck, scoring answerability, highlight passaggi deboli.
B.17 **Attribution / citation markup assente.** Niente Author / Reviewed-By / dates schema per credibilità LLM. **P1** → auto-inject Author/CreativeWork/NewsArticle schema + date prominenti.
B.18 **Entity optimization assente.** Nessun linking a entità definite (persone, org, concetti). **P1** → entity recognition + entity schema + linking interno a entity pages.

---

## C. GEO (Generative Engine Optimization + Local SEO)

> Chiuso in R2: C.20 (LocalBusiness editor in settings + auto-inject schema in export).

C.21 **Service area / multi-location targeting assente.** **P1** → metadata location-aware + landing page templates per location + service area schema (LocalBusiness ha campo `serviceArea`, ora UI esiste; manca gestione MULTI-location).
C.22 **LocalBusiness/Place schema esiste ma manca preview Google Local Pack.** **P1** → preview "near me" + breadcrumb geo.
C.23 **Review/rating schema management mancante.** **P1** → import recensioni Google/Yelp/custom + auto-inject AggregateRating/Review schema.
C.24 **NAP consistency audit assente.** **P1** → audit cross-pagine + flag deviazioni + canonical NAP suggerito.
C.25 **Local citations management assente.** Apple Maps, Bing, TripAdvisor, directory di settore. **P2** → submission UI + monitoring NAP consistency.
C.26 **GEO snippet optimization assente.** Zero ottimizzazione per query "near me" / local pack / map snippets. **P1** → schema "near me" intent + map-friendly markup (coords, radius).

---

## D. Ads & Paid Media

> R1 ha messo in piedi `lib/services/ads/*` con interfaccia + mock + Google Ads stub (D.28 architettura).

D.27 **Campaign creation/management assente.** Tracking config esiste ma zero capacità di creare/pausare/ottimizzare campagne. **P0** → campaign builder con Google Ads API + Meta Ads API + Microsoft Ads API.
D.28 **Dashboards Google Ads/AdSense renderano mock.** Architettura swap-ready in piedi (mock service implementa AdsService); manca refactor delle dashboard pages per consumare il factory invece di chiamare direttamente i generators. **P0**.
D.29 **Conversion tracking setup wizard assente.** Inserimento ID manuale senza validazione. **P1** → wizard step-by-step: GA4 events, Meta pixels, Google Ads conversion actions + debug tools.
D.30 **UTM auto-generation/validation mancante.** Form catturano UTM/GCLID ma niente builder/validator. **P1** → UTM builder + library con naming convention + warning incoerenze.
D.31 **Ad copy A/B testing infrastruttura assente.** **P1** → headline/copy testing dashboard + automation variant creation via API.
D.32 **Audience segmentation / lookalike export assente.** **P1** → export audiences a Meta/Google da form submissions, behavior, segmenti.
D.33 **Bid strategy optimization mancante.** Solo CPC manuale, niente target CPA/ROAS/maximize conversions. **P1** → config UI + raccomandazioni basate su conv volume + ROAS target.
D.34 **Landing page quality scoring (per ad campaigns) assente.** **P1** → score CWV + load time + content relevance per pagina, flag poor performers.
D.35 **Budget pacing / spend alerts assenti.** **P2** → pacing UI + auto-pause threshold + Slack/email alert overspend.
D.36 **Pixel debug tools assenti.** Verified/unverified flags solo cosmetici. **P1** → debug UI: fire test events + real-time validation + server-side conversion check.

---

## E. Analytics & Measurement

> R1 ha messo in piedi `lib/services/analytics/*` con interfaccia + mock + GA4 stub (E.37+E.38 architettura).

E.37 **Layer analytics interamente mock.** Architettura swap-ready in piedi; manca refactor di useProjectData per consumare il factory. **P0**.
E.38 **GA4 integration vera assente.** Stub class GA4AnalyticsService pronto da implementare. **P0** (al go-live).
E.39 **Alerts hardcoded.** `MOCK_ALERTS` con 6 alert predefiniti, niente monitoring reale. **P0** → engine real-time: meta description missing, CWV failure, traffic anomaly, GSC crawl errors, form abandonment spike.
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

F.49 **Custom domain verification incompleta.** UI mostra SSL status mock, niente DNS record visualizzati, niente check propagation, niente SPF/DKIM/DMARC. **P1** → DNS lookup + record A/CNAME richiesti + propagation check + email auth audit.
F.50 **SSL automation non visibile.** Toggle "SSL Active" cosmetico. **P0** → auto-renewal Let's Encrypt o ACM + manual cert upload + warning 30/7/1gg pre-scadenza.
F.51 **Email deliverability (SPF/DKIM/DMARC) non auditata.** **P1** → audit UI + check MX + test SMTP + flag misconfig.
F.52 **Staging hardcoded per `verumflow-ch`.** Altri progetti non possono fare staging. **P1** → generalizzare a tutti i progetti + stagingDomain config + traffic mirroring/percentage rollout.
F.53 **CDN / edge caching config assente.** **P1** → integrazione Cloudflare/Vercel CDN API + cache rule builder + purge UI.
F.54 **Core Web Vitals / performance monitoring** — mock service in piedi, real PageSpeed da implementare. **P0** (al go-live).
F.55 **Cache headers / compression config mancante.** **P1** → cache-control UI + gzip/brotli toggle + server timing analysis.
F.56 **DDoS / WAF config assente.** **P2** → Cloudflare WAF rule builder + rate limiting + log attacchi.
F.57 **Uptime monitoring / status page assenti.** **P1** → integrare Checkly/Cronitor + status page auto + incidents in alerts.
F.58 **HTTP/2 / HTTP/3 enforcement assente.** **P2** → protocol version enforcement + raccomandazione HTTP/3.
F.59 **Backups / disaster recovery non visibili.** **P1** → daily snapshots + retention + point-in-time restore UI + RTO/RPO documentati.
F.60 **DNS records management UI assente.** **P1** → A, CNAME, MX, TXT, SPF/DKIM/DMARC editor + validator.

---

## G. Forms / Leads / CRM

G.61 **Form builder assente.** Tracking submission funziona ma niente creator custom field/validation/conditional logic. **P0** → builder Puck-integrated drag-drop fields + validation + conditional + auto-save.
G.62 **Spam protection (reCAPTCHA/hCaptcha/honeypot) assente.** **P1** → reCAPTCHA v3 + honeypot + IP rate limiting.
G.63 **CRM integration mancante.** Submissions in tabella ma zero sync HubSpot/Salesforce/Pipedrive/webhook. **P0** → integration hub + native connectors + generic webhook con payload builder + test fire.
G.64 **Lead scoring / qualification assenti.** **P1** → rules UI + scoring per source/behavior/engagement + segment by score.
G.65 **Form abandonment tracking mancante.** **P1** → field interaction + timeout tracking + abandonment heatmap.
G.66 **Form data encryption in transit/rest non garantito.** **P0** → HTTPS forced + field-level encryption per PII + audit log.
G.67 **Form analytics / heatmap assenti.** **P1** → integrazione Microsoft Clarity / Hotjar + interaction rate per field.
G.68 **Conditional logic / dynamic fields assenti.** **P1** → builder show/hide/skip/auto-fill in form editor.
G.69 **Email follow-up automation assente.** **P1** → automation builder + confirmation template + nurture sequences + integrazione SendGrid/Mailchimp/Klaviyo.
G.70 **Form versioning / A/B testing assente.** **P1** → versioning UI + A/B layout/field-order/CTA + conversion tracking variant.
G.71 **File upload / media handling assente.** **P2** → file field + AV scanning + retention.
G.72 **Progressive profiling / enrichment assenti.** **P2** → hide known fields + suggest high-value questions per engagement history.

---

## H. Compliance / Legal / Accessibility

H.73 **GDPR / consent management assente.** Zero cookie banner, preferences, DSAR workflow, privacy policy template. **P0** → integrare Cookiebot/OneTrust o open-source (Osano) + privacy policy generator + DSAR.
H.74 **`robots.txt` builder UI** (vedi A.6) — chiuso in R2 (preview live in settings).
H.75 **Accessibility audit / WCAG reporting assente.** **P0** → integrare axe-core o WAVE API + audit on publish + report WCAG 2.2 AA.
H.76 **Alt text immagini non enforced.** Componenti Puck image accettano img senza alt. **P1** → alt mandatory + auto-generate via vision AI (Claude vision) + validate on publish.
H.77 **ToS / privacy / disclaimer template assenti.** **P1** → integrare iubenda/Termly/TermsFeed o template interno + sync custom domain.
H.78 **PII masking / data residency config assenti.** **P1** → field-level encryption + PII detection in analytics + residency selection (EU/US/CH).
H.79 **Keyboard nav / screen reader testing mancante.** **P1** → audit keyboard via Axe + ARIA labels + test NVDA/JAWS.
H.80 **Cookie disclosure per third-party scripts assente.** GA4/Meta/Ads/AdSense caricano senza consent gate. **P1** → cookie inventory + script blocking pre-consent + auto-detect cookies.
H.81 **CCPA/LGPD/altre giurisdizioni assenti.** Solo GDPR EU. **P1** → consent regional + privacy policy region-specific + opt-out CCPA "Do Not Sell".
H.82 **ADA compliance statement / accessibility policy assenti.** **P2** → template + contact form + issue tracking.

---

## I. Operational / Agency-Level

I.83 **Multi-team / RBAC assenti.** Filtering per `projectId` ma zero workspace, ruoli, audit per-user. **P0** → workspace + RBAC (Admin/Editor/Viewer/Analyst) + log per user.
I.84 **Audit log oltre ai version snapshot mancante.** **P1** → log dettagliato edit pagine, setting changes, user actions con timestamp + user ID + UI.
I.85 **Bulk operations / batch export assenti.** **P1** → bulk edit pages (status/indexable/slug) + CSV export + project setting copy cross-project.
I.86 **API pubblica REST/GraphQL assente.** **P0** → REST API + OAuth 2.0 + endpoints (projects/pages/forms/analytics/settings) + API key UI + SDK.
I.87 **Webhooks per integrazioni esterne assenti.** **P1** → form submission, page publish, version live, alert events + delivery log + retry.
I.88 **Scheduled publishing / approval workflow assenti.** **P1** → schedule UI + approval request + draft lock concurrent edit.
I.89 **Client / white-label mode assente.** Brand REZEN baked-in. **P1** → white-label: hide branding + custom name/logo + color scheme + hide internal settings.
I.90 **Cost allocation / project billing assenti.** **P1** → cost tracking per progetto + hourly/usage rate + report per cliente.
I.91 **Client portal self-serve assente.** **P1** → portal read-only (analytics/forms/version history) + shareable link con expiration.
I.92 **Performance benchmarking cross-client assente.** **P1** → confronto SEO/traffic/conv tra progetti + outliers detection.
I.93 **Task management / workflow automation assenti.** **P1** → task UI (Asana/Monday) o interno + auto-task per alert + completion rate.
I.94 **Custom report builder / data sharing assenti.** **P1** → drag-drop widget + scheduled email delivery + white-label template.
I.95 **Branching content / experiments assenti.** **P1** → branch UI + A/B test branch + traffic split (es. 10% variant).
I.96 **SSO / SAML assenti.** Solo email+password. **P1** → SAML 2.0 + OAuth 2.0 + email domain allowlist + JIT provisioning.
I.97 **Activity feed / notifications assenti.** **P1** → feed UI + tracking + in-app notif + email digest.
I.98 **Onboarding / tutorial flow assente.** **P2** → wizard interattivo + checklist setup + video tutorial.
I.99 **Backup/restore / DR plan documentato assente** (vedi anche F.59). **P1**.

---

## Top 10 priorità rimaste

Ricalibrato in base a quello che è già stato fatto:

1. **A.9** — hreflang + multilingua infrastructure (sblocca clienti con audience EU non-IT)
2. **D.28 + E.37** — Refactor dashboard analytics/ads/adsense per consumare service-factory (chiude la coda dell'architettura R1)
3. **E.39** — Alert engine reale al posto di MOCK_ALERTS
4. **G.61 + G.63** — Form builder + CRM webhook (oggi i form sono solo capture, zero valore lead-gen)
5. **H.73** — GDPR consent + cookie banner (compliance bloccante)
6. **H.75 + H.76** — Accessibility audit + alt text enforcement
7. **C.23 + C.24** — Review schema + NAP consistency audit
8. **A.5 + A.X** — Internal linking suggestions + llms.txt builder
9. **F.50** — SSL automation + cert renewal alerts
10. **I.83 + I.86** — RBAC + public REST API (foundation operational)

## Note sui falsi positivi possibili

Se durante l'implementazione si scopre che alcune di queste features sono già parziali, aggiornare il documento. La precedenza tra P0/P1/P2 può cambiare in base a:

- Cosa decide REZEN nel DOC 2 (interview di validazione)
- Quali integrazioni reali sono prioritarie commercialmente
- Budget AI / hosting / API esterni disponibili
