# REZEN Sites — powered by VerumFlow

Gestionale interno REZEN per generare, modificare e orchestrare siti web con AI
multi-agente. Stack: Next.js 16 + TypeScript + Tailwind 4 + Firebase + Claude API.

Questo repository implementa **DOC 1 — Prototype Build**.

---

## Requisiti

- Node 20+ (testato su Node 24)
- npm 10+
- Firebase CLI 15+ (già in devDependencies)

## Avvio rapido

```bash
# 1. Copia l'esempio di env (già presente come .env.local di default)
cp .env.local.example .env.local

# 2. In un terminale: avvia gli emulatori Firebase (auth + firestore)
npm run emulators

# 3. In un altro terminale, la prima volta, popola i dati mock
npm run seed

# 4. In un terzo terminale: avvia Next.js
npm run dev
```

Apri http://localhost:3000 e accedi con le credenziali pre-compilate:

| Campo    | Valore           |
| -------- | ---------------- |
| Email    | demo@rezen.dev   |
| Password | rezen2026        |

Firebase Emulator UI: http://127.0.0.1:4000

---

## Stato del prototipo (DOC 1 — Fase 1 completata)

La **Fase 1 — Fondazioni** è completa:

- ✅ Design system Luminous Engine (Tailwind 4 tokens custom + Inter + gradient)
- ✅ App shell (sidebar 240px + header glass + project switcher)
- ✅ Login + proxy auth (Next 16 proxy.ts, formerly middleware)
- ✅ Firebase emulator + firestore rules (aperte, prototipo)
- ✅ Types TS completi + schemi Zod
- ✅ Seed script (3 progetti + 15 pagine + analytics + forms + alerts + CMS)
- ✅ Routing skeleton dei 12 moduli con placeholder
- ✅ Projects list pagina navigabile con card

Fasi successive (F2-F5) verranno implementate in iterazioni separate.

## Script disponibili

| Script              | Descrizione                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Avvia Next.js su :3000                        |
| `npm run emulators` | Avvia Firebase emulators (:4000 UI)           |
| `npm run seed`      | Popola emulator con dati mock                 |
| `npm run build`     | Build produzione                              |
| `npm run typecheck` | Controllo TypeScript                          |
| `npm run lint`      | ESLint                                        |
| `npm run test`      | Vitest unit                                   |
| `npm run test:e2e`  | Playwright smoke                              |

## Note importanti

- **Rules Firestore aperte** per il prototipo. Saranno riscritte in DOC 3.
- **ANTHROPIC_API_KEY è vuota**: le chiamate AI saranno stubbed in F4 per permettere
  lo sviluppo locale senza key. Settala in `.env.local` quando pronto.
- **Firebase Service Account vuoto**: deploy reale verrà abilitato in DOC 3.
- **Next.js 16** ha rinominato `middleware.ts` → `proxy.ts` e richiede `await` su
  `params` e `searchParams` nei page components.

## Riferimenti

- `../01_PROTOTYPE_BUILD.md` — documento operativo DOC 1
- `../extracted/stitch_verumflow_seo_command/verumflow_onyx/DESIGN.md` — design system
- Screen di riferimento: `../extracted/stitch_verumflow_seo_command/*/screen.png`
