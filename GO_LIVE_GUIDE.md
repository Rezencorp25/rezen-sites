# REZEN Sites — Go-Live Guide

> Procedura per passare da preview prototipo (mock data) a produzione (real data).
> Letta da chi esegue lo switch al momento del go-live.

## Principio

L'app è scritta dietro un **service-factory** unico. Tutti i componenti (dashboard, analytics, ads, SEO score) consumano dati attraverso interfacce. Oggi l'implementazione è mock; al go-live si sostituiscono le implementazioni reali — **nessun codice consumer cambia**.

## Switch master

In `.env.local` (e poi in `apphosting.yaml` per produzione) c'è una variabile:

```
NEXT_PUBLIC_DATA_MODE=mock   # default
NEXT_PUBLIC_DATA_MODE=real   # dopo go-live
```

Il file `lib/services/service-factory.ts` legge questa env e ritorna l'istanza giusta del service. **Quando passi a `real`**, occorre che ogni service reale sia stato implementato e che le credenziali necessarie siano in `.env`.

## Cosa eliminare quando si va live

### File mock (cancellabili)
```
lib/services/analytics/mock-analytics-service.ts
lib/services/ads/mock-ads-service.ts
lib/services/adsense/mock-adsense-service.ts
lib/services/seo/mock-seo-service.ts
lib/mocks/                                    ← se vuoto dopo migrazione, drop
```

### Marker grep-able nel codice
Ogni return mock è marcato con `// MOCK:` — basta `grep -r "MOCK:" lib app` per trovarli.

### Lo switch nel factory
Una volta eliminati tutti i mock, in `service-factory.ts` rimuovi il branch `mock` e lascia solo l'implementazione reale.

## Cosa serve per attivare ogni service reale

| Service | File da completare | Credenziali / API key | Scope OAuth |
|---|---|---|---|
| Analytics (GA4) | `lib/services/analytics/ga4-analytics-service.ts` | Service Account JSON o OAuth refresh token, GA4 property ID | `analytics.readonly` |
| Google Ads | `lib/services/ads/google-ads-service.ts` | Developer token + MCC customer ID + OAuth refresh token | `adwords` |
| AdSense | `lib/services/adsense/adsense-real-service.ts` | OAuth client + refresh token + publisher ID `ca-pub-*` | `adsense.readonly` |
| SEO/CWV | `lib/services/seo/pagespeed-seo-service.ts` | PageSpeed Insights API key | nessuno (API key) |
| Search Console | `lib/services/seo/search-console-service.ts` (da creare) | OAuth + property URL | `webmasters.readonly` |
| Anthropic AI | (già pronto) | `ANTHROPIC_API_KEY` in env | nessuno |

Le credenziali NON vanno mai in `.env.local` di produzione: usa **Firebase Secret Manager**:

```bash
firebase apphosting:secrets:set GA4_SERVICE_ACCOUNT_JSON --project rezen-sites-preview
firebase apphosting:secrets:grantaccess GA4_SERVICE_ACCOUNT_JSON --backend rezen-sites-preview
```

E in `apphosting.yaml`:

```yaml
env:
  - variable: GA4_SERVICE_ACCOUNT_JSON
    secret: GA4_SERVICE_ACCOUNT_JSON
```

## Ordine raccomandato di switch

Non tutti gli switch in un colpo solo — fanne uno alla volta, verifica, poi il successivo.

1. **AI agents** — già attivabile aggiungendo `ANTHROPIC_API_KEY` in env. Nessun mock da rimuovere, gli agent fanno fallback automatico a stub se la key manca.
2. **SEO/CWV** — meno rischioso (API key, no OAuth). Implementa `pagespeed-seo-service.ts`, switcha solo questo: `NEXT_PUBLIC_DATA_MODE_SEO=real`.
3. **GA4** — richiede Service Account. Implementa `ga4-analytics-service.ts`, switcha: `NEXT_PUBLIC_DATA_MODE_ANALYTICS=real`.
4. **AdSense** — OAuth flow richiede consent. Implementa `adsense-real-service.ts`, switcha: `NEXT_PUBLIC_DATA_MODE_ADSENSE=real`.
5. **Google Ads** — più complesso (developer token + MCC). Per ultimo. `NEXT_PUBLIC_DATA_MODE_ADS=real`.
6. **Master switch** — quando tutti sono real, setta `NEXT_PUBLIC_DATA_MODE=real` e rimuovi i flag granulari.

> **Nota**: il design del service-factory supporta switch granulari per dominio (analytics/ads/adsense/seo). Vedi `service-factory.ts` per i flag specifici.

## Pre-flight checklist (prima del go-live)

- [ ] Tutti i 5 service reali implementati e testati in staging
- [ ] Service account / OAuth refresh token salvati in Secret Manager (mai in repo)
- [ ] Budget alert Google Cloud impostati (CHF 50/100/200/mese)
- [ ] PageSpeed quota verificata (default 25k req/giorno)
- [ ] GA4 quota verificata (default 100k req/giorno)
- [ ] Test end-to-end con un singolo progetto (es. `verumflow-ch`) prima di switch globale
- [ ] Backup snapshot Firestore (`gcloud firestore export`) prima dello switch
- [ ] Plan di rollback: se qualcosa rompe, `NEXT_PUBLIC_DATA_MODE=mock` ripristina tutto in 1 redeploy

## Cose che NON sono mock e che continueranno a funzionare uguale

Queste non hanno service-factory perché non sono "data sources" ma logica applicativa:

- Editor Puck (drag-drop pagine)
- CMS collections (struttura)
- Versioning + rollback
- Export HTML/React/Next.js ZIP
- Schema.org JSON-LD generator
- robots.txt / sitemap.xml builder
- Form builder (struttura dei form)

Solo i **dati che arrivano da fuori** (analytics, ads, performance, search console) passano dal factory.

## Domande aperte da chiarire prima del go-live

Riprendere dal `VALIDATION_REPORT.md` (DOC 2) le decisioni su:

- Strategia siti clienti (multi-site hosting vs progetto FB per cliente)
- Auth method (email+password / SSO Google / magic link)
- Scenario integrazioni (REZEN account centrale vs OAuth per cliente)
- Budget AI mensile target
- Privacy policy template + DPA REZEN-cliente

## Fine

Quando tutti gli switch sono real, lanci ultimo deploy, monitori 48h, e l'app è in produzione. Aggiorna questo file con le note del go-live (data, chi lo ha fatto, anomalie incontrate).
