/**
 * S7.14 sub-A — DNS Provider abstraction.
 *
 * Astrazione minima sopra le API DNS dei registrar (GoDaddy oggi, Cloudflare/
 * Namecheap in futuro). I metodi sono i soli che servono al flow:
 *   listDomains      → popola la dropdown in UI quando l'utente apre il
 *                      modal "Collega dominio"
 *   getRecords       → leggere lo stato attuale (debug, idempotenza)
 *   upsertRecord     → creare TXT di verifica + A/CNAME di routing
 *   deleteRecord     → disconnettere un dominio rimuovendo i record nostri
 *
 * `name` è SEMPRE relativo al dominio (es. "_rezen-verify" non
 * "_rezen-verify.example.com"). Implementazioni convertono in absolute se
 * il provider lo richiede.
 */

export type DnsRecordType = "TXT" | "A" | "AAAA" | "CNAME";

export type DnsRecord = {
  type: DnsRecordType;
  /** Subdomain relativo al dominio root (es. "@" per apex, "www", "_rezen-verify"). */
  name: string;
  /** Per TXT: contenuto stringa. Per A: IPv4. Per CNAME: target hostname. */
  value: string;
  ttl: number;
};

export type DomainSummary = {
  /** Apex domain (es. "example.com"). */
  name: string;
  /** Stato registrazione lato provider (ACTIVE, EXPIRED, ecc.). Stringa libera. */
  status: string;
  /** ISO date di scadenza, se nota. */
  expiresAt?: string;
};

export interface DnsProvider {
  /** ID provider (deve corrispondere a IntegrationProviderId). */
  readonly id: "godaddy" | "cloudflare" | "namecheap";

  /** Lista domini posseduti dall'account autenticato. */
  listDomains(): Promise<DomainSummary[]>;

  /** Records DNS attualmente impostati per `domain`. */
  getRecords(domain: string): Promise<DnsRecord[]>;

  /**
   * Crea o aggiorna un record. Idempotente: se esiste già (stesso type+name+
   * value) è no-op. Se esiste con value diverso, overwrite.
   */
  upsertRecord(
    domain: string,
    record: { type: DnsRecordType; name: string; value: string; ttl?: number },
  ): Promise<void>;

  /** Rimuove un record. Idempotente: se non esiste è no-op. */
  deleteRecord(
    domain: string,
    selector: { type: DnsRecordType; name: string },
  ): Promise<void>;
}

export type DnsProviderCredentials =
  | { provider: "godaddy"; apiKey: string; apiSecret: string }
  | { provider: "cloudflare"; apiToken: string }
  | { provider: "namecheap"; apiUser: string; apiKey: string };

export class DnsProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly provider?: string,
  ) {
    super(message);
    this.name = "DnsProviderError";
  }
}
