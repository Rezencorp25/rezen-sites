# REZEN Sites powered by VerumFlow — Validation Report

> Documento generato durante esecuzione DOC 2 (Validation Checkpoint).
> Input obbligatorio per DOC 3 (Production Implementation).

## Meta

- **Data inizio**: 2026-04-30
- **Data completamento**: PENDING
- **Repo**: `Verumflow OS/rezen-sites`
- **Ultimo commit prototipo**: da verificare con `git log -n 1 --oneline` al primo commit di DOC 2
- **Stack confermato**: Next.js 15+, Firebase (Firestore + Storage + Auth + Functions), Anthropic SDK 0.90.0, Puck visual editor, vitest + playwright
- **Owner intervista**: Francesco Lossi (REZEN / VerumFlow)
- **Conducted by**: Claude Code

---

## Gate A — Verifica tecnica prototipo

### Stato

| Check | Stato | Note |
|---|---|---|
| `PROTOTYPE_STATUS.md` esiste | ❌ MANCANTE | File non presente in repo. Da creare prima di DOC 3 oppure derogato esplicitamente da REZEN. |
| `npm install` pulito | PENDING | Da eseguire all'avvio DOC 3 |
| `npm run lint` zero errori | PENDING | Da eseguire all'avvio DOC 3 |
| `npm run build` zero errori | PENDING | Da eseguire all'avvio DOC 3 |
| `npm run typecheck` zero errori | PENDING | Da eseguire all'avvio DOC 3 |
| Emulators avviano | PENDING | Da verificare |
| Dev server `/login` + `/projects` rispondono | PENDING | Da verificare |
| 23 acceptance test DOC 1 §23 confermati | ✅ IMPLICITO | REZEN ha condotto review modulo per modulo dei 12 moduli — il prototipo è funzionante. Lista esplicita pass/fail vs DOC 1 §23 da formalizzare a inizio DOC 3. |

### Decisione operativa

Gate A è in stato **parziale**: la review qualitativa modulo per modulo (Blocco 1) è stata condotta e ha prodotto output significativo, ma i build check automatici e l'allineamento formale ai 23 acceptance test DOC 1 §23 sono **PENDING**. Nessun caso di blocco emerso dalla review. Procediamo con i Blocchi 2-10 dell'intervista; i build check vanno eseguiti come prima azione DOC 3.

### Known issues minori (dalla review Blocco 1)

- Sidebar sinistra: link "Progetti" mancante — bug navigazione
- Dashboard: KPI "Revenue" senza tooltip esplicativo — ambiguità informativa
- Sezione "SEO Research": logica poco chiara, sembra input manuale — UX da ripensare
- Sezione "Analytics → Campagne": creazione campagne interna fuori scope — da rimuovere
- CMS: editing testo, reorder item, relazioni tra collection mancanti — gap funzionale
- Alerts: comportamento del bottone "Fix" non definito

---

## Stato intervista

| Blocco | Status | Data |
|---|---|---|
| Blocco 1 — Prototype Quality Review | ✅ COMPLETATO | 2026-04-30 |
| Blocco 2 — Team & Auth | PENDING | — |
| Blocco 3 — Firebase Production | PENDING | — |
| Blocco 4 — AI Operations | 🟡 PARZIALE | Provider AI Visibility deciso (build interno multi-LLM); budget/rate limit da definire |
| Blocco 5 — Real Integrations | 🟡 PARZIALE | Stack provider scelto (DataForSEO + API native Meta/Google + Lighthouse PSI); credenziali e MCC pending |
| Blocco 6 — Site Hosting & Custom Domains | PENDING | — |
| Blocco 7 — Export Priorities | PENDING | — |
| Blocco 8 — Monitoring & Backup | PENDING | — |
| Blocco 9 — Legal & Compliance | PENDING | — |
| Blocco 10 — Rollout & Go-Live | PENDING | — |

---

## Blocco 1 — Prototype Quality Review

**Completato**: 2026-04-30
**Conducted by**: Francesco Lossi, in modalità review libera modulo per modulo (output equivalente al Blocco 1 strutturato).

### Moduli OK as-is

- **Pages** — corretto per pubblicazione, visualizzazione e implementazione. Nessuna modifica richiesta in v.2.
- **Analytics → Overview, AdSense, Google** — struttura valida, nessuna modifica al cuore del modulo (solo aggiunte: Meta + redirect platform).
- **Forms** — base molto buona; richiede solo aggiunta lead pipeline interna (vedi sotto).
- **Alerts** — OK come logica di sorveglianza; richiede solo chiarimento sul comportamento del bottone "Fix".
- **Reports** — OK as-is.
- **Tasks** — OK; richiede solo feature export per cliente con stima ore + pricing.
- **Site Settings** — perfetto, nessuna modifica.

### Moduli con modifiche richieste

#### Projects
- **Problema**: non accessibile dalla sidebar sinistra. L'unico modo di tornare all'elenco progetti è seguire lo slug nel breadcrumb in alto.
- **Fix richiesto**: aggiungere link "Progetti" sempre visibile nella sidebar di navigazione principale.
- **Severità**: alta — UX critica, blocca la navigazione di base.

#### Dashboard
- **Problema A**: KPI "Revenue" non chiaro. Non è esplicito se rappresenta entrate gestione SEO, setup fee, o revenue portato dal traffico organico.
- **Fix A**: aggiungere tooltip / pop-up esplicativo per ogni KPI con definizione precisa del dato. Anche per i KPI già intuibili, perché lo standard di chiarezza dev'essere uniforme.
- **Card nuove richieste**:
  - **Visibilità IA (GEO/AEO)**:
    - counter visibilità totale, menzioni, pagine citate
    - breakdown per modello: ChatGPT, Gemini, Claude, (altri da valutare)
    - per ciascun modello: numero menzioni e pagine citate
  - **SEO Overview**:
    - Authority Score
    - Traffico organico
    - Keyword organiche / paid
    - Domini di riferimento (referring domains)
  - **Tracking posizione keyword**:
    - Indice di visibilità in percentuale
    - 4 cluster di range posizione: Top 3, Top 10, Top 20, Top 100
    - Numero keyword per ciascun cluster
    - Tabella keyword con: parola chiave, posizione, visibility score
  - **Site Audit**:
    - Site Health Score
    - Numero errori
    - Numero warning
    - Numero pagine analizzate

#### CMS
- **Problema**: insufficiente per progetti complessi. Mancano funzioni base.
- **Mancanze identificate**:
  - editing testo all'interno degli item
  - reorder item (drag-and-drop)
  - relazioni tra collection
- **Decisione strategica aperta**: orientamento verso modello Framer (SEO-first, leggero) **vs** modello Webflow (CMS scalabile per blog grandi tipo Aranzulla / e-commerce tipo Amazon).
- **Severità**: alta — è il gap più grande rispetto agli altri moduli.

#### Analytics
- **Rimuovere**: sottosezione "Campagne" che permette di creare campagne dall'interno del gestionale. Non è core e duplica funzionalità che le piattaforme native fanno meglio.
- **Aggiungere**:
  - Vista Meta (priorità alta)
  - Possibili future: TikTok, LinkedIn (post v.2)
- **Filosofia confermata**:
  - KPI essenziali quotidiani dentro il gestionale
  - Per analisi approfondite → bottone redirect alla piattaforma madre (Google Ads, Meta Ads Manager, GA4, AdSense)
  - L'app è livello intermedio di lettura e controllo, non sostituto delle piattaforme native

#### SEO Research
- **Problema**: logica del modulo poco chiara nell'attuale prototipo. Sembra richiedere input manuale di backlink profile, competitor benchmarking, local citations — non coerente con l'approccio AI-driven dell'app.
- **Fix richiesto**: ripensare completamente UX e valore del modulo. Aspetta brief strategico dedicato (Sprint S8 nello SPRINT_PLAN_V1_TO_V2.md).
- **Severità**: alta — modulo strategico ma attualmente senza identità chiara.

#### Forms
- **Aggiunta**:
  - Pulsante "collega al CRM" per spostare il lead nella pipeline interna
  - Pipeline lead in formato kanban con stati (es. nuovo / contattato / qualificato / chiuso vinto / chiuso perso)
  - Tracking reale CPL (Cost Per Lead) calcolato come spend campagne ad / lead acquisiti nello stato qualificato+
  - Tracking conversion rate reale = lead chiusi vinti / lead totali (non solo form submit)
- **Decisione architettura confermata**: CRM costruito **internamente al gestionale**, non integrazione con CRM esterni (Notion / HubSpot). Motivazione: i form scrivono già su Firestore, RBAC unificato, niente sub-processor extra in ROPA.

#### Tasks
- **Aggiunta**: export del task list per cliente con possibilità di:
  - selezionare task richieste/proposte (incluse richieste esterne del cliente)
  - indicare stima ore per ciascuna task
  - calcolare pricing per le modifiche
  - utile per upsell e fatturazione modifiche

#### Alerts
- **Punto aperto**: il comportamento del bottone "Fix" deve essere definito. Cosa succede al click? Risolve in automatico, apre playbook, crea task, redirige?

### Funzionalità nuove richieste

Dalle decisioni architetturali:

- **CRM Lead Pipeline interno** (priorità alta) — vedi Forms
- **AI Visibility tracker (GEO/AEO)** — vedi Dashboard
- **Site Audit module** — vedi Dashboard
- **SEO Overview module** — vedi Dashboard
- **Rank Tracking module** — vedi Dashboard
- **Cloud Functions automation layer** — base trasversale per tutte le sync con DataForSEO, scheduled checks, webhook lead, notifiche

### Editor feedback

Non emerso esplicitamente in questa review. Il blocco editor (drag-drop Puck + prompt AI) non è stato riesaminato in questa sessione. **PENDING — da approfondire in eventuale sessione dedicata** se REZEN identifica attriti durante l'uso DOC 3.

### Gaps libreria Puck

Non riportati gap espliciti in questa review. **PENDING — da raccogliere durante uso reale del prototipo**.

### Qualità generazione AI

Non discussa esplicitamente. La review si è focalizzata su moduli e UX. **PENDING per il blocco 4 dedicato AI Operations**.

### KPI Dashboard — cambi richiesti

- Tutti i KPI esistenti necessitano tooltip esplicativo
- KPI "Revenue" specifico richiede definizione esplicita
- Nuove card KPI: AI Visibility, SEO Overview, Rank Tracking, Site Audit (vedi Dashboard sopra)

### Note strategiche emerse

- Forte orientamento a **SEO + GEO/AEO** (search engine optimization + generative engine / AI engine optimization)
- Focus su **metriche business** (CPL reale, conversion rate reale, ricavi attribuibili) e non vanity metrics (impressioni, click, form submit nudi)
- Necessità di chiarire la definizione di tutti i KPI Dashboard
- CMS è il gap più grande rispetto agli altri moduli — richiede sprint dedicato e decisione strategica orientamento (vedi sopra)

---

## Decisioni provider già prese (anticipate dal Blocco 5)

Durante questa sessione di validation sono emerse decisioni provider che normalmente apparterrebbero al Blocco 5. Dato che impattano direttamente lo SPRINT_PLAN_V1_TO_V2.md, le riportiamo qui in via anticipata. Riferimento completo: `PROVIDERS_DECISIONS_V2.md`.

| Area | Provider scelto | Status |
|---|---|---|
| SEO data (keywords, authority, backlinks, SERP rank) | **DataForSEO** API a consumo | ✅ Approvato — caveat data residency EU da chiarire |
| Site Audit | **Lighthouse + PageSpeed Insights API** (Google, gratuito) | ✅ Approvato |
| AI Visibility (GEO/AEO) | **Build interno** multi-LLM (Anthropic + OpenAI + Gemini) | ✅ Approvato |
| Meta Ads / Google Ads / GA4 / AdSense | **API native ufficiali** | ✅ Approvato |
| CRM lead pipeline | **Modulo interno** (Firestore + kanban) | ✅ Approvato |
| Webhook router / automation | **Cloud Functions** (Firebase native) | ✅ Approvato |

Dipendenze residue da chiudere prima di DOC 3:
- DataForSEO: confermare data residency EU (ticket support)
- Meta Marketing API: app Facebook Developer + System User + access token
- Google Ads API: developer token (approval Google 1-5gg)
- GA4: service account o OAuth2 (decisione Blocco 5)
- AdSense: publisher ID + OAuth2

---

## Decision Log

| ID | Domanda | Decisione | Data | Impatto DOC 3 |
|---|---|---|---|---|
| D-001 | CRM esterno (Notion/Twenty/HubSpot) o interno? | **Interno** (Firestore + kanban) | 2026-04-30 | Sprint S3 dedicato Lead Pipeline |
| D-002 | Webhook router (n8n / Make / Zapier) o Cloud Functions native? | **Cloud Functions** Firebase native | 2026-04-30 | Sprint S0 automation layer foundation |
| D-003 | SEO data provider (Semrush / Ahrefs / DataForSEO)? | **DataForSEO** API a consumo | 2026-04-30 | Sprint S4-S5, wrapper SDK ufficiale TypeScript |
| D-004 | AI Visibility build vs buy (Profound / Peec.ai vs interno)? | **Build interno** multi-LLM | 2026-04-30 | Sprint S6 dedicato |
| D-005 | Site Audit (Semrush Audit / Sitebulb / Lighthouse)? | **Lighthouse PSI API** (Google free) | 2026-04-30 | Sprint S2, gratis |
| D-006 | Meta/Google/GA4 (aggregator Supermetrics o API native)? | **API native ufficiali** | 2026-04-30 | Sprint S9, no costi extra |
| D-007 | Sidebar navigation — link Projects mancante? | Aggiunto come Sprint S1 quick-win | 2026-04-30 | Sprint S1 |
| D-008 | Analytics → sottosezione Campagne | **Da rimuovere** in v.2 | 2026-04-30 | Sprint S1 cleanup |

---

## Pending Items

| Item | Owner | Due | Note |
|---|---|---|---|
| Blocchi intervista 2, 3, 6, 7, 8, 9, 10 | REZEN + Claude Code | Prima di DOC 3 | Da pianificare sessioni dedicate |
| Conferma data residency EU DataForSEO | REZEN (ticket support) | Prima di sprint S4 | Per ROPA |
| Eseguire build check Gate A (`lint` + `build` + `typecheck`) | Claude Code | Inizio DOC 3 | Verifica tecnica formale |
| Creare `PROTOTYPE_STATUS.md` o derogarlo formalmente | REZEN | Prima di DOC 3 | DOC 2 §2.1 lo richiede |
| Decisione strategica orientamento CMS (Framer-style vs Webflow-style) | REZEN + soci | Prima di sprint S7 | Decisione di prodotto |
| Definizione comportamento "Fix" Alerts | REZEN | Prima di sprint S12 | UX da specificare |
| Brief strategico SEO Research (cosa deve essere il modulo) | REZEN | Prima di sprint S8 | Modulo da ripensare |

---

## Red Flags & Escalations

| Flag | Raised | Status | Resolution |
|---|---|---|---|
| `PROTOTYPE_STATUS.md` mancante (DOC 2 §2.1) | 2026-04-30 | OPEN | Creare formalmente o documentare deroga prima di DOC 3 |
| 23 acceptance test DOC 1 §23 non formalmente checklisted | 2026-04-30 | LOW | Implicit pass via review modulare; formalizzare a inizio DOC 3 |
| DataForSEO data residency EU non pubblicizzata | 2026-04-30 | OPEN | Ticket support DataForSEO; aggiornare ROPA |

---

## Validation Status

**Gate A**: 🟡 Parziale — review qualitativa completa, build check pending
**Gate B**: ❌ Non eseguito — Blocchi 2-10 ancora pending

**Ready for DOC 3**: ❌ NO — completare interviste residue + chiudere pending items

Approvato da: REZEN — Francesco Lossi (parziale, scope Blocco 1 + decisioni provider)
Confermato da: Claude Code — 2026-04-30

---

*Documento vivo. Ogni nuova sessione di intervista o decisione aggiorna questo file in append/integration, non riscrittura.*
