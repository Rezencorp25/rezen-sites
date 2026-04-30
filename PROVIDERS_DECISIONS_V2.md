# REZEN Sites v.2 — Provider Decisions

> Documento di sintesi per **Francesco + soci**. Riepilogo delle scelte provider/architetturali per la versione 2 dell'app, con motivazione, costo, rischio, alternative.
> **Scopo**: confermare le scelte (sign-off) o sostituire una raccomandazione. Ogni voce ha riquadro di approvazione in fondo.

---

## Meta

- **Data documento**: 2026-04-30
- **Owner decisione finale**: Francesco Lossi
- **Approvatori**: Francesco + soci VerumFlow
- **Documento collegato**: `SPRINT_PLAN_V1_TO_V2.md` (impatti operativi delle decisioni)
- **Compliance reference**: `Compliance/COMPLIANCE_PLAYBOOK.md` v1.2

---

## Sintesi esecutiva

Su 9 aree provider inizialmente identificate, **6 sono state risolte internamente** (CMS, CRM, webhook router, AI Visibility, Site Audit, marketing data), tagliando dipendenze esterne e riducendo i sub-processor in ROPA. Restano **3 decisioni provider esterne** che richiedono il sign-off dei soci, una sola delle quali è davvero strategica (DataForSEO).

**Costo provider mensile per cliente medio v.2**: ~5-15 USD (DataForSEO consumi + token LLM AI Visibility). Tutto il resto è gratis (API native Google/Meta) o infra Firebase già esistente.

| # | Area | Soluzione scelta | Tipo | Costo /cliente/mese |
|---|---|---|---|---|
| 1 | CMS engine | Estensione Puck (interno) | Interno | 0 € |
| 2 | CRM Lead Pipeline | Modulo Firestore + kanban (interno) | Interno | 0 € |
| 3 | Webhook router / automation | Cloud Functions Firebase native | Interno | 0 € (free tier) |
| 4 | Site Audit | **Lighthouse + PageSpeed Insights API** | Esterno gratuito | 0 € |
| 5 | Marketing data (Meta/Google/GA4/AdSense) | **API native ufficiali** | Esterno gratuito | 0 € |
| 6 | AI Visibility (GEO/AEO) | **Build interno multi-LLM** (Anthropic + OpenAI + Gemini) | Esterno a consumo | ~3-5 USD |
| 7 | SEO data suite (keywords, authority, backlinks, SERP) | **DataForSEO** API a consumo | Esterno a consumo | ~2-10 USD |
| 8 | Rank tracking | DataForSEO SERP API (vedi #7) | Esterno a consumo | (incluso #7) |
| 9 | Backlink intel | DataForSEO Backlinks (vedi #7) | Esterno a consumo | (incluso #7) |

Le 3 decisioni che richiedono sign-off sono **#4-#6 + #7-#9** (DataForSEO unificato). Le decisioni interne (#1-#3) sono già confermate operativamente — riportate qui solo per trasparenza.

---

## Decisione 1 — SEO data suite: DataForSEO

### Cosa serve

Una fonte dati per le card Dashboard v.2:
- **SEO Overview**: Authority Score, traffico organico, keyword organiche/paid, domini di riferimento
- **Rank Tracking**: posizione keyword, cluster Top 3/10/20/100, indice visibilità
- **Backlinks**: profilo backlink leggero per competitor analysis

### Provider scelto: DataForSEO

**Razionale**:
- ✅ **Pay-as-you-go** (no abbonamento), $50 minimum top-up — perfetto per crescita graduale REZEN
- ✅ **API completa** (SERP + keywords + backlinks + audit + competitor) — un solo provider per 3 use case
- ✅ **SDK ufficiale TypeScript** (MIT, GitHub `dataforseo/TypeScriptClient`) — integra con Next.js + Cloud Functions
- ✅ **Costo realistico**: $0.0006 per SERP standard, ~$10 per 1.000 calls miste = ~2-10 USD/cliente/mese
- ✅ **Reputazione consolidata**: G2, Trustpilot, TrustRadius reviews positive; median support response 17 secondi
- ✅ **DPA GDPR** incorporata nei terms

### Alternative valutate (e scartate)

| Alternative | Pro | Contro | Verdetto |
|---|---|---|---|
| **Semrush API** | DB più ricco e brand riconosciuto | Caro (500+ €/mese), contratto annuale, no pay-as-go | ❌ overkill per PMI |
| **Ahrefs API** | Backlink DB best-in-class | Pricing enterprise, no public API access | ❌ no PMI |
| **SerpAPI** | Più veloce (2-3s vs 4-5s DataForSEO) | Solo SERP (no keywords/backlinks/audit), $15/1k vs $10/1k | ❌ ci servirebbero 3 provider |
| **ScrapingBee** | Browser rendering reale | Lentissima (median 20s), focus scraping non-SERP | ❌ wrong tool |
| **Costruire scraper interno** | Zero costi | Viola ToS Google, richiede proxy residential, fragile | ❌ legal/ops risk |

### Costo previsto

| Volume | Calls/mese | Costo /mese |
|---|---|---|
| Cliente piccolo (10 keyword tracked, weekly audit) | ~500 | ~0.5 USD |
| Cliente medio (50 keyword, daily rank, weekly SEO overview) | ~2.000 | ~2-3 USD |
| Cliente grande (200 keyword, daily rank, daily SEO overview) | ~8.000 | ~8-12 USD |

**Caps proposti**: rate limit per progetto = max 10 USD/mese (alert oltre 7 USD). Hard ceiling globale REZEN configurabile.

### ⚠️ Caveat compliance — APERTO

**Data residency EU**: DataForSEO non pubblicizza dove fisicamente sono i loro server. Hanno DPA GDPR-compliant ma posizione fisica server non chiara dal sito.

**Azione richiesta**:
- Aprire ticket support DataForSEO con domande:
  1. "Where are your servers physically located?"
  2. "Do you offer EU-only data processing option?"
  3. "Can you share signed DPA copy for our records?"
- Aggiornare ROPA VerumFlow una volta confermato

**Mitigazione**: i dati che inviamo a DataForSEO sono **keyword + URL pubblici**, **nessun PII** di utenti finali. Quindi il rischio GDPR sostanziale è basso. Resta solo trasparenza ROPA.

### Proposta sign-off

```
[ ] Approvato — procediamo con DataForSEO
[ ] Approvato condizionato — procediamo dopo conferma data residency EU
[ ] Da rivalutare — proporre alternativa: ____________________

Firma: _______________________  Data: __________
```

---

## Decisione 2 — AI Visibility (GEO/AEO): Build interno

### Cosa serve

Card Dashboard v.2 "Visibilità IA" che mostra quanto il brand del cliente è menzionato/citato dai LLM commerciali (ChatGPT, Gemini, Claude, eventualmente Perplexity). Numeri richiesti: counter visibilità totale, menzioni per modello, pagine citate per modello.

### Soluzione scelta: Build interno multi-LLM

**Razionale**:
- ✅ Stack già esistente: Anthropic SDK 0.90.0 in produzione
- ✅ Costo reale solo token LLM (~3-5 USD/cliente/mese)
- ✅ **Differenziante**: REZEN può fare custom prompt set per settore cliente, cosa che provider commerciali non offrono
- ✅ **Coerente con narrativa "AI-driven"** dell'app
- ✅ **Zero vendor lock-in**: se OpenAI/Anthropic cambiano pricing, possiamo switchare modelli al volo
- ✅ Niente sub-processor extra in ROPA (Anthropic e Google sono già sub-processor noti)

**Approccio tecnico**:
- Config per progetto: lista N "prompt tipici" del settore (es. "qual è il miglior commercialista a Milano?")
- Cron giornaliero: per ogni prompt × ogni modello → query parallel via `multi-llm-client.ts`
- Parsing risposta: regex-based + LLM-assisted per estrarre menzioni brand cliente + URL citati
- Storage: `projects/{id}/aiVisibility/{date}` con counter aggregati + log dettagli

### Alternative valutate (e scartate)

| Alternative | Pro | Contro | Verdetto |
|---|---|---|---|
| **Profound** | Provider specializzato GEO/AEO, dashboard pronto | 200-2.000+ €/mese, vendor lock-in, sub-processor extra | ❌ caro, niente customizzazione |
| **Peec.ai** | Free tier, focus AI search | Coverage limitata, dipendenza da provider giovane | ❌ rischio continuity |
| **AthenaHQ / OtterlyAI / BrandRank.AI** | Provider emergenti, dashboard pronto | Tutti early-stage, pricing variabile, lock-in | ❌ rischio vendor + costo |
| **Build interno semplice** | Controllo totale, bassa spesa | Devi mantenere tu il codice e prompt set | ✅ scelto |

### Costo previsto

| Setup | Token/mese/cliente | Costo /mese/cliente |
|---|---|---|
| 10 prompt × 3 modelli × 30gg | ~900 query × ~$0.005 = ~$4.5 | ~3-5 USD |
| Aggressive (20 prompt × 4 modelli × daily) | ~2.400 query × ~$0.005 = ~$12 | ~8-12 USD |

**Caps proposti**: budget LLM per progetto = max 10 USD/mese (alert oltre 7 USD).

### Proposta sign-off

```
[ ] Approvato — procediamo con build interno
[ ] Da rivalutare — preferiamo provider commerciale: ____________________

Firma: _______________________  Data: __________
```

---

## Decisione 3 — Marketing data (Meta/Google/GA4/AdSense): API native

### Cosa serve

Modulo Analytics v.2 deve leggere dati da: Google Ads, Meta Ads, Google Analytics 4, Google AdSense. KPI essenziali in dashboard, link redirect alle piattaforme native per analisi profonde.

### Soluzione scelta: API native ufficiali

**Razionale**:
- ✅ **API ufficiali Meta/Google sono gratuite** (oltre rate limits generosi)
- ✅ **Niente sub-processor extra**: i dati restano nel rapporto cliente ↔ Google/Meta che già esiste
- ✅ **Filosofia coerente** con la v.2 (app come "livello intermedio di lettura", non sostituto piattaforme native)
- ✅ Per ogni KPI Analytics → bottone "Apri in [piattaforma]" deep-link

**SDK ufficiali in TypeScript/JS**:
- **Google Ads**: `google-ads-api` (Apache 2.0)
- **GA4 Data API**: `@google-analytics/data` (Apache 2.0)
- **AdSense Management API**: SDK Google generico
- **Meta Marketing API**: `facebook-nodejs-business-sdk` (Meta Open Source)

### Alternative valutate (e scartate)

| Alternative | Pro | Contro | Verdetto |
|---|---|---|---|
| **Supermetrics** (aggregator) | UI unificata, più connector | 200-1.000+ €/mese, sub-processor extra, overkill per use case | ❌ caro inutilmente |
| **Funnel.io** (aggregator) | Data warehouse-grade | Enterprise pricing, complesso | ❌ overkill |
| **Improvado** | Enterprise data pipeline | Costo enterprise | ❌ no PMI |

### Costo previsto

**0 €** mensili, tranne lavoro di sviluppo iniziale (incluso in Sprint S9).

**Approval setup richiesto** (one-time):
- **Google Ads developer token**: approval Google 1-5gg lavorativi
- **Meta App + System User**: setup Business Manager (1-2 ore)
- **GA4 service account**: GCP standard
- **AdSense OAuth**: GCP standard

### Proposta sign-off

```
[ ] Approvato — procediamo con API native
[ ] Da rivalutare — preferiamo aggregator: ____________________

Firma: _______________________  Data: __________
```

---

## Decisioni interne (info-only, già confermate)

Queste 3 scelte non hanno provider esterno, sono decisioni architetturali interne. Riportate per trasparenza.

### CMS engine — estensione Puck (interno)

Puck (libreria visual editor MIT, già nello stack rezen-sites) verrà estesa per coprire i gap CMS identificati nel Blocco 1 (text editing, reorder, relations). **Decisione strategica aperta**: orientamento Framer-style (SEO-first) vs Webflow-style (CMS scalabile). Da definire pre-Sprint S7 in workshop dedicato.

### CRM Lead Pipeline — modulo interno

I form già scrivono su Firestore. Aggiungiamo schema `leads` + UI kanban + status machine + audit log. Niente provider esterno (Notion / Twenty / HubSpot). Vantaggi: RBAC unificato, niente sub-processor in ROPA, coerenza UX, costi zero.

### Webhook router / automation — Cloud Functions Firebase

Niente n8n / Zapier / Make. Cloud Functions native coprono: Firestore triggers (form submitted → lead), scheduled jobs (sync DataForSEO, AI Visibility daily), notifications, rate limiting. Stesso billing/IAM/logging del progetto, niente infra parallela, già nello scope Compliance Playbook §3.4-3.5.

---

## Quadro costi consolidato

### Costo totale provider esterni v.2 — stima per cliente

| Componente | Costo /cliente/mese |
|---|---|
| DataForSEO (SEO + Rank + Backlinks) | 2-10 USD |
| AI Visibility (Anthropic + OpenAI + Gemini token) | 3-5 USD |
| Lighthouse PSI / Meta API / Google APIs | 0 USD |
| Firebase infra (Firestore + Functions + Hosting) condivisa | ~1-3 USD (frazione del totale REZEN) |
| **Totale per cliente** | **~6-18 USD/mese** |

### Confronto vs stack tutto-paid equivalente

| Componente | Paid equivalent | Costo /cliente/mese |
|---|---|---|
| SEO suite (Semrush plan) | Semrush Pro | ~30-50 USD (split) |
| AI Visibility (Profound) | Profound base | ~50-100 USD |
| Site Audit (Sitebulb / Semrush) | Sitebulb | ~10-20 USD |
| CRM (HubSpot / Notion) | HubSpot Starter | ~10-20 USD |
| Automation (Zapier + n8n) | Zapier Pro | ~10-20 USD |
| Marketing aggregator (Supermetrics) | Supermetrics | ~30-50 USD |
| **Totale paid stack** | | **~140-260 USD/mese** |

**Risparmio mensile per cliente**: **~120-240 USD** (ovvero **~90% risparmio** sui tool esterni).

A 10 clienti = ~1.500-2.500 USD/mese risparmiati. A 50 clienti = ~7.000-12.000 USD/mese risparmiati.

### Trade-off accettati

- **+2-3 settimane di setup iniziale** (Sprint S0 + S3 + S6) per build interno vs comprare provider
- **Manutenzione**: il codice interno va mantenuto da REZEN (vs vendor che fa update gratis)
- **Differenziazione vendita**: REZEN può vendere "AI Visibility custom per settore" come feature unica vs concorrenti che usano Profound generico

---

## Action items pre-go-live v.2

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | Aprire ticket DataForSEO data residency EU | Francesco | Pre-Sprint S4 |
| 2 | Setup Meta Business Manager + Facebook Developer App + System User token | Francesco | Pre-Sprint S9 |
| 3 | Richiedere Google Ads developer token (approval 1-5gg) | Francesco | Pre-Sprint S9 |
| 4 | Aggiornare `Compliance/ROPA_VerumFlow.md` con nuovi sub-processor (DataForSEO, OpenAI, Gemini, Meta, Google Ads/GA4/AdSense) | Francesco + Claude Code | Pre-Sprint S4 |
| 5 | Workshop strategico orientamento CMS (Framer-style vs Webflow-style) | Francesco + soci | Pre-Sprint S7 |
| 6 | Brief strategico SEO Research (cosa deve fare il modulo) | Francesco | Pre-Sprint S8 |
| 7 | Brief comportamento "Fix" su Alerts | Francesco | Pre-Sprint S12 |

---

## Cronologia revisioni

| Data | Versione | Modifiche |
|---|---|---|
| 2026-04-30 | 1.0 | Prima stesura — 3 decisioni provider sign-off + 3 decisioni interne info-only + quadro costi |

---

## Sign-off finale soci

```
Decisione 1 (DataForSEO):       [ ] Approvato  [ ] Condizionato  [ ] Rivedere
Decisione 2 (AI Visibility build interno):  [ ] Approvato  [ ] Rivedere
Decisione 3 (API native marketing):  [ ] Approvato  [ ] Rivedere

Note / sostituzioni proposte:
___________________________________________________________________________
___________________________________________________________________________

Approvato da:                              Data:
__________________________ (Francesco)     __________
__________________________ (Socio 1)       __________
__________________________ (Socio 2)       __________
```

Una volta approvato, questo documento diventa **input vincolante** per `SPRINT_PLAN_V1_TO_V2.md` e per la fase DOC 3.
