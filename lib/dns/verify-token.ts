import { randomBytes } from "node:crypto";

/**
 * S7.14 sub-B — Token di verifica proprietà dominio.
 *
 * Lo embeddiamo in un TXT record `_rezen-verify.<domain>` e poi lo
 * confrontiamo con `dns.resolveTxt` nella fase verify. 32 byte hex (256 bit)
 * sono abbondantemente unguessable per il use case e standard come pratica
 * (Vercel/Firebase usano range simile).
 *
 * Prefix `rzn-` serve a:
 *   - distinguere visivamente il TXT nostro da altri TXT sul dominio
 *   - permettere a una futura cleanup routine di trovare i nostri record
 *     da revocare quando l'utente disconnette il dominio
 */
const TOKEN_PREFIX = "rzn-";

export function generateVerifyToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("hex");
}

export function isOurToken(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX) && value.length === TOKEN_PREFIX.length + 64;
}

/** Hostname per il TXT di verifica. */
export const VERIFY_TXT_NAME = "_rezen-verify";
