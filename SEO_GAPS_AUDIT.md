# REZEN Sites — Audit gap SEO/AEO/GEO + Ads/Domains/Analytics

> Documento di consegna allo sviluppatore/team che proseguirà l'implementazione.
> Scritto dalla prospettiva di un SEO operator senior che gestisce 20-50 siti cliente in produzione.
> Data audit: 2026-04-27. Repo: `rezen-sites` commit `a72981c`.

## Sommario

| Area | Gap | P0 | P1 | P2 |
|------|----:|---:|---:|---:|
| A. SEO classico | 13 | 3 | 8 | 2 |
| B. AEO | 6 | 1 | 4 | 1 |
| C. GEO + Local | 7 | 1 | 5 | 1 |
| D. Ads & Paid Media | 10 | 2 | 7 | 1 |
| E. Analytics & Measurement | 12 | 3 | 6 | 3 |
| F. Domain / Hosting / Infra | 12 | 2 | 8 | 2 |
| G. Forms / Leads / CRM | 12 | 3 | 7 | 2 |
| H. Compliance / Legal / A11y | 10 | 2 | 7 | 1 |
| I. Operational / Agency | 17 | 2 | 13 | 2 |
| **TOTALE** | **99** | **19** | **65** | **15** |

**Lettura chiave**: il prototipo è un *design prototype funzionante per il page-building*, ma **tutta la parte misurazione (GA4, AdSense, Google Ads) è mock**, e le funzioni SEO/AEO/GEO sono **assenti o stub**. La sola integrazione AI reale è il SEO agent (gated da API key Anthropic).

---

## A. SEO classico (on-page + technical + off-page)

1. **Editor SEO on-page assente.** `/pages/[id]/seo` è ModulePlaceholder. Niente meta title, description, OG, canonical editabili. **P0** → costruire pannello con counter caratteri real-time, preview Google/social, validatore keyword.
2. **Meta non auto-generate da contenuto Puck.** Il SEO agent esiste ma non è cablato nel flusso di creazione pagina. **P0** → wire `seo-agent.ts` in add-page dialog + bulk-fill via AI sulle pagine esistenti.
3. **Schema.org / JSON-LD assente.** Zero Organization, Article, LocalBusiness, FAQPage, Product, BreadcrumbList. **P1** → generatore JSON-LD context-aware sul tipo pagina.
4. **Canonical per-pagina mancante.** Solo `canonicalDomain` apex/www in settings; nessun override per pagina, niente self-referential auto-inject. **P1** → campo override + auto-inject `<link rel="canonical">`.
5. **Internal linking suggestions assenti.** Niente analisi orphan pages, anchor text, link suggeriti. **P1** → crawl pagine, estrai keyword, suggerisci anchor + target.
6. **`robots.txt` e `sitemap.xml` non auto-generati.** Nessuna UI per direttive crawler o priorità sitemap. **P1** → builder con per-page indexability flag, auto-publish a root.
7. **rel=nofollow/sponsored/ugc non gestibili.** **P2** → audit link esterni nel contenuto Puck + bulk attribute apply.
8. **Indexable flag esiste in schema dati ma non viene applicato.** `Page.seo.indexable` non triggera `<meta name="robots">` né `X-Robots-Tag`. **P1** → render toggle in editor + inject meta header.
9. **hreflang / multilingua zero.** UI è tutta italiana ma nessuna infrastruttura locale. **P0** → hreflang generation + sitemap variants per lingua.
10. **Lunghezze title/description non validate live.** **P2** → counter caratteri + preview SERP truncation.
11. **Backlink monitoring assente.** Zero integrazione Ahrefs/Moz/Semrush, niente import manuale. **P1** → tracker manuale + opzionale API SEO tool per DA + backlink profile.
12. **Competitor SEO benchmarking assente.** **P2** → input URL competitor + keyword overlap/gap analysis.
13. **Redirect chain/loop detection mancante.** CRUD esiste ma non rileva A→B→C, A→B→A, o target 404. **P1** → validator chain + crawl 2xx check + alert.

---

## B. AEO (Answer Engine Optimization)

14. **Tooling AEO totalmente assente.** Zero ottimizzazione FAQ/featured snippet/AI overview. **P0** → FAQ schema generator + question extraction da Puck + answer snippet optimizer con token counting per ChatGPT/Claude/Perplexity.
15. **AI overview traffic risk modeling assente.** **P1** → integrare Semrush/Moz AEO API o classifier interno + raccomandazioni difensive (claims, citations, entity markup).
16. **Passage-level optimization mancante.** **P1** → analizza blocchi Puck, scoring answerability, highlight passaggi deboli.
17. **Attribution / citation markup assente.** Niente Author / Reviewed-By / dates schema per credibilità LLM. **P1** → auto-inject Author/CreativeWork/NewsArticle schema + date prominenti.
18. **Entity optimization assente.** Nessun linking a entità definite (persone, org, concetti). **P2** → entity recognition + entity schema + linking interno a entity pages.
19. **Componente Puck FAQ assente.** **P1** → block FAQ con FAQPage schema + auto-populate via AI.

---

## C. GEO (Generative Engine Optimization + Local SEO)

20. **Local SEO completamente assente.** Zero Google Business Profile sync, NAP audit, review aggregation, local citations. **P0** → LocalBusiness schema editor + NAP audit + GBP sync UI.
21. **Service area / multi-location targeting assente.** **P1** → metadata location-aware + landing page templates per location + service area schema.
22. **LocalBusiness/Place schema generation mancante.** **P1** → auto-genera da settings (address, phone, opening hours, service area).
23. **Review/rating schema management mancante.** **P1** → import recensioni Google/Yelp/custom + auto-inject AggregateRating/Review schema.
24. **NAP consistency audit assente.** **P1** → audit cross-pagine + flag deviazioni + canonical NAP suggerito.
25. **Local citations management assente.** Apple Maps, Bing, TripAdvisor, directory di settore. **P2** → submission UI + monitoring NAP consistency.
26. **GEO snippet optimization assente.** Zero ottimizzazione per query "near me" / local pack / map snippets. **P1** → schema "near me" intent + map-friendly markup (coords, radius).

---

## D. Ads & Paid Media

27. **Campaign creation/management assente.** Tracking config esiste ma zero capacità di creare/pausare/ottimizzare campagne. **P0** → campaign builder con Google Ads API + Meta Ads API + Microsoft Ads API.
28. **Dashboards Google Ads/AdSense renderano mock.** Campagne hardcoded (`brand_search`, `competitor_attack`, `pmax_performance`, ecc.). **P0** → integrare `google-ads-api` + AdSense Management API + stream live (spend, clicks, conv, ROAS, CPC).
29. **Conversion tracking setup wizard assente.** Inserimento ID manuale senza validazione. **P1** → wizard step-by-step: GA4 events, Meta pixels, Google Ads conversion actions + debug tools.
30. **UTM auto-generation/validation mancante.** Form catturano UTM/GCLID ma niente builder/validator. **P1** → UTM builder + library con naming convention + warning incoerenze.
31. **Ad copy A/B testing infrastruttura assente.** **P1** → headline/copy testing dashboard + automation variant creation via API.
32. **Audience segmentation / lookalike export assente.** **P1** → export audiences a Meta/Google da form submissions, behavior, segmenti.
33. **Bid strategy optimization mancante.** Solo CPC manuale, niente target CPA/ROAS/maximize conversions. **P1** → config UI + raccomandazioni basate su conv volume + ROAS target.
34. **Landing page quality scoring (per ad campaigns) assente.** **P1** → score CWV + load time + content relevance per pagina, flag poor performers.
35. **Budget pacing / spend alerts assenti.** **P2** → pacing UI + auto-pause threshold + Slack/email alert overspend.
36. **Pixel debug tools assenti.** Verified/unverified flags solo cosmetici. **P1** → debug UI: fire test events + real-time validation + server-side conversion check.

---

## E. Analytics & Measurement

37. **Layer analytics interamente mock.** `useProjectData` aggrega `MOCK_ALERTS` + RNG seedato. Dashboard KPI (traffic Δ +22%, revenue, SEO score) sono predetermined stub. **P0** → real GA4 client (`@google-analytics/data`) + server-side cache 5-min.
38. **GA4 integration vera assente.** Settings store accetta `ga4.id` ma zero chiamate API. **P0** → google-analytics-data v1 API + real-time + custom dimensions + event streams.
39. **Alerts hardcoded.** `MOCK_ALERTS` con 6 alert predefiniti, niente monitoring reale. **P0** → engine real-time: meta description missing, CWV failure, traffic anomaly, GSC crawl errors, form abandonment spike.
40. **Anomaly detection / forecasting assente.** Trend lineari hardcoded. **P1** → z-score / Isolation Forest + forecast 7/30gg con seasonal decomposition.
41. **Cohort/retention analysis mancante.** **P1** → segmentazione per source/behavior/device + curve di retention + LTV + payback.
42. **Form conversion rate scollegato da GA4.** **P1** → mapping submissions → GA4 events + funnel + abandonment.
43. **Custom event/goal configuration UI assente.** **P1** → GA4 event config + validation + funnel surface.
44. **Multi-touch attribution assente.** Solo last-click implicito. **P1** → first-touch/linear/time-decay/data-driven + comparator + recommendation per prodotto.
45. **Audience overlap / journey analysis mancante.** **P2** → matrix overlap + user journey flowchart + assisted conversions.
46. **Predictive analytics / ML insights assenti.** **P2** → integrare Looker Studio ML o script Python per forecast + churn + LTV.
47. **Data retention GA4 non configurabile.** **P2** → property config UI + sampling warning + retention setting.
48. **Cross-domain / sub-domain tracking assente.** **P1** → estendere config GA4 + auto-generate gtag.config + validate domain list.

---

## F. Domain / Hosting / Infrastructure

49. **Custom domain verification incompleta.** UI mostra SSL status mock, niente DNS record visualizzati, niente check propagation, niente SPF/DKIM/DMARC. **P1** → DNS lookup + record A/CNAME richiesti + propagation check + email auth audit.
50. **SSL automation non visibile.** Toggle "SSL Active" cosmetico. **P0** → auto-renewal Let's Encrypt o ACM + manual cert upload + warning 30/7/1gg pre-scadenza.
51. **Email deliverability (SPF/DKIM/DMARC) non auditata.** **P1** → audit UI + check MX + test SMTP + flag misconfig.
52. **Staging hardcoded per `verumflow-ch`.** Altri progetti non possono fare staging. **P1** → generalizzare a tutti i progetti + stagingDomain config + traffic mirroring/percentage rollout.
53. **CDN / edge caching config assente.** **P1** → integrazione Cloudflare/Vercel CDN API + cache rule builder + purge UI.
54. **Core Web Vitals / performance monitoring assente.** SEO score è stub. **P0** → PageSpeed Insights API + CrUX API + Lighthouse CI + alert su regressioni LCP/CLS/INP.
55. **Cache headers / compression config mancante.** **P1** → cache-control UI + gzip/brotli toggle + server timing analysis.
56. **DDoS / WAF config assente.** **P2** → Cloudflare WAF rule builder + rate limiting + log attacchi.
57. **Uptime monitoring / status page assenti.** **P1** → integrare Checkly/Cronitor + status page auto + incidents in alerts.
58. **Redirect chain/loop detection mancante** (vedi anche A.13). **P1**.
59. **HTTP/2 / HTTP/3 enforcement assente.** **P2** → protocol version enforcement + raccomandazione HTTP/3.
60. **Backups / disaster recovery non visibili.** **P1** → daily snapshots + retention + point-in-time restore UI + RTO/RPO documentati.

---

## G. Forms / Leads / CRM

61. **Form builder assente.** Tracking submission funziona ma niente creator custom field/validation/conditional logic. **P0** → builder Puck-integrated drag-drop fields + validation + conditional + auto-save.
62. **Spam protection (reCAPTCHA/hCaptcha/honeypot) assente.** **P1** → reCAPTCHA v3 + honeypot + IP rate limiting.
63. **CRM integration mancante.** Submissions in tabella ma zero sync HubSpot/Salesforce/Pipedrive/webhook. **P0** → integration hub + native connectors + generic webhook con payload builder + test fire.
64. **Lead scoring / qualification assenti.** **P1** → rules UI + scoring per source/behavior/engagement + segment by score.
65. **Form abandonment tracking mancante.** **P1** → field interaction + timeout tracking + abandonment heatmap.
66. **Form data encryption in transit/rest non garantito.** **P0** → HTTPS forced + field-level encryption per PII + audit log.
67. **Form analytics / heatmap assenti.** **P1** → integrazione Microsoft Clarity / Hotjar + interaction rate per field.
68. **Conditional logic / dynamic fields assenti.** **P1** → builder show/hide/skip/auto-fill in form editor.
69. **Email follow-up automation assente.** **P1** → automation builder + confirmation template + nurture sequences + integrazione SendGrid/Mailchimp/Klaviyo.
70. **Form versioning / A/B testing assente.** **P1** → versioning UI + A/B layout/field-order/CTA + conversion tracking variant.
71. **File upload / media handling assente.** **P2** → file field + AV scanning + retention.
72. **Progressive profiling / enrichment assenti.** **P2** → hide known fields + suggest high-value questions per engagement history.

---

## H. Compliance / Legal / Accessibility

73. **GDPR / consent management assente.** Zero cookie banner, preferences, DSAR workflow, privacy policy template. **P0** → integrare Cookiebot/OneTrust o open-source (Osano) + privacy policy generator + DSAR.
74. **`robots.txt` builder UI assente** (vedi A.6). **P1** → User-Agent rules + Allow/Disallow + Crawl-delay + Sitemap + auto-publish.
75. **Accessibility audit / WCAG reporting assente.** **P0** → integrare axe-core o WAVE API + audit on publish + report WCAG 2.2 AA.
76. **Alt text immagini non enforced.** Componenti Puck image accettano img senza alt. **P1** → alt mandatory + auto-generate via vision AI (Claude vision) + validate on publish.
77. **ToS / privacy / disclaimer template assenti.** **P1** → integrare iubenda/Termly/TermsFeed o template interno + sync custom domain.
78. **PII masking / data residency config assenti.** **P1** → field-level encryption + PII detection in analytics + residency selection (EU/US/CH).
79. **Keyboard nav / screen reader testing mancante.** **P1** → audit keyboard via Axe + ARIA labels + test NVDA/JAWS.
80. **Cookie disclosure per third-party scripts assente.** GA4/Meta/Ads/AdSense caricano senza consent gate. **P1** → cookie inventory + script blocking pre-consent + auto-detect cookies.
81. **CCPA/LGPD/altre giurisdizioni assenti.** Solo GDPR EU. **P1** → consent regional + privacy policy region-specific + opt-out CCPA "Do Not Sell".
82. **ADA compliance statement / accessibility policy assenti.** **P2** → template + contact form + issue tracking.

---

## I. Operational / Agency-Level

83. **Multi-team / RBAC assenti.** Filtering per `projectId` ma zero workspace, ruoli, audit per-user. **P0** → workspace + RBAC (Admin/Editor/Viewer/Analyst) + log per user.
84. **Audit log oltre ai version snapshot mancante.** **P1** → log dettagliato edit pagine, setting changes, user actions con timestamp + user ID + UI.
85. **Bulk operations / batch export assenti.** **P1** → bulk edit pages (status/indexable/slug) + CSV export + project setting copy cross-project.
86. **API pubblica REST/GraphQL assente.** **P0** → REST API + OAuth 2.0 + endpoints (projects/pages/forms/analytics/settings) + API key UI + SDK.
87. **Webhooks per integrazioni esterne assenti.** **P1** → form submission, page publish, version live, alert events + delivery log + retry.
88. **Scheduled publishing / approval workflow assenti.** **P1** → schedule UI + approval request + draft lock concurrent edit.
89. **Client / white-label mode assente.** Brand REZEN baked-in. **P1** → white-label: hide branding + custom name/logo + color scheme + hide internal settings.
90. **Cost allocation / project billing assenti.** **P1** → cost tracking per progetto + hourly/usage rate + report per cliente.
91. **Client portal self-serve assente.** **P1** → portal read-only (analytics/forms/version history) + shareable link con expiration.
92. **Performance benchmarking cross-client assente.** **P1** → confronto SEO/traffic/conv tra progetti + outliers detection.
93. **Task management / workflow automation assenti.** **P1** → task UI (Asana/Monday) o interno + auto-task per alert + completion rate.
94. **Custom report builder / data sharing assenti.** **P1** → drag-drop widget + scheduled email delivery + white-label template.
95. **Branching content / experiments assenti.** **P1** → branch UI + A/B test branch + traffic split (es. 10% variant).
96. **SSO / SAML assenti.** Solo email+password. **P1** → SAML 2.0 + OAuth 2.0 + email domain allowlist + JIT provisioning.
97. **Activity feed / notifications assenti.** **P1** → feed UI + tracking + in-app notif + email digest.
98. **Onboarding / tutorial flow assente.** **P2** → wizard interattivo + checklist setup + video tutorial.
99. **Backup/restore / DR plan documentato assente** (vedi anche F.60). **P1**.

---

## Top 10 priorità da attaccare per primo

Se devi muovere l'ago della bilancia per un SEO operator agency-grade, attacca in quest'ordine:

1. **A.1 + A.2** — Editor SEO on-page reale + AI fill (sblocca tutto il flow SEO)
2. **E.37 + E.38** — GA4 reale al posto del mock (tutto il dashboard è fake oggi)
3. **D.27 + D.28** — Google Ads + AdSense API reali (stessa motivazione)
4. **E.39** — Alert engine reale al posto di MOCK_ALERTS
5. **F.54** — Core Web Vitals via PageSpeed Insights / CrUX (SEO score oggi è stub)
6. **A.6 + A.8** — robots.txt + sitemap.xml + indexable enforcement (basics tecnici)
7. **A.3** — Schema.org generator (Organization/Article/LocalBusiness/FAQ)
8. **C.20** — Local SEO suite (LocalBusiness schema, GBP sync, NAP audit)
9. **H.73 + H.75** — GDPR consent + accessibility audit (compliance bloccante per produzione)
10. **G.61 + G.63** — Form builder + CRM integration (forms oggi sono solo capture, nessun valore lead-gen)

Questi 10 fix coprono **~80%** del valore percepito da chi userà davvero il tool.

---

## Note sui falsi positivi possibili

Questo audit è basato su lettura statica del codice + giro UI. Se durante l'implementazione si scopre che alcune di queste features sono in realtà già parziali (es. seo agent ha più capacità di quanto sembri leggendo lo stub mode), aggiornare il documento di conseguenza. La precedenza tra P0/P1/P2 può cambiare in base a:

- Cosa decide REZEN nel DOC 2 (interview di validazione)
- Quali integrazioni reali sono prioritarie commercialmente
- Budget AI / hosting / API esterni disponibili
