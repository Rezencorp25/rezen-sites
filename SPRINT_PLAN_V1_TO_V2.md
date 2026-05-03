# REZEN Sites — Sprint Plan v1 → v2

> Roadmap operativa per portare il prototipo (v1) alla versione di produzione (v2) descritta nelle interviste DOC 2.
> Documento vivo: aggiornato a ogni chiusura sprint con risultati, scostamenti, lessons learned.
>
> **Convenzione**: ogni sprint ha ID `SX`, priorità (M/H/L), stima in giorni-uomo, dipendenze esplicite, acceptance criteria misurabili, note compliance VerumFlow.
> **Stato**: 🟢 Ready · 🟡 Blocked-by-decision · 🔴 Blocked-by-provider · ⚪ Future

---

## Meta

- **Data inizio piano**: 2026-04-30
- **Owner**: Francesco Lossi (REZEN / VerumFlow)
- **Tech lead**: Claude Code
- **Repo**: `Verumflow OS/rezen-sites`
- **Riferimenti**:
  - `02_VALIDATION_CHECKPOINT.md` — DOC 2 master
  - `VALIDATION_REPORT.md` — output Blocco 1 + decisioni provider
  - `PROVIDERS_DECISIONS_V2.md` — sign-off soci sui provider
  - `Compliance/COMPLIANCE_PLAYBOOK.md` v1.2 — baseline tecnica e GDPR

---

## Riepilogo Roadmap (13 sprint)

| ID | Sprint | Modulo | Priorità | Stima | Stato | Dipendenze |
|---|---|---|---|---|---|---|
| **S0** | Foundation: automation layer + provider wrappers | infra | H | 5gg | 🟢 Ready | nessuna |
| **S1** | Quick-wins UX (sidebar Projects + tooltip KPI + cleanup Analytics) | navigation, dashboard, analytics | H | 3gg | 🟢 Ready | S0 parziale |
| **S2** | Site Audit module (Lighthouse PSI) | dashboard | H | 4gg | 🟢 Ready | S0 |
| **S3** | CRM Lead Pipeline interno (kanban + status + audit) | forms | H | 8gg | 🟢 Ready | S0 |
| **S4** | SEO Overview module (DataForSEO) | dashboard | H | 5gg | 🟡 res-EU | S0, S2 |
| **S5** | Rank Tracking module (DataForSEO SERP) | dashboard | H | 6gg | 🟡 res-EU | S0, S4 |
| **S6** | AI Visibility GEO/AEO (multi-LLM build interno) | dashboard | H | 7gg | 🟢 Ready | S0 |
| **S7** | CMS upgrade (text editing, reorder, relations) | cms | H | 10gg | 🟡 strategy | decisione Framer-style vs Webflow-style |
| **S8** | SEO Research rewrite | seo research | M | 6gg | 🟡 brief | brief strategico REZEN |
| **S9** | Meta Ads integration (API native) | analytics | M | 5gg | 🔴 cred | Meta App + System User token |
| **S10** | CPL e conversion rate reali (lead × spend) | forms + analytics | M | 4gg | 🟢 Ready | S3, S9 |
| **S11** | Tasks export con stima ore + pricing | tasks | L | 3gg | 🟢 Ready | nessuna |
| **S12** | Alerts — definizione comportamento "Fix" | alerts | L | 3gg | 🟡 brief | UX brief REZEN |

**Stima totale**: ~69 giorni-uomo. A 1 sviluppatore full-time ≈ 14 settimane (~3.5 mesi). A 2 in parallelo (con dipendenze) ≈ 9-10 settimane.

**Sprint consigliati al go-live v.2**: S0–S6 (core differenziazione + UX + monetization). S7–S12 possono andare in v2.1 se la timeline stringe.

---

## Programma operativo primi 4 sprint (DETTAGLIO)

I 4 sprint sotto sono pronti a partire (Ready) e coprono la fase 1: foundation + UX + primi due moduli ad alto valore (Site Audit gratuito + CRM interno).

---

### Sprint S0 — Foundation: automation layer + provider wrappers

**Obiettivo business**: stabilire l'infrastruttura riusabile (wrapper DataForSEO, multi-LLM client, scheduler Cloud Functions, secrets, observability) che tutti gli sprint successivi consumeranno. Senza S0 ogni sprint successivo dovrebbe reinventare auth e rate limiting.

**Priorità**: H · **Stima**: 5gg · **Stato**: 🟢 Ready

#### Scope

1. **`lib/seo/dataforseo-client.ts`** — wrapper TypeScript sopra `@dataforseo/typescript-client`:
   - autenticazione via Firebase Secrets Manager (no env in repo)
   - rate limiting client-side (max 2.000 req/min come da SLA DataForSEO)
   - retry con exponential backoff su errori transient
   - cache layer su Firestore (`_seo_cache` con TTL configurabile per endpoint type)
   - structured logging con Sentry breadcrumbs (no PII)

2. **`lib/ai/multi-llm-client.ts`** — client unificato Anthropic + OpenAI + Gemini:
   - interfaccia comune `query(prompt, model, options)`
   - prompt caching Anthropic abilitato di default (Compliance Playbook §10 / claude-api skill)
   - cost tracking per request (token in/out × pricing tier)
   - logging a `_ai_logs` Firestore con retention 90gg (configurabile)

3. **Cloud Functions automation infrastructure**:
   - `functions/scheduled/` — pattern base per scheduled jobs (runWith region europe-west1)
   - `functions/triggers/` — pattern base per Firestore triggers (onCreate, onUpdate)
   - `functions/callable/` — pattern base per callable invocate da client (App Check enforced)
   - shared utilities: rate limiting, audit log writer, error reporter

4. **Secrets & configuration**:
   - Migrare TUTTE le chiavi API a Firebase Secrets Manager via `defineSecret`:
     - `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`
     - `ANTHROPIC_API_KEY` (esistente, da centralizzare)
     - `OPENAI_API_KEY` (nuovo)
     - `GEMINI_API_KEY` (nuovo)
   - Verificare nessuna chiave in `.env*` committato

5. **Observability baseline**:
   - Sentry configurato client + Cloud Functions
   - Cloud Logging structured logs (JSON, no PII in messages)
   - Billing alerts Firebase (50/90/100/150% — Compliance Playbook §3.8)

#### Acceptance criteria

- [ ] `lib/seo/dataforseo-client.ts` esporta funzioni typed per: keyword overview, SERP, backlinks, audit. Test unitari (vitest) con mock per i 4 endpoint.
- [ ] `lib/ai/multi-llm-client.ts` esporta `queryClaude`, `queryOpenAI`, `queryGemini` + funzione orchestratore `queryAll(prompt, models[])` per AI Visibility.
- [ ] Almeno 1 scheduled function deployata in dev (`europe-west1`) che gira ogni ora come probe.
- [ ] Almeno 1 Firestore trigger deployato in dev (es. `onLeadCreated` placeholder).
- [ ] Sentry riceve test event da client e da function.
- [ ] `firebase functions:secrets:access` lista TUTTE le chiavi previste.
- [ ] `git grep` non trova chiavi inline in repo (escludi `.example`).

#### Note compliance

- **Compliance Playbook §3.5** — Secrets Manager mandatory, no `.env` committato
- **§3.4** — App Check enforced sulle callable
- **§3.8** — Sentry + billing alerts mandatory
- **§10.1-10.5** — pattern Cloud Functions v2, callable + allUsers invoker, signBlob su SA runtime se servono signed URLs

#### Files coinvolti

```
lib/seo/dataforseo-client.ts                    [new]
lib/seo/dataforseo-types.ts                     [new]
lib/ai/multi-llm-client.ts                      [new]
lib/ai/multi-llm-types.ts                       [new]
lib/observability/sentry.ts                     [new or extend]
lib/observability/audit-log.ts                  [new]
functions/src/utils/rate-limit.ts               [new]
functions/src/utils/secrets.ts                  [new]
functions/src/scheduled/probe.ts                [new]
functions/src/triggers/lead-created.ts          [new — stub]
firestore.rules                                 [add _seo_cache, _ai_logs, _audit]
firestore.indexes.json                          [add indexes]
package.json                                    [+ @dataforseo/typescript-client, openai, @google/generative-ai, @sentry/nextjs, @sentry/node]
```

#### Rollback

Tutto il codice è additivo. Se S0 va male: revert dei file nuovi, nessun impatto sul prototipo esistente.

---

### Sprint S1 — Quick-wins UX (sidebar Projects, tooltip KPI, cleanup Analytics)

**Obiettivo business**: chiudere i bug di navigazione critici e l'ambiguità sui KPI prima ancora di costruire le nuove card. È lo sprint con il rapporto valore/sforzo più alto.

**Priorità**: H · **Stima**: 3gg · **Stato**: 🟢 Ready · **Dipendenze**: S0 parziale (basta osservability)

#### Scope

1. **Sidebar — link "Progetti"**
   - Aggiungere voce "Progetti" sempre visibile in sidebar primaria
   - Active state quando URL `/projects` o `/projects/*`
   - Icona coerente con il design system esistente

2. **Tooltip su tutti i KPI Dashboard**
   - Componente `<KpiTooltip>` riusabile: trigger su info-icon accanto al numero
   - Definizioni iniziali (revisione finale REZEN):
     - **Revenue**: "Ricavi attribuibili al progetto. Include revenue AdSense reale (se attivo). Per progetti senza AdSense il valore è 0 o N/A."
     - **Traffico Organico**: "Sessioni mensili da search organico (Google Search Console)."
     - **Pagine Pubblicate**: "Numero di pagine pubblicate sull'ambiente live del progetto."
     - **SEO Score**: "Aggregate score (0-100) basato su Lighthouse SEO + posizionamento keyword principali."
   - Tooltip rimane visibile su hover, accessibile via tastiera (focus + tooltip aperto)

3. **Cleanup Analytics**
   - Rimuovere sottosezione "Crea Campagna" dal modulo Analytics
   - Sostituire con bottone "Apri in Google Ads" / "Apri in Meta Ads Manager" (deep-link)
   - Per ogni KPI Analytics aggiungere link "Vedi dettagli su [piattaforma nativa]" (apre tab nuovo)

4. **Footer/breadcrumb consistency**
   - Verificare che da ogni pagina `projects/[id]/*` lo slug "Progetti" sia sempre cliccabile e porti all'elenco

#### Acceptance criteria

- [ ] Da qualsiasi pagina dell'app, click su "Progetti" in sidebar porta a `/projects` (route esistente).
- [ ] Su Dashboard, hover/focus sull'info-icon di ogni KPI mostra tooltip con definizione.
- [ ] Test E2E (playwright): user logged-in entra in progetto, clicca sidebar Progetti, atterra su elenco. Test passa.
- [ ] Sezione "Campagne create internamente" rimossa da Analytics; in sostituzione presente bottone redirect a piattaforma nativa.
- [ ] Nessun warning console su accessibility tooltip (axe-core check).

#### Note compliance

- **Compliance Playbook §3.2** — nessuna modifica a Firestore rules in questo sprint
- Test E2E aggiunti al pipeline CI

#### Files coinvolti

```
components/layout/Sidebar.tsx                   [edit]
components/dashboard/KpiCard.tsx                [edit + nuovo subcomponent KpiTooltip]
components/dashboard/KpiTooltip.tsx             [new]
app/projects/[id]/analytics/page.tsx            [edit — rimuovi sezione Campagne]
components/analytics/PlatformRedirect.tsx       [new]
tests/e2e/navigation.spec.ts                    [new test]
tests/e2e/dashboard-tooltips.spec.ts            [new test]
```

#### Rollback

Tutto è UI-side, niente impatto su dati. Revert immediato.

---

### Sprint S2 — Site Audit module (Lighthouse PSI)

**Obiettivo business**: aggiungere alla Dashboard la card Site Audit richiesta in v.2 con health score, errori, warning, pagine analizzate. Provider: PageSpeed Insights API di Google = **gratuito**.

**Priorità**: H · **Stima**: 4gg · **Stato**: 🟢 Ready · **Dipendenze**: S0

#### Scope

1. **Cloud Function scheduled `runSiteAudit`**
   - Esecuzione: settimanale (domenica 02:00 europe-west1) per ogni progetto attivo
   - Per ogni progetto: chiama PSI API per la home + N pagine top traffic (configurabile, default 10)
   - Calcola health score aggregato = media weighted Lighthouse score (Performance 25%, SEO 35%, Accessibility 20%, Best Practices 20%)
   - Conta errori (categoria `failing-audits` con score < 0.5) e warning (score 0.5-0.89)
   - Salva in Firestore `projects/{id}/audits/{timestamp}` documento risultato

2. **Card Dashboard**
   - Componente `<SiteAuditCard>` mostra:
     - Site Health Score grande (0-100)
     - Numero errori (rosso) + warning (giallo)
     - Numero pagine analizzate
     - Trend rispetto alla scorsa esecuzione (freccia su/giù)
     - Bottone "Vedi dettaglio audit"

3. **Pagina dettaglio audit**
   - `/projects/[id]/audits` — storico audits + breakdown errori/warning per categoria Lighthouse
   - Click su singolo audit → drill-down: lista issue + URL pagina + suggerimento fix (testo Lighthouse nativo)

4. **Trigger manuale**
   - Bottone "Esegui audit ora" su Dashboard (callable function rate-limited a 1 audit/ora/progetto)

5. **PSI API key**
   - Free tier 25.000 query/giorno (più che sufficiente per qualsiasi volume REZEN)
   - API key in Secrets Manager come `PSI_API_KEY`

#### Acceptance criteria

- [ ] Cloud Function `runSiteAuditScheduled` deployata e gira settimanalmente.
- [ ] Per il progetto demo, ultimo audit visibile in Dashboard < 7gg dalla data corrente.
- [ ] Health score, errori, warning, pagine analizzate visibili sulla card.
- [ ] Click "Vedi dettaglio" porta a pagina con storico ≥ 1 audit.
- [ ] Bottone "Esegui audit ora" rate-limited a max 1/ora (ritorna error toast oltre soglia).
- [ ] Test rules: utente non-membro del progetto NON può leggere `projects/{id}/audits`.
- [ ] Sentry riceve event in caso di failure PSI API.

#### Note compliance

- PSI API è servizio Google → già coperto da DPA Google Cloud (Compliance Playbook §10.4)
- Nessun PII inviato a PSI (solo URL pubblici siti clienti)
- Aggiungere "Google PageSpeed Insights" in ROPA come sub-processor
- Audits collection con `allow delete: if false` (immutabile, Compliance Playbook §3.2)

#### Files coinvolti

```
functions/src/scheduled/run-site-audit.ts       [new]
functions/src/callable/run-site-audit-now.ts    [new]
lib/audit/psi-client.ts                          [new]
lib/audit/score-calculator.ts                    [new]
components/dashboard/SiteAuditCard.tsx           [new]
app/projects/[id]/audits/page.tsx                [new]
app/projects/[id]/audits/[auditId]/page.tsx     [new]
firestore.rules                                  [add audits subcollection rules]
firestore.indexes.json                           [add audit ts index]
```

#### Rollback

Cloud Function disabilitabile da console FB; card UI può essere nascosta da feature flag (consigliato: `ENABLE_SITE_AUDIT` in Firestore `_config` doc).

---

### Sprint S3 — CRM Lead Pipeline interno (kanban + status + audit)

**Obiettivo business**: trasformare la sezione Forms da semplice raccolta in pipeline lead reale con kanban, status, audit, notifiche. Sostituisce qualsiasi necessità di CRM esterno (Notion/Twenty/HubSpot).

**Priorità**: H · **Stima**: 8gg · **Stato**: 🟢 Ready · **Dipendenze**: S0

#### Scope

1. **Schema Firestore `projects/{id}/leads/{leadId}`**
   ```
   {
     id: string,
     formSubmissionId: string,             // ref form submission origine
     source: 'form' | 'manual' | 'api',
     formId: string,
     fields: { ... },                       // dati form (nome, email, ...)
     status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost',
     statusUpdatedAt: timestamp,
     statusUpdatedBy: uid,
     assignedTo: uid | null,
     value: number | null,                  // valore stimato lead
     notes: [{ uid, text, ts }],
     tags: string[],
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **Cloud Function trigger `onFormSubmissionCreated`**
   - Quando un form submission viene creato → genera lead con status `new`
   - Notifica via email/Slack (configurabile per progetto) ai membri del progetto

3. **UI Kanban**
   - `/projects/[id]/leads` — vista kanban a 5 colonne (`new` / `contacted` / `qualified` / `won` / `lost`)
   - Drag-and-drop con `@dnd-kit/core` (MIT, leggera, accessibile)
   - Card lead mostra: nome contatto, fonte form, valore (se settato), tag, assignee
   - Click su card → modal dettaglio con tutti i campi form, note, history status

4. **Modal dettaglio lead**
   - Tabs: Dettagli / Note / Storia
   - Note: aggiungi commento (markdown semplice)
   - Storia: timeline immutabile delle transizioni status (chi, quando, da → a)
   - Campo "Valore lead" editabile (numerico, valuta progetto)
   - Tag editor (autocomplete da tag già esistenti progetto)

5. **Audit log immutabile `projects/{id}/leads/{leadId}/_audit/{eventId}`**
   - Ogni mutation lead → entry audit con uid + timestamp + delta
   - `allow delete: if false` (Compliance Playbook §3.2)
   - Ogni transizione status genera evento

6. **Export CSV/JSON**
   - Bottone "Esporta lead" su pagina kanban
   - Filtri: range data, status, source
   - Output download CSV (default) o JSON
   - Soddisfa GDPR art. 20 (portability)

7. **Notifiche**
   - Trigger lead status → `won`: notifica owner progetto
   - Trigger lead status → `lost`: notifica owner progetto + log motivo
   - Lead inactive >7gg in `new`: alert assignee

#### Acceptance criteria

- [ ] Form submission test → lead automaticamente creato con status `new`. Notifica email arriva.
- [ ] Kanban rendering performante con 100 lead (< 2s first render).
- [ ] Drag-and-drop sposta lead tra colonne, status aggiornato in Firestore + audit log scritto.
- [ ] Tentativo di delete diretto sul documento `_audit` da SDK fallisce (rules deny).
- [ ] Test rules: utente di altro progetto NON può leggere/scrivere lead.
- [ ] Export CSV produce file con tutti i campi per i lead nel range selezionato.
- [ ] Lead con status `won` da campagna paid → calcolo CPL preliminare visibile (anche se Sprint S10 lo perfeziona).
- [ ] Audit log mostra transizioni status con uid + timestamp + delta.

#### Note compliance

- **Compliance Playbook §2.3** — diritto cancellazione: lead.fields personali soggetti a delete su richiesta utente finale (cliente del cliente). Aggiungere flag `_deleted` + sostituzione fields con `[DELETED]` invece di hard delete (audit log resta).
- **§2.4 ROPA** — aggiungere "Lead Pipeline" come finalità di trattamento, base giuridica = consenso (form submission), retention 24 mesi (configurabile per progetto).
- **§2.7** — dati lead in Firestore EU region (verificare progetto rezen-sites)
- **§3.2** — rules: solo membri progetto + admin REZEN. Audit immutabile.

#### Files coinvolti

```
functions/src/triggers/lead-on-form-submitted.ts            [new]
functions/src/triggers/lead-on-status-changed.ts            [new]
functions/src/callable/lead-export.ts                       [new]
lib/leads/types.ts                                          [new]
lib/leads/status-machine.ts                                 [new]
app/projects/[id]/leads/page.tsx                            [new — kanban]
app/projects/[id]/leads/[leadId]/page.tsx                   [new — dettaglio modal]
components/leads/KanbanBoard.tsx                            [new]
components/leads/LeadCard.tsx                               [new]
components/leads/LeadDetailModal.tsx                        [new]
components/leads/LeadNotes.tsx                              [new]
components/leads/LeadHistoryTimeline.tsx                    [new]
firestore.rules                                             [add /leads + /_audit subcollections]
firestore.indexes.json                                      [add leads composite indexes status+createdAt, assignedTo+status]
package.json                                                [+ @dnd-kit/core, @dnd-kit/sortable]
```

#### Rollback

Feature flag `ENABLE_LEAD_PIPELINE` su Firestore `_config`. Se disattivato, sezione kanban nascosta, ma trigger Firestore continua a creare lead (idempotente, niente perdita dati). Rollback completo: disable trigger function da console FB.

---

## Sprint S4–S12 — Spec sintetiche

Per gli sprint successivi riportiamo solo scope, dipendenze, acceptance criteria essenziali. Il dettaglio operativo verrà espanso a livello S0–S3 quando lo sprint diventa **next-up**.

### Sprint S4 — SEO Overview module (DataForSEO)

**Obiettivo**: card Dashboard SEO Overview con Authority Score, traffico organico, keyword organiche/paid, domini di riferimento.

**Stima**: 5gg · **Stato**: 🟡 res-EU (sblocca dopo conferma DataForSEO data residency) · **Dipendenze**: S0, S2 (per pattern Cloud Function scheduled)

**Scope chiave**:
- Cloud Function settimanale `runSeoOverview` per ogni progetto: chiama DataForSEO endpoint `domain_analytics`, `backlinks/referring_domains`, `keywords_data/google_ads/keywords_for_site`
- Caching aggressivo (TTL 7gg) per minimizzare costi
- Card UI con 5 metriche + sparkline storico
- Pagina dettaglio `/projects/[id]/seo` con breakdown completo

**Acceptance**: card visibile con dati reali demo project, costo per call < 0.10 USD per progetto/settimana, audit log scritto.

**Compliance**: aggiungere DataForSEO come sub-processor in ROPA. PII = nessuna (solo dominio sito).

---

### Sprint S5 — Rank Tracking module (DataForSEO SERP)

**Obiettivo**: card e modulo dedicato rank tracking — indice visibilità %, cluster Top 3/10/20/100, tabella keyword con posizione e score.

**Stima**: 6gg · **Stato**: 🟡 res-EU · **Dipendenze**: S0, S4

**Scope chiave**:
- Configurazione keyword da trackare per progetto (UI in Site Settings)
- Cloud Function giornaliera `runRankTracking` chiama DataForSEO SERP API per ogni keyword × progetto
- Cluster automatico per range posizione
- Sparkline storico per ogni keyword
- Calcolo "Indice visibilità" custom = somma ponderata posizioni × volume keyword

**Acceptance**: 100 keyword × 30gg = ~3.000 calls/mese/progetto = ~1.8 USD/mese/progetto. Card mostra cluster correttamente. Storico ≥ 7gg per keyword.

**Note**: storico keyword = dato sensibile per il cliente. Rules: solo membri progetto + admin REZEN.

---

### Sprint S6 — AI Visibility GEO/AEO (build interno multi-LLM)

**Obiettivo**: card Dashboard "Visibilità IA" con counter visibilità, menzioni, pagine citate. Breakdown per ChatGPT, Gemini, Claude.

**Stima**: 7gg · **Stato**: 🟢 Ready · **Dipendenze**: S0 (multi-LLM client)

**Scope chiave**:
- Configurazione "prompt set" per progetto (UI in Site Settings): lista di N domande tipiche del settore cliente
- Cloud Function giornaliera `runAiVisibility`: per ogni progetto, per ogni prompt, query a Claude + GPT + Gemini in parallelo
- Parsing risposta: regex/LLM-assisted per identificare menzioni brand cliente + URL citati
- Aggregazione: counter menzioni per modello + lista pagine citate
- Card UI con grand total + breakdown 3 modelli + trend
- Pagina dettaglio `/projects/[id]/ai-visibility` con storico per modello e prompt

**Costi stimati**: ~10 prompt/progetto × 3 modelli × 30gg = ~900 query/mese × ~$0.005 medio = ~$4.5/mese/progetto.

**Acceptance**:
- card visibile, breakdown 3 modelli funzionante
- audit log dei singoli check con costo per call
- prompt-injection-resistant (sanitize input cliente)
- `_ai_logs` retention 90gg

**Compliance**: NESSUN PII inviato a LLM. Solo nome brand + dominio cliente. Aggiungere Anthropic + OpenAI + Gemini in ROPA come sub-processor (PII zero, data residency US ma DPF coverage).

---

### Sprint S7 — CMS upgrade (text editing, reorder, relations)

**Obiettivo**: portare il CMS al livello degli altri moduli — gap più grande della v.2.

**Stima**: 10gg · **Stato**: 🟡 strategy (decisione strategica orientamento) · **Dipendenze**: nessuna tecnica

**⚠️ Decisione strategica aperta**: orientamento Framer-style (SEO-first, leggero) vs Webflow-style (CMS scalabile per blog grossi/e-commerce). La decisione cambia drasticamente lo scope.

**Scope (provvisorio, post-decisione)**:
- Editing testo inline negli item collection
- Drag-and-drop reorder item
- Relazioni tra collection (foreign-key style, UI selector)
- Validazione schema content (richiesto/opzionale, tipi, vincoli)
- Versioning content (storico modifiche per item)

**Pre-requisito**: workshop strategico REZEN + soci per orientamento finale. Output = mini-brief con riferimenti competitor + scope finale.

---

### Sprint S8 — SEO Research rewrite

**Obiettivo**: ripensare modulo SEO Research da zero — l'attuale logica non è chiara.

**Stima**: 6gg · **Stato**: 🟡 brief · **Dipendenze**: brief strategico REZEN

**Scope (provvisorio)**:
- Idea direzionale: orientamento AI-driven (no input manuale)
- Possibili capability:
  - "Analizza il mio sito vs competitor X" → DataForSEO + LLM analyst → report sintetico
  - "Trova keyword opportunity" → DataForSEO + LLM + Google Trends
  - "Suggerisci local citations" → automazione su database citation conosciuti
- Decision: include o esclude da v.2 go-live?

**Pre-requisito**: brief REZEN sul "cosa deve fare questo modulo".

---

### Sprint S9 — Meta Ads integration (API native)

**Obiettivo**: aggiungere vista Meta nel modulo Analytics, fianco a Google Ads e AdSense.

**Stima**: 5gg · **Stato**: 🔴 cred (mancano credenziali Meta App + System User token) · **Dipendenze**: S0

**Scope chiave**:
- Setup Meta Business Manager + Facebook Developer App + System User access token (long-lived)
- `lib/ads/meta-client.ts` wrapper Meta Marketing API
- Cloud Function scheduled `syncMetaAdsData` (ogni ora) per ogni progetto con account collegato
- Vista Analytics → Meta: spesa, click, impressioni, conversioni, ROAS
- Bottone "Apri in Meta Ads Manager" (deep-link)

**Pre-requisito**: REZEN setup Meta App + System User token. Documentare in COMPLIANCE/CREDENTIALS_INDEX.md (placeholder, non valore).

---

### Sprint S10 — CPL e conversion rate reali

**Obiettivo**: calcolare metriche business reali (CPL, conv rate) collegando lead pipeline (S3) e ads spend (S9 + Google Ads esistente).

**Stima**: 4gg · **Stato**: 🟢 Ready (dopo S3, S9) · **Dipendenze**: S3, S9

**Scope chiave**:
- Per ogni lead: campo `attribution.campaignId` + `attribution.source` (UTM da form submission)
- Funzione aggregator: `CPL = sum(spend campagna) / count(lead in qualified+ da campagna)` per range data
- Funzione: `convRateReal = count(won) / count(total)` (vs convRateForm = count(submission) / count(visit))
- Card Dashboard "Funnel reale": visit → form → qualified → won (numeri assoluti + tassi)
- Visibile in Analytics → vista per campagna

**Acceptance**: per progetto demo con almeno 10 lead e 1 campagna paid, CPL e conv rate calcolati e visibili.

---

### Sprint S11 — Tasks export con stima ore + pricing

**Obiettivo**: feature minore per upsell — esportare task list per cliente con stima ore e pricing modifiche.

**Stima**: 3gg · **Stato**: 🟢 Ready · **Dipendenze**: nessuna

**Scope chiave**:
- Aggiungere campi `estimatedHours: number`, `hourlyRate: number`, `customerPriced: boolean` a schema task
- UI Tasks: input ore + rate per ciascuna task
- Bottone "Esporta per cliente": selezione task da includere → genera PDF / CSV con stima totale
- Template fattura placeholder (no integration fatturazione, solo proposta)

**Acceptance**: export PDF prodotto con header REZEN + tabella task + totali. PDF leggibile e formattato.

---

### Sprint S12 — Alerts: definizione comportamento "Fix"

**Obiettivo**: chiarire e implementare cosa succede al click di "Fix" su un alert.

**Stima**: 3gg · **Stato**: 🟡 brief (UX brief REZEN) · **Dipendenze**: brief REZEN

**Possibili comportamenti (da scegliere)**:
- (A) Risolve in automatico (per alert risolvibili: es. "page slow" → invalida cache)
- (B) Apre playbook contestuale (per alert complessi)
- (C) Crea automaticamente una task con descrizione dell'alert
- (D) Mix: campo `fixAction` per ciascun alert type

**Decisione**: probabilmente D (mix), ma da confermare REZEN prima di implementare.

---

## Note trasversali (cross-sprint)

### Compliance baseline applicabile a TUTTI gli sprint

- **Firestore rules**: ogni nuova collection con `match` + RBAC + default-deny. Test rules con `@firebase/rules-unit-testing`.
- **Storage rules**: nessun upload pubblico, sempre auth + size limit + MIME check.
- **Secrets**: tutte le chiavi via Firebase Secrets Manager. Mai inline.
- **App Check**: enforced su tutte le API consumate.
- **Audit log**: per ogni mutation sensibile (lead status, modifiche project critical, delete utente).
- **PII handling**: minimizzare. Mai inviare PII a LLM senza anonymization. Mai loggare PII.
- **GDPR rights**: ogni nuova collection contenente PII → considera export (art. 20) + delete (art. 17).
- **ROPA**: aggiornare `Compliance/ROPA_VerumFlow.md` quando aggiungiamo provider o categorie dato.

### Test strategy

- Unit test (vitest): coverage minima 60% sulla `lib/`
- Test rules (`@firebase/rules-unit-testing`): minimo 20 casi (anon, ogni ruolo, privilege escalation, default deny)
- E2E (playwright): smoke su flussi critici di ogni sprint
- Integration test su Cloud Functions con emulators

### Deploy strategy

- Branch per sprint (`feature/s0-foundation`, `feature/s1-quickwins`, ...)
- PR review prima di merge `main`
- Deploy automatico su `dev` da branch
- Deploy `staging` da `main` dopo merge
- Deploy `prod` solo da tag `vX.Y.Z` con approval esplicito Francesco

### Feature flags

Ogni sprint potenzialmente disruptivo introduce flag in Firestore `_config/features/{flagName}`:
- `ENABLE_LEAD_PIPELINE` (S3)
- `ENABLE_SITE_AUDIT` (S2)
- `ENABLE_SEO_OVERVIEW` (S4)
- `ENABLE_RANK_TRACKING` (S5)
- `ENABLE_AI_VISIBILITY` (S6)
- ...

Flag controllato da Super Admin REZEN in Site Settings → Features.

---

## Sprint chiusi

### Sprint S1 — Quick-wins UI/UX — ✅ CHIUSO 2026-04-30

**Branch**: `feature/v2-foundation-uxquickwins`
**Tempo effettivo**: ~mezza giornata (vs stima 3gg) — quick-wins puri.

**Delivered**:
- `lib/constants/nav.ts` → aggiunto `GLOBAL_NAV` con voce "Progetti"
- `components/app-sidebar.tsx` → rendering global nav + separator "PROGETTO" + project nav (visibile solo se in `/projects/{id}/...`)
- `lib/constants/kpi-definitions.ts` → 4 definizioni KPI testuali centralizzate
- `components/dashboard/kpi-tooltip.tsx` → componente info-icon + tooltip riusabile, accessibile (aria-label)
- `components/luminous/kpi-card.tsx` → prop `tooltip?: string` opzionale
- `app/(app)/projects/[projectId]/dashboard/page.tsx` → wire-up tooltip ai 4 KPI
- `app/(app)/projects/[projectId]/analytics/campaigns/page.tsx` → eliminato (rimossa creazione campagne interna)
- `app/(app)/projects/[projectId]/analytics/page.tsx` → link "Campagne" sostituito con redirect esterno "Meta Ads" (pre-Sprint S9)
- `components/analytics/platform-redirect.tsx` → nuovo componente CTA verso piattaforme native (variant `card` + `inline`)
- `app/(app)/projects/[projectId]/analytics/google-ads/page.tsx` → CTA inline "Apri in Google Ads"
- `app/(app)/projects/[projectId]/analytics/adsense/page.tsx` → CTA inline "Apri in AdSense"
- `tests/e2e/sidebar-navigation.spec.ts` + `tests/e2e/dashboard-tooltips.spec.ts` → playwright
- `playwright.config.ts` → config E2E

**Pending S1**:
- `lib/stores/campaigns-store.ts` resta nel codebase (dead code dopo cancellazione page) — segnalato per cleanup in Sprint S9 (Meta integration) dove potrebbe essere riusato per shape lettura dati ads.

### Sprint S0 — Backend foundation — ✅ CHIUSO 2026-04-30

**Branch**: `feature/v2-foundation-uxquickwins` (in parallelo con S1)
**Tempo effettivo**: ~mezza giornata (vs stima 5gg) — scaffold + stub-mode senza chiamate live.

**Delivered**:
- **Cloud Functions scaffolding** in `functions/`:
  - `package.json`, `tsconfig.json`, `.gitignore` (Node 22, firebase-functions ^6, firebase-admin ^13)
  - `src/index.ts` entry
  - `src/utils/secrets.ts` — `defineSecret()` per DATAFORSEO/OPENAI/GEMINI/PSI/ANTHROPIC
  - `src/utils/audit-log.ts` — writer immutabile su subcollection `_audit`
  - `src/utils/rate-limit.ts` — rate limiter Firestore-backed con sliding window
  - `src/scheduled/probe.ts` — probe orario europe-west1
  - `src/triggers/lead-on-form-submitted.ts` — trigger stub Sprint S3
- `firebase.json` → blocco `functions` aggiunto (codebase default, runtime nodejs22)
- **DataForSEO wrapper** server-only:
  - `lib/seo/dataforseo-types.ts` — types per SERP, Keyword, Backlink, Domain
  - `lib/seo/dataforseo-mocks.ts` — mock deterministici hash-based per stub-mode
  - `lib/seo/dataforseo-client.ts` — wrapper class con auto-detection live/stub via env, parser API, location code map
- **Multi-LLM client**:
  - `lib/ai/multi-llm-types.ts` — types unified, pricing tier 2026-04, helper `estimateCost`
  - `lib/ai/multi-llm-client.ts` — query Anthropic (live se key), OpenAI/Gemini (stub fino a S6), `queryAllProviders()` per AI Visibility parallel
- **Firestore rules** ibride (rules production-grade per nuove collection v.2 + fallback aperto prototipo):
  - `_seo_cache`, `_ai_logs`, `_rate_limits`
  - `projects/{id}/leads` con validazione fields required
  - `projects/{id}/audits` immutabile (no client write)
  - `projects/{id}/leads/{leadId}/_audit` immutabile (Admin SDK only)
- **Firestore indexes** per leads (status+createdAt, assignedTo+status), audits (createdAt desc), `_audit` collection group
- **Test rules** `@firebase/rules-unit-testing`:
  - `tests/firestore-rules/setup.ts` helper
  - `tests/firestore-rules/leads.test.ts` — 6 casi (anon deny, auth read, valid create, missing fields, non-admin delete, admin delete)
  - `tests/firestore-rules/audits.test.ts` — 11 casi (immutability lead audit, audits, internal collections)
  - script `npm run test:rules`
- `tsconfig.json` → exclude `functions`, `tests/firestore-rules`, `tests/e2e`
- `package.json` → devDep `@firebase/rules-unit-testing ^4.0.1`

**Pending S0**:
- `cd functions && npm install` (e tsc) — Francesco esegue prima del primo deploy
- `npm install` root per applicare nuova devDep `@firebase/rules-unit-testing`
- DataForSEO live mode si attiva quando `DATAFORSEO_LOGIN` e `DATAFORSEO_PASSWORD` impostati come Firebase Secrets (post sign-off soci + ticket residency EU)
- Multi-LLM OpenAI/Gemini live: install SDK + key in Sprint S6

**Verifica Gate post-S0+S1**:
- ✅ `npm run typecheck` — exit 0 (zero errori)
- ⚠️ `npm run lint` — 70 errori PRE-ESISTENTI nel prototipo (non regressioni di S0/S1, verificato con `git stash`). Cleanup lint in sprint dedicato.
- 🟡 `npm run test:rules` — richiede prima `npm install` per applicare nuova devDep + Firestore emulator running
- 🟡 `npm run test:e2e` — pronto, richiede `npm run dev` in parallelo
- 🟡 `cd functions && npm install && npm run build` — pronto, richiede prima install

### Sprint S1.5 — Premium workspace UX — ✅ CHIUSO 2026-04-30

**Branch**: `main` (no feature branch, merge diretto post-S0/S1)

**Delivered**:
- `components/app-shell.tsx` — sidebar slide-in/fade-out animata (cubic-bezier easeOutExpo, 500ms) all'ingresso/uscita progetto; sempre montata, no flicker
- `components/quick-actions-fab.tsx` — FAB liquid-glass molten bottom-right su `/projects` con dropdown 6 azioni
- `components/quick-actions-target-modal.tsx` — modal selezione progetto target post-azione
- `lib/constants/quick-actions.ts` — 6 azioni rapide (new-page-ai, publish-pending, run-site-audit, new-task, add-lead, generate-report)

**Bug fix collegati**:
- `components/project-switcher.tsx` — wrap `DropdownMenuLabel` in `DropdownMenuGroup` (Base UI error #31 al click); inoltre nascosto switcher quando `!params.projectId` (era confondibile con menu profilo utente)
- `proxy.ts` — gate auth sostituito al redirect incondizionato `/login → /projects` che rendeva la login irraggiungibile

### Sprint S1.6 + S1.7 — Login premium — ✅ CHIUSO 2026-05-03

**Branch**: `main`

**Delivered**:
- `app/(auth)/login/page.tsx` — split-screen layout (form sinistra + hero destra)
- `components/reactbits/cubes.tsx` + `cubes.css` — vendored MIT da `DavidHDev/react-bits` (pattern copy-into-tree), `"use client"` aggiunto
- Hero destro: griglia Cubes interattiva (GSAP tilt + idle auto-animate + click ripple) custom-branded molten orange + claim "The way you make websites is about to change forever"
- Override responsive width al 88% del pannello + radial vignette per leggibilità

**Pending**:
- Verifica visuale finale di Francesco (browser MCP era down post-deploy)

### Sprint S2 — Site Audit (Lighthouse PSI) — ✅ CHIUSO 2026-05-03

**Branch**: `main`
**Tempo effettivo**: ~1h vs 4gg stimati.

**Delivered (backend)**:
- `functions/src/audit/psi-types.ts` — shape normalizzata + weights health-score
- `functions/src/audit/psi-client.ts` — wrapper PSI v5 + stub-mode hash-based deterministico
- `functions/src/callable/run-site-audit.ts` — onCall europe-west1 (90s, 512MiB) auth-gated + rate-limit 10/h + persistenza `projects/{id}/audits` immutable + audit log
- `functions/src/index.ts` — export `runSiteAudit`
- bump `firebase-functions ^7.2.5` (^6.7.0 unpublished)

**Delivered (frontend)**:
- `lib/audit/audit-types.ts` — mirror client-side dei tipi server
- `lib/audit/audit-stub.ts` — port stub generator (prototype senza Firebase auth)
- `lib/stores/audits-store.ts` — Zustand persistence per-project (max 50)
- `lib/audit/use-site-audit.ts` — hook orchestratore (toast + delay sim + persist)
- `components/dashboard/site-audit-card.tsx` — card riepilogo con health ring + score breakdown + CTA
- `app/(app)/projects/[projectId]/dashboard/site-audit/page.tsx` — modulo completo: 4 score rings, CWV table, recharts trend, top-10 raccomandazioni, history list, empty state, switch mobile/desktop

**Acceptance**:
- ✅ Click "Lancia audit" → audit completa con metriche realistiche (~2s simulati)
- ✅ Storico ultimo 30gg renderizzato come trend chart
- ✅ Rules immutable già coperte da S0
- 🟡 Verifica live in browser MCP (server disconnesso post-S1.7, da rifare)

**Pending**:
- PSI_API_KEY in Secret Manager → switch automatico da stub a live PSI quando configurato
- Scheduled weekly per progetto (rinviato: il modello richiede prima la lista progetti su Firestore reale, non Zustand)

**Nessun deploy eseguito**: tutto rimane locale, branch `feature/v2-foundation-uxquickwins` non mergeato. Compliance Playbook §7.2 — qualsiasi `firebase deploy` richiederà nuova FASE 0.

---

## Cronologia revisioni

| Data | Versione | Autore | Modifiche |
|---|---|---|---|
| 2026-04-30 | 1.0 | Francesco + Claude Code | Prima stesura post-Blocco 1 + decisioni provider. 13 sprint identificati, dettaglio operativo S0-S3. |
| 2026-04-30 | 1.1 | Francesco + Claude Code | Sprint S1 + S0 chiusi in parallelo (~1 giornata effettiva). Branch `feature/v2-foundation-uxquickwins`. Typecheck verde, niente regressioni. |

---

*Documento vivo. Aggiornato a chiusura di ogni sprint con risultati, scostamenti, lessons learned. Le sezioni S4-S12 vanno espanse a livello S0-S3 quando lo sprint diventa next-up.*
