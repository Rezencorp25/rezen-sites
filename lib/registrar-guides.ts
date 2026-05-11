/**
 * S7.14 — Step-by-step DNS instructions per registrar.
 *
 * Quando l'utente è in flow "Manual DNS" e deve copy/paste i record nel
 * pannello del suo registrar, mostriamo istruzioni specifiche. Lista
 * registrar coperti scelta su base "share di mercato italiano + europeo".
 *
 * Ogni guida è una lista di step-text + opzionale URL diretto al pannello
 * DNS del registrar (deep-link evita all'utente di navigare il dashboard).
 */

export type RegistrarSlug =
  | "godaddy"
  | "cloudflare"
  | "namecheap"
  | "aruba"
  | "register-it"
  | "ovh"
  | "generic";

export type RegistrarStep = {
  text: string;
  /** Hint visuale (es. "nel campo 'Type' scegli TXT"). Markdown-style bold ok. */
  hint?: string;
};

export type RegistrarGuide = {
  slug: RegistrarSlug;
  label: string;
  /** Deep-link al pannello DNS (target blank). */
  dnsPanelUrl?: string;
  /** Note di field mapping: come il registrar chiama i campi DNS standard. */
  fieldMapping: {
    name: string; // es. "Host", "Name", "Hostname"
    value: string; // es. "Points to", "Value", "Target"
    ttl?: string; // es. "TTL", "Custom TTL"
  };
  /** Istruzioni numerate per aggiungere un nuovo record. */
  steps: RegistrarStep[];
  /** Quirks: cose che l'utente deve sapere prima di iniziare. */
  warnings?: string[];
};

export const REGISTRAR_GUIDES: Record<RegistrarSlug, RegistrarGuide> = {
  godaddy: {
    slug: "godaddy",
    label: "GoDaddy",
    dnsPanelUrl: "https://dcc.godaddy.com/control/portfolio",
    fieldMapping: {
      name: "Name (Host)",
      value: "Value (Data)",
      ttl: "TTL",
    },
    steps: [
      {
        text: "Apri il pannello DNS di GoDaddy",
        hint: "dcc.godaddy.com/control/portfolio → click sul dominio → 'DNS' nel menu",
      },
      {
        text: "Click su 'Aggiungi nuovo record' (o 'Add' in inglese)",
      },
      {
        text: "Per il TXT: scegli **Type = TXT**, poi incolla i valori",
        hint:
          "GoDaddy mostra il nome del dominio dopo il campo Name — non includere `.verumflow.com`, solo la parte sinistra (es. `_rezen-verify.preview` o `_rezen-verify`)",
      },
      {
        text:
          "Per A/CNAME: stessa procedura, scegli Type = A oppure CNAME a seconda di cosa ti abbiamo mostrato",
      },
      {
        text:
          "TTL: lascia 'Predefinito (1 ora)' oppure imposta 600 secondi se vuoi propagazione più veloce",
      },
      {
        text: "Salva. La propagazione richiede 30s-5min tipicamente",
      },
    ],
    warnings: [
      "Se il dominio è apex (es. `verumflow.com` senza sottodominio), il campo Name si scrive `@` su GoDaddy",
      "Se aggiungi un CNAME su `@` o un sottodominio già occupato, GoDaddy chiede di rimuovere il record precedente",
    ],
  },

  cloudflare: {
    slug: "cloudflare",
    label: "Cloudflare (Manual)",
    dnsPanelUrl: "https://dash.cloudflare.com",
    fieldMapping: {
      name: "Name",
      value: "IPv4 address / Target / Content",
      ttl: "TTL (Proxy disabilitato consigliato)",
    },
    steps: [
      {
        text: "Apri dash.cloudflare.com → click sul dominio",
      },
      {
        text: "Sidebar → 'DNS' → 'Records'",
      },
      {
        text: "Click 'Add record'",
      },
      {
        text:
          "Scegli Type, copia Name e Value. **IMPORTANTE: disabilita il toggle 'Proxy status' (nuvola grigia non arancione)** — altrimenti il cert non si emette",
      },
      {
        text: "Salva. Cloudflare propaga in 1-2 min",
      },
    ],
    warnings: [
      "Il modo automatico (con API token su Integrazioni → Cloudflare) elimina questa procedura: Cloudflare crea i record da solo. Vedi guida Integrazioni.",
    ],
  },

  namecheap: {
    slug: "namecheap",
    label: "Namecheap",
    dnsPanelUrl: "https://ap.www.namecheap.com/Domains/DomainControlPanel/",
    fieldMapping: {
      name: "Host",
      value: "Value",
      ttl: "TTL",
    },
    steps: [
      {
        text:
          "Apri Namecheap → Account → Domain List → click 'Manage' sul dominio",
      },
      {
        text: "Tab 'Advanced DNS'",
      },
      {
        text: "Sezione 'Host Records' → click 'Add New Record'",
      },
      {
        text:
          "Scegli Type, incolla Host (parte sinistra del dominio) e Value",
        hint:
          "Per apex usa `@` come Host. Per sottodominio usa solo la parte sinistra (es. `preview` non `preview.verumflow.com`)",
      },
      {
        text: "TTL: 'Automatic' o '5 min' per propagazione veloce",
      },
      {
        text: "Salva (icona spunta verde)",
      },
    ],
  },

  aruba: {
    slug: "aruba",
    label: "Aruba",
    dnsPanelUrl: "https://hosting.aruba.it/",
    fieldMapping: {
      name: "Nome host",
      value: "Valore",
      ttl: "TTL",
    },
    steps: [
      {
        text: "Aruba Hosting → 'Pannello DNS' → 'Gestione DNS' del dominio",
      },
      {
        text: "Click 'Aggiungi record'",
      },
      {
        text: "Scegli Tipo, copia Nome host e Valore",
      },
      {
        text: "Salva la configurazione (può richiedere conferma email)",
      },
    ],
    warnings: [
      "Aruba storicamente lento sulla propagazione (10-30 min). Sii paziente con il polling",
    ],
  },

  "register-it": {
    slug: "register-it",
    label: "Register.it",
    dnsPanelUrl: "https://controlpanel.register.it/login.html",
    fieldMapping: {
      name: "Nome",
      value: "Valore",
      ttl: "TTL",
    },
    steps: [
      {
        text:
          "Pannello Register.it → 'I miei domini' → click sul dominio → 'DNS'",
      },
      {
        text: "Sezione 'Zona DNS' → 'Aggiungi record'",
      },
      {
        text: "Scegli tipo (TXT/A/CNAME), incolla Nome e Valore",
      },
      {
        text: "Salva la zona DNS",
      },
    ],
  },

  ovh: {
    slug: "ovh",
    label: "OVH",
    dnsPanelUrl: "https://www.ovh.com/manager/",
    fieldMapping: {
      name: "Sotto-dominio",
      value: "Target",
      ttl: "TTL (in secondi)",
    },
    steps: [
      {
        text:
          "OVH Manager → 'Web Cloud' → 'Domini' → click sul dominio → tab 'Zona DNS'",
      },
      {
        text: "'Aggiungi una entry'",
      },
      {
        text:
          "Scegli il tipo, compila Sotto-dominio (parte sinistra) e Target",
      },
      {
        text: "Conferma. OVH genera la nuova versione della zona DNS",
      },
    ],
  },

  generic: {
    slug: "generic",
    label: "Altro registrar",
    fieldMapping: {
      name: "Name / Host / Hostname",
      value: "Value / Data / Points to / Target",
      ttl: "TTL",
    },
    steps: [
      {
        text:
          "Accedi al pannello del tuo registrar e cerca la sezione 'DNS', 'DNS Records' o 'Zona DNS'",
      },
      {
        text: "Aggiungi un nuovo record (di solito un bottone '+', 'Add' o 'Aggiungi')",
      },
      {
        text:
          "Seleziona il tipo (TXT / A / CNAME) che ti mostriamo, e copia Name + Value",
        hint:
          "La parte 'Name' è solo la parte sinistra del dominio (es. `_rezen-verify.preview` non `_rezen-verify.preview.verumflow.com`). Per apex usa `@`",
      },
      {
        text: "TTL: 600 secondi (10 minuti) è un buon compromesso",
      },
      {
        text:
          "Salva. La propagazione DNS richiede tipicamente 30s-5min, raramente fino a 30 min",
      },
    ],
    warnings: [
      "Se il tuo registrar non è in lista, scrivici e lo aggiungiamo con istruzioni dedicate",
    ],
  },
};

export const REGISTRAR_SLUG_ORDER: RegistrarSlug[] = [
  "godaddy",
  "namecheap",
  "aruba",
  "register-it",
  "ovh",
  "cloudflare",
  "generic",
];
