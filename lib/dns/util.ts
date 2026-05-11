import { DnsProviderError } from "./types";

/**
 * Split di "verify.example.com" → { subdomain: "verify", apex: "example.com" }.
 * Per "example.com" ritorna { subdomain: "@", apex: "example.com" }.
 *
 * Per TLD multi-parte comuni (co.uk, com.au, ecc.) la lista è esplicita.
 * Per casi edge custom passa esplicitamente apex+subdomain a monte.
 */
export function splitDomain(fqdn: string): { subdomain: string; apex: string } {
  const parts = fqdn.toLowerCase().trim().split(".");
  if (parts.length < 2) {
    throw new DnsProviderError(`Hostname non valido: ${fqdn}`);
  }
  if (parts.length === 2) {
    return { subdomain: "@", apex: fqdn };
  }
  const COMPOUND_TLDS = new Set([
    "co.uk", "ac.uk", "org.uk", "gov.uk",
    "com.au", "net.au", "org.au",
    "co.nz", "co.jp",
  ]);
  const last2 = parts.slice(-2).join(".");
  const last3 = parts.slice(-3).join(".");
  if (parts.length >= 3 && COMPOUND_TLDS.has(last2)) {
    return {
      subdomain: parts.slice(0, -3).join(".") || "@",
      apex: last3,
    };
  }
  return {
    subdomain: parts.slice(0, -2).join("."),
    apex: last2,
  };
}
